import { c as createComponent, j as renderComponent, r as renderTemplate } from '../../chunks/astro/server_D_wosZza.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../../chunks/MainLayout_D1JUXhmN.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { b as auth } from '../../chunks/auth_BW0YqYLL.mjs';
import { t as toNum, g as grandTotal, c as createOrder } from '../../chunks/poApi_B5BG6v-M.mjs';
import { Package, Calendar, Plus, Trash2 } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
export { renderers } from '../../renderers.mjs';

function CreateOrderPage() {
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [selectedDate, setSelectedDate] = useState(/* @__PURE__ */ new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [requester, setRequester] = useState("");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showItemDatePicker, setShowItemDatePicker] = useState(false);
  const [selectedItemDate, setSelectedItemDate] = useState();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate.toISOString().split("T")[0]);
    }
  }, [selectedDate]);
  useEffect(() => {
    if (selectedItemDate) {
      setNewItem((prev) => ({
        ...prev,
        receivedDate: selectedItemDate.toISOString().split("T")[0]
      }));
    }
  }, [selectedItemDate]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest(".dropdown") && !target.closest('button[style*="anchor-name"]')) {
        setShowDatePicker(false);
        setShowItemDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const openAddModal = () => {
    setNewItem({
      description: "",
      receivedDate: "",
      quantity: "",
      amount: "",
      itemType: "วัตถุดิบ"
    });
    setSelectedItemDate(void 0);
    setShowItemDatePicker(false);
    setShowModal(true);
  };
  const isModalFormValid = () => {
    return newItem.description.trim() && newItem.receivedDate.trim() && toNum(newItem.quantity) > 0 && toNum(newItem.amount) > 0;
  };
  const addItemFromModal = () => {
    if (!isModalFormValid()) {
      if (!newItem.description.trim()) {
        alert("กรุณาระบุรายละเอียดสินค้า");
      } else if (!newItem.receivedDate.trim()) {
        alert("กรุณาเลือกวันที่ต้องการรับ");
      } else if (toNum(newItem.quantity) <= 0) {
        alert("กรุณาระบุจำนวนที่ถูกต้อง");
      } else if (toNum(newItem.amount) <= 0) {
        alert("กรุณาระบุราคาที่ถูกต้อง");
      }
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
    setSelectedItemDate(void 0);
    setShowItemDatePicker(false);
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
    setSelectedItemDate(void 0);
    setShowItemDatePicker(false);
  };
  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, no: i + 1 })));
  };
  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map(
      (item, i) => i === idx ? { ...item, [field]: value } : item
    ));
  };
  const isFormValid = () => {
    if (!requester.trim()) return false;
    if (items.length === 0) return false;
    return !items.some(
      (item) => !item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0
    );
  };
  const getValidationMessage = () => {
    if (!requester.trim()) return "กรุณาระบุชื่อผู้ขอซื้อ";
    if (items.length === 0) return "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ";
    const invalidItem = items.find(
      (item) => !item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0
    );
    if (invalidItem) {
      const itemIndex = items.indexOf(invalidItem) + 1;
      if (!invalidItem.description.trim()) return `รายการที่ ${itemIndex}: กรุณาระบุรายละเอียดสินค้า`;
      if (toNum(invalidItem.quantity) <= 0) return `รายการที่ ${itemIndex}: กรุณาระบุจำนวนที่ถูกต้อง`;
      if (toNum(invalidItem.amount) <= 0) return `รายการที่ ${itemIndex}: กรุณาระบุราคาที่ถูกต้อง`;
    }
    return "";
  };
  const showConfirmation = () => {
    setSubmitted(true);
    if (!isFormValid()) {
      alert(getValidationMessage());
      return;
    }
    setShowConfirmModal(true);
  };
  const confirmCreate = async () => {
    try {
      setSaving(true);
      setShowConfirmModal(false);
      const itemsWithType = items.map((item) => ({ ...item, itemType: "วัตถุดิบ" }));
      await createOrder({ date, requesterName: requester, items: itemsWithType });
      window.location.href = "/orders/tracking";
    } catch (e) {
      alert(e?.message ?? "บันทึกใบสั่งซื้อไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };
  const cancelCreate = () => {
    setShowConfirmModal(false);
    setSaving(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
    /* @__PURE__ */ jsxs("dialog", { id: "add_item_modal", className: `modal ${showModal ? "modal-open" : ""}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "modal-box", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-5 h-5" }),
          "เพิ่มรายการสินค้า"
        ] }),
        /* @__PURE__ */ jsxs("form", { className: "space-y-4", noValidate: true, children: [
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "รายการที่ขอซื้อ" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered validator w-full",
                placeholder: "ระบุรายละเอียดสินค้า",
                value: newItem.description,
                onChange: (e) => setNewItem((prev) => ({ ...prev, description: e.target.value })),
                required: true,
                minLength: 1,
                title: "กรุณาระบุรายละเอียดสินค้า"
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "validator-hint", children: "กรุณาระบุรายละเอียดสินค้า" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsxs("span", { className: "label-text font-medium", children: [
              "วันที่ต้องการรับ ",
              /* @__PURE__ */ jsx("span", { className: "text-error", children: "*" })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setShowItemDatePicker(!showItemDatePicker),
                  className: `input input-bordered w-full flex items-center justify-between text-left ${!newItem.receivedDate.trim() ? "border-error text-error" : "border-success text-success"}`,
                  style: { anchorName: "--item-date" },
                  children: [
                    /* @__PURE__ */ jsx("span", { className: !selectedItemDate ? "text-gray-500" : "", children: selectedItemDate ? selectedItemDate.toLocaleDateString("th-TH") : "เลือกวันที่ต้องการรับ *" }),
                    /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" })
                  ]
                }
              ),
              showItemDatePicker && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "dropdown absolute top-full left-0 mt-2 bg-base-100 rounded-box shadow-lg border z-50",
                  style: { positionAnchor: "--item-date" },
                  children: /* @__PURE__ */ jsx(
                    DayPicker,
                    {
                      className: "react-day-picker p-4",
                      mode: "single",
                      selected: selectedItemDate,
                      onSelect: (date2) => {
                        setSelectedItemDate(date2);
                        setShowItemDatePicker(false);
                      }
                    }
                  )
                }
              ),
              !newItem.receivedDate.trim() && /* @__PURE__ */ jsx("div", { className: "text-error text-xs font-normal mt-1", children: "กรุณาเลือกวันที่ต้องการรับ" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
              /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "จำนวน" }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  className: "input input-bordered validator w-full",
                  placeholder: "จำนวน",
                  value: newItem.quantity,
                  onChange: (e) => setNewItem((prev) => ({ ...prev, quantity: e.target.value })),
                  required: true,
                  min: "0.01",
                  step: "0.01",
                  title: "กรุณาระบุจำนวนอย่างน้อย 1 จำนวน"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "validator-hint", children: "กรุณาระบุจำนวน" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
              /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "ราคาต่อหน่วย (บาท)" }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  className: "input input-bordered validator w-full",
                  placeholder: "ราคา",
                  value: newItem.amount,
                  onChange: (e) => setNewItem((prev) => ({ ...prev, amount: e.target.value })),
                  required: true,
                  min: "0.01",
                  step: "0.01",
                  title: "กรุณาระบุราคา"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "validator-hint", children: "กรุณาระบุราคา" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "modal-action", children: [
          /* @__PURE__ */ jsx("button", { className: "btn font-normal", onClick: closeModal, children: "ยกเลิก" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: `btn text-white ${!isModalFormValid() ? "bg-gray-400 cursor-not-allowed" : "bg-[#6EC1E4] hover:bg-[#2b9ccc]"}`,
              onClick: addItemFromModal,
              disabled: !isModalFormValid(),
              children: "เพิ่มรายการ"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("form", { method: "dialog", className: "modal-backdrop", children: /* @__PURE__ */ jsx("button", { onClick: closeModal, children: "close" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-xl", children: /* @__PURE__ */ jsxs("form", { className: "card-body", noValidate: true, children: [
      /* @__PURE__ */ jsxs("h2", { className: "card-title text-2xl mb-6", children: [
        /* @__PURE__ */ jsx(Package, { className: "w-6 h-6" }),
        "สร้างใบขอซื้อ"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "วันที่ขอซื้อ" }) }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setShowDatePicker(!showDatePicker),
                className: "input input-bordered w-full flex items-center justify-between text-left",
                style: { anchorName: "--order-date" },
                children: [
                  /* @__PURE__ */ jsx("span", { children: selectedDate ? selectedDate.toLocaleDateString("th-TH") : "เลือกวันที่" }),
                  /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" })
                ]
              }
            ),
            showDatePicker && /* @__PURE__ */ jsx(
              "div",
              {
                className: "dropdown absolute top-full left-0 mt-2 bg-base-100 rounded-box shadow-lg border z-50",
                style: { positionAnchor: "--order-date" },
                children: /* @__PURE__ */ jsx(
                  DayPicker,
                  {
                    className: "react-day-picker p-4",
                    mode: "single",
                    selected: selectedDate,
                    onSelect: (date2) => {
                      setSelectedDate(date2);
                      setShowDatePicker(false);
                    }
                  }
                )
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text font-medium", children: "ชื่อผู้ขอซื้อ" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              className: "input input-bordered validator w-full",
              placeholder: "ชื่อผู้ขอซื้อ",
              value: requester,
              onChange: (e) => setRequester(e.target.value),
              required: true,
              minLength: 1,
              title: "กรุณาระบุชื่อผู้ขอซื้อ"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "validator-hint", children: "กรุณาระบุชื่อผู้ขอซื้อ" })
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
              className: "btn btn-sm font-normal bg-white border-[#6EC1E4] hover:bg-[#6ec1e4]",
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
              /* @__PURE__ */ jsx("th", { children: "ลำดับที่" }),
              /* @__PURE__ */ jsx("th", { children: "รายการที่ขอซื้อ" }),
              /* @__PURE__ */ jsx("th", { children: "วันที่ต้องการรับ" }),
              /* @__PURE__ */ jsx("th", { children: "จำนวน" }),
              /* @__PURE__ */ jsx("th", { children: "จำนวนเงิน (บาท)" }),
              /* @__PURE__ */ jsx("th", { children: "รวม (บาท)" }),
              /* @__PURE__ */ jsx("th", {})
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: items.map((item, idx) => {
              const total = toNum(item.quantity) * toNum(item.amount);
              const hasError = submitted && (!item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);
              return /* @__PURE__ */ jsxs("tr", { className: hasError ? "bg-error/10" : "", children: [
                /* @__PURE__ */ jsx("td", { className: "text-center font-normal", children: item.no }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    className: "input input-sm input-bordered validator w-full",
                    placeholder: "ระบุรายละเอียดสินค้า",
                    value: item.description,
                    onChange: (e) => updateItem(idx, "description", e.target.value),
                    required: true,
                    minLength: 1,
                    title: "กรุณาระบุรายละเอียดสินค้า"
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
                    type: "number",
                    className: "input input-sm input-bordered validator w-full text-right",
                    placeholder: "จำนวน",
                    value: item.quantity,
                    onChange: (e) => updateItem(idx, "quantity", e.target.value),
                    required: true,
                    min: "0.01",
                    step: "0.01",
                    title: "กรุณาระบุจำนวน"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    className: "input input-sm input-bordered validator w-full text-right",
                    placeholder: "ราคา",
                    value: item.amount,
                    onChange: (e) => updateItem(idx, "amount", e.target.value),
                    required: true,
                    min: "0.01",
                    step: "0.01",
                    title: "กรุณาระบุราคา"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "text-right font-normal", children: total > 0 ? total.toLocaleString("th-TH") : "0" }),
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
            /* @__PURE__ */ jsx("p", { className: "text-base-content/60 mb-4", children: 'คลิกปุ่ม "เพิ่มรายการ" เพื่อเพิ่มรายการสินค้าที่ต้องการขอซื้อ' })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "divider" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-lg", children: [
          /* @__PURE__ */ jsx("span", { className: "text-base", children: "รวมเป็นเงินจำนวน : " }),
          /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-[#6EC1E4]", children: [
            grandTotal(items).toLocaleString("th-TH"),
            " บาท"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: showConfirmation,
            disabled: saving || !isFormValid(),
            className: `btn text-white ${!isFormValid() ? "bg-gray-400 cursor-not-allowed" : "bg-[#6EC1E4] hover:bg-[#2b9ccc]"}`,
            children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-sm" }),
              "กำลังบันทึก..."
            ] }) : "สร้างใบขอซื้อ"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("dialog", { className: `modal ${showConfirmModal ? "modal-open" : ""}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "modal-box max-w-2xl", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-bold text-xl mb-6 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-6 h-6" }),
          "ยืนยันการสร้างใบขอซื้อ"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-base-200 rounded-lg p-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-3", children: "ข้อมูลผู้ขอซื้อ" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "วันที่ขอซื้อ:" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium", children: new Date(date).toLocaleDateString("th-TH") })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "ชื่อผู้ขอซื้อ:" }),
                /* @__PURE__ */ jsx("p", { className: "font-medium", children: requester })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h4", { className: "font-semibold mb-3", children: [
              "รายการสินค้า (",
              items.length,
              " รายการ)"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto max-h-60 overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "table table-sm table-zebra w-full", children: [
              /* @__PURE__ */ jsx("thead", { className: "sticky top-0", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { children: "ลำดับ" }),
                /* @__PURE__ */ jsx("th", { children: "รายการ" }),
                /* @__PURE__ */ jsx("th", { children: "วันที่ต้องการรับ" }),
                /* @__PURE__ */ jsx("th", { children: "จำนวน" }),
                /* @__PURE__ */ jsx("th", { children: "ราคา" }),
                /* @__PURE__ */ jsx("th", { className: "text-right", children: "รวม" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { children: item.no }),
                /* @__PURE__ */ jsx("td", { className: "max-w-xs truncate", title: item.description, children: item.description }),
                /* @__PURE__ */ jsx("td", { children: item.receivedDate ? new Date(item.receivedDate).toLocaleDateString("th-TH") : "-" }),
                /* @__PURE__ */ jsx("td", { children: toNum(item.quantity).toLocaleString("th-TH") }),
                /* @__PURE__ */ jsx("td", { children: toNum(item.amount).toLocaleString("th-TH") }),
                /* @__PURE__ */ jsx("td", { className: "text-right font-medium", children: (toNum(item.quantity) * toNum(item.amount)).toLocaleString("th-TH") })
              ] }, idx)) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-[#c3e4f4] rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("span", { className: "text-base font-semibold", children: "รวมเป็นเงินทั้งสิ้น:" }),
            /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-[#6EC1E4]", children: [
              grandTotal(items).toLocaleString("th-TH"),
              " บาท"
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "modal-action", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn font-normal",
              onClick: cancelCreate,
              disabled: saving,
              children: "ยกเลิก"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn bg-[#6EC1E4] text-white hover:bg-[#2b9ccc]",
              onClick: confirmCreate,
              disabled: saving,
              children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-sm" }),
                "กำลังสร้างใบขอซื้อ..."
              ] }) : "ยืนยันและส่งขออนุมัติ"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("form", { method: "dialog", className: "modal-backdrop", children: /* @__PURE__ */ jsx("button", { onClick: cancelCreate, children: "close" }) })
    ] })
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
