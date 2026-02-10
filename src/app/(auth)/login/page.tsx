"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        const session = await getSession();
        const roles = (session?.user as any)?.roles || [];
        const orgMemberships = (session?.user as any)?.orgMemberships || [];
        const isAdmin = roles.some((r: string) => ["super_admin", "platform_admin"].includes(r));

        if (isAdmin) {
          router.push("/admin");
        } else if (orgMemberships.length > 0) {
          router.push("/organization/events");
        } else {
          router.push("/admin");
        }
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex" dir="rtl">
      {/* ── Right Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Background blurs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-nafath-teal rounded-full blur-3xl animate-[pulse_5s_ease-in-out_infinite_1s]" />
        </div>

        {/* Logo + Text */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Animated logo */}
          <div className="relative w-40 h-40">
            <div className="absolute inset-0 rounded-full animate-[spin_8s_linear_infinite]">
              <svg className="w-full h-full" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="br1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="76" fill="none" stroke="url(#br1)" strokeWidth="2" strokeDasharray="14 8" />
              </svg>
            </div>
            <div className="absolute inset-3 rounded-full animate-[spin_12s_linear_infinite_reverse]">
              <svg className="w-full h-full" viewBox="0 0 136 136">
                <defs>
                  <linearGradient id="br2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <circle cx="68" cy="68" r="64" fill="none" stroke="url(#br2)" strokeWidth="1.5" strokeDasharray="6 10" />
              </svg>
            </div>
            <div className="absolute inset-6 rounded-full bg-white/10 animate-[pulse_3s_ease-in-out_infinite]" />
            <div className="absolute inset-6 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-xl shadow-purple-500/20">
              <Image src="/images/LOGO.jpg" alt="ELM" width={120} height={120} className="object-cover w-full h-full rounded-full" />
            </div>
          </div>

          <h1 className="logo-text text-3xl text-white leading-none mt-6">
            مكن<span className="text-[0.55em] align-super mr-0.5" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}>AI</span>
          </h1>
          <p className="text-sm text-white/50 mt-3 max-w-[240px] leading-relaxed">
            منصة إدارة الهاكاثونات والتحديات بذكاء اصطناعي
          </p>

          {/* Partner badge */}
          <div className="mt-12 flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl border border-white/10">
            <Image src="/images/LOGO.jpg" alt="ELM" width={28} height={28} className="object-cover rounded-full" />
            <div className="text-right">
              <p className="text-xs text-white/70 font-medium">شراكة</p>
              <p className="text-[11px] text-white/40">علم + ماركنير</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Left Panel: Form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo (hidden on desktop) */}
          <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
            <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden border border-gray-100">
              <Image src="/images/LOGO.jpg" alt="ELM" width={48} height={48} className="object-cover w-full h-full rounded-full" />
            </div>
            <span className="logo-text text-2xl leading-none">
              مكن<span className="text-[0.55em] align-super mr-0.5" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}>AI</span>
            </span>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              مرحبا بك
            </h2>
            <p className="text-base text-gray-500">
              سجّل دخولك للوصول إلى لوحة التحكم
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full pr-12 pl-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ادخل كلمة المرور"
                  required
                  className="w-full pr-12 pl-12 py-3.5 bg-white border border-gray-200 rounded-xl text-base text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400 cursor-pointer"
                />
                <span className="text-sm text-gray-600">تذكرني</span>
              </label>
              <a href="#" className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors duration-200">
                نسيت كلمة المرور؟
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-base font-bold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-brand-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  تسجيل الدخول
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-brand-500 font-semibold hover:text-brand-600 transition-colors duration-200">
              سجّل مؤسستك
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
