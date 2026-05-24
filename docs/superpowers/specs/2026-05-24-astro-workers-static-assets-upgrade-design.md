# Astro と Cloudflare Workers Static Assets へのアップグレード設計

## 目的

ブログを静的な Astro サイトとして維持したまま、技術スタックを更新する。

- Astro と関連ツールを現在のバージョンへ更新する。
- デプロイ先を Cloudflare Pages から Cloudflare Workers Static Assets へ移行する。
- ブログを Astro SSR や Worker アプリケーションにはしない。
- 投稿 URL は末尾スラッシュなしを正規 URL とし、301 リダイレクトで正規化する。

## 現状

現在のプロジェクトは Astro 5、Node 20、Wrangler 3、Cloudflare Pages Functions を使っている。Pages Function は `functions/posts/[[slug]].ts` のみで、過去記事 URL のリダイレクト 1 件と、末尾スラッシュなしでアクセスされた投稿 URL の補完を担当している。

ブログ本文は `src/content/posts` 配下の静的な Markdown/MDX で、投稿ページは `src/pages/posts/[...slug].astro` から生成されている。現時点ではサーバーサイドレンダリング、API ルート、実行時のアプリケーション状態は不要。

## 採用方針

Worker entrypoint を持たない Cloudflare Workers Static Assets として配信する。

デプロイ設定は `wrangler.jsonc` に置き、`assets.directory` は `./dist` を指す。Astro は静的ビルドのまま維持し、Cloudflare adapter は追加しない。

末尾スラッシュの扱いは Workers Static Assets の設定とリダイレクトで処理する。

- `assets.html_handling` は `drop-trailing-slash` にする。
- リダイレクトルールは `public/_redirects` に置き、Astro が `dist/_redirects` へコピーする形にする。
- 既知の過去 URL には明示的な 301 リダイレクトルールを追加する。
- Workers の `_redirects` パターンで必要な形を表現できる場合は、投稿 URL の末尾スラッシュ用 301 リダイレクトルールも追加する。

これにより、配信時の挙動は宣言的な設定に収まる。検証の結果 `_redirects` と `html_handling` だけでは 301 による URL 正規化を満たせない場合に限り、Worker スクリプトを追加する。

## 依存関係とランタイムの変更

Astro 6 と Wrangler 4 は、現在プロジェクトで宣言している Node より新しいランタイムを要求する。アップグレードには次を含める。

- `.node-version` を Astro と Wrangler に対応する Node 22 系へ更新する。
- `pnpm` で `astro`、`@astrojs/*` パッケージ、`wrangler`、`@cloudflare/workers-types`、TypeScript、関連ツールを更新する。
- `pnpm-lock.yaml` を更新する。
- `preview` は `wrangler pages dev ./dist` ではなく、Workers Static Assets 用の preview コマンドへ変更する。

具体的なパッケージバージョンは、この設計書に固定せず、実装時に npm から解決する。

## URL の挙動

投稿 URL の正規形は次の通り。

```text
/posts/example-slug
```

非正規形は恒久的にリダイレクトする。

```text
/posts/example-slug/ -> /posts/example-slug
```

既存の過去 URL リダイレクトも恒久的なリダイレクトとして維持する。

```text
/posts/2022-11-06-google-cloud-sdk-release-notes-feed -> /posts/2022-11-06-google-cloud-cli-release-notes-feed
```

実装では、URL 正規化に必要な範囲を超えて記事 slug や生成されるコンテンツパスを変更しない。

## 検証

実装完了とみなすには、ローカルで次の確認を通す。

- `pnpm build`
- Workers Static Assets の preview が正常に起動する。
- 通常ページが `200` を返す。
- `/posts/2022-11-06-google-cloud-sdk-release-notes-feed` が変更後の投稿 URL へ `301` を返す。
- 末尾スラッシュ付きの投稿 URL が、同じ URL の末尾スラッシュなし形式へ `301` を返す。
- RSS と sitemap のルートが引き続き `200` を返す。

ローカル preview で、必要な正規化に対して `html_handling` が 301 以外を返すことが判明した場合、または `_redirects` で投稿 URL 全般の末尾スラッシュルールを表現できない場合は、URL 正規化だけを行い、静的アセット配信は Static Assets に委譲する最小限の Worker entrypoint を追加する。

## 対象外

- Astro SSR への移行はしない。
- 将来の機能で実行時レンダリングが必要になるまで、`@astrojs/cloudflare` adapter は追加しない。
- 新しいブログ機能は追加しない。
- 関係のないデザイン変更やコンテンツ移行は行わない。
