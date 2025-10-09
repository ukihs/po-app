import { d as createComponent, e as createAstro } from '../chunks/astro/server_BP4slHKI.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                  */
import { a as extractIdTokenFromCookie, v as verifyFirebaseToken } from '../chunks/firebase-auth_lYIhD4kb.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const cookieHeader = Astro2.request.headers.get("Cookie");
  const idToken = extractIdTokenFromCookie(cookieHeader);
  let redirectUrl = "/login";
  if (idToken) {
    try {
      const user = await verifyFirebaseToken(idToken);
      if (user) {
        if (user.role === "employee") {
          redirectUrl = "/orders/create";
        } else if (user.role === "supervisor") {
          redirectUrl = "/orders/tracking";
        } else if (user.role === "procurement") {
          redirectUrl = "/orders/list";
        } else if (user.role === "admin") {
          redirectUrl = "/admin/users";
        }
      }
    } catch (error) {
      console.error("Token verification failed:", error);
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
