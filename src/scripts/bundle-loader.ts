export interface Chapter {
  number: number;
  title: string;
  content: string;
}

interface RawChapter {
  id: number;
  title: string;
  body: string;
  url?: string;
  volume?: number;
  volumeTitle?: string;
}

interface RawBundle {
  bundleId: number;
  range: string;
  novelSlug: string;
  chapters: RawChapter[];
}

interface BundleInfo {
  id: number;
  range: string;
  file: string;
  chapters: number;
  sizeKB: number;
}

interface NovelInfo {
  id: string;
  title: string;
  totalChapters: number;
  bundleSize: number;
  bundles: BundleInfo[];
}

const bundleCache = new Map<string, Chapter[]>();
const infoCache = new Map<string, NovelInfo>();

export async function getNovelInfo(slug: string): Promise<NovelInfo> {
  const cached = infoCache.get(slug);
  if (cached) return cached;

  const res = await fetch(`/novels/${slug}/info.json`);
  if (!res.ok) throw new Error(`Failed to load info for ${slug}`);
  const info: NovelInfo = await res.json();
  infoCache.set(slug, info);
  return info;
}

function findBundleForChapter(info: NovelInfo, chapterNum: number): BundleInfo | null {
  for (const bundle of info.bundles) {
    const [start, end] = bundle.range.split('-').map(Number);
    if (chapterNum >= start && chapterNum <= end) {
      return bundle;
    }
  }
  return null;
}

function mapRawChapters(raw: RawBundle): Chapter[] {
  return raw.chapters.map((ch) => ({
    number: ch.id,
    title: ch.title,
    content: ch.body,
  }));
}

async function fetchBundle(slug: string, bundleFile: string): Promise<Chapter[]> {
  const cacheKey = `${slug}/${bundleFile}`;
  const cached = bundleCache.get(cacheKey);
  if (cached) return cached;

  const jsonFile = bundleFile.replace(/\.br$/, '');
  const res = await fetch(`/novels/${slug}/${jsonFile}`);
  if (!res.ok) throw new Error(`Failed to load bundle ${jsonFile} for ${slug}`);

  const raw: RawBundle = await res.json();
  const chapters = mapRawChapters(raw);
  bundleCache.set(cacheKey, chapters);
  return chapters;
}

export async function loadChapter(slug: string, chapterNum: number): Promise<Chapter | null> {
  const info = await getNovelInfo(slug);
  const bundle = findBundleForChapter(info, chapterNum);
  if (!bundle) return null;

  const chapters = await fetchBundle(slug, bundle.file);
  return chapters.find((ch) => ch.number === chapterNum) ?? null;
}

export async function loadChapterRange(
  slug: string,
  from: number,
  to: number
): Promise<Chapter[]> {
  const info = await getNovelInfo(slug);
  const result: Chapter[] = [];

  const neededBundles = new Set<BundleInfo>();
  for (let i = from; i <= to; i++) {
    const bundle = findBundleForChapter(info, i);
    if (bundle) neededBundles.add(bundle);
  }

  const fetches = [...neededBundles].map((b) => fetchBundle(slug, b.file));
  const allChapters = (await Promise.all(fetches)).flat();

  for (const ch of allChapters) {
    if (ch.number >= from && ch.number <= to) {
      result.push(ch);
    }
  }

  return result.sort((a, b) => a.number - b.number);
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (!text) return 0;

  // CJK detection: if more than half the characters are CJK, count characters
  const cjkMatches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/g);
  if (cjkMatches && cjkMatches.length > text.length * 0.3) {
    // Each CJK character ≈ 1 word equivalent
    return cjkMatches.length;
  }

  // Latin/other languages: split by whitespace
  return text.split(/\s+/).length;
}

export async function loadChaptersByWordCount(
  slug: string,
  startChapter: number,
  targetWords: number
): Promise<Chapter[]> {
  const info = await getNovelInfo(slug);
  const result: Chapter[] = [];
  let wordCount = 0;

  for (let num = startChapter; num <= info.totalChapters; num++) {
    const chapter = await loadChapter(slug, num);
    if (!chapter) continue;

    const chapterWords = countWords(chapter.content);

    // Never exceed target — exclude chapter that would push over the limit
    if (wordCount > 0 && wordCount + chapterWords > targetWords) {
      break;
    }

    result.push(chapter);
    wordCount += chapterWords;
  }

  return result;
}

export interface ChapterEntry {
  number: number;
  title: string;
}

export async function loadAllChapterEntries(slug: string): Promise<ChapterEntry[]> {
  const info = await getNovelInfo(slug);
  const fetches = info.bundles.map((b) => fetchBundle(slug, b.file));
  const allChapters = (await Promise.all(fetches)).flat();
  return allChapters
    .map((ch) => ({ number: ch.number, title: ch.title }))
    .sort((a, b) => a.number - b.number);
}

export async function prefetchNextBundle(slug: string, currentChapter: number): Promise<void> {
  const info = await getNovelInfo(slug);
  const currentBundle = findBundleForChapter(info, currentChapter);
  if (!currentBundle) return;

  const nextBundleIdx = info.bundles.indexOf(currentBundle) + 1;
  if (nextBundleIdx < info.bundles.length) {
    const nextBundle = info.bundles[nextBundleIdx];
    fetchBundle(slug, nextBundle.file).catch(() => {});
  }
}
