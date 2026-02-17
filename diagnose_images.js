
const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'public/data/svo_cards.json');
const imagesDir = path.join(process.cwd(), 'public/images');

console.log("Checking data from:", dataPath);
console.log("Checking images in:", imagesDir);

try {
    const rawData = fs.readFileSync(dataPath, 'utf-8').replace(/^\uFEFF/, '');
    const data = JSON.parse(rawData);

    const arr = Array.isArray(data) ? data : data?.cards ?? data?.items ?? [];

    console.log(`Found ${arr.length} items in JSON.`);

    let successCount = 0;
    let failCount = 0;

    arr.forEach((item, index) => {
        const imageFile = item.imageFile;
        if (!imageFile) {
            console.log(`Item ${index} (ID: ${item.id}) has no imageFile property.`);
            failCount++;
            return;
        }

        const explicitPath = path.join(imagesDir, imageFile);

        if (fs.existsSync(explicitPath)) {
            // Check for potential case sensitivity issues by reading the actual dir
            const actualFiles = fs.readdirSync(imagesDir);
            const exactMatch = actualFiles.find(f => f === imageFile);

            if (exactMatch) {
                // console.log(`[OK] ${imageFile} exists.`);
                successCount++;
            } else {
                console.log(`[WARN] ${imageFile} exists but casing might be wrong. Found in dir: ${actualFiles.find(f => f.toLowerCase() === imageFile.toLowerCase())}`);
                failCount++;
            }
        } else {
            console.log(`[FAIL] ${imageFile} NOT found at ${explicitPath}`);
            failCount++;
        }
    });

    console.log(`\nSummary: ${successCount} OK, ${failCount} FAILED.`);

} catch (err) {
    console.error("Error running validation:", err);
}
