import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/client";
import {
  doc, getDoc, updateDoc, collection, addDoc, serverTimestamp
} from "firebase/firestore";
import { subscribeAuthAndRole } from "../../lib/auth";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, CheckCircle, XCircle, FileText, User, Calendar, DollarSign } from "lucide-react";

type Status = "pending"|"approved"|"rejected"|"in_progress"|"delivered";
type UserRole = "buyer" | "supervisor" | "procurement" | "admin";

type Order = {
  id?: string;
  orderNo: string;
  date: string;
  requesterName: string;
  grandTotal?: number;
  totalAmount?: number;
  items?: any[];
  status: Status | string;
};

export default function OrderDetailPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [role, setRole] = useState<UserRole>('buyer');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const off = subscribeAuthAndRole(async (authUser, r) => {
      if (!authUser) { 
        window.location.href = "/login"; 
        return; 
      }
      
      try {
        const snap = await getDoc(doc(db, "orders", orderId));
        setOrder(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) }) : null);
        
        let effective: UserRole = (r as UserRole) || 'buyer';
        if (!effective) {
          try {
            const prof = await getDoc(doc(db, "users", authUser.uid));
            if (prof.exists()) {
              effective = (prof.data() as any)?.role ?? 'buyer';
            }
          } catch {}
        }
        setRole(effective);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    });

    return () => { unsub?.(); off?.(); };
  }, [orderId]);

  const approve = async () => {
    if (!order?.id || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "approved",
        approvedByUid: auth.currentUser?.uid || null,
        approvedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        toRole: "procurement",
        orderId: order.id,
        orderNo: order.orderNo,
        title: "ใบสั่งซื้อได้รับอนุมัติ",
        message: `#${order.orderNo} โดย ${order.requesterName}`,
        kind: "approved",
        read: false,
        createdAt: serverTimestamp(),
      });
      alert("อนุมัติเรียบร้อย");
      window.location.href = "/orders/list";
    } catch (e: any) {
      console.error(e);
      alert(e.message || "อนุมัติไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    if (!order?.id || saving) return;
    const reason = prompt("เหตุผลการไม่อนุมัติ (ใส่หรือเว้นว่างก็ได้)") || "";
    setSaving(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "rejected",
        rejectedByUid: auth.currentUser?.uid || null,
        rejectedAt: serverTimestamp(),
        rejectReason: reason,
      });
      await addDoc(collection(db, "notifications"), {
        toRole: "procurement",
        orderId: order.id,
        orderNo: order.orderNo,
        title: "ใบสั่งซื้อไม่ได้รับอนุมัติ",
        message: `#${order.orderNo} โดย ${order.requesterName}${reason ? ` (เหตุผล: ${reason})` : ""}`,
        kind: "rejected",
        read: false,
        createdAt: serverTimestamp(),
      });
      alert("ทำรายการไม่อนุมัติแล้ว");
      window.location.href = "/orders/list";
    } catch (e: any) {
      console.error(e);
      alert(e.message || "ไม่อนุมัติไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      'pending': { text: 'รออนุมัติ', className: 'bg-yellow-100 text-yellow-800' },
      'approved': { text: 'อนุมัติแล้ว', className: 'bg-green-100 text-green-800' },
      'rejected': { text: 'ไม่อนุมัติ', className: 'bg-red-100 text-red-800' },
      'in_progress': { text: 'กำลังดำเนินการ', className: 'bg-blue-100 text-blue-800' },
      'delivered': { text: 'ได้รับแล้ว', className: 'bg-purple-100 text-purple-800' },
    };
    return statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
  };

  const isPending = order?.status === 'pending';
  const canApprove = role === 'supervisor' && isPending;

  if (loading) {
    return (
      <div className="w-full py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <div className="mt-3 text-muted-foreground">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (err) {
    return (
      <Alert variant="destructive">
        <AlertDescription>เกิดข้อผิดพลาด: {err}</AlertDescription>
      </Alert>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-12">
        <h3 className="text-xl font-semibold mb-2">ไม่พบใบสั่งซื้อ</h3>
        <p className="text-muted-foreground">ไม่พบข้อมูลใบสั่งซื้อที่ต้องการ</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(String(order.status));

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-[#2b9ccc]" />
          ใบสั่งซื้อ #{order.orderNo}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">ผู้ขอซื้อ</span>
            </div>
            <p className="font-semibold text-sm sm:text-base">{order.requesterName}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">วันที่เอกสาร</span>
            </div>
            <p className="font-semibold text-sm sm:text-base">{order.date}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">ยอดรวม</span>
            </div>
            <p className="font-semibold text-sm sm:text-base">
              {(order.totalAmount || order.grandTotal || 0).toLocaleString('th-TH')} บาท
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">สถานะ</span>
            </div>
            <Badge className={`${statusInfo.className} text-xs sm:text-sm`}>
              {statusInfo.text}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {order.items?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">รายการสินค้า ({order.items.length} รายการ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">ลำดับ</TableHead>
                    <TableHead className="text-xs sm:text-sm">รายละเอียด</TableHead>
                    <TableHead className="text-xs sm:text-sm">วันที่ต้องการ</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">จำนวน</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">ราคา/หน่วย</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">รวม (บาท)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item: any, index: number) => (
                    <TableRow key={item.no ?? index}>
                      <TableCell className="font-medium text-xs sm:text-sm">{item.no ?? index + 1}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{item.description}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{item.receivedDate || '-'}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{item.quantity?.toLocaleString('th-TH')}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{item.amount?.toLocaleString('th-TH')}</TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm">
                        {item.lineTotal?.toLocaleString('th-TH') || item.amount?.toLocaleString('th-TH')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {canApprove ? (
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button 
            onClick={approve} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-2" />
                <span className="hidden sm:inline">กำลังอนุมัติ...</span>
                <span className="sm:hidden">กำลังอนุมัติ...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                อนุมัติ
              </>
            )}
          </Button>
          <Button 
            onClick={reject} 
            disabled={saving}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-2" />
                <span className="hidden sm:inline">กำลังทำรายการ...</span>
                <span className="sm:hidden">กำลังทำรายการ...</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                ไม่อนุมัติ
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-4 sm:mt-6">
          <Alert>
            <AlertDescription className="text-xs sm:text-sm">
              หน้านี้เป็นมุมมองอ่านอย่างเดียวสำหรับสิทธิ์ของคุณ
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
