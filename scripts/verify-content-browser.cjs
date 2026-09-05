// Run against a locally started app. Set PLAYWRIGHT_MODULE and CHROME_PATH if needed.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const stories = require("../app/content/mini-stories.json");
const book = require("../app/sota/data/book.json");
const base = process.env.CONTENT_TEST_URL || "http://127.0.0.1:3041";
const out = process.env.CONTENT_TEST_OUTPUT || path.join(require("node:os").tmpdir(), "svo-content-review");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  // This offline runner cannot reach the existing Google Fonts stylesheet.
  // Fail external font requests promptly and exercise the fallback typography.
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const goto = route => page.goto(base + route, { waitUntil: "domcontentloaded" });
  const shot = async name => {
    await page.locator("img").evaluateAll(images => images.forEach(image => { image.loading = "eager"; }));
    await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0), null, { timeout: 15000 });
    return page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
  };
  const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "horizontal overflow");
  try {
    await goto("/storyquiz");
    await page.getByText("Banana's Lunch", { exact: true }).waitFor();
    await shot("story-shelf-desktop");
    for (const story of stories) {
      await goto("/storyquiz/" + story.id + "/play");
      if (await page.getByRole("button", { name: "本文へ", exact: true }).isVisible()) await page.getByRole("button", { name: "本文へ", exact: true }).click();
      for (const [index, segment] of story.segments.entries()) {
        const quiz = page.getByRole("button", { name: "クイズへ", exact: true });
        if (await quiz.isVisible()) await quiz.click();
        const correct = segment.choices.find(c => c.id === segment.correctChoiceId);
        const answer = page.getByRole("button", { name: correct.labelJa + " " + correct.labelEn, exact: true });
        if (index === 0) {
          const wrong = segment.choices.find(c => c.id !== segment.correctChoiceId);
          const wrongButton = page.getByRole("button", { name: wrong.labelJa + " " + wrong.labelEn, exact: true });
          await wrongButton.click();
          assert(await wrongButton.isDisabled(), "wrong answer must lock");
        }
        await answer.click();
        await page.getByRole("button", { name: index === 3 ? "おはなしクリア！" : "つぎへ", exact: true }).click();
      }
      await page.waitForURL("**/result**", { waitUntil: "domcontentloaded" });
      const link = page.getByRole("link", { name: /おはなしの ぶんを つくる/ });
      assert.equal(await link.getAttribute("href"), "/puzzle-grammar?story=" + story.id);
      await link.click();
      await page.getByRole("button", { name: story.partTitle, exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: story.partTitle, exact: true }).getAttribute("aria-pressed"), "true");
      for (let cardIndex = 0; cardIndex < story.segments.length; cardIndex++) {
        // Puzzle decks shuffle; identify each current card by its image's original URL.
        await page.locator('img').first().waitFor();
        const src = await page.locator('img').first().getAttribute("src");
        const current = story.segments.find(s => decodeURIComponent(src).includes(s.image));
        assert(current, src);
        const p = current.puzzle;
        const labels = { subject: "だれが", verb: "する", object: p.pattern === "svc" ? "どんな" : "なにを" };
        const imageBefore = src;
        if (cardIndex === 0) {
          await page.getByRole("button", { name: p.distractors.subject, exact: true }).press("Enter");
          await page.getByRole("button", { name: "だれが のスロット", exact: true }).press("Enter");
          assert(!(await page.getByRole("button", { name: "だれが のスロット", exact: true }).innerText()).includes(p.distractors.subject));
        }
        for (const role of ["subject", "verb", "object"]) {
          await page.getByRole("button", { name: p[role], exact: true }).press("Enter");
          await page.getByRole("button", { name: labels[role] + " のスロット", exact: true }).press("Enter");
        }
        await page.waitForFunction(before => {
          const img = document.querySelector("img");
          return !img || img.getAttribute("src") !== before;
        }, imageBefore);
      }
      await page.getByText("4この ぶんが つくれたね！", { exact: true }).waitFor();
      console.log("PASS story and puzzle:", story.id);
    }
    await goto("/sota/book");
    await page.getByRole("heading", { name: "えほんは もうすこし!" }).waitFor();
    await goto("/sota/play");
    for (const [index, spread] of book.spreads.entries()) {
      const choice = page.locator('[data-choice-id="' + spread.id + '"]');
      await choice.waitFor();
      assert.equal(await choice.locator("img").evaluate(el => getComputedStyle(el).filter), "grayscale(1)");
      if (index === 0) {
        await page.locator('[data-choice-id]:not([data-choice-id="' + spread.id + '"])').first().click();
        assert.equal(await choice.locator("img").evaluate(el => getComputedStyle(el).filter), "grayscale(1)");
      }
      await choice.click();
      assert.equal(await choice.locator("img").evaluate(el => getComputedStyle(el).filter), "grayscale(0)");
      if (index === 0) await shot("sota-color-reveal");
      if (index < 15) await page.getByRole("button", { name: "つぎの ばめん →", exact: true }).click();
    }
    await page.getByRole("link", { name: "えほんを ひらく", exact: true }).click();
    await page.getByRole("heading", { name: "So-ta The Alien" }).waitFor();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "So-ta The Alien" }).waitFor();
    for (let i = 0; i < 15; i++) await page.getByRole("button", { name: "つぎの ばめん →", exact: true }).click();
    await page.getByRole("button", { name: "さいしょに もどる", exact: true }).click();
    await shot("sota-reader-desktop");
    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem("sota.progress.v1")));
    assert.equal(progress.cleared.length, 16);
    console.log("PASS So-ta: locked, 16 reveals, saved progress, reader navigation");
    for (const width of [390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/storyquiz", "/puzzle-grammar?story=mini-wash", "/sota", "/sota/book"]) {
        await goto(route);
        await page.locator("h1").waitFor();
        if (route.startsWith("/puzzle-grammar")) await page.getByRole("button", { name: "だれが のスロット", exact: true }).waitFor();
        if (route === "/sota/book") await page.getByRole("heading", { name: "So-ta The Alien" }).waitFor();
        await noOverflow();
        await shot(route.split("?")[0].replaceAll("/", "-") + "-" + width);
      }
    }
    assert.deepEqual(errors, []);
    console.log("PASS mobile/tablet overflow and browser errors. Screenshots:", out);
  } catch (error) {
    console.error("Original failure:", error);
    console.error(await page.locator("img").evaluateAll(images => images.map(img => ({ src: img.currentSrc, complete: img.complete, width: img.naturalWidth }))));
    await page.screenshot({ path: path.join(out, "failure.png"), fullPage: true });
    console.error(await page.locator("body").innerText());
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
