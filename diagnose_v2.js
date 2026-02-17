
const fs = require('fs');
const path = require('path');

const logPath = path.join(process.cwd(), 'diagnosis.txt');
const log = (msg) => fs.appendFileSync(logPath, msg + '\n');

// Clear log
fs.writeFileSync(logPath, '');

const dataPath = path.join(process.cwd(), 'public/data/svo_cards.json');
const imagesDir = path.join(process.cwd(), 'public/images');

log("CWD: " + process.cwd());
log("Checking data from: " + dataPath);
log("Checking images in: " + imagesDir);

try {
    const rawData = fs.readFileSync(dataPath, 'utf-8').replace(/^\uFEFF/, '');
    const data = JSON.parse(rawData);

    const arr = Array.isArray(data) ? data : data?.cards ?? data?.items ?? [];

    log(`Found ${arr.length} items in JSON.`);

    // Check actual files in dir
    if (!fs.existsSync(imagesDir)) {
        log("CRITICAL: imagesDir does not exist!");
    } else {
        const files = fs.readdirSync(imagesDir);
        log(`Files in public/images (${files.length}):`);
        files.forEach(f => log(` - "${f}" (len: ${f.length})`));
    }

    let successCount = 0;
    let failCount = 0;

    arr.forEach((item, index) => {
        const imageFile = item.imageFile;
        if (imageFile) {
            log(`Item ${index} imageFile: "${imageFile}" (len: ${imageFile.length})`);

            const explicitPath = path.join(imagesDir, imageFile);
            if (fs.existsSync(explicitPath)) {
                successCount++;
            } else {
                failCount++;
                log(`  -> FAIL: File not found at ${explicitPath}`);
            }
        }
    });

    log(`\nSummary: ${successCount} OK, ${failCount} FAILED.`);

} catch (err) {
    log("Error: " + err.message);
}
