import { d as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_CSazvNRn.mjs';
import 'kleur/colors';
import { S as Separator, $ as $$MainLayout } from '../../chunks/MainLayout_mOJIEv95.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { b as cn, s as subscribeAuthAndRole, f as db, B as Button } from '../../chunks/button_DlB-774j.mjs';
import { getDoc, doc, query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { a as generateOrderNumber, b as approveOrder } from '../../chunks/poApi_D3wEJ3wJ.mjs';
import { RefreshCw, AlertCircle, FileText, Tag, Activity, XCircle, CheckCircle, Package, Truck, Clock, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { T as Toaster, D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from '../../chunks/dialog_tgcavCM2.mjs';
import { C as Card, c as CardContent } from '../../chunks/card_REjXmj5-.mjs';
import { B as Badge } from '../../chunks/badge_D3xF9Gku.mjs';
import { A as Alert, a as AlertDescription } from '../../chunks/alert_CQFjLQA5.mjs';
export { renderers } from '../../renderers.mjs';

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
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [role, setRole] = useState(null);
  const [processingOrders, setProcessingOrders] = useState(/* @__PURE__ */ new Set());
  const [user, setUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  useEffect(() => {
    let offOrders;
    let offAuth;
    offAuth = subscribeAuthAndRole((authUser, userRole) => {
      if (!authUser) {
        window.location.href = "/login";
        return;
      }
      setUser(authUser);
      const detectRole = async () => {
        let detectedRole = userRole;
        if (!userRole || authUser.email?.includes("tanza") && userRole === "buyer") {
          try {
            const userDoc = await getDoc(doc(db, "users", authUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              detectedRole = userData.role;
            }
          } catch (error) {
            console.error("Error detecting role:", error);
          }
        }
        setRole(detectedRole);
        offOrders?.();
        let q;
        if (detectedRole === "buyer") {
          q = query(
            collection(db, "orders"),
            where("requesterUid", "==", authUser.uid),
            orderBy("createdAt", "desc")
          );
        } else if (detectedRole === "supervisor" || detectedRole === "procurement") {
          q = query(
            collection(db, "orders"),
            orderBy("createdAt", "desc")
          );
        } else {
          setLoading(false);
          setErr("ไม่พบ role ในระบบ กรุณาตรวจสอบการตั้งค่า role ใน Firestore");
          return;
        }
        offOrders = onSnapshot(
          q,
          (snap) => {
            const list = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                orderNo: data.orderNo || 0,
                date: data.date || "",
                requesterName: data.requesterName || "",
                requesterUid: data.requesterUid || "",
                total: Number(data.total || 0),
                status: data.status || "pending",
                createdAt: data.createdAt,
                items: data.items || [],
                itemsCategories: data.itemsCategories || {},
                itemsStatuses: data.itemsStatuses || {}
              };
            });
            setRows(list);
            setErr("");
            setLoading(false);
          },
          (e) => {
            console.error("Orders query error:", e);
            setErr(String(e?.message || e));
            setLoading(false);
          }
        );
      };
      detectRole();
    });
    return () => {
      offOrders?.();
      offAuth?.();
    };
  }, []);
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
      console.log(`กำลัง${action}ใบขอซื้อ...`, orderId);
      await approveOrder(orderId, approved);
      console.log(`${action}ใบขอซื้อเรียบร้อยแล้ว`);
      toast.success(`${action}ใบขอซื้อเรียบร้อยแล้ว`);
    } catch (error) {
      console.error("Error approving order:", error);
      const errorMessage = error?.message || "";
      const isPermissionError = errorMessage.includes("permission") || errorMessage.includes("insufficient") || errorMessage.includes("Missing") || errorMessage.includes("FirebaseError");
      if (isPermissionError) {
        console.warn("Permission warning occurred, checking if operation succeeded");
        setTimeout(() => {
          window.location.reload();
        }, 1e3);
        toast.success(`${action}สำเร็จแล้ว กำลังอัปเดตข้อมูล...`);
      } else {
        toast.error(`เกิดข้อผิดพลาดใน${action}: ${errorMessage}`);
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
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(RefreshCw, { className: "h-8 w-8 animate-spin text-[#6EC1E4]" }) }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground", children: "กำลังโหลดข้อมูล..." })
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
    return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
      /* @__PURE__ */ jsx(Toaster, {}),
      /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(FileText, { className: "w-12 h-12 text-muted-foreground" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold mb-2", children: role === "buyer" ? "คุณยังไม่มีใบขอซื้อ" : "ยังไม่มีใบขอซื้อในระบบ" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: role === "buyer" ? "เริ่มสร้างใบขอซื้อแรกได้เลย!" : "รอใบขอซื้อจากผู้ใช้งาน" }),
        role === "buyer" && /* @__PURE__ */ jsx(
          Button,
          {
            asChild: true,
            className: "bg-[#6EC1E4] hover:bg-[#2b9ccc]",
            children: /* @__PURE__ */ jsx("a", { href: "/orders/create", children: "สร้างใบขอซื้อ" })
          }
        )
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsx(Toaster, {}),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold mb-2 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-8 h-8 text-[#2b9ccc]" }),
        role === "buyer" ? "ติดตามสถานะใบขอซื้อ" : role === "supervisor" ? "ติดตามและอนุมัติใบขอซื้อ" : "ติดตามใบขอซื้อทั้งหมด"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: role === "supervisor" ? "หน้าจัดการตรวจสอบและอนุมัติใบขอซื้อทั้งหมดในระบบ" : role === "buyer" ? "ติดตามสถานะและความคืบหน้าของใบขอซื้อ" : "ติดตามใบขอซื้อทั้งหมดในระบบ" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children: rows.map((order) => /* @__PURE__ */ jsx(Card, { className: "shadow-lg", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold", children: generateOrderNumber(order.orderNo, order.date) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-sm text-muted-foreground mt-1", children: [
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
        /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("div", { className: "mb-3", children: getStatusBadge(order.status) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold mb-3", children: "ขั้นตอนการดำเนินงาน" }),
        renderProgressFlow(order.status)
      ] }),
      order.items && order.items.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-bold mb-2 flex items-center gap-2", children: [
          "รายการสินค้า (",
          order.items.length,
          " รายการ)"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: order.items.map((item, idx) => {
          const category = getItemCategory(order, idx);
          const itemStatus = getItemStatus(order, idx);
          return /* @__PURE__ */ jsx("div", { className: "bg-muted rounded-lg p-4 mb-4 border", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-2", children: /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
                "รายการที่ ",
                idx + 1,
                ' : "',
                item.description,
                '"'
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-sm", children: [
                  /* @__PURE__ */ jsx(Tag, { className: "w-3 h-3" }),
                  "ประเภท: ",
                  category
                ] }),
                /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 shadow-sm", children: [
                  /* @__PURE__ */ jsx(Activity, { className: "w-3 h-3" }),
                  "สถานะ: ",
                  itemStatus
                ] })
              ] }),
              item.receivedDate && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mb-1", children: [
                "ต้องการรับ: ",
                item.receivedDate
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-right min-w-[120px]", children: /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                "จำนวน ",
                item.quantity?.toLocaleString("th-TH")
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                "ราคาต่อหน่วย ",
                item.amount?.toLocaleString("th-TH"),
                " บาท"
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                "รวม ",
                item.lineTotal?.toLocaleString("th-TH"),
                " บาท"
              ] })
            ] }) })
          ] }) }, idx);
        }) }),
        /* @__PURE__ */ jsx(Separator, { className: "my-3" }),
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold mb-2 flex items-center gap-2", children: "สรุปรายการ" }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 flex justify-end", children: /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground text-right", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-1", children: [
            /* @__PURE__ */ jsx("span", { children: "จำนวนรายการทั้งหมด : " }),
            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              order.items.length,
              " รายการ"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { children: "ยอดรวมทั้งสิ้น : " }),
            /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-[#6EC1E4]", children: [
              order.total.toLocaleString("th-TH"),
              " บาท"
            ] })
          ] })
        ] }) }),
        role === "supervisor" && order.status === "pending" && /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: () => showApprovalModal(order.id, false, order.orderNo, order.requesterName),
              disabled: processingOrders.has(order.id),
              size: "sm",
              className: "bg-white text-red-500 border border-red-500 hover:bg-red-600 hover:text-white font-normal",
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
              className: "bg-green-500 text-white hover:bg-green-600 font-normal",
              children: [
                processingOrders.has(order.id) ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3 mr-1 animate-spin" }) : /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                "อนุมัติ"
              ]
            }
          )
        ] }) })
      ] })
    ] }) }, order.id)) }),
    /* @__PURE__ */ jsx(Dialog, { open: showConfirmModal, onOpenChange: setShowConfirmModal, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "flex items-center gap-2", children: confirmData?.approved ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-green-500" }),
          "ยืนยันการอนุมัติ"
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(XCircle, { className: "w-6 h-6 text-red-500" }),
          "ยืนยันการไม่อนุมัติ"
        ] }) }),
        /* @__PURE__ */ jsx(DialogDescription, { children: confirmData && /* @__PURE__ */ jsxs("span", { className: "text-base", children: [
          "คุณต้องการ",
          confirmData.approved ? "อนุมัติ" : "ไม่อนุมัติ",
          "ใบขอซื้อนี้หรือไม่?"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: cancelApproval,
            disabled: processingOrders.has(confirmData?.orderId || ""),
            className: "font-normal",
            children: "ยกเลิก"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            className: confirmData?.approved ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600",
            onClick: handleApproval,
            disabled: processingOrders.has(confirmData?.orderId || ""),
            children: processingOrders.has(confirmData?.orderId || "") ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 mr-2 animate-spin" }),
              "กำลังดำเนินการ..."
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
      return /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "flex items-center gap-1 bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 shadow-sm", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
        "รออนุมัติ"
      ] });
    case "approved":
      return /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "flex items-center gap-1 bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 shadow-sm", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
        "อนุมัติแล้ว"
      ] });
    case "rejected":
      return /* @__PURE__ */ jsxs(Badge, { variant: "destructive", className: "flex items-center gap-1 bg-red-100 text-red-800 border-red-200 hover:bg-red-200 shadow-sm", children: [
        /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3" }),
        "ไม่อนุมัติ"
      ] });
    case "in_progress":
      return /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "flex items-center gap-1 bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200 shadow-sm", children: [
        /* @__PURE__ */ jsx(Truck, { className: "w-3 h-3" }),
        "กำลังดำเนินการ"
      ] });
    case "delivered":
      return /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "flex items-center gap-1 bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200 shadow-sm", children: [
        /* @__PURE__ */ jsx(Package, { className: "w-3 h-3" }),
        "ได้รับแล้ว"
      ] });
    default:
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "flex items-center gap-1 bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 shadow-sm", children: [
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
        return 4;
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
                  stepNumber === currentStep && !isRejected && "data-[state=active]:bg-[#6EC1E4] data-[state=active]:text-white data-[state=active]:border-[#6EC1E4]",
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
                          variant: "secondary",
                          className: "hidden group-data-[state=active]/step:inline-flex bg-[#6EC1E4] text-white hover:bg-[#6EC1E4]",
                          children: "รอดำเนินการ"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        Badge,
                        {
                          variant: "secondary",
                          className: "hidden group-data-[state=completed]/step:inline-flex bg-green-500 text-white hover:bg-green-500",
                          children: "เสร็จสิ้น"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        Badge,
                        {
                          variant: "outline",
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
                stepNumber === currentStep && !isRejected && "group-data-[state=active]/step:bg-[#6EC1E4]",
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
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E2A\u0E16\u0E32\u0E19\u0E30" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "TrackingPage", TrackingPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/test03/po-app/src/components/po/TrackingPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/test03/po-app/src/pages/orders/tracking.astro", void 0);

const $$file = "C:/Projects/Astro/test03/po-app/src/pages/orders/tracking.astro";
const $$url = "/orders/tracking";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Tracking,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
