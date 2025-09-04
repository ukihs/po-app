// src/components/po/CreateOrderPage.tsx
import React, { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import { createOrder, grandTotal, toNum } from '../../lib/poApi';
import type { Item } from '../../lib/poApi';

export default function CreateOrderPage() {
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [requester, setRequester] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);

  // เติมชื่อผู้ใช้ (displayName/email) อัตโนมัติ
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    setRequester(u.displayName || (u.email ?? '').split('@')[0]);
  }, []);

  // เพิ่ม item ใหม่ในตาราง
  const addItem = () => {
    const newItem: Item = {
      no: items.length + 1,
      description: '',
      receivedDate: '',
      quantity: '',
      amount: ''
    };
    setItems(prev => [...prev, newItem]);
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">สร้างใบสั่งซื้อใหม่</h2>

          {/* ข้อมูลทั่วไป */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
              <input
                type="date"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all duration-200"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ผู้สั่งซื้อ</label>
              <input
                className={`w-full h-12 px-4 rounded-xl border bg-gray-50 text-gray-900 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all duration-200 ${
                  submitted && !requester ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="ชื่อผู้สั่งซื้อ"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
              />
            </div>
          </div>

          {/* ตารางรายการสินค้า */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">รายการสินค้า</h3>
              <button 
                type="button" 
                onClick={addItem}
                className="btn btn-primary btn-sm rounded-xl text-white font-medium hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: '#64D1E3', borderColor: '#64D1E3', color: 'white' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4 me-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                เพิ่มรายการ
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600 text-sm">
                    <th className="px-4 py-3 font-medium w-16">ลำดับ</th>
                    <th className="px-4 py-3 font-medium">รายการที่ขอซื้อ</th>
                    <th className="px-4 py-3 font-medium w-40">วันที่ต้องการรับ</th>
                    <th className="px-4 py-3 font-medium w-24 text-right">จำนวน</th>
                    <th className="px-4 py-3 font-medium w-32 text-right">ราคา/หน่วย (บาท)</th>
                    <th className="px-4 py-3 font-medium w-32 text-right">รวม (บาท)</th>
                    <th className="px-4 py-3 font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => {
                    const total = toNum(item.quantity) * toNum(item.amount);
                    const hasError = submitted && (!item.description.trim() || toNum(item.quantity) <= 0 || toNum(item.amount) <= 0);
                    
                    return (
                      <tr key={idx} className={`hover:bg-gray-50 ${hasError ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.no}</td>
                        
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              submitted && !item.description.trim() ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="ระบุรายละเอียดสินค้า"
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          />
                        </td>
                        
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={item.receivedDate}
                            onChange={(e) => updateItem(idx, 'receivedDate', e.target.value)}
                          />
                        </td>
                        
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`w-full px-3 py-2 text-sm border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              submitted && toNum(item.quantity) <= 0 ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="จำนวน"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          />
                        </td>
                        
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`w-full px-3 py-2 text-sm border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              submitted && toNum(item.amount) <= 0 ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="ราคา"
                            value={item.amount}
                            onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                          />
                        </td>
                        
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {total > 0 ? total.toLocaleString('th-TH') : '0'}
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium p-1 rounded hover:bg-red-100"
                            title="ลบรายการ"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {items.length === 0 && (
                <div className="p-12 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto h-12 w-12">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-4.5B4.875 8.25 4.5 8.625 4.5 12v2.625m15 0a3.375 3.375 0 0 1-3.375 3.375h-4.5a3.375 3.375 0 0 1-3.375-3.375m15 0V17a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-.75m15 0V16a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25V16" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">ยังไม่มีรายการสินค้า</h3>
                  <p className="text-sm text-gray-500 mt-1">คลิก "เพิ่มรายการ" เพื่อเพิ่มสินค้าที่ต้องการสั่งซื้อ</p>
                </div>
              )}
            </div>
          </div>

          {/* สรุปและปุ่มส่ง */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div className="text-lg">
                <span className="text-gray-600">รวมเป็นเงิน: </span>
                <span className="font-bold text-gray-900 text-xl">
                  {grandTotal(items).toLocaleString('th-TH')} บาท
                </span>
              </div>
              <button
                type="button"
                onClick={doCreate}
                disabled={saving || invalid()}
                className="btn btn-primary btn-lg rounded-xl px-8 text-white font-medium hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#64D1E3', borderColor: '#64D1E3', color: 'white' }}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
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
    </div>
  );
}