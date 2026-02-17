# uplnk docs

Documentation site for uplnk, built with [VitePress](https://vitepress.dev/).

## Commands

- `pnpm run dev` — Start dev server (from this package)
- `pnpm run build` — Build static site to `.vitepress/dist`
- `pnpm run preview` — Preview production build

From the repo root: `pnpm run docs:dev`, `pnpm run docs:build`, `pnpm run docs:preview`.

## Deployment

The site is deployed to GitHub Pages via the [Deploy docs](../../.github/workflows/docs.yml) workflow on push to `main`.

**Setup:** In the repo **Settings → Pages**, set **Source** to **GitHub Actions**. The workflow builds this package and deploys `.vitepress/dist`.

If the repo name is not `uplnk`, update `base` in [.vitepress/config.mts](.vitepress/config.mts) to `"/your-repo-name/"` so assets load correctly.
