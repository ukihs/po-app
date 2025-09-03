// src/components/auth/LoginPage.tsx
import React, { useEffect, useState } from 'react';
import { signIn, subscribeAuthAndRole } from '../../../lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const off = subscribeAuthAndRole((user, role) => {
      if (!user || !role) return;
      if (role === 'buyer') window.location.href = '/orders/create';
      else window.location.href = '/orders/list';
    });
    return off;
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      if (!email || !pass) throw new Error('กรอกอีเมลและรหัสผ่าน');
      await signIn(email.trim(), pass);
    } catch (e: any) {
      setErr(e?.message ?? 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  return (
    <div className="container-nice page-narrow py-10">
      <div className="card max-w-md mx-auto shadow-lg">
        <div className="card-pad">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">เข้าสู่ระบบ</h2>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">อีเมล</label>
              <input className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">รหัสผ่าน</label>
              <input type="password" className="input w-full" value={pass} onChange={e=>setPass(e.target.value)} />
            </div>

            {err && <div className="text-rose-600 text-sm">{err}</div>}

            <button className="btn btn-primary w-full" type="submit">เข้าสู่ระบบ</button>
          </form>

          <div className="text-sm mt-4 text-center">
            ยังไม่มีบัญชี?{' '}
            <a className="underline" href="/register">สมัครใช้งาน</a>
          </div>
        </div>
      </div>
    </div>
  );
}
