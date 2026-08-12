import productModel from "../models/product.model.js";
import {
  generateTextEmbedding,
  generateImageEmbedding,
  buildProductTextForEmbedding,
} from "../utils/aiEmbedding.js";
import { ensurePineconeIndexes, syncProductToPinecone } from "./pinecone.service.js";

// ── Scheduled Publishing ──────────────────────────────────────────────────────
// Every minute, products with status "scheduled" whose scheduledPublishDate has
// arrived are flipped to "published". The whole product is stored in the DB at
// creation time (create/update) — this only flips visibility, nothing else.
const PUBLISH_CHECK_INTERVAL_MS = 60 * 1000;

// ── Embedding health check ────────────────────────────────────────────────────
// Every 5 minutes:
//   1. Products WITHOUT Voyage embeddings (background job was killed, Voyage
//      was down at creation, etc.) get their text + image vectors generated.
//   2. Products WITH Voyage embeddings but pineconeSyncStatus !== "synced"
//      (Pinecone was down/quota at upsert time) get re-synced to Pinecone.
// MongoDB embeddings are never deleted on sync failure — the retry loop just
// keeps trying until Pinecone accepts them.
const EMBEDDING_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const checkMissingEmbeddings = async () => {
  try {
    const done = [];
    const DIM = 1024; // Voyage multimodal-3.5 output dimension

    // 1. Regenerate missing OR stale-dim text embeddings (Voyage works on every environment)
    const missingText = await productModel
      .find({
        status: { $ne: "trash" },
        $or: [
          { embedding: { $size: 0 } },
          { embedding: { $exists: false } },
          { $expr: { $ne: [{ $size: { $ifNull: ["$embedding", []] } }, DIM] } },
        ],
      })
      .select("_id title shortDescription description category brand tags attributes")
      .limit(10)
      .lean();

    for (const p of missingText) {
      const text = buildProductTextForEmbedding(p);
      if (!text) continue;
      const vec = await generateTextEmbedding(text);
      if (vec && vec.length > 0) {
        await productModel.updateOne({ _id: p._id }, { $set: { embedding: vec, pineconeSyncStatus: "pending" } });
        console.log(`[Scheduler] Backfilled text embedding: ${p.title?.slice(0, 30)}`);
        done.push(p);
      }
    }

    // 2. Regenerate missing OR stale-dim image embeddings (no vision gate —
    //    Voyage handles images on every environment, incl. the 512MB Render)
    const missingImages = await productModel
      .find({
        status: { $ne: "trash" },
        "images.0": { $exists: true },
        $or: [
          { imageEmbedding: { $size: 0 } },
          { imageEmbedding: { $exists: false } },
          { $expr: { $ne: [{ $size: { $ifNull: ["$imageEmbedding", []] } }, DIM] } },
        ],
      })
      .limit(5)
      .lean();

    for (const p of missingImages) {
      let changed = false;
      for (const img of p.images || []) {
        if (!img?.url || (Array.isArray(img.embedding) && img.embedding.length > 0)) continue;
        try {
          const vec = await generateImageEmbedding(img.url);
          if (vec && vec.length > 0) {
            img.embedding = vec;
            changed = true;
          }
        } catch (e) {
          console.warn(`[Scheduler] image embedding failed: ${e.message}`);
        }
      }
      // Root imageEmbedding = primary cover vector (also heals stale 512-dim roots)
      const primary = (p.images || []).find((img) => img?.isPrimary) || (p.images || [])[0];
      if (primary && Array.isArray(primary.embedding) && primary.embedding.length === DIM) {
        if (p.imageEmbedding?.length !== DIM) {
          p.imageEmbedding = primary.embedding;
          changed = true;
        }
      }
      if (changed) {
        await productModel.updateOne(
          { _id: p._id },
          { $set: { images: p.images, imageEmbedding: p.imageEmbedding, pineconeSyncStatus: "pending" } }
        );
        console.log(`[Scheduler] Backfilled image embeddings: ${p.title?.slice(0, 30)}`);
        done.push(p);
      }
    }

    // 3. Retry Pinecone sync for products whose vectors exist but never made it
    //    to Pinecone (status pending/failed) — the MongoDB embeddings stay put.
    if (process.env.PINECONE_API_KEY && (await ensurePineconeIndexes())) {
      const unsynced = await productModel
        .find({
          status: { $ne: "trash" },
          pineconeSyncStatus: { $in: ["pending", "failed"] },
          $or: [{ embedding: { $ne: [] } }, { imageEmbedding: { $ne: [] } }],
        })
        .limit(5)
        .lean();

      for (const p of unsynced) {
        const synced = await syncProductToPinecone(p);
        await productModel.updateOne(
          { _id: p._id },
          { $set: { pineconeSyncStatus: synced ? "synced" : "failed" } }
        );
        console.log(
          `[Scheduler] Pinecone resync ${synced ? "OK" : "FAILED"}: ${p.title?.slice(0, 30)}`
        );
      }
    }
  } catch (err) {
    console.error("[Scheduler] Embedding health check failed:", err.message);
  }
};

export const startProductScheduler = () => {
  setInterval(async () => {
    try {
      const now = new Date();
      const res = await productModel.updateMany(
        {
          status: "scheduled",
          scheduledPublishDate: { $ne: null, $lte: now },
        },
        {
          $set: { status: "published", scheduledPublishDate: null },
        }
      );
      if (res.modifiedCount > 0) {
        console.log(`[Scheduler] Published ${res.modifiedCount} scheduled product(s)`);
      }
    } catch (err) {
      console.error("[Scheduler] Publish check failed:", err.message);
    }
  }, PUBLISH_CHECK_INTERVAL_MS);

  // Embedding health check (first run shortly after boot, then every 5 min)
  setTimeout(checkMissingEmbeddings, 30 * 1000);
  setInterval(checkMissingEmbeddings, EMBEDDING_CHECK_INTERVAL_MS);

  console.log("[Scheduler] Product publish scheduler started (checks every 60s)");
};

export default startProductScheduler;
