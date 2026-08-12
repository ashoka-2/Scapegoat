import { Pinecone } from "@pinecone-database/pinecone";

// ── Pinecone vector-store service ────────────────────────────────────────────
// Text (MiniLM, 384-dim) and image (CLIP, 512-dim) embeddings live in TWO
// Pinecone serverless indexes (dimensions differ, so one index per space):
//   - PINECONE_TEXT_INDEX  (default "scapegoat-text",  384d, cosine)
//   - PINECONE_IMAGE_INDEX (default "scapegoat-image", 512d, cosine)
// Everything degrades gracefully: without PINECONE_API_KEY the service reports
// "not ready" and the AI searches fall back to the MongoDB brute-force path.

const TEXT_DIM = 384;
const IMAGE_DIM = 512;

const TEXT_INDEX = process.env.PINECONE_TEXT_INDEX || "scapegoat-text";
const IMAGE_INDEX = process.env.PINECONE_IMAGE_INDEX || "scapegoat-image";
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
  if (!pineconeReady() || !vector?.length) return [];
  try {
    const res = await client.index(TEXT_INDEX).query({
      vector,
      topK,
      includeMetadata: true,
    });
    return (res.matches || []).map((m) => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata || {},
    }));
  } catch (err) {
    console.warn("[Pinecone] text query failed:", err.message);
    return [];
  }
}

export async function queryImageVectors(vector, topK = 60) {
  if (!pineconeReady() || !vector?.length) return [];
  try {
    const res = await client.index(IMAGE_INDEX).query({
      vector,
      topK,
      includeMetadata: true,
    });
    return (res.matches || []).map((m) => ({
      id: m.id,
      score: m.score,
      metadata: m.metadata || {},
    }));
  } catch (err) {
    console.warn("[Pinecone] image query failed:", err.message);
    return [];
  }
}

// ── Sync / delete ────────────────────────────────────────────────────────────

/**
 * Upserts ALL of a product's vectors (1 text + every main/variant image) from
 * the in-memory Mongoose doc into Pinecone. Call after embeddings are
 * generated (create/update/backfill). Fire-and-forget friendly.
 */
export async function syncProductToPinecone(product) {
  if (!pineconeReady() || !product?._id) return;

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

  await Promise.all([upsertTextVectors(textEntries), upsertImageVectors(imgEntries)]);
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
