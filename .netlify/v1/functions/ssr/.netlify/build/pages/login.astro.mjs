import { d as createComponent, j as renderHead, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_BkuRanWd.mjs';
import 'kleur/colors';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { s as subscribeAuthAndRole, B as Button, a as signIn, c as createAuthCookie } from '../chunks/button_DlB-774j.mjs';
import { X, Info, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { I as Input } from '../chunks/input_BS4MHdRU.mjs';
import { L as Label } from '../chunks/label_BgHliXqP.mjs';
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from '../chunks/card_REjXmj5-.mjs';
import { A as Alert, a as AlertDescription } from '../chunks/alert_CQFjLQA5.mjs';
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
    const off = subscribeAuthAndRole(async (user, role) => {
      if (!user || !role) return;
      try {
        const idToken = await createAuthCookie();
        if (idToken) {
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ idToken })
          });
          if (response.ok) {
            const { sessionId } = await response.json();
            document.cookie = `session-id=${sessionId}; path=/; max-age=28800; secure; samesite=strict`;
          }
        }
        if (role === "buyer") window.location.href = "/orders/create";
        else if (role === "supervisor" || role === "procurement") window.location.href = "/orders/list";
        else if (role === "superadmin") window.location.href = "/users";
      } catch (error) {
        console.error("Failed to create session:", error);
      }
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
        return /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" });
      case "success":
        return /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" });
      case "warning":
        return /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" });
      case "error":
        return /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" });
      default:
        return /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative", children: [
    showAlert && /* @__PURE__ */ jsx("div", { className: "fixed top-4 right-4 z-50 max-w-sm", children: /* @__PURE__ */ jsxs(
      Alert,
      {
        variant: alertType === "error" ? "destructive" : "default",
        className: "shadow-lg border-0",
        children: [
          getAlertIcon(),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
            /* @__PURE__ */ jsx(AlertDescription, { className: "text-sm font-medium", children: alertMessage }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => setShowAlert(false),
                className: "h-6 w-6 ml-2 shrink-0",
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
              }
            )
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs(Card, { className: "max-w-md w-full shadow-xl", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "text-center space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "/logo.png",
            alt: "Beverly Logo",
            className: "h-16 w-auto object-contain"
          }
        ) }),
        /* @__PURE__ */ jsx(CardTitle, { className: "text-2xl font-bold", children: "เข้าสู่ระบบ" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "email",
              name: "email",
              type: "email",
              autoComplete: "email",
              required: true,
              placeholder: "อีเมล",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              className: "h-11"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "password",
              name: "password",
              type: "password",
              autoComplete: "current-password",
              required: true,
              placeholder: "รหัสผ่าน",
              value: pass,
              onChange: (e) => setPass(e.target.value),
              className: "h-11"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            className: "w-full h-11 bg-[#64D1E3] hover:bg-[#4FB3C7] text-white font-medium",
            children: "Sign In"
          }
        )
      ] }) })
    ] })
  ] });
}

const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="th" data-theme="light"> <head><meta charset="utf-8"><title>เข้าสู่ระบบ</title><meta name="viewport" content="width=device-width, initial-scale=1">${renderHead()}</head> <body class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100"> ${renderComponent($$result, "LoginPage", LoginPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/test03/po-app/src/components/po/auth/LoginPage", "client:component-export": "default" })} </body></html>`;
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
