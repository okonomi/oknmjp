# Astro and Cloudflare Workers Static Assets Upgrade Design

## Goal

Upgrade the blog's technical stack while keeping the site as a static Astro blog:

- Upgrade Astro and related tooling to current versions.
- Move deployment from Cloudflare Pages to Cloudflare Workers Static Assets.
- Do not convert the blog into an Astro SSR or Worker application.
- Canonicalize post URLs without trailing slashes using 301 redirects.

## Current State

The project currently uses Astro 5, Node 20, Wrangler 3, and Cloudflare Pages Functions. The only Pages Function is `functions/posts/[[slug]].ts`, which handles one historical article redirect and makes extensionless post URLs work when the incoming URL omits a trailing slash.

The blog content itself is static Markdown/MDX content under `src/content/posts`, with generated pages in `src/pages/posts/[...slug].astro`. There is no current need for server-side rendering, API routes, or runtime application state.

## Chosen Approach

Use Cloudflare Workers Static Assets without a Worker entrypoint.

The deployment should be configured with `wrangler.jsonc` and an `assets.directory` pointing at `./dist`. Astro should remain a static build. The Cloudflare adapter should not be added.

Trailing-slash behavior should be handled with Workers Static Assets configuration and redirects:

- Set `assets.html_handling` to `drop-trailing-slash`.
- Keep redirect rules in `public/_redirects` so Astro copies them into `dist/_redirects`.
- Add explicit 301 redirect rules for known legacy URLs.
- Add a post URL trailing-slash redirect rule if Workers `_redirects` pattern support handles the required path shape.

This keeps deployment behavior declarative. A Worker script should only be introduced if verification proves that `_redirects` and `html_handling` cannot satisfy the 301 URL canonicalization requirement.

## Dependency and Runtime Changes

Astro 6 and Wrangler 4 require a newer Node runtime than the project currently declares. The upgrade should include:

- Updating `.node-version` to a Node 22 release compatible with Astro and Wrangler.
- Updating `astro`, `@astrojs/*` packages, `wrangler`, `@cloudflare/workers-types`, TypeScript, and related tooling through `pnpm`.
- Updating `pnpm-lock.yaml`.
- Changing `preview` away from `wrangler pages dev ./dist` to a Workers Static Assets preview command.

Exact package versions should be resolved during implementation from npm rather than hard-coded from this design.

## URL Behavior

The canonical post URL form is:

```text
/posts/example-slug
```

The non-canonical form should permanently redirect:

```text
/posts/example-slug/ -> /posts/example-slug
```

The existing historical redirect must also remain permanent:

```text
/posts/2022-11-06-google-cloud-sdk-release-notes-feed -> /posts/2022-11-06-google-cloud-cli-release-notes-feed
```

The implementation should avoid changing article slugs or generated content paths beyond what is necessary for canonical URL handling.

## Verification

Implementation is complete only after these checks pass locally:

- `pnpm build`
- Workers Static Assets preview starts successfully.
- A normal page returns `200`.
- `/posts/2022-11-06-google-cloud-sdk-release-notes-feed` returns `301` to the renamed post URL.
- A post URL with a trailing slash returns `301` to the same URL without the trailing slash.
- RSS and sitemap routes still return `200`.

If local preview reveals that `html_handling` returns a non-301 status for the required canonicalization, or `_redirects` cannot express the general post trailing-slash rule, add the smallest possible Worker entrypoint that performs only URL normalization and delegates all asset serving to Static Assets.

## Non-Goals

- No Astro SSR migration.
- No `@astrojs/cloudflare` adapter unless a future feature needs runtime rendering.
- No new blog features.
- No unrelated redesign or content migration.
