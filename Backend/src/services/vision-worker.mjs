// vision-worker.mjs — CLIP embedding in an ISOLATED process.
// The Render free instance (512MB) cannot keep CLIP (~200MB of heap + WASM)
// resident alongside the API. The parent spawns this script, reads the JSON
// from stdout, and the process EXITS — returning every byte of memory to the
// OS, so visual searches can run on the free tier without "memory limit".
import { embedImageFileForWorker } from "../utils/aiEmbedding.js";

const filePath = process.argv[2];
try {
  if (!filePath) throw new Error("missing image path argument");
  const result = await embedImageFileForWorker(filePath);
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: err.message }));
}
process.exit(0);
