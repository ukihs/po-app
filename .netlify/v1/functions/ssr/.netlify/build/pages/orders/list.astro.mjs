import { d as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_BkuRanWd.mjs';
import 'kleur/colors';
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuCheckboxItem, $ as $$MainLayout } from '../../chunks/MainLayout_h4H-Ivtp.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import React__default, { useState, useEffect } from 'react';
import { B as Button, s as subscribeAuthAndRole, i as db, C as Card, a as CardHeader, c as CardContent } from '../../chunks/card_DPKHX6pj.mjs';
import { getDoc, doc, query, collection, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ChevronDown, Loader2, ChevronRight, ArrowUpDown, RefreshCw } from 'lucide-react';
import { A as Alert, a as AlertDescription } from '../../chunks/alert_B7UI7IZ0.mjs';
import { useReactTable, getFilteredRowModel, getSortedRowModel, getPaginationRowModel, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { I as Input } from '../../chunks/input_BW0kI7pb.mjs';
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from '../../chunks/table_Bdv0yE5d.mjs';
import { B as Badge } from '../../chunks/badge_CZCfTozJ.mjs';
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from '../../chunks/select_IhgbFlzr.mjs';
export { renderers } from '../../renderers.mjs';

const ITEM_CATEGORIES = ["วัตถุดิบ", "Software/Hardware", "เครื่องมือ", "วัสดุสิ้นเปลือง"];
const ORDER_STATUS_OPTIONS = [
  { value: "approved", label: "อนุมัติแล้ว" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "delivered", label: "ได้รับแล้ว" }
];
const STATUS_TH = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
  in_progress: "กำลังดำเนินการ",
  delivered: "ได้รับแล้ว"
};
const STATUS_BADGE = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  in_progress: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800"
};
const ITEM_STATUS_G1 = ["จัดซื้อ", "ของมาส่ง", "ส่งมอบของ", "สินค้าเข้าคลัง"];
const ITEM_STATUS_G2 = ["จัดซื้อ", "ของมาส่ง", "ส่งมอบของ"];
const getItemStatusOptions = (category) => category === "วัตถุดิบ" ? ITEM_STATUS_G1 : ITEM_STATUS_G2;
const fmtTS = (ts) => ts?.toDate ? ts.toDate().toLocaleString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const createColumns = (role, expanded, processingKeys, drafts, onToggleExpanded, onSaveOrderStatus, onSaveItem, onSetDraft, onGetItemValue) => [
  {
    accessorKey: "orderNo",
    header: ({ column }) => {
      return /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          className: "h-auto p-0 font-semibold",
          children: [
            "รายการที่",
            /* @__PURE__ */ jsx(ArrowUpDown, { className: "ml-2 h-4 w-4" })
          ]
        }
      );
    },
    cell: ({ row }) => {
      const order = row.original;
      const isOpen = !!expanded[order.id];
      return /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "inline-flex items-center gap-1 h-auto p-0 font-medium",
          onClick: () => onToggleExpanded(order.id),
          children: [
            isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }),
            "#",
            order.orderNo ?? "-"
          ]
        }
      );
    }
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          className: "h-auto p-0 font-semibold",
          children: [
            "วันที่",
            /* @__PURE__ */ jsx(ArrowUpDown, { className: "ml-2 h-4 w-4" })
          ]
        }
      );
    },
    cell: ({ row }) => {
      const order = row.original;
      return /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: order.date || fmtTS(order.createdAt) });
    }
  },
  {
    accessorKey: "requesterName",
    header: ({ column }) => {
      return /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          className: "h-auto p-0 font-semibold",
          children: [
            "ผู้ขอซื้อ",
            /* @__PURE__ */ jsx(ArrowUpDown, { className: "ml-2 h-4 w-4" })
          ]
        }
      );
    },
    cell: ({ row }) => {
      const requesterName = row.getValue("requesterName");
      const requester = row.original.requester;
      return /* @__PURE__ */ jsx("div", { className: "font-normal", children: requesterName || requester || "-" });
    }
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => {
      return /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          className: "h-auto p-0 font-semibold",
          children: [
            "ยอดรวม",
            /* @__PURE__ */ jsx(ArrowUpDown, { className: "ml-2 h-4 w-4" })
          ]
        }
      );
    },
    cell: ({ row }) => {
      const order = row.original;
      const total = order.totalAmount ?? order.total ?? 0;
      return /* @__PURE__ */ jsxs("div", { className: "tabular-nums", children: [
        total.toLocaleString("th-TH"),
        " บาท"
      ] });
    }
  },
  {
    accessorKey: "status",
    header: "สถานะ",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return /* @__PURE__ */ jsx(Badge, { className: STATUS_BADGE[status], children: STATUS_TH[status] });
    }
  },
  {
    id: "actions",
    header: "การดำเนินการ",
    enableHiding: false,
    cell: ({ row }) => {
      const order = row.original;
      if (role === "procurement") {
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: order.status,
              onValueChange: (value) => onSaveOrderStatus(order, value),
              disabled: processingKeys.has(order.id),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "เลือกสถานะ…" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: ORDER_STATUS_OPTIONS.map((x) => /* @__PURE__ */ jsx(SelectItem, { value: x.value, children: x.label }, x.value)) })
              ]
            }
          ),
          processingKeys.has(order.id) && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" })
        ] });
      }
      return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "—" });
    }
  }
];
function OrdersDataTable({
  data,
  loading,
  role,
  expanded,
  processingKeys,
  drafts,
  onToggleExpanded,
  onSaveOrderStatus,
  onSaveItem,
  onSetDraft,
  onGetItemValue
}) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const columns = createColumns(
    role,
    expanded,
    processingKeys,
    drafts,
    onToggleExpanded,
    onSaveOrderStatus);
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, columnId, value) => {
      const search = value.toLowerCase();
      const order = row.original;
      return !!(order.requesterName?.toLowerCase().includes(search) || order.requester?.toLowerCase().includes(search) || order.id.toLowerCase().includes(search) || order.orderNo?.toString().includes(search));
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter
    }
  });
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "flex justify-center items-center p-12", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-[#6EC1E4]" }),
      /* @__PURE__ */ jsx("span", { className: "ml-4 text-lg", children: "โหลดข้อมูลใบสั่งซื้อ..." })
    ] });
  }
  if (data.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center p-12", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: "ไม่พบข้อมูลใบสั่งซื้อ" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "ยังไม่มีใบสั่งซื้อในระบบ" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center py-4", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: "ค้นหาชื่อผู้ขอซื้อหรือหมายเลขใบขอซื้อ...",
          value: globalFilter ?? "",
          onChange: (event) => setGlobalFilter(event.target.value),
          className: "max-w-sm"
        }
      ),
      /* @__PURE__ */ jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "ml-auto", children: [
          "คอลัมน์ ",
          /* @__PURE__ */ jsx(ChevronDown, { className: "ml-2 h-4 w-4" })
        ] }) }),
        /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", children: table.getAllColumns().filter((column) => column.getCanHide()).map((column) => {
          return /* @__PURE__ */ jsx(
            DropdownMenuCheckboxItem,
            {
              className: "capitalize",
              checked: column.getIsVisible(),
              onCheckedChange: (value) => column.toggleVisibility(!!value),
              children: column.id
            },
            column.id
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: table.getHeaderGroups().map((headerGroup) => /* @__PURE__ */ jsx(TableRow, { children: headerGroup.headers.map((header) => {
        return /* @__PURE__ */ jsx(TableHead, { children: header.isPlaceholder ? null : flexRender(
          header.column.columnDef.header,
          header.getContext()
        ) }, header.id);
      }) }, headerGroup.id)) }),
      /* @__PURE__ */ jsx(TableBody, { children: table.getRowModel().rows?.length ? table.getRowModel().rows.map((row) => {
        const order = row.original;
        const isOpen = !!expanded[order.id];
        return /* @__PURE__ */ jsxs(React__default.Fragment, { children: [
          /* @__PURE__ */ jsx(
            TableRow,
            {
              "data-state": row.getIsSelected() && "selected",
              className: "hover",
              children: row.getVisibleCells().map((cell) => /* @__PURE__ */ jsx(TableCell, { children: flexRender(
                cell.column.columnDef.cell,
                cell.getContext()
              ) }, cell.id))
            }
          ),
          isOpen && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: columns.length, className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "bg-muted/50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-background overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "px-4 py-3 text-sm font-semibold border-b", children: "รายการสินค้า" }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
              /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableHead, { children: "รายละเอียด" }),
                /* @__PURE__ */ jsx(TableHead, { children: "จำนวน" }),
                /* @__PURE__ */ jsx(TableHead, { children: "ราคาต่อหน่วย(บาท)" }),
                /* @__PURE__ */ jsx(TableHead, { children: "รวมทั้งสิ้น(บาท)" }),
                /* @__PURE__ */ jsx(TableHead, { children: "ประเภทสินค้า" }),
                /* @__PURE__ */ jsx(TableHead, { children: "สถานะรายการ" }),
                role === "procurement" && /* @__PURE__ */ jsx(TableHead, {})
              ] }) }),
              /* @__PURE__ */ jsx(TableBody, { children: (order.items || []).map((it, idx) => {
                const val = onGetItemValue(order, idx);
                const options = getItemStatusOptions(val.category);
                return /* @__PURE__ */ jsxs(TableRow, { children: [
                  /* @__PURE__ */ jsx(TableCell, { children: it.description || "-" }),
                  /* @__PURE__ */ jsx(TableCell, { children: it.quantity ?? "-" }),
                  /* @__PURE__ */ jsx(TableCell, { children: it.amount != null ? Number(it.amount).toLocaleString("th-TH") : "-" }),
                  /* @__PURE__ */ jsx(TableCell, { children: it.lineTotal != null ? Number(it.lineTotal).toLocaleString("th-TH") : "-" }),
                  /* @__PURE__ */ jsx(TableCell, { children: role === "procurement" ? /* @__PURE__ */ jsxs(
                    Select,
                    {
                      value: val.category,
                      onValueChange: (value) => onSetDraft(order.id, idx, { category: value }),
                      disabled: processingKeys.has(`${order.id}:${idx}`),
                      children: [
                        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "เลือกประเภท…" }) }),
                        /* @__PURE__ */ jsx(SelectContent, { children: ITEM_CATEGORIES.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c, children: c }, c)) })
                      ]
                    }
                  ) : /* @__PURE__ */ jsx(Badge, { variant: val.category ? "secondary" : "outline", children: val.category || "ยังไม่ระบุ" }) }),
                  /* @__PURE__ */ jsx(TableCell, { children: role === "procurement" ? /* @__PURE__ */ jsxs(
                    Select,
                    {
                      value: val.itemStatus,
                      onValueChange: (value) => onSetDraft(order.id, idx, { itemStatus: value }),
                      disabled: processingKeys.has(`${order.id}:${idx}`),
                      children: [
                        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "เลือกประเภท…" }) }),
                        /* @__PURE__ */ jsx(SelectContent, { children: options.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s)) })
                      ]
                    }
                  ) : /* @__PURE__ */ jsx(Badge, { variant: val.itemStatus ? "default" : "outline", children: val.itemStatus || "รอดำเนินการ" }) }),
                  role === "procurement" && /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
                    Button,
                    {
                      className: "bg-[#6EC1E4] hover:bg-[#2b9ccc] font-normal",
                      size: "sm",
                      onClick: () => onSaveItem(order, idx),
                      disabled: processingKeys.has(`${order.id}:${idx}`),
                      children: [
                        processingKeys.has(`${order.id}:${idx}`) && /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin mr-1" }),
                        "บันทึก"
                      ]
                    }
                  ) })
                ] }, idx);
              }) })
            ] }) })
          ] }) }) }) })
        ] }, order.id);
      }) : /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(
        TableCell,
        {
          colSpan: columns.length,
          className: "h-24 text-center",
          children: "ไม่พบข้อมูล"
        }
      ) }) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end space-x-2 py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground flex-1 text-sm", children: [
        "แสดง ",
        table.getFilteredRowModel().rows.length,
        " รายการ"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-x-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => table.previousPage(),
            disabled: !table.getCanPreviousPage(),
            children: "ก่อนหน้า"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => table.nextPage(),
            disabled: !table.getCanNextPage(),
            children: "ถัดไป"
          }
        )
      ] })
    ] })
  ] });
}

function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [expanded, setExpanded] = useState({});
  const [processingKeys, setProcessingKeys] = useState(/* @__PURE__ */ new Set());
  const [drafts, setDrafts] = useState({});
  useEffect(() => {
    let unsub;
    const off = subscribeAuthAndRole(async (authUser, r) => {
      if (!authUser) {
        window.location.href = "/login";
        return;
      }
      setUser(authUser);
      let effective = r || localStorage.getItem("role") || null;
      if (!effective) {
        try {
          const u = await getDoc(doc(db, "users", authUser.uid));
          if (u.exists()) effective = u.data()?.role ?? null;
        } catch {
        }
      }
      setRole(effective);
      unsub?.();
      const qRef = query(collection(db, "orders"));
      unsub = onSnapshot(
        qRef,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => {
            const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return tb - ta;
          });
          setOrders(list);
          setErr("");
          setLoading(false);
        },
        (e) => {
          setErr(String(e?.message || e));
          setLoading(false);
        }
      );
    });
    return () => {
      unsub?.();
      off?.();
    };
  }, []);
  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const getItemValue = (o, idx) => {
    const d = drafts[o.id]?.[idx] || {};
    const mapCat = o.itemsCategories?.[String(idx)];
    const mapSt = o.itemsStatuses?.[String(idx)];
    const item = (o.items || [])[idx] || {};
    return {
      category: d.category ?? item.category ?? mapCat ?? "",
      itemStatus: d.itemStatus ?? item.itemStatus ?? mapSt ?? ""
    };
  };
  const setDraft = (orderId, idx, patch) => {
    setDrafts((prev) => {
      const cur = { ...prev[orderId]?.[idx] || {} };
      const next = { ...cur, ...patch };
      return { ...prev, [orderId]: { ...prev[orderId] || {}, [idx]: next } };
    });
  };
  const saveOneItem = async (o, idx) => {
    const val = getItemValue(o, idx);
    if (!val.category && !val.itemStatus) {
      alert("ยังไม่ได้เลือกประเภท/สถานะ");
      return;
    }
    const key = `${o.id}:${idx}`;
    try {
      setProcessingKeys((s) => new Set(s).add(key));
      const ref = doc(db, "orders", o.id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const items = Array.isArray(data.items) ? [...data.items] : [];
      items[idx] = { ...items[idx] || {}, category: val.category, itemStatus: val.itemStatus };
      const itemsCategories = { ...data.itemsCategories || {} };
      const itemsStatuses = { ...data.itemsStatuses || {} };
      itemsCategories[String(idx)] = val.category;
      itemsStatuses[String(idx)] = val.itemStatus;
      await updateDoc(ref, {
        items,
        itemsCategories,
        itemsStatuses,
        updatedAt: serverTimestamp()
      });
      setDrafts((prev) => {
        const forOrder = { ...prev[o.id] || {} };
        delete forOrder[idx];
        return { ...prev, [o.id]: forOrder };
      });
      alert("บันทึกสำเร็จ");
    } catch (e) {
      console.error(e);
      alert(`บันทึกไม่สำเร็จ: ${e?.message || e}`);
    } finally {
      setProcessingKeys((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
  };
  const saveOrderStatus = async (o, next) => {
    const key = o.id;
    try {
      setProcessingKeys((s) => new Set(s).add(key));
      await updateDoc(doc(db, "orders", o.id), {
        status: next,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
      alert(`อัปเดตสถานะใบไม่สำเร็จ: ${e?.message || e}`);
    } finally {
      setProcessingKeys((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full py-10 text-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto" }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 text-muted-foreground", children: "กำลังโหลดข้อมูล…" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    err && /* @__PURE__ */ jsx(Alert, { className: "mb-4", variant: "destructive", children: /* @__PURE__ */ jsx(AlertDescription, { children: err }) }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-2", children: "รายการใบขอซื้อ" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: role === "procurement" ? "สำหรับฝ่ายจัดซื้อ – เปลี่ยนสถานะใบ + จัดประเภท/สถานะของแต่ละรายการ" : role === "supervisor" ? "สำหรับหัวหน้างาน – ดูรายการใบขอซื้อทั้งหมด" : "รายการใบขอซื้อทั้งหมด" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2 px-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-3 items-center justify-between", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "รายการใบขอซื้อ" }) }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxs(
          Button,
          {
            className: "font-normal",
            variant: "outline",
            size: "sm",
            onClick: () => window.location.reload(),
            disabled: loading,
            children: [
              loading ? /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }),
              "รีเฟรช"
            ]
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "px-6 pb-6 pt-0", children: /* @__PURE__ */ jsx(
        OrdersDataTable,
        {
          data: orders,
          loading,
          role,
          expanded,
          processingKeys,
          drafts,
          onToggleExpanded: toggle,
          onSaveOrderStatus: saveOrderStatus,
          onSaveItem: saveOneItem,
          onSetDraft: setDraft,
          onGetItemValue: getItemValue
        }
      ) })
    ] })
  ] });
}

const $$List = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E1A\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "OrdersListPage", OrdersListPage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Projects/Astro/test03/po-app/src/components/po/OrdersListPage", "client:component-export": "default" })} ` })}`;
}, "C:/Projects/Astro/test03/po-app/src/pages/orders/list.astro", void 0);

const $$file = "C:/Projects/Astro/test03/po-app/src/pages/orders/list.astro";
const $$url = "/orders/list";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$List,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
