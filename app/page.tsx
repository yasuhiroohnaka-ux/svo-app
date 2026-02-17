'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Card } from '@/types';

type Mode = 'flash' | 'karuta_sentence_to_image';
type ArticleMode = 'hard' | 'easy';

type SpeechRecWindow = Window & {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function nowMs(): number {
  return Date.now();
}

function norm(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[.?!]/g, '')
    .replace(/’/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function isCorrectSpoken(heard: string, expected: string, mode: ArticleMode): boolean {
  let h = norm(heard);
  let e = norm(expected);

  if (mode === 'easy') {
    // reduce both to no-article version
    h = h.replace(/\b(a|an|the)\b/g, '').replace(/\s+/g, ' ').trim();
    e = e.replace(/\b(a|an|the)\b/g, '').replace(/\s+/g, ' ').trim();
  } else {
    // hard mode: strict on articles (allow a/an swap typically due to recognition fuzziness, or keep strict?)
    // keeping a/an swap for robustness against bad mic/engine, but ensuring article is present.
    h = h.replace(/\ban\b/g, 'a');
    e = e.replace(/\ban\b/g, 'a');
  }

  if (h === e) return true;

  // 余計な語がついても、expected を含んでいたらOK
  if (h.includes(e)) return true;

  return false;
}

export default function Page() {
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('flash');
  const [articleMode, setArticleMode] = useState<ArticleMode>('easy');

  // 共通スコア
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // flash: 2〜5択（画像→文）
  const [flashChoicesCount, setFlashChoicesCount] = useState<number>(4);
  const [flashIndex, setFlashIndex] = useState<number>(0);
  const [flashChoices, setFlashChoices] = useState<Card[]>([]);
  const [flashLockedUntil, setFlashLockedUntil] = useState<number>(0);
  const [flashFeedback, setFlashFeedback] = useState<string>('');

  // flash: 音声判別
  const [flashSrEnabled, setFlashSrEnabled] = useState(false);
  const [flashListening, setFlashListening] = useState(false);
  const [flashHeard, setFlashHeard] = useState('');
  const [flashSrStatus, setFlashSrStatus] = useState<string>('');
  const srRef = useRef<any>(null);

  // karuta: 文→画像（場8枚、15秒）
  const KARUTA_BOARD_SIZE = 8;
  const KARUTA_TIME_LIMIT_MS = 15_000;
  const LOCK_MS = 1_500;

  const [karutaBoard, setKarutaBoard] = useState<Card[]>([]);
  const [karutaPrompt, setKarutaPrompt] = useState<Card | null>(null);
  const [karutaRemainingMs, setKarutaRemainingMs] = useState<number>(KARUTA_TIME_LIMIT_MS);
  const [karutaLockedUntil, setKarutaLockedUntil] = useState<number>(0);
  const [karutaRound, setKarutaRound] = useState<number>(0);
  const [karutaFeedback, setKarutaFeedback] = useState<string>('');

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    fetch('/data/svo_cards.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Card[]) => setCards(data))
      .catch((e) => setError(String(e)));
  }, []);

  // cardsが入ったら初期化
  useEffect(() => {
    if (cards.length === 0) return;
    setFlashIndex(0);
    setScore(0);
    setStreak(0);
  }, [cards.length]);

  // mode切替時：タイマー止める＆各モード初期化
  useEffect(() => {
    stopTimer();
    stopFlashListening();
    setFlashFeedback('');
    setKarutaFeedback('');

    if (cards.length === 0) return;

    if (mode === 'flash') {
      initFlashRound(0);
    } else {
      startKarutaRound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cards.length]);

  // flash: 選択肢数変更時に作り直す
  useEffect(() => {
    if (mode !== 'flash') return;
    if (cards.length === 0) return;
    initFlashRound(flashIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashChoicesCount]);

  function stopTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // SpeechRecognition
  function getRecognizer(): any | null {
    if (typeof window === 'undefined') return null;
    const w = window as SpeechRecWindow;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return null;
    return new SR();
  }

  function stopFlashListening() {
    try {
      srRef.current?.stop?.();
    } catch { }
    setFlashListening(false);
  }

  function startFlashListening() {
    const base = cards[flashIndex];
    if (!base) return;

    const rec = getRecognizer();
    if (!rec) {
      setFlashSrStatus('speech recognition not supported in this browser');
      setFlashSrEnabled(false);
      return;
    }

    setFlashSrStatus('');
    setFlashHeard('');
    setFlashListening(true);

    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcript = transcript.trim();
      setFlashHeard(transcript);

      const last = event.results[event.results.length - 1];
      const isFinal = last?.isFinal;

      if (isFinal) {
        const ok = isCorrectSpoken(transcript, base.sentence, articleMode);
        if (ok) {
          setFlashFeedback('correct (voice)');
          setScore((s) => s + 1);
          setStreak((st) => st + 1);

          const nextIdx = getNextFlashIndex(flashIndex);
          setFlashIndex(nextIdx);
          initFlashRound(nextIdx);

          stopFlashListening();
        } else {
          setFlashFeedback('wrong (voice)');
          setStreak(0);
        }
      }
    };

    rec.onerror = (e: any) => {
      setFlashSrStatus(`sr error: ${e?.error ?? 'unknown'}`);
      setFlashListening(false);
    };

    rec.onend = () => {
      setFlashListening(false);
    };

    srRef.current = rec;
    try {
      rec.start();
    } catch (e: any) {
      setFlashSrStatus(`sr start failed: ${String(e)}`);
      setFlashListening(false);
    }
  }

  // pairId を「寄せて」出題するための次カード候補
  function getNextFlashIndex(current: number): number {
    if (cards.length <= 1) return 0;

    const cur = cards[current];
    const pair = cards.find((c, idx) => idx !== current && c.pairId === cur.pairId);
    if (pair) {
      const idx = cards.findIndex((c) => c.cardId === pair.cardId);
      if (idx !== -1) return idx;
    }
    return (current + 1) % cards.length;
  }

  function initFlashRound(index: number) {
    const base = cards[index];
    const n = clamp(flashChoicesCount, 2, 5);

    const others = shuffle(cards.filter((c) => c.cardId !== base.cardId)).slice(0, n - 1);
    const choices = shuffle([base, ...others]);

    setFlashChoices(choices);
    setFlashFeedback('');
  }

  function handleFlashChoose(chosen: Card) {
    const t = nowMs();
    if (t < flashLockedUntil) return;

    const base = cards[flashIndex];
    const correct = chosen.cardId === base.cardId;

    if (correct) {
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
      setFlashFeedback('correct');

      const nextIdx = getNextFlashIndex(flashIndex);
      setFlashIndex(nextIdx);
      initFlashRound(nextIdx);
    } else {
      setStreak(0);
      setFlashFeedback('wrong');
      setFlashLockedUntil(t + LOCK_MS);
    }
  }

  function startKarutaRound() {
    if (cards.length === 0) return;

    setKarutaRound((r) => r + 1);

    let prompt: Card | null = null;

    if (karutaPrompt) {
      const mate = cards.find((c) => c.pairId === karutaPrompt.pairId && c.cardId !== karutaPrompt.cardId);
      if (mate) prompt = mate;
    }
    if (!prompt) prompt = pickRandom(cards);
    if (!prompt) return;

    const pool = cards.filter((c) => c.cardId !== prompt!.cardId);
    const needed = Math.max(0, KARUTA_BOARD_SIZE - 1);
    const picked = shuffle(pool).slice(0, needed);
    const board = shuffle([prompt, ...picked]);

    setKarutaPrompt(prompt);
    setKarutaBoard(board);
    setKarutaRemainingMs(KARUTA_TIME_LIMIT_MS);
    setKarutaFeedback('');
    setKarutaLockedUntil(0);

    stopTimer();
    const startedAt = nowMs();
    timerRef.current = window.setInterval(() => {
      const elapsed = nowMs() - startedAt;
      const remain = Math.max(0, KARUTA_TIME_LIMIT_MS - elapsed);
      setKarutaRemainingMs(remain);
      if (remain <= 0) {
        stopTimer();
        setStreak(0);
        setKarutaFeedback('time up');
        window.setTimeout(() => {
          startKarutaRound();
        }, 500);
      }
    }, 100);
  }

  function handleKarutaPick(chosen: Card) {
    const t = nowMs();
    if (t < karutaLockedUntil) return;
    if (!karutaPrompt) return;

    const correct = chosen.cardId === karutaPrompt.cardId;

    if (correct) {
      stopTimer();
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
      setKarutaFeedback('correct');
      window.setTimeout(() => {
        startKarutaRound();
      }, 400);
    } else {
      setStreak(0);
      setKarutaFeedback('wrong');
      setKarutaLockedUntil(t + LOCK_MS);
    }
  }

  const isFlashLocked = useMemo(() => nowMs() < flashLockedUntil, [flashLockedUntil]);
  const isKarutaLocked = useMemo(() => nowMs() < karutaLockedUntil, [karutaLockedUntil]);

  const flashCard = useMemo(() => {
    if (cards.length === 0) return null;
    return cards[flashIndex] ?? null;
  }, [cards, flashIndex]);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl">SVO App</h1>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-gray-700">
            cards: {cards.length} / score: {score} / streak: {streak}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">mode</span>
            <button
              className={`px-3 py-1 rounded border ${mode === 'flash' ? 'bg-gray-100' : ''}`}
              onClick={() => setMode('flash')}
            >
              flash
            </button>
            <button
              className={`px-3 py-1 rounded border ${mode === 'karuta_sentence_to_image' ? 'bg-gray-100' : ''}`}
              onClick={() => setMode('karuta_sentence_to_image')}
            >
              karuta (sentence→image)
            </button>
          </div>

          {mode === 'flash' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-700">choices</span>
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`px-2 py-1 rounded border ${flashChoicesCount === n ? 'bg-gray-100' : ''}`}
                  onClick={() => setFlashChoicesCount(n)}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-gray-500">(image→sentence)</span>

              <span className="mx-2 text-gray-300">|</span>

              <button
                className={`px-3 py-1 rounded border ${flashSrEnabled ? 'bg-gray-100' : ''}`}
                onClick={() => {
                  const next = !flashSrEnabled;
                  setFlashSrEnabled(next);
                  setFlashSrStatus('');
                  setFlashHeard('');
                  setFlashFeedback('');
                  if (!next) stopFlashListening();
                }}
              >
                voice judge: {flashSrEnabled ? 'on' : 'off'}
              </button>

              {flashSrEnabled && (
                <>
                  <button
                    className="px-3 py-1 rounded border"
                    onClick={() => (flashListening ? stopFlashListening() : startFlashListening())}
                  >
                    {flashListening ? 'stop' : 'start'}
                  </button>

                  <span className="text-xs text-gray-600">
                    heard: {flashHeard ? `"${flashHeard}"` : '...'}
                  </span>

                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-gray-700">voice mode:</span>
                    <button
                      className={`px-2 py-0.5 text-sm rounded border ${articleMode === 'easy' ? 'bg-green-100' : ''}`}
                      onClick={() => setArticleMode('easy')}
                      title="Articles (a, an, the) are ignored"
                    >
                      Easy
                    </button>
                    <button
                      className={`px-2 py-0.5 text-sm rounded border ${articleMode === 'hard' ? 'bg-red-100' : ''}`}
                      onClick={() => setArticleMode('hard')}
                      title="Articles must be accurate"
                    >
                      Hard
                    </button>
                  </div>
                </>
              )}

              {flashSrStatus && <span className="text-xs text-red-600">{flashSrStatus}</span>}
            </div>
          )}
        </div>

        {error && <div className="text-red-600 text-sm">Error: {error}</div>}
        {!error && cards.length === 0 && <div className="text-sm text-gray-700">loading...</div>}
      </div>

      {mode === 'flash' && flashCard && (
        <section className="rounded-lg border p-4 space-y-4">
          <div className="text-sm text-gray-600">flash: pick the correct sentence for this image</div>

          <div className="grid md:grid-cols-2 gap-4 items-start">
            <div className="space-y-2">
              <img
                src={`/images/${flashCard.imageFile}`}
                alt={flashCard.sentence}
                className="w-full h-auto rounded border"
              />
              <div className="text-xs text-gray-600">
                card {flashCard.cardId} / page {flashCard.page} / pair {flashCard.pairId}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-700">
                {isFlashLocked ? 'locked...' : 'choose one'}
                {flashFeedback ? ` / ${flashFeedback}` : ''}
                {flashSrEnabled ? ` / voice: ${flashListening ? 'listening' : 'idle'}` : ''}
              </div>

              <div className="grid gap-2">
                {flashChoices.map((c) => (
                  <button
                    key={c.cardId}
                    className="text-left rounded border px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => handleFlashChoose(c)}
                    disabled={isFlashLocked || (flashSrEnabled && flashListening)}
                  >
                    {c.sentence}
                  </button>
                ))}
              </div>

              {flashSrEnabled && (
                <div className="text-xs text-gray-600">
                  tip: start → 英文をそのまま読む → うまく認識されたら自動で正解になります
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {mode === 'karuta_sentence_to_image' && (
        <section className="rounded-lg border p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-gray-600">karuta: pick the correct image for the sentence</div>
            <div className="text-sm text-gray-700">
              time: {Math.ceil(karutaRemainingMs / 1000)}s
              {isKarutaLocked ? ' / locked...' : ''}
              {karutaFeedback ? ` / ${karutaFeedback}` : ''}
            </div>
          </div>

          <div className="rounded border p-3 bg-gray-50">
            <div className="text-xs text-gray-600">round {karutaRound}</div>
            <div className="text-lg">{karutaPrompt ? karutaPrompt.sentence : '...'}</div>
            {karutaPrompt && (
              <div className="text-xs text-gray-600">
                S: {karutaPrompt.subject} / V: {karutaPrompt.verb} / O: {karutaPrompt.object} / pair {karutaPrompt.pairId}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {karutaBoard.map((c) => (
              <button
                key={c.cardId}
                className="rounded border p-2 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => handleKarutaPick(c)}
                disabled={isKarutaLocked}
                title={c.sentence}
              >
                <img src={`/images/${c.imageFile}`} alt={c.sentence} className="w-full h-auto rounded" />
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border" onClick={() => startKarutaRound()}>
              next round
            </button>
            <button
              className="px-3 py-1 rounded border"
              onClick={() => {
                stopTimer();
                setScore(0);
                setStreak(0);
                setKarutaFeedback('');
                startKarutaRound();
              }}
            >
              reset
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
