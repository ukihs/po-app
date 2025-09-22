import { c as createComponent, j as renderComponent, r as renderTemplate } from '../../chunks/astro/server_D_wosZza.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../../chunks/MainLayout_CQdCrJNe.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { s as subscribeAuthAndRole, d as db } from '../../chunks/auth_BW0YqYLL.mjs';
import { getDoc, doc, query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { a as generateOrderNumber, b as approveOrder } from '../../chunks/poApi_DD8qrIW0.mjs';
import { AlertCircle, FileText, CheckCircle, XCircle, Tag, Activity, CheckCircle2, AlertTriangle, X, Package, Truck, Clock, ShoppingCart } from 'lucide-react';
export { renderers } from '../../renderers.mjs';

function TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [role, setRole] = useState(null);
  const [processingOrders, setProcessingOrders] = useState(/* @__PURE__ */ new Set());
  const [user, setUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState(null);
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
      setAlertData({
        type: "success",
        message: `${action}ใบขอซื้อเรียบร้อยแล้ว`
      });
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        setAlertData(null);
      }, 3e3);
    } catch (error) {
      console.error("Error approving order:", error);
      const errorMessage = error?.message || "";
      const isPermissionError = errorMessage.includes("permission") || errorMessage.includes("insufficient") || errorMessage.includes("Missing") || errorMessage.includes("FirebaseError");
      if (isPermissionError) {
        console.warn("Permission warning occurred, checking if operation succeeded");
        setTimeout(() => {
          window.location.reload();
        }, 1e3);
        setAlertData({
          type: "success",
          message: `${action}สำเร็จแล้ว กำลังอัปเดตข้อมูล...`
        });
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
          setAlertData(null);
        }, 3e3);
      } else {
        setAlertData({
          type: "error",
          message: `เกิดข้อผิดพลาดใน${action}: ${errorMessage}`
        });
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
          setAlertData(null);
        }, 5e3);
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
  const getCategoryColor = (category) => {
    switch (category) {
      case "วัตถุดิบ":
        return "bg-green-100 text-green-800 border-green-200";
      case "Software":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "เครื่องมือ":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "วัสดุสิ้นเปลือง":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  const getItemStatusColor = (status) => {
    switch (status) {
      case "จัดซื้อ":
        return "bg-yellow-100 text-yellow-800";
      case "ของมาส่ง":
        return "bg-blue-100 text-blue-800";
      case "ส่งมอบของ":
        return "bg-green-100 text-green-800";
      case "สินค้าเข้าคลัง":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("div", { className: "loading loading-spinner loading-lg" }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-600", children: "กำลังโหลดข้อมูล..." })
    ] }) });
  }
  if (err) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: /* @__PURE__ */ jsxs("div", { className: "alert alert-error", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "w-6 h-6" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold", children: "เกิดข้อผิดพลาดในการโหลดข้อมูล" }),
        /* @__PURE__ */ jsx("div", { className: "text-sm", children: err })
      ] })
    ] }) });
  }
  if (rows.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(FileText, { className: "w-12 h-12 text-gray-400" }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900 mb-2", children: role === "buyer" ? "คุณยังไม่มีใบขอซื้อ" : "ยังไม่มีใบขอซื้อในระบบ" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-6", children: role === "buyer" ? "เริ่มสร้างใบขอซื้อแรกได้เลย!" : "รอใบขอซื้อจากผู้ใช้งาน" }),
      role === "buyer" && /* @__PURE__ */ jsx(
        "a",
        {
          href: "/orders/create",
          className: "btn bg-[#64D1E3] hover:bg-[#2b9ccc] rounded-xl text-white",
          children: "สร้างใบขอซื้อ"
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900", children: role === "buyer" ? "ติดตามสถานะใบขอซื้อ" : role === "supervisor" ? "ติดตามและอนุมัติใบขอซื้อ" : "ติดตามใบขอซื้อทั้งหมด" }),
      role === "supervisor" && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: "หน้าจัดการตรวจสอบและอนุมัติใบขอซื้อทั้งหมดในระบบ" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children: rows.map((order) => /* @__PURE__ */ jsx("div", { className: "card bg-white shadow-lg border border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "card-body p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900", children: generateOrderNumber(order.orderNo, order.date) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600 mt-1", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              "ชื่อผู้ขอ: ",
              order.requesterName
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "วันที่: ",
              order.date
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 mt-1", children: [
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
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-3", children: getStatusBadge(order.status) }),
          role === "supervisor" && /* @__PURE__ */ jsx("div", { className: "space-y-2", children: order.status === "pending" ? /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => showApprovalModal(order.id, true, order.orderNo, order.requesterName),
                disabled: processingOrders.has(order.id),
                className: "btn btn-sm bg-green-500 text-white hover:bg-green-600",
                children: [
                  processingOrders.has(order.id) ? /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-xs mr-1" }) : /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                  "อนุมัติ"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => showApprovalModal(order.id, false, order.orderNo, order.requesterName),
                disabled: processingOrders.has(order.id),
                className: "btn btn-sm bg-red-500 text-white hover:bg-red-600",
                children: [
                  processingOrders.has(order.id) ? /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-xs mr-1" }) : /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3 mr-1" }),
                  "ไม่อนุมัติ"
                ]
              }
            )
          ] }) : null })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-gray-700 mb-4", children: "ขั้นตอนการดำเนินงาน" }),
        renderProgressFlow(order.status)
      ] }),
      order.items && order.items.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-bold text-gray-700 mb-3 flex items-center gap-2", children: [
          "รายการสินค้า (",
          order.items.length,
          " รายการ)"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: order.items.map((item, idx) => {
          const category = getItemCategory(order, idx);
          const itemStatus = getItemStatus(order, idx);
          return /* @__PURE__ */ jsx("div", { className: "bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-2", children: /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-gray-900", children: [
                "รายการที่ ",
                idx + 1,
                ' : "',
                item.description,
                '"'
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`, children: [
                  /* @__PURE__ */ jsx(Tag, { className: "w-3 h-3" }),
                  "ประเภท: ",
                  category
                ] }),
                /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(itemStatus)}`, children: [
                  /* @__PURE__ */ jsx(Activity, { className: "w-3 h-3" }),
                  "สถานะ: ",
                  itemStatus
                ] })
              ] }),
              item.receivedDate && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 mb-1", children: [
                "ต้องการรับ: ",
                item.receivedDate
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-right min-w-[120px]", children: /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600", children: [
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
        /* @__PURE__ */ jsx("div", { className: "divider" }),
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-gray-700 mb-3 flex items-center gap-2", children: "สรุปรายการ" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600 text-right", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-700", children: "จำนวนรายการทั้งหมด : " }),
            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              order.items.length,
              " รายการ"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-700", children: "ยอดรวมทั้งสิ้น : " }),
            /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-[#64D1E3]", children: [
              order.total.toLocaleString("th-TH"),
              " บาท"
            ] })
          ] })
        ] }) })
      ] })
    ] }) }, order.id)) }),
    /* @__PURE__ */ jsxs("dialog", { className: `modal ${showConfirmModal ? "modal-open" : ""}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "modal-box", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg mb-4 flex items-center gap-2", children: confirmData?.approved ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-6 h-6 text-green-500" }),
          "ยืนยันการอนุมัติ"
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(XCircle, { className: "w-6 h-6 text-red-500" }),
          "ยืนยันการไม่อนุมัติ"
        ] }) }),
        confirmData && /* @__PURE__ */ jsx("div", { className: "py-4", children: /* @__PURE__ */ jsxs("p", { className: "text-base", children: [
          "คุณต้องการ",
          confirmData.approved ? "อนุมัติ" : "ไม่อนุมัติ",
          "ใบขอซื้อนี้หรือไม่?"
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "modal-action", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn btn-ghost font-normal",
              onClick: cancelApproval,
              disabled: processingOrders.has(confirmData?.orderId || ""),
              children: "ยกเลิก"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: `btn text-white ${confirmData?.approved ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`,
              onClick: handleApproval,
              disabled: processingOrders.has(confirmData?.orderId || ""),
              children: processingOrders.has(confirmData?.orderId || "") ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-sm mr-2" }),
                "กำลังดำเนินการ..."
              ] }) : /* @__PURE__ */ jsx(Fragment, { children: confirmData?.approved ? /* @__PURE__ */ jsx(Fragment, { children: "ยืนยัน" }) : /* @__PURE__ */ jsx(Fragment, { children: "ยืนยัน" }) })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("form", { method: "dialog", className: "modal-backdrop", children: /* @__PURE__ */ jsx("button", { onClick: cancelApproval, children: "close" }) })
    ] }),
    showAlert && alertData && /* @__PURE__ */ jsx("div", { className: "fixed top-4 right-4 z-50 max-w-sm", children: /* @__PURE__ */ jsxs(
      "div",
      {
        role: "alert",
        className: `alert alert-${alertData.type} alert-soft shadow-lg border-0`,
        children: [
          alertData.type === "success" && /* @__PURE__ */ jsx(CheckCircle2, { className: "h-6 w-6 shrink-0 stroke-current" }),
          alertData.type === "warning" && /* @__PURE__ */ jsx(AlertTriangle, { className: "h-6 w-6 shrink-0 stroke-current" }),
          alertData.type === "error" && /* @__PURE__ */ jsx(XCircle, { className: "h-6 w-6 shrink-0 stroke-current" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: alertData.message }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setShowAlert(false);
                setAlertData(null);
              },
              className: "btn btn-sm btn-ghost btn-circle ml-auto",
              children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
            }
          )
        ]
      }
    ) })
  ] });
}
function getStatusBadge(status) {
  switch (status) {
    case "pending":
      return /* @__PURE__ */ jsxs("div", { className: "badge badge-soft badge-warning", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
        "รออนุมัติ"
      ] });
    case "approved":
      return /* @__PURE__ */ jsxs("div", { className: "badge badge-soft badge-accent", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
        "อนุมัติแล้ว"
      ] });
    case "rejected":
      return /* @__PURE__ */ jsxs("div", { className: "badge badge-soft badge-error", children: [
        /* @__PURE__ */ jsx(XCircle, { className: "w-3 h-3" }),
        "ไม่อนุมัติ"
      ] });
    case "in_progress":
      return /* @__PURE__ */ jsxs("div", { className: "badge badge-soft badge-info", children: [
        /* @__PURE__ */ jsx(Truck, { className: "w-3 h-3" }),
        "กำลังดำเนินการ"
      ] });
    case "delivered":
      return /* @__PURE__ */ jsxs("div", { className: "badge badge-soft badge-success", children: [
        /* @__PURE__ */ jsx(Package, { className: "w-3 h-3" }),
        "ได้รับแล้ว"
      ] });
    default:
      return /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
        status
      ] });
  }
}
function renderProgressFlow(status) {
  const getStepClass = (stepKey, orderStatus) => {
    if (stepKey === "submitted") {
      return "step step-primary";
    }
    const stepStatus = getStepStatus(stepKey, orderStatus);
    switch (stepStatus) {
      case "completed":
        return "step step-primary";
      case "current":
        return "step step-primary";
      default:
        return "step";
    }
  };
  return /* @__PURE__ */ jsxs("ul", { className: "steps steps-vertical lg:steps-horizontal w-full", children: [
    /* @__PURE__ */ jsxs("li", { className: getStepClass("submitted", status), children: [
      /* @__PURE__ */ jsx("span", { className: "step-icon", children: /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "ผู้ขอซื้อ" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-success mt-1", children: "เสร็จสิ้น" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("li", { className: getStepClass("approval", status), children: [
      /* @__PURE__ */ jsx("span", { className: "step-icon", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "หัวหน้าอนุมัติ" }),
        getStepStatus("approval", status) === "current" && /* @__PURE__ */ jsx("span", { className: "text-xs text-warning mt-1", children: "รอดำเนินการ" }),
        getStepStatus("approval", status) === "completed" && /* @__PURE__ */ jsx("span", { className: "text-xs text-success mt-1", children: "เสร็จสิ้น" }),
        status === "rejected" && /* @__PURE__ */ jsx("span", { className: "text-xs text-error mt-1", children: "ไม่อนุมัติ" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("li", { className: getStepClass("procurement", status), children: [
      /* @__PURE__ */ jsx("span", { className: "step-icon", children: /* @__PURE__ */ jsx(ShoppingCart, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "ฝ่ายจัดซื้อ" }),
        getStepStatus("procurement", status) === "current" && /* @__PURE__ */ jsx("span", { className: "text-xs text-warning mt-1", children: "รอดำเนินการ" }),
        getStepStatus("procurement", status) === "completed" && /* @__PURE__ */ jsx("span", { className: "text-xs text-success mt-1", children: "เสร็จสิ้น" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("li", { className: getStepClass("delivered", status), children: [
      /* @__PURE__ */ jsx("span", { className: "step-icon", children: /* @__PURE__ */ jsx(Package, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "ส่งมอบ" }),
        getStepStatus("delivered", status) === "current" && /* @__PURE__ */ jsx("span", { className: "text-xs text-warning mt-1", children: "รอดำเนินการ" }),
        getStepStatus("delivered", status) === "completed" && /* @__PURE__ */ jsx("span", { className: "text-xs text-success mt-1", children: "เสร็จสิ้น" })
      ] })
    ] })
  ] });
}
function getStepStatus(step, orderStatus) {
  switch (step) {
    case "approval":
      if (orderStatus === "pending") return "current";
      if (["approved", "in_progress", "delivered"].includes(orderStatus)) return "completed";
      return "pending";
    case "procurement":
      if (orderStatus === "approved") return "current";
      if (["in_progress", "delivered"].includes(orderStatus)) return "completed";
      return "pending";
    case "delivered":
      if (orderStatus === "in_progress") return "current";
      if (orderStatus === "delivered") return "completed";
      return "pending";
    default:
      return "pending";
  }
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
