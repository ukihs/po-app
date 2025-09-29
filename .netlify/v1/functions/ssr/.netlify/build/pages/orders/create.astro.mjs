import { d as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_7uJhlR4f.mjs';
import 'kleur/colors';
import { C as Card, a as CardContent, S as Separator, $ as $$MainLayout } from '../../chunks/card_HxY4Emac.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { b as cn, d as buttonVariants, B as Button, e as auth, I as Input } from '../../chunks/input_CuwRcyyb.mjs';
import { t as toNum, g as grandTotal, c as createOrder } from '../../chunks/poApi_BPoLA-4y.mjs';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, Package, Calendar as Calendar$1, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { T as Toaster, D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from '../../chunks/dialog_CFCMQlrt.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from '../../chunks/table_B5AV3It3.mjs';
import { L as Label } from '../../chunks/label_B4e7hkFR.mjs';
import { getDefaultClassNames, DayPicker } from 'react-day-picker';
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from '../../chunks/popover_DsyM45qf.mjs';
export { renderers } from '../../renderers.mjs';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();
  return /* @__PURE__ */ jsx(
    DayPicker,
    {
      showOutsideDays,
      className: cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      ),
      captionLayout,
      formatters: {
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters
      },
      classNames: {
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-popover inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label" ? "text-sm" : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames
      },
      components: {
        Root: ({ className: className2, rootRef, ...props2 }) => {
          return /* @__PURE__ */ jsx(
            "div",
            {
              "data-slot": "calendar",
              ref: rootRef,
              className: cn(className2),
              ...props2
            }
          );
        },
        Chevron: ({ className: className2, orientation, ...props2 }) => {
          if (orientation === "left") {
            return /* @__PURE__ */ jsx(ChevronLeftIcon, { className: cn("size-4", className2), ...props2 });
          }
          if (orientation === "right") {
            return /* @__PURE__ */ jsx(
              ChevronRightIcon,
              {
                className: cn("size-4", className2),
                ...props2
              }
            );
          }
          return /* @__PURE__ */ jsx(ChevronDownIcon, { className: cn("size-4", className2), ...props2 });
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props2 }) => {
          return /* @__PURE__ */ jsx("td", { ...props2, children: /* @__PURE__ */ jsx("div", { className: "flex size-(--cell-size) items-center justify-center text-center", children }) });
        },
        ...components
      },
      ...props
    }
  );
}
function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return /* @__PURE__ */ jsx(
    Button,
    {
      ref,
      variant: "ghost",
      size: "icon",
      "data-day": day.date.toLocaleDateString(),
      "data-selected-single": modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle,
      "data-range-start": modifiers.range_start,
      "data-range-end": modifiers.range_end,
      "data-range-middle": modifiers.range_middle,
      className: cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      ),
      ...props
    }
  );
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
        toast.error("กรุณาระบุรายละเอียดสินค้า");
      } else if (!newItem.receivedDate.trim()) {
        toast.error("กรุณาเลือกวันที่ต้องการรับ");
      } else if (toNum(newItem.quantity) <= 0) {
        toast.error("กรุณาระบุจำนวนที่ถูกต้อง");
      } else if (toNum(newItem.amount) <= 0) {
        toast.error("กรุณาระบุราคาที่ถูกต้อง");
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
      toast.error(getValidationMessage());
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
      toast.success("สร้างใบขอซื้อสำเร็จแล้ว");
      setRequester("");
      setItems([]);
      setSelectedDate(/* @__PURE__ */ new Date());
      setSubmitted(false);
    } catch (e) {
      toast.error(e?.message ?? "บันทึกใบสั่งซื้อไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };
  const cancelCreate = () => {
    setShowConfirmModal(false);
    setSaving(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsx(Toaster, {}),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold mb-2 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Package, { className: "w-8 h-8 text-[#2b9ccc]" }),
        "สร้างใบขอซื้อ"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "สร้างใบขอซื้อใหม่สำหรับการสั่งซื้อสินค้า" })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: showModal, onOpenChange: setShowModal, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[500px]", showCloseButton: false, children: [
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
          /* @__PURE__ */ jsxs(Popover, { children: [
            /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                className: cn(
                  "w-full justify-between text-left font-normal",
                  !selectedItemDate && "text-muted-foreground"
                ),
                children: [
                  selectedItemDate ? selectedItemDate.toLocaleDateString("th-TH") : "เลือกวันที่ต้องการรับ",
                  /* @__PURE__ */ jsx(Calendar$1, { className: "ml-auto h-4 w-4 opacity-50" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(
              Calendar,
              {
                mode: "single",
                selected: selectedItemDate,
                onSelect: setSelectedItemDate,
                captionLayout: "dropdown"
              }
            ) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
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
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: closeModal,
            className: "font-normal",
            children: "ยกเลิก"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: addItemFromModal,
            disabled: !isModalFormValid(),
            variant: "primary",
            className: "font-normal",
            children: "เพิ่มรายการ"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { className: "space-y-6", onSubmit: (e) => e.preventDefault(), children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-sm font-medium", children: "วันที่ขอซื้อ" }),
          /* @__PURE__ */ jsxs(Popover, { children: [
            /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                className: cn(
                  "w-full justify-between text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                ),
                children: [
                  selectedDate ? selectedDate.toLocaleDateString("th-TH") : "เลือกวันที่",
                  /* @__PURE__ */ jsx(Calendar$1, { className: "ml-auto h-4 w-4 opacity-50" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(
              Calendar,
              {
                mode: "single",
                selected: selectedDate,
                onSelect: setSelectedDate,
                captionLayout: "dropdown"
              }
            ) })
          ] })
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
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "รายการสินค้า" }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: openAddModal,
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
                "เพิ่มรายการ"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "overflow-x-auto", children: [
          /* @__PURE__ */ jsxs(Table, { className: "min-w-full", children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { className: "w-20 text-center", children: "ลำดับที่" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-auto min-w-[250px]", children: "รายการที่ขอซื้อ" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-40", children: "วันที่ต้องการรับ" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-28 text-center", children: "จำนวน" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-36 text-center", children: "จำนวนเงิน (บาท)" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-32 text-center", children: "รวม (บาท)" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-20 text-center", children: "จัดการ" })
            ] }) }),
            /* @__PURE__ */ jsx(TableBody, { children: items.map((item, idx) => {
              const total = toNum(item.quantity) * toNum(item.amount);
              const hasError = submitted && (!item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);
              return /* @__PURE__ */ jsxs(TableRow, { className: hasError ? "bg-destructive/10" : "", children: [
                /* @__PURE__ */ jsx(TableCell, { className: "text-center w-20", children: item.no }),
                /* @__PURE__ */ jsx(TableCell, { className: "w-auto min-w-[250px]", children: /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "text",
                    placeholder: "ระบุรายละเอียดสินค้า",
                    value: item.description,
                    onChange: (e) => updateItem(idx, "description", e.target.value),
                    className: `h-8 ${hasError && !item.description.trim() ? "border-destructive" : ""}`
                  }
                ) }),
                /* @__PURE__ */ jsx(TableCell, { className: "w-40", children: /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "date",
                    value: item.receivedDate,
                    onChange: (e) => updateItem(idx, "receivedDate", e.target.value),
                    className: "h-8"
                  }
                ) }),
                /* @__PURE__ */ jsx(TableCell, { className: "w-28", children: /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "number",
                    placeholder: "จำนวน",
                    value: item.quantity,
                    onChange: (e) => updateItem(idx, "quantity", e.target.value),
                    className: `h-8 text-center ${hasError && toNum(item.quantity) <= 0 ? "border-destructive" : ""}`,
                    min: "0.01",
                    step: "0.01"
                  }
                ) }),
                /* @__PURE__ */ jsx(TableCell, { className: "w-36", children: /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "number",
                    placeholder: "ราคา",
                    value: item.amount,
                    onChange: (e) => updateItem(idx, "amount", e.target.value),
                    className: `h-8 text-center ${hasError && toNum(item.amount) <= 0 ? "border-destructive" : ""}`,
                    min: "0.01",
                    step: "0.01"
                  }
                ) }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-center w-32", children: total > 0 ? total.toLocaleString("th-TH") : "0" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-center w-20", children: /* @__PURE__ */ jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "sm",
                    onClick: () => removeItem(idx),
                    className: "text-destructive hover:bg-destructive/10",
                    children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                  }
                ) })
              ] }, idx);
            }) })
          ] }),
          items.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
            /* @__PURE__ */ jsx("div", { className: "text-muted-foreground mb-4", children: /* @__PURE__ */ jsx(Package, { className: "mx-auto h-12 w-12" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-2", children: "ยังไม่มีรายการสินค้า" }),
            /* @__PURE__ */ jsx("p", { className: "font-normal text-muted-foreground mb-4", children: 'คลิกปุ่ม "เพิ่มรายการ" เพื่อเพิ่มรายการสินค้าที่ต้องการขอซื้อ' })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Separator, {}),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-lg", children: [
          /* @__PURE__ */ jsx("span", { className: "text-base", children: "รวมเป็นเงินจำนวน : " }),
          /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-primary", children: [
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
            className: "font-normal",
            children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }),
              "กำลังบันทึก..."
            ] }) : "สร้างใบขอซื้อ"
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx(Dialog, { open: showConfirmModal, onOpenChange: setShowConfirmModal, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-2xl", showCloseButton: false, children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-6 h-6" }),
          "ยืนยันการสร้างใบขอซื้อ"
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "กรุณาตรวจสอบข้อมูลก่อนยืนยันการสร้างใบขอซื้อ" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-muted rounded-lg p-4", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-3", children: "ข้อมูลผู้ขอซื้อ" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "วันที่ขอซื้อ:" }),
              /* @__PURE__ */ jsx("p", { className: "font-medium", children: selectedDate ? selectedDate.toLocaleDateString("th-TH") : "ยังไม่เลือกวันที่" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "ชื่อผู้ขอซื้อ:" }),
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
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto max-h-60 overflow-y-auto", children: /* @__PURE__ */ jsxs(Table, { className: "min-w-full", children: [
            /* @__PURE__ */ jsx(TableHeader, { className: "sticky top-0 bg-background", children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { className: "w-20 text-center", children: "ลำดับ" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-auto min-w-[200px]", children: "รายการ" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-40", children: "วันที่ต้องการรับ" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-28 text-center", children: "จำนวน" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-36 text-center", children: "ราคา" }),
              /* @__PURE__ */ jsx(TableHead, { className: "w-32 text-center", children: "รวม" })
            ] }) }),
            /* @__PURE__ */ jsx(TableBody, { children: items.map((item, idx) => /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { className: "w-20 text-center", children: item.no }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-auto min-w-[200px] max-w-xs truncate", title: item.description, children: item.description }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-40", children: item.receivedDate ? new Date(item.receivedDate).toLocaleDateString("th-TH") : "-" }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-28 text-center", children: toNum(item.quantity).toLocaleString("th-TH") }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-36 text-center", children: toNum(item.amount).toLocaleString("th-TH") }),
              /* @__PURE__ */ jsx(TableCell, { className: "w-32 text-center font-medium", children: (toNum(item.quantity) * toNum(item.amount)).toLocaleString("th-TH") })
            ] }, idx)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-primary/10 rounded-lg p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("span", { className: "text-base font-semibold", children: "รวมเป็นเงินทั้งสิ้น:" }),
          /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-primary", children: [
            grandTotal(items).toLocaleString("th-TH"),
            " บาท"
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: cancelCreate,
            disabled: saving,
            children: "ยกเลิก"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: confirmCreate,
            disabled: saving,
            variant: "primary",
            children: saving ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }),
              "กำลังสร้างใบขอซื้อ..."
            ] }) : "ยืนยันและส่งขออนุมัติ"
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
