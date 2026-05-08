export interface Chapter {
  number: number;
  title: string;
  content: string;
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

async function fetchBundle(slug: string, bundleFile: string): Promise<Chapter[]> {
  const cacheKey = `${slug}/${bundleFile}`;
  const cached = bundleCache.get(cacheKey);
  if (cached) return cached;

  const res = await fetch(`/novels/${slug}/${bundleFile}`);
  if (!res.ok) throw new Error(`Failed to load bundle ${bundleFile} for ${slug}`);
  const chapters: Chapter[] = await res.json();
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

    const chapterWords = chapter.content.split(/\s+/).length;

    if (wordCount > 0 && wordCount + chapterWords > targetWords) {
      break;
    }

    result.push(chapter);
    wordCount += chapterWords;
  }

  return result;
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
