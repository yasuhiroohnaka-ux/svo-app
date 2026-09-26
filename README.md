# Puzzle Grammar - English Learning Games

こども向けの英語あそびを集めたサイトです。トップ(`/`)から各アプリへ入ります。
Next.js(App Router)で作り、Cloudflare Workers に [vinext](https://github.com/cloudflare/vinext) でデプロイしています。

## アプリ一覧

| パス | アプリ | 内容 |
|------|--------|------|
| `/puzzle-grammar` | Puzzle Grammar | 絵に合わせて「だれが・する・なにを」のピースをはめて文を作る |
| `/svo` | SVOカルタ | 読み上げた文に合う絵を取る。フラッシュ / かるた / タイムトライアル / VS AI |
| `/quiz-maker` | Quiz Maker | 絵を見て文を選ぶカードクイズ(セットごとのデッキ) |
| `/guess-it` | ことばたんてい | Yes/No 質問でひみつのお題を当てる |
| `/phonics` | oto-man | フォニックスの音を聞いてカードを選ぶ・ことばを作る |
| `/phonics-maze` | フォニックスめいろ | 音のリズムどおりに迷路をたどる |
| `/storyquiz` | えほんで えいご | 短いおはなしを聞いてクイズに答える |
| `/sota` | So-ta The Alien | 英文を読んで絵に色をつける絵本 |
| `/ymeyme-rhyme` | Ymeyme-Rhyme | 毎月の英語の詩を読み上げで聞く |

## 開発

```bash
npm install
npm run dev          # http://localhost:3000
npm run check        # lint + 型チェック + テスト + コンテンツ検証(push 前に)
```

| コマンド | 内容 |
|----------|------|
| `npm test` | Vitest の単体テスト(`**/*.test.ts`) |
| `npm run lint` | ESLint |
| `npm run validate:content` | おはなし・So-ta・フォニックスの素材がそろっているか確認 |
| `npm run build` | Next.js の本番ビルド |

## デプロイ(Cloudflare Workers)

```bash
npm run build:cloudflare     # dist/ に Workers 用ビルドを出力
npm run preview:cloudflare   # Workers のランタイムでローカル確認(wrangler dev)
npm run deploy:cloudflare    # 本番へデプロイ
```

設定は `vite.config.ts`(vinext + Cloudflare プラグイン)と `wrangler.jsonc`。

## ディレクトリ

```
app/
  page.tsx               トップ(ポータル)
  <app>/                 各アプリ。page.tsx が画面、layout.tsx がページタイトル
  components/            共通部品(AppHeader, ResultDialog, Ranking, SpeedControl, HanamaruMark …)
  lib/persistentStore.ts localStorage に進捗や設定を保存する共通ストア
  content/               おはなし・パズル共通のコンテンツ
utils/                   読み上げ(speak)・効果音(sound)・ランキングなど
public/data/             カードデータ(JSON)
public/images/           本番で使う画像
design-drafts/           画像の下書き(public の外なので配信されない)
docs/                    計画・素材メモ(docs/audit-and-roadmap-2026-09.md に改善ロードマップ)
```

## デザインのルール

- 色・角丸・影・余白は `app/globals.css` の CSS 変数(`--ink`, `--accent-svo` など)を使う。アプリごとの違いはアクセント色だけにする。
- 各アプリの画面は、最初に `<AppHeader title="…" accent="var(--accent-xxx)" />` を置く(トップへ戻るボタンとアプリ名)。
- ゲームの結果は `alert()` ではなく `ResultDialog` で出す。
- 進捗や設定の保存は `createPersistentStore` を使う(サーバー描画とずれない)。
- タップできるものは 44×44px 以上にする。
