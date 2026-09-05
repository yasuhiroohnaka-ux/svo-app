# Content expansion (2026-09-05)

## Content authority

- `app/content/mini-stories.json` is the editable source for the three original introductory stories, questions, artwork references and 12 sentence puzzles.
- `app/content/miniStories.ts` adapts that source for StoryQuiz and Puzzle Grammar. Edit shared sentences and scene paths in the JSON.
- Puzzle distractors are reviewed per scene, rather than sampled from unrelated scenes where another answer could also be visually true.
- So-ta's existing `app/sota/data/book.json` remains the narrative authority; its English text and scene sequence are unchanged.

## Learner flow

StoryQuiz opens the introductory collection first. Each story has five preview words, four illustrated passages and four questions. Wrong answers stay available as a learning moment through a replay/hint, and the selected wrong option locks. After completion the learner can build that story's four sentences in Puzzle Grammar. All 12 are also available together from the puzzle level selector. Skipped cards do not count as completed sentences.

So-ta has 16 scenes plus a color cover. Choice pictures begin in grayscale and reveal color after a correct answer. Cleared shelf pictures keep their color through the existing local progress store. Completing all scenes unlocks the color reader, with page navigation and a start/stop speech button.

## Artwork provenance and style

- Mini-story illustrations are generated original illustrations. Final direction requested by the user: flat Japanese educational clip-art, white background, simple outlines, reduced texture and shading. Only scene-relevant characters remain.
- So-ta colors are derived from the project's existing original line art, not a new narrative or character design.
- p04 reuses the approved `art-p04_irasutoya.png` draft from the So-ta source folder; that historical file is JPEG-encoded despite its name.
- p08 reuses the approved `art-p08_v6_notes-applied.png` source draft.
- Other color pages were generated from the original line art. p12's king emblem and p32's rabbit-eared masked character were corrected after visual review. Both p30 panels retain blue eyes for sadness.
- Recorded generation prompts are in `docs/content-prompts/`. The final mini-story prompts end in `-flat.txt`; corrections end in `-fix.txt`. p06's initial prompt was not retained verbatim.
- Original external source directory: `OneDrive/デスクトップ/ウサミミマンシリーズ/So-ta The Alien/source/drafts/`. Those source files were read/copied; not edited.
- PNG files are retained as artwork inputs. `scripts/prepare-content-images.cjs` encodes the shipped WebP files at up to 1200 pixels wide and quality 90. The new art uses those small files directly, avoiding an additional responsive image selection/optimization pass. Regenerate WebP after changing a PNG.

## Verification

`node scripts/validate-story-content.mjs` checks IDs, story/puzzle sentence agreement, answer membership, distractors, subject/verb number and required color assets.

`scripts/verify-content-browser.cjs` runs against a local app with Playwright and Chrome. Set `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `CONTENT_TEST_URL`, and optionally `CONTENT_TEST_OUTPUT` for the local environment. It uses an isolated browser context and does not alter the user's stored progress.

Verified locally on 2026-09-05: production build, TypeScript, changed-application ESLint, content validator, all three story-to-puzzle journeys, wrong-answer retries, So-ta's 16 grayscale-to-color reveals, saved progress and reader navigation. The browser runner aborts unavailable Google Fonts requests, so screenshots exercise fallback fonts. Headless checks do not verify spoken audio quality or real-device touch behavior.

## Artifact routing

Code, canonical content, shipped art, prompts and verification scripts belong in this project and are Git tracking candidates. Browser screenshots and temporary tool caches are transient. The existing GitHub remote's visibility and content-publication scope have not been verified; no push or deployment is included.
