import { c as createComponent, j as renderComponent, r as renderTemplate } from '../../chunks/astro/server_D_wosZza.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../../chunks/MainLayout_pePT6WsK.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { b as auth } from '../../chunks/auth_BW0YqYLL.mjs';
import { t as toNum, g as grandTotal, c as createOrder } from '../../chunks/poApi_B5BG6v-M.mjs';
import { Package, DollarSign, Plus, Hash, Calendar, Trash2 } from 'lucide-react';
export { renderers } from '../../renderers.mjs';

function CreateOrderPage() {
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [requester, setRequester] = useState("");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({
    description: "",
    receivedDate: "",
    quantity: "",
    amount: "",
    itemType: "วัตถุดิบ"
  });
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    setRequester(u.displayName || (u.email ?? "").split("@")[0]);
  }, []);
  const openAddModal = () => {
    setNewItem({
      description: "",
      receivedDate: "",
      quantity: "",
      amount: "",
      itemType: "วัตถุดิบ"
    });
    setShowModal(true);
  };
  const addItemFromModal = () => {
    if (!newItem.description.trim() || toNum(newItem.quantity) <= 0 || toNum(newItem.amount) <= 0) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const itemToAdd = {
      no: items.length + 1,
      ...newItem,
      itemType: "วัตถุดิบ"
    };
    setItems((prev) => [...prev, itemToAdd]);
    setShowModal(false);
    setNewItem({
      description: "",
      receivedDate: "",
      quantity: "",
      amount: "",
      itemType: "วัตถุดิบ"
    });
  };
  const closeModal = () => {
    setShowModal(false);
    setNewItem({
      description: "",
      receivedDate: "",
      quantity: "",
      amount: "",
      itemType: "วัตถุดิบ"
    });
  };
  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, no: i + 1 })));
  };
  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map(
      (item, i) => i === idx ? { ...item, [field]: value } : item
    ));
  };
  const invalid = () => !requester.trim() || items.length === 0 || items.some((item) => !item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);
  const doCreate = async () => {
    setSubmitted(true);
    if (invalid()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน (ผู้สั่งซื้อ, รายการ/จำนวน/ราคา)");
      return;
    }
    try {
      setSaving(true);
      const itemsWithType = items.map((item) => ({ ...item, itemType: "วัตถุดิบ" }));
      await createOrder({ date, requesterName: requester, items: itemsWithType });
      window.location.href = "/orders/tracking";
    } catch (e) {
      alert(e?.message ?? "บันทึกใบสั่งซื้อไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
    /* @__PURE__ */ jsxs("dialog", { id: "add_item_modal", className: `modal ${showModal ? "modal-open" : ""}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "modal-box", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-5 h-5" }),
          "เพิ่มรายการสินค้า"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "รายการที่ขอซื้อ" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered w-full",
                placeholder: "ระบุรายละเอียดสินค้า",
                value: newItem.description,
                onChange: (e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "วันที่ต้องการรับ" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                className: "input input-bordered w-full",
                value: newItem.receivedDate,
                onChange: (e) => setNewItem((prev) => ({ ...prev, receivedDate: e.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
              /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "จำนวน" }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  inputMode: "decimal",
                  className: "input input-bordered w-full",
                  placeholder: "จำนวน",
                  value: newItem.quantity,
                  onChange: (e) => setNewItem((prev) => ({ ...prev, quantity: e.target.value }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
              /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "ราคา/หน่วย (บาท)" }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  inputMode: "decimal",
                  className: "input input-bordered w-full",
                  placeholder: "ราคา",
                  value: newItem.amount,
                  onChange: (e) => setNewItem((prev) => ({ ...prev, amount: e.target.value }))
                }
              )
            ] })
          ] }),
          newItem.quantity && newItem.amount && /* @__PURE__ */ jsxs("div", { className: "alert alert-info", children: [
            /* @__PURE__ */ jsx(DollarSign, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "รวม: ",
              toNum(newItem.quantity) * toNum(newItem.amount),
              " บาท"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "modal-action", children: [
          /* @__PURE__ */ jsx("button", { className: "btn btn-ghost", onClick: closeModal, children: "ยกเลิก" }),
          /* @__PURE__ */ jsxs("button", { className: "btn btn-primary", onClick: addItemFromModal, children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            "เพิ่มรายการ"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("form", { method: "dialog", className: "modal-backdrop", children: /* @__PURE__ */ jsx("button", { onClick: closeModal, children: "close" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-xl", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
      /* @__PURE__ */ jsxs("h2", { className: "card-title text-2xl mb-6", children: [
        /* @__PURE__ */ jsx(Package, { className: "w-6 h-6" }),
        "สร้างใบสั่งซื้อใหม่"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "วันที่" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              className: "input input-bordered w-full",
              value: date,
              onChange: (e) => setDate(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "ผู้สั่งซื้อ" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              className: `input input-bordered w-full ${submitted && !requester ? "input-error" : ""}`,
              placeholder: "ชื่อผู้สั่งซื้อ",
              value: requester,
              onChange: (e) => setRequester(e.target.value)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "รายการสินค้า" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: openAddModal,
              className: "btn btn-primary btn-sm",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                "เพิ่มรายการ"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "overflow-x-auto", children: [
          /* @__PURE__ */ jsxs("table", { className: "table table-zebra w-full", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "w-16", children: /* @__PURE__ */ jsx(Hash, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsx("th", { children: "รายการที่ขอซื้อ" }),
              /* @__PURE__ */ jsxs("th", { className: "w-40", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }),
                "วันที่ต้องการ"
              ] }),
              /* @__PURE__ */ jsx("th", { className: "w-24 text-right", children: "จำนวน" }),
              /* @__PURE__ */ jsx("th", { className: "w-32 text-right", children: "ราคา/หน่วย (บาท)" }),
              /* @__PURE__ */ jsx("th", { className: "w-32 text-right", children: "รวม (บาท)" }),
              /* @__PURE__ */ jsx("th", { className: "w-16" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: items.map((item, idx) => {
              const total = toNum(item.quantity) * toNum(item.amount);
              const hasError = submitted && (!item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);
              return /* @__PURE__ */ jsxs("tr", { className: hasError ? "bg-error/10" : "", children: [
                /* @__PURE__ */ jsx("td", { className: "text-center font-medium", children: item.no }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    className: `input input-sm input-bordered w-full ${submitted && !item.description.trim() ? "input-error" : ""}`,
                    placeholder: "ระบุรายละเอียดสินค้า",
                    value: item.description,
                    onChange: (e) => updateItem(idx, "description", e.target.value)
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    className: "input input-sm input-bordered w-full",
                    value: item.receivedDate,
                    onChange: (e) => updateItem(idx, "receivedDate", e.target.value)
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    inputMode: "decimal",
                    className: `input input-sm input-bordered w-full text-right ${submitted && toNum(item.quantity) <= 0 ? "input-error" : ""}`,
                    placeholder: "จำนวน",
                    value: item.quantity,
                    onChange: (e) => updateItem(idx, "quantity", e.target.value)
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    inputMode: "decimal",
                    className: `input input-sm input-bordered w-full text-right ${submitted && toNum(item.amount) <= 0 ? "input-error" : ""}`,
                    placeholder: "ราคา",
                    value: item.amount,
                    onChange: (e) => updateItem(idx, "amount", e.target.value)
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "text-right font-medium", children: total > 0 ? total.toLocaleString("th-TH") : "0" }),
                /* @__PURE__ */ jsx("td", { className: "text-center", children: /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => removeItem(idx),
                    className: "btn btn-ghost btn-sm text-error hover:bg-error/10",
                    title: "ลบรายการ",
                    children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                  }
                ) })
              ] }, idx);
            }) })
          ] }),
          items.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
            /* @__PURE__ */ jsx("div", { className: "text-base-content/100 mb-4", children: /* @__PURE__ */ jsx(Package, { className: "mx-auto h-12 w-12" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-2", children: "ยังไม่มีรายการสินค้า" }),
            /* @__PURE__ */ jsx("p", { className: "text-base-content/60 mb-4", children: 'คลิก "เพิ่มรายการ" เพื่อเพิ่มสินค้าที่ต้องการสั่งซื้อ' }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: openAddModal,
                className: "btn btn-primary",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                  "เพิ่มรายการแรก"
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "divider" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-lg", children: [
          /* @__PURE__ */ jsx("span", { className: "text-base-content/70", children: "รวมเป็นเงิน: " }),
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-2xl text-primary", children: [
            grandTotal(items).toLocaleString("th-TH"),
            " บาท"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: doCreate,
            disabled: saving || invalid(),
            className: "btn btn-primary btn-lg",
            children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-sm" }),
              "กำลังบันทึก..."
            ] }) : "สร้างใบสั่งซื้อและส่งขออนุมัติ"
          }
        )
      ] })
    ] }) })
  ] });
}

const $$Create = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "CreateOrderPage", CreateOrderPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/test03/po-app/src/components/po/CreateOrderPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/test03/po-app/src/pages/orders/create.astro", void 0);

const $$file = "C:/Projects/Astro/test03/po-app/src/pages/orders/create.astro";
const $$url = "/orders/create";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Create,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
