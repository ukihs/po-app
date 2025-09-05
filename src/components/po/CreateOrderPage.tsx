import React, { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import { createOrder, grandTotal, toNum } from '../../lib/poApi';
import type { Item } from '../../lib/poApi';
import { Plus, Trash2, Package, Calendar, DollarSign, Hash } from 'lucide-react';

export default function CreateOrderPage() {
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [requester, setRequester] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState<Omit<Item, 'no'>>({
    description: '',
    receivedDate: '',
    quantity: '',
    amount: ''
  });

  // เติมชื่อผู้ใช้ (displayName/email) อัตโนมัติ
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    setRequester(u.displayName || (u.email ?? '').split('@')[0]);
  }, []);

  // เปิด Modal เพิ่มรายการ
  const openAddModal = () => {
    setNewItem({
      description: '',
      receivedDate: '',
      quantity: '',
      amount: ''
    });
    setShowModal(true);
  };

  // เพิ่ม item ใหม่จาก Modal
  const addItemFromModal = () => {
    if (!newItem.description.trim() || toNum(newItem.quantity) <= 0 || toNum(newItem.amount) <= 0) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const itemToAdd: Item = {
      no: items.length + 1,
      ...newItem
    };
    
    setItems(prev => [...prev, itemToAdd]);
    setShowModal(false);
    setNewItem({
      description: '',
      receivedDate: '',
      quantity: '',
      amount: ''
    });
  };

  // ปิด Modal
  const closeModal = () => {
    setShowModal(false);
    setNewItem({
      description: '',
      receivedDate: '',
      quantity: '',
      amount: ''
    });
  };

  // ลบ item
  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, no: i + 1 })));
  };

  // อัปเดตข้อมูล item
  const updateItem = (idx: number, field: keyof Omit<Item, 'no'>, value: string) => {
    setItems(prev => prev.map((item, i) => 
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const invalid = () =>
    !requester.trim() || items.length === 0 || 
    items.some(item => !item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);

  const doCreate = async () => {
    setSubmitted(true);
    if (invalid()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน (ผู้สั่งซื้อ, รายการ/จำนวน/ราคา)');
      return;
    }
    try {
      setSaving(true);
      await createOrder({ date, requesterName: requester, items });
      window.location.href = '/orders/tracking';
    } catch (e: any) {
      alert(e?.message ?? 'บันทึกใบสั่งซื้อไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Modal สำหรับเพิ่มรายการ */}
      <dialog id="add_item_modal" className={`modal ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            เพิ่มรายการสินค้า
          </h3>
          
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">รายการที่ขอซื้อ</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="ระบุรายละเอียดสินค้า"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">วันที่ต้องการรับ</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={newItem.receivedDate}
                onChange={(e) => setNewItem(prev => ({ ...prev, receivedDate: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">จำนวน</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input input-bordered w-full"
                  placeholder="จำนวน"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">ราคา/หน่วย (บาท)</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input input-bordered w-full"
                  placeholder="ราคา"
                  value={newItem.amount}
                  onChange={(e) => setNewItem(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>

            {newItem.quantity && newItem.amount && (
              <div className="alert alert-info">
                <DollarSign className="w-4 h-4" />
                <span>รวม: {toNum(newItem.quantity) * toNum(newItem.amount)} บาท</span>
              </div>
            )}
          </div>

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={closeModal}>
              ยกเลิก
            </button>
            <button className="btn btn-primary" onClick={addItemFromModal}>
              <Plus className="w-4 h-4" />
              เพิ่มรายการ
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>close</button>
        </form>
      </dialog>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">
            <Package className="w-6 h-6" />
            สร้างใบสั่งซื้อใหม่
          </h2>

          {/* ข้อมูลทั่วไป */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">วันที่</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">ผู้สั่งซื้อ</span>
              </label>
              <input
                className={`input input-bordered w-full ${submitted && !requester ? 'input-error' : ''}`}
                placeholder="ชื่อผู้สั่งซื้อ"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
              />
            </div>
          </div>

          {/* ตารางรายการสินค้า */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">รายการสินค้า</h3>
              <button 
                type="button" 
                onClick={openAddModal}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                เพิ่มรายการ
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="w-16">
                      <Hash className="w-4 h-4" />
                    </th>
                    <th>รายการที่ขอซื้อ</th>
                    <th className="w-40">
                      <Calendar className="w-4 h-4" />
                    </th>
                    <th className="w-24 text-right">จำนวน</th>
                    <th className="w-32 text-right">ราคา/หน่วย (บาท)</th>
                    <th className="w-32 text-right">รวม (บาท)</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const total = toNum(item.quantity) * toNum(item.amount);
                    const hasError = submitted && (!item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);
                    
                    return (
                      <tr key={idx} className={hasError ? 'bg-error/10' : ''}>
                        <td className="text-center font-medium">{item.no}</td>
                        
                        <td>
                          <input
                            type="text"
                            className={`input input-sm input-bordered w-full ${
                              submitted && !item.description.trim() ? 'input-error' : ''
                            }`}
                            placeholder="ระบุรายละเอียดสินค้า"
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
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
                            type="text"
                            inputMode="decimal"
                            className={`input input-sm input-bordered w-full text-right ${
                              submitted && toNum(item.quantity) <= 0 ? 'input-error' : ''
                            }`}
                            placeholder="จำนวน"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          />
                        </td>
                        
                        <td>
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`input input-sm input-bordered w-full text-right ${
                              submitted && toNum(item.amount) <= 0 ? 'input-error' : ''
                            }`}
                            placeholder="ราคา"
                            value={item.amount}
                            onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                          />
                        </td>
                        
                        <td className="text-right font-medium">
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
                  <div className="text-base-content/40 mb-4">
                    <Package className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">ยังไม่มีรายการสินค้า</h3>
                  <p className="text-base-content/60 mb-4">คลิก "เพิ่มรายการ" เพื่อเพิ่มสินค้าที่ต้องการสั่งซื้อ</p>
                  <button 
                    type="button" 
                    onClick={openAddModal}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มรายการแรก
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* สรุปและปุ่มส่ง */}
          <div className="divider"></div>
          <div className="flex items-center justify-between">
            <div className="text-lg">
              <span className="text-base-content/70">รวมเป็นเงิน: </span>
              <span className="font-bold text-2xl text-primary">
                {grandTotal(items).toLocaleString('th-TH')} บาท
              </span>
            </div>
            <button
              type="button"
              onClick={doCreate}
              disabled={saving || invalid()}
              className="btn btn-primary btn-lg"
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  กำลังบันทึก...
                </>
              ) : (
                'สร้างใบสั่งซื้อและส่งขออนุมัติ'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}