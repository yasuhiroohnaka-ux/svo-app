"use client";

import { useEffect, useMemo, useState } from "react";
import { speak } from "@/utils/speak";
import { playBuzz } from "@/utils/sound";

type Card = {
  id?: string | number;
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
  const [wrongChoice, setWrongChoice] = useState<string | null>(null);

  // データ読み込み（public/data/svo_cards.json を想定）
  useEffect(() => {
    (async () => {
      const res = await fetch("/data/svo_cards.json", { cache: "no-store" });
      const data = await res.json();

      // よくある形に寄せて吸収（配列 or {cards:[...]}）
      const arr: any[] = Array.isArray(data) ? data : data?.cards ?? data?.items ?? [];
      const normalized: Card[] = arr
        .map((x, i) => ({
          id: x.id ?? i,
          sentence: x.sentence ?? x.text ?? "",
          image: x.image ?? x.img ?? x.imagePath ?? (x.imageFile ? `/images/${x.imageFile}` : ""),
        }))
        .filter((x) => x.sentence && x.image);

      setCards(normalized);
      setIndex(0);
      setScore(0);
      setStreak(0);
    })().catch((e) => {
      console.error(e);
      setCards([]);
    });
  }, []);

  const current = cards[index];

  // 選択肢生成（flash: 文、karuta: 画像）
  const choices = useMemo(() => {
    if (!current || cards.length < 2) return [];

    const pool = cards.filter((c) => c !== current);
    const n = Math.max(2, Math.min(8, choiceCount));
    const others = shuffle(pool).slice(0, n - 1);

    if (mode === "flash") {
      // 正解文 + ダミー文
      const s = shuffle([current, ...others]).map((c) => c.sentence);
      return s;
    } else {
      // 正解画像 + ダミー画像
      const imgs = shuffle([current, ...others]).map((c) => c.image);
      return imgs;
    }
  }, [cards, current, mode, choiceCount]);

  // karuta時のターゲット文を自動読み上げ
  useEffect(() => {
    if (!current) return;
    if (mode !== "karuta") return;
    if (!autoSpeak) return;
    speak(current.sentence);
  }, [current?.sentence, mode, autoSpeak]);

  function nextCard() {
    if (cards.length === 0) return;
    setIndex((i) => (i + 1) % cards.length);
    setWrongChoice(null);
  }

  function judgeFlash(selectedSentence: string) {
    if (!current) return;
    const ok = selectedSentence === current.sentence;
    if (ok) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      nextCard();
    } else {
      setStreak(0);
    }
  }

  function judgeKaruta(selectedImage: string) {
    if (!current) return;
    const ok = selectedImage === current.image;
    if (ok) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      nextCard();
    } else {
      setStreak(0);
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

      {/* 上部コントロール（スクショの雰囲気に寄せた） */}
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
          cards: {cards.length} / score: {score} / streak: {streak}
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
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
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
                      border: wrongChoice === String(s) ? "2px solid red" : "1px solid #222",
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
                  onClick={() => speak(current.sentence)}
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
                    border: wrongChoice === String(img) ? "2px solid red" : "1px solid #222",
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
