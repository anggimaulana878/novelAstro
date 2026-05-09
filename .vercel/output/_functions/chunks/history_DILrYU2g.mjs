import { c as createComponent } from './astro-component_B5mpHq_T.mjs';
import 'piccolore';
import { n as renderComponent, r as renderTemplate, m as maybeRenderHead } from './entrypoint_D3z8RzlV.mjs';
import { r as renderScript, $ as $$BottomNav } from './BottomNav_BWjvz-wx.mjs';
import { $ as $$Layout } from './Layout_DuozPMi-.mjs';

const $$History = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Reading History", "data-astro-cid-tal57otx": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="history" data-astro-cid-tal57otx> <header class="history-header" data-astro-cid-tal57otx> <a href="/" class="back-btn" aria-label="Back to library" data-astro-cid-tal57otx> <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-astro-cid-tal57otx> <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-tal57otx></path> </svg> </a> <h1 class="history-title" data-astro-cid-tal57otx>Reading History</h1> </header> <div class="history-list" id="history-list" data-astro-cid-tal57otx> <!-- Populated by JS --> </div> <div class="empty-state" id="empty-state" style="display: none;" data-astro-cid-tal57otx> <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" data-astro-cid-tal57otx> <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-tal57otx></path> <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-tal57otx></path> </svg> <span class="empty-title" data-astro-cid-tal57otx>No reading history yet</span> <span class="empty-subtitle" data-astro-cid-tal57otx>Start reading from your <a href="/" data-astro-cid-tal57otx>library</a></span> </div> </main> ${renderComponent($$result2, "BottomNav", $$BottomNav, { "data-astro-cid-tal57otx": true })} ` })} ${renderScript($$result, "/Users/anggimaulana/code/anggi/novelAstro/src/pages/history.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/anggimaulana/code/anggi/novelAstro/src/pages/history.astro", void 0);

const $$file = "/Users/anggimaulana/code/anggi/novelAstro/src/pages/history.astro";
const $$url = "/history";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$History,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
