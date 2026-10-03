import { describe, expect, it } from "vitest";

import { isVoiceAnswerCorrect } from "./voice";

describe("isVoiceAnswerCorrect", () => {
  it("ignores articles, be-verbs, case and punctuation", () => {
    expect(isVoiceAnswerCorrect("eraser under chair", "The eraser is under the chair.")).toBe(true);
  });

  it("requires prepositions and negations that change the meaning", () => {
    expect(isVoiceAnswerCorrect("the eraser is on the chair", "The eraser is under the chair.")).toBe(false);
    expect(isVoiceAnswerCorrect("the monkey is sleepy", "The monkey is not sleepy.")).toBe(false);
  });

  it("rejects answers that share too few words", () => {
    expect(isVoiceAnswerCorrect("a dog", "The eraser is under the chair.")).toBe(false);
  });

  it("is lenient: half of the content words is enough (current behavior)", () => {
    // 子どもの発話は聞き取りが不安定なのでゆるめにしている。目的語だけ違っても正解になる点に注意
    expect(isVoiceAnswerCorrect("the eraser is under the desk", "The eraser is under the chair.")).toBe(true);
  });
});
