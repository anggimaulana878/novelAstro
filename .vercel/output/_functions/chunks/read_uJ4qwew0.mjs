import { c as createComponent } from './astro-component_B5mpHq_T.mjs';
import 'piccolore';
import './entrypoint_D3z8RzlV.mjs';
import 'clsx';

const $$Read = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Read;
  const { slug } = Astro2.params;
  return Astro2.redirect(`/novel/${slug}/read/1`, 301);
}, "/Users/anggimaulana/code/anggi/novelAstro/src/pages/novel/[slug]/read.astro", void 0);

const $$file = "/Users/anggimaulana/code/anggi/novelAstro/src/pages/novel/[slug]/read.astro";
const $$url = "/novel/[slug]/read";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Read,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
