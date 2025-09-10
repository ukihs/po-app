import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { s as subscribeAuthAndRole, c as signOutUser } from './auth_BHth7sWR.mjs';

function Header() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const off = subscribeAuthAndRole((u, r) => {
      console.log("Header - User:", u?.email, "Role:", r);
      setUser(u);
      setIsLoading(false);
      if (u) {
        sessionStorage.setItem("po_user_data", JSON.stringify(u));
      } else {
        sessionStorage.removeItem("po_user_data");
      }
      if (!u && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    });
    return off;
  }, []);
  const getAvatarUrl = () => {
    if (!user?.email) return "";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&size=64&background=64D1E3&color=ffffff&rounded=true`;
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("header", { className: "w-full bg-white border-b border-gray-200 shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between h-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/logo.png",
            alt: "Beverly Logo",
            className: "h-8 w-auto object-contain"
          }
        ),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "text-lg font-semibold text-gray-900", children: "ระบบบันทึกการซื้อ" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "hidden md:block w-16 h-4 bg-gray-200 rounded animate-pulse" }),
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-gray-200 rounded-full animate-pulse" })
      ] })
    ] }) }) });
  }
  if (!user) {
    return /* @__PURE__ */ jsx("header", { className: "w-full bg-white border-b border-gray-200 shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between h-16", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: "/logo.png",
          alt: "Beverly Logo",
          className: "h-8 w-auto object-contain"
        }
      ),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "text-lg font-semibold text-gray-900", children: "ระบบบันทึกการซื้อ" }) })
    ] }) }) }) });
  }
  return /* @__PURE__ */ jsx("header", { className: "w-full bg-white border-b border-gray-200 shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between h-16", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: "/logo.png",
          alt: "Beverly Logo",
          className: "h-8 w-auto object-contain"
        }
      ),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "text-lg font-semibold text-gray-900", children: "ระบบบันทึกการซื้อ" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "hidden md:block text-sm text-gray-600", children: user.displayName || user.email?.split("@")[0] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors",
            onClick: () => {
              const dropdown = document.getElementById("user-dropdown");
              dropdown?.classList.toggle("hidden");
            },
            children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-200", children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: getAvatarUrl(),
                  alt: "User Avatar",
                  className: "w-full h-full object-cover"
                }
              ) }),
              /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 text-gray-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            id: "user-dropdown",
            className: "hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "p-3 border-b border-gray-100", children: [
                /* @__PURE__ */ jsx("div", { className: "font-medium text-gray-900", children: user.displayName || user.email?.split("@")[0] }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-500", children: user.email })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "p-1", children: /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: signOutUser,
                  className: "w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2",
                  children: [
                    /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", className: "w-4 h-4", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1 2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" }) }),
                    "ออกจากระบบ"
                  ]
                }
              ) })
            ]
          }
        )
      ] })
    ] })
  ] }) }) });
}

export { Header as H };
