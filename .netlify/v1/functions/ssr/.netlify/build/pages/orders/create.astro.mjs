import { d as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_BP4slHKI.mjs';
import 'kleur/colors';
import { C as Card, t as CardContent, v as toNum, w as Separator, $ as $$MainLayout } from '../../chunks/card_0XYoxqwD.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import React__default, { useState, useEffect } from 'react';
import { e as cn, B as Button, h as auth, A as Alert, b as AlertIcon, c as AlertTitle, a as AlertDescription, I as Input } from '../../chunks/alert_JioKFGew.mjs';
import { grandTotal, createOrder } from '../../chunks/poApi_BqdytYgU.mjs';
import { Calendar, X, Package, Plus, Trash2 } from 'lucide-react';
import { RiInformationFill, RiSpam3Fill, RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from '../../chunks/dialog_BuSOmAmi.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from '../../chunks/table_Xu5j_Ieu.mjs';
import { L as Label } from '../../chunks/label_BUhr7Pqr.mjs';
import { E as Empty, a as EmptyHeader, b as EmptyMedia, c as EmptyTitle, d as EmptyDescription } from '../../chunks/empty_aUNL12Sy.mjs';
import { C as Calendar$1 } from '../../chunks/calendar_CLTR49Vr.mjs';
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from '../../chunks/popover_CNGaRdBP.mjs';
import { format } from 'date-fns';
import 'clsx';
export { renderers } from '../../renderers.mjs';

function DatePickerDefault({
  date,
  onDateChange,
  placeholder = "เลือกวันที่",
  className,
  buttonClassName,
  showReset = true
}) {
  const [open, setOpen] = React.useState(false);
  const handleReset = (e) => {
    onDateChange?.(void 0);
    e.preventDefault();
    e.stopPropagation();
  };
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: cn("relative", className), children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          mode: "input",
          placeholder: !date,
          className: cn("w-full", buttonClassName),
          children: [
            /* @__PURE__ */ jsx(Calendar, { className: "mr-2 h-4 w-4" }),
            date ? format(date, "dd/MM/yyyy") : /* @__PURE__ */ jsx("span", { children: placeholder })
          ]
        }
      ),
      date && showReset && /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          variant: "dim",
          size: "sm",
          className: "absolute top-1/2 -end-0 -translate-y-1/2",
          onClick: handleReset,
          children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(
      Calendar$1,
      {
        mode: "single",
        selected: date,
        onSelect: (newDate) => {
          onDateChange?.(newDate);
          setOpen(false);
        },
        autoFocus: true
      }
    ) })
  ] });
}

function CreateOrderPage() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(/* @__PURE__ */ new Date());
  const [requester, setRequester] = useState("");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedItemDate, setSelectedItemDate] = useState();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newItem, setNewItem] = useState({
    description: "",
    receivedDate: "",
    quantity: "",
    amount: "",
    itemType: "วัตถุดิบ"
  });
  const [alertState, setAlertState] = useState({
    show: false,
    type: "info",
    title: "",
    description: ""
  });
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const defaultRequester = u.displayName || (u.email ?? "").split("@")[0];
    setRequester(defaultRequester);
  }, []);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const defaultRequester = user.displayName || (user.email ?? "").split("@")[0];
        setRequester(defaultRequester);
      }
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (selectedItemDate) {
      setNewItem((prev) => ({
        ...prev,
        receivedDate: selectedItemDate.toISOString().split("T")[0]
      }));
    }
  }, [selectedItemDate]);
  const showAlert = (message, type = "info", description) => {
    setAlertState({
      show: true,
      type,
      title: message,
      description
    });
    const duration = type === "error" ? 5e3 : 4e3;
    setTimeout(() => {
      setAlertState((prev) => ({ ...prev, show: false }));
    }, duration);
  };
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
  const openAddModal = () => {
    setNewItem({
      description: "",
      receivedDate: "",
      quantity: "",
      amount: "",
      itemType: "วัตถุดิบ"
    });
    setSelectedItemDate(void 0);
    setShowModal(true);
  };
  const isModalFormValid = () => {
    return newItem.description.trim() && newItem.receivedDate.trim() && toNum(newItem.quantity) > 0 && toNum(newItem.amount) > 0;
  };
  const addItemFromModal = () => {
    if (!isModalFormValid()) {
      if (!newItem.description.trim()) {
        showAlert("กรุณาระบุรายละเอียดสินค้า", "error");
      } else if (!newItem.receivedDate.trim()) {
        showAlert("กรุณาเลือกวันที่ต้องการรับ", "error");
      } else if (toNum(newItem.quantity) <= 0) {
        showAlert("กรุณาระบุจำนวนที่ถูกต้อง", "error");
      } else if (toNum(newItem.amount) <= 0) {
        showAlert("กรุณาระบุราคาที่ถูกต้อง", "error");
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
      showAlert(getValidationMessage(), "error");
      return;
    }
    setShowConfirmModal(true);
  };
  const confirmCreate = async () => {
    try {
      setSaving(true);
      setShowConfirmModal(false);
      const itemsWithType = items.map((item) => ({ ...item, itemType: "วัตถุดิบ" }));
      const dateString = selectedDate?.toISOString().split("T")[0] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      await createOrder({ date: dateString, requesterName: requester, items: itemsWithType });
      showAlert("สร้างใบขอซื้อและส่งขออนุมัติเรียบร้อยแล้ว", "success");
      setRequester("");
      setItems([]);
      setSelectedDate(/* @__PURE__ */ new Date());
      setSubmitted(false);
    } catch (e) {
      showAlert("ไม่สามารถสร้างใบขอซื้อได้", "error", e?.message ?? "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
    } finally {
      setSaving(false);
    }
  };
  const cancelCreate = () => {
    setShowConfirmModal(false);
    setSaving(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    alertState.show && /* @__PURE__ */ jsx("div", { className: "fixed top-4 right-4 z-50 max-w-md", children: /* @__PURE__ */ jsxs(
      Alert,
      {
        variant: getAlertConfig(alertState.type).variant,
        appearance: getAlertConfig(alertState.type).appearance,
        close: true,
        onClose: () => setAlertState((prev) => ({ ...prev, show: false })),
        children: [
          /* @__PURE__ */ jsx(AlertIcon, { children: React__default.createElement(getAlertConfig(alertState.type).IconComponent, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx(AlertTitle, { children: alertState.title }),
          alertState.description && /* @__PURE__ */ jsx(AlertDescription, { children: alertState.description })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "mb-4 sm:mb-6", children: /* @__PURE__ */ jsxs("h1", { className: "text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3", children: [
      /* @__PURE__ */ jsx(Package, { className: "w-6 h-6 sm:w-8 sm:h-8 text-[#2b9ccc]" }),
      "สร้างใบขอซื้อ"
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: showModal, onOpenChange: setShowModal, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-[95vw] sm:max-w-[500px]", showCloseButton: false, children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-5 h-5" }),
          "เพิ่มรายการสินค้า"
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "กรอกข้อมูลรายการสินค้าที่ต้องการขอซื้อ" })
      ] }),
      /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: (e) => e.preventDefault(), children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "description", className: "text-sm font-medium", children: [
            "รายการที่ขอซื้อ ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "description",
              type: "text",
              placeholder: "ระบุรายละเอียดสินค้า",
              value: newItem.description,
              onChange: (e) => setNewItem((prev) => ({ ...prev, description: e.target.value })),
              required: true,
              minLength: 1
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { className: "text-sm font-medium", children: [
            "วันที่ต้องการรับ ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            DatePickerDefault,
            {
              date: selectedItemDate,
              onDateChange: setSelectedItemDate,
              placeholder: "เลือกวันที่ต้องการรับ",
              className: "w-full",
              showReset: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "quantity", className: "text-sm font-medium", children: [
              "จำนวน ",
              /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "quantity",
                type: "number",
                placeholder: "จำนวน",
                value: newItem.quantity,
                onChange: (e) => setNewItem((prev) => ({ ...prev, quantity: e.target.value })),
                required: true,
                min: "0.01",
                step: "0.01"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { htmlFor: "amount", className: "text-sm font-medium", children: [
              "ราคาต่อหน่วย (บาท) ",
              /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "amount",
                type: "number",
                placeholder: "ราคา",
                value: newItem.amount,
                onChange: (e) => setNewItem((prev) => ({ ...prev, amount: e.target.value })),
                required: true,
                min: "0.01",
                step: "0.01"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "flex-col sm:flex-row gap-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: closeModal,
            className: "font-normal w-full sm:w-auto",
            children: "ยกเลิก"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: addItemFromModal,
            disabled: !isModalFormValid(),
            variant: "primary",
            className: "font-normal w-full sm:w-auto",
            children: "เพิ่มรายการ"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { className: "space-y-6", onSubmit: (e) => e.preventDefault(), children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-sm font-medium", children: "วันที่ขอซื้อ" }),
          /* @__PURE__ */ jsx(
            DatePickerDefault,
            {
              date: selectedDate,
              onDateChange: setSelectedDate,
              placeholder: "เลือกวันที่",
              className: "w-full",
              showReset: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Label, { htmlFor: "requester", className: "text-sm font-medium", children: [
            "ชื่อผู้ขอซื้อ ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "requester",
              placeholder: "ชื่อผู้ขอซื้อ",
              value: requester,
              onChange: (e) => setRequester(e.target.value),
              required: true,
              minLength: 1
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "รายการสินค้า" }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: openAddModal,
              className: "w-full sm:w-auto",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
                "เพิ่มรายการ"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { className: "min-w-[800px] sm:min-w-full", children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "w-16 sm:w-20 text-center text-xs sm:text-sm", children: "ลำดับ" }),
            /* @__PURE__ */ jsx(TableHead, { className: "w-auto min-w-[180px] sm:min-w-[250px] text-xs sm:text-sm", children: "รายการที่ขอซื้อ" }),
            /* @__PURE__ */ jsx(TableHead, { className: "w-32 sm:w-40 text-xs sm:text-sm", children: "วันที่ต้องการรับ" }),
            /* @__PURE__ */ jsx(TableHead, { className: "w-24 sm:w-28 text-center text-xs sm:text-sm", children: "จำนวน" }),
            /* @__PURE__ */ jsx(TableHead, { className: "w-28 sm:w-36 text-center text-xs sm:text-sm", children: "ราคา (บาท)" }),
            /* @__PURE__ */ jsx(TableHead, { className: "w-28 sm:w-32 text-center text-xs sm:text-sm", children: "รวม (บาท)" }),
            /* @__PURE__ */ jsx(TableHead, { className: "w-16 sm:w-20 text-center text-xs sm:text-sm", children: "ลบ" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: items.map((item, idx) => {
            const total = toNum(item.quantity) * toNum(item.amount);
            const hasError = submitted && (!item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);
            return /* @__PURE__ */ jsxs(TableRow, { className: hasError ? "bg-destructive/10" : "", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "text-center w-16 sm:w-20 text-xs sm:text-sm", children: item.no }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-auto min-w-[180px] sm:min-w-[250px]", children: /* @__PURE__ */ jsx(
                Input,
                {
                  type: "text",
                  placeholder: "ระบุรายละเอียดสินค้า",
                  value: item.description,
                  onChange: (e) => updateItem(idx, "description", e.target.value),
                  className: `h-8 text-xs sm:text-sm ${hasError && !item.description.trim() ? "border-destructive" : ""}`
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-32 sm:w-40", children: /* @__PURE__ */ jsx(
                Input,
                {
                  type: "date",
                  value: item.receivedDate,
                  onChange: (e) => updateItem(idx, "receivedDate", e.target.value),
                  className: "h-8 text-xs sm:text-sm"
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-24 sm:w-28", children: /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  placeholder: "จำนวน",
                  value: item.quantity,
                  onChange: (e) => updateItem(idx, "quantity", e.target.value),
                  className: `h-8 text-center text-xs sm:text-sm ${hasError && toNum(item.quantity) <= 0 ? "border-destructive" : ""}`,
                  min: "0.01",
                  step: "0.01"
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-28 sm:w-36", children: /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  placeholder: "ราคา",
                  value: item.amount,
                  onChange: (e) => updateItem(idx, "amount", e.target.value),
                  className: `h-8 text-center text-xs sm:text-sm ${hasError && toNum(item.amount) <= 0 ? "border-destructive" : ""}`,
                  min: "0.01",
                  step: "0.01"
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-center w-28 sm:w-32 text-xs sm:text-sm font-medium", children: total > 0 ? total.toLocaleString("th-TH") : "0" }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-center w-16 sm:w-20", children: /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  onClick: () => removeItem(idx),
                  className: "text-destructive hover:bg-destructive/10 h-8 w-8 p-0",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4" })
                }
              ) })
            ] }, idx);
          }) })
        ] }) }),
        items.length === 0 && /* @__PURE__ */ jsx(Empty, { children: /* @__PURE__ */ jsxs(EmptyHeader, { children: [
          /* @__PURE__ */ jsx(EmptyMedia, { variant: "icon", children: /* @__PURE__ */ jsx(Package, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsx(EmptyTitle, { children: "ยังไม่มีรายการสินค้า" }),
          /* @__PURE__ */ jsx(EmptyDescription, { children: 'คลิกปุ่ม "เพิ่มรายการ" เพื่อเพิ่มรายการสินค้าที่ต้องการขอซื้อ' })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(Separator, {}),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center sm:text-left", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm sm:text-base block sm:inline", children: "รวมเป็นเงินจำนวน : " }),
          /* @__PURE__ */ jsxs("span", { className: "text-xl sm:text-lg font-bold text-primary block sm:inline mt-1 sm:mt-0", children: [
            grandTotal(items).toLocaleString("th-TH"),
            " บาท"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            onClick: showConfirmation,
            disabled: saving || !isFormValid(),
            variant: "primary",
            className: "font-normal w-full sm:w-auto",
            children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "กำลังบันทึก..." }),
              /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "บันทึก..." })
            ] }) : "สร้างใบขอซื้อ"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Dialog, { open: showConfirmModal, onOpenChange: setShowConfirmModal, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto", showCloseButton: false, children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-6 h-6" }),
          "ยืนยันการสร้างใบขอซื้อ"
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "กรุณาตรวจสอบข้อมูลก่อนยืนยันการสร้างใบขอซื้อ" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 sm:space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-muted rounded-lg p-3 sm:p-4", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-3 text-sm sm:text-base", children: "ข้อมูลผู้ขอซื้อ" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm text-muted-foreground", children: "วันที่ขอซื้อ:" }),
              /* @__PURE__ */ jsx("p", { className: "font-medium text-sm sm:text-base", children: selectedDate ? selectedDate.toLocaleDateString("th-TH") : "ยังไม่เลือกวันที่" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm text-muted-foreground", children: "ชื่อผู้ขอซื้อ:" }),
              /* @__PURE__ */ jsx("p", { className: "font-medium text-sm sm:text-base", children: requester })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-semibold mb-3 text-sm sm:text-base", children: [
            "รายการสินค้า (",
            items.length,
            " รายการ)"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto max-h-60", children: /* @__PURE__ */ jsxs(Table, { className: "min-w-[600px] sm:min-w-full", children: [
            /* @__PURE__ */ jsx(TableHeader, { className: "sticky top-0 bg-background", children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { className: "w-16 text-center text-xs sm:text-sm", children: "ลำดับ" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-auto min-w-[150px] sm:min-w-[200px] text-xs sm:text-sm", children: "รายการ" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-32 sm:w-40 text-xs sm:text-sm", children: "วันที่ต้องการรับ" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-20 sm:w-28 text-center text-xs sm:text-sm", children: "จำนวน" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-24 sm:w-36 text-center text-xs sm:text-sm", children: "ราคา" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-24 sm:w-32 text-center text-xs sm:text-sm", children: "รวม" })
            ] }) }),
            /* @__PURE__ */ jsx(TableBody, { children: items.map((item, idx) => /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "w-16 text-center text-xs sm:text-sm", children: item.no }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-auto min-w-[150px] sm:min-w-[200px] max-w-xs truncate text-xs sm:text-sm", title: item.description, children: item.description }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-32 sm:w-40 text-xs sm:text-sm", children: item.receivedDate ? new Date(item.receivedDate).toLocaleDateString("th-TH") : "-" }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-20 sm:w-28 text-center text-xs sm:text-sm", children: toNum(item.quantity).toLocaleString("th-TH") }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-24 sm:w-36 text-center text-xs sm:text-sm", children: toNum(item.amount).toLocaleString("th-TH") }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-24 sm:w-32 text-center font-medium text-xs sm:text-sm", children: (toNum(item.quantity) * toNum(item.amount)).toLocaleString("th-TH") })
            ] }, idx)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-primary/10 rounded-lg p-3 sm:p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm sm:text-base font-semibold", children: "รวมเป็นเงินทั้งสิ้น:" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xl sm:text-lg font-bold text-primary", children: [
            grandTotal(items).toLocaleString("th-TH"),
            " บาท"
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "flex-col sm:flex-row gap-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: cancelCreate,
            disabled: saving,
            className: "w-full sm:w-auto",
            children: "ยกเลิก"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: confirmCreate,
            disabled: saving,
            variant: "primary",
            className: "w-full sm:w-auto",
            children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "กำลังสร้างใบขอซื้อ..." }),
              /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "กำลังสร้าง..." })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "ยืนยันและส่งขออนุมัติ" }),
              /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "ยืนยันและส่ง" })
            ] })
          }
        )
      ] })
    ] }) })
  ] });
}

const $$Create = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "CreateOrderPage", CreateOrderPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/Bederly/po-app/src/components/po/CreateOrderPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/Bederly/po-app/src/pages/orders/create.astro", void 0);

const $$file = "C:/Projects/Astro/Bederly/po-app/src/pages/orders/create.astro";
const $$url = "/orders/create";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Create,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
