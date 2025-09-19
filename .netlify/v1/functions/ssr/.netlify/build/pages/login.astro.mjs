import { c as createComponent, i as renderHead, j as renderComponent, r as renderTemplate } from '../chunks/astro/server_D_wosZza.mjs';
import 'kleur/colors';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { s as subscribeAuthAndRole, a as signIn } from '../chunks/auth_BW0YqYLL.mjs';
import { X, Info, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
/* empty css                                */
export { renderers } from '../renderers.mjs';

function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState("error");
  const [alertMessage, setAlertMessage] = useState("");
  useEffect(() => {
    const off = subscribeAuthAndRole((user, role) => {
      if (!user || !role) return;
      if (role === "buyer") window.location.href = "/orders/create";
      else window.location.href = "/orders/list";
    });
    return off;
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setShowAlert(false);
    try {
      if (!email || !pass) throw new Error("กรอกอีเมลและรหัสผ่าน");
      await signIn(email.trim(), pass);
      setAlertType("success");
      setAlertMessage("เข้าสู่ระบบสำเร็จ! กำลังนำทาง...");
      setShowAlert(true);
    } catch (e2) {
      setErr(e2?.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      setAlertType("error");
      setAlertMessage(e2?.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 4e3);
    }
  };
  const getAlertIcon = () => {
    switch (alertType) {
      case "info":
        return /* @__PURE__ */ jsx(Info, { className: "h-5 w-5" });
      case "success":
        return /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5" });
      case "warning":
        return /* @__PURE__ */ jsx(AlertTriangle, { className: "h-5 w-5" });
      case "error":
        return /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5" });
      default:
        return /* @__PURE__ */ jsx(Info, { className: "h-5 w-5" });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8 relative", children: [
    showAlert && /* @__PURE__ */ jsx("div", { className: "fixed top-4 right-4 z-50 max-w-sm", children: /* @__PURE__ */ jsxs(
      "div",
      {
        role: "alert",
        className: `alert alert-${alertType} alert-soft shadow-lg border-0`,
        children: [
          getAlertIcon(),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: alertMessage }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowAlert(false),
              className: "btn btn-sm btn-ghost btn-circle ml-auto",
              children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
            }
          )
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "/logo.png",
            alt: "Beverly Logo",
            className: "h-16 w-auto object-contain"
          }
        ) }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Sign In" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(
            "label",
            {
              htmlFor: "email",
              className: "block text-sm font-medium text-gray-900 mb-2",
              children: "Email"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "email",
              name: "email",
              type: "email",
              autoComplete: "email",
              required: true,
              className: "w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#64D1E3] focus:border-[#64D1E3] focus:bg-white transition-all duration-200",
              placeholder: "Email",
              value: email,
              onChange: (e) => setEmail(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(
            "label",
            {
              htmlFor: "password",
              className: "block text-sm font-medium text-gray-900 mb-2",
              children: "Password"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "password",
              name: "password",
              type: "password",
              autoComplete: "current-password",
              required: true,
              className: "w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#64D1E3] focus:border-[#64D1E3] focus:bg-white transition-all duration-200",
              placeholder: "Password",
              value: pass,
              onChange: (e) => setPass(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[#64D1E3] hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#64D1E3] transition-all duration-200 shadow-sm hover:shadow-md",
            children: "Sign In"
          }
        )
      ] }) })
    ] })
  ] });
}

const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="th" data-theme="light"> <head><meta charset="utf-8"><title>เข้าสู่ระบบ</title><meta name="viewport" content="width=device-width, initial-scale=1">${renderHead()}</head> <body class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 font-sans"> ${renderComponent($$result, "LoginPage", LoginPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/test03/po-app/src/components/po/auth/LoginPage", "client:component-export": "default" })} </body></html>`;
}, "C:/Projects/Astro/test03/po-app/src/pages/login.astro", void 0);

const $$file = "C:/Projects/Astro/test03/po-app/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
