import { c as createComponent } from './astro-component_B5mpHq_T.mjs';
import 'piccolore';
import { r as renderTemplate, p as renderSlot, q as renderHead, u as unescapeHTML, h as addAttribute } from './entrypoint_D3z8RzlV.mjs';
import 'clsx';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a, _b;
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const { title, description = "Web Novel Reader", canonicalPath, ogImage, jsonLd } = Astro2.props;
  const siteUrl = Astro2.site ?? new URL("https://localhost");
  const canonicalUrl = canonicalPath ? new URL(canonicalPath, siteUrl) : void 0;
  return renderTemplate(_b || (_b = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" href="/favicon.ico"><meta name="description"', '><meta name="generator"', '><meta name="theme-color" content="#2563eb"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default">', '<!-- Open Graph --><meta property="og:title"', '><meta property="og:description"', '><meta property="og:type" content="website">', "", "<!-- JSON-LD Structured Data -->", "<title>", "</title><script>\n      (function() {\n        try {\n          const s = JSON.parse(localStorage.getItem('reader-settings') || '{}');\n          const theme = s.theme || 'system';\n          const resolved = theme === 'system'\n            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')\n            : theme;\n          document.documentElement.setAttribute('data-theme', resolved);\n          if (s.fontFamily) document.documentElement.setAttribute('data-font', s.fontFamily);\n          if (s.fontSize) document.documentElement.setAttribute('data-fontsize', String(s.fontSize));\n        } catch {}\n      })();\n    <\/script>", "</head> <body> ", "</body></html>"])), addAttribute(description, "content"), addAttribute(Astro2.generator, "content"), canonicalUrl && renderTemplate`<link rel="canonical"${addAttribute(canonicalUrl.href, "href")}>`, addAttribute(title, "content"), addAttribute(description, "content"), canonicalUrl && renderTemplate`<meta property="og:url"${addAttribute(canonicalUrl.href, "content")}>`, ogImage && renderTemplate`<meta property="og:image"${addAttribute(new URL(ogImage, siteUrl).href, "content")}>`, jsonLd && renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(jsonLd))), title, renderHead(), renderSlot($$result, $$slots["default"]));
}, "/Users/anggimaulana/code/anggi/novelAstro/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
