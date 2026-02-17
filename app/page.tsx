"use client";

import { useEffect, useMemo, useState } from "react";
import { speak, speakQueue } from "@/utils/speak";
import { playBuzz, playChime } from "@/utils/sound";

type Card = {
  id: number;
  subject: string;
  verb: string;
  object: string;
  sentence: string;      // 英文
  image: string;         // 画像パス（例: /images/page_0.png）
};

type Mode = "flash" | "karuta";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Page() {
  const [cards, setCards] = useState<Card[]>([]);
  const [mode, setMode] = useState<Mode>("flash");
  const [choiceCount, setChoiceCount] = useState<number>(4);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);

  const [index, setIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ value: string; isCorrect: boolean } | null>(null);

  // Survival Mode State
  const [isSurvival, setIsSurvival] = useState<boolean>(false);
  const [remainingCards, setRemainingCards] = useState<Card[]>([]);
  const [trickMode, setTrickMode] = useState<boolean>(false);
  const [deckSize, setDeckSize] = useState<number | "all">("all");

  // データ読み込み（public/data/svo_cards.json を想定）
  useEffect(() => {
    (async () => {
      const res = await fetch("/data/svo_cards.json", { cache: "no-store" });
      const data = await res.json();

      // よくある形に寄せて吸収（配列 or {cards:[...]}）
      const arr: any[] = Array.isArray(data) ? data : data?.cards ?? data?.items ?? [];
      const normalized: Card[] = arr
        .map((x, i) => ({
          id: x.id ?? x.cardId ?? i,
          subject: x.subject ?? "",
          verb: x.verb ?? "",
          object: x.object ?? "",
          sentence: x.sentence ?? x.text ?? "",
          image: x.image ?? x.img ?? x.imagePath ?? (x.imageFile ? `/images/${x.imageFile}` : ""),
        }))
        .filter((x) => x.sentence && x.image);

      setCards(normalized);
      setRemainingCards(normalized);
      setIndex(0);
      setScore(0);
      setStreak(0);
    })().catch((e) => {
      console.error(e);
      setCards([]);
    });
  }, []);

  // Determine current pool based on mode
  const activePool = isSurvival ? remainingCards : cards;
  const current = activePool[index];

  // Effect to reset index if out of bounds (e.g. after removing a card)
  useEffect(() => {
    if (index >= activePool.length && activePool.length > 0) {
      setIndex(0);
    }
  }, [activePool.length, index]);

  // 選択肢生成（flash: 文、karuta: 画像）
  const choices = useMemo(() => {
    if (!current || activePool.length === 0) return [];

    if (isSurvival) {
      // Survival Mode:
      // 1. Distractors must come from `activePool` (remaining cards) only.
      // 2. If remaining cards < choiceCount, we show all remaining cards.

      const pool = activePool.filter((c) => c.id !== current.id);
      const maxChoices = Math.min(11, choiceCount);
      // We want (maxChoices - 1) distractors, but we can't take more than what's available.
      const takeN = Math.min(pool.length, maxChoices - 1);

      const others = shuffle(pool).slice(0, takeN);

      if (mode === "flash") {
        return shuffle([current, ...others]).map((c) => c.sentence);
      } else {
        return shuffle([current, ...others]).map((c) => c.image);
      }
    } else {
      // Normal Mode:
      // Always refill from full `cards` deck to maintain `choiceCount`.
      const pool = cards.filter((c) => c.id !== current.id);
      const n = Math.max(2, Math.min(11, choiceCount));
      const others = shuffle(pool).slice(0, n - 1);

      if (mode === "flash") {
        const s = shuffle([current, ...others]).map((c) => c.sentence);
        return s;
      } else {
        const imgs = shuffle([current, ...others]).map((c) => c.image);
        return imgs;
      }
    }
  }, [cards, current, mode, choiceCount, activePool.length]);

  // karuta時に自動で読み上げ
  useEffect(() => {
    if (!current) return;
    if (mode !== "karuta") return;
    if (!autoSpeak) return;

    if (isSurvival && trickMode && activePool.length <= 4) {
      // Trick mode: speak S -> V -> O with intervals
      speakQueue([current.subject, current.verb, current.object], 2000);
    } else {
      speak(current.sentence);
    }
  }, [current, mode, autoSpeak, isSurvival, trickMode, activePool.length]);

  function nextCard() {
    if (activePool.length === 0) return;

    if (!isSurvival) {
      setIndex((i) => (i + 1) % activePool.length);
    } else {
      // If survival, pick random from remaining
      if (activePool.length > 1) {
        const nextIdx = Math.floor(Math.random() * activePool.length);
        setIndex(nextIdx);
      } else {
        setIndex(0);
      }
    }
    setFeedback(null);
  }

  function judgeFlash(selectedSentence: string) {
    if (!current) return;
    const ok = selectedSentence === current.sentence;
    if (ok) {
      setFeedback({ value: selectedSentence, isCorrect: true });
      playChime();

      setTimeout(() => {
        setScore((s) => s + 1);
        setStreak((s) => s + 1);

        if (isSurvival) {
          const newRemaining = remainingCards.filter(c => c.id !== current.id);
          setRemainingCards(newRemaining);

          if (newRemaining.length === 0) {
            alert("Game Cleared! Restarting...");
            setRemainingCards(cards);
            setScore(0);
            setStreak(0);
          }
          setFeedback(null);
        } else {
          nextCard();
        }
      }, 1000);
    } else {
      setStreak(0);
      setFeedback({ value: selectedSentence, isCorrect: false });
      playBuzz();
    }
  }

  function judgeKaruta(selectedImage: string) {
    if (!current) return;
    const ok = selectedImage === current.image;
    if (ok) {
      setFeedback({ value: selectedImage, isCorrect: true });
      playChime();

      setTimeout(() => {
        setScore((s) => s + 1);
        setStreak((s) => s + 1);

        if (isSurvival) {
          const newRemaining = remainingCards.filter(c => c.id !== current.id);
          setRemainingCards(newRemaining);

          if (newRemaining.length === 0) {
            alert("Game Cleared! Restarting...");
            setRemainingCards(cards);
            setScore(0);
            setStreak(0);
          }
          setFeedback(null);
        } else {
          nextCard();
        }
      }, 1000);
    } else {
      setStreak(0);
      setFeedback({ value: selectedImage, isCorrect: false });
      playBuzz();
    }
  }

  if (!current) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ margin: 0 }}>SVO App</h1>
        <p style={{ marginTop: 12 }}>loading...</p>
        <p style={{ opacity: 0.7, marginTop: 8 }}>
          public/data/svo_cards.json が読み込めない場合、パスやJSON形式を確認してください。
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: 0 }}>SVO App</h1>

      {/* 上部コントロール */}
      <div
        style={{
          marginTop: 12,
          border: "1px solid #222",
          borderRadius: 8,
          padding: 10,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ whiteSpace: "nowrap" }}>
          cards: {activePool.length} / score: {score} / streak: {streak}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div>mode</div>
          <button
            onClick={() => setMode("flash")}
            style={{
              padding: "6px 10px",
              border: "1px solid #222",
              borderRadius: 6,
              background: mode === "flash" ? "#eee" : "#fff",
              cursor: "pointer",
            }}
          >
            flash
          </button>
          <button
            onClick={() => setMode("karuta")}
            style={{
              padding: "6px 10px",
              border: "1px solid #222",
              borderRadius: 6,
              background: mode === "karuta" ? "#eee" : "#fff",
              cursor: "pointer",
            }}
          >
            karuta (sentence→image)
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div>choices</div>
          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
            <button
              key={n}
              onClick={() => setChoiceCount(n)}
              style={{
                width: 34,
                height: 34,
                border: "1px solid #222",
                borderRadius: 6,
                background: choiceCount === n ? "#eee" : "#fff",
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ opacity: 0.7 }}>|</div>
          <button
            onClick={() => setAutoSpeak((v) => !v)}
            style={{
              padding: "6px 10px",
              border: "1px solid #222",
              borderRadius: 6,
              background: autoSpeak ? "#eee" : "#fff",
              cursor: "pointer",
            }}
            title="karuta時に自動で読み上げ"
          >
            auto speak: {autoSpeak ? "on" : "off"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ opacity: 0.7 }}>|</div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 14 }}>Deck:</span>
            <select
              value={deckSize}
              onChange={(e) => setDeckSize(e.target.value === "all" ? "all" : Number(e.target.value))}
              style={{ padding: 4, borderRadius: 4, border: "1px solid #ccc" }}
              disabled={isSurvival} // Disable while playing survival
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="all">All</option>
            </select>
          </div>

          <button
            onClick={() => {
              const newVal = !isSurvival;
              setIsSurvival(newVal);
              if (newVal) {
                const targetCount = deckSize === "all" ? cards.length : Number(deckSize);
                const shuffled = shuffle(cards);
                setRemainingCards(shuffled.slice(0, targetCount));
                setScore(0);
                setStreak(0);
                setIndex(0);
              } else {
                setRemainingCards(cards); // Sync back just in case
              }
            }}
            style={{
              padding: "6px 10px",
              border: "1px solid #222",
              borderRadius: 6,
              background: isSurvival ? "#ffddd5" : "#fff",
              cursor: "pointer",
            }}
          >
            Survival Mode: {isSurvival ? "ON" : "OFF"}
          </button>
        </div>

        {isSurvival && remainingCards.length <= 4 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ opacity: 0.7 }}>|</div>
            <button
              onClick={() => setTrickMode(!trickMode)}
              style={{
                padding: "6px 10px",
                border: "1px solid #222",
                borderRadius: 6,
                background: trickMode ? "#d5efff" : "#fff",
                cursor: "pointer",
              }}
            >
              Trick Mode: {trickMode ? "ON" : "OFF"}
            </button>
          </div>
        )}
      </div>

      {/* 問題エリア */}
      <div
        style={{
          marginTop: 14,
          border: "1px solid #222",
          borderRadius: 8,
          padding: 12,
          display: "grid",
          gridTemplateColumns: mode === "flash" ? "1fr 420px" : "1fr",
          gap: 12,
        }}
      >
        {mode === "flash" ? (
          <>
            {/* 左: 画像 */}
            <div>
              <div style={{ marginBottom: 10, opacity: 0.8 }}>
                flash: pick the correct sentence for this image
              </div>
              <div
                style={{
                  border: "1px solid #222",
                  borderRadius: 8,
                  padding: 10,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 360,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.image}
                  alt="card"
                  style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
                />
              </div>
            </div>

            {/* 右: 選択肢（文） */}
            <div>
              <div style={{ marginBottom: 10 }}>choose one</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {choices.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => judgeFlash(String(s))}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      border: feedback?.value === String(s)
                        ? `2px solid ${feedback.isCorrect ? "green" : "red"}`
                        : "1px solid #222",
                      borderRadius: 8,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {String(s)}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* karuta: ターゲット文を常に表示 + 🔊 */}
            <div
              style={{
                border: "1px solid #222",
                borderRadius: 8,
                padding: 10,
                display: "flex",
                gap: 10,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ opacity: 0.8 }}>target:</div>
                <div style={{ fontSize: 18 }}>{current.sentence}</div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => {
                    if (isSurvival && trickMode && activePool.length <= 4) {
                      speakQueue([current.subject, current.verb, current.object], 2000);
                    } else {
                      speak(current.sentence);
                    }
                  }}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #222",
                    borderRadius: 6,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                  title="読み上げ"
                >
                  🔊 speak
                </button>
                <button
                  onClick={nextCard}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #222",
                    borderRadius: 6,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  skip
                </button>
              </div>
            </div>

            {/* 画像候補 */}
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {choices.map((img, i) => (
                <button
                  key={i}
                  onClick={() => judgeKaruta(String(img))}
                  style={{
                    border: feedback?.value === String(img)
                      ? `2px solid ${feedback.isCorrect ? "green" : "red"}`
                      : "1px solid #222",
                    borderRadius: 8,
                    background: "#fff",
                    cursor: "pointer",
                    padding: 10,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={String(img)}
                    alt={`choice-${i}`}
                    style={{ width: "100%", height: 220, objectFit: "contain", display: "block" }}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
