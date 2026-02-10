"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles, Shield, Zap, BarChart3, Users, Calendar } from "lucide-react";

/* ─── Animated Logo ─── */
function AnimatedLogo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const dim = size === "lg" ? "w-44 h-44" : "w-12 h-12";
  const vb1 = size === "lg" ? 176 : 48;
  const r1 = size === "lg" ? 84 : 22;
  const vb2 = size === "lg" ? 152 : 40;
  const r2 = size === "lg" ? 72 : 18;
  const id = size === "lg" ? "hero" : "nav";
  return (
    <div className={`relative ${dim}`}>
      <div className="absolute inset-0 rounded-full animate-[spin_8s_linear_infinite]">
        <svg className="w-full h-full" viewBox={`0 0 ${vb1} ${vb1}`}>
          <defs>
            <linearGradient id={`${id}-g1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <circle cx={vb1 / 2} cy={vb1 / 2} r={r1} fill="none" stroke={`url(#${id}-g1)`} strokeWidth="2" strokeDasharray="14 8" />
        </svg>
      </div>
      <div className="absolute inset-2.5 rounded-full animate-[spin_12s_linear_infinite_reverse]">
        <svg className="w-full h-full" viewBox={`0 0 ${vb2} ${vb2}`}>
          <defs>
            <linearGradient id={`${id}-g2`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <circle cx={vb2 / 2} cy={vb2 / 2} r={r2} fill="none" stroke={`url(#${id}-g2)`} strokeWidth="1.5" strokeDasharray="6 10" />
        </svg>
      </div>
      <div className="absolute inset-5 rounded-full bg-brand-50/40 animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="absolute inset-5 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-100 shadow-lg shadow-brand-500/10">
        <Image
          src="/images/LOGO.jpg"
          alt="ELM"
          width={size === "lg" ? 130 : 36}
          height={size === "lg" ? 130 : 36}
          className="object-cover w-full h-full rounded-full"
        />
      </div>
    </div>
  );
}

/* ─── Logo Text ─── */
function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-text leading-none ${className}`}>
      مكن<span className="text-[0.55em] align-super mr-0.5" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontWeight: 700, letterSpacing: "0.05em" }}>AI</span>
    </span>
  );
}

const features = [
  {
    icon: Sparkles,
    title: "تقييم ذكي بالذكاء الاصطناعي",
    desc: "تقييم تلقائي للمشاريع والحلول باستخدام نماذج ذكاء اصطناعي متقدمة",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Calendar,
    title: "إدارة شاملة للفعاليات",
    desc: "من التخطيط إلى التنفيذ، إدارة كاملة لدورة حياة الهاكاثون",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Shield,
    title: "نظام صلاحيات متقدم",
    desc: "10 مستويات أدوار مع 72+ صلاحية قابلة للتخصيص",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Users,
    title: "إدارة الفرق والمشاركين",
    desc: "تنظيم الفرق والتسجيل والمتابعة بسهولة تامة",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: BarChart3,
    title: "تقارير وتحليلات لحظية",
    desc: "لوحات بيانات تفاعلية مع تحليلات في الوقت الحقيقي",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Zap,
    title: "أتمتة سير العمل",
    desc: "أتمتة الدعوات والتقييمات والشهادات والإشعارات",
    color: "bg-rose-50 text-rose-600",
  },
];

export default function HomePage() {
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  /* ═══ Splash Screen ═══ */
  if (splash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-brand-500 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-nafath-teal rounded-full blur-3xl animate-[pulse_5s_ease-in-out_infinite_1s]" />
        </div>
        <div className="z-10 flex flex-col items-center animate-scale-in">
          <div className="relative w-52 h-52">
            <div className="absolute inset-0 rounded-full animate-[spin_8s_linear_infinite]">
              <svg className="w-full h-full" viewBox="0 0 208 208">
                <defs>
                  <linearGradient id="sp1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <circle cx="104" cy="104" r="100" fill="none" stroke="url(#sp1)" strokeWidth="2" strokeDasharray="14 8" />
              </svg>
            </div>
            <div className="absolute inset-3 rounded-full animate-[spin_12s_linear_infinite_reverse]">
              <svg className="w-full h-full" viewBox="0 0 180 180">
                <defs>
                  <linearGradient id="sp2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <circle cx="90" cy="90" r="86" fill="none" stroke="url(#sp2)" strokeWidth="1.5" strokeDasharray="6 10" />
              </svg>
            </div>
            <div className="absolute inset-6 rounded-full bg-white/10 animate-[pulse_3s_ease-in-out_infinite]" />
            <div className="absolute inset-6 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white/40 shadow-xl shadow-purple-500/20">
              <Image src="/images/LOGO.jpg" alt="ELM" width={160} height={160} className="object-cover w-full h-full rounded-full" />
            </div>
          </div>
          <div className="mt-8 text-center">
            <h1 className="text-4xl text-white">
              <LogoText className="text-4xl !text-white" />
            </h1>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-[pulse_1s_ease-in-out_infinite]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-[pulse_1s_ease-in-out_infinite_0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-[pulse_1s_ease-in-out_infinite_0.6s]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ Landing Page ═══ */
  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <AnimatedLogo size="sm" />
            <LogoText className="text-xl" />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              تسجيل الدخول
            </Link>
            <Link href="/login" className="btn-primary text-sm flex items-center gap-2 cursor-pointer">
              ابدأ الان
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/80 via-white to-white" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 flex flex-col items-center text-center">
          <div className="animate-fade-in-up">
            <AnimatedLogo size="lg" />
          </div>

          <div className="mt-10 max-w-2xl animate-fade-in-up delay-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              منصة إدارة الهاكاثونات
              <br />
              <span className="bg-gradient-to-l from-brand-500 to-nafath-teal bg-clip-text text-transparent">بذكاء اصطناعي</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-xl mx-auto">
              حلّك الذكي لإدارة الهاكاثونات والتحديات من التخطيط إلى التقييم
            </p>
          </div>

          <div className="mt-10 flex items-center gap-4 animate-fade-in-up delay-2">
            <Link href="/login" className="px-8 py-4 text-lg font-bold text-white bg-brand-500 rounded-2xl hover:bg-brand-600 transition-all duration-200 flex items-center gap-3 shadow-lg shadow-brand-500/25 cursor-pointer">
              ابدأ تجربتك المجانية
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex items-center gap-6 text-sm text-gray-400 animate-fade-in-up delay-3">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              حماية كاملة للبيانات
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              دعم فني مستمر
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              +500 فريق مشارك
            </span>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">كل ما تحتاجه في مكان واحد</h2>
          <p className="text-base text-gray-500 max-w-lg mx-auto">أدوات متكاملة لإدارة فعالياتك بكفاءة عالية من البداية للنهاية</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="bg-gradient-to-l from-brand-500 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">جاهز لتنظيم فعاليتك القادمة؟</h2>
          <p className="text-base text-white/70 mb-8 max-w-md mx-auto">انضم الان وابدأ بتنظيم هاكاثونات وتحديات احترافية</p>
          <Link href="/login" className="inline-flex items-center gap-3 px-8 py-4 text-lg font-bold text-brand-600 bg-white rounded-2xl hover:bg-gray-50 transition-all duration-200 shadow-xl cursor-pointer">
            ابدأ مجانا
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/images/LOGO.jpg" alt="ELM" width={32} height={32} className="object-cover rounded-full" />
            <LogoText className="text-base" />
          </div>
          <p className="text-sm text-gray-400">علم + ماركنير</p>
        </div>
      </footer>
    </div>
  );
}
