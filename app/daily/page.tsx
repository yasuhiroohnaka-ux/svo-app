"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import AnswerMark from "@/app/components/AnswerMark";
import AppHeader from "@/app/components/AppHeader";
import ResultDialog from "@/app/components/ResultDialog";
import RewardSummary from "@/app/components/RewardSummary";
import StarRating from "@/app/components/StarRating";
import { mistakesStore, recordMistake, resolveMistake, weakIds } from "@/app/lib/mistakes";
import { usePersistentStore } from "@/app/lib/persistentStore";
import { localDateStamp } from "@/app/lib/random";
import { recordDaily, rewardsStore, starsFromAccuracy, type DailyRecord, type RecordResult } from "@/app/lib/rewards";
import { normalizeCards } from "@/app/svo/data";
import { playBuzz, playChime, unlockAudio } from "@/utils/sound";
import { cancelSpeech, speak, unlockSpeech } from "@/utils/speak";

import { buildDailyQuestions, type DailyQuestion, type QuizCard } from "./questions";
import styles from "./daily.module.css";

type Phase = "loading" | "ready" | "playing" | "error";

const KIND_LABEL: Record<DailyQuestion["kind"], string> = {
  listen: "🔊 きいて、あう えを えらぼう",
  read: "👀 えを みて、あう ぶんを えらぼう",
  yesno: "❓ Yes か No で こたえよう",
  sound: "🔤 おとを きいて、あう もじを えらぼう",
};

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

function playAudio(src: string) {
  try {
    void new Audio(src).play().catch(() => undefined);
  } catch {
    // 音が出せない環境では なにもしない
  }
}

export default function DailyPage() {
  const router = useRouter();
  const rewards = usePersistentStore(rewardsStore);
  const [today, setToday] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [correctChoice, setCorrectChoice] = useState<string | null>(null);
  const [firstTryCount, setFirstTryCount] = useState(0);
  const [result, setResult] = useState<(RecordResult & { daily: DailyRecord }) | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchJson("/data/svo_cards.json"), fetchJson("/data/quiz_data.json")])
      .then(([svoRaw, quizRaw]) => {
        if (cancelled) return;
        const date = localDateStamp();
        const mistakes = mistakesStore.get();
        setToday(date);
        setQuestions(
          buildDailyQuestions(date, {
            // 並びが毎回変わらないよう、読みこんだ順(シャッフルなし)で わたす
            svoCards: normalizeCards(svoRaw),
            quizCards: Array.isArray(quizRaw) ? (quizRaw as QuizCard[]) : [],
            weakSvo: weakIds(mistakes, "svo"),
            weakQuiz: weakIds(mistakes, "quiz"),
          }),
        );
        setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(
    () => () => {
      cancelSpeech();
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  const current = questions[index];

  const readAloud = useCallback((question: DailyQuestion | undefined) => {
    if (!question) return;
    if (question.kind === "listen") speak(question.sentence);
    if (question.kind === "yesno") speak(question.question.text);
    if (question.kind === "sound") playAudio(question.audio);
  }, []);

  const start = () => {
    unlockAudio();
    unlockSpeech();
    setIndex(0);
    setWrong(new Set());
    setCorrectChoice(null);
    setFirstTryCount(0);
    setResult(null);
    setPhase("playing");
    setTimeout(() => readAloud(questions[0]), 300);
  };

  const finish = (firstTry: number) => {
    const clearedToday = localDateStamp();
    const record = recordDaily(clearedToday, localDateStamp(new Date(), -1), starsFromAccuracy(firstTry, questions.length));
    setResult(record);
  };

  const answer = (choice: string) => {
    if (!current || correctChoice || wrong.has(choice)) return;
    const isCorrect =
      (current.kind === "listen" && choice === current.answerId) ||
      (current.kind === "read" && choice === current.answer) ||
      (current.kind === "yesno" && choice === current.answer) ||
      (current.kind === "sound" && choice === current.answerId);

    if (!isCorrect) {
      playBuzz();
      setWrong((prev) => new Set(prev).add(choice));
      // ふくしゅう問題で また まちがえたら、にがての ままにする。ふつうの問題なら にがてに 追加
      if (!current.review && (current.kind === "listen" || current.kind === "read")) {
        recordMistake(current.kind === "listen" ? "svo" : "quiz", current.cardId);
      }
      return;
    }

    playChime();
    setCorrectChoice(choice);
    const firstTry = wrong.size === 0;
    const nextFirstTry = firstTryCount + (firstTry ? 1 : 0);
    setFirstTryCount(nextFirstTry);
    if (current.review && firstTry && (current.kind === "listen" || current.kind === "read")) {
      resolveMistake(current.kind === "listen" ? "svo" : "quiz", current.cardId);
    }

    advanceTimer.current = setTimeout(() => {
      setCorrectChoice(null);
      setWrong(new Set());
      if (index + 1 >= questions.length) {
        finish(nextFirstTry);
        return;
      }
      setIndex(index + 1);
      readAloud(questions[index + 1]);
    }, 1000);
  };

  const doneToday = today !== "" && rewards.daily.lastDate === today;
  const todayStars = today ? rewards.stars[`daily:${today}`] : undefined;
  const streak = doneToday || rewards.daily.lastDate === localDateStamp(new Date(), -1) ? rewards.daily.streak : 0;

  const choiceState = (choice: string) => (correctChoice === choice ? true : wrong.has(choice) ? false : null);

  return (
    <main className={styles.page}>
      <AppHeader title="きょうの ダンジョン" accent="var(--highlight)" />

      {phase === "loading" && <p className={styles.center}>じゅんびちゅう...</p>}
      {phase === "error" && (
        <div className={styles.center}>
          <p>よみこみに しっぱいしました。</p>
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              setPhase("loading");
              setReloadKey((key) => key + 1);
            }}
          >
            もういちど
          </button>
        </div>
      )}

      {phase === "ready" && (
        <section className={styles.gate}>
          <div className={styles.gateIcon} aria-hidden="true">
            🗝️
          </div>
          <p className={styles.date}>{today.replace(/-/g, " / ")}</p>
          <h2 className={styles.gateTitle}>きょうの 5もん</h2>
          <p className={styles.gateText}>
            4つの へやから、もんだいが でるよ。
            {questions.some((q) => q.review) && (
              <>
                <br />
                🔁 まえに まちがえた カードの ふくしゅうも あるよ。
              </>
            )}
          </p>
          <p className={styles.streak}>🔥 れんぞく {streak}にち</p>
          {doneToday && todayStars && (
            <p className={styles.done}>
              きょうは クリアずみ <StarRating stars={todayStars} size="sm" />
            </p>
          )}
          <button type="button" className={styles.primary} onClick={start}>
            {doneToday ? "もういちど ちょうせん" : "ダンジョンに はいる"}
          </button>
        </section>
      )}

      {phase === "playing" && current && (
        <section className={styles.question} aria-live="polite">
          <div className={styles.progress} aria-label={`${index + 1} / ${questions.length} もんめ`}>
            {questions.map((q, i) => (
              <span key={q.id} className={i < index ? styles.stepDone : i === index ? styles.stepNow : styles.step} />
            ))}
          </div>
          <p className={styles.kind}>
            {current.review && <span className={styles.reviewBadge}>🔁 ふくしゅう</span>}
            {KIND_LABEL[current.kind]}
          </p>

          {current.kind !== "read" && (
            <button type="button" className={styles.listen} onClick={() => readAloud(current)}>
              🔊 もういちど きく
            </button>
          )}

          {current.kind === "listen" && (
            <div className={styles.imageGrid}>
              {current.choices.map((choice, i) => (
                <button
                  key={choice.id}
                  type="button"
                  className={styles.imageChoice}
                  onClick={() => answer(choice.id)}
                  disabled={wrong.has(choice.id)}
                >
                  <Image src={choice.image} alt={`えのカード ${i + 1}`} width={272} height={194} sizes="(max-width: 600px) 45vw, 260px" />
                  {choiceState(choice.id) !== null && <AnswerMark correct={choiceState(choice.id) === true} />}
                </button>
              ))}
            </div>
          )}

          {current.kind === "read" && (
            <>
              <div className={styles.picture}>
                <Image src={current.image} alt="もんだいの え" width={400} height={400} sizes="(max-width: 600px) 80vw, 360px" />
              </div>
              <div className={styles.textChoices}>
                {current.choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={styles.textChoice}
                    onClick={() => answer(choice)}
                    disabled={wrong.has(choice)}
                  >
                    {choice}
                    {choiceState(choice) !== null && <AnswerMark correct={choiceState(choice) === true} placement="end" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {current.kind === "yesno" && (
            <>
              <div className={styles.noun}>
                <span className={styles.nounIcon} aria-hidden="true">
                  {current.noun.icon}
                </span>
                <span className={styles.nounWord}>{current.noun.word}</span>
                <span className={styles.nounJa}>{current.noun.ja}</span>
              </div>
              <p className={styles.yesnoQuestion}>
                {current.question.text}
                <small>{current.question.ja}</small>
              </p>
              <div className={styles.yesno}>
                {(["yes", "no"] as const).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={choice === "yes" ? styles.yes : styles.no}
                    onClick={() => answer(choice)}
                    disabled={wrong.has(choice)}
                  >
                    {choice === "yes" ? "Yes!" : "No!"}
                    {choiceState(choice) !== null && <AnswerMark correct={choiceState(choice) === true} />}
                  </button>
                ))}
              </div>
            </>
          )}

          {current.kind === "sound" && (
            <div className={styles.letters}>
              {current.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className={styles.letter}
                  onClick={() => answer(choice.id)}
                  disabled={wrong.has(choice.id)}
                >
                  {choice.symbol}
                  {choiceState(choice.id) !== null && <AnswerMark correct={choiceState(choice.id) === true} />}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {result && (
        <ResultDialog
          title="きょうの ダンジョン クリア!"
          actions={[
            { label: "いりぐちへ", onClick: () => router.push("/") },
            {
              label: "もういちど",
              variant: "secondary",
              onClick: () => {
                setResult(null);
                setPhase("ready");
              },
            },
          ]}
        >
          <p style={{ margin: 0 }}>
            1かいで せいかい {firstTryCount} / {questions.length}
          </p>
          <RewardSummary result={result} />
          <p className={styles.resultStreak}>🔥 れんぞく {result.daily.streak}にち!</p>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            <Link href="/treasures">たからものを みる →</Link>
          </p>
        </ResultDialog>
      )}
    </main>
  );
}
