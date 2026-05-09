# SSR Batch Reader for Google Assistant "Read It" Compatibility

**Date:** 2026-05-09  
**Status:** Approved  
**Project:** novelAstro - Web Novel Reader

## Problem Statement

The current novel reader uses client-side rendering (CSR) with JavaScript to load chapter content dynamically via `bundle-loader.ts`. This prevents Google Assistant's "Read It" feature from accessing the content, as the HTML source contains no readable text at page load time.

## Solution Overview

Refactor the batch reading mode to use Server-Side Rendering (SSR) with Astro, ensuring all chapter content is present in the HTML at page load. This makes the content accessible to Google Assistant, screen readers, and search engines while maintaining the existing user experience.

## Reading Modes

### 1. Single Mode (Existing - No Changes)
- **URL Pattern:** `/novel/[slug]/read/[chapter]`
- **Example:** `/novel/shadow-slave/read/50`
- **Behavior:** Display one chapter per page
- **File:** `src/pages/novel/[slug]/read/[chapter].astro` (existing)

### 2. Bulk Mode - By Chapter Count (NEW)
- **URL Pattern:** `/novel/[slug]/read/[start]-[end]`
- **Example:** `/novel/shadow-slave/read/1-10`
- **Presets:** 3, 5, 8, 10, 12 chapters (user can edit manually)
- **Behavior:** Display N consecutive chapters in one page

### 3. Bulk Mode - By Word Count (NEW)
- **URL Pattern:** `/novel/[slug]/read/[start]+[words]`
- **Example:** `/novel/shadow-slave/read/50+15000`
- **Presets:** 8000, 15000, 25000 words (user can edit manually)
- **Max:** 25000 words
- **Behavior:** Load chapters starting from `[start]` until cumulative word count reaches `[words]`, but stop before exceeding the target

#### Word Count Logic Example
```
Target: 25000 words, Start: chapter 50
- Chapter 50: 5000 words (total: 5000) ✓
- Chapter 51: 5000 words (total: 10000) ✓
- Chapter 52: 5000 words (total: 15000) ✓
- Chapter 53: 5000 words (total: 20000) ✓
- Chapter 54: 6000 words (total: 26000) ✗ STOP
Result: Load chapters 50-53
```

## Architecture

### URL Routing Strategy

Single entry point: `/novel/[slug]/read/[param]`

**Parameter Detection:**
- Contains `+` → Word count mode (`50+15000`)
- Contains `-` → Chapter range mode (`1-10`)
- Pure number → Single chapter mode (`50`)

### File Structure

```
src/pages/novel/[slug]/read/
  [chapter].astro          # Single mode (existing, no changes)
  [range].astro            # NEW: Bulk modes (handles both chapter and word count)
```

### Server-Side Rendering Flow

```typescript
// In [range].astro

export async function getStaticPaths() {
  // SSR mode - this returns empty array
  // All rendering happens on-demand at request time
  return [];
}

// Request-time logic
const { slug, range } = Astro.params;

if (range.includes('+')) {
  // Word count mode: "50+15000"
  const [start, targetWords] = range.split('+').map(Number);
  const chapters = await loadChaptersUntilWordCount(slug, start, targetWords);
} else if (range.includes('-')) {
  // Chapter range mode: "1-10"
  const [start, end] = range.split('-').map(Number);
  const chapters = await loadChapterRange(slug, start, end);
}
```

## Data Loading

### Bundle File Structure (Existing)
```
public/novels/[slug]/
  index.json              # Novel metadata
  info.json               # Bundle information
  vol-001.json            # Chapters 1-200 (decompressed)
  vol-001.json.br         # Compressed version (original)
  vol-002.json            # Chapters 201-400 (decompressed)
  ...
```

**Bundle Decompression:**
Bundle files are stored as `.json.br` (Brotli compressed) in the repository. The project's `scripts/decompress-bundles.mjs` automatically decompresses them during:
- `npm run dev` (via `predev` script)
- `npm run build` (via `prebuild` script)

The decompressed `.json` files are gitignored and regenerated on each build. Server-side code reads these decompressed `.json` files directly using Node.js `fs` module.

### Server-Side Loading Strategy

**For Chapter Range Mode:**
1. Parse start and end from URL
2. Determine which bundle files contain the needed chapters
3. Read and parse bundle JSON files (server-side fs.readFileSync)
4. Extract chapters in the specified range
5. Process each chapter (sanitize, detect language)

**For Word Count Mode:**
1. Parse start chapter and target word count from URL
2. Load chapters sequentially starting from `start`
3. For each chapter:
   - Strip HTML tags
   - Count words: `text.split(/\s+/).length`
   - Add to cumulative total
4. Stop when next chapter would exceed target
5. Process loaded chapters (sanitize, detect language)

### Bundle Caching Strategy

Since SSR renders on each request, implement in-memory caching:
```typescript
const bundleCache = new Map<string, RawBundle>();

async function loadBundle(slug: string, bundleFile: string) {
  const cacheKey = `${slug}/${bundleFile}`;
  if (bundleCache.has(cacheKey)) {
    return bundleCache.get(cacheKey);
  }
  
  const data = fs.readFileSync(`public/novels/${slug}/${bundleFile}`, 'utf-8');
  const bundle = JSON.parse(data);
  bundleCache.set(cacheKey, bundle);
  return bundle;
}
```

## Content Processing

### Sanitization Function

Remove unsafe and non-semantic HTML while preserving readable content:

```typescript
function sanitizeContent(html: string): string {
  let clean = html;
  
  // Remove dangerous tags
  const dangerousTags = ['script', 'style', 'button', 'form', 'input', 'iframe'];
  for (const tag of dangerousTags) {
    clean = clean.replace(new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis'), '');
    clean = clean.replace(new RegExp(`<${tag}[^>]*/>`, 'gi'), '');
  }
  
  // Convert div to p or section based on context
  // If div contains other block elements → section
  // If div contains only inline content → p
  clean = clean.replace(/<div([^>]*)>(.*?)<\/div>/gis, (match, attrs, content) => {
    const hasBlockElements = /<(p|h[1-6]|section|article|div)/.test(content);
    const tag = hasBlockElements ? 'section' : 'p';
    const cleanAttrs = sanitizeAttributes(attrs);
    return `<${tag}${cleanAttrs}>${content}</${tag}>`;
  });
  
  // Strip all attributes except allowed ones
  clean = clean.replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
    const cleanAttrs = sanitizeAttributes(attrs);
    return `<${tag}${cleanAttrs}>`;
  });
  
  // Remove inline styles
  clean = clean.replace(/\s+style="[^"]*"/gi, '');
  
  return clean;
}

function sanitizeAttributes(attrs: string): string {
  const allowed = ['id', 'class', 'lang', 'role'];
  const ariaPattern = /aria-[\w-]+/;
  
  const attrMatches = attrs.matchAll(/(\w+(?:-\w+)*)="([^"]*)"/g);
  const cleanAttrs: string[] = [];
  
  for (const [, name, value] of attrMatches) {
    if (allowed.includes(name) || ariaPattern.test(name)) {
      cleanAttrs.push(`${name}="${value}"`);
    }
  }
  
  return cleanAttrs.length > 0 ? ' ' + cleanAttrs.join(' ') : '';
}
```

### Language Detection Function

Detect content language for proper `lang` attributes:

```typescript
function detectLanguage(text: string): string {
  // Remove HTML tags and get sample
  const plainText = text.replace(/<[^>]*>/g, '').slice(0, 500);
  
  // CJK characters (Chinese/Japanese Kanji)
  const cjkMatches = plainText.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  if (cjkMatches && cjkMatches.length > plainText.length * 0.3) {
    return 'zh';
  }
  
  // Hiragana/Katakana (Japanese)
  const hiragana = /[\u3040-\u309f]/;
  const katakana = /[\u30a0-\u30ff]/;
  if (hiragana.test(plainText) || katakana.test(plainText)) {
    return 'ja';
  }
  
  // Hangul (Korean)
  const hangul = /[\uac00-\ud7af]/;
  if (hangul.test(plainText)) {
    return 'ko';
  }
  
  // Indonesian keywords
  const indonesianKeywords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan'];
  const words = plainText.toLowerCase().split(/\s+/);
  const indonesianCount = words.filter(w => indonesianKeywords.includes(w)).length;
  if (indonesianCount > 3) {
    return 'id';
  }
  
  // Default to English
  return 'en';
}
```

## HTML Output Structure

### Required Meta Tags

```html
<head>
  <!-- Google Assistant optimization -->
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Novel Title - Chapters X-Y (or X + N words)",
    "inLanguage": "detected-lang",
    "isAccessibleForFree": true,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [
        "#reader-content",
        "#reader-content section",
        "#reader-content p"
      ]
    },
    "accessibilityFeature": [
      "readingOrder",
      "structuralNavigation",
      "alternativeText"
    ],
    "accessMode": ["textual"],
    "accessModeSufficient": [
      { "@type": "ItemList", "itemListElement": ["textual"] }
    ]
  }
  </script>
</head>
```

### Semantic HTML Structure

```html
<body>
  <!-- Navigation with rel attributes for crawlers -->
  <nav aria-label="Batch navigation">
    {prevRange && (
      <a href={`/novel/${slug}/read/${prevRange}`} rel="prev">
        Previous
      </a>
    )}
    {nextRange && (
      <a href={`/novel/${slug}/read/${nextRange}`} rel="next">
        Next
      </a>
    )}
  </nav>

  <!-- Main content with proper semantic structure -->
  <article id="reader-content" role="main" lang={detectedLang}>
    {chapters.map(chapter => (
      <section 
        id={`chapter-${chapter.number}`} 
        lang={chapter.lang}
        role="article"
        aria-label={`Chapter ${chapter.number}: ${chapter.title}`}
      >
        <h2>{chapter.title}</h2>
        {chapter.paragraphs.map(p => (
          <p set:html={sanitize(p)} />
        ))}
      </section>
    ))}
  </article>
</body>
```

**Key Requirements:**
- Use `<article>` for main content container
- Use `<section>` for each chapter
- Use `<p>` for paragraphs (NOT `<div>`)
- Each `<section>` must have `lang` attribute
- Use `<h2>` for chapter titles (NOT `<h1>`)
- Include `role` and `aria-label` for accessibility

## Navigation Logic

### Chapter Range Mode

**Current:** `/novel/shadow-slave/read/1-10`
- **Prev:** None (first batch)
- **Next:** `/novel/shadow-slave/read/11-20`

**Current:** `/novel/shadow-slave/read/11-20`
- **Prev:** `/novel/shadow-slave/read/1-10`
- **Next:** `/novel/shadow-slave/read/21-30`

**Current:** `/novel/shadow-slave/read/2741-2754` (last batch, 14 chapters)
- **Prev:** `/novel/shadow-slave/read/2731-2740`
- **Next:** None (last batch)

### Word Count Mode

**Current:** `/novel/shadow-slave/read/1+15000` (loaded chapters 1-8)
- **Prev:** None (first batch)
- **Next:** `/novel/shadow-slave/read/9+15000`

**Current:** `/novel/shadow-slave/read/9+15000` (loaded chapters 9-15)
- **Prev:** `/novel/shadow-slave/read/1+15000`
- **Next:** `/novel/shadow-slave/read/16+15000`

**Edge Case - Last Batch:**
If starting chapter + word count exceeds total chapters, load remaining chapters only.

## Configuration

### Astro Config

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'server',  // Enable SSR
  adapter: vercel(), // or netlify() or node()
  site: 'https://novel.example.com',
  integrations: [sitemap()],
});
```

### Reader Config

```typescript
// src/config/reader.ts
export const READER_CONFIG = {
  // Chapter count presets for bulk mode
  chapterPresets: [3, 5, 8, 10, 12],
  
  // Word count presets for bulk mode
  wordCountPresets: [8000, 15000, 25000],
  
  // Maximum word count allowed
  maxWordCount: 25000,
  
  // Default batch size for new users
  defaultChapterCount: 10,
  defaultWordCount: 15000,
} as const;
```

## Migration Plan

### Files to Create

1. **`src/pages/novel/[slug]/read/[range].astro`** - New bulk mode route
2. **`src/utils/content.ts`** - Sanitization and language detection utilities
3. **`src/utils/bundle-loader-server.ts`** - Server-side bundle loading
4. **`src/config/reader.ts`** - Reader configuration constants

### Files to Modify

1. **`src/layouts/Layout.astro`**
   - Add robots meta tag to `<head>`
   
2. **`src/pages/novel/[slug]/read.astro`**
   - Add redirect to default single mode: `Astro.redirect(\`/novel/\${slug}/read/1\`, 301)`
   
3. **`astro.config.mjs`**
   - Change `output` to `'server'`
   - Add Vercel adapter: `import vercel from '@astrojs/vercel/serverless'`
   - Configure adapter in `defineConfig({ adapter: vercel() })`
   
4. **`package.json`**
   - Add adapter dependency: `@astrojs/vercel`

### Files to Deprecate (Not Delete)

1. **`src/scripts/bundle-loader.ts`**
   - Keep for single mode and UI enhancements
   - Disable for bulk mode pages
   - Add comment: "// Not used for SSR bulk mode - see bundle-loader-server.ts"

### UI Components to Update

1. **Mode Switcher Component** (new or update existing)
   - Radio buttons: Single / Bulk (Chapter) / Bulk (Word)
   - Chapter count selector (3, 5, 8, 10, 12) with manual input
   - Word count selector (8k, 15k, 25k) with manual input
   - "Apply" button → redirects to appropriate URL

2. **Reader Navigation** (update existing)
   - Detect current mode from URL
   - Generate prev/next URLs based on mode
   - Show current range info (e.g., "Chapters 1-10" or "15,000 words")

## Verification Checklist

### Build Verification
- [ ] `npm install` succeeds with new adapter
- [ ] `npm run build` succeeds without errors
- [ ] `npm run preview` serves SSR pages correctly
- [ ] Deploy to staging environment succeeds

### Content Verification (View Page Source)
- [ ] All chapter content present in HTML (no "Loading..." placeholders)
- [ ] `<meta name="robots" content="...max-snippet:-1...">` present
- [ ] `<script type="application/ld+json">` with speakable present
- [ ] `<nav>` with `rel="prev"` and/or `rel="next"` present
- [ ] `<article id="reader-content">` with all chapters present
- [ ] Each `<section>` has `lang` attribute
- [ ] No `<div>` tags inside article content (only `<p>`, `<section>`, `<h2>`)
- [ ] No `<script>`, `<style>`, `<button>`, `<form>` tags in content

### Functional Verification
- [ ] Chapter range mode works: `/read/1-10` loads chapters 1-10
- [ ] Word count mode works: `/read/1+15000` loads correct chapters
- [ ] Word count stops before exceeding target
- [ ] Navigation prev/next links work correctly
- [ ] Mode switcher UI redirects to correct URLs
- [ ] Language detection works for CJK/Indonesian content
- [ ] Existing single mode still works: `/read/50`

### SEO & Accessibility Verification
- [ ] Test at https://search.google.com/test/rich-results - no errors
- [ ] Test with Google Assistant "Read It" feature - content readable
- [ ] Test with screen reader (VoiceOver/NVDA) - proper navigation
- [ ] Lighthouse accessibility score ≥ 90
- [ ] Lighthouse SEO score ≥ 90

### Performance Verification
- [ ] Server response time < 1s for typical batch (10 chapters)
- [ ] Server response time < 3s for max word count (25k words)
- [ ] Memory usage stable (no leaks from bundle caching)
- [ ] Bundle cache hit rate > 80% under normal load

## Edge Cases & Error Handling

### Invalid URL Parameters
- `/read/abc-def` → Redirect to `/read/1` (default single mode)
- `/read/50+abc` → Redirect to `/read/50` (single mode)
- `/read/-5-10` → Redirect to `/read/1-10`
- `/read/10-5` → Redirect to `/read/5-10` (swap if start > end)

### Out of Range Requests
- `/read/1-5000` (novel has 2000 chapters) → Load chapters 1-2000
- `/read/3000+15000` (novel has 2000 chapters) → Show error or redirect to last valid batch

### Missing or Corrupted Data
- Bundle file not found → Show error message, offer retry
- Bundle file corrupted JSON → Log error, show user-friendly message
- Chapter missing from bundle → Skip chapter, log warning

### Performance Limits
- Request exceeds 50 chapters → Show warning, suggest smaller batch
- Request exceeds 50k words → Cap at 25k words, show notice
- Server timeout (>30s) → Show error, suggest smaller batch

## Success Criteria

1. **Google Assistant Compatibility**
   - "Read It" feature successfully reads bulk mode pages
   - Content is fully accessible without JavaScript

2. **SEO Improvement**
   - Rich results test passes without errors
   - Search engines can index full chapter content

3. **User Experience**
   - Existing features (theme, bookmarks, settings) still work
   - Page load time ≤ 3 seconds for typical batches
   - Smooth transition between single and bulk modes

4. **Code Quality**
   - No TypeScript errors
   - No console warnings in production
   - Proper error handling for all edge cases

5. **Accessibility**
   - WCAG 2.1 AA compliance
   - Screen reader compatible
   - Keyboard navigation works

## Future Enhancements (Out of Scope)

- Infinite scroll within bulk mode pages
- Bookmark sync across modes
- Reading progress tracking per mode
- Offline support with service workers
- PDF export for bulk batches
- Custom CSS per reading mode

## Notes

- JavaScript is still allowed for UI enhancements (theme switcher, settings, etc.)
- JavaScript must NOT be used to load chapter content in bulk mode
- Single mode can continue using client-side loading if needed
- Bundle files remain in `public/` directory (no changes to data structure)
- Existing `bundle-loader.ts` is kept for backward compatibility
