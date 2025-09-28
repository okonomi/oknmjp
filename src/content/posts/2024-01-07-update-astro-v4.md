---
title: "Astro 4.1にアップデートした"
pubDate: "2024-01-07"
---

このブログをAstro 4.1にアップデートした。

- [Astro 4.0 | Astro](https://astro.build/blog/astro-4/)
- [Astro 4.1 | Astro](https://astro.build/blog/astro-410/)

`npx @astrojs/upgrade`を実行するとエラーが出てしまったので、いったんv3の最新に上げてから再度実行した。

けどやっぱりだめだった。なんかバージョンの依存関係がコンフリクトしてるようだったので、`package.json`を手動で編集してv4に上げた。

Dev Toolbarが追加されて、ドキュメント参照とかしやすくていい感じ。
