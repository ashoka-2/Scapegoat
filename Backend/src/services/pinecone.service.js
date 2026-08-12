import { Pinecone } from "@pinecone-database/pinecone";

// ── Pinecone vector-store service ────────────────────────────────────────────
// Voyage (multimodal-3.5, 1024-dim) text + image embeddings live in TWO
// Pinecone serverless indexes (kept separate for search symmetry):
//   - PINECONE_TEXT_INDEX  (default "scapegoat-voyage-text",  1024d, cosine)
//   - PINECONE_IMAGE_INDEX (default "scapegoat-voyage-image", 1024d, cosine)
// The old 384d MiniLM / 512d CLIP indexes are NOT touched — Voyage vectors
// must never mix with other models' vectors.
//
// Query contract: queryTextVectors/queryImageVectors return
//   { ok: true,  matches: [...] }  → Pinecone answered (even with 0 matches —
//                                    callers must NOT fall back on empty)
//   { ok: false, matches: [] }     → Pinecone unavailable/error/quota — the
//                                    caller falls back to MongoDB Vector Search
// Upsert failures return false — the MongoDB embedding is kept and the
// scheduler retries the Pinecone sync.

export const EMBEDDING_DIM = parseInt(process.env.VOYAGE_EMBEDDING_DIM || "1024", 10);
const TEXT_DIM = EMBEDDING_DIM;
const IMAGE_DIM = EMBEDDING_DIM;

const TEXT_INDEX = process.env.PINECONE_TEXT_INDEX || "scapegoat-voyage-text";
const IMAGE_INDEX = process.env.PINECONE_IMAGE_INDEX || "scapegoat-voyage-image";
const CLOUD = process.env.PINECONE_CLOUD || "aws";
const REGION = process.env.PINECONE_REGION || "us-east-1";

let client = null;
let indexesEnsured = false;
let ensurePromise = null;

export const pineconeReady = () => !!client && indexesEnsured;

export function getPineconeClient() {
  if (!process.env.PINECONE_API_KEY) return null;
  if (!client) {
    client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return client;
}

/**
 * Creates both indexes (serverless) if they do not exist and waits until they
 * are ready. Idempotent + cached. Returns true when usable.
 */
export async function ensurePineconeIndexes() {
  const pc = getPineconeClient();
  if (!pc) return false;
  if (indexesEnsured) return true;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    try {
      const { indexes = [] } = await pc.listIndexes();
      const names = new Set(indexes.map((i) => i.name));

      for (const [name, dim] of [
        [TEXT_INDEX, TEXT_DIM],
        [IMAGE_INDEX, IMAGE_DIM],
      ]) {
        if (!names.has(name)) {
          await pc.createIndex({
            name,
            dimension: dim,
            metric: "cosine",
            spec: { serverless: { cloud: CLOUD, region: REGION } },
          });
          console.log(`[Pinecone] created index "${name}" (${dim}d cosine, ${CLOUD}/${REGION})`);
        }
      }

      // Wait until both indexes report ready (serverless usually < 30s)
      for (let attempt = 0; attempt < 20; attempt++) {
        const descriptions = await Promise.all([
          pc.describeIndex(TEXT_INDEX),
          pc.describeIndex(IMAGE_INDEX),
        ]);
        if (descriptions.every((d) => d.status?.ready)) {
          indexesEnsured = true;
          console.log("[Pinecone] indexes ready:", TEXT_INDEX, "+", IMAGE_INDEX);
          return true;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      console.warn("[Pinecone] indexes did not become ready in time");
      return false;
    } catch (err) {
      console.warn("[Pinecone] ensurePineconeIndexes failed:", err.message);
      return false;
    } finally {
      ensurePromise = null;
    }
  })();
  return ensurePromise;
}

// ── Upserts ──────────────────────────────────────────────────────────────────

const chunk = (arr, size = 100) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export async function upsertTextVectors(entries) {
  if (!pineconeReady() || !entries?.length) return false;
  try {
    const idx = client.index(TEXT_INDEX);
    for (const batch of chunk(entries)) {
      await idx.upsert({ records: batch });
    }
    return true;
  } catch (err) {
    console.warn("[Pinecone] text upsert failed:", err.message);
    return false;
  }
}

export async function upsertImageVectors(entries) {
  if (!pineconeReady() || !entries?.length) return false;
  try {
    const idx = client.index(IMAGE_INDEX);
    for (const batch of chunk(entries)) {
      await idx.upsert({ records: batch });
    }
    return true;
  } catch (err) {
    console.warn("[Pinecone] image upsert failed:", err.message);
    return false;
  }
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function queryTextVectors(vector, topK = 60) {
  if (!pineconeReady() || !vector?.length) return { ok: false, matches: [] };
  try {
    const res = await client.index(TEXT_INDEX).query({
      vector,
      topK,
      includeMetadata: true,
    });
    return {
      ok: true,
      matches: (res.matches || []).map((m) => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata || {},
      })),
    };
  } catch (err) {
    console.warn("[Pinecone] text query failed:", err.message);
    return { ok: false, matches: [] };
  }
}

export async function queryImageVectors(vector, topK = 60) {
  if (!pineconeReady() || !vector?.length) return { ok: false, matches: [] };
  try {
    const res = await client.index(IMAGE_INDEX).query({
      vector,
      topK,
      includeMetadata: true,
    });
    return {
      ok: true,
      matches: (res.matches || []).map((m) => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata || {},
      })),
    };
  } catch (err) {
    console.warn("[Pinecone] image query failed:", err.message);
    return { ok: false, matches: [] };
  }
}

// ── Sync / delete ────────────────────────────────────────────────────────────

/**
 * Upserts ALL of a product's vectors (1 text + every main/variant image) from
 * the in-memory Mongoose doc into Pinecone. Call after embeddings are
 * generated (create/update/backfill). Resolves true when every non-empty
 * upsert succeeded (an empty side — e.g. no images — counts as success).
 */
export async function syncProductToPinecone(product) {
  if (!pineconeReady() || !product?._id) return false;

  const productId = String(product._id);
  const textEntries = [];
  const imgEntries = [];

  const textVec = product.embedding;
  if (Array.isArray(textVec) && textVec.length === TEXT_DIM) {
    textEntries.push({
      id: `p:${productId}`,
      values: textVec,
      metadata: {
        productId,
        title: String(product.title || "").slice(0, 200),
        category: product.category?.name || "",
        brand: product.brand?.name || "",
        tags: Array.isArray(product.tags) ? product.tags.map(String).slice(0, 20) : [],
      },
    });
  }

  (product.images || []).forEach((img, i) => {
    if (Array.isArray(img?.embedding) && img.embedding.length === IMAGE_DIM) {
      imgEntries.push({
        id: `mi:${productId}:${i}`,
        values: img.embedding,
        metadata: {
          productId,
          imageId: String(img._id || i),
          variantId: "",
          type: "main",
        },
      });
    }
  });

  (product.variants || []).forEach((v, vi) => {
    (v.images || []).forEach((img, ii) => {
      if (Array.isArray(img?.embedding) && img.embedding.length === IMAGE_DIM) {
        imgEntries.push({
          id: `vi:${productId}:${vi}:${ii}`,
          values: img.embedding,
          metadata: {
            productId,
            imageId: String(img._id || `${vi}:${ii}`),
            variantId: String(v._id || vi),
            type: "variant",
          },
        });
      }
    });
  });

  const results = await Promise.all([
    textEntries.length > 0 ? upsertTextVectors(textEntries) : true,
    imgEntries.length > 0 ? upsertImageVectors(imgEntries) : true,
  ]);
  return results.every(Boolean);
}

/** Removes every vector belonging to a product (trash/delete). */
export async function deleteProductVectors(productId) {
  if (!pineconeReady() || !productId) return;
  try {
    const pid = String(productId);
    for (const indexName of [TEXT_INDEX, IMAGE_INDEX]) {
      const idx = client.index(indexName);
      // v8 SDK has no deleteByFilter — find the ids by metadata filter, then delete
      const res = await idx.query({
        vector: new Array(indexName === TEXT_INDEX ? TEXT_DIM : IMAGE_DIM).fill(0),
        topK: 10000,
        filter: { productId: pid },
        includeMetadata: false,
      });
      const ids = (res.matches || []).map((m) => m.id);
      if (ids.length > 0) {
        await idx.deleteMany({ ids });
      }
    }
  } catch (err) {
    console.warn("[Pinecone] deleteProductVectors failed:", err.message);
  }
}
