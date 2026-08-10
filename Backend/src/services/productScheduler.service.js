import productModel from "../models/product.model.js";

// ── Scheduled Publishing ──────────────────────────────────────────────────────
// Every minute, products with status "scheduled" whose scheduledPublishDate has
// arrived are flipped to "published". The whole product is stored in the DB at
// creation time (create/update) — this only flips visibility, nothing else.
const PUBLISH_CHECK_INTERVAL_MS = 60 * 1000;

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

  console.log("[Scheduler] Product publish scheduler started (checks every 60s)");
};

export default startProductScheduler;
