import { d as createComponent, j as renderHead, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_BP4slHKI.mjs';
import 'kleur/colors';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import React__default, { useState, useEffect, useCallback } from 'react';
import { s as subscribeAuthAndRole, f as setAuthCookie, A as Alert, b as AlertIcon, c as AlertTitle, a as AlertDescription, I as Input, B as Button, g as signIn } from '../chunks/alert_CSmt_LxB.mjs';
import { Loader2 } from 'lucide-react';
import { RiInformationFill, RiSpam3Fill, RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';
import { L as Label } from '../chunks/label_beMVa6GR.mjs';
/* empty css                                  */
export { renderers } from '../renderers.mjs';

const getRedirectUrl = (role) => {
  const redirects = {
    employee: "/orders/create",
    supervisor: "/orders/tracking",
    procurement: "/orders/list",
    admin: "/admin/users"
  };
  return redirects[role] || "/login";
};
function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    type: "error",
    title: "",
    description: ""
  });
  useEffect(() => {
    const off = subscribeAuthAndRole(async (user, role) => {
      if (!user || !role) return;
      try {
        await setAuthCookie();
        const redirectUrl = getRedirectUrl(role);
        import('../chunks/client_BUDSSnj2.mjs').then(({ navigate }) => navigate(redirectUrl)).catch(() => {
          window.location.href = redirectUrl;
        });
      } catch (error) {
        console.error("Failed to set auth cookie:", error);
      }
    });
    return off;
  }, []);
  const showAlertMessage = useCallback((type, title, description) => {
    setAlert({ show: true, type, title, description });
    const duration = type === "error" ? 5e3 : 4e3;
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, show: false }));
    }, duration);
  }, []);
  const getAlertConfig = (type) => {
    switch (type) {
      case "success":
        return {
          variant: "success",
          appearance: "light",
          IconComponent: RiCheckboxCircleFill
        };
      case "error":
        return {
          variant: "destructive",
          appearance: "light",
          IconComponent: RiErrorWarningFill
        };
      case "warning":
        return {
          variant: "warning",
          appearance: "light",
          IconComponent: RiSpam3Fill
        };
      case "info":
      default:
        return {
          variant: "info",
          appearance: "light",
          IconComponent: RiInformationFill
        };
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    setAlert((prev) => ({ ...prev, show: false }));
    setIsLoading(true);
    try {
      if (!email.trim() || !pass) {
        throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
      }
      await signIn(email.trim(), pass);
      showAlertMessage("success", "เข้าสู่ระบบสำเร็จ กำลังนำทาง");
    } catch (e2) {
      const error = e2;
      let message = "เข้าสู่ระบบไม่สำเร็จ";
      if (error.message && !error.message.includes("Firebase:")) {
        message = error.message;
      } else {
        message = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      }
      showAlertMessage("error", message);
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative", children: [
    alert.show && /* @__PURE__ */ jsx("div", { className: "fixed top-4 right-4 z-50 max-w-md", children: /* @__PURE__ */ jsxs(
      Alert,
      {
        variant: getAlertConfig(alert.type).variant,
        appearance: getAlertConfig(alert.type).appearance,
        close: true,
        onClose: () => setAlert((prev) => ({ ...prev, show: false })),
        children: [
          /* @__PURE__ */ jsx(AlertIcon, { children: React__default.createElement(getAlertConfig(alert.type).IconComponent, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx(AlertTitle, { children: alert.title }),
          alert.description && /* @__PURE__ */ jsx(AlertDescription, { children: alert.description })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full bg-white rounded-xl shadow-xl p-8", children: [
      /* @__PURE__ */ jsx("div", { className: "text-center space-y-6 mb-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "/logo.png",
            alt: "Bederly Logo",
            className: "h-16 w-auto object-contain"
          }
        ) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "เข้าสู่ระบบ" })
      ] }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "อีเมล" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "email",
              type: "email",
              autoComplete: "email",
              required: true,
              placeholder: "กรอกอีเมลของคุณ",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              className: "h-11",
              disabled: isLoading
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "รหัสผ่าน" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "password",
              type: "password",
              autoComplete: "current-password",
              required: true,
              placeholder: "กรอกรหัสผ่านของคุณ",
              value: pass,
              onChange: (e) => setPass(e.target.value),
              className: "h-11",
              disabled: isLoading
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            disabled: isLoading,
            className: "w-full h-11 bg-[#6EC1E4] hover:bg-[#2b9ccc] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed",
            "aria-label": isLoading ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ",
            children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
              "กำลังเข้าสู่ระบบ..."
            ] }) : "เข้าสู่ระบบ"
          }
        )
      ] })
    ] })
  ] });
}

const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="th" data-theme="light"> <head><meta charset="utf-8"><title>เข้าสู่ระบบ</title><meta name="viewport" content="width=device-width, initial-scale=1">${renderHead()}</head> <body class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100"> ${renderComponent($$result, "LoginPage", LoginPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/Bederly/po-app/src/components/po/auth/LoginPage", "client:component-export": "default" })} </body></html>`;
}, "C:/Projects/Astro/Bederly/po-app/src/pages/login.astro", void 0);

const $$file = "C:/Projects/Astro/Bederly/po-app/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
