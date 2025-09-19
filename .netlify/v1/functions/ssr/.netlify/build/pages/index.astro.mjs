import { c as createComponent, i as renderHead, l as renderScript, r as renderTemplate } from '../chunks/astro/server_D_wosZza.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                */
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="th"> <head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/login"><title>กำลังนำทางไปยังหน้าเข้าสู่ระบบ…</title>${renderHead()}</head> <body class="font-sans"> <p class="p-4 text-slate-600">กำลังนำทางไปยังหน้าเข้าสู่ระบบ… หากไม่ถูกนำทางอัตโนมัติ <a class="underline" href="/login">คลิกที่นี่</a></p> ${renderScript($$result, "C:/Projects/Astro/test03/po-app/src/pages/index.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "C:/Projects/Astro/test03/po-app/src/pages/index.astro", void 0);

const $$file = "C:/Projects/Astro/test03/po-app/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
