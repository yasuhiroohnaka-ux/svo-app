import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "app", "phonics", "PhonicsData.ts");
const source = readFileSync(dataPath, "utf8");

const publicAssetPattern = /\b(image|audio|wordAudio):\s*"([^"]+)"/g;
const missing = [];
let checked = 0;

for (const match of source.matchAll(publicAssetPattern)) {
  const [, kind, assetPath] = match;

  if (!assetPath.startsWith("/")) {
    missing.push(`${kind}: ${assetPath} is not a public-rooted path`);
    continue;
  }

  const filesystemPath = path.join(root, "public", assetPath.slice(1));
  checked += 1;

  if (!existsSync(filesystemPath)) {
    missing.push(`${kind}: ${assetPath} -> ${filesystemPath}`);
  }
}

if (missing.length > 0) {
  console.error("Missing phonics assets:");
  for (const item of missing) {
    console.error(`  - ${item}`);
  }
  process.exit(1);
}

console.log(`OK: ${checked} phonics image/audio references exist.`);
