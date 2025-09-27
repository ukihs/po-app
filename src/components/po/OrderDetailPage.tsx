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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FileText className="h-8 w-8 text-[#2b9ccc]" />
          ใบสั่งซื้อ #{order.orderNo}
        </h1>
        <p className="text-muted-foreground">
          รายละเอียดใบสั่งซื้อ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">ผู้ขอซื้อ</span>
            </div>
            <p className="font-semibold">{order.requesterName}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">วันที่เอกสาร</span>
            </div>
            <p className="font-semibold">{order.date}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">ยอดรวม</span>
            </div>
            <p className="font-semibold">
              {(order.totalAmount || order.grandTotal || 0).toLocaleString('th-TH')} บาท
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">สถานะ</span>
            </div>
            <Badge className={statusInfo.className}>
              {statusInfo.text}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {order.items?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>รายการสินค้า ({order.items.length} รายการ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ลำดับ</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>วันที่ต้องการ</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead className="text-right">ราคา/หน่วย</TableHead>
                    <TableHead className="text-right">รวม (บาท)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item: any, index: number) => (
                    <TableRow key={item.no ?? index}>
                      <TableCell className="font-medium">{item.no ?? index + 1}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.receivedDate || '-'}</TableCell>
                      <TableCell className="text-right">{item.quantity?.toLocaleString('th-TH')}</TableCell>
                      <TableCell className="text-right">{item.amount?.toLocaleString('th-TH')}</TableCell>
                      <TableCell className="text-right font-medium">
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
        <div className="mt-6 flex gap-4">
          <Button 
            onClick={approve} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                กำลังอนุมัติ...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                อนุมัติ
              </>
            )}
          </Button>
          <Button 
            onClick={reject} 
            disabled={saving}
            variant="destructive"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                กำลังทำรายการ...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                ไม่อนุมัติ
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <Alert>
            <AlertDescription>
              หน้านี้เป็นมุมมองอ่านอย่างเดียวสำหรับสิทธิ์ของคุณ
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
