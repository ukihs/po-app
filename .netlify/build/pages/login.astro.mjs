import { d as createComponent, j as renderHead, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_7uJhlR4f.mjs';
import 'kleur/colors';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useCallback } from 'react';
import { s as subscribeAuthAndRole, a as createAuthCookie, B as Button, I as Input, b as signIn } from '../chunks/auth_B6D8HlLm.mjs';
import { Info, AlertCircle, AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-react';
import { L as Label } from '../chunks/label_CE0DOuoI.mjs';
import { A as Alert, a as AlertDescription } from '../chunks/alert_X172b6ty.mjs';
/* empty css                                  */
export { renderers } from '../renderers.mjs';

const getRedirectUrl = (role) => {
  const redirects = {
    buyer: "/orders/create",
    supervisor: "/orders/tracking",
    procurement: "/orders/list",
    superadmin: "/admin/users"
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
    message: ""
  });
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
        window.location.href = getRedirectUrl(role);
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    });
    return off;
  }, []);
  const showAlertMessage = useCallback((type, message) => {
    setAlert({ show: true, type, message });
    if (type === "error") {
      setTimeout(() => {
        setAlert((prev) => ({ ...prev, show: false }));
      }, 4e3);
    }
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setAlert((prev) => ({ ...prev, show: false }));
    setIsLoading(true);
    try {
      if (!email.trim() || !pass) {
        throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
      }
      await signIn(email.trim(), pass);
      showAlertMessage("success", "เข้าสู่ระบบสำเร็จ! กำลังนำทาง...");
    } catch (e2) {
      const error = e2;
      let message = "เข้าสู่ระบบไม่สำเร็จ";
      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found":
            message = "ไม่พบผู้ใช้นี้ในระบบ";
            break;
          case "auth/wrong-password":
            message = "รหัสผ่านไม่ถูกต้อง";
            break;
          case "auth/invalid-email":
            message = "รูปแบบอีเมลไม่ถูกต้อง";
            break;
          case "auth/too-many-requests":
            message = "พยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่";
            break;
          default:
            message = error.message || message;
        }
      } else if (error.message) {
        message = error.message;
      }
      showAlertMessage("error", message);
    } finally {
      setIsLoading(false);
    }
  };
  const getAlertIcon = useCallback(() => {
    switch (alert.type) {
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
  }, [alert.type]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative", children: [
    alert.show && /* @__PURE__ */ jsx("div", { className: "fixed top-4 right-4 z-50 max-w-sm", children: /* @__PURE__ */ jsxs(
      Alert,
      {
        variant: alert.type === "error" ? "destructive" : "primary",
        className: "shadow-lg border-0",
        role: "alert",
        "aria-live": "polite",
        children: [
          getAlertIcon(),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
            /* @__PURE__ */ jsx(AlertDescription, { className: "text-sm font-medium", children: alert.message }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => setAlert((prev) => ({ ...prev, show: false })),
                className: "h-6 w-6 ml-2 shrink-0",
                "aria-label": "ปิดการแจ้งเตือน",
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
              }
            )
          ] })
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
