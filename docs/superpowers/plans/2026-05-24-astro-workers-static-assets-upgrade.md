# Astro Workers Static Assets アップグレード実装計画

> **エージェント作業者向け:** 必須サブスキル: この計画をタスク単位で実装するには `superpowers:subagent-driven-development` 推奨、または `superpowers:executing-plans` を使う。進捗管理にはチェックボックス (`- [ ]`) を使う。

**目的:** 静的な Astro ブログを現在のツール群へ更新し、Astro SSR や Worker アプリケーションへ変えずに Cloudflare Workers Static Assets で配信する。

**アーキテクチャ:** Astro は `dist/` を出力する静的サイトジェネレータのまま維持する。Cloudflare Workers Static Assets は `wrangler.jsonc` を通じて `dist/` を直接配信し、URL 正規化は `_redirects` と `assets.html_handling` で処理する。ローカル preview で宣言的なリダイレクト設定では必要な 301 を返せないと確認できた場合に限り、Worker entrypoint を追加する。

**技術スタック:** Astro 6、Node 24 LTS、pnpm 10、Wrangler 4、Cloudflare Workers Static Assets、Cloudflare `_redirects`。

---

## ファイル構成

- 変更 `.node-version`: ローカルと CI のビルド環境向けに Node 24 LTS を宣言する。
- 変更 `package.json`: scripts と依存関係のバージョン範囲を更新する。
- 変更 `pnpm-lock.yaml`: `pnpm` 更新後の依存グラフを固定する。
- 変更 `astro.config.mjs`: 静的 URL 生成を末尾スラッシュなしの形にする。
- 作成 `wrangler.jsonc`: `assets.directory = "./dist"` と `assets.html_handling = "drop-trailing-slash"` で Workers Static Assets を設定する。
- 変更 `public/_redirects`: 既存の過去 URL リダイレクトを維持し、ローカル preview でルールが機能する場合は投稿 URL の末尾スラッシュ正規化を追加する。
- 削除 `functions/posts/[[slug]].ts`: Pages Functions の挙動を Static Assets 設定と `_redirects` で表現できた後に削除する。
- 削除 `functions/tsconfig.json`: `functions/` 配下のファイルがなくなる場合は、Pages Functions 専用の TypeScript 設定を削除する。
- 任意で作成 `src/worker.ts`: 宣言的リダイレクトで必要な 301 を満たせない場合のみ追加する。

## Task 1: ベースライン確認

**Files:**
- Read: `.node-version`
- Read: `package.json`
- Read: `astro.config.mjs`
- Read: `public/_redirects`
- Read: `functions/posts/[[slug]].ts`

- [ ] **Step 1: ブランチと作業ツリーを確認する**

Run:

```bash
git branch --show-current
git status --short
```

Expected:

```text
astro-workers-static-assets-upgrade
```

`git status --short` は、この計画ファイルを同じセッションでコミットする前であれば plan file を表示してよい。無関係なユーザー変更は表示されないこと。

- [ ] **Step 2: 現在のビルドを実行する**

Run:

```bash
pnpm build
```

Expected: ビルドが成功する、または現在のローカル Node バージョンが更新後ツールの要求を満たさないことだけを理由に失敗する。依存関係を変更する前に結果を記録する。

- [ ] **Step 3: 計画が未コミットならコミットする**

Run:

```bash
git add docs/superpowers/plans/2026-05-24-astro-workers-static-assets-upgrade.md
git commit -m "docs: add Astro Workers upgrade implementation plan"
```

Expected: docs のみのコミットが 1 つ作成される。

## Task 2: Node と依存関係を更新する

**Files:**
- Modify: `.node-version`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Node 24 LTS を設定する**

`.node-version` を次の内容にする。

```text
24.15.0
```

- [ ] **Step 2: npm からパッケージバージョンを更新する**

Run:

```bash
pnpm update astro @astrojs/check @astrojs/mdx @astrojs/rss @astrojs/sitemap @cloudflare/workers-types typescript wrangler --latest
```

Expected:

- `package.json` の `astro` が最新の 6.x 系になる。
- `wrangler` が最新の 4.x 系になる。
- `pnpm-lock.yaml` が更新される。
- `@astrojs/cloudflare` は追加されない。

- [ ] **Step 3: 依存関係の差分を確認する**

Run:

```bash
git diff -- package.json pnpm-lock.yaml .node-version
```

Expected: ランタイムとツール更新だけが含まれる。新しいアプリケーションフレームワークや Cloudflare adapter 依存関係は追加されていないこと。

- [ ] **Step 4: 依存関係更新をコミットする**

Run:

```bash
git add .node-version package.json pnpm-lock.yaml
git commit -m "chore: upgrade Astro tooling and Node"
```

Expected: Node と依存関係更新だけを含むコミットが 1 つ作成される。

## Task 3: 静的 Astro 出力と Workers Static Assets を設定する

**Files:**
- Modify: `astro.config.mjs`
- Modify: `package.json`
- Create: `wrangler.jsonc`

- [ ] **Step 1: Astro の trailing slash mode を設定する**

`astro.config.mjs` を更新し、既存の `site` と同じ階層に `trailingSlash: "never"` を含める。

```js
export default defineConfig({
  site: "https://oknm.jp",
  trailingSlash: "never",
  integrations: [mdx(), sitemap()],

  markdown: {
    remarkPlugins: [remarkBreaks, [remarkHeadingShift, 1]],
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
```

- [ ] **Step 2: Workers Static Assets 設定を追加する**

`wrangler.jsonc` を作成する。

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "oknmjp",
  "compatibility_date": "2026-05-24",
  "assets": {
    "directory": "./dist",
    "html_handling": "drop-trailing-slash"
  }
}
```

- [ ] **Step 3: preview script を更新する**

`package.json` の scripts を変更し、`preview` は Pages ではなく Workers Static Assets を使う。

```json
"preview": "wrangler dev"
```

既存の `dev`、`lint`、`start`、`build`、`astro` scripts は維持する。

- [ ] **Step 4: 新しい設定でビルドする**

Run:

```bash
pnpm build
```

Expected: `astro check` と `astro build` が成功し、`dist/` が再生成される。

- [ ] **Step 5: 静的アセット設定をコミットする**

Run:

```bash
git add astro.config.mjs package.json wrangler.jsonc
git commit -m "chore: configure Workers Static Assets"
```

Expected: Astro 設定、Wrangler 設定、script 変更を含むコミットが 1 つ作成される。

## Task 4: Pages Functions をリダイレクトルールに置き換える

**Files:**
- Modify: `public/_redirects`
- Delete: `functions/posts/[[slug]].ts`
- Delete: `functions/tsconfig.json`

- [ ] **Step 1: `_redirects` を更新する**

`public/_redirects` を次の内容にする。

```text
/posts/2022-11-06-google-cloud-sdk-release-notes-feed /posts/2022-11-06-google-cloud-cli-release-notes-feed 301
/posts/*/ /posts/:splat 301
```

- [ ] **Step 2: Pages Functions を削除する**

次を削除する。

```text
functions/posts/[[slug]].ts
functions/tsconfig.json
```

- [ ] **Step 3: Pages Functions 参照が残っていないことを確認する**

Run:

```bash
rg -n "PagesFunction|wrangler pages|functions/" package.json astro.config.mjs wrangler.jsonc functions src public docs
```

Expected: Pages Functions への runtime 参照が残っていない。承認済み spec やこの plan 内の参照は許容する。

- [ ] **Step 4: ビルドしてコピーされた redirects を確認する**

Run:

```bash
pnpm build
cat dist/_redirects
```

Expected: `dist/_redirects` に `public/_redirects` の 2 つのリダイレクトルールが含まれる。

- [ ] **Step 5: リダイレクト移行をコミットする**

Run:

```bash
git add public/_redirects functions/posts/[[slug]].ts functions/tsconfig.json
git commit -m "chore: replace Pages Functions with redirects"
```

Expected: Pages Functions の削除とリダイレクトルール更新を含むコミットが 1 つ作成される。

## Task 5: Workers Static Assets preview を検証する

**Files:**
- No planned source edits.
- Optional modify: `public/_redirects`
- Optional create: `src/worker.ts`
- Optional modify: `wrangler.jsonc`

- [ ] **Step 1: preview を起動する**

Run:

```bash
pnpm preview
```

Expected: Wrangler がローカル dev server を起動し、localhost URL を表示する。以降の確認のため起動したままにする。

- [ ] **Step 2: 通常ページを確認する**

別の shell で実行する。Wrangler が別ポートを表示した場合は `8787` を置き換える。

```bash
curl -I http://localhost:8787/
```

Expected: HTTP status `200`。

- [ ] **Step 3: RSS route を確認する**

Run:

```bash
curl -I http://localhost:8787/feed
```

Expected: HTTP status `200` で、`content-type` に `application/rss+xml` が含まれる。

- [ ] **Step 4: sitemap route を確認する**

Run:

```bash
curl -I http://localhost:8787/sitemap-index.xml
```

Expected: HTTP status `200`。

- [ ] **Step 5: 過去 URL リダイレクトを確認する**

Run:

```bash
curl -I http://localhost:8787/posts/2022-11-06-google-cloud-sdk-release-notes-feed
```

Expected: HTTP status `301` で、`location` が `/posts/2022-11-06-google-cloud-cli-release-notes-feed`。

- [ ] **Step 6: 末尾スラッシュのリダイレクトを確認する**

`src/content/posts` から存在する生成済み投稿 slug を選び、次を実行する。

```bash
curl -I http://localhost:8787/posts/2022-11-06-google-cloud-cli-release-notes-feed/
```

Expected: HTTP status `301` で、`location` が `/posts/2022-11-06-google-cloud-cli-release-notes-feed`。

- [ ] **Step 7: 末尾スラッシュのリダイレクトが失敗した場合、最小 Worker fallback を追加する**

Step 6 が 301 を返さなかった場合のみ、この step を実行する。`src/worker.ts` を作成する。

```ts
export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1)
      return Response.redirect(url.toString(), 301)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<{ ASSETS: Fetcher }>
```

その後、`wrangler.jsonc` を entrypoint ありの設定へ更新する。

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "oknmjp",
  "main": "src/worker.ts",
  "compatibility_date": "2026-05-24",
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist",
    "html_handling": "drop-trailing-slash"
  }
}
```

`pnpm build` を実行し、`pnpm preview` を再起動してから、Steps 2 から 6 を再実行する。

- [ ] **Step 8: 検証で必要になった場合のみ fallback をコミットする**

Step 7 が必要だった場合は実行する。

```bash
git add src/worker.ts wrangler.jsonc
git commit -m "fix: canonicalize trailing slash URLs in Worker"
```

Expected: 宣言的な Static Assets 設定では 301 要件を満たせなかった場合のみ、このコミットが存在する。

## Task 6: 最終検証と cleanup

**Files:**
- Modify: 検証で見つかった問題を修正するために必要なファイル。

- [ ] **Step 1: formatting check を実行する**

Run:

```bash
pnpm lint
```

Expected: Prettier check が成功する。

- [ ] **Step 2: production build を実行する**

Run:

```bash
pnpm build
```

Expected: `astro check` と `astro build` が成功する。

- [ ] **Step 3: Cloudflare Pages のデプロイコマンドが残っていないことを確認する**

Run:

```bash
rg -n "wrangler pages|PagesFunction|@astrojs/cloudflare" package.json pnpm-lock.yaml astro.config.mjs wrangler.jsonc src public functions
```

Expected: `functions` が存在せず `rg` が missing path を報告する場合を除き、match しないこと。プロジェクトは `@astrojs/cloudflare` に依存しない。

- [ ] **Step 4: 最終差分を確認する**

Run:

```bash
git status --short
git diff --stat main...HEAD
```

Expected: 変更は承認済みアップグレード範囲に限られる。つまり spec/plan docs、Node/tooling 更新、Astro 設定、Wrangler 設定、redirects、Pages Functions 削除のみ。

- [ ] **Step 5: 最終修正があればコミットする**

検証で小さな修正が必要だった場合はコミットする。

```bash
git add .
git commit -m "fix: complete Workers Static Assets migration"
```

Expected: 追加修正がなければコミットしない。
