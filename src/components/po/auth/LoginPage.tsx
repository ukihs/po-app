import React, { useEffect, useState, useCallback } from "react";
import { signIn, subscribeAuthAndRole, setAuthCookie } from "../../../lib/auth";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Alert, AlertDescription } from "../../ui/alert";

interface LoginError extends Error {
  code?: string;
}

interface AlertState {
  show: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
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
    message: ''
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

  const showAlertMessage = useCallback((type: AlertState['type'], message: string) => {
    setAlert({ show: true, type, message });
    if (type === 'error') {
      setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(prev => ({ ...prev, show: false }));
    setIsLoading(true);

    try {
      if (!email.trim() || !pass) {
        throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
      }

      await signIn(email.trim(), pass);
      showAlertMessage("success", "เข้าสู่ระบบสำเร็จ! กำลังนำทาง...");
    } catch (e: unknown) {
      const error = e as LoginError;
      let message = "เข้าสู่ระบบไม่สำเร็จ";

      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            message = "ไม่พบผู้ใช้นี้ในระบบ";
            break;
          case 'auth/wrong-password':
            message = "รหัสผ่านไม่ถูกต้อง";
            break;
          case 'auth/invalid-email':
            message = "รูปแบบอีเมลไม่ถูกต้อง";
            break;
          case 'auth/too-many-requests':
            message = "พยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่";
            break;
          default:
            message = error.message || message;
        }
      } else if (error.message) {
        message = error.message;
      }

      showAlertMessage("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = useCallback(() => {
    switch (alert.type) {
      case "info":
        return <Info className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  }, [alert.type]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Alert
            variant={alert.type === "error" ? "destructive" : "primary"}
            className="shadow-lg border-0"
            role="alert"
            aria-live="polite"
          >
            {getAlertIcon()}
            <div className="flex items-center justify-between w-full">
              <AlertDescription className="text-sm font-medium">
                {alert.message}
              </AlertDescription>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAlert(prev => ({ ...prev, show: false }))}
                className="h-6 w-6 ml-2 shrink-0"
                aria-label="ปิดการแจ้งเตือน"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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