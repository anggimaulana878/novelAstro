import { c as createComponent } from './astro-component_B5mpHq_T.mjs';
import 'piccolore';
import { n as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, u as unescapeHTML } from './entrypoint_D3z8RzlV.mjs';
import { $ as $$Layout } from './Layout_DuozPMi-.mjs';
import fs from 'node:fs';
import nodePath from 'node:path';

function detectLanguage(text) {
  const plainText = text.replace(/<[^>]*>/g, "").slice(0, 500);
  const cjkMatches = plainText.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  if (cjkMatches && cjkMatches.length > plainText.length * 0.3) {
    return "zh";
  }
  const hiragana = /[\u3040-\u309f]/;
  const katakana = /[\u30a0-\u30ff]/;
  if (hiragana.test(plainText) || katakana.test(plainText)) {
    return "ja";
  }
  const hangul = /[\uac00-\ud7af]/;
  if (hangul.test(plainText)) {
    return "ko";
  }
  const indonesianKeywords = ["yang", "dan", "di", "ke", "dari", "untuk", "dengan"];
  const words = plainText.toLowerCase().split(/\s+/);
  const indonesianCount = words.filter((w) => indonesianKeywords.includes(w)).length;
  if (indonesianCount > 3) {
    return "id";
  }
  return "en";
}
function sanitizeAttributes(attrs) {
  const allowed = ["id", "class", "lang", "role"];
  const ariaPattern = /^aria-[\w-]+$/;
  const attrMatches = [...attrs.matchAll(/(\w+(?:-\w+)*)="([^"]*)"/g)];
  const cleanAttrs = [];
  for (const [, name, value] of attrMatches) {
    if (allowed.includes(name) || ariaPattern.test(name)) {
      cleanAttrs.push(`${name}="${value}"`);
    }
  }
  return cleanAttrs.length > 0 ? " " + cleanAttrs.join(" ") : "";
}
function sanitizeContent(html) {
  let clean = html;
  const dangerousTags = ["script", "style", "button", "form", "input", "iframe"];
  for (const tag of dangerousTags) {
    clean = clean.replace(new RegExp(`<${tag}[^>]*>.*?</${tag}>`, "gis"), "");
    clean = clean.replace(new RegExp(`<${tag}[^>]*/>`, "gi"), "");
  }
  clean = clean.replace(/<div([^>]*)>(.*?)<\/div>/gis, (match, attrs, content) => {
    const hasBlockElements = /<(p|h[1-6]|section|article|div)/.test(content);
    const tag = hasBlockElements ? "section" : "p";
    const cleanAttrs = sanitizeAttributes(attrs);
    return `<${tag}${cleanAttrs}>${content}</${tag}>`;
  });
  clean = clean.replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
    const cleanAttrs = sanitizeAttributes(attrs);
    return `<${tag}${cleanAttrs}>`;
  });
  clean = clean.replace(/\s+style="[^"]*"/gi, "");
  return clean;
}

const IS_PRODUCTION = process.env.VERCEL === "1";
const SITE_URL = process.env.SITE_URL || "https://novel.example.com";
const bundleCache = /* @__PURE__ */ new Map();
const infoCache = /* @__PURE__ */ new Map();
async function getNovelInfo(slug) {
  const cached = infoCache.get(slug);
  if (cached) {
    return cached;
  }
  let data;
  if (IS_PRODUCTION) {
    const url = `${SITE_URL}/novels/${slug}/info.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Novel info not found: ${slug}`);
    }
    data = await response.text();
  } else {
    const infoPath = nodePath.join(process.cwd(), "public", "novels", slug, "info.json");
    if (!fs.existsSync(infoPath)) {
      throw new Error(`Novel info not found: ${slug}`);
    }
    data = fs.readFileSync(infoPath, "utf-8");
  }
  const info = JSON.parse(data);
  infoCache.set(slug, info);
  return info;
}
function findBundleForChapter(info, chapterNum) {
  for (const bundle of info.bundles) {
    const [start, end] = bundle.range.split("-").map(Number);
    if (chapterNum >= start && chapterNum <= end) {
      return bundle;
    }
  }
  return null;
}
async function loadBundle(slug, bundleFile) {
  const cacheKey = `${slug}/${bundleFile}`;
  const cached = bundleCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  let data;
  if (IS_PRODUCTION) {
    const url = `${SITE_URL}/novels/${slug}/${bundleFile}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Bundle not found: ${url}`);
    }
    data = await response.text();
  } else {
    const bundlePath = nodePath.join(process.cwd(), "public", "novels", slug, bundleFile);
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`Bundle not found: ${bundlePath}`);
    }
    data = fs.readFileSync(bundlePath, "utf-8");
  }
  const bundle = JSON.parse(data);
  bundleCache.set(cacheKey, bundle);
  return bundle;
}
async function loadChapterRange(slug, start, end) {
  const info = await getNovelInfo(slug);
  const result = [];
  const neededBundles = /* @__PURE__ */ new Set();
  for (let i = start; i <= end; i++) {
    const bundle = findBundleForChapter(info, i);
    if (bundle) {
      neededBundles.add(bundle);
    }
  }
  const bundlePromises = [...neededBundles].map((b) => loadBundle(slug, b.file));
  const bundles = await Promise.all(bundlePromises);
  for (const bundle of bundles) {
    for (const rawChapter of bundle.chapters) {
      if (rawChapter.id >= start && rawChapter.id <= end) {
        const sanitized = sanitizeContent(rawChapter.body);
        const lang = detectLanguage(sanitized);
        result.push({
          number: rawChapter.id,
          title: rawChapter.title,
          content: sanitized,
          lang
        });
      }
    }
  }
  result.sort((a, b) => a.number - b.number);
  return result;
}
function countWords(html) {
  const plainText = html.replace(/<[^>]*>/g, "");
  const words = plainText.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}
async function loadChaptersUntilWordCount(slug, startChapter, targetWords) {
  const info = await getNovelInfo(slug);
  const result = [];
  let totalWords = 0;
  let currentChapter = startChapter;
  while (currentChapter <= info.totalChapters && totalWords < targetWords) {
    const bundle = findBundleForChapter(info, currentChapter);
    if (!bundle) {
      break;
    }
    const bundleData = await loadBundle(slug, bundle.file);
    const rawChapter = bundleData.chapters.find((ch) => ch.id === currentChapter);
    if (!rawChapter) {
      currentChapter++;
      continue;
    }
    const chapterWords = countWords(rawChapter.body);
    if (totalWords + chapterWords > targetWords && result.length > 0) {
      break;
    }
    const sanitized = sanitizeContent(rawChapter.body);
    const lang = detectLanguage(sanitized);
    result.push({
      number: rawChapter.id,
      title: rawChapter.title,
      content: sanitized,
      lang
    });
    totalWords += chapterWords;
    currentChapter++;
  }
  return result;
}

function getStaticPaths() {
  return [];
}
const $$range = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$range;
  const { slug, range } = Astro2.params;
  if (!slug || !range) {
    return Astro2.redirect("/");
  }
  const indexPath = nodePath.join(process.cwd(), "public/novels/index.json");
  const catalog = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  const novel = catalog.novels.find((n) => n.slug === slug);
  if (!novel) {
    return Astro2.redirect("/");
  }
  let chapters = [];
  let mode = "chapter";
  let startChapter = 1;
  let endChapter = 1;
  let wordCount = 0;
  try {
    if (range.includes("+")) {
      mode = "word";
      const [start, words] = range.split("+").map(Number);
      if (isNaN(start) || isNaN(words) || start < 1 || words < 1) {
        return Astro2.redirect(`/novel/${slug}/read/1`);
      }
      startChapter = start;
      wordCount = words;
      chapters = await loadChaptersUntilWordCount(slug, start, words);
    } else if (range.includes("-")) {
      mode = "chapter";
      let [start, end] = range.split("-").map(Number);
      if (isNaN(start) || isNaN(end) || start < 1 || end < 1) {
        return Astro2.redirect(`/novel/${slug}/read/1`);
      }
      if (start > end) {
        [start, end] = [end, start];
      }
      startChapter = start;
      endChapter = end;
      chapters = await loadChapterRange(slug, start, end);
    } else {
      return Astro2.redirect(`/novel/${slug}/read/${range}`);
    }
  } catch (error) {
    console.error("Error loading chapters:", error);
    return Astro2.redirect(`/novel/${slug}/read/1`);
  }
  if (chapters.length === 0) {
    return Astro2.redirect(`/novel/${slug}/read/1`);
  }
  const primaryLang = chapters[0]?.lang || "en";
  let prevRange = null;
  let nextRange = null;
  if (mode === "chapter") {
    const batchSize = endChapter - startChapter + 1;
    if (startChapter > 1) {
      const prevEnd = startChapter - 1;
      const prevStart = Math.max(1, prevEnd - batchSize + 1);
      prevRange = `${prevStart}-${prevEnd}`;
    }
    if (endChapter < novel.totalChapters) {
      const nextStart = endChapter + 1;
      const nextEnd = Math.min(novel.totalChapters, nextStart + batchSize - 1);
      nextRange = `${nextStart}-${nextEnd}`;
    }
  } else if (mode === "word") {
    if (startChapter > 1) {
      const prevStart = Math.max(1, startChapter - 1);
      prevRange = `${prevStart}+${wordCount}`;
    }
    const lastChapter = chapters[chapters.length - 1]?.number || startChapter;
    if (lastChapter < novel.totalChapters) {
      const nextStart = lastChapter + 1;
      nextRange = `${nextStart}+${wordCount}`;
    }
  }
  const headline = mode === "chapter" ? `${novel.title} - Chapters ${startChapter}-${endChapter}` : `${novel.title} - ${wordCount} words from Chapter ${startChapter}`;
  const articleBody = chapters.map((ch) => ch.content.replace(/<[^>]*>/g, "")).join(" ").slice(0, 5e3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    name: novel.title,
    headline,
    articleBody,
    inLanguage: primaryLang,
    isAccessibleForFree: true,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [
        "#reader-content",
        "#reader-content section",
        "#reader-content p"
      ]
    },
    accessibilityFeature: [
      "readingOrder",
      "structuralNavigation",
      "alternativeText"
    ],
    accessMode: ["textual"],
    accessModeSufficient: [
      { "@type": "ItemList", itemListElement: ["textual"] }
    ]
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": headline, "canonicalPath": `/novel/${slug}/read/${range}`, "description": `Read ${novel.title} chapters online`, "jsonLd": jsonLd }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="reader" id="reader-root"> <header class="reader-header"> <a${addAttribute(`/novel/${slug}`, "href")} class="back-btn">Back</a> <span class="header-title">${novel.title}</span> </header> <main class="reader-content" id="reader-content" role="main"> <article id="reader-article"${addAttribute(primaryLang, "lang")}> ${chapters.map((chapter) => renderTemplate`<section${addAttribute(`chapter-${chapter.number}`, "id")}${addAttribute(chapter.lang, "lang")}> <h2>${chapter.title}</h2> <div>${unescapeHTML(chapter.content)}</div> </section>`)} </article> </main> <nav class="reader-nav" aria-label="Batch navigation"> ${prevRange && renderTemplate`<a${addAttribute(`/novel/${slug}/read/${prevRange}`, "href")} rel="prev">Previous</a>`} ${nextRange && renderTemplate`<a${addAttribute(`/novel/${slug}/read/${nextRange}`, "href")} rel="next">Next</a>`} </nav> </div> ` })}`;
}, "/Users/anggimaulana/code/anggi/novelAstro/src/pages/novel/[slug]/read/[range].astro", void 0);

const $$file = "/Users/anggimaulana/code/anggi/novelAstro/src/pages/novel/[slug]/read/[range].astro";
const $$url = "/novel/[slug]/read/[range]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$range,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
