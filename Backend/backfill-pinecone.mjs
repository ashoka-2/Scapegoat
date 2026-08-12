// Backfill: copy the EXISTING embeddings from MongoDB into Pinecone.
// Reads every product's text + image vectors from the shared Atlas DB and
// upserts them into the Pinecone indexes (no re-inference — the vectors
// already exist; we are just moving the store). Safe to re-run (idempotent
// upserts). Requires PINECONE_API_KEY in Backend/.env.
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config({ path: "D:/Scapegoat/Backend/.env" });

const Product = mongoose.model(
  "Product",
  new mongoose.Schema({}, { strict: false })
);

const run = async () => {
  if (!process.env.PINECONE_API_KEY) {
    console.log("PINECONE_API_KEY missing — add it to Backend/.env and retry.");
    process.exit(0);
  }

  const { ensurePineconeIndexes, syncProductToPinecone, pineconeReady } = await import(
    "./src/services/pinecone.service.js"
  );

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  console.log("connected to Mongo");

  const ok = await ensurePineconeIndexes();
  if (!ok || !pineconeReady()) {
    console.log("Pinecone not ready — aborting.");
    process.exit(1);
  }

  const products = await Product.find({ status: { $ne: "trash" } })
    .select("+embedding +imageEmbedding +images.embedding +variants.images.embedding")
    .lean();

  let textCount = 0;
  let imgCount = 0;
  for (const p of products) {
    if (Array.isArray(p.embedding) && p.embedding.length === 384) textCount += 1;
    imgCount += (p.images || []).filter((i) => Array.isArray(i.embedding) && i.embedding.length === 512).length;
    (p.variants || []).forEach((v) => {
      imgCount += (v.images || []).filter((i) => Array.isArray(i.embedding) && i.embedding.length === 512).length;
    });
    await syncProductToPinecone(p);
  }

  console.log(`backfill complete: ${products.length} products | ${textCount} text vectors | ${imgCount} image vectors`);
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error("backfill failed:", e.message);
  process.exit(1);
});
