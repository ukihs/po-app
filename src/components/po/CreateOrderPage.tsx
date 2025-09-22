import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase/client';
import { createOrder, grandTotal, toNum, type ItemType } from '../../lib/poApi';
import type { Item } from '../../lib/poApi';
import { Plus, Trash2, Package, Calendar, Info } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

export default function CreateOrderPage() {
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [requester, setRequester] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [showItemDatePicker, setShowItemDatePicker] = useState(false);
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
    setRequester(u.displayName || (u.email ?? '').split('@')[0]);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate.toISOString().split('T')[0]);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedItemDate) {
      setNewItem(prev => ({ 
        ...prev, 
        receivedDate: selectedItemDate.toISOString().split('T')[0] 
      }));
    }
  }, [selectedItemDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown') && !target.closest('button[style*="anchor-name"]')) {
        setShowDatePicker(false);
        setShowItemDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openAddModal = () => {
    setNewItem({
      description: '',
      receivedDate: '',
      quantity: '',
      amount: '',
      itemType: 'วัตถุดิบ'
    });
    setSelectedItemDate(undefined);
    setShowItemDatePicker(false);
    setShowModal(true);
  };

  const isModalFormValid = () => {
    return newItem.description.trim() && 
           newItem.receivedDate.trim() &&  
           toNum(newItem.quantity) > 0 && 
           toNum(newItem.amount) > 0;
  };

  const checkFormValidity = () => {
    const form = document.querySelector('form');
    return form ? form.checkValidity() : true;
  };

  const addItemFromModal = () => {
    if (!isModalFormValid()) {
      if (!newItem.description.trim()) {
        alert('กรุณาระบุรายละเอียดสินค้า');
      } else if (!newItem.receivedDate.trim()) {
        alert('กรุณาเลือกวันที่ต้องการรับ');
      } else if (toNum(newItem.quantity) <= 0) {
        alert('กรุณาระบุจำนวนที่ถูกต้อง');
      } else if (toNum(newItem.amount) <= 0) {
        alert('กรุณาระบุราคาที่ถูกต้อง');
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
    setShowItemDatePicker(false);
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
    setShowItemDatePicker(false);
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
      alert(getValidationMessage());
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmCreate = async () => {
    try {
      setSaving(true);
      setShowConfirmModal(false);
      const itemsWithType = items.map(item => ({ ...item, itemType: 'วัตถุดิบ' as ItemType }));
      await createOrder({ date, requesterName: requester, items: itemsWithType });
      window.location.href = '/orders/tracking';
    } catch (e: any) {
      alert(e?.message ?? 'บันทึกใบสั่งซื้อไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const cancelCreate = () => {
    setShowConfirmModal(false);
    setSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <dialog id="add_item_modal" className={`modal ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            เพิ่มรายการสินค้า
          </h3>
          
          <form className="space-y-4" noValidate>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">รายการที่ขอซื้อ</span>
              </label>
              <input
                type="text"
                className="input input-bordered validator w-full"
                placeholder="ระบุรายละเอียดสินค้า"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                required
                minLength={1}
                title="กรุณาระบุรายละเอียดสินค้า"
              />
              <div className="validator-hint">กรุณาระบุรายละเอียดสินค้า</div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">วันที่ต้องการรับ <span className="text-error">*</span></span>
              </label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowItemDatePicker(!showItemDatePicker)}
                  className={`input input-bordered w-full flex items-center justify-between text-left ${
                    !newItem.receivedDate.trim() ? 'border-error text-error' : 'border-success text-success'
                  }`}
                  style={{ anchorName: "--item-date" } as React.CSSProperties}
                >
                  <span className={!selectedItemDate ? 'text-gray-500' : ''}>
                    {selectedItemDate ? selectedItemDate.toLocaleDateString('th-TH') : 'เลือกวันที่ต้องการรับ *'}
                  </span>
                  <Calendar className="w-4 h-4" />
                </button>
                {showItemDatePicker && (
                  <div 
                    className="dropdown absolute top-full left-0 mt-2 bg-base-100 rounded-box shadow-lg border z-50"
                    style={{ positionAnchor: "--item-date" } as React.CSSProperties}
                  >
                    <DayPicker 
                      className="react-day-picker p-4" 
                      mode="single" 
                      selected={selectedItemDate} 
                      onSelect={(date) => {
                        setSelectedItemDate(date);
                        setShowItemDatePicker(false);
                      }}
                    />
                  </div>
                )}
                {!newItem.receivedDate.trim() && (
                  <div className="text-error text-xs font-normal mt-1">กรุณาเลือกวันที่ต้องการรับ</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">จำนวน</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered validator w-full"
                  placeholder="จำนวน"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                  min="0.01"
                  step="0.01"
                  title="กรุณาระบุจำนวนอย่างน้อย 1 จำนวน"
                />
                <div className="validator-hint">กรุณาระบุจำนวน</div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">ราคาต่อหน่วย (บาท)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered validator w-full"
                  placeholder="ราคา"
                  value={newItem.amount}
                  onChange={(e) => setNewItem(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  min="0.01"
                  step="0.01"
                  title="กรุณาระบุราคา"
                />
                <div className="validator-hint">กรุณาระบุราคา</div>
              </div>
            </div>

          </form>

          <div className="modal-action">
            <button className="btn font-normal" onClick={closeModal}>
              ยกเลิก
            </button>
            <button 
              className={`btn text-white ${
                !isModalFormValid() 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#6EC1E4] hover:bg-[#2b9ccc]'
              }`}
              onClick={addItemFromModal}
              disabled={!isModalFormValid()}
            >
              เพิ่มรายการ
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>close</button>
        </form>
      </dialog>

      <div className="card bg-base-100 shadow-xl">
        <form className="card-body" noValidate>
          <h2 className="card-title text-2xl mb-6">
            <Package className="w-6 h-6" />
            สร้างใบขอซื้อ
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">วันที่ขอซื้อ</span>
              </label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="input input-bordered w-full flex items-center justify-between text-left"
                  style={{ anchorName: "--order-date" } as React.CSSProperties}
                >
                  <span>
                    {selectedDate ? selectedDate.toLocaleDateString('th-TH') : 'เลือกวันที่'}
                  </span>
                  <Calendar className="w-4 h-4" />
                </button>
                {showDatePicker && (
                  <div 
                    className="dropdown absolute top-full left-0 mt-2 bg-base-100 rounded-box shadow-lg border z-50"
                    style={{ positionAnchor: "--order-date" } as React.CSSProperties}
                  >
                    <DayPicker 
                      className="react-day-picker p-4" 
                      mode="single" 
                      selected={selectedDate} 
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setShowDatePicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">ชื่อผู้ขอซื้อ</span>
              </label>
              <input
                className="input input-bordered validator w-full"
                placeholder="ชื่อผู้ขอซื้อ"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                required
                minLength={1}
                title="กรุณาระบุชื่อผู้ขอซื้อ"
              />
              <div className="validator-hint">กรุณาระบุชื่อผู้ขอซื้อ</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">รายการสินค้า</h3>
              <button 
                type="button" 
                onClick={openAddModal}
                className="btn btn-sm font-normal bg-white border-[#6EC1E4] hover:bg-[#6ec1e4]"
              >
                <Plus className="w-4 h-4" />
                เพิ่มรายการ
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>ลำดับที่</th>
                    <th>รายการที่ขอซื้อ</th>
                    <th>วันที่ต้องการรับ</th>
                    <th>จำนวน</th>
                    <th>จำนวนเงิน (บาท)</th>
                    <th>รวม (บาท)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const total = toNum(item.quantity) * toNum(item.amount);
                    const hasError = submitted && (!item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);
                    
                    return (
                      <tr key={idx} className={hasError ? 'bg-error/10' : ''}>
                        <td className="text-center font-normal">{item.no}</td>
                        
                        <td>
                          <input
                            type="text"
                            className="input input-sm input-bordered validator w-full"
                            placeholder="ระบุรายละเอียดสินค้า"
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            required
                            minLength={1}
                            title="กรุณาระบุรายละเอียดสินค้า"
                          />
                        </td>
                        
                        <td>
                          <input
                            type="date"
                            className="input input-sm input-bordered w-full"
                            value={item.receivedDate}
                            onChange={(e) => updateItem(idx, 'receivedDate', e.target.value)}
                          />
                        </td>
                        
                        <td>
                          <input
                            type="number"
                            className="input input-sm input-bordered validator w-full text-right"
                            placeholder="จำนวน"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            required
                            min="0.01"
                            step="0.01"
                            title="กรุณาระบุจำนวน"
                          />
                        </td>
                        
                        <td>
                          <input
                            type="number"
                            className="input input-sm input-bordered validator w-full text-right"
                            placeholder="ราคา"
                            value={item.amount}
                            onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                            required
                            min="0.01"
                            step="0.01"
                            title="กรุณาระบุราคา"
                          />
                        </td>
                        
                        <td className="text-right font-normal">
                          {total > 0 ? total.toLocaleString('th-TH') : '0'}
                        </td>
                        
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {items.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-base-content/100 mb-4">
                    <Package className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">ยังไม่มีรายการสินค้า</h3>
                  <p className="text-base-content/60 mb-4">คลิกปุ่ม "เพิ่มรายการ" เพื่อเพิ่มรายการสินค้าที่ต้องการขอซื้อ</p>
                </div>
              )}
            </div>
          </div>

          <div className="divider"></div>
          
          <div className="flex items-center justify-between">
            <div className="text-lg">
              <span className="text-base">รวมเป็นเงินจำนวน : </span>
              <span className="text-lg font-bold text-[#6EC1E4]">
                {grandTotal(items).toLocaleString('th-TH')} บาท
              </span>
            </div>
            <button
              type="button"
              onClick={showConfirmation}
              disabled={saving || !isFormValid()}
              className={`btn text-white ${
                !isFormValid() 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#6EC1E4] hover:bg-[#2b9ccc]'
              }`}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  กำลังบันทึก...
                </>
              ) : (
                'สร้างใบขอซื้อ'
              )}
            </button>
          </div>
        </form>
      </div>

      <dialog className={`modal ${showConfirmModal ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <Package className="w-6 h-6" />
            ยืนยันการสร้างใบขอซื้อ
          </h3>
          
          <div className="space-y-6">
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3">ข้อมูลผู้ขอซื้อ</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">วันที่ขอซื้อ:</span>
                  <p className="font-medium">{new Date(date).toLocaleDateString('th-TH')}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">ชื่อผู้ขอซื้อ:</span>
                  <p className="font-medium">{requester}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">รายการสินค้า ({items.length} รายการ)</h4>
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="table table-sm table-zebra w-full">
                  <thead className="sticky top-0">
                    <tr>
                      <th>ลำดับ</th>
                      <th>รายการ</th>
                      <th>วันที่ต้องการรับ</th>
                      <th>จำนวน</th>
                      <th>ราคา</th>
                      <th className="text-right">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.no}</td>
                        <td className="max-w-xs truncate" title={item.description}>
                          {item.description}
                        </td>
                        <td>
                          {item.receivedDate ? new Date(item.receivedDate).toLocaleDateString('th-TH') : '-'}
                        </td>
                        <td>{toNum(item.quantity).toLocaleString('th-TH')}</td>
                        <td>{toNum(item.amount).toLocaleString('th-TH')}</td>
                        <td className="text-right font-medium">
                          {(toNum(item.quantity) * toNum(item.amount)).toLocaleString('th-TH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

          <div className="modal-action">
            <button 
              className="btn font-normal" 
              onClick={cancelCreate}
              disabled={saving}
            >
              ยกเลิก
            </button>
            <button 
              className="btn bg-[#6EC1E4] text-white hover:bg-[#2b9ccc]" 
              onClick={confirmCreate}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  กำลังสร้างใบขอซื้อ...
                </>
              ) : (
                'ยืนยันและส่งขออนุมัติ'
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={cancelCreate}>close</button>
        </form>
      </dialog>
    </div>
  );
}