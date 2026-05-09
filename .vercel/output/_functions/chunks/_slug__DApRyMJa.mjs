import { c as createComponent } from './astro-component_B5mpHq_T.mjs';
import 'piccolore';
import { n as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from './entrypoint_D3z8RzlV.mjs';
import { r as renderScript, $ as $$BottomNav } from './BottomNav_BWjvz-wx.mjs';
import { $ as $$Layout } from './Layout_DuozPMi-.mjs';
import fs from 'node:fs';
import nodePath from 'node:path';

function getStaticPaths() {
  const indexPath = nodePath.join(process.cwd(), "public/novels/index.json");
  const data = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  return data.novels.map((novel) => ({
    params: { slug: novel.slug }
  }));
}
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const indexPath = nodePath.join(process.cwd(), "public/novels/index.json");
  const catalog = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  const novel = catalog.novels.find((n) => n.slug === slug);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": novel.title, "description": novel.synopsis || `Read ${novel.title} online`, "canonicalPath": `/novel/${slug}`, "ogImage": novel.cover, "jsonLd": {
    "@context": "https://schema.org",
    "@type": "Book",
    name: novel.title,
    author: novel.authors.map((a) => ({ "@type": "Person", name: a })),
    genre: novel.genres,
    description: novel.synopsis || void 0,
    image: novel.cover,
    numberOfPages: novel.totalChapters
  }, "data-astro-cid-efxmvjpq": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="detail" id="detail-root"${addAttribute(slug, "data-slug")}${addAttribute(novel.totalChapters, "data-total")} data-astro-cid-efxmvjpq> <header class="detail-header" data-astro-cid-efxmvjpq> <a href="/" class="back-btn touch-target" aria-label="Back to library" data-astro-cid-efxmvjpq> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-efxmvjpq> <polyline points="15 18 9 12 15 6" data-astro-cid-efxmvjpq></polyline> </svg> </a> <h1 data-astro-cid-efxmvjpq>${novel.title}</h1> </header> <section class="novel-meta" data-astro-cid-efxmvjpq> <div class="cover-large" data-astro-cid-efxmvjpq> <img${addAttribute(novel.cover, "src")}${addAttribute(novel.title, "alt")} data-astro-cid-efxmvjpq> </div> <div class="meta-info" data-astro-cid-efxmvjpq> <p class="authors" data-astro-cid-efxmvjpq>${novel.authors.length > 0 ? novel.authors.join(", ") : "Unknown Author"}</p> <p class="chapters" data-astro-cid-efxmvjpq>${novel.totalChapters} chapters</p> <div class="genres" data-astro-cid-efxmvjpq> ${novel.genres.length > 0 ? novel.genres.map((g) => renderTemplate`<span class="genre-tag" data-astro-cid-efxmvjpq>${g}</span>`) : renderTemplate`<span class="genre-tag muted" data-astro-cid-efxmvjpq>Uncategorized</span>`} </div> </div> </section> <section class="synopsis" data-astro-cid-efxmvjpq> <p data-astro-cid-efxmvjpq>${novel.synopsis || "No synopsis available."}</p> </section> <section class="actions" data-astro-cid-efxmvjpq> <a${addAttribute(`/novel/${slug}/read`, "href")} class="btn-primary" id="continue-btn" data-astro-cid-efxmvjpq>
Start Reading
</a> <div class="reading-progress" id="reading-progress" data-astro-cid-efxmvjpq> <div class="progress-info" data-astro-cid-efxmvjpq> <span id="progress-label" data-astro-cid-efxmvjpq>0 / ${novel.totalChapters} chapters</span> <span id="progress-percent" data-astro-cid-efxmvjpq>0%</span> </div> <div class="progress-track" data-astro-cid-efxmvjpq> <div class="progress-fill" id="progress-fill" data-astro-cid-efxmvjpq></div> </div> </div> </section> <section class="chapter-list-section" data-astro-cid-efxmvjpq> <div class="chapter-list-header" data-astro-cid-efxmvjpq> <h2 data-astro-cid-efxmvjpq>Chapters</h2> <input type="search" id="chapter-search" placeholder="Search by title..." class="chapter-search" data-astro-cid-efxmvjpq> </div> <div class="chapter-tabs" id="chapter-tabs" data-astro-cid-efxmvjpq></div> <div class="chapter-list" id="chapter-list" data-astro-cid-efxmvjpq></div> </section> </main> ${renderComponent($$result2, "BottomNav", $$BottomNav, { "data-astro-cid-efxmvjpq": true })} ` })} ${renderScript($$result, "/Users/anggimaulana/code/anggi/novelAstro/src/pages/novel/[slug].astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/anggimaulana/code/anggi/novelAstro/src/pages/novel/[slug].astro", void 0);

const $$file = "/Users/anggimaulana/code/anggi/novelAstro/src/pages/novel/[slug].astro";
const $$url = "/novel/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
