// src/utils/bundle-loader-server.ts
import fs from 'node:fs';
import path from 'node:path';
import { detectLanguage, sanitizeContent } from './content.js';

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
