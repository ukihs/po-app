"use client";

import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase/client';
import { createOrder, grandTotal, toNum, type ItemType } from '../../lib/poApi';
import type { Item } from '../../lib/poApi';
import { Plus, Trash2, Package, Calendar as CalendarIcon } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle, AlertDescription } from '../ui/alert';
import { 
  RiCheckboxCircleFill, 
  RiErrorWarningFill, 
  RiSpam3Fill, 
  RiInformationFill 
} from '@remixicon/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../ui/empty';
import { DatePickerDefault } from '../ui/date-picker-default';
import { cn } from '../../lib/utils';

export default function CreateOrderPage() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [requester, setRequester] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedItemDate, setSelectedItemDate] = useState<Date | undefined>();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newItem, setNewItem] = useState<Omit<Item, 'no'>>({
    description: '',
    receivedDate: '',
    quantity: '',
    amount: '',
    itemType: 'วัตถุดิบ'
  });

  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    description?: string;
  }>({
    show: false,
    type: 'info',
    title: '',
    description: ''
  });

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    
    const defaultRequester = u.displayName || (u.email ?? '').split('@')[0];
    setRequester(defaultRequester);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const defaultRequester = user.displayName || (user.email ?? '').split('@')[0];
        setRequester(defaultRequester);
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedItemDate) {
      setNewItem(prev => ({ 
        ...prev, 
        receivedDate: selectedItemDate.toISOString().split('T')[0] 
      }));
    }
  }, [selectedItemDate]);

  const showAlert = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', description?: string) => {
    setAlertState({
      show: true,
      type,
      title: message,
      description
    });

    // Auto-hide after duration
    const duration = type === 'error' ? 5000 : 4000;
    setTimeout(() => {
      setAlertState(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          variant: 'success' as const,
          appearance: 'light' as const,
          IconComponent: RiCheckboxCircleFill
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          appearance: 'light' as const,
          IconComponent: RiErrorWarningFill
        };
      case 'warning':
        return {
          variant: 'warning' as const,
          appearance: 'light' as const,
          IconComponent: RiSpam3Fill
        };
      case 'info':
      default:
        return {
          variant: 'info' as const,
          appearance: 'light' as const,
          IconComponent: RiInformationFill
        };
    }
  };

  const openAddModal = () => {
    setNewItem({
      description: '',
      receivedDate: '',
      quantity: '',
      amount: '',
      itemType: 'วัตถุดิบ'
    });
    setSelectedItemDate(undefined);
    setShowModal(true);
  };

  const isModalFormValid = () => {
    return newItem.description.trim() && 
           newItem.receivedDate.trim() &&  
           toNum(newItem.quantity) > 0 && 
           toNum(newItem.amount) > 0;
  };

  const addItemFromModal = () => {
    if (!isModalFormValid()) {
      if (!newItem.description.trim()) {
        showAlert('กรุณาระบุรายละเอียดสินค้า', 'error');
      } else if (!newItem.receivedDate.trim()) {
        showAlert('กรุณาเลือกวันที่ต้องการรับ', 'error');
      } else if (toNum(newItem.quantity) <= 0) {
        showAlert('กรุณาระบุจำนวนที่ถูกต้อง', 'error');
      } else if (toNum(newItem.amount) <= 0) {
        showAlert('กรุณาระบุราคาที่ถูกต้อง', 'error');
      }
      return;
    }

    const itemToAdd: Item = {
      no: items.length + 1,
      ...newItem,
      itemType: 'วัตถุดิบ'
    };
    
    setItems(prev => [...prev, itemToAdd]);
    setShowModal(false);
    setNewItem({
      description: '',
      receivedDate: '',
      quantity: '',
      amount: '',
      itemType: 'วัตถุดิบ'
    });
    setSelectedItemDate(undefined);
  };

  const closeModal = () => {
    setShowModal(false);
    setNewItem({
      description: '',
      receivedDate: '',
      quantity: '',
      amount: '',
      itemType: 'วัตถุดิบ'
    });
    setSelectedItemDate(undefined);
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, no: i + 1 })));
  };

  const updateItem = (idx: number, field: keyof Omit<Item, 'no'>, value: string) => {
    setItems(prev => prev.map((item, i) => 
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const isFormValid = () => {
    if (!requester.trim()) return false;
    
    if (items.length === 0) return false;
    
    return !items.some(item => 
      !item.description.trim() || 
      toNum(item.quantity) <= 0 || 
      toNum(item.amount) <= 0
    );
  };

  const getValidationMessage = () => {
    if (!requester.trim()) return 'กรุณาระบุชื่อผู้ขอซื้อ';
    if (items.length === 0) return 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ';
    
    const invalidItem = items.find(item => 
      !item.description.trim() || 
      toNum(item.quantity) <= 0 || 
      toNum(item.amount) <= 0
    );
    
    if (invalidItem) {
      const itemIndex = items.indexOf(invalidItem) + 1;
      if (!invalidItem.description.trim()) return `รายการที่ ${itemIndex}: กรุณาระบุรายละเอียดสินค้า`;
      if (toNum(invalidItem.quantity) <= 0) return `รายการที่ ${itemIndex}: กรุณาระบุจำนวนที่ถูกต้อง`;
      if (toNum(invalidItem.amount) <= 0) return `รายการที่ ${itemIndex}: กรุณาระบุราคาที่ถูกต้อง`;
    }
    
    return '';
  };

  const showConfirmation = () => {
    setSubmitted(true);
    if (!isFormValid()) {
      showAlert(getValidationMessage(), 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmCreate = async () => {
    try {
      setSaving(true);
      setShowConfirmModal(false);
      const itemsWithType = items.map(item => ({ ...item, itemType: 'วัตถุดิบ' as ItemType }));
      const dateString = selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
      await createOrder({ date: dateString, requesterName: requester, items: itemsWithType });
      
      showAlert('สร้างใบขอซื้อและส่งขออนุมัติเรียบร้อยแล้ว', 'success');
      
      setRequester('');
      setItems([]);
      setSelectedDate(new Date());
      setSubmitted(false);
    } catch (e: any) {
      showAlert('ไม่สามารถสร้างใบขอซื้อได้', 'error', e?.message ?? 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ');
    } finally {
      setSaving(false);
    }
  };

  const cancelCreate = () => {
    setShowConfirmModal(false);
    setSaving(false);
  };

  return (
    <div className="w-full">
      {alertState.show && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert 
            variant={getAlertConfig(alertState.type).variant}
            appearance={getAlertConfig(alertState.type).appearance}
            close
            onClose={() => setAlertState(prev => ({ ...prev, show: false }))}
          >
            <AlertIcon>
              {React.createElement(getAlertConfig(alertState.type).IconComponent, { className: "h-4 w-4" })}
            </AlertIcon>
            <AlertTitle>{alertState.title}</AlertTitle>
            {alertState.description && (
              <AlertDescription>{alertState.description}</AlertDescription>
            )}
          </Alert>
        </div>
      )}
      
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <Package className="w-6 h-6 sm:w-8 sm:h-8 text-[#2b9ccc]" />
          สร้างใบขอซื้อ
        </h1>
        
      </div>
      
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              เพิ่มรายการสินค้า
            </DialogTitle>
            <DialogDescription>
              กรอกข้อมูลรายการสินค้าที่ต้องการขอซื้อ
            </DialogDescription>
          </DialogHeader>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                รายการที่ขอซื้อ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="description"
                type="text"
                placeholder="ระบุรายละเอียดสินค้า"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                required
                minLength={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                วันที่ต้องการรับ <span className="text-destructive">*</span>
              </Label>
              <DatePickerDefault
                date={selectedItemDate}
                onDateChange={setSelectedItemDate}
                placeholder="เลือกวันที่ต้องการรับ"
                className="w-full"
                showReset={true}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">
                  จำนวน <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="จำนวน"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  ราคาต่อหน่วย (บาท) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="ราคา"
                  value={newItem.amount}
                  onChange={(e) => setNewItem(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>
          </form>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={closeModal} 
              className="font-normal w-full sm:w-auto"
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={addItemFromModal}
              disabled={!isModalFormValid()}
              variant="primary"
              className="font-normal w-full sm:w-auto"
            >
              เพิ่มรายการ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">วันที่ขอซื้อ</Label>
              <DatePickerDefault
                date={selectedDate}
                onDateChange={setSelectedDate}
                placeholder="เลือกวันที่"
                className="w-full"
                showReset={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requester" className="text-sm font-medium">
                ชื่อผู้ขอซื้อ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="requester"
                placeholder="ชื่อผู้ขอซื้อ"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                required
                minLength={1}
              />
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold">รายการสินค้า</h3>
              <Button 
                type="button" 
                variant="outline"
                onClick={openAddModal}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[800px] sm:min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 sm:w-20 text-center text-xs sm:text-sm">ลำดับ</TableHead>
                      <TableHead className="w-auto min-w-[180px] sm:min-w-[250px] text-xs sm:text-sm">รายการที่ขอซื้อ</TableHead>
                      <TableHead className="w-32 sm:w-40 text-xs sm:text-sm">วันที่ต้องการรับ</TableHead>
                      <TableHead className="w-24 sm:w-28 text-center text-xs sm:text-sm">จำนวน</TableHead>
                      <TableHead className="w-28 sm:w-36 text-center text-xs sm:text-sm">ราคา (บาท)</TableHead>
                      <TableHead className="w-28 sm:w-32 text-center text-xs sm:text-sm">รวม (บาท)</TableHead>
                      <TableHead className="w-16 sm:w-20 text-center text-xs sm:text-sm">ลบ</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {items.map((item, idx) => {
                    const total = toNum(item.quantity) * toNum(item.amount);
                    const hasError = submitted && (!item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);
                    
                    return (
                      <TableRow key={idx} className={hasError ? 'bg-destructive/10' : ''}>
                        <TableCell className="text-center w-16 sm:w-20 text-xs sm:text-sm">{item.no}</TableCell>
                        
                        <TableCell className="w-auto min-w-[180px] sm:min-w-[250px]">
                          <Input
                            type="text"
                            placeholder="ระบุรายละเอียดสินค้า"
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            className={`h-8 text-xs sm:text-sm ${hasError && !item.description.trim() ? 'border-destructive' : ''}`}
                          />
                        </TableCell>
                        
                        <TableCell className="w-32 sm:w-40">
                          <Input
                            type="date"
                            value={item.receivedDate}
                            onChange={(e) => updateItem(idx, 'receivedDate', e.target.value)}
                            className="h-8 text-xs sm:text-sm"
                          />
                        </TableCell>
                        
                        <TableCell className="w-24 sm:w-28">
                          <Input
                            type="number"
                            placeholder="จำนวน"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            className={`h-8 text-center text-xs sm:text-sm ${hasError && toNum(item.quantity) <= 0 ? 'border-destructive' : ''}`}
                            min="0.01"
                            step="0.01"
                          />
                        </TableCell>
                        
                        <TableCell className="w-28 sm:w-36">
                          <Input
                            type="number"
                            placeholder="ราคา"
                            value={item.amount}
                            onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                            className={`h-8 text-center text-xs sm:text-sm ${hasError && toNum(item.amount) <= 0 ? 'border-destructive' : ''}`}
                            min="0.01"
                            step="0.01"
                          />
                        </TableCell>
                        
                        <TableCell className="text-center w-28 sm:w-32 text-xs sm:text-sm font-medium">
                          {total > 0 ? total.toLocaleString('th-TH') : '0'}
                        </TableCell>
                        
                        <TableCell className="text-center w-16 sm:w-20">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(idx)}
                            className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
              
              {items.length === 0 && (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Package className="w-6 h-6" />
                    </EmptyMedia>
                    <EmptyTitle>ยังไม่มีรายการสินค้า</EmptyTitle>
                    <EmptyDescription>
                      คลิกปุ่ม "เพิ่มรายการ" เพื่อเพิ่มรายการสินค้าที่ต้องการขอซื้อ
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
          </div>

          <Separator />
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-sm sm:text-base block sm:inline">รวมเป็นเงินจำนวน : </span>
              <span className="text-xl sm:text-lg font-bold text-primary block sm:inline mt-1 sm:mt-0">
                {grandTotal(items).toLocaleString('th-TH')} บาท
              </span>
            </div>
            <Button
              type="button"
              onClick={showConfirmation}
              disabled={saving || !isFormValid()}
              variant="primary"
              className="font-normal w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">กำลังบันทึก...</span>
                  <span className="sm:hidden">บันทึก...</span>
                </>
              ) : (
                'สร้างใบขอซื้อ'
              )}
            </Button>
          </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-6 h-6" />
              ยืนยันการสร้างใบขอซื้อ
            </DialogTitle>
            <DialogDescription>
              กรุณาตรวจสอบข้อมูลก่อนยืนยันการสร้างใบขอซื้อ
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-muted rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">ข้อมูลผู้ขอซื้อ</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <span className="text-xs sm:text-sm text-muted-foreground">วันที่ขอซื้อ:</span>
                  <p className="font-medium text-sm sm:text-base">{selectedDate ? selectedDate.toLocaleDateString('th-TH') : 'ยังไม่เลือกวันที่'}</p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-muted-foreground">ชื่อผู้ขอซื้อ:</span>
                  <p className="font-medium text-sm sm:text-base">{requester}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base">รายการสินค้า ({items.length} รายการ)</h4>
              <div className="overflow-x-auto max-h-60">
                <Table className="min-w-[600px] sm:min-w-full">
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-16 text-center text-xs sm:text-sm">ลำดับ</TableHead>
                      <TableHead className="w-auto min-w-[150px] sm:min-w-[200px] text-xs sm:text-sm">รายการ</TableHead>
                      <TableHead className="w-32 sm:w-40 text-xs sm:text-sm">วันที่ต้องการรับ</TableHead>
                      <TableHead className="w-20 sm:w-28 text-center text-xs sm:text-sm">จำนวน</TableHead>
                      <TableHead className="w-24 sm:w-36 text-center text-xs sm:text-sm">ราคา</TableHead>
                      <TableHead className="w-24 sm:w-32 text-center text-xs sm:text-sm">รวม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="w-16 text-center text-xs sm:text-sm">{item.no}</TableCell>
                        <TableCell className="w-auto min-w-[150px] sm:min-w-[200px] max-w-xs truncate text-xs sm:text-sm" title={item.description}>
                          {item.description}
                        </TableCell>
                        <TableCell className="w-32 sm:w-40 text-xs sm:text-sm">
                          {item.receivedDate ? new Date(item.receivedDate).toLocaleDateString('th-TH') : '-'}
                        </TableCell>
                        <TableCell className="w-20 sm:w-28 text-center text-xs sm:text-sm">{toNum(item.quantity).toLocaleString('th-TH')}</TableCell>
                        <TableCell className="w-24 sm:w-36 text-center text-xs sm:text-sm">{toNum(item.amount).toLocaleString('th-TH')}</TableCell>
                        <TableCell className="w-24 sm:w-32 text-center font-medium text-xs sm:text-sm">
                          {(toNum(item.quantity) * toNum(item.amount)).toLocaleString('th-TH')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                <span className="text-sm sm:text-base font-semibold">รวมเป็นเงินทั้งสิ้น:</span>
                <span className="text-xl sm:text-lg font-bold text-primary">
                  {grandTotal(items).toLocaleString('th-TH')} บาท
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={cancelCreate}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={confirmCreate}
              disabled={saving}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">กำลังสร้างใบขอซื้อ...</span>
                  <span className="sm:hidden">กำลังสร้าง...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">ยืนยันและส่งขออนุมัติ</span>
                  <span className="sm:hidden">ยืนยันและส่ง</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}