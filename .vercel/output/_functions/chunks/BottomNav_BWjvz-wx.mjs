import { o as createRenderInstruction, m as maybeRenderHead, h as addAttribute, r as renderTemplate } from './entrypoint_D3z8RzlV.mjs';
import { c as createComponent } from './astro-component_B5mpHq_T.mjs';
import 'piccolore';
import 'clsx';

async function renderScript(result, id) {
  const inlined = result.inlinedScripts.get(id);
  let content = "";
  if (inlined != null) {
    if (inlined) {
      content = `<script type="module">${inlined}</script>`;
    }
  } else {
    const resolved = await result.resolve(id);
    content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"></script>`;
  }
  return createRenderInstruction({ type: "script", id, content });
}

const $$BottomNav = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BottomNav;
  const { active = "home" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<nav class="bottom-nav" aria-hidden="true" data-astro-cid-ltxpr5xc> <a href="/"${addAttribute(["nav-item", { active: active === "home" }], "class:list")} aria-label="Home" data-astro-cid-ltxpr5xc> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-ltxpr5xc> <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" data-astro-cid-ltxpr5xc></path> <polyline points="9 22 9 12 15 12 15 22" data-astro-cid-ltxpr5xc></polyline> </svg> <span data-astro-cid-ltxpr5xc>Home</span> </a> <a href="/settings"${addAttribute(["nav-item", { active: active === "settings" }], "class:list")} aria-label="Settings" data-astro-cid-ltxpr5xc> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-ltxpr5xc> <circle cx="12" cy="12" r="3" data-astro-cid-ltxpr5xc></circle> <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" data-astro-cid-ltxpr5xc></path> </svg> <span data-astro-cid-ltxpr5xc>Settings</span> </a> </nav>`;
}, "/Users/anggimaulana/code/anggi/novelAstro/src/components/BottomNav.astro", void 0);

export { $$BottomNav as $, renderScript as r };
