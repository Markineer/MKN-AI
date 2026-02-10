"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Layers,
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

const roleLabels: Record<string, string> = {
  OWNER: "مالك",
  ADMIN: "مدير المؤسسة",
  DEPARTMENT_HEAD: "رئيس قسم",
  COORDINATOR: "منسق",
  MEMBER: "عضو",
};

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bento-card p-12 text-center animate-fade-in-up">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500">جاري التحقق من الدعوة...</p>
          </div>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "valid" | "accepted" | "expired" | "error" | "success">("loading");
  const [inviteInfo, setInviteInfo] = useState<{
    email: string;
    orgNameAr: string;
    role: string;
    deptNameAr: string | null;
    titleAr: string | null;
  } | null>(null);
  const [form, setForm] = useState({ firstNameAr: "", lastNameAr: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }

    fetch(`/api/invitations/accept?token=${token}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setInviteInfo(data);
          setStatus("valid");
        } else {
          const data = await res.json();
          if (data.accepted) setStatus("accepted");
          else if (res.status === 410) setStatus("expired");
          else setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.firstNameAr.trim()) { setError("الاسم الأول مطلوب"); return; }
    if (!form.password || form.password.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (form.password !== form.confirmPassword) { setError("كلمتا المرور غير متطابقتين"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: form.password,
          firstNameAr: form.firstNameAr,
          lastNameAr: form.lastNameAr,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل قبول الدعوة");
      }
      setStatus("success");
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/images/LOGO.jpg" alt="علم elm" width={120} height={60} className="object-contain mx-auto mb-3" />
          <h1 className="logo-text text-3xl">
            مكن<span className="text-[0.55em] align-super mr-0.5" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}>AI</span>
          </h1>
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="bento-card p-12 text-center animate-fade-in-up">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500">جاري التحقق من الدعوة...</p>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="bento-card p-12 text-center animate-fade-in-up">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-elm-navy mb-1">الدعوة غير صالحة</h2>
            <p className="text-sm text-gray-400 mb-4">هذا الرابط غير صحيح أو تم حذفه</p>
            <Link href="/login" className="btn-primary text-sm inline-flex items-center gap-2">
              الذهاب لتسجيل الدخول
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Expired */}
        {status === "expired" && (
          <div className="bento-card p-12 text-center animate-fade-in-up">
            <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-elm-navy mb-1">انتهت صلاحية الدعوة</h2>
            <p className="text-sm text-gray-400 mb-4">يرجى التواصل مع مدير المؤسسة لإرسال دعوة جديدة</p>
            <Link href="/login" className="btn-primary text-sm inline-flex items-center gap-2">
              الذهاب لتسجيل الدخول
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Already accepted */}
        {status === "accepted" && (
          <div className="bento-card p-12 text-center animate-fade-in-up">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-elm-navy mb-1">تم قبول الدعوة مسبقاً</h2>
            <p className="text-sm text-gray-400 mb-4">يمكنك تسجيل الدخول بحسابك</p>
            <Link href="/login" className="btn-primary text-sm inline-flex items-center gap-2">
              تسجيل الدخول
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="bento-card p-12 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-elm-navy mb-1">تم قبول الدعوة بنجاح!</h2>
            <p className="text-sm text-gray-400 mb-6">تم إنشاء حسابك. يمكنك الآن تسجيل الدخول بالبريد وكلمة المرور.</p>
            <Link href="/login" className="btn-primary text-sm inline-flex items-center gap-2">
              تسجيل الدخول الآن
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Valid — Show form */}
        {status === "valid" && inviteInfo && (
          <div className="bento-card overflow-hidden animate-fade-in-up">
            {/* Invite info header */}
            <div className="bg-gradient-to-l from-brand-600 via-brand-500 to-purple-600 p-6 text-white">
              <p className="text-purple-200 text-xs font-medium mb-2">دعوة انضمام</p>
              <h2 className="text-lg font-bold mb-3">مرحباً بك في {inviteInfo.orgNameAr}</h2>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-purple-200" />
                  <span className="text-purple-100">{inviteInfo.orgNameAr}</span>
                </div>
                {inviteInfo.deptNameAr && (
                  <div className="flex items-center gap-2 text-sm">
                    <Layers className="w-4 h-4 text-purple-200" />
                    <span className="text-purple-100">{inviteInfo.deptNameAr}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-purple-200" />
                  <span className="text-purple-100">{roleLabels[inviteInfo.role] || inviteInfo.role}</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl">{error}</div>}

              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <label className="text-xs text-gray-400 block mb-0.5">البريد الإلكتروني</label>
                <p className="text-sm font-medium text-elm-navy" dir="ltr">{inviteInfo.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">الاسم الأول *</label>
                  <input
                    value={form.firstNameAr}
                    onChange={(e) => setForm((p) => ({ ...p, firstNameAr: e.target.value }))}
                    className="input-field"
                    placeholder="مثال: نوره"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">اسم العائلة</label>
                  <input
                    value={form.lastNameAr}
                    onChange={(e) => setForm((p) => ({ ...p, lastNameAr: e.target.value }))}
                    className="input-field"
                    placeholder="مثال: العمري"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">كلمة المرور *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="input-field pl-10"
                    placeholder="6 أحرف على الأقل"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">تأكيد كلمة المرور *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="input-field"
                  placeholder="أعد كتابة كلمة المرور"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                قبول الدعوة وإنشاء الحساب
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
