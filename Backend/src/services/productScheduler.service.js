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
// Every 5 minutes, products that somehow ended up WITHOUT embeddings (e.g. a
// background generation job was killed on the free tier) get their text vector
// regenerated, and — when vision is enabled — their image vectors too. This is
// the safety net so search never silently misses a product.
const EMBEDDING_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const checkMissingEmbeddings = async () => {
  try {
    // Text embeddings regenerate on any environment (MiniLM runs everywhere)
    const missingText = await productModel
      .find({
        status: { $ne: "trash" },
        $or: [{ embedding: { $size: 0 } }, { embedding: { $exists: false } }],
      })
      .select("_id title shortDescription description category brand tags attributes")
      .limit(10)
      .lean();

    for (const p of missingText) {
      const text = buildProductTextForEmbedding(p);
      if (!text) continue;
      const vec = await generateTextEmbedding(text);
      if (vec && vec.length > 0) {
        await productModel.updateOne({ _id: p._id }, { $set: { embedding: vec } });
        console.log(`[Scheduler] Backfilled text embedding: ${p.title?.slice(0, 30)}`);
        // Mirror into Pinecone when available
        ensurePineconeIndexes().then((ok) => {
          if (ok) syncProductToPinecone(p).catch(() => {});
        });
      }
    }

    // Image embeddings only when the vision pipeline is enabled (prod gates it)
    if (process.env.AI_VISION_ENABLED === "true") {
      const missingImages = await productModel
        .find({
          status: { $ne: "trash" },
          "images.0": { $exists: true },
          $or: [{ imageEmbedding: { $size: 0 } }, { imageEmbedding: { $exists: false } }],
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
        if (changed) {
          await productModel.updateOne({ _id: p._id }, { $set: { images: p.images } });
          console.log(`[Scheduler] Backfilled image embeddings: ${p.title?.slice(0, 30)}`);
          ensurePineconeIndexes().then((ok) => {
            if (ok) syncProductToPinecone(p).catch(() => {});
          });
        }
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
