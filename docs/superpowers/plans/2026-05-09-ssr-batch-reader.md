# SSR Batch Reader Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert novel reader from CSR to SSR with three reading modes (single, bulk-by-chapter, bulk-by-word) for Google Assistant "Read It" compatibility.

**Architecture:** Server-side rendering with Astro SSR mode, Vercel serverless adapter, on-demand HTML generation with all chapter content pre-rendered in HTML at page load.

**Tech Stack:** Astro 6, TypeScript, Vercel Serverless, Node.js fs module

**Spec:** `docs/superpowers/specs/2026-05-09-ssr-batch-reader-google-assistant.md`

---

## File Structure Overview

### Files to Create
1. `src/config/reader.ts` - Reader configuration constants
2. `src/utils/content.ts` - Content sanitization and language detection
3. `src/utils/bundle-loader-server.ts` - Server-side bundle loading with caching
4. `src/pages/novel/[slug]/read/[range].astro` - Bulk mode SSR route

### Files to Modify
1. `astro.config.mjs` - Enable SSR, add Vercel adapter
2. `package.json` - Add Vercel adapter dependency
3. `src/layouts/Layout.astro` - Add robots meta tag
4. `src/pages/novel/[slug]/read.astro` - Add redirect to single mode

### Files to Deprecate (Keep, Add Comment)
1. `src/scripts/bundle-loader.ts` - Mark as "not used for SSR bulk mode"

---

## Chunk 1: Project Setup & Configuration

### Task 1.1: Install Vercel Adapter

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add Vercel adapter dependency**

```bash
npm install @astrojs/vercel
```

Expected: Package installed successfully, `package.json` and `package-lock.json` updated

- [ ] **Step 2: Verify installation**

```bash
npm list @astrojs/vercel
```

Expected: Shows installed version (e.g., `@astrojs/vercel@8.x.x`)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Vercel serverless adapter"
```

---

### Task 1.2: Configure Astro for SSR

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Update Astro config**

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'server',  // Enable SSR
  adapter: vercel(), // Vercel serverless adapter
  site: 'https://novel.example.com',
  integrations: [sitemap()],
});
```

- [ ] **Step 2: Verify config syntax**

```bash
npx astro check
```

Expected: No TypeScript errors

- [ ] **Step 3: Test dev server starts**

```bash
npm run dev
```

Expected: Server starts on localhost:4321, no errors

- [ ] **Step 4: Stop dev server and commit**

```bash
git add astro.config.mjs
git commit -m "config: enable SSR with Vercel adapter"
```

---

### Task 1.3: Create Reader Configuration

**Files:**
- Create: `src/config/reader.ts`

- [ ] **Step 1: Create config file**

```typescript
// src/config/reader.ts

/**
 * Reader configuration for batch modes
 */
export const READER_CONFIG = {
  /** Chapter count presets for bulk-by-chapter mode */
  chapterPresets: [3, 5, 8, 10, 12] as const,
  
  /** Word count presets for bulk-by-word mode (in words) */
  wordCountPresets: [8000, 15000, 25000] as const,
  
  /** Maximum word count allowed */
  maxWordCount: 25000,
  
  /** Default batch size for new users */
  defaultChapterCount: 10,
  defaultWordCount: 15000,
} as const;

export type ChapterPreset = typeof READER_CONFIG.chapterPresets[number];
export type WordCountPreset = typeof READER_CONFIG.wordCountPresets[number];
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/config/reader.ts
git commit -m "feat: add reader configuration constants"
```

---

## Chunk 2: Content Processing Utilities

### Task 2.1: Language Detection Utility

**Files:**
- Create: `src/utils/content.ts`

- [ ] **Step 1: Create language detection function**

```typescript
// src/utils/content.ts

/**
 * Detect content language from text sample
 * @param text - Plain text or HTML content
 * @returns ISO 639-1 language code
 */
export function detectLanguage(text: string): string {
  // Remove HTML tags and get sample
  const plainText = text.replace(/<[^>]*>/g, '').slice(0, 500);
  
  // CJK characters (Chinese/Japanese Kanji)
  // Unicode range: U+4E00–U+9FFF (CJK Unified Ideographs)
  //                U+3400–U+4DBF (CJK Extension A)
  const cjkMatches = plainText.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  if (cjkMatches && cjkMatches.length > plainText.length * 0.3) {
    return 'zh';
  }
  
  // Hiragana (U+3040–U+309F) or Katakana (U+30A0–U+30FF)
  const hiragana = /[\u3040-\u309f]/;
  const katakana = /[\u30a0-\u30ff]/;
  if (hiragana.test(plainText) || katakana.test(plainText)) {
    return 'ja';
  }
  
  // Hangul (Korean) - U+AC00–U+D7AF
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

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 3: Manual test (optional - create test file)**

Create `test-lang.ts`:
```typescript
import { detectLanguage } from './src/utils/content.ts';

console.log('Chinese:', detectLanguage('这是中文文本'));
console.log('Japanese:', detectLanguage('これは日本語です'));
console.log('Korean:', detectLanguage('이것은 한국어입니다'));
console.log('Indonesian:', detectLanguage('Ini adalah teks yang ditulis dalam bahasa Indonesia'));
console.log('English:', detectLanguage('This is English text'));
```

Run: `npx tsx test-lang.ts`
Expected: Correct language codes printed

- [ ] **Step 4: Commit**

```bash
git add src/utils/content.ts
git commit -m "feat: add language detection utility"
```

---

### Task 2.2: HTML Sanitization Utility

**Files:**
- Modify: `src/utils/content.ts`

- [ ] **Step 1: Add sanitization helper functions**

```typescript
// src/utils/content.ts (append to existing file)

/**
 * Sanitize HTML attributes, keeping only allowed ones
 * @param attrs - Attribute string from HTML tag
 * @returns Cleaned attribute string
 */
function sanitizeAttributes(attrs: string): string {
  const allowed = ['id', 'class', 'lang', 'role'];
  const ariaPattern = /^aria-[\w-]+$/;
  
  // Match all attributes: name="value"
  const attrMatches = [...attrs.matchAll(/(\w+(?:-\w+)*)="([^"]*)"/g)];
  const cleanAttrs: string[] = [];
  
  for (const [, name, value] of attrMatches) {
    if (allowed.includes(name) || ariaPattern.test(name)) {
      cleanAttrs.push(`${name}="${value}"`);
    }
  }
  
  return cleanAttrs.length > 0 ? ' ' + cleanAttrs.join(' ') : '';
}

/**
 * Sanitize HTML content for Google Assistant compatibility
 * Removes dangerous tags, converts divs to semantic tags, strips inline styles
 * @param html - Raw HTML content
 * @returns Sanitized HTML
 */
export function sanitizeContent(html: string): string {
  let clean = html;
  
  // Remove dangerous tags completely
  const dangerousTags = ['script', 'style', 'button', 'form', 'input', 'iframe'];
  for (const tag of dangerousTags) {
    // Remove opening and closing tags with content
    clean = clean.replace(new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis'), '');
    // Remove self-closing tags
    clean = clean.replace(new RegExp(`<${tag}[^>]*/>`, 'gi'), '');
  }
  
  // Convert div to p or section based on content
  clean = clean.replace(/<div([^>]*)>(.*?)<\/div>/gis, (match, attrs, content) => {
    // If div contains block elements, convert to section
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
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 3: Manual test sanitization**

Create `test-sanitize.ts`:
```typescript
import { sanitizeContent } from './src/utils/content.ts';

const dirty = `
<div class="content" style="color: red;">
  <script>alert('xss')</script>
  <p>Safe paragraph</p>
  <button onclick="hack()">Click</button>
  <div>Nested div</div>
</div>
`;

console.log('Sanitized:', sanitizeContent(dirty));
```

Run: `npx tsx test-sanitize.ts`
Expected: No script/button tags, no style attributes, divs converted

- [ ] **Step 4: Commit**

```bash
git add src/utils/content.ts
git commit -m "feat: add HTML sanitization utility"
```

---

## Chunk 3: Server-Side Bundle Loading

### Task 3.1: Bundle Loading Types and Interfaces

**Files:**
- Create: `src/utils/bundle-loader-server.ts`

- [ ] **Step 1: Define TypeScript interfaces**

```typescript
// src/utils/bundle-loader-server.ts
import fs from 'node:fs';
import path from 'node:path';

/**
 * Raw chapter data from bundle JSON
 */
interface RawChapter {
  id: number;
  title: string;
  body: string;
  url?: string;
  volume?: number;
  volumeTitle?: string;
}

/**
 * Raw bundle file structure
 */
interface RawBundle {
  bundleId: number;
  range: string;
  novelSlug: string;
  chapters: RawChapter[];
}

/**
 * Bundle metadata from info.json
 */
interface BundleInfo {
  id: number;
  range: string;
  file: string;
  chapters: number;
  sizeKB: number;
}

/**
 * Novel metadata from info.json
 */
interface NovelInfo {
  id: string;
  title: string;
  totalChapters: number;
  bundleSize: number;
  bundles: BundleInfo[];
}

/**
 * Processed chapter for rendering
 */
export interface Chapter {
  number: number;
  title: string;
  content: string;
  lang: string;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/bundle-loader-server.ts
git commit -m "feat: add bundle loader types"
```

---

### Task 3.2: Bundle Caching System

**Files:**
- Modify: `src/utils/bundle-loader-server.ts`

- [ ] **Step 1: Add caching infrastructure**

```typescript
// src/utils/bundle-loader-server.ts (append)

/**
 * In-memory cache for bundle data
 * Key: "slug/bundleFile" (e.g., "shadow-slave/vol-001.json")
 * Value: Parsed bundle data
 */
const bundleCache = new Map<string, RawBundle>();

/**
 * In-memory cache for novel info
 * Key: slug
 * Value: Novel metadata
 */
const infoCache = new Map<string, NovelInfo>();

/**
 * Load novel info from info.json
 * @param slug - Novel slug
 * @returns Novel metadata
 */
export async function getNovelInfo(slug: string): Promise<NovelInfo> {
  // Check cache first
  const cached = infoCache.get(slug);
  if (cached) {
    return cached;
  }
  
  // Load from filesystem
  const infoPath = path.join(process.cwd(), 'public', 'novels', slug, 'info.json');
  
  if (!fs.existsSync(infoPath)) {
    throw new Error(`Novel info not found: ${slug}`);
  }
  
  const data = fs.readFileSync(infoPath, 'utf-8');
  const info: NovelInfo = JSON.parse(data);
  
  // Cache and return
  infoCache.set(slug, info);
  return info;
}

/**
 * Find which bundle contains a specific chapter
 * @param info - Novel metadata
 * @param chapterNum - Chapter number
 * @returns Bundle info or null if not found
 */
function findBundleForChapter(info: NovelInfo, chapterNum: number): BundleInfo | null {
  for (const bundle of info.bundles) {
    const [start, end] = bundle.range.split('-').map(Number);
    if (chapterNum >= start && chapterNum <= end) {
      return bundle;
    }
  }
  return null;
}

/**
 * Load and parse a bundle file
 * @param slug - Novel slug
 * @param bundleFile - Bundle filename (e.g., "vol-001.json")
 * @returns Parsed bundle data
 */
async function loadBundle(slug: string, bundleFile: string): Promise<RawBundle> {
  const cacheKey = `${slug}/${bundleFile}`;
  
  // Check cache first
  const cached = bundleCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Load from filesystem (decompressed .json file)
  const bundlePath = path.join(process.cwd(), 'public', 'novels', slug, bundleFile);
  
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Bundle not found: ${bundlePath}`);
  }
  
  const data = fs.readFileSync(bundlePath, 'utf-8');
  const bundle: RawBundle = JSON.parse(data);
  
  // Cache and return
  bundleCache.set(cacheKey, bundle);
  return bundle;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/bundle-loader-server.ts
git commit -m "feat: add bundle caching system"
```

---

### Task 3.3: Chapter Range Loading

**Files:**
- Modify: `src/utils/bundle-loader-server.ts`

- [ ] **Step 1: Add chapter range loading function**

```typescript
// src/utils/bundle-loader-server.ts (append)
import { detectLanguage, sanitizeContent } from './content.js';

/**
 * Load a range of chapters
 * @param slug - Novel slug
 * @param start - Start chapter number
 * @param end - End chapter number
 * @returns Array of processed chapters
 */
export async function loadChapterRange(
  slug: string,
  start: number,
  end: number
): Promise<Chapter[]> {
  const info = await getNovelInfo(slug);
  const result: Chapter[] = [];
  
  // Find all bundles needed for this range
  const neededBundles = new Set<BundleInfo>();
  for (let i = start; i <= end; i++) {
    const bundle = findBundleForChapter(info, i);
    if (bundle) {
      neededBundles.add(bundle);
    }
  }
  
  // Load all needed bundles
  const bundlePromises = [...neededBundles].map(b => loadBundle(slug, b.file));
  const bundles = await Promise.all(bundlePromises);
  
  // Extract chapters in range
  for (const bundle of bundles) {
    for (const rawChapter of bundle.chapters) {
      if (rawChapter.id >= start && rawChapter.id <= end) {
        // Sanitize content
        const sanitized = sanitizeContent(rawChapter.body);
        
        // Detect language
        const lang = detectLanguage(sanitized);
        
        result.push({
          number: rawChapter.id,
          title: rawChapter.title,
          content: sanitized,
          lang,
        });
      }
    }
  }
  
  // Sort by chapter number
  result.sort((a, b) => a.number - b.number);
  
  return result;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/bundle-loader-server.ts
git commit -m "feat: add chapter range loading"
```

---

### Task 3.4: Word Count Loading

**Files:**
- Modify: `src/utils/bundle-loader-server.ts`

- [ ] **Step 1: Add word counting helper**

```typescript
// src/utils/bundle-loader-server.ts (append)

/**
 * Count words in text (strips HTML first)
 * @param html - HTML content
 * @returns Word count
 */
function countWords(html: string): number {
  const plainText = html.replace(/<[^>]*>/g, '');
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}
```

- [ ] **Step 2: Add word count loading function**

```typescript
// src/utils/bundle-loader-server.ts (append)

/**
 * Load chapters until word count target is reached
 * Stops before exceeding the target
 * @param slug - Novel slug
 * @param startChapter - Starting chapter number
 * @param targetWords - Target word count
 * @returns Array of processed chapters
 */
export async function loadChaptersUntilWordCount(
  slug: string,
  startChapter: number,
  targetWords: number
): Promise<Chapter[]> {
  const info = await getNovelInfo(slug);
  const result: Chapter[] = [];
  let totalWords = 0;
  let currentChapter = startChapter;
  
  // Load chapters one by one until target reached
  while (currentChapter <= info.totalChapters && totalWords < targetWords) {
    // Find bundle for current chapter
    const bundle = findBundleForChapter(info, currentChapter);
    if (!bundle) {
      break; // No more chapters
    }
    
    // Load bundle
    const bundleData = await loadBundle(slug, bundle.file);
    
    // Find chapter in bundle
    const rawChapter = bundleData.chapters.find(ch => ch.id === currentChapter);
    if (!rawChapter) {
      currentChapter++;
      continue;
    }
    
    // Count words in this chapter
    const chapterWords = countWords(rawChapter.body);
    
    // Check if adding this chapter would exceed target
    if (totalWords + chapterWords > targetWords && result.length > 0) {
      // Stop here, don't include this chapter
      break;
    }
    
    // Sanitize and add chapter
    const sanitized = sanitizeContent(rawChapter.body);
    const lang = detectLanguage(sanitized);
    
    result.push({
      number: rawChapter.id,
      title: rawChapter.title,
      content: sanitized,
      lang,
    });
    
    totalWords += chapterWords;
    currentChapter++;
  }
  
  return result;
}
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/utils/bundle-loader-server.ts
git commit -m "feat: add word count loading"
```

---

## Chunk 4: Bulk Mode Route Implementation

### Task 4.1: Create Bulk Mode Route File

**Files:**
- Create: `src/pages/novel/[slug]/read/[range].astro`

- [ ] **Step 1: Create route with basic structure**

```astro
---
// src/pages/novel/[slug]/read/[range].astro
import Layout from '../../../../layouts/Layout.astro';
import { loadChapterRange, loadChaptersUntilWordCount } from '../../../../utils/bundle-loader-server';
import { getNovelInfo } from '../../../../utils/bundle-loader-server';
import type { Chapter } from '../../../../utils/bundle-loader-server';
import fs from 'node:fs';
import path from 'node:path';

// SSR mode - no static paths
export function getStaticPaths() {
  return [];
}

const { slug, range } = Astro.params;

// Validate params
if (!slug || !range) {
  return Astro.redirect('/');
}

// Load novel info
const indexPath = path.join(process.cwd(), 'public/novels/index.json');
const catalog = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
const novel = catalog.novels.find((n: { slug: string }) => n.slug === slug);

if (!novel) {
  return Astro.redirect('/');
}

// Parse range parameter
let chapters: Chapter[] = [];
let mode: 'chapter' | 'word' = 'chapter';
let startChapter = 1;
let endChapter = 1;
let wordCount = 0;

try {
  if (range.includes('+')) {
    // Word count mode: "50+15000"
    mode = 'word';
    const [start, words] = range.split('+').map(Number);
    
    if (isNaN(start) || isNaN(words) || start < 1 || words < 1) {
      return Astro.redirect(`/novel/${slug}/read/1`);
    }
    
    startChapter = start;
    wordCount = words;
    chapters = await loadChaptersUntilWordCount(slug, start, words);
    
  } else if (range.includes('-')) {
    // Chapter range mode: "1-10"
    mode = 'chapter';
    let [start, end] = range.split('-').map(Number);
    
    if (isNaN(start) || isNaN(end) || start < 1 || end < 1) {
      return Astro.redirect(`/novel/${slug}/read/1`);
    }
    
    // Swap if start > end
    if (start > end) {
      [start, end] = [end, start];
    }
    
    startChapter = start;
    endChapter = end;
    chapters = await loadChapterRange(slug, start, end);
    
  } else {
    // Invalid format, redirect to single mode
    return Astro.redirect(`/novel/${slug}/read/${range}`);
  }
} catch (error) {
  console.error('Error loading chapters:', error);
  return Astro.redirect(`/novel/${slug}/read/1`);
}

// If no chapters loaded, redirect
if (chapters.length === 0) {
  return Astro.redirect(`/novel/${slug}/read/1`);
}

// Detect primary language from first chapter
const primaryLang = chapters[0]?.lang || 'en';

// TODO: Calculate prev/next ranges
const prevRange: string | null = null;
const nextRange: string | null = null;
---

<Layout
  title={`Reading - ${novel.title}`}
  canonicalPath={`/novel/${slug}/read/${range}`}
  description={`Read ${novel.title} chapters online`}
>
  <div class="reader" id="reader-root">
    <header class="reader-header">
      <a href={`/novel/${slug}`} class="back-btn">Back</a>
      <span class="header-title">{novel.title}</span>
    </header>

    <main class="reader-content" id="reader-content" role="main">
      <article id="reader-article" lang={primaryLang}>
        {chapters.map(chapter => (
          <section id={`chapter-${chapter.number}`} lang={chapter.lang}>
            <h2>{chapter.title}</h2>
            <div set:html={chapter.content} />
          </section>
        ))}
      </article>
    </main>

    <nav class="reader-nav" aria-label="Batch navigation">
      {prevRange && (
        <a href={`/novel/${slug}/read/${prevRange}`} rel="prev">Previous</a>
      )}
      {nextRange && (
        <a href={`/novel/${slug}/read/${nextRange}`} rel="next">Next</a>
      )}
    </nav>
  </div>
</Layout>
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 3: Test dev server**

```bash
npm run dev
```

Visit: `http://localhost:4321/novel/shadow-slave/read/1-5`
Expected: Page loads with chapters 1-5

- [ ] **Step 4: Commit**

```bash
git add src/pages/novel/[slug]/read/[range].astro
git commit -m "feat: create bulk mode route with basic rendering"
```

---

### Task 4.2: Add Navigation Logic

**Files:**
- Modify: `src/pages/novel/[slug]/read/[range].astro`

- [ ] **Step 1: Add navigation calculation function**

Find the line `// TODO: Calculate prev/next ranges` and replace with:

```typescript
// Calculate prev/next ranges
let prevRange: string | null = null;
let nextRange: string | null = null;

if (mode === 'chapter') {
  const batchSize = endChapter - startChapter + 1;
  
  // Previous batch
  if (startChapter > 1) {
    const prevEnd = startChapter - 1;
    const prevStart = Math.max(1, prevEnd - batchSize + 1);
    prevRange = `${prevStart}-${prevEnd}`;
  }
  
  // Next batch
  if (endChapter < novel.totalChapters) {
    const nextStart = endChapter + 1;
    const nextEnd = Math.min(novel.totalChapters, nextStart + batchSize - 1);
    nextRange = `${nextStart}-${nextEnd}`;
  }
  
} else if (mode === 'word') {
  // Previous batch (same word count)
  if (startChapter > 1) {
    const prevStart = Math.max(1, startChapter - 1);
    prevRange = `${prevStart}+${wordCount}`;
  }
  
  // Next batch (start from last chapter + 1)
  const lastChapter = chapters[chapters.length - 1]?.number || startChapter;
  if (lastChapter < novel.totalChapters) {
    const nextStart = lastChapter + 1;
    nextRange = `${nextStart}+${wordCount}`;
  }
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 3: Test navigation**

```bash
npm run dev
```

Visit: `http://localhost:4321/novel/shadow-slave/read/1-10`
Expected: "Next" link shows `/novel/shadow-slave/read/11-20`

Visit: `http://localhost:4321/novel/shadow-slave/read/11-20`
Expected: "Previous" link shows `/novel/shadow-slave/read/1-10`

- [ ] **Step 4: Commit**

```bash
git add src/pages/novel/[slug]/read/[range].astro
git commit -m "feat: add prev/next navigation logic"
```

---

### Task 4.3: Add SEO Meta Tags and JSON-LD

**Files:**
- Modify: `src/pages/novel/[slug]/read/[range].astro`

- [ ] **Step 1: Generate JSON-LD data**

Add before the `<Layout>` component:

```typescript
// Generate headline for JSON-LD
const headline = mode === 'chapter'
  ? `${novel.title} - Chapters ${startChapter}-${endChapter}`
  : `${novel.title} - ${wordCount} words from Chapter ${startChapter}`;

// Generate article body for JSON-LD (first 5000 chars)
const articleBody = chapters
  .map(ch => ch.content.replace(/<[^>]*>/g, ''))
  .join(' ')
  .slice(0, 5000);

// JSON-LD structured data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  name: novel.title,
  headline,
  articleBody,
  inLanguage: primaryLang,
  isAccessibleForFree: true,
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: [
      '#reader-content',
      '#reader-content section',
      '#reader-content p'
    ],
  },
  accessibilityFeature: [
    'readingOrder',
    'structuralNavigation',
    'alternativeText'
  ],
  accessMode: ['textual'],
  accessModeSufficient: [
    { '@type': 'ItemList', itemListElement: ['textual'] }
  ],
};
```

- [ ] **Step 2: Update Layout props**

Replace the `<Layout>` opening tag with:

```astro
<Layout
  title={headline}
  canonicalPath={`/novel/${slug}/read/${range}`}
  description={`Read ${novel.title} chapters online`}
  jsonLd={jsonLd}
>
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 4: Test JSON-LD output**

```bash
npm run dev
```

Visit: `http://localhost:4321/novel/shadow-slave/read/1-5`
View Page Source, search for `application/ld+json`
Expected: JSON-LD script tag with speakable present

- [ ] **Step 5: Commit**

```bash
git add src/pages/novel/[slug]/read/[range].astro
git commit -m "feat: add JSON-LD structured data for SEO"
```

---

## Chunk 5: Layout and Redirect Updates

### Task 5.1: Add Robots Meta Tag to Layout

**Files:**
- Modify: `src/layouts/Layout.astro`

- [ ] **Step 1: Add robots meta tag**

Find the `<head>` section and add after the viewport meta tag:

```astro
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
```

Full context:
```astro
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <!-- rest of head -->
</head>
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 3: Test meta tag presence**

```bash
npm run dev
```

Visit any page, View Page Source
Expected: Robots meta tag present in `<head>`

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat: add robots meta tag for Google Assistant"
```

---

### Task 5.2: Add Redirect from Old Read Route

**Files:**
- Modify: `src/pages/novel/[slug]/read.astro`

- [ ] **Step 1: Add redirect logic**

At the very top of the frontmatter (before any other code):

```astro
---
// Redirect to single chapter mode (chapter 1)
const { slug } = Astro.params;
return Astro.redirect(`/novel/${slug}/read/1`, 301);
---
```

This should be the ONLY code in the frontmatter. The rest of the file can remain but will never execute.

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx astro check
```

Expected: No errors

- [ ] **Step 3: Test redirect**

```bash
npm run dev
```

Visit: `http://localhost:4321/novel/shadow-slave/read`
Expected: Redirects to `/novel/shadow-slave/read/1`

- [ ] **Step 4: Commit**

```bash
git add src/pages/novel/[slug]/read.astro
git commit -m "feat: redirect old read route to single chapter mode"
```

---

### Task 5.3: Deprecate Client-Side Bundle Loader

**Files:**
- Modify: `src/scripts/bundle-loader.ts`

- [ ] **Step 1: Add deprecation comment**

At the very top of the file, add:

```typescript
/**
 * @deprecated This file is not used for SSR bulk mode.
 * For server-side bundle loading, see: src/utils/bundle-loader-server.ts
 * 
 * This file is kept for:
 * - Single chapter mode (if still using client-side loading)
 * - UI enhancements and interactions
 * - Backward compatibility
 */
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/bundle-loader.ts
git commit -m "docs: mark bundle-loader as deprecated for SSR"
```

---

## Chunk 6: Testing and Verification

### Task 6.1: Build Verification

**Files:**
- None (testing only)

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: Build completes successfully, no errors

- [ ] **Step 2: Check build output**

```bash
ls -la dist/
```

Expected: `dist/` directory exists with built files

- [ ] **Step 3: Preview build**

```bash
npm run preview
```

Expected: Server starts, pages load correctly

- [ ] **Step 4: Test all modes**

Visit and verify:
- Single mode: `/novel/shadow-slave/read/1`
- Chapter range: `/novel/shadow-slave/read/1-10`
- Word count: `/novel/shadow-slave/read/1+15000`

Expected: All modes work, content visible in View Page Source

---

### Task 6.2: Content Verification

**Files:**
- None (testing only)

- [ ] **Step 1: View Page Source test**

Visit: `/novel/shadow-slave/read/1-10`
Right-click → View Page Source

Verify checklist:
- [ ] All 10 chapters present in HTML
- [ ] `<meta name="robots" content="...max-snippet:-1...">` present
- [ ] `<script type="application/ld+json">` with speakable present
- [ ] `<nav>` with `rel="prev"` and/or `rel="next"` present
- [ ] `<article id="reader-content">` present
- [ ] Each `<section>` has `lang` attribute
- [ ] No `<script>`, `<style>`, `<button>` tags in content
- [ ] No inline `style` attributes in content

- [ ] **Step 2: Test navigation links**

Click "Next" link
Expected: Loads next batch (chapters 11-20)

Click "Previous" link
Expected: Loads previous batch (chapters 1-10)

- [ ] **Step 3: Test word count mode**

Visit: `/novel/shadow-slave/read/1+8000`
View Page Source
Expected: Chapters loaded until ~8000 words reached

---

### Task 6.3: SEO Verification

**Files:**
- None (testing only)

- [ ] **Step 1: Rich Results Test**

Visit: https://search.google.com/test/rich-results
Enter URL: `https://your-domain.com/novel/shadow-slave/read/1-10`

Expected: No errors, Article schema detected

- [ ] **Step 2: Lighthouse SEO Check**

Open DevTools → Lighthouse
Run SEO audit

Expected: SEO score ≥ 90

- [ ] **Step 3: Accessibility Check**

Run Lighthouse Accessibility audit

Expected: Accessibility score ≥ 90

---

### Task 6.4: Edge Cases Testing

**Files:**
- None (testing only)

- [ ] **Step 1: Test invalid ranges**

Visit and verify redirect:
- `/novel/shadow-slave/read/abc-def` → redirects to `/novel/shadow-slave/read/1`
- `/novel/shadow-slave/read/10-5` → loads chapters 5-10 (swapped)
- `/novel/shadow-slave/read/-5-10` → redirects to `/novel/shadow-slave/read/1`

- [ ] **Step 2: Test out of range**

Visit: `/novel/shadow-slave/read/1-9999` (novel has ~2754 chapters)
Expected: Loads chapters 1-2754 (capped at total)

- [ ] **Step 3: Test word count edge cases**

Visit: `/novel/shadow-slave/read/1+999999`
Expected: Loads chapters until 25000 words (capped at max)

Visit: `/novel/shadow-slave/read/2750+15000`
Expected: Loads remaining chapters (2750-2754)

---

## Chunk 7: Final Polish and Documentation

### Task 7.1: Performance Verification

**Files:**
- None (testing only)

- [ ] **Step 1: Measure response time**

```bash
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/novel/shadow-slave/read/1-10
```

Create `curl-format.txt`:
```
time_total: %{time_total}s
```

Expected: Response time < 3 seconds

- [ ] **Step 2: Test with large batches**

Visit: `/novel/shadow-slave/read/1-50`
Expected: Loads within 5 seconds, no timeout

Visit: `/novel/shadow-slave/read/1+25000`
Expected: Loads within 5 seconds

---

### Task 7.2: Update Project Documentation

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update AGENTS.md**

Add section about SSR and reading modes:

```markdown
## Reading Modes

The novel reader supports three modes:

1. **Single Mode**: `/novel/[slug]/read/[chapter]` - One chapter per page
2. **Bulk by Chapter**: `/novel/[slug]/read/[start]-[end]` - Multiple chapters (e.g., 1-10)
3. **Bulk by Word Count**: `/novel/[slug]/read/[start]+[words]` - Chapters until word count (e.g., 1+15000)

All modes use Server-Side Rendering (SSR) for Google Assistant "Read It" compatibility.

## SSR Configuration

- **Output**: `server` (SSR mode)
- **Adapter**: Vercel Serverless (`@astrojs/vercel/serverless`)
- **Bundle Loading**: Server-side via `src/utils/bundle-loader-server.ts`
- **Content Processing**: Sanitization and language detection in `src/utils/content.ts`

## Deployment

Deploy to Vercel:
```bash
npm run build
vercel deploy
```

The SSR adapter handles serverless function deployment automatically.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md with SSR and reading modes info"
```

---

### Task 7.3: Final Commit and Tag

**Files:**
- None

- [ ] **Step 1: Verify all changes committed**

```bash
git status
```

Expected: "nothing to commit, working tree clean"

- [ ] **Step 2: Create feature tag**

```bash
git tag -a v1.0.0-ssr-batch-reader -m "feat: SSR batch reader for Google Assistant compatibility"
```

- [ ] **Step 3: Push to remote**

```bash
git push origin main --tags
```

Expected: All commits and tags pushed successfully

---

## Verification Checklist Summary

After completing all tasks, verify:

### Build & Deploy
- [ ] `npm run build` succeeds
- [ ] `npm run preview` works
- [ ] Deploy to Vercel succeeds
- [ ] Production site loads correctly

### Content & SEO
- [ ] All chapter content in HTML (View Page Source)
- [ ] Robots meta tag present
- [ ] JSON-LD with speakable present
- [ ] Navigation with rel attributes
- [ ] Semantic HTML structure (article, section, p)
- [ ] Language attributes on sections
- [ ] No dangerous tags in content

### Functionality
- [ ] Single mode works: `/read/1`
- [ ] Chapter range works: `/read/1-10`
- [ ] Word count works: `/read/1+15000`
- [ ] Navigation prev/next works
- [ ] Edge cases handled (invalid params, out of range)

### Performance
- [ ] Response time < 3s for typical batches
- [ ] No memory leaks (bundle caching stable)
- [ ] Large batches load without timeout

### Accessibility & SEO
- [ ] Rich Results Test passes
- [ ] Google Assistant "Read It" works
- [ ] Lighthouse SEO ≥ 90
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Screen reader compatible

---

## Notes

- All chapter content must be in HTML at page load (no client-side fetching)
- Bundle files are decompressed by `scripts/decompress-bundles.mjs` before build
- Server-side caching prevents redundant file reads
- Word count mode stops before exceeding target
- Navigation maintains batch size for consistency
- Existing single mode (`[chapter].astro`) remains unchanged

---

## Success Criteria

✅ Google Assistant "Read It" can read bulk mode pages
✅ All content accessible without JavaScript
✅ SEO improved with proper meta tags and structured data
✅ Performance acceptable (< 3s response time)
✅ No TypeScript errors or console warnings
✅ All edge cases handled gracefully

