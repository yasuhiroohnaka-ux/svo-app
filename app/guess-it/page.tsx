"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "@/app/components/AppHeader";
import SpeedControl from "@/app/components/SpeedControl";
import { cancelSpeech, speakQueue, unlockSpeech } from "@/utils/speak";
import styles from "./page.module.css";
import {
  type NounItem,
  type Question,
  type QuestionMode,
  NOUNS,
  CATEGORY_LABELS,
  YES_LINES,
  NO_LINES,
  getArticle,
  getAnswerQuestion,
  sample,
  normalize,
  findGuessItem,
  buildQuestionDeck,
} from "./data";

type HistoryEntry = {
  id: string;
  question: string;
  questionJa: string;
  answer: "yes" | "no";
  response: string;
};

type Phase = "idle" | "spinning" | "playing" | "guessing" | "finished";

type DisplayMode = "easy" | "challenge";

export default function GuessItPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [target, setTarget] = useState<NounItem | null>(null);
  const [rouletteWord, setRouletteWord] = useState("???");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("easy");
  const [questionMode, setQuestionMode] = useState<QuestionMode>("guided");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeResponse, setActiveResponse] = useState<HistoryEntry | null>(null);
  const [guess, setGuess] = useState("");
  const [lastGuess, setLastGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [roundSeed, setRoundSeed] = useState(3);
  const [teacherPeek, setTeacherPeek] = useState(false);
  const rouletteTimer = useRef<NodeJS.Timeout | null>(null);

  const showJapanese = displayMode === "easy";
  const visibleQuestions = useMemo(() => buildQuestionDeck(target, roundSeed, questionMode), [questionMode, roundSeed, target]);

  const clearRoulette = useCallback(() => {
    if (rouletteTimer.current) {
      clearInterval(rouletteTimer.current);
      rouletteTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearRoulette();
      cancelSpeech();
    };
  }, [clearRoulette]);

  const startQuiz = useCallback(() => {
    unlockSpeech();
    clearRoulette();
    cancelSpeech();

    const nextTarget = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    let tick = 0;
    const maxTicks = 26;

    setPhase("spinning");
    setTarget(null);
    setHistory([]);
    setActiveResponse(null);
    setGuess("");
    setLastGuess("");
    setAttempts(0);
    setTeacherPeek(false);
    setRouletteWord("???");

    rouletteTimer.current = setInterval(() => {
      const item = NOUNS[(tick * 7 + Math.floor(Math.random() * NOUNS.length)) % NOUNS.length];
      setRouletteWord(item.word);
      tick += 1;

      if (tick >= maxTicks) {
        clearRoulette();
        setRoundSeed(Date.now());
        setTarget(nextTarget);
        setRouletteWord("Locked!");
        setPhase("playing");
        if (voiceEnabled) {
          speakQueue(["I have a word.", "Ask me yes or no questions."], 350, "en-US");
        }
      }
    }, 82);
  }, [clearRoulette, voiceEnabled]);

  const askQuestion = useCallback(
    (question: Question) => {
      if (!target || phase !== "playing") return;

      unlockSpeech();
      const answer = target.facts[question.key] === true ? "yes" : "no";
      const response = sample(answer === "yes" ? YES_LINES[question.reply] : NO_LINES[question.reply], history.length);
      const entry: HistoryEntry = {
        id: `${question.id}-${Date.now()}`,
        question: question.text,
        questionJa: question.ja,
        answer,
        response,
      };

      setActiveResponse(entry);
      setHistory((current) => [entry, ...current].slice(0, 9));
      if (voiceEnabled) {
        speakQueue([question.text, response], 420, "en-US");
      }
    },
    [history.length, phase, target, voiceEnabled],
  );

  const openGuess = useCallback(() => {
    if (!target || phase !== "playing") return;
    unlockSpeech();
    setPhase("guessing");
    setGuess("");
    if (voiceEnabled) speakQueue(["I got it!"], 0, "en-US");
  }, [phase, target, voiceEnabled]);

  const submitGuess = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!target) return;

      const guessText = guess.trim();
      if (!guessText) return;

      unlockSpeech();
      const matched = findGuessItem(guessText);
      const isCorrect = matched?.id === target.id || normalize(guessText) === normalize(target.word) || normalize(guessText) === normalize(target.ja);
      const spokenQuestion = matched ? getAnswerQuestion(matched) : `Is it ${guessText}?`;

      setAttempts((current) => current + 1);
      setLastGuess(spokenQuestion);

      if (isCorrect) {
        setPhase("finished");
        setTeacherPeek(true);
        const response = `Yes! It is ${getArticle(target.word)} ${target.word}.`;
        setActiveResponse({
          id: `guess-${Date.now()}`,
          question: spokenQuestion,
          questionJa: target.ja,
          answer: "yes",
          response,
        });
        if (voiceEnabled) {
          speakQueue([spokenQuestion, response, "Great job!"], 420, "en-US");
        }
        return;
      }

      const response = "No, try again!";
      setPhase("playing");
      setActiveResponse({
        id: `guess-${Date.now()}`,
        question: spokenQuestion,
        questionJa: guessText,
        answer: "no",
        response,
      });
      if (voiceEnabled) {
        speakQueue([spokenQuestion, response], 420, "en-US");
      }
    },
    [guess, target, voiceEnabled],
  );

  const resetRound = useCallback(() => {
    cancelSpeech();
    setPhase("idle");
    setTarget(null);
    setRouletteWord("???");
    setHistory([]);
    setActiveResponse(null);
    setGuess("");
    setLastGuess("");
    setAttempts(0);
    setTeacherPeek(false);
  }, []);

  const questionCount = history.length;

  return (
    <main className={styles.shell}>
      <AppHeader title="ことばたんてい" accent="var(--accent-guess)" />
      <div className={styles.topBar}>
        <div className={styles.modeStrip} aria-label="settings">
          <button
            type="button"
            className={`${styles.segment} ${displayMode === "easy" ? styles.segmentActive : ""}`}
            onClick={() => setDisplayMode("easy")}
          >
            訳あり
          </button>
          <button
            type="button"
            className={`${styles.segment} ${displayMode === "challenge" ? styles.segmentActive : ""}`}
            onClick={() => setDisplayMode("challenge")}
          >
            英語だけ
          </button>
          <button
            type="button"
            className={`${styles.segment} ${questionMode === "guided" ? styles.segmentActive : ""}`}
            onClick={() => setQuestionMode((current) => (current === "guided" ? "mix" : "guided"))}
          >
            {questionMode === "guided" ? "ヒント多め" : "ランダム"}
          </button>
          <button
            type="button"
            className={`${styles.segment} ${voiceEnabled ? styles.segmentActive : ""}`}
            onClick={() => {
              setVoiceEnabled((current) => !current);
              unlockSpeech();
            }}
          >
            音声
          </button>
          <SpeedControl />
        </div>
      </div>

      <section className={styles.stage}>
        <div className={styles.roulettePanel}>
          <div className={styles.secretDisplay} data-phase={phase}>
            <span className={styles.secretIcon}>{phase === "finished" && target ? target.icon : "?"}</span>
            <span className={styles.secretWord}>
              {phase === "finished" && target ? target.word : phase === "spinning" ? rouletteWord : "Mystery word"}
            </span>
            <span className={styles.secretSub}>
              {phase === "finished" && target ? `正解は ${target.ja}` : target ? "お題はひみつ" : "Ready"}
            </span>
          </div>

          <div className={styles.commandRow}>
            <button type="button" className={styles.startButton} onClick={startQuiz} disabled={phase === "spinning"}>
              クイズかいし
            </button>
            <button type="button" className={styles.secondaryButton} onClick={resetRound} disabled={phase === "spinning"}>
              リセット
            </button>
          </div>

          <div className={styles.teacherLine}>
            <button
              type="button"
              className={styles.peekButton}
              onClick={() => setTeacherPeek((current) => !current)}
              disabled={!target || phase === "spinning"}
            >
              先生だけ見る
            </button>
            <span className={styles.peekAnswer}>
              {teacherPeek && target ? `${target.word} / ${target.ja}` : "•••"}
            </span>
          </div>
        </div>

        <div className={styles.aiPanel} data-answer={activeResponse?.answer ?? "waiting"}>
          <span className={styles.aiLabel}>AI Voice</span>
          <strong>{activeResponse ? activeResponse.response : phase === "spinning" ? "Choosing..." : "Yes or No?"}</strong>
          <span>
            {activeResponse
              ? `${activeResponse.question}${showJapanese ? `（${activeResponse.questionJa}）` : ""}`
              : "Tap a question bubble."}
          </span>
        </div>

        <div className={styles.statsPanel}>
          <span>質問 {questionCount}</span>
          <span>回答 {attempts}</span>
          <span>カード {visibleQuestions.length}</span>
        </div>
      </section>

      <section className={styles.playArea} aria-label="question area">
        <div className={styles.questionCloud}>
          {visibleQuestions.map((question, index) => (
            <button
              type="button"
              key={question.id}
              className={`${styles.questionBubble} ${styles[question.category]}`}
              style={
                {
                  "--float-delay": `${(index % 6) * -0.55}s`,
                  "--float-distance": `${8 + (index % 4) * 2}px`,
                } as React.CSSProperties
              }
              onClick={() => askQuestion(question)}
              disabled={phase !== "playing"}
              title={CATEGORY_LABELS[question.category]}
            >
              <span>{question.text}</span>
              {showJapanese && <small>{question.ja}</small>}
            </button>
          ))}
        </div>

        <aside className={styles.historyPanel}>
          <div className={styles.historyHeader}>
            <span className={styles.historyTitle}>History</span>
            <button type="button" onClick={openGuess} disabled={phase !== "playing"} className={styles.gotItButton}>
              <strong>I got it!</strong>
              <small>わかったらここをタップ！</small>
            </button>
          </div>

          <div className={styles.historyList}>
            {history.length === 0 ? (
              <p className={styles.emptyHistory}>質問するとここに残ります。</p>
            ) : (
              history.map((entry) => (
                <div className={styles.historyRow} key={entry.id} data-answer={entry.answer}>
                  <span>{entry.answer === "yes" ? "YES" : "NO"}</span>
                  <p>
                    {entry.question}
                    {showJapanese && <small> {entry.questionJa}</small>}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      {(phase === "guessing" || phase === "finished") && target && (
        <div className={styles.guessLayer}>
          <section className={styles.guessPanel}>
            {phase === "finished" ? (
              <>
                <div className={styles.revealIcon}>{target.icon}</div>
                <p className={styles.revealLead}>正解は...</p>
                <h2>{target.word}</h2>
                <p className={styles.revealJa}>{target.ja}でしたー！</p>
                {lastGuess && <p className={styles.lastGuess}>{lastGuess}</p>}
                <button type="button" className={styles.startButton} onClick={startQuiz}>
                  もういちど
                </button>
              </>
            ) : (
              <>
                <p className={styles.guessLead}>I got it!</p>
                <h2>答えを言ってみよう</h2>
                <form onSubmit={submitGuess} className={styles.guessForm}>
                  <input
                    value={guess}
                    onChange={(event) => setGuess(event.target.value)}
                    placeholder="apple / りんご"
                    autoFocus
                    list="guess-it-nouns"
                  />
                  <datalist id="guess-it-nouns">
                    {NOUNS.map((noun) => (
                      <option key={noun.id} value={noun.word}>
                        {noun.ja}
                      </option>
                    ))}
                  </datalist>
                  <div className={styles.guessActions}>
                    <button type="submit" className={styles.startButton}>
                      Is it ...?
                    </button>
                    <button type="button" className={styles.secondaryButton} onClick={() => setPhase("playing")}>
                      もどる
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
