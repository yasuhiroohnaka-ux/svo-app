import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const stories = JSON.parse(readFileSync("app/content/mini-stories.json", "utf8"));
const book = JSON.parse(readFileSync("app/sota/data/book.json", "utf8"));
const ids = new Set();
assert.equal(stories.length, 3);
for (const story of stories) {
  assert.equal(story.segments.length, 4);
  assert.equal(story.puzzleTopic, story.id);
  for (const segment of story.segments) {
    const p = segment.puzzle;
    assert(!ids.has(p.id), "duplicate puzzle id");
    ids.add(p.id);
    assert(segment.text.startsWith(`${p.subject} ${p.verb} ${p.object}.`));
    assert(existsSync(`public${segment.image}`), segment.image);
    assert.equal(new Set(segment.choices.map(c => c.id)).size, 3);
    assert.equal(segment.choices.filter(c => c.id === segment.correctChoiceId).length, 1);
    for (const role of ["subject", "verb", "object"]) {
      assert(p.distractors[role] && p.distractors[role] !== p[role], `${segment.id}: ${role}`);
    }
    const plural = p.subject.startsWith("Two ");
    assert((plural ? ["are", "have", "draw"] : ["is", "has", "eats", "washes"]).includes(p.verb));
  }
}
assert.equal(ids.size, 12);
assert.equal(book.spreads.length, 16);
for (const page of [1, ...book.spreads.map(s => s.artPage)]) {
  const asset = `public/images/sota/color/art-p${String(page).padStart(2, "0")}.webp`;
  assert(existsSync(asset), asset);
  const bytes = readFileSync(asset);
  assert.equal(bytes.subarray(8, 12).toString(), "WEBP", asset);
}
console.log("PASS: 3 stories, 12 aligned puzzles with reviewed distractors, 17 So-ta color assets.");
