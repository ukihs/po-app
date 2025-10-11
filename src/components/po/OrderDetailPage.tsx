"use client";

import React from "react";
import { useUser, useRole, useIsLoading, useOrderById } from "../../stores";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, FileText, User, Calendar, DollarSign } from "lucide-react";
import type { Order } from "../../types";
import { getDisplayOrderNumber } from "../../lib/order-utils";

export default function OrderDetailPage({ orderId }: { orderId: string }) {
  const user = useUser();
  const role = useRole();
  const authLoading = useIsLoading();
  const order = useOrderById(orderId);
  
  const loading = authLoading || !order;

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

  if (authLoading || loading) {
    return (
      <div className="w-full py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <div className="mt-3 text-muted-foreground">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (!user || !role) {
    return (
      <div className="w-full py-10 text-center">
        <Alert variant="destructive">
          <AlertDescription>กรุณาเข้าสู่ระบบ</AlertDescription>
        </Alert>
      </div>
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-[#2b9ccc]" />
          ใบขอซื้อ {getDisplayOrderNumber(order)}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          รายละเอียดใบสั่งซื้อ
        </p>
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
              {(order.totalAmount || order.total || 0).toLocaleString('th-TH')} บาท
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
    </div>
  );
}