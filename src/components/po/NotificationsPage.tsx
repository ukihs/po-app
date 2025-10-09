"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useNotifications, useUnreadCount, useNotificationsLoading, useNotificationsError, useNotificationsStore, useRole, useUser } from '../../stores';
import type { Notification, UserRole } from '../../types';
import { ROLE_DISPLAY_NAMES } from '../../lib/constants';
import { getDisplayOrderNumber } from '../../lib/order-utils';
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
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../ui/empty';

type Noti = Notification & { id: string };

const formatDate = (() => {
  const cache = new Map<string, string>();
  
  return (ts: any): string => {
    if (!ts?.toDate) return '';
    
    const timestamp = ts.toDate().getTime();
    const cacheKey = timestamp.toString();
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }
    
    const formatted = ts.toDate().toLocaleString('th-TH', { 
      dateStyle: 'short', 
      timeStyle: 'medium' 
    });
    
    cache.set(cacheKey, formatted);
    setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
    
    return formatted;
  };
})();

const getRoleDisplayName = (role: string) => {
  return ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role;
};

const NotificationCard = React.memo(({ 
  notification, 
  onMarkReadAndGo, 
  formatDate,
  currentUserUid
}: { 
  notification: Noti; 
  onMarkReadAndGo: (n: Noti) => void;
  formatDate: (ts: any) => string;
  currentUserUid?: string;
}) => {
  const n = notification;
  const isUnread = currentUserUid ? !n.readBy?.includes(currentUserUid) : false;
  
  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
        isUnread ? 'bg-primary/5' : 'bg-background'
      }`}
      onClick={() => onMarkReadAndGo(n)}
    >
      <CardContent className="px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {isUnread && (
                  <Badge variant="primary" appearance="light" className="text-xs px-1.5 sm:px-2 py-0.5">
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
                  className="text-xs px-1.5 sm:px-2 py-0.5"
                >
                  {n.kind === 'approved' ? 'อนุมัติแล้ว' :
                   n.kind === 'rejected' ? 'ไม่อนุมัติ' :
                   n.kind === 'status_update' ? 'อัปเดตสถานะ' :
                   'ขออนุมัติ'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground/70 font-normal">
                {formatDate(n.createdAt)}
              </div>
            </div>
            
            <h3 className={`text-sm sm:text-base font-semibold mb-2 sm:mb-3 ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
              {n.orderNo ? `${n.title} (${getDisplayOrderNumber({ orderNo: n.orderNo, date: n.createdAt?.toDate?.()?.toISOString().split('T')[0] || '' })})` : n.title}
            </h3>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="font-medium">จากคุณ {n.fromUserName || 'ระบบ'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default function NotificationsPage() {
  const notifications = useNotifications();
  const loading = useNotificationsLoading();
  const error = useNotificationsError();
  const { markAsRead, markAllAsRead } = useNotificationsStore();
  const role = useRole();
  const user = useUser();
  const unreadCount = useUnreadCount(user?.uid);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  const searchTerms = useMemo(() => {
    if (!searchTerm) return null;
    return searchTerm.toLowerCase().trim();
  }, [searchTerm]);

  const filteredAndSortedItems = useMemo(() => {
    if (!notifications.length) return [];

    let filtered = notifications;

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.kind === filterType);
    }

    if (searchTerms) {
      filtered = filtered.filter(item => {
        const title = item.title.toLowerCase();
        const message = item.message?.toLowerCase() || '';
        const fromUser = item.fromUserName?.toLowerCase() || '';
        
        const orderNumber = item.orderNo ? 
          getDisplayOrderNumber({ 
            orderNo: item.orderNo, 
            date: item.createdAt?.toDate?.()?.toISOString().split('T')[0] || '' 
          }).toLowerCase() : '';
        
        return title.includes(searchTerms) ||
               message.includes(searchTerms) ||
               fromUser.includes(searchTerms) ||
               orderNumber.includes(searchTerms);
      });
    }

    filtered.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
      const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
      
      if (sortBy === 'newest') {
        return timeB - timeA;
      } else if (sortBy === 'oldest') {
        return timeA - timeB;
      } else if (sortBy === 'unread') {
        const aRead = user?.uid ? a.readBy?.includes(user.uid) : false;
        const bRead = user?.uid ? b.readBy?.includes(user.uid) : false;
        if (aRead === bRead) return timeB - timeA;
        return aRead ? 1 : -1;
      }
      return timeB - timeA;
    });

    return filtered;
  }, [notifications, searchTerms, filterType, sortBy]);
  
  const totalPages = useMemo(
    () => Math.ceil(filteredAndSortedItems.length / itemsPerPage),
    [filteredAndSortedItems.length, itemsPerPage]
  );
  
  const paginatedItems = useMemo(
    () => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredAndSortedItems.slice(startIndex, endIndex);
    },
    [filteredAndSortedItems, currentPage, itemsPerPage]
  );

  const markReadAndGo = async (n: Noti) => {
    try {
      if (user?.uid && !n.readBy?.includes(user.uid)) {
        await markAsRead(n.id, user.uid);
      }
      
      const basePath = role === 'procurement' ? '/orders/list' : '/orders/tracking';
      const navigateTo = n.orderId ? `${basePath}#order-${n.orderId}` : basePath;
      
      import('astro:transitions/client')
        .then(({ navigate }) => navigate(navigateTo))
        .catch(() => {
          window.location.href = navigateTo;
        });
    } catch (e) {
      console.error(e);
      const basePath = role === 'procurement' ? '/orders/list' : '/orders/tracking';
      const navigateTo = n.orderId ? `${basePath}#order-${n.orderId}` : basePath;
      
      import('astro:transitions/client')
        .then(({ navigate }) => navigate(navigateTo))
        .catch(() => {
          window.location.href = navigateTo;
        });
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

  if (error && /requires an index/i.test(error)) {
    return (
      <div className="w-full">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
            <div className="text-sm mt-2">
              {error}
              <br />
              ถ้า error มีคำว่า requires an index ให้คลิกลิงก์ในข้อความนั้นเพื่อสร้าง Index แล้วรีเฟรชใหม่อีกครั้ง
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="w-full">        
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>ยังไม่มีการแจ้งเตือน</EmptyTitle>
            <EmptyDescription>
              การแจ้งเตือนต่างๆ เกี่ยวกับการอนุมัติใบขอซื้อและอัปเดตสถานะจะแสดงที่นี่
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!filteredAndSortedItems.length && notifications.length > 0) {
    return (
      <div className="w-full">
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-[#2b9ccc]" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">ข้อความแจ้งเตือน</h1>
                {unreadCount > 0 && (
                  <Badge variant="primary" appearance="light" className="mt-1 text-xs sm:text-sm">
                    {unreadCount} รายการใหม่
                  </Badge>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  if (user?.uid) {
                    markAllAsRead(user.uid);
                  }
                }}
                className="w-full sm:w-auto"
                size="sm"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">อ่านทั้งหมด</span>
                <span className="sm:hidden">อ่านแล้วทั้งหมด</span>
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาการแจ้งเตือน"
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
        
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>ไม่พบการแจ้งเตือนที่ตรงตามเงื่อนไข</EmptyTitle>
            <EmptyDescription>
              ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูการแจ้งเตือนอื่นๆ
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
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
          </EmptyContent>
        </Empty>
      </div>
    );
  }


  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-[#2b9ccc]" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">ข้อความแจ้งเตือน</h1>
              {unreadCount > 0 && (
                <Badge variant="primary" appearance="light" className="mt-1 text-xs sm:text-sm">
                  {unreadCount} รายการใหม่
                </Badge>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => {
                if (user?.uid) {
                  markAllAsRead(user.uid);
                }
              }}
              className="w-full sm:w-auto"
              size="sm"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">อ่านทั้งหมด</span>
              <span className="sm:hidden">อ่านแล้วทั้งหมด</span>
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-[280px]">
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
        
        {filteredAndSortedItems.length !== notifications.length && (
          <div className="text-xs sm:text-sm text-muted-foreground">
            แสดง {filteredAndSortedItems.length} จาก {notifications.length} รายการ
          </div>
        )}
      </div>

      <div className="space-y-4">
        {paginatedItems.map((n) => (
          <NotificationCard 
            key={n.id} 
            notification={n} 
            onMarkReadAndGo={markReadAndGo}
            formatDate={formatDate}
            currentUserUid={user?.uid}
          />
        ))}
      </div>

      {filteredAndSortedItems.length > 0 && (
        <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <span className="text-xs sm:text-sm text-muted-foreground">แสดง</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="border border-input bg-background rounded-md px-2 py-1 text-xs sm:text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs sm:text-sm text-muted-foreground">รายการต่อหน้า</span>
            </div>

            <div className="text-xs sm:text-sm text-muted-foreground">
              แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length)} จาก {filteredAndSortedItems.length} รายการ
            </div>

            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 sm:h-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">ก่อนหน้า</span>
              </Button>

              <div className="flex items-center gap-0.5 sm:gap-1">
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
                        className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                      >
                        1
                      </Button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span key="ellipsis1" className="px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
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
                        className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                      >
                        {i}
                      </Button>
                    );
                  }

                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="ellipsis2" className="px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
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
                        className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
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
                className="text-xs h-7 sm:h-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span className="hidden sm:inline">ถัดไป</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}