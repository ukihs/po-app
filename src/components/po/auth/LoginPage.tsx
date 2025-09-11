import React, { useEffect, useState } from "react";
import { signIn, subscribeAuthAndRole } from "../../../lib/auth";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

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
        return <Info className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div
            role="alert"
            className={`alert alert-${alertType} alert-soft shadow-lg border-0`}
          >
            {getAlertIcon()}
            <span className="text-sm font-medium">{alertMessage}</span>
            <button
              onClick={() => setShowAlert(false)}
              className="btn btn-sm btn-ghost btn-circle ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Beverly Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
        </div>

        <div className="space-y-6">
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#64D1E3] focus:border-[#64D1E3] focus:bg-white transition-all duration-200"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#64D1E3] focus:border-[#64D1E3] focus:bg-white transition-all duration-200"
                placeholder="Password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>

              <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[#64D1E3] hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#64D1E3] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
