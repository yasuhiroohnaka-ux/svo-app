/**
 * 音声認識の答え合わせ(ゆるめ判定)。
 * - 冠詞・be 動詞は聞き取りが不安定なので無視する
 * - 前置詞・否定語は意味が変わるので、お手本にあれば必ず言えている必要がある
 * - それ以外は、お手本の単語の半分以上が聞き取れていれば正解
 */
const STOP_WORDS = ["the", "a", "an", "is", "are", "am", "be", "was", "were"];
const CRITICAL_WORDS = ["on", "in", "under", "by", "at", "to", "from", "with", "next", "between", "not", "no", "never"];

function toWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOP_WORDS.includes(word));
}

export function isVoiceAnswerCorrect(spoken: string, expected: string): boolean {
  const expectedWords = toWords(expected);
  const spokenWords = toWords(spoken);

  const missingCritical = expectedWords.some((word) => CRITICAL_WORDS.includes(word) && !spokenWords.includes(word));
  if (missingCritical) return false;

  const matchCount = expectedWords.filter((word) => spokenWords.includes(word)).length;
  const baseLength = expectedWords.length > 0 ? expectedWords.length : 1;
  return matchCount / baseLength >= 0.5;
}
