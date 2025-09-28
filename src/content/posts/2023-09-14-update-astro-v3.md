---
title: "Astro 3.0にアップデートした"
pubDate: "2023-09-14"
---

このブログをAstro 3.0にアップデートした。

[Astro 3.0 | Astro](https://astro.build/blog/astro-3/)

3.0からNode 16が非対応になったので、合わせてNode 18にアップデートした。

Node 18へのアップデートはCloudflare PagesがNode 18に対応してないので見合わせてたけど、いま確認したら対応してるらしかった。

- https://github.com/cloudflare/pages-build-image/discussions/1#discussioncomment-5927573
- [Modernizing the toolbox for Cloudflare Pages builds](https://blog.cloudflare.com/moderizing-cloudflare-pages-builds-toolbox/)
- [Language support and tools · Cloudflare Pages docs](https://developers.cloudflare.com/pages/platform/language-support-and-tools/)

ビルドシステムのv1もv2もNode.jsのSupported VersionsがAny Versionになってる。
