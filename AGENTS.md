# AGENTS.md

## Project

Astro 6 static site (basics starter template). Single-page app at this stage, no integrations configured yet.

## Requirements

- Node >= 22.12.0 (enforced in `package.json` `engines`)
- No lockfile committed — run `npm install` to generate `node_modules`

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (localhost:4321) |
| Production build | `npm run build` (outputs to `dist/`) |
| Preview build | `npm run preview` |
| Type check | `npx astro check` |
| Add integration | `npx astro add <name>` |

No linter, formatter, or test runner configured.

## Architecture

```
src/
  pages/       → File-based routing (.astro files become routes)
  layouts/     → Page shells (Layout.astro wraps pages via <slot />)
  components/  → Reusable .astro components
  assets/      → Processed static assets (images, SVGs)
public/        → Unprocessed static files served at root
```

## Key Conventions

- **TypeScript**: Strict mode via `astro/tsconfigs/strict`
- **ESM only**: `"type": "module"` in package.json
- **Astro components**: Use `.astro` extension with frontmatter fences (`---`)
- **Config**: `astro.config.mjs` — currently empty, add integrations here
- **Generated types**: `.astro/` dir is gitignored; regenerated on dev/build

## Gotchas

- No CSS framework or UI library installed — styles are component-scoped `<style>` blocks by default
- No SSR adapter — builds to static HTML only
- `dist/` and `.astro/` are gitignored; never commit them
