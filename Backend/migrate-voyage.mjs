// ── migrate-voyage.mjs — existing-data migration to Voyage embeddings ────────
// Reads every product, regenerates text + image embeddings with Voyage
// (multimodal-3.5, 1024-dim), REPLACES the old MiniLM(384)/CLIP(512) vectors in
// MongoDB, upserts the same vectors into the new Pinecone indexes, and marks
// pineconeSyncStatus="synced". Resumable + safe to run more than once:
//   - products whose text embedding is already 1024-dim AND images are all
//     1024-dim are skipped (unless --force)
//   - product data / image URLs are never deleted
//
// Rate-limit aware: one text call + one image call per product (the free tier
// is 3 RPM — the 429-retry in aiEmbedding paces automatically).
//
// Usage (from Backend/):  node migrate-voyage.mjs [--force]
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config({ path: "D:/Scapegoat/Backend/.env" });

const FORCE = process.argv.includes("--force");

const { default: productModel } = await import("file:///D:/Scapegoat/Backend/src/models/product.model.js");
const {
  generateTextEmbeddingsBatch,
  generateImageEmbeddingsFromUrls,
  buildProductTextForEmbedding,
} = await import("file:///D:/Scapegoat/Backend/src/utils/aiEmbedding.js");
const {
  ensurePineconeIndexes,
  syncProductToPinecone,
} = await import("file:///D:/Scapegoat/Backend/src/services/pinecone.service.js");

const DIM = 1024;

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

const products = await productModel
  .find({ status: { $ne: "trash" } })
  .select("+embedding +imageEmbedding")
  .lean();

console.log(`Migration start: ${products.length} products (force=${FORCE})`);

let migrated = 0;
let skipped = 0;
let failed = 0;

for (let i = 0; i < products.length; i++) {
  const p = products[i];

  // Resumability check
  const textOk = Array.isArray(p.embedding) && p.embedding.length === DIM;
  const imgsOk = (p.images || []).every((img) => Array.isArray(img?.embedding) && img.embedding.length === DIM);
  const rootOk = Array.isArray(p.imageEmbedding) && p.imageEmbedding.length === DIM;
  if (!FORCE && textOk && rootOk && imgsOk && p.pineconeSyncStatus === "synced") {
    skipped++;
    continue;
  }

  console.log(`\n[${i + 1}/${products.length}] ${p.title?.slice(0, 40)}`);

  try {
    // 1. Text embedding (ONE Voyage call)
    const text = buildProductTextForEmbedding(p);
    if (text) {
      const [vec] = await generateTextEmbeddingsBatch([text]);
      if (vec && vec.length === DIM) p.embedding = vec;
      else console.warn("  text embedding failed");
    }

    // 2. Image embeddings — ALL main + variant images in ONE Voyage call
    const pendingImgs = [];
    (p.images || []).forEach((img) => {
      if (!(Array.isArray(img?.embedding) && img.embedding.length === DIM)) pendingImgs.push(img);
    });
    (p.variants || []).forEach((v) =>
      (v.images || []).forEach((img) => {
        if (!(Array.isArray(img?.embedding) && img.embedding.length === DIM)) pendingImgs.push(img);
      })
    );

    if (pendingImgs.length > 0) {
      const vectors = await generateImageEmbeddingsFromUrls(pendingImgs.map((img) => img?.url));
      pendingImgs.forEach((img, vi) => {
        if (vectors[vi] && vectors[vi].length === DIM) img.embedding = vectors[vi];
        else console.warn("  image embedding failed");
      });
    }

    // Root imageEmbedding = primary cover vector
    const primary = (p.images || []).find((img) => img?.isPrimary) || (p.images || [])[0];
    if (primary && Array.isArray(primary.embedding) && primary.embedding.length === DIM) {
      p.imageEmbedding = primary.embedding;
    }

    // 3. Save to MongoDB (MongoDB is saved FIRST — Pinecone failure never loses it)
    await productModel.updateOne(
      { _id: p._id },
      { $set: { embedding: p.embedding, imageEmbedding: p.imageEmbedding, images: p.images, variants: p.variants, pineconeSyncStatus: "pending" } }
    );

    // 4. Upsert the SAME vectors into Pinecone + verify
    if (process.env.PINECONE_API_KEY && (await ensurePineconeIndexes())) {
      const synced = await syncProductToPinecone(p);
      await productModel.updateOne(
        { _id: p._id },
        { $set: { pineconeSyncStatus: synced ? "synced" : "failed" } }
      );
      console.log(`  pinecone: ${synced ? "synced ✓" : "FAILED (will retry via scheduler)"}`);
    } else {
      console.log("  pinecone: skipped (no key / not ready) — status stays pending");
    }

    migrated++;
  } catch (err) {
    failed++;
    console.error(`  FAILED: ${err.message}`);
  }
}

console.log(`\n── Migration complete ──\n migrated: ${migrated}\n skipped (already Voyage): ${skipped}\n failed: ${failed}`);
console.log("Run the scheduler (or wait 5 min) to retry any pending Pinecone syncs.");
await mongoose.disconnect();
