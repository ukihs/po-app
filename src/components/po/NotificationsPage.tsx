"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { auth, db } from '../../firebase/client';
import { subscribeAuthAndRole } from '../../lib/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { 
  Bell, 
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
  CheckCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type Noti = {
  id: string;
  title: string;
  message?: string;
  orderId?: string;
  orderNo?: number;
  createdAt?: any;
  read?: boolean;
  toUserUid?: string;
  fromUserName?: string;
  kind?: 'approval_request' | 'approved' | 'rejected' | 'status_update';
  forRole?: 'procurement' | 'supervisor' | 'buyer' | 'superadmin';
};

const fmt = (ts: any) => {
  if (!ts?.toDate) return '';
  const d = ts.toDate();
  return d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' });
};

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'buyer': return 'ผู้ขอซื้อ';
    case 'supervisor': return 'หัวหน้างาน';
    case 'procurement': return 'ฝ่ายจัดซื้อ';
    default: return role;
  }
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Noti[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');
  const [role, setRole] = useState<'buyer' | 'supervisor' | 'procurement' | 'superadmin' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const stopSnap = useRef<Unsubscribe | null>(null);
  const stopAuth = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    stopAuth.current = subscribeAuthAndRole((user, userRole) => {
      if (stopSnap.current) {
        stopSnap.current();
        stopSnap.current = null;
      }

      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      setRole(userRole);
      setLoading(true);
      setErr('');

      if (userRole === 'buyer' || userRole === 'supervisor') {
        const q = query(
          collection(db, 'notifications'),
          where('toUserUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        stopSnap.current = onSnapshot(
          q,
          (snap) => {
            const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            setItems(rows as Noti[]);
            setLoading(false);
          },
          (e) => {
            console.error('notifications error:', e);
            setErr((e?.message || '').toString());
            setItems([]);
            setLoading(false);
          }
        );
      } else if (userRole === 'procurement') {
        const personalQ = query(
          collection(db, 'notifications'),
          where('toUserUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const roleQ = query(
          collection(db, 'notifications'),
          where('forRole', '==', 'procurement'),
          orderBy('createdAt', 'desc')
        );

        let personalNotifs: Noti[] = [];
        let roleNotifs: Noti[] = [];
        let loadedCount = 0;

        const combineAndSetNotifications = () => {
          if (loadedCount < 2) return;
          
          const allNotifs = [...personalNotifs, ...roleNotifs];
          const uniqueNotifs = allNotifs.filter((notif, index, arr) => 
            arr.findIndex(n => n.id === notif.id) === index
          );
          
          uniqueNotifs.sort((a, b) => {
            if (!a.createdAt?.toDate || !b.createdAt?.toDate) return 0;
            return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
          });

          setItems(uniqueNotifs);
          setLoading(false);
        };

        const unsubPersonal = onSnapshot(personalQ, (snap) => {
          personalNotifs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Noti[];
          loadedCount = Math.max(loadedCount, 1);
          combineAndSetNotifications();
        }, (e) => {
          console.error('personal notifications error:', e);
          setErr((e?.message || '').toString());
          setLoading(false);
        });

        const unsubRole = onSnapshot(roleQ, (snap) => {
          roleNotifs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Noti[];
          loadedCount = Math.max(loadedCount, 2);
          combineAndSetNotifications();
        }, (e) => {
          console.error('role notifications error:', e);
          setErr((e?.message || '').toString());
          setLoading(false);
        });

        stopSnap.current = () => {
          unsubPersonal();
          unsubRole();
        };
      } else {
        setItems([]);
        setLoading(false);
        return;
      }
    });

    return () => {
      if (stopSnap.current) stopSnap.current();
      if (stopAuth.current) stopAuth.current();
      stopSnap.current = null;
      stopAuth.current = null;
    };
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.orderNo?.toString().includes(searchTerm) ||
        item.fromUserName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || item.kind === filterType;

      return matchesSearch && matchesType;
    });
    filtered.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
      const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
      
      if (sortBy === 'newest') {
        return timeB - timeA;
      } else if (sortBy === 'oldest') {
        return timeA - timeB;
      } else if (sortBy === 'unread') {
        if (a.read === b.read) return timeB - timeA;
        return a.read ? 1 : -1;
      }
      return timeB - timeA;
    });

    return filtered;
  }, [items, searchTerm, filterType, sortBy]);
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  const unreadCount = items.filter(item => !item.read).length;

  const markReadAndGo = async (n: Noti) => {
    try {
      if (!n.read) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
      
      if (role === 'buyer') {
        window.location.href = '/orders/tracking';
      } else if (role === 'supervisor') {
        window.location.href = '/orders/tracking';
      } else if (role === 'procurement') {
        window.location.href = '/orders/list';
      }
    } catch (e) {
      console.error(e);
      if (role === 'buyer') {
        window.location.href = '/orders/tracking';
      } else {
        window.location.href = '/orders/list';
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadItems = items.filter(item => !item.read);
      const promises = unreadItems.map(item => 
        updateDoc(doc(db, 'notifications', item.id), { read: true })
      );
      await Promise.all(promises);
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    setItemsPerPage(Number(newItemsPerPage));
    setCurrentPage(1);
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortBy]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="mt-4 text-muted-foreground">กำลังโหลดแจ้งเตือน...</p>
        </div>
      </div>
    );
  }

  if (err && /requires an index/i.test(err)) {
    return (
      <div className="w-full">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
            <div className="text-sm mt-2">
              {err}
              <br />
              ถ้า error มีคำว่า requires an index ให้คลิกลิงก์ในข้อความนั้นเพื่อสร้าง Index แล้วรีเฟรชใหม่อีกครั้ง
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">ข้อความแจ้งเตือน</h1>
            </div>
          </div>
          <p className="text-muted-foreground">
            แจ้งเตือนการอนุมัติใบขอซื้อสำหรับ{getRoleDisplayName(role || '')}
          </p>
        </div>
        
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Bell className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-3">ยังไม่มีการแจ้งเตือน</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            การแจ้งเตือนต่างๆ เกี่ยวกับการอนุมัติใบขอซื้อและอัปเดตสถานะจะแสดงที่นี่
          </p>
        </div>
      </div>
    );
  }

  if (!filteredAndSortedItems.length && items.length > 0) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">ข้อความแจ้งเตือน</h1>
                {unreadCount > 0 && (
                  <Badge variant="primary" appearance="light" className="mt-1">
                    {unreadCount} รายการใหม่
                  </Badge>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                onClick={markAllAsRead}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                อ่านทั้งหมด
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            แจ้งเตือนการอนุมัติใบขอซื้อสำหรับ{getRoleDisplayName(role || '')}
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาการแจ้งเตือน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="กรองตามประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                <SelectItem value="status_update">อัปเดตสถานะ</SelectItem>
                <SelectItem value="approval_request">ขออนุมัติ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="เรียงตาม" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">ใหม่ล่าสุด</SelectItem>
                <SelectItem value="oldest">เก่าที่สุด</SelectItem>
                <SelectItem value="unread">ยังไม่อ่าน</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <Search className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-3">ไม่พบการแจ้งเตือนที่ตรงตามเงื่อนไข</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูการแจ้งเตือนอื่นๆ
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setSortBy('newest');
            }}
          >
            ล้างตัวกรอง
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">ข้อความแจ้งเตือน</h1>
              {unreadCount > 0 && (
                <Badge variant="primary" appearance="light" className="mt-1">
                  {unreadCount} รายการใหม่
                </Badge>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              อ่านทั้งหมด
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          แจ้งเตือนการอนุมัติใบขอซื้อสำหรับ{getRoleDisplayName(role || '')}
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาการแจ้งเตือน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter by Type */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="กรองตามประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
              <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
              <SelectItem value="status_update">อัปเดตสถานะ</SelectItem>
              <SelectItem value="approval_request">ขออนุมัติ</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-auto">
              <SelectValue placeholder="เรียงตาม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">ใหม่ล่าสุด</SelectItem>
              <SelectItem value="oldest">เก่าที่สุด</SelectItem>
              <SelectItem value="unread">ยังไม่อ่าน</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Results Summary */}
        {filteredAndSortedItems.length !== items.length && (
          <div className="text-sm text-muted-foreground">
            แสดง {filteredAndSortedItems.length} จาก {items.length} รายการ
          </div>
        )}
      </div>

      <div className="space-y-4">
        {paginatedItems.map((n) => (
          <Card
            key={n.id}
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
              !n.read ? 'bg-primary/5' : 'bg-background'
            }`}
            onClick={() => markReadAndGo(n)}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <Badge variant="primary" appearance="light" className="text-xs px-2 py-0.5">
                          ใหม่
                        </Badge>
                      )}
                      <Badge 
                        variant={
                          n.kind === 'approved' ? 'success' :
                          n.kind === 'rejected' ? 'destructive' :
                          n.kind === 'status_update' ? 'info' :
                          'warning'
                        } 
                        appearance="light" 
                        className="text-xs px-2 py-0.5"
                      >
                        {n.kind === 'approved' ? 'อนุมัติแล้ว' :
                         n.kind === 'rejected' ? 'ไม่อนุมัติ' :
                         n.kind === 'status_update' ? 'อัปเดตสถานะ' :
                         'ขออนุมัติ'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {fmt(n.createdAt)}
                    </div>
                  </div>
                  
                  <h3 className={`text-base font-semibold mb-3 ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {n.orderNo ? `#${n.orderNo} - ${n.title}` : n.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">จาก: {n.fromUserName || 'ระบบ'}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-medium">{getRoleDisplayName(role || '')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedItems.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">แสดง</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              className="border border-input bg-background rounded-md px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-muted-foreground">รายการต่อหน้า</span>
          </div>

          <div className="text-sm text-muted-foreground">
            แสดง {startIndex + 1} - {Math.min(endIndex, filteredAndSortedItems.length)} จาก {filteredAndSortedItems.length} รายการ
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              ก่อนหน้า
            </Button>

            <div className="flex items-center gap-1">
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                if (startPage > 1) {
                  pages.push(
                    <Button
                      key={1}
                      variant={currentPage === 1 ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      className="w-8 h-8 p-0"
                    >
                      1
                    </Button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis1" className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(i)}
                      className="w-8 h-8 p-0"
                    >
                      {i}
                    </Button>
                  );
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis2" className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  pages.push(
                    <Button
                      key={totalPages}
                      variant={currentPage === totalPages ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  );
                }

                return pages;
              })()}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ถัดไป
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}