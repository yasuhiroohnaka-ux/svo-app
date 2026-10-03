// 配信用の画像(WebP)を、design-drafts/originals/ の元画像から作る。
// 構図や色は変えず、幅をそろえて圧縮するだけ。元画像を差し替えたら再実行する:
//   node scripts/prepare-content-images.cjs
// 共有ランタイムの sharp を使う場合は SHARP_MODULE でパスを指定する。
const sharp = require(process.env.SHARP_MODULE || "sharp");
const { existsSync, mkdirSync, readdirSync, statSync } = require("node:fs");
const path = require("node:path");

const ORIGINALS = "design-drafts/originals";

// from: 元画像のフォルダ / to: 配信先 / width: 最大幅(これより小さい画像は拡大しない) / quality: WebP の品質
const TARGETS = [
  { from: "svo", to: "public/images", width: 1200 },
  { from: "lv2", to: "public/images/lv2", width: 1200 },
  { from: "quiz", to: "public/images/quiz", width: 1200 },
  // えほんの 2 つは 以前から 品質 90 で配信しているので そのまま
  { from: "mini-stories", to: "public/images/mini-stories", width: 1200, quality: 90 },
  { from: "sota/color", to: "public/images/sota/color", width: 1200, quality: 90 },
  { from: "sota/lineart", to: "public/images/sota/lineart", width: 1200 },
  { from: "phonics/cards", to: "public/images/phonics/cards", width: 900 },
];

(async () => {
  let count = 0;
  let before = 0;
  let after = 0;
  for (const target of TARGETS) {
    const fromDir = path.join(ORIGINALS, target.from);
    if (!existsSync(fromDir)) continue;
    mkdirSync(target.to, { recursive: true });
    for (const file of readdirSync(fromDir).filter((name) => /\.(png|jpe?g)$/i.test(name))) {
      const input = path.join(fromDir, file);
      const output = path.join(target.to, file.replace(/\.(png|jpe?g)$/i, ".webp"));
      // 中身が JPEG でも拡張子が .png のファイルがあるので、sharp に中身で判定させる
      await sharp(input).rotate().resize({ width: target.width, withoutEnlargement: true }).webp({ quality: target.quality ?? 85 }).toFile(output);
      before += statSync(input).size;
      after += statSync(output).size;
      count += 1;
    }
  }
  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
  console.log(`Prepared ${count} WebP files: ${mb(before)}MB -> ${mb(after)}MB`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
