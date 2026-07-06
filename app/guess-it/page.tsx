"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cancelSpeech, speakQueue, unlockSpeech } from "@/utils/speak";
import styles from "./page.module.css";

type FactKey =
  | "animal"
  | "alive"
  | "food"
  | "fruit"
  | "vegetable"
  | "drink"
  | "vehicle"
  | "school"
  | "classroom"
  | "home"
  | "kitchen"
  | "outside"
  | "sky"
  | "sea"
  | "clothing"
  | "sport"
  | "toy"
  | "big"
  | "small"
  | "red"
  | "blue"
  | "yellow"
  | "green"
  | "white"
  | "round"
  | "long"
  | "soft"
  | "hard"
  | "moves"
  | "flies"
  | "swims"
  | "wheels"
  | "legs"
  | "sound"
  | "leaves"
  | "water"
  | "eat"
  | "use"
  | "sit";

type NounItem = {
  id: string;
  word: string;
  ja: string;
  icon: string;
  group: "food" | "animal" | "school" | "home" | "vehicle" | "nature" | "thing";
  facts: Partial<Record<FactKey, boolean>>;
  aliases?: string[];
};

type Question = {
  id: string;
  text: string;
  ja: string;
  key: FactKey;
  category: "category" | "look" | "action" | "place";
  reply: "is" | "does" | "canIt" | "canYou";
};

type HistoryEntry = {
  id: string;
  question: string;
  questionJa: string;
  answer: "yes" | "no";
  response: string;
};

type Phase = "idle" | "spinning" | "playing" | "guessing" | "finished";
type DisplayMode = "easy" | "challenge";
type QuestionMode = "guided" | "mix";

const NOUNS: NounItem[] = [
  {
    id: "apple",
    word: "apple",
    ja: "りんご",
    icon: "🍎",
    group: "food",
    aliases: ["ringo"],
    facts: { food: true, fruit: true, small: true, red: true, round: true, kitchen: true, eat: true },
  },
  {
    id: "banana",
    word: "banana",
    ja: "バナナ",
    icon: "🍌",
    group: "food",
    facts: { food: true, fruit: true, small: true, yellow: true, long: true, kitchen: true, eat: true },
  },
  {
    id: "strawberry",
    word: "strawberry",
    ja: "いちご",
    icon: "🍓",
    group: "food",
    aliases: ["ichigo"],
    facts: { food: true, fruit: true, small: true, red: true, kitchen: true, eat: true },
  },
  {
    id: "carrot",
    word: "carrot",
    ja: "にんじん",
    icon: "🥕",
    group: "food",
    facts: { food: true, vegetable: true, small: true, long: true, kitchen: true, eat: true },
  },
  {
    id: "water",
    word: "water",
    ja: "水",
    icon: "💧",
    group: "food",
    aliases: ["mizu"],
    facts: { drink: true, kitchen: true },
  },
  {
    id: "dog",
    word: "dog",
    ja: "犬",
    icon: "🐶",
    group: "animal",
    aliases: ["inu"],
    facts: { animal: true, alive: true, small: true, home: true, outside: true, moves: true, legs: true, sound: true },
  },
  {
    id: "cat",
    word: "cat",
    ja: "猫",
    icon: "🐱",
    group: "animal",
    aliases: ["neko"],
    facts: { animal: true, alive: true, small: true, home: true, moves: true, legs: true, sound: true },
  },
  {
    id: "bird",
    word: "bird",
    ja: "鳥",
    icon: "🐦",
    group: "animal",
    aliases: ["tori"],
    facts: { animal: true, alive: true, small: true, outside: true, sky: true, moves: true, flies: true, legs: true, sound: true },
  },
  {
    id: "fish",
    word: "fish",
    ja: "魚",
    icon: "🐟",
    group: "animal",
    aliases: ["sakana"],
    facts: { animal: true, alive: true, small: true, sea: true, moves: true, swims: true },
  },
  {
    id: "elephant",
    word: "elephant",
    ja: "ぞう",
    icon: "🐘",
    group: "animal",
    facts: { animal: true, alive: true, big: true, outside: true, moves: true, legs: true, sound: true },
  },
  {
    id: "rabbit",
    word: "rabbit",
    ja: "うさぎ",
    icon: "🐰",
    group: "animal",
    facts: { animal: true, alive: true, small: true, soft: true, outside: true, moves: true, legs: true },
  },
  {
    id: "car",
    word: "car",
    ja: "車",
    icon: "🚗",
    group: "vehicle",
    aliases: ["kuruma"],
    facts: { vehicle: true, big: true, outside: true, moves: true, wheels: true, hard: true, use: true },
  },
  {
    id: "train",
    word: "train",
    ja: "電車",
    icon: "🚃",
    group: "vehicle",
    aliases: ["densha"],
    facts: { vehicle: true, big: true, outside: true, moves: true, wheels: true, hard: true, use: true },
  },
  {
    id: "airplane",
    word: "airplane",
    ja: "飛行機",
    icon: "✈️",
    group: "vehicle",
    facts: { vehicle: true, big: true, outside: true, sky: true, moves: true, flies: true, hard: true, use: true },
  },
  {
    id: "bicycle",
    word: "bicycle",
    ja: "自転車",
    icon: "🚲",
    group: "vehicle",
    aliases: ["bike"],
    facts: { vehicle: true, outside: true, moves: true, wheels: true, hard: true, use: true },
  },
  {
    id: "chair",
    word: "chair",
    ja: "いす",
    icon: "🪑",
    group: "school",
    aliases: ["isu"],
    facts: { school: true, classroom: true, home: true, hard: true, use: true, sit: true },
  },
  {
    id: "desk",
    word: "desk",
    ja: "つくえ",
    icon: "🏫",
    group: "school",
    facts: { school: true, classroom: true, home: true, hard: true, use: true },
  },
  {
    id: "book",
    word: "book",
    ja: "本",
    icon: "📘",
    group: "school",
    aliases: ["hon"],
    facts: { school: true, classroom: true, home: true, small: true, hard: true, use: true },
  },
  {
    id: "pencil",
    word: "pencil",
    ja: "えんぴつ",
    icon: "✏️",
    group: "school",
    facts: { school: true, classroom: true, small: true, long: true, hard: true, use: true },
  },
  {
    id: "eraser",
    word: "eraser",
    ja: "消しゴム",
    icon: "⬜",
    group: "school",
    facts: { school: true, classroom: true, small: true, white: true, soft: true, use: true },
  },
  {
    id: "bag",
    word: "bag",
    ja: "かばん",
    icon: "🎒",
    group: "school",
    facts: { school: true, classroom: true, home: true, soft: true, use: true },
  },
  {
    id: "clock",
    word: "clock",
    ja: "時計",
    icon: "🕒",
    group: "school",
    facts: { classroom: true, home: true, round: true, hard: true, use: true },
  },
  {
    id: "ball",
    word: "ball",
    ja: "ボール",
    icon: "⚽",
    group: "thing",
    facts: { sport: true, toy: true, small: true, round: true, outside: true, use: true },
  },
  {
    id: "robot",
    word: "robot",
    ja: "ロボット",
    icon: "🤖",
    group: "thing",
    facts: { toy: true, hard: true, moves: true, sound: true, use: true },
  },
  {
    id: "computer",
    word: "computer",
    ja: "コンピューター",
    icon: "💻",
    group: "thing",
    facts: { school: true, classroom: true, home: true, hard: true, use: true },
  },
  {
    id: "phone",
    word: "phone",
    ja: "電話",
    icon: "📱",
    group: "thing",
    aliases: ["smartphone"],
    facts: { home: true, small: true, hard: true, sound: true, use: true },
  },
  {
    id: "spoon",
    word: "spoon",
    ja: "スプーン",
    icon: "🥄",
    group: "home",
    facts: { kitchen: true, home: true, small: true, hard: true, use: true },
  },
  {
    id: "cup",
    word: "cup",
    ja: "コップ",
    icon: "🥤",
    group: "home",
    aliases: ["glass"],
    facts: { kitchen: true, home: true, small: true, hard: true, use: true },
  },
  {
    id: "shirt",
    word: "shirt",
    ja: "シャツ",
    icon: "👕",
    group: "thing",
    facts: { clothing: true, home: true, soft: true, use: true },
  },
  {
    id: "hat",
    word: "hat",
    ja: "ぼうし",
    icon: "🧢",
    group: "thing",
    facts: { clothing: true, home: true, outside: true, small: true, soft: true, use: true },
  },
  {
    id: "shoes",
    word: "shoes",
    ja: "くつ",
    icon: "👟",
    group: "thing",
    facts: { clothing: true, home: true, outside: true, use: true },
  },
  {
    id: "tree",
    word: "tree",
    ja: "木",
    icon: "🌳",
    group: "nature",
    aliases: ["ki"],
    facts: { alive: true, big: true, green: true, outside: true, leaves: true, water: true, hard: true },
  },
  {
    id: "flower",
    word: "flower",
    ja: "花",
    icon: "🌷",
    group: "nature",
    aliases: ["hana"],
    facts: { alive: true, small: true, red: true, outside: true, leaves: true, water: true, soft: true },
  },
  {
    id: "cloud",
    word: "cloud",
    ja: "雲",
    icon: "☁️",
    group: "nature",
    aliases: ["kumo"],
    facts: { big: true, white: true, sky: true, outside: true, soft: true, moves: true },
  },
  {
    id: "sun",
    word: "sun",
    ja: "太陽",
    icon: "☀️",
    group: "nature",
    facts: { big: true, yellow: true, round: true, sky: true, outside: true },
  },
  {
    id: "moon",
    word: "moon",
    ja: "月",
    icon: "🌙",
    group: "nature",
    facts: { big: true, white: true, round: true, sky: true, outside: true },
  },
];

const QUESTIONS: Question[] = [
  { id: "animal", text: "Is it an animal?", ja: "どうぶつ？", key: "animal", category: "category", reply: "is" },
  { id: "alive", text: "Is it alive?", ja: "生きている？", key: "alive", category: "category", reply: "is" },
  { id: "food", text: "Is it food?", ja: "たべもの？", key: "food", category: "category", reply: "is" },
  { id: "fruit", text: "Is it a fruit?", ja: "くだもの？", key: "fruit", category: "category", reply: "is" },
  { id: "vegetable", text: "Is it a vegetable?", ja: "やさい？", key: "vegetable", category: "category", reply: "is" },
  { id: "drink", text: "Is it a drink?", ja: "のみもの？", key: "drink", category: "category", reply: "is" },
  { id: "vehicle", text: "Is it a vehicle?", ja: "のりもの？", key: "vehicle", category: "category", reply: "is" },
  { id: "clothing", text: "Is it clothing?", ja: "きるもの？", key: "clothing", category: "category", reply: "is" },
  { id: "sport", text: "Is it for sports?", ja: "スポーツで使う？", key: "sport", category: "category", reply: "is" },
  { id: "toy", text: "Is it a toy?", ja: "おもちゃ？", key: "toy", category: "category", reply: "is" },
  { id: "big", text: "Is it big?", ja: "おおきい？", key: "big", category: "look", reply: "is" },
  { id: "small", text: "Is it small?", ja: "ちいさい？", key: "small", category: "look", reply: "is" },
  { id: "red", text: "Is it red?", ja: "あかい？", key: "red", category: "look", reply: "is" },
  { id: "blue", text: "Is it blue?", ja: "あおい？", key: "blue", category: "look", reply: "is" },
  { id: "yellow", text: "Is it yellow?", ja: "きいろい？", key: "yellow", category: "look", reply: "is" },
  { id: "green", text: "Is it green?", ja: "みどり？", key: "green", category: "look", reply: "is" },
  { id: "white", text: "Is it white?", ja: "しろい？", key: "white", category: "look", reply: "is" },
  { id: "round", text: "Is it round?", ja: "まるい？", key: "round", category: "look", reply: "is" },
  { id: "long", text: "Is it long?", ja: "ながい？", key: "long", category: "look", reply: "is" },
  { id: "soft", text: "Is it soft?", ja: "やわらかい？", key: "soft", category: "look", reply: "is" },
  { id: "hard", text: "Is it hard?", ja: "かたい？", key: "hard", category: "look", reply: "is" },
  { id: "moves", text: "Does it move?", ja: "うごく？", key: "moves", category: "action", reply: "does" },
  { id: "flies", text: "Can it fly?", ja: "とべる？", key: "flies", category: "action", reply: "canIt" },
  { id: "swims", text: "Can it swim?", ja: "およげる？", key: "swims", category: "action", reply: "canIt" },
  { id: "wheels", text: "Does it have wheels?", ja: "タイヤがある？", key: "wheels", category: "action", reply: "does" },
  { id: "legs", text: "Does it have legs?", ja: "足がある？", key: "legs", category: "action", reply: "does" },
  { id: "sound", text: "Does it make a sound?", ja: "音が出る？", key: "sound", category: "action", reply: "does" },
  { id: "eat", text: "Can you eat it?", ja: "たべられる？", key: "eat", category: "action", reply: "canYou" },
  { id: "use", text: "Can you use it?", ja: "つかえる？", key: "use", category: "action", reply: "canYou" },
  { id: "sit", text: "Can you sit on it?", ja: "すわれる？", key: "sit", category: "action", reply: "canYou" },
  { id: "school", text: "Is it at school?", ja: "学校にある？", key: "school", category: "place", reply: "is" },
  { id: "classroom", text: "Is it in the classroom?", ja: "教室にある？", key: "classroom", category: "place", reply: "is" },
  { id: "home", text: "Is it in your house?", ja: "家にある？", key: "home", category: "place", reply: "is" },
  { id: "kitchen", text: "Is it in the kitchen?", ja: "キッチンにある？", key: "kitchen", category: "place", reply: "is" },
  { id: "outside", text: "Is it outside?", ja: "外にある？", key: "outside", category: "place", reply: "is" },
  { id: "sky", text: "Is it in the sky?", ja: "空にある？", key: "sky", category: "place", reply: "is" },
  { id: "sea", text: "Is it in the sea?", ja: "海にいる？", key: "sea", category: "place", reply: "is" },
  { id: "leaves", text: "Does it have leaves?", ja: "葉っぱがある？", key: "leaves", category: "place", reply: "does" },
  { id: "water", text: "Does it need water?", ja: "水がいる？", key: "water", category: "place", reply: "does" },
];

const CATEGORY_LABELS: Record<Question["category"], string> = {
  category: "カテゴリ",
  look: "ようす",
  action: "できること",
  place: "場所",
};

const YES_LINES: Record<Question["reply"], string[]> = {
  is: ["Yes, it is.", "Yes!", "Good question. Yes, it is."],
  does: ["Yes, it does.", "Yes!", "Nice question. Yes, it does."],
  canIt: ["Yes, it can.", "Yes!", "Good thinking. Yes, it can."],
  canYou: ["Yes, you can.", "Yes!", "Good thinking. Yes, you can."],
};

const NO_LINES: Record<Question["reply"], string[]> = {
  is: ["No, it isn't.", "No!", "Good question, but no."],
  does: ["No, it doesn't.", "No!", "Nice question, but no."],
  canIt: ["No, it can't.", "No!", "Good thinking, but no."],
  canYou: ["No, you can't.", "No!", "Good thinking, but no."],
};

function getArticle(word: string) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function getAnswerQuestion(item: NounItem) {
  return `Is it ${getArticle(item.word)} ${item.word}?`;
}

function sample<T>(items: T[], salt = 0): T {
  return items[Math.abs(Math.floor(Date.now() + salt)) % items.length];
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[?!.,]/g, " ")
    .replace(/\bis\s+it\b/g, " ")
    .replace(/\b(an|a|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findGuessItem(guess: string) {
  const normalized = normalize(guess);
  return NOUNS.find((noun) => {
    const values = [noun.id, noun.word, noun.ja, ...(noun.aliases ?? [])].map(normalize);
    return values.includes(normalized);
  });
}

function seededNoise(seed: number, text: string) {
  let hash = seed || 17;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 2654435761);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function buildQuestionDeck(target: NounItem | null, seed: number, mode: QuestionMode) {
  const count = 22;
  const scored = QUESTIONS.map((question, index) => {
    const fact = target ? target.facts[question.key] === true : false;
    const categoryBias = question.category === "category" ? 0.18 : 0;
    const guidedBias = mode === "guided" && fact ? 0.34 : 0;
    const mixedBias = mode === "mix" && !fact ? 0.12 : 0;
    const noise = seededNoise(seed + index * 13, question.id) * 0.62;
    return { question, score: categoryBias + guidedBias + mixedBias + noise };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => seededNoise(seed, a.question.id) - seededNoise(seed, b.question.id))
    .map(({ question }) => question);
}

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
      <header className={styles.topBar}>
        <div>
          <p className={styles.kicker}>Word Detective</p>
          <h1 className={styles.title}>ことばたんてい</h1>
        </div>

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
        </div>
      </header>

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
