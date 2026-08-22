import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import OutfitBundleCard from "./OutfitBundleCard.jsx";
import SetupBundleCard from "./SetupBundleCard.jsx";
import { AIStreamingStatus } from "./AISkeletonLoader.jsx";

/**
 * Custom ReactMarkdown components for Perplexity / Editorial Stylist Typography
 */
const markdownComponents = {
  h1: ({ children }) => (
    <h3 className="text-base font-black uppercase tracking-tight text-foreground mt-3 mb-1 border-b border-border-theme/40 pb-1">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h4 className="text-sm font-black uppercase tracking-wide text-foreground mt-2.5 mb-1">
      {children}
    </h4>
  ),
  h3: ({ children }) => (
    <h5 className="text-xs font-black uppercase tracking-wider text-accent mt-2 mb-1 flex items-center gap-1.5 border-b border-border-theme/30 pb-0.5">
      <span>{children}</span>
    </h5>
  ),
  h4: ({ children }) => (
    <h6 className="text-xs font-black uppercase tracking-wider text-foreground/90 mt-1.5 mb-0.5">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="text-xs leading-relaxed text-foreground/80 my-1 font-medium">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-accent font-semibold not-italic">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 my-2 pl-1 list-none">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 my-2 pl-4 list-decimal marker:text-accent marker:font-bold text-xs">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90">
      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="p-3 my-2 rounded-2xl bg-accent/10 border-l-2 border-accent text-xs font-medium text-foreground/90 italic">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded bg-background border border-border-theme font-mono text-[11px] text-accent">
        {children}
      </code>
    ) : (
      <pre className="p-3 my-2 rounded-2xl bg-background border border-border-theme font-mono text-xs text-foreground overflow-x-auto">
        <code>{children}</code>
      </pre>
    ),
  a: ({ href, children }) => (
    <Link
      to={href || "#"}
      className="text-accent underline font-semibold hover:opacity-80 transition"
    >
      {children}
    </Link>
  ),
};

const AIChatMessage = ({ message, isStreaming = false, onAddToCart, onAddToWishlist }) => {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);

  // ── Render User Turn ────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="flex justify-end my-3">
        <div className="max-w-[85%] sm:max-w-[70%] space-y-2">
          {/* Attached Images */}
          {message.images && message.images.length > 0 && (
            <div className="flex justify-end gap-2 flex-wrap">
              {message.images.map((img, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-2xl overflow-hidden border border-border-theme bg-surface shadow-md"
                >
                  <img src={img.url} alt="Upload" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Text Bubble */}
          {message.content && (
            <div className="p-4 rounded-3xl rounded-tr-sm bg-accent text-accent-content text-xs font-semibold leading-relaxed shadow-lg shadow-accent/15">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render Assistant Turn (Perplexity / Editorial Stylist Style) ────────────
  const hasBundles = message.bundles && message.bundles.length > 0;
  const hasProducts = message.products && message.products.length > 0;
  const hasSources = message.sources && message.sources.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 my-4 max-w-[95%] sm:max-w-[90%]"
    >
      {/* AI Bot Avatar */}
      <div className="w-8 h-8 rounded-xl bg-accent text-accent-content flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-accent/20 mt-1">
        SG
      </div>

      <div className="flex-1 space-y-4 min-w-0">
        {/* ── Dynamic Live Streaming Status Bar ── */}
        {isStreaming && (
          <AIStreamingStatus />
        )}

        {/* ── Perplexity-Style Sources Chips ── */}
        {hasSources && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/60 hover:text-accent transition cursor-pointer"
            >
              <i className="ri-links-line text-xs" />
              <span>{message.sources.length} Catalog Sources</span>
              <i className={showSources ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
            </button>

            {showSources && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {message.sources.map((src, idx) => (
                  <Link
                    key={idx}
                    to={src.url || "#"}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-background/80 border border-border-theme/80 hover:border-accent text-[10px] font-semibold text-foreground/80 hover:text-accent shrink-0 transition"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-accent/20 text-accent flex items-center justify-center font-mono text-[9px] font-black">
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[120px]">{src.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Assistant ReactMarkdown Formatted Response Bubble ── */}
        {message.content ? (
          <div className="p-4 sm:p-5 rounded-3xl rounded-tl-sm bg-surface border border-border-theme/80 text-foreground text-xs leading-relaxed shadow-sm space-y-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : isStreaming ? (
          <div className="p-4 sm:p-5 rounded-3xl rounded-tl-sm bg-surface border border-border-theme/80 text-foreground text-xs leading-relaxed shadow-sm space-y-2">
            <div className="space-y-2 max-w-md">
              <div className="h-3.5 bg-border-theme/40 rounded-full w-5/6 animate-pulse" />
              <div className="h-3.5 bg-border-theme/40 rounded-full w-4/6 animate-pulse" />
              <div className="h-3.5 bg-border-theme/40 rounded-full w-3/6 animate-pulse" />
            </div>
          </div>
        ) : null}

        {/* ── Multi-Tier Outfit / Tech Setup Bundles ── */}
        {hasBundles && (
          <div className="space-y-3 pt-1">
            {message.bundles.map((bundle, bIdx) => (
              bundle.type === "setup" ? (
                <SetupBundleCard
                  key={bundle.bundleId || bIdx}
                  bundle={bundle}
                  onAddToCart={onAddToCart}
                  onAddToWishlist={onAddToWishlist}
                />
              ) : (
                <OutfitBundleCard
                  key={bundle.bundleId || bIdx}
                  bundle={bundle}
                  onAddToCart={onAddToCart}
                  onAddToWishlist={onAddToWishlist}
                />
              )
            ))}
          </div>
        )}

        {/* ── Standalone Recommended Products Grid ── */}
        {hasProducts && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block">
              Recommended Catalog Pieces
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {message.products.map((prod) => {
                if (!prod || !prod._id) return null;
                const price = prod.sellingPrice?.amount || prod.maxPrice?.amount || 0;
                const img = prod.images?.[0]?.url || "";

                return (
                  <Link
                    key={prod._id}
                    to={`/product/${prod._id}`}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface border border-border-theme/80 hover:border-accent transition group"
                  >
                    <div className="w-11 h-13 rounded-xl overflow-hidden bg-background border border-border-theme shrink-0">
                      {img ? (
                        <img src={img} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/20 text-xs">
                          <i className="ri-image-line" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-accent transition">
                        {prod.title}
                      </p>
                      <p className="text-xs font-mono font-black text-foreground">
                        ₹{price.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Model & Provider Badge (Hidden for fallback-static) ── */}
        {message.modelUsed && message.modelUsed !== "fallback-static" && (
          <div className="text-[10px] font-mono text-foreground/40 flex items-center gap-1.5 pl-1">
            <i className="ri-sparkling-fill text-accent text-xs" />
            <span>Generated by {message.modelUsed}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AIChatMessage;
