# 画像 発注書(Codex 向け)— ことばダンジョン 2026-09

発注者: Yasuhiro Ohnaka / 作成: Claude(2026-09-26)
対象リポジトリ: `yasuhiroohnaka-ux/svo-app`

このリポジトリは、こども向け英語あそびサイト「ことばダンジョン(Kotoba Dungeon)」です。全画像を棚卸しした結果、**学習に必要なのに絵がない場所**、**画風がそろっていない場所**、**新しいデザインで必要になった絵**が見つかりました。この文書は、その画像の生成とブラッシュアップの依頼書です。

- まず「0. 共通ルール」を読んでください。
- そのあと、「1. 発注一覧」の優先度の高いものから進めてください。
- 各発注には、目的、枚数、仕様、プロンプトのひな形、受け入れ条件を書いてあります。

---

## 0. 共通ルール(すべての発注に適用)

### 0-1. 進め方
1. **作業ブランチ**: `claude/vigilant-albattani-ga9wgd` から新しいブランチを切ります(例: `codex/images-quiz-set34`)。このブランチがマージ済みなら `main` から切ってください。発注ごとにブランチまたはコミットを分けてください。
2. **見本の承認を先に取る**: 各発注では、まず **見本を3枚** 作ってください。発注者の承認をもらってから残りを量産します。キャラクターが出る発注は、先にキャラクターシートを作ります(正面・横・表情)。
3. **プロンプトの記録**: 使ったプロンプトは `docs/content-prompts/<発注ID>-<画像ID>.txt` に保存します(既存の `docs/content-prompts/` と同じ運用です)。作り直したものは `-fix.txt` を付けます。
4. **原本と配信用を分ける**:
   - 生成した原本(PNG)は `design-drafts/<発注ID>/` に置きます。`public/` の外なので配信されません。
   - 配信用は **WebP(品質 85〜90、長辺 1200px 以下)** にして `public/images/...` に置きます。変換は `sharp` で行い、既存の `scripts/prepare-content-images.cjs` を拡張して使ってください。
   - 1枚の目安は **300KB 以下** です(ドット絵は 30KB 以下)。
5. **既存ファイルを上書きしない**: 新しいファイル名で置いてから、データ(JSON)の参照先を切り替えてください。置き換えた旧画像は `design-drafts/replaced/` に移し、履歴として残します。
6. **検証**: 最後に `npm run check`(lint・型・テスト・コンテンツ検証)を実行し、すべて通ることを確認してください。`app/content.test.ts` が「データが参照する画像が実在するか」をチェックします。

### 0-2. 画風の2系統
| 系統 | 使う場所 | 仕様 |
|---|---|---|
| **A. 学習カード絵** | Quiz Maker、えほんで えいご、oto-man の単語、Ymeyme | 日本の教材でよく見るフラットなクリップアート調。やわらかいパステルのベタ塗り、こげ茶の少しゆらいだ線、白または無地の背景、グラデーション・質感・影なし、表情はシンプル。既存の `public/images/mini-stories/*.webp` と Quiz Maker セット1・2(`img_0`〜`img_31`)が見本です。 |
| **B. ダンジョンUI絵** | 部屋アイコン、たからもの、ロゴ、アイコン、マスコット | かわいい 16bit 風のドット絵。背景は透過で、拡大は整数倍のみ(ぼかさない)。こわくない、明るいダンジョン。配色はサイトのデザイン変数(下記)に合わせます。 |

サイトの色(`app/globals.css`):
- 基本色: ink `#1d2f45`、highlight `#ffe27a`、ポータル背景 `#1a1a2e`
- 部屋ごとのアクセント色: puzzle `#a78bfa`、svo `#ff6b6b`、quiz `#4ecdc4`、guess `#ffe066`、phonics `#e67e22`、maze `#58d6c7`、story `#ff9f43`、sota `#9bb7a5`、rhyme `#f78fb3`

### 0-3. どの発注にも共通する受け入れ条件
- [ ] **意味が一目で分かる**: 正解の文にだけぴったり合い、同じデッキのほかの選択肢には見えないこと。学習カードではこれが最優先です。
- [ ] **文字を入れない**: 文字・数字・ロゴは入れません。例外は発注で指定したもの(曜日の札など)だけです。
- [ ] **同じキャラクターの見た目が場面ごとに変わらない**: 色・服・持ち物をそろえます。
- [ ] **こわくない**: お墓・おばけ・目玉などの題材でも、低学年向けにかわいく描きます。
- [ ] **既存の作品やキャラクターに似せない**: 実在の画家・作家の名前をプロンプトに入れないでください。画風は特徴(線・塗り・色)で指定します。
- [ ] **仕様を守る**: 指定した比率・サイズ・形式・保存先・ファイル名であること。

---

## 1. 発注一覧(優先度順)

| ID | 内容 | 枚数 | 優先度 | 理由 |
|---|---|---|---|---|
| **Q34** | Quiz Maker セット3・4 のカラー化 | 40(試作あり32、新規8) | ★★★ | 鉛筆の下描きのままで、何が正解か読み取りにくい |
| **SQ1** | えほんで えいご no.1(童話3話)の場面絵 | 50 + キャラクターシート | ★★★ | 画像が1枚もなく、文字だけで遊んでいる |
| **TR** | たからもの(ごほうび)の絵 | 16 + 2 | ★★☆ | 今は絵文字。集める楽しさを上げたい |
| **RM** | 部屋(アプリ)アイコンと階のバッジ | 9 + 4 | ★★☆ | 今は絵文字と手描きの混在 |
| **BR** | ロゴ・アプリアイコン・共有用画像 | 4 | ★★☆ | 名前が「ことばダンジョン」に変わったため |
| **MC** | ダンジョンの案内役 / VS AI の相手キャラクター | 案3 → 決定後に表情6 | ★☆☆ | 次に作る「きょうのダンジョン」や VS AI の演出に使う |
| **PW** | oto-man の単語絵 | 63 | ★☆☆ | 音だけで、意味の手がかりがない |
| **YM** | Ymeyme-Rhyme の詩の扉絵 | 22 | ★☆☆ | 詩の一覧が文字だけ |

> データへの組み込み: Q34・SQ1・PW・YM は、Codex がデータ(JSON / TS)の画像パスまで更新してください。TR・RM・BR・MC は画像を届けるだけで構いません。画面への組み込みは Claude 側で行います。

---

### Q34. Quiz Maker セット3・4 のカラー化(40枚)

**現状**
- セット1・2(`img_0`〜`img_31`)はカラーのイラストです。セット3・4(`img_32`〜`img_71`)は鉛筆の下描き(白黒の線画)のままです。
- `design-drafts/quiz-drafts/2026-07-09-antigravity-irasutoya-trials/` に、32〜63番のカラー試作があります(一覧は同じフォルダの `contact_sheet.png` と各 `img_NN.png`)。**64〜71番は未着手** です。

**ねらい**
- セット3は **最上級の比較** です(oldest / strongest / largest / fastest)。曜日の札(Thursday / Saturday)が、見分けるための情報になっています。
- セット4は **位置・動きの前置詞** です(in front of / next to / among / between / behind / around / through / over / into / above / below)。
- 絵を見て、その1文だけが正解だと分かる必要があります。

**仕様**
- 比率は **正方形 1:1** です(セット1・2と試作に合わせる)。原本は 1024px 以上で作ります。
- 試作の多くは、拡張子が `.png` なのに中身が JPEG です。採用するときは、原本を `design-drafts/Q34/` に正しい拡張子で置き直してください。
- 配信先: `public/images/quiz/img_NN.webp`。`public/data/quiz_data.json` の該当 `image` を `.webp` に書き換え、旧 PNG は `design-drafts/replaced/quiz/` へ移します。
- 画風: 系統A。セット2(`img_16`〜`img_31`)の色味に合わせます。
- セット3の曜日の札だけは、文字を入れてよいものとします。英語の綴りを正確に、元の下描きと同じ位置に置いてください。

**受け入れ条件(Q34 固有)**
- [ ] セット3: 「いちばん○○なもの」が、大きさ・位置・動き・表情で一目で分かること。3つのキャラクターが同じ画面にそろっていること。
- [ ] セット3: 曜日の札の綴りが正しいこと(Thursday / Saturday)。
- [ ] セット4: 主役(目玉 / おばけ / かさ)が、どの絵でもはっきり見えること。「隠れている」場面でも、半分は見えるようにします。
- [ ] セット4: 同じ主役の中で、前置詞の違い(among と between、around と over と into など)が構図で見分けられること。
- [ ] 同じ主役(目玉 / おばけ / かさ)のデザインが、すべての絵で同じであること。
- [ ] 下の「付録A」の「対応」列を満たすこと。

**プロンプトのひな形(英語)**
```
Flat Japanese educational clip-art for a children's English quiz card. Soft pastel flat fills,
slightly wobbly dark-brown outlines, plain white or very light background, no gradients,
no texture, no shading. No text or letters except: {SIGN_TEXT or "none"}. Square 1:1.
The picture must make exactly this sentence obvious: "{TARGET}".
It must NOT look like: {OTHER_SENTENCES_IN_SAME_GROUP}.
Recurring character: {CHARACTER_SHEET_DESCRIPTION}. Cute, not scary.
Composition from the pencil sketch reference: keep the same characters and props, but
make the key relation ({RELATION}) large and central.
```

---

### SQ1. えほんで えいご no.1 の場面絵(50枚 + キャラクターシート)

**現状**
- `app/storyquiz/data/no1.json` には、アンデルセン童話3話が入っています(Thumbelina / The tinderbox / Little Eda's Flower)。全11パート・50場面ですが、**画像が1枚もありません**。
- 「はじめて」編(`app/content/mini-stories.json`)は1場面に1枚の絵があり、パート一覧のサムネイルにも使われています。

**手順**
1. 最初にキャラクターシートを作ります(`design-drafts/SQ1/characters/`)。
   - Thumbelina: おやゆび姫、かえる親子、コガネムシ、野ねずみ、もぐら、つばめ、花の王子
   - The tinderbox: 兵隊、魔女、目の大きな犬3匹、お姫さま、王さま
   - Little Eda's Flower: イーダ、学生、花たち、人形
   - 3話で雰囲気を少し変えてもよいですが、線と塗りは系統Aでそろえます。
2. 発注者の承認を取ってから、場面を量産します。

**仕様**
- 比率 3:2 の横長(「はじめて」編と同じ)。
- 配信先: `public/images/storyquiz/no1/<場面ID>.webp`。
- データ: `no1.json` の各 segment に `image`(パス)と `imageAlt`(日本語で短く「おやゆびひめが はなから うまれる ばめん」など)を追加します。
- 画風: 系統A。「はじめて」編(`public/images/mini-stories/lunch-1.webp` など)と並べて違和感がないようにします。

**受け入れ条件(SQ1 固有)**
- [ ] 各場面の **正解の選択肢が絵から分かる** こと(付録Bの「正解の選択肢」列)。そのうえで、答えを直接書いたような絵にはしないこと。英文を聞いて、絵を手がかりに考えられるのがちょうどよいです。
- [ ] 同じキャラクターが全場面で同じ見た目であること(大きさの対比: おやゆび姫はいつも小さく)。
- [ ] 魔女の場面や兵隊が魔女を倒す場面なども、こわくない・痛くない表現にすること(原作の暴力的な場面は、ぼかすか省きます)。
- [ ] 文字を入れないこと。

**プロンプトのひな形(英語)**
```
Flat Japanese educational clip-art illustration for a children's picture-book quiz, landscape 3:2.
Soft pastel flat fills, wobbly dark-brown outlines, plain light background, no gradients, no texture,
no text. Story: {TALE}. Scene: "{SEGMENT_TEXT}".
The picture should help a child answer: {QUESTION_JA} (answer: {ANSWER}), without spelling it out.
Characters (keep exactly as the character sheet): {CHARACTERS}. Gentle and not scary.
```

---

### TR. たからもの(16種 + 2)

**現状**: `app/lib/rewards.ts` の `TREASURES`(絵文字)です。`/treasures` ページとクリア画面で表示されます。

| treasure id | 名前 | 今の絵文字 | 絵の方向 |
|---|---|---|---|
| room-phonics | おとの すず | 🔔 | 音符が飛び出す金のすず |
| room-maze | まよわない コンパス | 🧭 | 針が光るコンパス |
| room-puzzle | きんの パズルピース | 🧩 | 金色のピース(紫の縁) |
| room-svo | はやとりの ふだ | 🎴 | 光るかるたの札(赤の縁) |
| room-quiz | ひみつの カード | 🃏 | ?マークの魔法のカード(ティールの縁) |
| room-story | まほうの えほん | 📖 | 開くと星が出る絵本(オレンジの縁) |
| room-sota | にじいろの ふで | 🎨 | 虹色の筆(セージグリーンの軸) |
| room-rhyme | うたう まきもの | 🎵 | 音符が流れる巻物(ピンクのひも) |
| room-guess | たんていの むしめがね | 🔍 | 金縁の虫めがね |
| stars-10 | ちいさな ほうせき | 💎 | 小さな青い宝石 |
| stars-30 | ことばの かんむり | 👑 | 文字の飾りがついた王冠(文字は入れず、模様で) |
| stars-60 | ダンジョンの ドラゴン | 🐉 | かわいい小さなドラゴン(たまごから出てきたばかり) |
| daily-3 | ダンジョンの たいまつ | 🔥 | あたたかく燃えるたいまつ(きょうのダンジョン 3日れんぞく) |
| daily-7 | ひみつの とびら | 🚪 | 光がもれる石のとびら(7日れんぞく) |
| perfect-10 | きらきら スター | 🌟 | 3つの星がくっついた、きらきらの星 |
| all-rooms | マスターキー | 🗝️ | 9色の宝石がついた大きなかぎ |
| (追加)locked | まだ手に入れていない | ❓ | 鍵のかかった宝箱のシルエット |
| (追加)chest-open | 手に入れた瞬間の演出用 | 🎁 | ふたが開いて光があふれる宝箱 |

- 仕様: 系統B(ドット絵)。原本は 64×64 のドット絵で、配信用は 256×256 の PNG(透過、整数倍に拡大)。
- 配信先: `public/images/treasures/<treasure id>.png`。
- 受け入れ条件: 暗い背景(`#1a1a2e`)と明るい背景(`#fff4c7`)の両方で見やすいこと。16色程度に抑え、9つの部屋のたからものは、その部屋のアクセント色(0-2)を入れること。

---

### RM. 部屋アイコン(9)と階のバッジ(4)

**現状**: ポータル(`app/page.tsx`、`app/lib/apps.ts`)の部屋カードは絵文字です(🔊🧭🧩🎴🃏📖👽📜🔍)。

- **部屋アイコン**: 各部屋の中身が分かる小物(スピーカー、コンパス、パズル、かるた札、トランプ、絵本、宇宙人ソータの顔、巻物、虫めがね)。
  - So-ta は、既存の So-ta のデザイン(`public/images/sota/color/art-p10.webp` の緑の毛・目がたくさん)をドット絵に起こします。新しいキャラクターにはしないでください。
- **階のバッジ**: B1・B2・B3・??(かくし部屋)の石のプレート。文字はコードで重ねるので、絵には入れないでください。
- 仕様: 系統B。原本 48×48(アイコン)/ 64×64(バッジ)、配信用は4倍の PNG(透過)。
- 配信先: `public/images/rooms/<app id>.png`、`public/images/floors/<sound|sentence|story|secret>.png`(app id は `app/lib/apps.ts` の `id`)。

---

### BR. ロゴ・アプリアイコン・共有用画像(4)

| 画像 | 仕様 | 配信先 |
|---|---|---|
| ロゴ「ことばダンジョン」 | 横長、透過 PNG、高さ 240px。ドット絵風の太い日本語文字で、金色(`#ffe066`)に濃い茶色の影。小さく KOTOBA DUNGEON を添えてもよい。 | `public/images/brand/logo.png` |
| アプリアイコン | 512×512 と 192×192 と、maskable 用 512×512(中央 80% に収める)。石の門と、たいまつ・宝箱を組み合わせる。文字なし。 | `public/icons/icon-512.png`、`icon-192.png`、`icon-maskable-512.png`、`apple-touch-icon.png`(180)。今のパズル柄の仮アイコンを差し替える |
| 共有用画像(OGP) | 1200×630。ポータルの雰囲気(石レンガ、たいまつ、部屋の入口)にロゴを重ねる。 | `public/images/brand/og.png` |

※ ロゴは文字そのものが絵なので、文字を入れてよい例外です。綴り「ことばダンジョン」を正確に入れてください。

---

### MC. 案内役 / VS AI の相手キャラクター(案3 → 表情6)

**用途**
- SVOカルタ / Quiz Maker の「VS AI」の相手です。今は結果画面に 🤖 が出るだけです。
- これから作る「きょうのダンジョン」(日替わりチャレンジ)の案内役にも使います。

**手順**
1. まず **方向性の違う案を3つ** 出してください。例: ダンジョンに住むやさしいスライム / 本のおばけ / ことばを食べる小さなドラゴン。
2. 発注者が1つ選んだら、表情6種を作ります: ふつう、よろこぶ(勝ち)、くやしい(負け)、考え中、びっくり、応援。
- 仕様: 系統B(ドット絵 64×64、透過)。案の段階では系統Aのラフでも構いません。
- 配信先: `public/images/mascot/<表情>.png`。
- こわくないこと。子どもが勝ったときに、一緒に喜んでくれる性格にします。

---

### PW. oto-man の単語絵(63枚)

**現状**: `app/phonics/PhonicsData.ts` の `LESSON_WORDS`(63語、付録C)には絵がなく、音と文字だけです。

- 具体物の単語(pen, bat, bed, pot, bag, dog, mop, map, bug, mug, cat, cap, cup, hat, hen, sun, fan, car, star, bird, moon, cow など)は、その物を1つ中央に描きます。
- 動きや様子の単語(big, dig, run, sit, sad, sip, hot, cool, now, down, hear, near, when, math, graph など)は、意味が伝わる小さな場面にします。**文字・数字は入れない** でください(math / graph も記号の羅列にしない)。
- 意味が2つある単語(`bat` こうもり/バット、`fan` せんぷうき/ファン、`top` こま/てっぺん など)は、どちらを描くか見本の段階で発注者に確認してください。
- 仕様: 系統A、正方形 1:1、背景は白。配信先: `public/images/phonics/words/<word>.webp`。
- データ: `LessonWord` に `image?: string` を追加し、`makeLessonWord` で `/images/phonics/words/<text>.webp` を入れてください。画面への表示は Claude 側で組み込みます。

---

### YM. Ymeyme-Rhyme の詩の扉絵(22枚)

**現状**: `app/ymeyme-rhyme/data.ts` の22編の詩は、一覧も本文も文字だけです。

- 詩の雰囲気を、1枚で伝える扉絵にします(例: Trees は大きな木、Georgie Porgie はパイと子どもたち、Sonnet 18 は夏の日差し)。文字なし。
- 冊子の色(orange / blue)に合わせて、背景の色を少し変えます。
- 仕様: 系統A、比率 4:3、配信先 `public/images/rhyme/<poem id>.webp`。データの各 poem に `image` を追加してください。

---

## 2. Claude 側で行う技術作業(発注外・参考)

次の作業は、画像生成ではないので Claude 側で対応します。Codex は対応不要です。
- 大きな PNG の WebP 化:
  - SVO カード `public/images/page_*.png`(2722px・45枚)
  - レベル2 `public/images/lv2/*.png`(約1MB×20)
  - So-ta の線画 `public/images/sota/lineart/*.png`(1〜3.6MB)
  - フォニックスのカード `public/images/phonics/cards/*.png`
- 拡張子が `.png` なのに中身が JPEG のファイルを直す(Quiz Maker の32枚)。
- 使われていない `public/images/phonics/media__*.png`(7枚)の整理。
- Quiz Maker のかるたで、カラー画像にも線画用のコントラスト強調フィルター(`contrast(1.5)`)がかかっている点の調整。
- TR・RM・BR・MC の画面への組み込み。

---

## 3. 納品チェックリスト(Codex が最後に確認)
- [ ] 見本3枚について、発注者の承認を得た。
- [ ] 原本(PNG)は `design-drafts/<発注ID>/`、配信用は `public/images/...` に置いた。
- [ ] プロンプトを `docs/content-prompts/` に保存した。
- [ ] データ(JSON / TS)の画像パスを更新した(Q34・SQ1・PW・YM)。
- [ ] 置き換えた旧画像を `design-drafts/replaced/` に移した。
- [ ] `npm run check` がすべて通った。
- [ ] スマホ幅(390px)で、実際の画面を見て、意味が伝わることを確認した。

---

## 付録

(A〜C は `public/data/quiz_data.json`、`app/storyquiz/data/no1.json`、`app/phonics/PhonicsData.ts` から自動で書き出したものです。データを変えたら作り直してください。)

### 付録A: Quiz Maker セット3・4(`public/data/quiz_data.json` 32〜71番)

| # | セット | 正解の文(target) | いっしょに読む文 | 試作 | 対応 |
|---|---|---|---|---|---|
| 32 | set3 | The alligator is the oldest of the three. | It's Thursday. / The bear is the youngest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 33 | set3 | The alligator is the oldest of the three. | It's Saturday. / The giraffe is the youngest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 34 | set3 | The watermelon is the strongest of the three. | It's Saturday. / The strawberry is the weakest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 35 | set3 | The glue is the largest of the three. | It's Saturday. / The scissors are the smallest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 36 | set3 | The ruler is the largest of the three. | It's Thursday. / The glue is the smallest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 37 | set3 | The watermelon is the strongest of the three. | It's Thursday. / The strawberry is the weakest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 38 | set3 | The scissors are the largest of the three. | It's Thursday. / The glue is the smallest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 39 | set3 | The strawberry is the strongest of the three. | It's Saturday. / The watermelon is the weakest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 40 | set3 | The giraffe is the oldest of the three. | It's Saturday. / The alligator is the youngest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 41 | set3 | The jeans are the fastest of the three. | It's Saturday. / The shoes are the slowest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 42 | set3 | The socks are the fastest of the three. | It's Thursday. / The jeans are the slowest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 43 | set3 | The jeans are the fastest of the three. | It's Thursday. / The socks are the slowest of the three. | あり | **作り直し**: 42 と同じ曜日・同じ持ち物で役割だけ逆。ジーンズが先頭・くつしたが最後尾と一目で分かるように |
| 44 | set3 | The peach is the strongest of the three. | It's Thursday. / The watermelon is the weakest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 45 | set3 | The ruler is the largest of the three. | It's Saturday. / The scissors are the smallest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 46 | set3 | The shoes are the fastest of the three. | It's Saturday. / The socks are the slowest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 47 | set3 | The bear is the oldest of the three. | It's Thursday. / The giraffe is the youngest of the three. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 48 | set4 | It is crying in the classroom. | The eyeball is at school. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 49 | set4 | It is crying in front of the blackboard. | The eyeball is at school. | あり | **作り直し**: 48 と見分けにくい。黒板の『前』に立っていることが一目で分かる構図に(教室全体より黒板まわりを大きく) |
| 50 | set4 | It is crying next to the teacher. | The eyeball is at school. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 51 | set4 | It is hiding among the graves. | The eyeball is in the graveyard. | あり | **作り直し**: 目玉が見えない。墓石の『あいだ』から目玉がのぞいているのがはっきり分かるように(木は描かない/控えめに) |
| 52 | set4 | It is hiding between the trees. | The eyeball is in the graveyard. | あり | **作り直し**: 目玉が見えない。2本の木の『あいだ』に目玉がいるのが分かるように(墓は控えめに)。51 と背景で見分けられること |
| 53 | set4 | It is running around Saturn. | The eyeball is in the space. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 54 | set4 | It is running on the earth. | The eyeball is in the space. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 55 | set4 | It is running through Jupiter. | The eyeball is in the space. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 56 | set4 | It is crying behind the window. | The ghost is at school. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 57 | set4 | It is crying in the classroom. | The ghost is at school. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 58 | set4 | It is crying in front of the blackboard. | The ghost is at school. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 59 | set4 | It is jumping around a grave. | The ghost is in the graveyard. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 60 | set4 | It is jumping into a grave. | The ghost is in the graveyard. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 61 | set4 | It is jumping over a grave. | The ghost is in the graveyard. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 62 | set4 | It is running around Saturn. | The ghost is in the space. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 63 | set4 | It is running through the earth. | The ghost is in the space. | あり | 試作を確認して採用(下の共通チェックを満たすこと) |
| 64 | set4 | It is flying above the earth. | The umbrella is in the space. | なし | **新規** |
| 65 | set4 | It is flying around Jupiter. | The umbrella is in the space. | なし | **新規** |
| 66 | set4 | It is flying below (under) Jupiter. | The umbrella is in the space. | なし | **新規** |
| 67 | set4 | It is hiding among the graves. | The umbrella is in the graveyard. | なし | **新規** |
| 68 | set4 | It is hiding between the trees. | The umbrella is in the graveyard. | なし | **新規** |
| 69 | set4 | It is hiding behind a tree. | The umbrella is in the graveyard. | なし | **新規** |
| 70 | set4 | It is jumping around the teacher. | The umbrella is at school. | なし | **新規** |
| 71 | set4 | It is jumping over the teacher. | The umbrella is at school. | なし | **新規** |

### 付録B: えほんで えいご no.1(`app/storyquiz/data/no1.json`)の場面 50枚

| 場面ID | おはなし / パート | 英文 | 正解の選択肢 |
|---|---|---|---|
| no1-ch1-p1-s1 | Thumbelina / A tiny girl from the flower | Once upon a time, a lonely woman made a wish. "I want to have a kid!" | a kid(子ども) |
| no1-ch1-p1-s2 | Thumbelina / A tiny girl from the flower | Next morning, a beautiful flower bloomed. She found a tiny cute girl inside! | a tiny girl(とても小さな女の子) |
| no1-ch1-p1-s3 | Thumbelina / A tiny girl from the flower | "Nice to meet you!" Her name was Thumbelina. She was very tiny. She swam in a dish. Her blanket was made of flower petal. | flower petal(花びら) |
| no1-ch1-p1-s4 | Thumbelina / A tiny girl from the flower | A lonely woman was very happy and she took care of Thumbelina very well. | happy(とてもうれしい) |
| no1-ch1-p2-s1 | Thumbelina / Meeting with a frog | One night. A frog found Thumbelina. She was sleeping. | a frog(かえる) |
| no1-ch1-p2-s2 | Thumbelina / Meeting with a frog | "Wow! She is beautiful!" The frog took Thumbelina. | took her(つれていった) |
| no1-ch1-p2-s3 | Thumbelina / Meeting with a frog | When Thumbelina woke up, she was with a frog! The frog was noisy! The house was muddy! Thumbelina didn't like it. | noisy and muddy(うるさくて、どろだらけ) |
| no1-ch1-p2-s4 | Thumbelina / Meeting with a frog | The frog said, "Why don't you live with us? I will show you my frog friends! Wait for a while!" | live with us(いっしょに住もう) |
| no1-ch1-p2-s5 | Thumbelina / Meeting with a frog | Thumbelina was on a leaf alone. She started crying. Then fish gathered up to her. "We will help you!" The fish pulled the leaf. Thumbelina was free. "Thank you, fish!" | fish(さかな) |
| no1-ch1-p3-s1 | Thumbelina / Meeting with a gold beetle | Thumbelina was on a leaf. She enjoyed floating on the river. | a leaf(葉っぱ) |
| no1-ch1-p3-s2 | Thumbelina / Meeting with a gold beetle | She found a gold beetle. "Hello! How are you?" Suddenly a gold beetle caught Thumbelina and took her deep in the forest. She became alone. | a gold beetle / forest(こがねむしに会い、森の奥へ) |
| no1-ch1-p3-s3 | Thumbelina / Meeting with a gold beetle | Thumbelina ate flowers. She drank water drop from leaves. Her bed was flower leaves. | water drop(水のしずく) |
| no1-ch1-p3-s4 | Thumbelina / Meeting with a gold beetle | "I love flowers! I love forest!" After a while, winter came. It was cold in the forest. | winter(冬) |
| no1-ch1-p4-s1 | Thumbelina / Meeting with a mouse | Thumbelina found a mouse's house. "Hello? It is cold outside. Can I get in, please?" | a mouse's house(ねずみの家) |
| no1-ch1-p4-s2 | Thumbelina / Meeting with a mouse | The mouse said, "Oh, my! Poor girl. Come in, it's warm inside and stay with me." "Thank you!" | stay inside(中でいっしょにいていい) |
| no1-ch1-p4-s3 | Thumbelina / Meeting with a mouse | Thumbelina and mouse lived together. A rich mole lived near the mouse. The mole liked Thumbelina so he visited her every day. | a mole(もぐら) |
| no1-ch1-p4-s4 | Thumbelina / Meeting with a mouse | One day, Thumbelina found a swallow. He was injured. She took care of him every day. | injured(けがをしていた) |
| no1-ch1-p4-s5 | Thumbelina / Meeting with a mouse | Spring came. The swallow recovered. He was ready to fly. "Thanks, Thumbelina! Let's go to a tropical island with me!" Thumbelina said, "Why not?" | a tropical island(南の島) |
| no1-ch1-p5-s1 | Thumbelina / To a tropical island | The swallow flew with Thumbelina on his back. Thumbelina and the swallow reached the tropical land. | the swallow's back(つばめの背中) |
| no1-ch1-p5-s2 | Thumbelina / To a tropical island | There were many flowers. The swallow put Thumbelina down on a flower. | on a flower(花の上) |
| no1-ch1-p5-s3 | Thumbelina / To a tropical island | Thumbelina met a boy on the flower. "Hello, pretty girl! Here you are." A boy gave her wings. | wings(つばさ) |
| no1-ch1-p5-s4 | Thumbelina / To a tropical island | Thumbelina started flying with the boy. The boy was a prince. Thumbelina and the prince flew over flowers to flowers and lived happily. | a prince(王子さま) |
| no1-ch2-p1-s1 | The tinderbox / Meeting with a witch | A soldier was walking in a forest. He saw an old woman standing near a big tree. She was a witch. | a witch(魔女) |
| no1-ch2-p1-s2 | The tinderbox / Meeting with a witch | The witch said, "This big tree is empty. Climb up the tree and go inside." | inside the tree(木の中) |
| no1-ch2-p1-s3 | The tinderbox / Meeting with a witch | The soldier asked, "Is it dark inside?" The witch said, "No. It's bright inside." | bright(明るい) |
| no1-ch2-p1-s4 | The tinderbox / Meeting with a witch | The witch said, "You can see three rooms. There are red coins in the first room, silver coins in the second room, and gold coins in the third room." | coins(コイン) |
| no1-ch2-p1-s5 | The tinderbox / Meeting with a witch | The witch said, "You can take the coins, but please get me a tinderbox." The soldier said, "OK," and climbed up the tree. | a tinderbox(火打ち箱) |
| no1-ch2-p2-s1 | The tinderbox / Inside of the tree | The witch told the soldier, "There are three big dogs with big eyes in the tree, but don't be scared." | big dogs(大きな犬) |
| no1-ch2-p2-s2 | The tinderbox / Inside of the tree | The witch gave the soldier her apron. She said, "Put the dogs on my apron, and they will be quiet." | an apron(エプロン) |
| no1-ch2-p2-s3 | The tinderbox / Inside of the tree | It was bright inside the tree. The soldier found the three rooms. He put each dog on the apron and got red coins, silver coins, and gold coins. | coins(コイン) |
| no1-ch2-p2-s4 | The tinderbox / Inside of the tree | The soldier also found the tinderbox. He called the witch, and she pulled him out of the tree. The soldier said, "Thanks!" He never saw the witch again. | the tinderbox(火打ち箱) |
| no1-ch2-p3-s1 | The tinderbox / The soldier used money | The soldier got lots of money. He bought a big house, nice boots, and good food. | a big house(大きな家) |
| no1-ch2-p3-s2 | The tinderbox / The soldier used money | The soldier also spent money to help poor people. Many people said, "Thanks!" to the soldier. | poor people(まずしい人たち) |
| no1-ch2-p3-s3 | The tinderbox / The soldier used money | One day, the soldier heard about a beautiful princess living in a castle. The security around the castle was very strict, but the soldier wanted to see her. | a princess(お姫さま) |
| no1-ch2-p3-s4 | The tinderbox / The soldier used money | Soon, the soldier had a problem. His money ran out, and he became poor. He moved to an old house and could not eat good food anymore. | became poor(まずしくなった) |
| no1-ch2-p3-s5 | The tinderbox / The soldier used money | In the old house, the soldier suddenly found the tinderbox. He said, "I don't know what this is, but I will open it!" | the tinderbox(火打ち箱) |
| no1-ch2-p4-s1 | The tinderbox / What was the tinderbox? | The soldier opened the tinderbox. He was surprised. There was a big dog with big eyes. It was the dog he saw in the tree. | a big dog(大きな犬) |
| no1-ch2-p4-s2 | The tinderbox / What was the tinderbox? | The dog asked, "What do you wish?" The soldier said, "I want money!" The dog ran away and came back with a bag of money. | money(お金) |
| no1-ch2-p4-s3 | The tinderbox / What was the tinderbox? | The soldier remembered the beautiful princess in the castle. He said, "I want the princess." The big dog ran away and came back with the princess. | the princess(お姫さま) |
| no1-ch2-p4-s4 | The tinderbox / What was the tinderbox? | The princess was happy because she was tired of living in the castle. She knew the soldier had helped poor people. | helped poor people(まずしい人を助けた) |
| no1-ch2-p4-s5 | The tinderbox / What was the tinderbox? | The princess and the soldier got married. They had a happy life together. The tinderbox was never used again. | got married(結婚した) |
| no1-ch3-p1-s1 | Little Eda's Flower / The secret of flowers | "Those flowers were blooming beautifully yesterday, but they wilted today. Why is that?" Little Eda asked a student. | wilted(しおれていた) |
| no1-ch3-p1-s2 | Little Eda's Flower / The secret of flowers | The student said, "These flowers have a dance party at midnight. They dance until they get tired. That is why they hang their heads down." | danced until tired(つかれるまで踊った) |
| no1-ch3-p1-s3 | Little Eda's Flower / The secret of flowers | The student said, "It's true! When it gets dark, flowers enjoy dancing." Eda said, "I see. But I should check!" | check at night(夜にたしかめる) |
| no1-ch3-p1-s4 | Little Eda's Flower / The secret of flowers | That night, Eda couldn't sleep. She was thinking about the flowers and their dance party. Eda looked at Sophie, her doll. "I wonder if Sophie can dance, too." | Sophie(人形のSophie) |
| no1-ch3-p2-s1 | Little Eda's Flower / The doll dancing with flowers | It was late at night, but Eda was still awake. Suddenly, she heard the sound of a piano. "It's time for a dance party!" | a piano(ピアノ) |
| no1-ch3-p2-s2 | Little Eda's Flower / The doll dancing with flowers | Eda looked into the playroom. It was bright with moonlight. The flowers stood in two lines, made a circle, and danced while holding each other's leaves. | each other's leaves(おたがいの葉っぱ) |
| no1-ch3-p2-s3 | Little Eda's Flower / The doll dancing with flowers | A yellow lily was playing the piano. Then the doll Sophie jumped onto the floor and started dancing. Eda said, "I didn't know Sophie was a friend of the flowers!" | Sophie(人形のSophie) |
| no1-ch3-p2-s4 | Little Eda's Flower / The doll dancing with flowers | Many dancing flowers came into the hall. The flower band played trumpets made of peas. They danced all night. | peas(エンドウ豆) |
| no1-ch3-p2-s5 | Little Eda's Flower / The doll dancing with flowers | The next morning, the flowers looked very tired. Eda looked at her doll Sophie, but Sophie said nothing. | very tired(とてもつかれていた) |

### 付録C: oto-man の単語(63語)

`pen`, `pet`, `ten`, `net`, `tap`, `pan`, `nap`, `bat`, `bed`, `pot`, `top`, `bag`, `big`, `dig`, `dog`, `mop`, `map`, `bug`, `mug`, `gum`, `mud`, `cat`, `cap`, `cup`, `cut`, `kid`, `kit`, `leg`, `lip`, `log`, `red`, `run`, `rat`, `sun`, `sit`, `sad`, `sip`, `fan`, `fin`, `fog`, `hat`, `hen`, `hot`, `car`, `star`, `park`, `bird`, `girl`, `ear`, `hear`, `near`, `moon`, `food`, `cool`, `cow`, `now`, `down`, `thin`, `bath`, `math`, `when`, `whip`, `graph`
