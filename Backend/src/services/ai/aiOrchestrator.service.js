import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { config } from "../../config/config.js";
import { uploadFile } from "../imageKit.service.js";

// Initialize AI SDK Clients safely
let geminiClient = null;
if (config.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  } catch (err) {
    console.warn("⚠️ [AI Orchestrator] Gemini initialization failed:", err.message);
  }
}

let groqClient = null;
if (config.GROQ_API_KEY) {
  try {
    groqClient = new Groq({ apiKey: config.GROQ_API_KEY });
  } catch (err) {
    console.warn("⚠️ [AI Orchestrator] Groq initialization failed:", err.message);
  }
}

let mistralClient = null;
if (config.MISTRAL_API_KEY) {
  try {
    mistralClient = new OpenAI({
      apiKey: config.MISTRAL_API_KEY,
      baseURL: "https://api.mistral.ai/v1",
    });
  } catch (err) {
    console.warn("⚠️ [AI Orchestrator] Mistral initialization failed:", err.message);
  }
}

let openRouterClient = null;
if (config.OPENROUTER_API_KEY) {
  try {
    openRouterClient = new OpenAI({
      apiKey: config.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
  } catch (err) {
    console.warn("⚠️ [AI Orchestrator] OpenRouter initialization failed:", err.message);
  }
}

/**
 * Multi-Model Fallback Manager
 * Tries Gemini -> Groq -> Mistral -> OpenRouter sequentially
 */
class AIOrchestrator {
  constructor() {
    this.modelsOrder = ["gemini", "groq", "mistral", "openrouter"];
  }

  /**
   * Generates a streaming response for the conversation with tool execution and multi-model fallback.
   *
   * @param {Object} params
   * @param {Array} params.messages - History of messages [{role: 'user'|'assistant'|'system', content: ''}]
   * @param {string} params.systemPrompt - Dynamic system prompt containing instructions and product catalog context
   * @param {Array} params.images - Optional uploaded images [{url, mimeType}]
   * @param {Function} onChunk - Callback for streaming text chunks: (chunk: string) => void
   * @returns {Promise<{ fullText: string, modelUsed: string }>}
   */
  async streamChat({ messages = [], systemPrompt = "", images = [] }, onChunk = () => {}) {
    // If images are provided, prefer Gemini or Mistral vision models
    const hasImages = images && images.length > 0;
    const providerPriority = hasImages
      ? ["gemini", "mistral", "openrouter", "groq"]
      : ["gemini", "groq", "mistral", "openrouter"];

    let lastError = null;

    for (const provider of providerPriority) {
      try {
        if (provider === "gemini" && geminiClient) {
          const result = await this._streamGemini({ messages, systemPrompt, images }, onChunk);
          if (result) return { ...result, modelUsed: "gemini-2.5-flash" };
        }

        if (provider === "groq" && groqClient && !hasImages) {
          const result = await this._streamGroq({ messages, systemPrompt }, onChunk);
          if (result) return { ...result, modelUsed: "groq/llama-3.3-70b-versatile" };
        }

        if (provider === "mistral" && mistralClient) {
          const result = await this._streamMistral({ messages, systemPrompt }, onChunk);
          if (result) return { ...result, modelUsed: "mistral-small-latest" };
        }

        if (provider === "openrouter" && openRouterClient) {
          const result = await this._streamOpenRouter({ messages, systemPrompt }, onChunk);
          if (result) return { ...result, modelUsed: "openrouter/deepseek-chat" };
        }
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ [AI Orchestrator] Provider ${provider} failed (falling back to next):`, err.message || err);
      }
    }

    // If all providers failed or no API keys configured, return a graceful fallback response
    const fallbackText =
      "I am your ScapeGoat AI Fashion & Shopping Assistant! I found relevant matching items from our catalog below.";
    onChunk(fallbackText);
    return {
      fullText: fallbackText,
      modelUsed: "fallback-static",
      error: lastError?.message,
    };
  }

  /**
   * Internal: Stream Gemini 2.5 Flash
   */
  async _streamGemini({ messages, systemPrompt, images }, onChunk) {
    if (!geminiClient) return null;
    const model = geminiClient.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const contents = [];

    for (const msg of messages) {
      const parts = [{ text: msg.content || "" }];

      // Attach images to user turns if any
      if (msg.role === "user" && images && images.length > 0) {
        for (const img of images) {
          if (img.base64) {
            parts.push({
              inlineData: {
                data: img.base64.replace(/^data:image\/\w+;base64,/, ""),
                mimeType: img.mimeType || "image/jpeg",
              },
            });
          }
        }
      }

      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      });
    }

    const responseStream = await model.generateContentStream({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    let fullText = "";
    for await (const chunk of responseStream.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    return { fullText };
  }

  /**
   * Internal: Stream Groq Llama 3.3 70B
   */
  async _streamGroq({ messages, systemPrompt }, onChunk) {
    if (!groqClient) return null;

    const formattedMessages = [{ role: "system", content: systemPrompt }];
    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content || "",
      });
    }

    const completion = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    let fullText = "";
    for await (const chunk of completion) {
      const chunkText = chunk.choices[0]?.delta?.content || "";
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    return { fullText };
  }

  /**
   * Internal: Stream Mistral
   */
  async _streamMistral({ messages, systemPrompt }, onChunk) {
    if (!mistralClient) return null;

    const formattedMessages = [{ role: "system", content: systemPrompt }];
    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content || "",
      });
    }

    const completion = await mistralClient.chat.completions.create({
      model: "mistral-small-latest",
      messages: formattedMessages,
      temperature: 0.7,
      stream: true,
    });

    let fullText = "";
    for await (const chunk of completion) {
      const chunkText = chunk.choices[0]?.delta?.content || "";
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    return { fullText };
  }

  /**
   * Internal: Stream OpenRouter
   */
  async _streamOpenRouter({ messages, systemPrompt }, onChunk) {
    if (!openRouterClient) return null;

    const formattedMessages = [{ role: "system", content: systemPrompt }];
    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content || "",
      });
    }

    const completion = await openRouterClient.chat.completions.create({
      model: "google/gemini-2.0-flash-exp:free",
      messages: formattedMessages,
      temperature: 0.7,
      stream: true,
    });

    let fullText = "";
    for await (const chunk of completion) {
      const chunkText = chunk.choices[0]?.delta?.content || "";
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    return { fullText };
  }

}

export const aiOrchestrator = new AIOrchestrator();
export default aiOrchestrator;
