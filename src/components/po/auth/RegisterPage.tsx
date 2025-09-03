// src/components/auth/RegisterPage.tsx
import React, { useEffect, useState } from 'react';
import { signUp, subscribeAuthAndRole } from '../../../lib/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  // ถ้าล็อกอินแล้ว ส่งหน้าให้ทันที
  useEffect(() => {
    const off = subscribeAuthAndRole((user, role) => {
      if (!user || !role) return;
      // ผู้ซื้อ → ไปสร้างคำสั่งซื้อ
      if (role === 'buyer') window.location.href = '/orders/create';
      else window.location.href = '/orders/list';
    });
    return off;
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      if (!email || !pass || !name) throw new Error('กรอกข้อมูลให้ครบ');
      await signUp(email.trim(), pass, name.trim());
      // ไม่ต้อง redirect ที่นี่ เพราะ subscribeAuthAndRole จะจัดการให้
    } catch (e: any) {
      setErr(e?.message ?? 'สมัครสมาชิกไม่สำเร็จ');
    }
  };

  return (
    <div className="container-nice page-narrow py-10">
      <div className="card max-w-md mx-auto shadow-lg">
        <div className="card-pad">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">สมัครใช้งาน</h2>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อที่แสดง</label>
              <input className="input w-full" value={name} onChange={e=>setName(e.target.value)} placeholder="ชื่อ"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">อีเมล</label>
              <input className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">รหัสผ่าน</label>
              <input type="password" className="input w-full" value={pass} onChange={e=>setPass(e.target.value)} />
            </div>

            {err && <div className="text-rose-600 text-sm">{err}</div>}

            <button className="btn btn-primary w-full" type="submit">สมัครใช้งาน</button>
          </form>

          <div className="text-sm mt-4 text-center">
            มีบัญชีแล้ว?{' '}
            <a className="underline" href="/login">เข้าสู่ระบบ</a>
          </div>
        </div>
      </div>
    </div>
  );
}
