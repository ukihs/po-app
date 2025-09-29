import { d as createComponent, e as createAstro } from '../chunks/astro/server_7uJhlR4f.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                */
import { v as validateServerSession } from '../chunks/server-session_BqtPVC-t.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const sessionId = Astro2.cookies.get("session-id")?.value;
  let redirectUrl = "/login";
  if (sessionId) {
    try {
      const user = validateServerSession(sessionId);
      if (user) {
        if (user.role === "buyer") {
          redirectUrl = "/orders/create";
        } else if (user.role === "supervisor") {
          redirectUrl = "/orders/tracking";
        } else if (user.role === "procurement") {
          redirectUrl = "/orders/list";
        } else if (user.role === "superadmin") {
          redirectUrl = "/users";
        }
      }
    } catch (error) {
      console.error("Session validation failed:", error);
      redirectUrl = "/login";
    }
  }
  return Astro2.redirect(redirectUrl);
}, "C:/Projects/Astro/Bederly/po-app/src/pages/index.astro", void 0);

const $$file = "C:/Projects/Astro/Bederly/po-app/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
