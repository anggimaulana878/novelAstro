# Novel Reader — Design Specification

## 1. Overview

A mobile-first web novel reader built on Astro 6 (static site). Core differentiator: **batch reading** — users can read multiple chapters as a single continuous page, optimized for Google Assistant "Read It" TTS compatibility.

**Target**: Single user, no auth, 21 novels (~30,000+ chapters), offline-capable reading experience.

---

## 2. Architecture

### Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Astro 6 (static) | Already configured, zero JS by default |
| UI Logic | Vanilla JS (Astro islands) | No framework overhead for a reader app |
| Styling | Component-scoped `<style>` | Astro default, no extra deps |
| State | localStorage | Single user, no sync needed |
| Data | Static JSON in `public/novels/` | Pre-built, Brotli-compressed bundles |
| Routing | Astro file-based | Static pages for SEO + TTS |

### Data Flow

```
public/novels/index.json → Home page (cover grid)
public/novels/[slug]/info.json → Novel detail page
public/novels/[slug]/vol-XXX.json.br → Chapter content (fetched client-side)
```

**Bundle decompression**: Brotli `.br` files are served with `Content-Encoding: brotli` header — browser decompresses transparently. No client-side decompression needed.

---

## 3. URL Scheme

| Route | Purpose |
|-------|---------|
| `/` | Home — novel grid |
| `/novel/[slug]` | Novel detail — info + chapter list |
| `/novel/[slug]/chapter/[num]` | Single chapter view (default mode) |
| `/novel/[slug]/bundle/[spec]` | Bundle view (batch read mode) |

**Bundle spec format**:
- By chapter range: `ch-100-120` (chapters 100–120)
- By word count: `wc-10000-from-100` (≈10,000 words starting from chapter 100)

---

## 4. Pages & Components

### 4.1 Home Page (`/`)

- **Layout**: 2-column cover grid (mobile)
- **Each card**: Cover image, title, progress bar (chapters read / total), last read date
- **Sort**: Last read first (active novels float to top)
- **Empty state**: "Start reading" prompt if no progress

### 4.2 Novel Detail (`/novel/[slug]`)

- **Header**: Cover (large), title, author, genres as tags
- **Synopsis**: Collapsible (3 lines preview + "Show more")
- **Chapter list**: Virtual-scrolled list (handles 1000+ chapters)
  - Search/filter within chapter list
  - Current progress indicator (highlighted chapter)
  - "Continue reading" sticky button at bottom
- **Bundle mode toggle**: Switch between single/bundle reading for this novel
  - Settings saved per-novel in localStorage

### 4.3 Single Chapter View (`/novel/[slug]/chapter/[num]`)

- **Content area**: Full-width, edge-to-edge
- **Navigation**:
  - Tap left edge → previous chapter
  - Tap right edge → next chapter
  - Swipe left/right → prev/next
  - Bottom bar: chapter selector, settings gear
- **Header** (auto-hide on scroll down, show on scroll up):
  - Novel title (truncated), chapter number
  - Back to novel detail

### 4.4 Bundle View (`/novel/[slug]/bundle/[spec]`)

- **Content**: Continuous scroll, chapters joined with subtle dividers
- **Dividers**: Chapter number + title, thin horizontal rule
- **Navigation**: "Next Bundle" / "Previous Bundle" buttons at bottom
- **Google Assistant optimized**:
  - `<article>` wrapper
  - `<h1>` = bundle title (e.g., "Chapters 100–120")
  - Each chapter: `<section>` with `<h2>` chapter title
  - Nav/footer wrapped in `aria-hidden="true"`
  - `speakable` schema.org markup

### 4.5 Settings (Bottom Sheet)

- **Theme**: Light / Dark / System (auto-detect)
- **Font size**: 5 steps (XS, S, M, L, XL)
- **Font family**: Serif / Sans-serif / Monospace
- **Bundle settings** (when in bundle mode):
  - Type: By chapter range / By word count
  - Chapter range: slider (5–50 chapters)
  - Word count target: slider (5,000–50,000 words)

---

## 5. Reading Modes

### Single Chapter (Default)

- One chapter per page
- Standard navigation (tap/swipe)
- Progress saved: last chapter number per novel

### Bundle Mode (Per-Novel Toggle)

- Multiple chapters on one page
- Two sub-modes:
  - **Chapter range**: Fixed number of chapters per bundle
  - **Word count**: Target word count per bundle (excludes chapter that would exceed limit)
- Continuous scroll with chapter dividers
- "Next/Previous Bundle" navigation
- Progress saved: last bundle spec per novel

---

## 6. Google Assistant "Read It" Compatibility

### Requirements Met

| Requirement | Implementation |
|-------------|---------------|
| Clean semantic HTML | `<article>` > `<section>` > `<p>` hierarchy |
| Proper headings | `<h1>` page title, `<h2>` chapter titles |
| Discrete pages | Each chapter/bundle = unique URL |
| Hidden nav elements | `aria-hidden="true"` on nav, footer, settings |
| Canonical URLs | `<link rel="canonical">` on every page |
| Speakable markup | `SpeakableSpecification` schema on content area |
| Paragraph structure | Content already in `<p>` tags (2-4 sentences ideal) |

### HTML Structure (Chapter/Bundle Page)

```html
<html>
<head>
  <link rel="canonical" href="..." />
  <script type="application/ld+json">
    { "@type": "Article", "speakable": { "cssSelector": [".chapter-content"] } }
  </script>
</head>
<body>
  <nav aria-hidden="true"><!-- header nav --></nav>
  
  <article class="chapter-content">
    <h1>Chapter Title / Bundle Title</h1>
    <section>
      <h2>Chapter X</h2><!-- only in bundle mode -->
      <p>Content paragraph...</p>
      <p>Content paragraph...</p>
    </section>
  </article>
  
  <footer aria-hidden="true"><!-- navigation controls --></footer>
</body>
</html>
```

---

## 7. State Management (localStorage)

```typescript
interface NovelProgress {
  [slug: string]: {
    lastChapter: number;
    lastReadAt: string; // ISO date
    bundleMode: boolean;
    bundleType: 'chapters' | 'wordcount';
    bundleSize: number; // chapters or word count target
  };
}

interface ReaderSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 1 | 2 | 3 | 4 | 5;
  fontFamily: 'serif' | 'sans' | 'mono';
}
```

Keys:
- `novel-progress` → `NovelProgress`
- `reader-settings` → `ReaderSettings`

---

## 8. Performance Strategy

| Concern | Solution |
|---------|----------|
| 30K+ chapters | Brotli-compressed bundles (~200 chapters/file, ~350KB) |
| Chapter list (1000+) | Virtual scroll — only render visible items |
| Bundle decompression | Browser-native (Content-Encoding: brotli) |
| Initial load | Static HTML, zero JS until island hydrates |
| Images (covers) | Astro `<Image>` with lazy loading, WebP/AVIF |
| Navigation | Prefetch next chapter/bundle on idle |

---

## 9. Mobile-Only Constraints

- **Viewport**: 320px–480px primary target
- **Touch targets**: Minimum 44×44px
- **Navigation**: Bottom bar (thumb zone)
- **Gestures**: Swipe left/right for chapter nav, pull-down for header
- **Safe areas**: `env(safe-area-inset-*)` for notch/home indicator
- **No hover states**: All interactions are tap/press
- **Grid**: 2 columns max for covers
- **Reading area**: Full viewport width, generous line-height (1.7–1.8)

---

## 10. File Structure (Planned)

```
src/
  pages/
    index.astro                    → Home (novel grid)
    novel/
      [slug].astro                 → Novel detail
      [slug]/
        chapter/[num].astro        → Single chapter
        bundle/[spec].astro        → Bundle view
  layouts/
    BaseLayout.astro               → HTML shell, meta, theme
    ReaderLayout.astro             → Reading-specific (minimal chrome)
  components/
    NovelCard.astro                → Cover card for grid
    ChapterList.astro              → Virtual-scrolled chapter list
    ChapterContent.astro           → Rendered chapter text
    BundleContent.astro            → Multi-chapter continuous view
    BottomNav.astro                → Navigation bar
    SettingsSheet.astro            → Bottom sheet settings
    ProgressBar.astro              → Reading progress indicator
    ThemeToggle.astro              → Light/dark/system switch
  scripts/
    reader.ts                      → Reading logic (navigation, gestures)
    storage.ts                     → localStorage helpers
    bundle-loader.ts               → Fetch + parse bundle JSON
    virtual-scroll.ts              → Virtual scroll implementation
    theme.ts                       → Theme detection + switching
  styles/
    global.css                     → CSS variables, reset, typography
    reader.css                     → Reading-specific styles
```

---

## 11. Open Questions / Future

- **Offline support**: Service Worker for caching read chapters (not in v1)
- **Bookmarks**: Mark specific paragraphs (not in v1)
- **Reading stats**: Time spent, chapters/day (not in v1)
- **Desktop**: Responsive breakpoints if needed later (mobile-only for now)
