"use client";

import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase/client';
import { createOrder, grandTotal, toNum, type ItemType } from '../../lib/poApi';
import type { Item } from '../../lib/poApi';
import { Plus, Trash2, Package, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../ui/sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
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
        toast.error('กรุณาระบุรายละเอียดสินค้า');
      } else if (!newItem.receivedDate.trim()) {
        toast.error('กรุณาเลือกวันที่ต้องการรับ');
      } else if (toNum(newItem.quantity) <= 0) {
        toast.error('กรุณาระบุจำนวนที่ถูกต้อง');
      } else if (toNum(newItem.amount) <= 0) {
        toast.error('กรุณาระบุราคาที่ถูกต้อง');
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
      toast.error(getValidationMessage());
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
      window.location.href = '/orders/tracking';
    } catch (e: any) {
      toast.error(e?.message ?? 'บันทึกใบสั่งซื้อไม่สำเร็จ');
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
      <Toaster />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Package className="w-8 h-8 text-[#2b9ccc]" />
          สร้างใบขอซื้อ
        </h1>
        <p className="text-muted-foreground">
          สร้างใบขอซื้อใหม่สำหรับการสั่งซื้อสินค้า
        </p>
      </div>
      
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-normal",
                      !selectedItemDate && "text-muted-foreground"
                    )}
                  >
                    {selectedItemDate ? (
                      selectedItemDate.toLocaleDateString('th-TH')
                    ) : (
                      "เลือกวันที่ต้องการรับ"
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedItemDate}
                    onSelect={setSelectedItemDate}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="font-normal">
              ยกเลิก
            </Button>
            <Button 
              onClick={addItemFromModal}
              disabled={!isModalFormValid()}
              className="bg-[#6EC1E4] hover:bg-[#2b9ccc] font-normal"
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    {selectedDate ? (
                      selectedDate.toLocaleDateString('th-TH')
                    ) : (
                      "เลือกวันที่"
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">รายการสินค้า</h3>
              <Button 
                type="button" 
                variant="default"
                onClick={openAddModal}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ลำดับที่</TableHead>
                    <TableHead>รายการที่ขอซื้อ</TableHead>
                    <TableHead>วันที่ต้องการรับ</TableHead>
                    <TableHead>จำนวน</TableHead>
                    <TableHead>จำนวนเงิน (บาท)</TableHead>
                    <TableHead>รวม (บาท)</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => {
                    const total = toNum(item.quantity) * toNum(item.amount);
                    const hasError = submitted && (!item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);
                    
                    return (
                      <TableRow key={idx} className={hasError ? 'bg-destructive/10' : ''}>
                        <TableCell className="text-center">{item.no}</TableCell>
                        
                        <TableCell>
                          <Input
                            type="text"
                            placeholder="ระบุรายละเอียดสินค้า"
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            className={`h-8 ${hasError && !item.description.trim() ? 'border-destructive' : ''}`}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Input
                            type="date"
                            value={item.receivedDate}
                            onChange={(e) => updateItem(idx, 'receivedDate', e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="จำนวน"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            className={`h-8 text-right ${hasError && toNum(item.quantity) <= 0 ? 'border-destructive' : ''}`}
                            min="0.01"
                            step="0.01"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="ราคา"
                            value={item.amount}
                            onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                            className={`h-8 text-right ${hasError && toNum(item.amount) <= 0 ? 'border-destructive' : ''}`}
                            min="0.01"
                            step="0.01"
                          />
                        </TableCell>
                        
                        <TableCell className="text-right">
                          {total > 0 ? total.toLocaleString('th-TH') : '0'}
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(idx)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {items.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    <Package className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">ยังไม่มีรายการสินค้า</h3>
                  <p className="font-normal text-muted-foreground mb-4">คลิกปุ่ม "เพิ่มรายการ" เพื่อเพิ่มรายการสินค้าที่ต้องการขอซื้อ</p>
                </div>
              )}
            </div>
          </div>

          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="text-lg">
              <span className="text-base">รวมเป็นเงินจำนวน : </span>
              <span className="text-lg font-bold text-[#6EC1E4]">
                {grandTotal(items).toLocaleString('th-TH')} บาท
              </span>
            </div>
            <Button
              type="button"
              onClick={showConfirmation}
              disabled={saving || !isFormValid()}
              className="bg-[#6EC1E4] hover:bg-[#2b9ccc] font-normal"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-6 h-6" />
              ยืนยันการสร้างใบขอซื้อ
            </DialogTitle>
            <DialogDescription>
              กรุณาตรวจสอบข้อมูลก่อนยืนยันการสร้างใบขอซื้อ
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-3">ข้อมูลผู้ขอซื้อ</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">วันที่ขอซื้อ:</span>
                  <p className="font-medium">{selectedDate ? selectedDate.toLocaleDateString('th-TH') : 'ยังไม่เลือกวันที่'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">ชื่อผู้ขอซื้อ:</span>
                  <p className="font-medium">{requester}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">รายการสินค้า ({items.length} รายการ)</h4>
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0">
                    <TableRow>
                      <TableHead>ลำดับ</TableHead>
                      <TableHead>รายการ</TableHead>
                      <TableHead>วันที่ต้องการรับ</TableHead>
                      <TableHead>จำนวน</TableHead>
                      <TableHead>ราคา</TableHead>
                      <TableHead className="text-right">รวม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.no}</TableCell>
                        <TableCell className="max-w-xs truncate" title={item.description}>
                          {item.description}
                        </TableCell>
                        <TableCell>
                          {item.receivedDate ? new Date(item.receivedDate).toLocaleDateString('th-TH') : '-'}
                        </TableCell>
                        <TableCell>{toNum(item.quantity).toLocaleString('th-TH')}</TableCell>
                        <TableCell>{toNum(item.amount).toLocaleString('th-TH')}</TableCell>
                        <TableCell className="text-right font-medium">
                          {(toNum(item.quantity) * toNum(item.amount)).toLocaleString('th-TH')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="bg-[#c3e4f4] rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold">รวมเป็นเงินทั้งสิ้น:</span>
                <span className="text-lg font-bold text-[#6EC1E4]">
                  {grandTotal(items).toLocaleString('th-TH')} บาท
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={cancelCreate}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={confirmCreate}
              disabled={saving}
              className="bg-[#6EC1E4] hover:bg-[#2b9ccc]"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังสร้างใบขอซื้อ...
                </>
              ) : (
                'ยืนยันและส่งขออนุมัติ'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}