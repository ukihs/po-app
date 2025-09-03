// src/components/po/CreateOrderPage.tsx
import React, { useState } from 'react';
import { createOrder, grandTotal, toNum } from '../../lib/poApi';
import type { Item } from '../../lib/poApi';

export default function CreateOrderPage() {
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [requester, setRequester] = useState('');
  const [department, setDepartment] = useState('');
  const [items, setItems] = useState<Item[]>([
    { no: 1, description: '', receivedDate: '', quantity: '', amount: '' },
  ]);

  const addItem = () =>
    setItems(prev => [...prev, { no: prev.length + 1, description: '', receivedDate: '', quantity: '', amount: '' }]);

  const removeItem = (idx: number) =>
    setItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, no: i + 1 })));

  const updateItem = (idx: number, field: keyof Item, value: string) =>
    setItems(prev => {
      const next = [...prev];
      (next[idx] as any)[field] = value;
      return next;
    });

  const handleEnterToAdd = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
    if (e.key !== 'Enter') return;
    const it = items[rowIndex];
    const ready = it.description && it.receivedDate && toNum(it.quantity) > 0 && toNum(it.amount) > 0;
    const isLast = rowIndex === items.length - 1;
    if (ready && isLast) addItem();
  };

  const invalid = () =>
    !requester ||
    !department ||
    items.some(i => !i.description || toNum(i.quantity) <= 0 || toNum(i.amount) <= 0);

  const createOrderAction = async () => {
    setSubmitted(true);
    if (invalid()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน (ผู้ขอ, แผนก, รายการ/จำนวน/ราคา)');
      return;
    }

    await createOrder({ date, requester, department, items }); // <-- บันทึก Firestore จริง
    window.location.href = '/orders/tracking';
  };

  const lineTotal = (it: Item) => toNum(it.quantity) * toNum(it.amount);

  return (
    <div>
      <div className="container-nice page-narrow py-6 md:py-10">
        <div className="card">
          <div className="card-pad">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">สร้างใบสั่งซื้อใหม่</h2>

            {/* ข้อมูลทั่วไป */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">วันที่</label>
                <input type="date" className="input" value={date} onChange={(e)=>setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ผู้ขอสั่งซื้อ</label>
                <input
                  className={`input ${submitted && !requester ? 'border-rose-400' : ''}`}
                  placeholder="ชื่อผู้ขอ"
                  value={requester}
                  onChange={(e)=>setRequester(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">แผนก</label>
                <input
                  className={`input ${submitted && !department ? 'border-rose-400' : ''}`}
                  placeholder="แผนก"
                  value={department}
                  onChange={(e)=>setDepartment(e.target.value)}
                />
              </div>
            </div>

            {/* รายการสินค้า */}
            <div className="mb-6">
              <div className="border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80">
                  <h3 className="text-lg font-medium">รายการสินค้า</h3>
                  <button type="button" onClick={addItem} className="btn btn-primary btn-sm">
                    + เพิ่มรายการ
                  </button>
                </div>

                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50/95 backdrop-blur z-10">
                      <tr className="text-left text-slate-600">
                        <th className="px-3 py-2 w-16">ลำดับ</th>
                        <th className="px-3 py-2">รายการที่ขอซื้อ</th>
                        <th className="px-3 py-2 w-44">วันที่ต้องการรับ</th>
                        <th className="px-3 py-2 w-36">จำนวน</th>
                        <th className="px-3 py-2 w-44 text-right">ราคา/หน่วย (บาท)</th>
                        <th className="px-3 py-2 w-44 text-right">รวม (บาท)</th>
                        <th className="px-3 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((it, idx) => {
                        const sum = lineTotal(it);
                        const rowInvalid = submitted && (!it.description || toNum(it.quantity) <= 0 || toNum(it.amount) <= 0);
                        return (
                          <tr key={idx} className={`align-top odd:bg-white even:bg-slate-50/40 hover:bg-slate-50 ${rowInvalid ? 'bg-rose-50' : ''}`}>
                            <td className="px-3 py-2">{it.no}</td>
                            <td className="px-3 py-2">
                              <input
                                className={`input ${submitted && !it.description ? 'border-rose-400' : ''}`}
                                placeholder="รายละเอียดสินค้า"
                                value={it.description}
                                onChange={(e)=>updateItem(idx,'description',e.target.value)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="date"
                                className="input"
                                value={it.receivedDate}
                                onChange={(e)=>updateItem(idx,'receivedDate',e.target.value)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9.,]*"
                                className={`input ${submitted && toNum(it.quantity) <= 0 ? 'border-rose-400' : ''}`}
                                placeholder="จำนวน"
                                value={it.quantity}
                                onInput={(e)=>updateItem(idx,'quantity',(e.target as HTMLInputElement).value)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9.,]*"
                                className={`input text-right ${submitted && toNum(it.amount) <= 0 ? 'border-rose-400' : ''}`}
                                placeholder="ราคา"
                                value={it.amount}
                                onInput={(e)=>updateItem(idx,'amount',(e.target as HTMLInputElement).value)}
                                onKeyDown={(e)=>handleEnterToAdd(e, idx)}
                              />
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {sum.toLocaleString('th-TH')}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {items.length > 1 && (
                                <button type="button" className="btn btn-red btn-sm" onClick={()=>removeItem(idx)}>
                                  ลบ
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* สรุป + ส่ง */}
            <div className="mt-6">
              <div className="glass border rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="text-sm text-slate-600">
                  รวมเป็นเงิน:
                  <span className="ml-2 font-semibold text-slate-900">
                    {grandTotal(items).toLocaleString('th-TH')} บาท
                  </span>
                </div>
                <button type="button" onClick={createOrderAction} className="btn btn-green px-6 py-3">
                  สร้างใบสั่งซื้อและส่งขออนุมัติ
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
