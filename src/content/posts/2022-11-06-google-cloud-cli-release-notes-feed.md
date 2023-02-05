---
layout: "../../layouts/BlogPost.astro"
title: "Google Cloud CLIのRSSを作った"
pubDate: "2022-11-06 23:30"
---

- 2022-11-07 更新: Google Cloud SDKをGoogle Cloud CLIに表記統一

---

# Google Cloud CLIの更新情報を取得するのがつらい問題

Google Cloud CLI(gcloud CLI)は知る限りはRSSフィードなどは提供されてない。

[gcloud CLI の概要  |  Google Cloud CLI のドキュメント](https://cloud.google.com/sdk/gcloud?hl=ja)

公式には更新情報はふたとおり提供されている。

- [google-cloud-sdk-announce - Google グループ](https://groups.google.com/g/google-cloud-sdk-announce)
- [Google Cloud CLI - Release Notes  |  Google Cloud CLI Documentation](https://cloud.google.com/sdk/docs/release-notes)

Google グループはかつてはRSSフィードが提供されてたけど今はない。グループに参加してメールを受信すればいいんだけど、そこからCIをトリガーしたりSlackに通知したりがひと工夫必要で面倒。
リリースノートページは最初期の0.9.0から最新版(執筆時点408.0.1)までの全バージョンの更新内容が羅列された超絶重いページになっており、開くたびにChromeがしばらく反応しなくなったりしてつらい。

# Google Cloud CLIのRSSを作った

というようにGoogle Cloud CLIのアップデート情報を得るのが面倒な状況なので、RSSを作ってみた。

[RSS for Google Cloud CLI Release Notes](https://okonomi.github.io/google-cloud-cli-release-notes-feed/)

毎日リリースノートページを取得してJSONフィード形式に変換してコミットするというのをGithub Actionsで動かしてる。
JSONなので`jq`で加工すれば最新版のバージョン番号を取得するなども比較的やりやすい。

```
curl "https://okonomi.github.io/google-cloud-cli-release-notes-feed/feeds/0.json" | jq -r ".items[0] | .title" | sed -E "s/^([0-9]+.[0-9]+.[0-9]+).*/\1/"
# 408.0.1
```

…でも手間ではあるのでそれも出力することにした。

```
curl https://okonomi.github.io/google-cloud-cli-release-notes-feed/latest.txt
# 408.0.1
```

Github Actionsで動かしてると言ったけど作ったところなのでほんとに毎日きちんと動くかまだわからない。
本格的にGithub Actionsを触り始めて日が浅いのでよくわかってないことが多い。
わかってないながらもactionの共有の仕組みとか普段使ってるGitlab CIの違いとかおもしろい。

# 参考

[twistedpair/google-cloud-sdk: Mirror of gcloud Google Cloud Platform SDK to track release changes](https://github.com/twistedpair/google-cloud-sdk)

同じようなことを考えてる人はいるようで、たとえば「google cloud sdk release notes」でググると上記リポジトリが上位にヒットする。
でもこれはgcloud CLIのコード変更をトラッキングするのが目的のようだった。このリポジトリのタグを監視することをちょっと考えたけど目的が違うのでやめた。

[azu/github-advisory-database-rss: GitHub Advisory Database RSS Feeds.](https://github.com/azu/github-advisory-database-rss)

Github ActionsでRSSフィードをGithub Pagesにデプロイする方法を参考にさせてもらった。

[JSON Feed](https://www.jsonfeed.org/)

当初はAtomフィードを出力しようとしてたけど偶然JSONフィードの存在を知った。
こちらのほうが新しいフォーマットだしJSONで扱いやすいし各種RSSリーダーも対応してるようなので採用した。
もし必要になればRSSやAtomフィードも生成しようと思う。JSONフィードからRSSやAtomを作るのはそんなに難しくなさそう。

[JSON Feed - Mapping RSS and Atom to JSON Feed](https://www.jsonfeed.org/mappingrssandatom/)

なので記事タイトルは正しくなくて正確には「JSONフィードを作った」だけど、わかりにくいのでRSSにした。
RSSもAtomもひっくるめて「RSS」と呼ばれてる気がするので、そこにJSONフィードも含んでもまあいいのか、という気持ち。
