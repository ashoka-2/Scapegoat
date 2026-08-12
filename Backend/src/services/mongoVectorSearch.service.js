// ── MongoDB Atlas Vector Search (FALLBACK vector search) ─────────────────────
// Pinecone is PRIMARY. When Pinecone is unavailable/errors/quota-exhausted,
// these functions run Atlas $vectorSearch over the SAME Voyage embeddings that
// are stored in MongoDB (and mirrored in Pinecone). No brute-force JavaScript
// cosine similarity — the matching happens natively inside MongoDB.
//
// Indexes required on the `products` collection (Atlas Vector Search):
//   1. voyage_text        → path "embedding"           (1024d, cosine)
//   2. voyage_image_root  → path "imageEmbedding"      (1024d, cosine)
//   3. voyage_images_nest → path "images.embedding"    (1024d, cosine)
// The service attempts to create them via createSearchIndex (requires an Atlas
// admin connection string). If that fails, print the definitions so they can
// be created once in the Atlas UI — until then $vectorSearch reports the
// missing index and the search falls back to a normal (non-vector) listing.

import productModel from "../models/product.model.js";
import { EMBEDDING_DIM } from "./pinecone.service.js";

const TEXT_INDEX = "voyage_text";
const IMAGE_ROOT_INDEX = "voyage_image_root";
const IMAGE_NEST_INDEX = "voyage_images_nest";

const TEXT_INDEX_DEF = {
  name: TEXT_INDEX,
  type: "vectorSearch",
  definition: {
    fields: [{ type: "vector", path: "embedding", numDimensions: EMBEDDING_DIM, similarity: "cosine" }],
  },
};

const IMAGE_ROOT_INDEX_DEF = {
  name: IMAGE_ROOT_INDEX,
  type: "vectorSearch",
  definition: {
    fields: [{ type: "vector", path: "imageEmbedding", numDimensions: EMBEDDING_DIM, similarity: "cosine" }],
  },
};

const IMAGE_NEST_INDEX_DEF = {
  name: IMAGE_NEST_INDEX,
  type: "vectorSearch",
  definition: {
    fields: [{ type: "vector", path: "images.embedding", numDimensions: EMBEDDING_DIM, similarity: "cosine" }],
  },
};

let indexesAttempted = false;

/**
 * Best-effort creation of the three Atlas Vector Search indexes. Idempotent —
 * safe to call at boot. Prints the definitions if the connection lacks the
 * required Atlas admin privileges.
 */
export async function ensureVectorSearchIndexes() {
  if (indexesAttempted) return;
  indexesAttempted = true;
  try {
    const existing = await productModel.collection.listSearchIndexes().toArray();
    const names = new Set(existing.map((i) => i.name));
    for (const def of [TEXT_INDEX_DEF, IMAGE_ROOT_INDEX_DEF, IMAGE_NEST_INDEX_DEF]) {
      if (names.has(def.name)) continue;
      try {
        await productModel.collection.createSearchIndex(def);
        console.log(`[MongoVS] created search index "${def.name}"`);
      } catch (err) {
        console.warn(
          `[MongoVS] could not auto-create "${def.name}" (${err.message}). ` +
            `Create it in Atlas: ${JSON.stringify(def.definition)}`
        );
      }
    }
  } catch (err) {
    console.warn("[MongoVS] cannot inspect search indexes (needs Atlas admin connection):", err.message);
  }
}

// Post-vector stages: published-only + category/brand lookups + score capture.
const buildProductMatchStages = (extra = {}) => [
  { $match: { status: "published", ...extra } },
  { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" } },
  { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
  { $lookup: { from: "brands", localField: "brand", foreignField: "_id", as: "brand" } },
  { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      __vsScore: { $meta: "vectorSearchScore" },
    },
  },
];

/**
 * Text search via MongoDB Vector Search (fallback).
 * @param {number[]} queryVector 1024-dim Voyage text embedding
 * @param {number} limit
 * @returns {Promise<Array<{product, score}>>}
 */
export async function vectorSearchText(queryVector, limit = 40) {
  if (!Array.isArray(queryVector) || queryVector.length === 0) return [];
  try {
    const rows = await productModel.aggregate([
      {
        $vectorSearch: {
          index: TEXT_INDEX,
          path: "embedding",
          queryVector,
          limit: Math.min(limit * 2, 100),
          numCandidates: Math.min(limit * 8, 300),
        },
      },
      ...buildProductMatchStages(),
      { $limit: limit },
    ]);
    return rows.map((p) => ({ product: p, score: p.__vsScore || 0 }));
  } catch (err) {
    console.warn("[MongoVS] text $vectorSearch failed:", err.message);
    return [];
  }
}

/**
 * Image search via MongoDB Vector Search (fallback). Runs the query against
 * BOTH the root primary-cover vectors and the nested main-image vectors, then
 * merges per product keeping the best score (mirrors the Pinecone grouping).
 * @param {number[]} queryVector 1024-dim Voyage image embedding
 * @param {number} limit
 * @returns {Promise<Array<{product, score}>>}
 */
export async function vectorSearchImages(queryVector, limit = 40) {
  if (!Array.isArray(queryVector) || queryVector.length === 0) return [];
  try {
    const [rootRows, nestedRows] = await Promise.all([
      productModel.aggregate([
        {
          $vectorSearch: {
            index: IMAGE_ROOT_INDEX,
            path: "imageEmbedding",
            queryVector,
            limit: Math.min(limit * 2, 100),
            numCandidates: Math.min(limit * 8, 300),
          },
        },
        ...buildProductMatchStages(),
        { $limit: limit },
      ]),
      productModel.aggregate([
        {
          $vectorSearch: {
            index: IMAGE_NEST_INDEX,
            path: "images.embedding",
            queryVector,
            limit: Math.min(limit * 2, 100),
            numCandidates: Math.min(limit * 8, 300),
          },
        },
        ...buildProductMatchStages(),
        { $limit: limit },
      ]),
    ]);

    const byProduct = new Map();
    for (const row of [...rootRows, ...nestedRows]) {
      const pid = String(row._id);
      const cur = byProduct.get(pid);
      if (cur === undefined || (row.__vsScore || 0) > cur.score) {
        byProduct.set(pid, { product: row, score: row.__vsScore || 0 });
      }
    }
    return [...byProduct.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (err) {
    console.warn("[MongoVS] image $vectorSearch failed:", err.message);
    return [];
  }
}
