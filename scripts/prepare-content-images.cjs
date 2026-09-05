// Encode web delivery assets without changing composition or colors.
// Set SHARP_MODULE when using a shared workspace runtime.
const sharp = require(process.env.SHARP_MODULE || "sharp");
const { readdirSync } = require("node:fs");
const path = require("node:path");
(async () => {
  for (const dir of ["public/images/mini-stories", "public/images/sota/color"]) {
    for (const file of readdirSync(dir).filter(file => file.endsWith(".png"))) {
      await sharp(path.join(dir, file)).resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 90 }).toFile(path.join(dir, file.replace(/\.png$/, ".webp")));
    }
  }
  console.log("Prepared 29 WebP delivery assets.");
})().catch(error => { console.error(error); process.exitCode = 1; });
