
const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'public/data/svo_cards.json');
const rawData = fs.readFileSync(dataPath, 'utf-8').replace(/^\uFEFF/, '');
const data = JSON.parse(rawData);

// Implementation from app/page.tsx
const arr = Array.isArray(data) ? data : data?.cards ?? data?.items ?? [];
const normalized = arr
    .map((x, i) => ({
        id: x.id ?? i,
        sentence: x.sentence ?? x.text ?? "",
        image: x.image ?? x.img ?? x.imagePath ?? "", // THIS IS THE BUGGY LINE
    }))
    .filter((x) => x.sentence && x.image);

console.log(`Loaded ${normalized.length} cards.`);

if (normalized.length === 0) {
    console.log("FAIL: No cards loaded. The application will be stuck on loading.");
} else {
    console.log("SUCCESS: Cards loaded successfully.");
}

// Proposed Fix
const fixedNormalized = arr
    .map((x, i) => ({
        id: x.id ?? i,
        sentence: x.sentence ?? x.text ?? "",
        image: x.image ?? x.img ?? x.imagePath ?? x.imageFile ?? "", // ADDED x.imageFile
    }))
    .filter((x) => x.sentence && x.image);

console.log(`With fix: Loaded ${fixedNormalized.length} cards.`);
