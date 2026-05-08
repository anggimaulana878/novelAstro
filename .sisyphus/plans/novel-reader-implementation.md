# Novel Reader — Implementation Plan

## Reference

- Spec: `docs/superpowers/specs/novel-reader.md`
- Data: `public/novels/index.json` + per-novel `info.json` + `vol-XXX.json.br`

---

## Phase 1: Foundation (Layouts, Styles, Core Scripts)

### 1.1 Global Styles + CSS Variables

**File**: `src/styles/global.css`

- CSS reset (minimal — box-sizing, margin, font smoothing)
- CSS custom properties for theming:
  - `--color-bg`, `--color-text`, `--color-accent`, `--color-muted`
  - `--color-surface`, `--color-border`
  - Light theme defaults, dark theme via `[data-theme="dark"]` on `<html>`
- Typography variables:
  - `--font-serif`, `--font-sans`, `--font-mono`
  - `--font-size-1` through `--font-size-5` (14px, 16px, 18px, 20px, 24px)
  - `--line-height: 1.75`
- Safe area padding: `env(safe-area-inset-*)`
- Utility: `.visually-hidden`, `.touch-target` (min 44px)

### 1.2 Theme Script

**File**: `src/scripts/theme.ts`

- Read `reader-settings.theme` from localStorage
- Apply `data-theme` attribute on `<html>` (light/dark)
- System preference detection via `matchMedia('(prefers-color-scheme: dark)')`
- Listen for system changes when mode = 'system'
- Export: `getTheme()`, `setTheme(mode)`, `initTheme()`

### 1.3 Storage Helpers

**File**: `src/scripts/storage.ts`

- Type-safe localStorage wrapper
- `getProgress(slug): NovelProgress | null`
- `setProgress(slug, data): void`
- `getSettings(): ReaderSettings`
- `setSettings(settings): void`
- Default settings: `{ theme: 'system', fontSize: 3, fontFamily: 'sans' }`

### 1.4 Base Layout

**File**: `src/layouts/BaseLayout.astro`

- HTML shell with `<meta viewport>`, charset, safe-area viewport-fit=cover
- Inline theme init script (prevent FOUC — runs before paint)
- Import `global.css`
- `<slot />` for page content
- No `<nav>` or `<footer>` at layout level (pages own their chrome)

### 1.5 Reader Layout

**File**: `src/layouts/ReaderLayout.astro`

- Extends BaseLayout
- Minimal chrome: auto-hiding header + bottom nav
- `<article>` wrapper with `class="chapter-content"` for TTS targeting
- `aria-hidden="true"` on nav elements
- Schema.org JSON-LD with `speakable` specification
- Props: `title`, `canonical`, `description`

---

## Phase 2: Home Page

### 2.1 Home Page

**File**: `src/pages/index.astro`

- Fetch `public/novels/index.json` at build time (Astro frontmatter)
- Render novel grid (2 columns)
- Client-side: read localStorage progress, sort by lastReadAt, update progress bars
- Empty state if no progress yet (still show all novels)

### 2.2 Novel Card Component

**File**: `src/components/NovelCard.astro`

- Props: `slug`, `title`, `cover`, `totalChapters`
- Cover image with lazy loading, aspect-ratio container
- Title (truncated 2 lines)
- Progress bar (filled via client JS after hydration)
- Last read date (relative — "2 days ago")
- Link to `/novel/[slug]`

---

## Phase 3: Novel Detail Page

### 3.1 Novel Detail Page

**File**: `src/pages/novel/[slug].astro`

- `getStaticPaths()`: read `index.json`, generate path per novel
- Fetch `info.json` for the novel at build time
- Render: cover, title, author, genres, synopsis (collapsible)
- Chapter list component (client-side hydrated)
- "Continue reading" sticky button

### 3.2 Chapter List Component

**File**: `src/components/ChapterList.astro` + `src/scripts/virtual-scroll.ts`

- Virtual scroll: only render ~20 visible items + buffer
- Each item: chapter number, title (if available), "read" indicator
- Search/filter input at top
- Scroll to current progress on mount
- Tap → navigate to chapter or bundle (depending on mode)

### 3.3 Virtual Scroll Implementation

**File**: `src/scripts/virtual-scroll.ts`

- Calculate visible range from scroll position + container height
- Render items in range + buffer (5 above, 5 below)
- Spacer elements for total height
- Debounced scroll handler (requestAnimationFrame)
- Export: `createVirtualList(container, items, renderItem, itemHeight)`

---

## Phase 4: Single Chapter Reader

### 4.1 Bundle Loader

**File**: `src/scripts/bundle-loader.ts`

- Fetch vol-XXX.json.br (browser handles Brotli decompression)
- Parse JSON → array of chapters `{ number, title, content }`
- Cache fetched bundles in memory (Map)
- Determine which bundle file contains a given chapter number
- Export: `loadChapter(slug, chapterNum)`, `loadChapterRange(slug, from, to)`

### 4.2 Single Chapter Page

**File**: `src/pages/novel/[slug]/chapter/[num].astro`

- `getStaticPaths()`: generate all chapter numbers per novel (from info.json totalChapters)
- SSG: render page shell with loading state
- Client-side: fetch chapter content via bundle-loader, render into DOM
- Update progress in localStorage on load
- Navigation: prev/next chapter links

### 4.3 Reader Navigation Script

**File**: `src/scripts/reader.ts`

- Tap zones: left 25% = prev, right 25% = next, center = toggle UI
- Swipe detection (horizontal, >50px threshold, <300ms)
- Auto-hide header: hide on scroll down (>50px), show on scroll up
- Keyboard: ArrowLeft/Right for prev/next (accessibility)
- Prefetch next chapter on idle (`requestIdleCallback`)

### 4.4 Chapter Content Component

**File**: `src/components/ChapterContent.astro`

- Semantic HTML: `<article>` > `<h1>` chapter title > `<section>` > `<p>` paragraphs
- Content rendered from chapter data (split by newlines → `<p>` tags)
- Proper heading hierarchy for TTS
- `speakable` schema targeting `.chapter-content`

---

## Phase 5: Bundle (Batch Read) Mode

### 5.1 Bundle Page

**File**: `src/pages/novel/[slug]/bundle/[spec].astro`

- `getStaticPaths()`: generate bundle specs from info.json
  - For chapter-range mode: generate `ch-{start}-{end}` for each possible range
  - For word-count mode: these are dynamic (client-side routing via JS)
- SSG shell + client-side content loading
- Render multiple chapters with dividers

### 5.2 Bundle Content Component

**File**: `src/components/BundleContent.astro`

- `<article>` wrapper with `<h1>` bundle title
- Each chapter: `<section>` with `<h2>` + content paragraphs
- Subtle divider between chapters (thin rule + chapter number)
- "Next Bundle" / "Previous Bundle" navigation at bottom
- All nav elements `aria-hidden="true"`

### 5.3 Bundle Settings Logic

- Per-novel toggle: single chapter vs bundle mode
- Bundle type: chapter range or word count
- Chapter range: configurable (5–50, default 20)
- Word count: configurable (5,000–50,000, default 15,000)
- Word boundary rule: exclude chapter that would exceed target

---

## Phase 6: Settings & Polish

### 6.1 Settings Bottom Sheet

**File**: `src/components/SettingsSheet.astro`

- Slide-up bottom sheet (CSS transform + transition)
- Backdrop overlay (tap to close)
- Sections: Theme, Typography, Bundle (conditional)
- Changes apply immediately (live preview)
- Save to localStorage on change

### 6.2 Bottom Navigation Bar

**File**: `src/components/BottomNav.astro`

- Fixed bottom, safe-area aware
- Context-dependent items:
  - Home: grid icon → `/`
  - Novel detail: back arrow, title
  - Reader: chapter selector, settings gear, progress
- 44px minimum touch targets
- `aria-hidden="true"` for TTS exclusion

### 6.3 Progress Bar Component

**File**: `src/components/ProgressBar.astro`

- Thin bar showing chapters read / total
- CSS-only (width percentage via custom property)
- Color: accent color from theme

---

## Phase 7: Performance & SEO

### 7.1 Prefetching

- Astro built-in prefetch for navigation links
- Custom: prefetch next chapter bundle on idle
- Preload cover images above the fold

### 7.2 SEO / Structured Data

- `<title>` and `<meta description>` per page
- Open Graph tags for novel pages
- `<link rel="canonical">` on every page
- JSON-LD Article schema with `speakable` on reader pages

### 7.3 Build Optimization

- Astro static output (no SSR adapter needed)
- Image optimization via Astro `<Image>` component
- Minimal JS: only hydrate interactive islands

---

## Execution Order

| Step | Phase | Depends On | Estimated Complexity |
|------|-------|------------|---------------------|
| 1 | Phase 1 (Foundation) | Nothing | Medium |
| 2 | Phase 2 (Home) | Phase 1 | Low |
| 3 | Phase 3 (Novel Detail) | Phase 1, 2 | Medium |
| 4 | Phase 4 (Single Chapter) | Phase 1, 3 | High |
| 5 | Phase 5 (Bundle Mode) | Phase 4 | High |
| 6 | Phase 6 (Settings/Polish) | Phase 4 | Medium |
| 7 | Phase 7 (Perf/SEO) | All above | Low |

---

## Verification Criteria

- [ ] `npm run build` succeeds with zero errors
- [ ] `npx astro check` passes (TypeScript)
- [ ] All 21 novels render on home page
- [ ] Novel detail shows chapter list with virtual scroll
- [ ] Single chapter loads and displays content
- [ ] Bundle mode loads multiple chapters
- [ ] Theme switching works (light/dark/system)
- [ ] Font size/family changes apply immediately
- [ ] Navigation gestures work (tap zones, swipe)
- [ ] Google Assistant semantic HTML structure verified
- [ ] Progress saves/restores from localStorage
- [ ] No JS errors in browser console
