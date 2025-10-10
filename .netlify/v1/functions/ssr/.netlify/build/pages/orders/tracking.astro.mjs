import { d as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_BP4slHKI.mjs';
import 'kleur/colors';
import { u as useUser, l as useRole, m as useIsLoading, x as useOrders, y as useOrdersLoading, z as useOrdersError, g as getDisplayOrderNumber, D as DropdownMenu, e as DropdownMenuTrigger, f as DropdownMenuContent, h as DropdownMenuLabel, i as DropdownMenuSeparator, k as DropdownMenuItem, C as Card, t as CardContent, B as Badge, w as Separator, $ as $$MainLayout } from '../../chunks/card_0XYoxqwD.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import React__default, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { e as cn, A as Alert, a as AlertDescription, B as Button, b as AlertIcon, c as AlertTitle, I as Input } from '../../chunks/alert_JioKFGew.mjs';
import { approveOrder } from '../../chunks/poApi_BqdytYgU.mjs';
import { D as DatePickerPresets } from '../../chunks/date-picker-presets_6zJ_WFdU.mjs';
import { parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { RefreshCw, AlertCircle, FileText, Search, Filter, LayoutGrid, Table2, Eye, CheckCircle, XCircle, Tag, ChevronLeft, ChevronRight, Package, Truck, Clock, ShoppingCart } from 'lucide-react';
import { RiInformationFill, RiSpam3Fill, RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from '../../chunks/dialog_BuSOmAmi.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from '../../chunks/select_DOMUTCC4.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from '../../chunks/table_Xu5j_Ieu.mjs';
import { S as ScrollArea, a as ScrollBar } from '../../chunks/scroll-area_BjEhz3jP.mjs';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { E as Empty, a as EmptyHeader, b as EmptyMedia, c as EmptyTitle, d as EmptyDescription, e as EmptyContent } from '../../chunks/empty_aUNL12Sy.mjs';
export { renderers } from '../../renderers.mjs';

function ItemGroup({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "list",
      "data-slot": "item-group",
      className: cn("group/item-group flex flex-col", className),
      ...props
    }
  );
}
const itemVariants = cva(
  "group/item flex items-center border border-transparent text-sm rounded-md transition-colors [a]:hover:bg-accent/50 [a]:transition-colors duration-100 flex-wrap outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50"
      },
      size: {
        default: "p-4 gap-4 ",
        sm: "py-3 px-4 gap-2.5"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Item({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "div";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "item",
      "data-variant": variant,
      "data-size": size,
      className: cn(itemVariants({ variant, size, className })),
      ...props
    }
  );
}
const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-8 border rounded-sm bg-muted [&_svg:not([class*='size-'])]:size-4",
        image: "size-10 rounded-sm overflow-hidden [&_img]:size-full [&_img]:object-cover"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function ItemMedia({
  className,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "item-media",
      "data-variant": variant,
      className: cn(itemMediaVariants({ variant, className })),
      ...props
    }
  );
}
function ItemContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "item-content",
      className: cn(
        "flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none",
        className
      ),
      ...props
    }
  );
}
function ItemTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "item-title",
      className: cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium",
        className
      ),
      ...props
    }
  );
}
function ItemActions({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "item-actions",
      className: cn("flex items-center gap-2", className),
      ...props
    }
  );
}

const StepperContext = createContext(void 0);
const StepItemContext = createContext(void 0);
function useStepper() {
  const ctx = useContext(StepperContext);
  if (!ctx) throw new Error("useStepper must be used within a Stepper");
  return ctx;
}
function useStepItem() {
  const ctx = useContext(StepItemContext);
  if (!ctx) throw new Error("useStepItem must be used within a StepperItem");
  return ctx;
}
function Stepper({
  defaultValue = 1,
  value,
  onValueChange,
  orientation = "horizontal",
  className,
  children,
  indicators = {},
  ...props
}) {
  const [activeStep, setActiveStep] = React.useState(defaultValue);
  const [triggerNodes, setTriggerNodes] = React.useState([]);
  const registerTrigger = React.useCallback((node) => {
    setTriggerNodes((prev) => {
      if (node && !prev.includes(node)) {
        return [...prev, node];
      } else if (!node && prev.includes(node)) {
        return prev.filter((n) => n !== node);
      } else {
        return prev;
      }
    });
  }, []);
  const handleSetActiveStep = React.useCallback(
    (step) => {
      if (value === void 0) {
        setActiveStep(step);
      }
      onValueChange?.(step);
    },
    [value, onValueChange]
  );
  const currentStep = value ?? activeStep;
  const focusTrigger = (idx) => {
    if (triggerNodes[idx]) triggerNodes[idx].focus();
  };
  const focusNext = (currentIdx) => focusTrigger((currentIdx + 1) % triggerNodes.length);
  const focusPrev = (currentIdx) => focusTrigger((currentIdx - 1 + triggerNodes.length) % triggerNodes.length);
  const focusFirst = () => focusTrigger(0);
  const focusLast = () => focusTrigger(triggerNodes.length - 1);
  const contextValue = React.useMemo(
    () => ({
      activeStep: currentStep,
      setActiveStep: handleSetActiveStep,
      stepsCount: React.Children.toArray(children).filter(
        (child) => React.isValidElement(child) && child.type.displayName === "StepperItem"
      ).length,
      orientation,
      registerTrigger,
      focusNext,
      focusPrev,
      focusFirst,
      focusLast,
      triggerNodes,
      indicators
    }),
    [currentStep, handleSetActiveStep, children, orientation, registerTrigger, triggerNodes]
  );
  return /* @__PURE__ */ jsx(StepperContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx(
    "div",
    {
      role: "tablist",
      "aria-orientation": orientation,
      "data-slot": "stepper",
      className: cn("w-full", className),
      "data-orientation": orientation,
      ...props,
      children
    }
  ) });
}
function StepperItem({
  step,
  completed = false,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}) {
  const { activeStep } = useStepper();
  const state = completed || step < activeStep ? "completed" : activeStep === step ? "active" : "inactive";
  const isLoading = loading && step === activeStep;
  return /* @__PURE__ */ jsx(StepItemContext.Provider, { value: { step, state, isDisabled: disabled, isLoading }, children: /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "stepper-item",
      className: cn(
        "group/step flex items-center justify-center group-data-[orientation=horizontal]/stepper-nav:flex-row group-data-[orientation=vertical]/stepper-nav:flex-col not-last:flex-1",
        className
      ),
      "data-state": state,
      ...isLoading ? { "data-loading": true } : {},
      ...props,
      children
    }
  ) });
}
function StepperTrigger({ asChild = false, className, children, tabIndex, ...props }) {
  const { state, isLoading } = useStepItem();
  const stepperCtx = useStepper();
  const { setActiveStep, activeStep, registerTrigger, triggerNodes, focusNext, focusPrev, focusFirst, focusLast } = stepperCtx;
  const { step, isDisabled } = useStepItem();
  const isSelected = activeStep === step;
  const id = `stepper-tab-${step}`;
  const panelId = `stepper-panel-${step}`;
  const btnRef = React.useRef(null);
  React.useEffect(() => {
    if (btnRef.current) {
      registerTrigger(btnRef.current);
    }
  }, [btnRef.current]);
  const myIdx = React.useMemo(
    () => triggerNodes.findIndex((n) => n === btnRef.current),
    [triggerNodes, btnRef.current]
  );
  const handleKeyDown = (e) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        if (myIdx !== -1 && focusNext) focusNext(myIdx);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        if (myIdx !== -1 && focusPrev) focusPrev(myIdx);
        break;
      case "Home":
        e.preventDefault();
        if (focusFirst) focusFirst();
        break;
      case "End":
        e.preventDefault();
        if (focusLast) focusLast();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        setActiveStep(step);
        break;
    }
  };
  if (asChild) {
    return /* @__PURE__ */ jsx("span", { "data-slot": "stepper-trigger", "data-state": state, className, children });
  }
  return /* @__PURE__ */ jsx(
    "button",
    {
      ref: btnRef,
      role: "tab",
      id,
      "aria-selected": isSelected,
      "aria-controls": panelId,
      tabIndex: typeof tabIndex === "number" ? tabIndex : isSelected ? 0 : -1,
      "data-slot": "stepper-trigger",
      "data-state": state,
      "data-loading": isLoading,
      className: cn(
        "cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center gap-3 rounded-full outline-none focus-visible:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-60",
        className
      ),
      onClick: () => setActiveStep(step),
      onKeyDown: handleKeyDown,
      disabled: isDisabled,
      ...props,
      children
    }
  );
}
function StepperIndicator({ children, className }) {
  const { state, isLoading } = useStepItem();
  const { indicators } = useStepper();
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "stepper-indicator",
      "data-state": state,
      className: cn(
        "relative flex items-center overflow-hidden justify-center size-6 shrink-0 border-background bg-accent text-accent-foreground rounded-full text-xs data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
        className
      ),
      children: /* @__PURE__ */ jsx("div", { className: "absolute", children: indicators && (isLoading && indicators.loading || state === "completed" && indicators.completed || state === "active" && indicators.active || state === "inactive" && indicators.inactive) ? isLoading && indicators.loading || state === "completed" && indicators.completed || state === "active" && indicators.active || state === "inactive" && indicators.inactive : children })
    }
  );
}
function StepperSeparator({ className }) {
  const { state } = useStepItem();
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "stepper-separator",
      "data-state": state,
      className: cn(
        "m-0.5 rounded-full bg-muted group-data-[orientation=vertical]/stepper-nav:h-12 group-data-[orientation=vertical]/stepper-nav:w-0.5 group-data-[orientation=horizontal]/stepper-nav:h-0.5 group-data-[orientation=horizontal]/stepper-nav:flex-1",
        className
      )
    }
  );
}
function StepperTitle({ children, className }) {
  const { state } = useStepItem();
  return /* @__PURE__ */ jsx("h3", { "data-slot": "stepper-title", "data-state": state, className: cn("text-sm font-medium leading-none", className), children });
}
function StepperNav({ children, className }) {
  const { activeStep, orientation } = useStepper();
  return /* @__PURE__ */ jsx(
    "nav",
    {
      "data-slot": "stepper-nav",
      "data-state": activeStep,
      "data-orientation": orientation,
      className: cn(
        "group/stepper-nav inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
        className
      ),
      children
    }
  );
}

function TrackingPage() {
  useUser();
  const role = useRole();
  const authLoading = useIsLoading();
  const orders = useOrders();
  const loading = useOrdersLoading();
  const err = useOrdersError();
  const [filteredRows, setFilteredRows] = useState([]);
  const [processingOrders, setProcessingOrders] = useState(/* @__PURE__ */ new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState(void 0);
  const [viewMode, setViewMode] = useState("card");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [alertState, setAlertState] = useState({
    show: false,
    type: "info",
    title: "",
    description: ""
  });
  const rows = useMemo(() => {
    return orders.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      date: order.date,
      requesterName: order.requesterName || "",
      requesterUid: order.requesterUid,
      total: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items || [],
      itemsCategories: order.itemsCategories || {},
      itemsStatuses: order.itemsStatuses || {}
    }));
  }, [orders]);
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#order-")) {
      const orderId = hash.replace("#order-", "");
      if (!loading && filteredRows.length > 0) {
        setTimeout(() => {
          const element = document.getElementById(`order-${orderId}`);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
            element.classList.add("ring-2", "ring-primary", "ring-offset-2", "transition-all", "duration-300");
            setTimeout(() => {
              element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
            }, 3e3);
            window.history.replaceState(null, "", window.location.pathname);
          }
        }, 500);
      }
    }
  }, [loading, filteredRows]);
  useEffect(() => {
    let filtered = rows;
    if (customDateRange) {
      const range = customDateRange;
      if (range.from) {
        filtered = filtered.filter((order) => {
          try {
            const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : order.date ? parseISO(order.date) : null;
            if (!orderDate) return false;
            const from = startOfDay(range.from);
            const to = range.to ? endOfDay(range.to) : endOfDay(range.from);
            return isWithinInterval(orderDate, { start: from, end: to });
          } catch (error) {
            console.error("Date filter error:", error);
            return false;
          }
        });
      }
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderNumber = order.orderNo ? getDisplayOrderNumber({
          orderNo: order.orderNo,
          date: order.date || order.createdAt?.toDate?.()?.toISOString().split("T")[0] || ""
        }).toLowerCase() : "";
        return order.requesterName.toLowerCase().includes(searchLower) || order.orderNo.toString().includes(searchTerm) || order.id.toLowerCase().includes(searchLower) || orderNumber.includes(searchLower);
      });
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }
    setFilteredRows(filtered);
    setCurrentPage(1);
  }, [rows, searchTerm, statusFilter, customDateRange]);
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
  const showApprovalModal = (orderId, approved, orderNo, requesterName) => {
    setConfirmData({
      orderId,
      approved,
      orderNo,
      requesterName
    });
    setShowConfirmModal(true);
  };
  const handleApproval = async () => {
    if (!confirmData) return;
    const { orderId, approved } = confirmData;
    const action = approved ? "อนุมัติ" : "ไม่อนุมัติ";
    try {
      setProcessingOrders((prev) => new Set(prev).add(orderId));
      setShowConfirmModal(false);
      await approveOrder(orderId, approved);
      showAlert(`${action}ใบขอซื้อเรียบร้อยแล้ว`, "success");
    } catch (error) {
      const errorMessage = error?.message || "";
      const isPermissionError = errorMessage.includes("permission") || errorMessage.includes("insufficient") || errorMessage.includes("Missing") || errorMessage.includes("FirebaseError");
      if (isPermissionError) {
        setTimeout(() => {
          window.location.reload();
        }, 1e3);
        showAlert(`${action}สำเร็จแล้ว กำลังอัปเดตข้อมูล`, "success");
      } else {
        showAlert(`เกิดข้อผิดพลาดใน${action}`, "error", errorMessage);
      }
    } finally {
      setProcessingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      setConfirmData(null);
    }
  };
  const cancelApproval = () => {
    setShowConfirmModal(false);
    setConfirmData(null);
  };
  const getItemCategory = (order, index) => {
    const fromMap = order.itemsCategories?.[index.toString()];
    if (fromMap) return fromMap;
    const item = order.items?.[index];
    const category = item?.category || item?.itemType || "วัตถุดิบ";
    return category;
  };
  const getItemStatus = (order, index) => {
    const fromMap = order.itemsStatuses?.[index.toString()];
    if (fromMap) return fromMap;
    const item = order.items?.[index];
    const status = item?.itemStatus || "รอดำเนินการ";
    return status;
  };
  const paginatedRows = useMemo(
    () => filteredRows.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [filteredRows, currentPage, itemsPerPage]
  );
  const totalPages = useMemo(
    () => Math.ceil(filteredRows.length / itemsPerPage),
    [filteredRows.length, itemsPerPage]
  );
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(Number(newItemsPerPage));
    setCurrentPage(1);
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, customDateRange]);
  if (authLoading || loading) {
    return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(RefreshCw, { className: "h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" }) }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground", children: "กำลังโหลดข้อมูล..." })
    ] }) });
  }
  if (err) {
    return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold", children: "เกิดข้อผิดพลาดในการโหลดข้อมูล" }),
        /* @__PURE__ */ jsx("div", { className: "text-sm", children: err })
      ] })
    ] }) });
  }
  if (rows.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs(Empty, { children: [
      /* @__PURE__ */ jsxs(EmptyHeader, { children: [
        /* @__PURE__ */ jsx(EmptyMedia, { variant: "icon", children: /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6" }) }),
        /* @__PURE__ */ jsx(EmptyTitle, { children: role === "employee" ? "ขณะนี้คุณยังไม่มีรายการใบขอซื้อ" : "ขณะนี้ยังไม่มีใบขอซื้อในระบบ" }),
        /* @__PURE__ */ jsx(EmptyDescription, { children: role === "employee" ? "สามารถเริ่มสร้างใบขอซื้อแรกของคุณได้เลย!" : "โปรดรอรายการใบขอซื้อจากผู้ใช้งาน หรือสร้างใบขอซื้อด้วยตนเอง" })
      ] }),
      role === "employee" && /* @__PURE__ */ jsx(EmptyContent, { children: /* @__PURE__ */ jsx(
        Button,
        {
          asChild: true,
          variant: "primary",
          className: "w-full sm:w-auto",
          children: /* @__PURE__ */ jsx("a", { href: "/orders/create", children: "สร้างใบขอซื้อ" })
        }
      ) })
    ] }) });
  }
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
      /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6 sm:w-8 sm:h-8 text-[#2b9ccc]" }),
      /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: role === "employee" ? "ติดตามสถานะใบขอซื้อ" : role === "supervisor" ? "ติดตามและอนุมัติใบขอซื้อ" : "ติดตามสถานะใบขอซื้อทั้งหมด" }),
      /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: role === "employee" ? "ติดตามสถานะ" : role === "supervisor" ? "ติดตาม/อนุมัติ" : "ติดตาม" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4 sm:mb-6 space-y-3 sm:space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1 w-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-[240px]", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "text",
                placeholder: "ค้นหาเลขใบขอซื้อหรือชื่อผู้ขอซื้อ",
                className: "pl-10",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full sm:w-auto", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "สถานะทั้งหมด" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "สถานะทั้งหมด" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "รออนุมัติ" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "approved", children: "อนุมัติแล้ว" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "rejected", children: "ไม่อนุมัติ" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "in_progress", children: "กำลังดำเนินการ" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "delivered", children: "ได้รับแล้ว" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            DatePickerPresets,
            {
              date: customDateRange,
              onDateChange: (date) => setCustomDateRange(date),
              placeholder: "ช่วงวันที่",
              className: "w-full sm:w-auto",
              numberOfMonths: 2
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full sm:w-auto", children: [
            /* @__PURE__ */ jsx(Filter, { className: "h-4 w-4 mr-2" }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "มุมมอง" }),
            /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "แสดง" })
          ] }) }),
          /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
            /* @__PURE__ */ jsx(DropdownMenuLabel, { children: "เลือกมุมมอง" }),
            /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setViewMode("card"), children: [
              /* @__PURE__ */ jsx(LayoutGrid, { className: "h-4 w-4 mr-2" }),
              "แบบการ์ด"
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setViewMode("table"), children: [
              /* @__PURE__ */ jsx(Table2, { className: "h-4 w-4 mr-2" }),
              "แบบตาราง"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-0", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "แสดง ",
          filteredRows.length,
          " รายการจาก ",
          rows.length,
          " รายการทั้งหมด"
        ] }),
        totalPages > 1 && /* @__PURE__ */ jsxs("span", { children: [
          "หน้า ",
          currentPage,
          " จาก ",
          totalPages
        ] })
      ] })
    ] }),
    filteredRows.length === 0 ? /* @__PURE__ */ jsx(Empty, { children: /* @__PURE__ */ jsxs(EmptyHeader, { children: [
      /* @__PURE__ */ jsx(EmptyMedia, { variant: "icon", children: /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6" }) }),
      /* @__PURE__ */ jsx(EmptyTitle, { children: "ไม่พบข้อมูล" }),
      /* @__PURE__ */ jsx(EmptyDescription, { children: searchTerm || statusFilter !== "all" ? "ลองปรับเงื่อนไขการค้นหาหรือกรอง" : "ยังไม่มีใบขอซื้อในระบบ" })
    ] }) }) : viewMode === "table" ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(ScrollArea, { className: "h-[400px] sm:h-[500px] md:h-[600px]", children: [
      /* @__PURE__ */ jsxs(Table, { className: "min-w-[800px]", children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "หมายเลขใบขอซื้อ" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "ผู้ขอซื้อ" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "วันที่" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "ยอดรวม" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "สถานะ" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs sm:text-sm", children: "การดำเนินการ" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: paginatedRows.map((order) => /* @__PURE__ */ jsxs(TableRow, { id: `order-${order.id}`, children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium text-xs sm:text-sm", children: getDisplayOrderNumber(order) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs sm:text-sm", children: order.requesterName }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs sm:text-sm", children: order.date }),
          /* @__PURE__ */ jsxs(TableCell, { className: "tabular-nums text-xs sm:text-sm", children: [
            order.total.toLocaleString("th-TH"),
            " บาท"
          ] }),
          /* @__PURE__ */ jsx(TableCell, { children: getStatusBadge(order.status) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "text-xs w-full sm:w-auto",
                onClick: () => {
                  import('../../chunks/client_BUDSSnj2.mjs').then(({ navigate }) => navigate(`/orders/${order.id}`)).catch(() => {
                    window.location.href = `/orders/${order.id}`;
                  });
                },
                children: [
                  /* @__PURE__ */ jsx(Eye, { className: "h-3 w-3 sm:h-4 sm:w-4 mr-1" }),
                  /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "ดูรายละเอียด" }),
                  /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "ดู" })
                ]
              }
            ),
            role === "supervisor" && order.status === "pending" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  onClick: () => showApprovalModal(order.id, true, order.orderNo, order.requesterName),
                  disabled: processingOrders.has(order.id),
                  size: "sm",
                  className: "bg-green-600 hover:bg-green-700 text-white text-xs w-full sm:w-auto",
                  children: [
                    processingOrders.has(order.id) ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3 mr-1 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                    "อนุมัติ"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  onClick: () => showApprovalModal(order.id, false, order.orderNo, order.requesterName),
                  disabled: processingOrders.has(order.id),
                  size: "sm",
                  variant: "destructive",
                  className: "text-xs w-full sm:w-auto",
                  children: [
                    processingOrders.has(order.id) ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3 mr-1 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3 mr-1" }),
                    "ไม่อนุมัติ"
                  ]
                }
              )
            ] })
          ] }) })
        ] }, order.id)) })
      ] }),
      /* @__PURE__ */ jsx(ScrollBar, { orientation: "horizontal" })
    ] }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-4 sm:space-y-6", children: paginatedRows.map((order) => /* @__PURE__ */ jsx(Card, { id: `order-${order.id}`, className: "shadow-lg bg-card border-border", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 sm:p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 w-full", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-base sm:text-lg font-bold", children: getDisplayOrderNumber(order) }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              "ชื่อผู้ขอ: ",
              order.requesterName
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "วันที่: ",
              order.date
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
            "สร้างเมื่อ: ",
            order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString("th-TH", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            }) : "—"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-left sm:text-right w-full sm:w-auto", children: /* @__PURE__ */ jsx("div", { className: "mb-2 sm:mb-3", children: getStatusBadge(order.status) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-3 sm:mb-4", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-xs sm:text-sm font-bold mb-2 sm:mb-3", children: "ขั้นตอนการดำเนินงาน" }),
        renderProgressFlow(order.status)
      ] }),
      order.items && order.items.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-xs sm:text-sm font-bold mb-3 flex items-center gap-2", children: [
          "รายการสินค้า (",
          order.items.length,
          " รายการ)"
        ] }),
        /* @__PURE__ */ jsx(ItemGroup, { className: "space-y-3", children: order.items.map((item, idx) => {
          const category = getItemCategory(order, idx);
          const itemStatus = getItemStatus(order, idx);
          return /* @__PURE__ */ jsx(React__default.Fragment, { children: /* @__PURE__ */ jsxs(Item, { variant: "outline", size: "default", className: "bg-muted/30 border-border", children: [
            /* @__PURE__ */ jsx(ItemMedia, { variant: "icon", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground", children: idx + 1 }) }),
            /* @__PURE__ */ jsxs(ItemContent, { children: [
              /* @__PURE__ */ jsx(ItemTitle, { className: "text-base", children: item.description }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsxs(Badge, { variant: "secondary", size: "sm", className: "flex items-center gap-1.5 bg-secondary/80 text-secondary-foreground border border-border", children: [
                    /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4" }),
                    category
                  ] }),
                  /* @__PURE__ */ jsxs(
                    Badge,
                    {
                      variant: itemStatus === "รอดำเนินการ" ? "outline" : "secondary",
                      size: "sm",
                      className: "flex items-center gap-1.5 bg-secondary/80 text-secondary-foreground border border-border",
                      children: [
                        "สถานะ : ",
                        itemStatus
                      ]
                    }
                  )
                ] }),
                item.receivedDate && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
                  "ต้องการรับ: ",
                  item.receivedDate
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(ItemActions, { children: /* @__PURE__ */ jsxs("div", { className: "text-right text-sm text-muted-foreground space-y-1.5", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                "จำนวน: ",
                item.quantity?.toLocaleString("th-TH")
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                "ราคา: ",
                item.amount?.toLocaleString("th-TH"),
                " บาท"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "font-medium text-foreground", children: [
                "รวม: ",
                item.lineTotal?.toLocaleString("th-TH"),
                " บาท"
              ] })
            ] }) })
          ] }) }, idx);
        }) }),
        /* @__PURE__ */ jsx(Separator, { className: "my-2 sm:my-3" }),
        /* @__PURE__ */ jsx("h4", { className: "text-xs sm:text-sm font-bold mb-2 flex items-center gap-2", children: "สรุปรายการ" }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 sm:mt-3 flex justify-start sm:justify-end", children: /* @__PURE__ */ jsxs("div", { className: "text-xs sm:text-sm text-muted-foreground text-left sm:text-right w-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-1", children: [
            /* @__PURE__ */ jsx("span", { children: "จำนวนรายการทั้งหมด : " }),
            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              order.items.length,
              " รายการ"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { children: "ยอดรวมทั้งสิ้น : " }),
            /* @__PURE__ */ jsxs("span", { className: "text-base sm:text-lg font-bold text-primary", children: [
              order.total.toLocaleString("th-TH"),
              " บาท"
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "w-full sm:w-auto text-xs border-border bg-background hover:bg-accent",
              onClick: () => {
                import('../../chunks/client_BUDSSnj2.mjs').then(({ navigate }) => navigate(`/orders/${order.id}`)).catch(() => {
                  window.location.href = `/orders/${order.id}`;
                });
              },
              children: [
                /* @__PURE__ */ jsx(Eye, { className: "h-3 w-3 sm:h-4 sm:w-4 mr-1" }),
                "ดูรายละเอียด"
              ]
            }
          ),
          role === "supervisor" && order.status === "pending" && /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-2 w-full sm:w-auto", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                onClick: () => showApprovalModal(order.id, false, order.orderNo, order.requesterName),
                disabled: processingOrders.has(order.id),
                size: "sm",
                variant: "destructive",
                className: "font-normal text-xs w-full sm:w-auto border-border",
                children: [
                  processingOrders.has(order.id) ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3 mr-1 animate-spin" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3 mr-1" }),
                  "ไม่อนุมัติ"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                onClick: () => showApprovalModal(order.id, true, order.orderNo, order.requesterName),
                disabled: processingOrders.has(order.id),
                size: "sm",
                className: "bg-green-600 hover:bg-green-700 text-white font-normal text-xs w-full sm:w-auto border border-green-600",
                children: [
                  processingOrders.has(order.id) ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3 mr-1 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                  "อนุมัติ"
                ]
              }
            )
          ] })
        ] })
      ] })
    ] }) }, order.id)) }),
    filteredRows.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm text-muted-foreground", children: "แสดง" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: itemsPerPage,
            onChange: (e) => handleItemsPerPageChange(e.target.value),
            className: "border border-input bg-background rounded-md px-2 py-1 text-xs sm:text-sm",
            children: [
              /* @__PURE__ */ jsx("option", { value: 5, children: "5" }),
              /* @__PURE__ */ jsx("option", { value: 10, children: "10" }),
              /* @__PURE__ */ jsx("option", { value: 20, children: "20" }),
              /* @__PURE__ */ jsx("option", { value: 50, children: "50" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-sm text-muted-foreground", children: "รายการต่อหน้า" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs sm:text-sm text-muted-foreground", children: [
        "แสดง ",
        (currentPage - 1) * itemsPerPage + 1,
        " - ",
        Math.min(currentPage * itemsPerPage, filteredRows.length),
        " จาก ",
        filteredRows.length,
        " รายการ"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            className: "text-xs h-7 sm:h-8",
            onClick: () => handlePageChange(currentPage - 1),
            disabled: currentPage === 1,
            children: [
              /* @__PURE__ */ jsx(ChevronLeft, { className: "w-3 h-3 sm:w-4 sm:h-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "ก่อนหน้า" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-0.5 sm:gap-1", children: (() => {
          const pages = [];
          const maxVisiblePages = 5;
          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
          if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
          }
          if (startPage > 1) {
            pages.push(
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: currentPage === 1 ? "primary" : "outline",
                  size: "sm",
                  onClick: () => handlePageChange(1),
                  className: "w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm",
                  children: "1"
                },
                1
              )
            );
            if (startPage > 2) {
              pages.push(
                /* @__PURE__ */ jsx("span", { className: "px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground", children: "..." }, "ellipsis1")
              );
            }
          }
          for (let i = startPage; i <= endPage; i++) {
            pages.push(
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: currentPage === i ? "primary" : "outline",
                  size: "sm",
                  onClick: () => handlePageChange(i),
                  className: "w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm",
                  children: i
                },
                i
              )
            );
          }
          if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
              pages.push(
                /* @__PURE__ */ jsx("span", { className: "px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground", children: "..." }, "ellipsis2")
              );
            }
            pages.push(
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: currentPage === totalPages ? "primary" : "outline",
                  size: "sm",
                  onClick: () => handlePageChange(totalPages),
                  className: "w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm",
                  children: totalPages
                },
                totalPages
              )
            );
          }
          return pages;
        })() }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            className: "text-xs h-7 sm:h-8",
            onClick: () => handlePageChange(currentPage + 1),
            disabled: currentPage === totalPages,
            children: [
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "ถัดไป" }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3 sm:w-4 sm:h-4" })
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: showConfirmModal, onOpenChange: setShowConfirmModal, children: /* @__PURE__ */ jsxs(DialogContent, { showCloseButton: false, className: "w-[95vw] max-w-md", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "flex items-center gap-2 text-base sm:text-lg", children: confirmData?.approved ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 sm:w-6 sm:h-6 text-green-500" }),
          "ยืนยันการอนุมัติ"
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(XCircle, { className: "w-5 h-5 sm:w-6 sm:h-6 text-red-500" }),
          "ยืนยันการไม่อนุมัติ"
        ] }) }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-sm sm:text-base", children: confirmData && /* @__PURE__ */ jsxs("span", { children: [
          "คุณต้องการ",
          confirmData.approved ? "อนุมัติ" : "ไม่อนุมัติ",
          "ใบขอซื้อนี้หรือไม่?"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "flex flex-col sm:flex-row gap-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: cancelApproval,
            disabled: processingOrders.has(confirmData?.orderId || ""),
            className: "font-normal w-full sm:w-auto text-sm",
            children: "ยกเลิก"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "destructive",
            onClick: handleApproval,
            disabled: processingOrders.has(confirmData?.orderId || ""),
            className: `w-full sm:w-auto text-sm ${confirmData?.approved ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}`,
            children: processingOrders.has(confirmData?.orderId || "") ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "กำลังดำเนินการ..." }),
              /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "กำลังทำงาน..." })
            ] }) : "ยืนยัน"
          }
        )
      ] })
    ] }) })
  ] });
}
function getStatusBadge(status) {
  switch (status) {
    case "pending":
      return /* @__PURE__ */ jsxs(Badge, { variant: "warning", appearance: "light", className: "inline-flex items-center gap-1 w-fit", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
        "รออนุมัติ"
      ] });
    case "approved":
      return /* @__PURE__ */ jsxs(Badge, { variant: "success", appearance: "light", className: "inline-flex items-center gap-1 w-fit", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
        "อนุมัติแล้ว"
      ] });
    case "rejected":
      return /* @__PURE__ */ jsxs(Badge, { variant: "destructive", appearance: "light", className: "inline-flex items-center gap-1 w-fit", children: [
        /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3" }),
        "ไม่อนุมัติ"
      ] });
    case "in_progress":
      return /* @__PURE__ */ jsxs(Badge, { variant: "info", appearance: "light", className: "inline-flex items-center gap-1 w-fit", children: [
        /* @__PURE__ */ jsx(Truck, { className: "w-3 h-3" }),
        "กำลังดำเนินการ"
      ] });
    case "delivered":
      return /* @__PURE__ */ jsxs(Badge, { variant: "success", appearance: "light", className: "inline-flex items-center gap-1 w-fit", children: [
        /* @__PURE__ */ jsx(Package, { className: "w-3 h-3" }),
        "ได้รับแล้ว"
      ] });
    default:
      return /* @__PURE__ */ jsxs(Badge, { variant: "secondary", appearance: "light", className: "inline-flex items-center gap-1 w-fit", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
        status
      ] });
  }
}
function renderProgressFlow(status) {
  const getCurrentStep = (orderStatus) => {
    switch (orderStatus) {
      case "pending":
        return 2;
      case "approved":
        return 3;
      case "in_progress":
        return 4;
      case "delivered":
        return 5;
      case "rejected":
        return 2;
      default:
        return 1;
    }
  };
  const steps = [
    { title: "ผู้ขอซื้อ", icon: FileText },
    { title: "หัวหน้าอนุมัติ", icon: CheckCircle },
    { title: "ฝ่ายจัดซื้อ", icon: ShoppingCart },
    { title: "ส่งมอบ", icon: Package }
  ];
  const currentStep = getCurrentStep(status);
  return /* @__PURE__ */ jsx(
    Stepper,
    {
      value: currentStep,
      orientation: "horizontal",
      className: "space-y-8 w-full",
      indicators: {
        completed: /* @__PURE__ */ jsx(CheckCircle, { className: "size-4" })
      },
      children: /* @__PURE__ */ jsx(StepperNav, { className: "gap-3 mb-15", children: steps.map((step, index) => {
        const stepNumber = index + 1;
        const isRejected = status === "rejected" && stepNumber === 2;
        return /* @__PURE__ */ jsxs(
          StepperItem,
          {
            step: stepNumber,
            completed: stepNumber < currentStep,
            className: "relative flex-1 items-start",
            children: [
              /* @__PURE__ */ jsxs(StepperTrigger, { className: "flex flex-col items-start justify-center gap-2.5 grow", asChild: true, children: [
                /* @__PURE__ */ jsx(StepperIndicator, { className: cn(
                  "size-8 border-2 flex items-center justify-center",
                  stepNumber < currentStep && "data-[state=completed]:text-white data-[state=completed]:bg-green-500",
                  stepNumber === currentStep && !isRejected && "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary",
                  isRejected && "data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:border-red-500",
                  stepNumber > currentStep && "data-[state=inactive]:bg-transparent data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground"
                ), children: /* @__PURE__ */ jsx(step.icon, { className: "size-4" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start gap-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-semibold uppercase text-muted-foreground", children: [
                    "ขั้นตอนที่ ",
                    stepNumber
                  ] }),
                  /* @__PURE__ */ jsx(StepperTitle, { className: "text-start text-base font-semibold group-data-[state=inactive]/step:text-muted-foreground", children: step.title }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    !isRejected && /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx(
                        Badge,
                        {
                          variant: "primary",
                          className: "hidden group-data-[state=active]/step:inline-flex",
                          children: "รอดำเนินการ"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        Badge,
                        {
                          variant: "success",
                          className: "hidden group-data-[state=completed]/step:inline-flex",
                          children: "เสร็จสิ้น"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        Badge,
                        {
                          variant: "secondary",
                          appearance: "outline",
                          className: "hidden group-data-[state=inactive]/step:inline-flex text-muted-foreground",
                          children: "รอคิว"
                        }
                      )
                    ] }),
                    isRejected && /* @__PURE__ */ jsx(
                      Badge,
                      {
                        variant: "destructive",
                        className: "inline-flex",
                        children: "ไม่อนุมัติ"
                      }
                    )
                  ] })
                ] })
              ] }),
              steps.length > index + 1 && /* @__PURE__ */ jsx(StepperSeparator, { className: cn(
                "absolute top-4 inset-x-0 start-9 m-0 group-data-[orientation=horizontal]/stepper-nav:w-[calc(100%-2rem)] group-data-[orientation=horizontal]/stepper-nav:flex-none",
                stepNumber < currentStep && "group-data-[state=completed]/step:bg-green-500",
                stepNumber === currentStep && !isRejected && "group-data-[state=active]/step:bg-primary",
                stepNumber > currentStep && "group-data-[state=inactive]/step:bg-muted"
              ) })
            ]
          },
          index
        );
      }) })
    }
  );
}

const $$Tracking = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E2A\u0E16\u0E32\u0E19\u0E30" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "TrackingPage", TrackingPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/Bederly/po-app/src/components/po/TrackingPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/Bederly/po-app/src/pages/orders/tracking.astro", void 0);

const $$file = "C:/Projects/Astro/Bederly/po-app/src/pages/orders/tracking.astro";
const $$url = "/orders/tracking";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Tracking,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
