import React, { useEffect, useState, useCallback } from "react";
import { signIn, subscribeAuthAndRole, setAuthCookie } from "../../../lib/auth";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertIcon, AlertTitle } from "../../ui/alert";
import { 
  RiCheckboxCircleFill, 
  RiErrorWarningFill, 
  RiSpam3Fill, 
  RiInformationFill 
} from '@remixicon/react';
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface LoginError extends Error {
  code?: string;
}

interface AlertState {
  show: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
}

const getRedirectUrl = (role: string): string => {
  const redirects: Record<string, string> = {
    buyer: '/orders/create',
    supervisor: '/orders/tracking',
    procurement: '/orders/list',
    superadmin: '/admin/users'
  };
  return redirects[role] || '/login';
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: 'error',
    title: '',
    description: ''
  });

  useEffect(() => {
    const off = subscribeAuthAndRole(async (user, role) => {
      if (!user || !role) return;
      
      try {
        await setAuthCookie();
        window.location.href = getRedirectUrl(role);
      } catch (error) {
        console.error('Failed to set auth cookie:', error);
      }
    });
    return off;
  }, []);

  const showAlertMessage = useCallback((type: AlertState['type'], title: string, description?: string) => {
    setAlert({ show: true, type, title, description });
    
    // Auto-hide after duration
    const duration = type === 'error' ? 5000 : 4000;
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, duration);
  }, []);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(prev => ({ ...prev, show: false }));
    setIsLoading(true);

    try {
      if (!email.trim() || !pass) {
        throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
      }

      await signIn(email.trim(), pass);
      showAlertMessage("success", "เข้าสู่ระบบสำเร็จ กำลังนำทาง");
    } catch (e: unknown) {
      const error = e as LoginError;
      let message = "เข้าสู่ระบบไม่สำเร็จ";

      if (error.message && !error.message.includes('Firebase:')) {
        message = error.message;
      } else {
        message = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      }

      showAlertMessage("error", message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert 
            variant={getAlertConfig(alert.type).variant}
            appearance={getAlertConfig(alert.type).appearance}
            close
            onClose={() => setAlert(prev => ({ ...prev, show: false }))}
          >
            <AlertIcon>
              {React.createElement(getAlertConfig(alert.type).IconComponent, { className: "h-4 w-4" })}
            </AlertIcon>
            <AlertTitle>{alert.title}</AlertTitle>
            {alert.description && (
              <AlertDescription>{alert.description}</AlertDescription>
            )}
          </Alert>
        </div>
      )}

      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center space-y-6 mb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="Bederly Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="กรอกอีเมลของคุณ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="กรอกรหัสผ่านของคุณ"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="h-11"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#6EC1E4] hover:bg-[#2b9ccc] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isLoading ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}