/** ことばたんていのお題・質問データと、判定ロジック(画面から切り離してテストできるようにしている) */

export type FactKey =
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

export type NounItem = {
  id: string;
  word: string;
  ja: string;
  icon: string;
  group: "food" | "animal" | "school" | "home" | "vehicle" | "nature" | "thing";
  facts: Partial<Record<FactKey, boolean>>;
  aliases?: string[];
};

export type Question = {
  id: string;
  text: string;
  ja: string;
  key: FactKey;
  category: "category" | "look" | "action" | "place";
  reply: "is" | "does" | "canIt" | "canYou";
};

export type QuestionMode = "guided" | "mix";

export const NOUNS: NounItem[] = [
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
    facts: { vehicle: true, big: true, outside: true, moves: true, wheels: true, hard: true, use: true, long: true },
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
    facts: { school: true, classroom: true, home: true, hard: true, use: true, legs: true },
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
    facts: { school: true, classroom: true, home: true, hard: true, use: true, sound: true },
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
    facts: { kitchen: true, home: true, small: true, hard: true, use: true, long: true },
  },
  {
    id: "cup",
    word: "cup",
    ja: "コップ",
    icon: "🥤",
    group: "home",
    aliases: ["glass"],
    facts: { kitchen: true, home: true, small: true, hard: true, use: true, round: true },
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

export const QUESTIONS: Question[] = [
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

export const CATEGORY_LABELS: Record<Question["category"], string> = {
  category: "カテゴリ",
  look: "ようす",
  action: "できること",
  place: "場所",
};

export const YES_LINES: Record<Question["reply"], string[]> = {
  is: ["Yes, it is.", "Yes!", "Good question. Yes, it is."],
  does: ["Yes, it does.", "Yes!", "Nice question. Yes, it does."],
  canIt: ["Yes, it can.", "Yes!", "Good thinking. Yes, it can."],
  canYou: ["Yes, you can.", "Yes!", "Good thinking. Yes, you can."],
};

export const NO_LINES: Record<Question["reply"], string[]> = {
  is: ["No, it isn't.", "No!", "Good question, but no."],
  does: ["No, it doesn't.", "No!", "Nice question, but no."],
  canIt: ["No, it can't.", "No!", "Good thinking, but no."],
  canYou: ["No, you can't.", "No!", "Good thinking, but no."],
};

export function getArticle(word: string) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

export function getAnswerQuestion(item: NounItem) {
  return `Is it ${getArticle(item.word)} ${item.word}?`;
}

export function sample<T>(items: T[], salt = 0): T {
  return items[Math.abs(Math.floor(Date.now() + salt)) % items.length];
}

export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[?!.,]/g, " ")
    .replace(/\bis\s+it\b/g, " ")
    .replace(/\b(an|a|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findGuessItem(guess: string) {
  const normalized = normalize(guess);
  return NOUNS.find((noun) => {
    const values = [noun.id, noun.word, noun.ja, ...(noun.aliases ?? [])].map(normalize);
    return values.includes(normalized);
  });
}

export function seededNoise(seed: number, text: string) {
  let hash = seed || 17;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 2654435761);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

export function buildQuestionDeck(target: NounItem | null, seed: number, mode: QuestionMode) {
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

/** これまでの しつもんの こたえ(たんていボード用) */
export type Clue = { key: FactKey; answer: boolean };

/** こたえと むじゅんしない お題だけを のこす(はずれた こたえも のぞく) */
export function remainingCandidates(clues: Clue[], excludedIds: ReadonlySet<string> = new Set()): NounItem[] {
  return NOUNS.filter(
    (noun) => !excludedIds.has(noun.id) && clues.every((clue) => (noun.facts[clue.key] === true) === clue.answer),
  );
}
