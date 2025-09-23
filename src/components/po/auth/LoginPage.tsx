import React, { useEffect, useState } from "react";
import { signIn, subscribeAuthAndRole } from "../../../lib/auth";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Alert, AlertDescription } from "../../ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<
    "info" | "success" | "warning" | "error"
  >("error");
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const off = subscribeAuthAndRole((user, role) => {
      if (!user || !role) return;
      if (role === "buyer") window.location.href = "/orders/create";
      else window.location.href = "/orders/list";
    });
    return off;
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setShowAlert(false);

    try {
      if (!email || !pass) throw new Error("กรอกอีเมลและรหัสผ่าน");
      await signIn(email.trim(), pass);

      setAlertType("success");
      setAlertMessage("เข้าสู่ระบบสำเร็จ! กำลังนำทาง...");
      setShowAlert(true);
    } catch (e: any) {
      setErr(e?.message ?? "เข้าสู่ระบบไม่สำเร็จ");

      setAlertType("error");
      setAlertMessage(e?.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      setShowAlert(true);

      setTimeout(() => {
        setShowAlert(false);
      }, 4000);
    }
  };

  const getAlertIcon = () => {
    switch (alertType) {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Alert
            variant={alertType === "error" ? "destructive" : "default"}
            className="shadow-lg border-0"
          >
            {getAlertIcon()}
            <div className="flex items-center justify-between w-full">
              <AlertDescription className="text-sm font-medium">
                {alertMessage}
              </AlertDescription>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAlert(false)}
                className="h-6 w-6 ml-2 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </div>
      )}

      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="Beverly Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">เข้าสู่ระบบ</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="รหัสผ่าน"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#64D1E3] hover:bg-[#4FB3C7] text-white font-medium"
            >
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
