# Astro Workers Static Assets Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the static Astro blog to current tooling and deploy it with Cloudflare Workers Static Assets without turning it into an Astro SSR or Worker application.

**Architecture:** Astro remains a static site generator that writes `dist/`. Cloudflare Workers Static Assets serves `dist/` directly through `wrangler.jsonc`, with `_redirects` and `assets.html_handling` handling URL canonicalization. A Worker entrypoint is only added if local preview proves the declarative redirect setup cannot produce the required 301 responses.

**Tech Stack:** Astro 6, Node 24 LTS, pnpm 10, Wrangler 4, Cloudflare Workers Static Assets, Cloudflare `_redirects`.

---

## File Structure

- Modify `.node-version`: declare Node 24 LTS for local and CI build environments.
- Modify `package.json`: update scripts and dependency ranges.
- Modify `pnpm-lock.yaml`: lock the upgraded dependency graph after `pnpm` updates.
- Modify `astro.config.mjs`: set static URL generation to the trailing-slash-free shape.
- Create `wrangler.jsonc`: configure Workers Static Assets with `assets.directory = "./dist"` and `assets.html_handling = "drop-trailing-slash"`.
- Modify `public/_redirects`: keep the existing legacy redirect and add post trailing-slash canonicalization if the rule works in local preview.
- Delete `functions/posts/[[slug]].ts`: remove Pages Functions after its behavior is represented by Static Assets configuration and `_redirects`.
- Delete `functions/tsconfig.json`: remove Pages Functions-only TypeScript config if no `functions/` files remain.
- Optionally create `src/worker.ts`: only if declarative redirects cannot satisfy the required 301 behavior.

## Task 1: Capture Baseline

**Files:**
- Read: `.node-version`
- Read: `package.json`
- Read: `astro.config.mjs`
- Read: `public/_redirects`
- Read: `functions/posts/[[slug]].ts`

- [ ] **Step 1: Verify branch and worktree**

Run:

```bash
git branch --show-current
git status --short
```

Expected:

```text
astro-workers-static-assets-upgrade
```

`git status --short` may show the plan file if this plan is being committed in the same session. It should not show unrelated user changes.

- [ ] **Step 2: Run the current build**

Run:

```bash
pnpm build
```

Expected: build either passes, or fails only because the current local Node version does not satisfy upgraded tooling requirements. Record the result before changing dependencies.

- [ ] **Step 3: Commit the plan if it is not already committed**

Run:

```bash
git add docs/superpowers/plans/2026-05-24-astro-workers-static-assets-upgrade.md
git commit -m "docs: add Astro Workers upgrade implementation plan"
```

Expected: one docs-only commit.

## Task 2: Upgrade Node and Dependencies

**Files:**
- Modify: `.node-version`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Set Node 24 LTS**

Edit `.node-version` to:

```text
24.15.0
```

- [ ] **Step 2: Update package versions from npm**

Run:

```bash
pnpm update astro @astrojs/check @astrojs/mdx @astrojs/rss @astrojs/sitemap @cloudflare/workers-types typescript wrangler --latest
```

Expected:

- `package.json` has `astro` in the latest 6.x range.
- `wrangler` is in the latest 4.x range.
- `pnpm-lock.yaml` is updated.
- No `@astrojs/cloudflare` package is added.

- [ ] **Step 3: Inspect dependency changes**

Run:

```bash
git diff -- package.json pnpm-lock.yaml .node-version
```

Expected: only runtime/tooling updates. There should be no new application framework or Cloudflare adapter dependency.

- [ ] **Step 4: Commit dependency upgrade**

Run:

```bash
git add .node-version package.json pnpm-lock.yaml
git commit -m "chore: upgrade Astro tooling and Node"
```

Expected: one commit containing only Node and dependency updates.

## Task 3: Configure Static Astro Output and Workers Static Assets

**Files:**
- Modify: `astro.config.mjs`
- Modify: `package.json`
- Create: `wrangler.jsonc`

- [ ] **Step 1: Set Astro trailing slash mode**

Update `astro.config.mjs` so the exported config contains `trailingSlash: "never"` alongside the existing `site` value:

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

- [ ] **Step 2: Add Workers Static Assets config**

Create `wrangler.jsonc`:

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

- [ ] **Step 3: Update preview script**

Change `package.json` scripts so `preview` uses Workers Static Assets instead of Pages:

```json
"preview": "wrangler dev"
```

Keep the existing `dev`, `lint`, `start`, `build`, and `astro` scripts.

- [ ] **Step 4: Build with the new config**

Run:

```bash
pnpm build
```

Expected: `astro check` and `astro build` pass, and `dist/` is regenerated.

- [ ] **Step 5: Commit static assets configuration**

Run:

```bash
git add astro.config.mjs package.json wrangler.jsonc
git commit -m "chore: configure Workers Static Assets"
```

Expected: one commit containing Astro config, Wrangler config, and script changes.

## Task 4: Replace Pages Functions With Redirect Rules

**Files:**
- Modify: `public/_redirects`
- Delete: `functions/posts/[[slug]].ts`
- Delete: `functions/tsconfig.json`

- [ ] **Step 1: Update `_redirects`**

Set `public/_redirects` to:

```text
/posts/2022-11-06-google-cloud-sdk-release-notes-feed /posts/2022-11-06-google-cloud-cli-release-notes-feed 301
/posts/*/ /posts/:splat 301
```

- [ ] **Step 2: Remove Pages Functions**

Delete:

```text
functions/posts/[[slug]].ts
functions/tsconfig.json
```

- [ ] **Step 3: Confirm no Pages Functions references remain**

Run:

```bash
rg -n "PagesFunction|wrangler pages|functions/" package.json astro.config.mjs wrangler.jsonc functions src public docs
```

Expected: no runtime references to Pages Functions remain. References in the approved spec or this plan are acceptable.

- [ ] **Step 4: Build and inspect copied redirects**

Run:

```bash
pnpm build
cat dist/_redirects
```

Expected: `dist/_redirects` contains both redirect rules from `public/_redirects`.

- [ ] **Step 5: Commit redirect migration**

Run:

```bash
git add public/_redirects functions/posts/[[slug]].ts functions/tsconfig.json
git commit -m "chore: replace Pages Functions with redirects"
```

Expected: one commit removing Pages Functions and updating redirect rules.

## Task 5: Verify Workers Static Assets Preview

**Files:**
- No planned source edits.
- Optional modify: `public/_redirects`
- Optional create: `src/worker.ts`
- Optional modify: `wrangler.jsonc`

- [ ] **Step 1: Start preview**

Run:

```bash
pnpm preview
```

Expected: Wrangler starts a local dev server and prints a localhost URL. Keep it running for the following checks.

- [ ] **Step 2: Check normal page**

In another shell, replace `8787` if Wrangler prints a different port:

```bash
curl -I http://localhost:8787/
```

Expected: HTTP status `200`.

- [ ] **Step 3: Check RSS route**

Run:

```bash
curl -I http://localhost:8787/feed
```

Expected: HTTP status `200` and `content-type` includes `application/rss+xml`.

- [ ] **Step 4: Check sitemap route**

Run:

```bash
curl -I http://localhost:8787/sitemap-index.xml
```

Expected: HTTP status `200`.

- [ ] **Step 5: Check legacy redirect**

Run:

```bash
curl -I http://localhost:8787/posts/2022-11-06-google-cloud-sdk-release-notes-feed
```

Expected: HTTP status `301` and `location` is `/posts/2022-11-06-google-cloud-cli-release-notes-feed`.

- [ ] **Step 6: Check trailing-slash redirect**

Choose an existing generated post slug from `src/content/posts`, then run:

```bash
curl -I http://localhost:8787/posts/2022-11-06-google-cloud-cli-release-notes-feed/
```

Expected: HTTP status `301` and `location` is `/posts/2022-11-06-google-cloud-cli-release-notes-feed`.

- [ ] **Step 7: If trailing-slash redirect fails, add the minimal Worker fallback**

Only perform this step if Step 6 does not return a 301. Create `src/worker.ts`:

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

Then update `wrangler.jsonc` to include the entrypoint:

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

Run `pnpm build` and restart `pnpm preview`, then repeat Steps 2 through 6.

- [ ] **Step 8: Commit verification-driven fallback only if needed**

If Step 7 was needed, run:

```bash
git add src/worker.ts wrangler.jsonc
git commit -m "fix: canonicalize trailing slash URLs in Worker"
```

Expected: commit exists only if the declarative Static Assets configuration could not satisfy the 301 requirement.

## Task 6: Final Verification and Cleanup

**Files:**
- Modify: any file needed to fix issues found by verification.

- [ ] **Step 1: Run formatting check**

Run:

```bash
pnpm lint
```

Expected: Prettier check passes.

- [ ] **Step 2: Run production build**

Run:

```bash
pnpm build
```

Expected: `astro check` and `astro build` pass.

- [ ] **Step 3: Confirm no Cloudflare Pages deployment command remains**

Run:

```bash
rg -n "wrangler pages|PagesFunction|@astrojs/cloudflare" package.json pnpm-lock.yaml astro.config.mjs wrangler.jsonc src public functions
```

Expected: no matches, unless `functions` no longer exists and `rg` reports it as missing. The project should not depend on `@astrojs/cloudflare`.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git diff --stat main...HEAD
```

Expected: changes are limited to the approved upgrade scope: spec/plan docs, Node/tooling updates, Astro config, Wrangler config, redirects, and Pages Functions removal.

- [ ] **Step 5: Commit any final fixes**

If verification required small fixes, commit them:

```bash
git add .
git commit -m "fix: complete Workers Static Assets migration"
```

Expected: no commit if there were no additional fixes.
