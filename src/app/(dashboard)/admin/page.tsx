import {
  Users,
  Building2,
  Calendar,
  Trophy,
  FileText,
  Activity,
  ChevronLeft,
  Sparkles,
  BarChart3,
  Shield,
  Zap,
  ArrowUpLeft,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  REGISTRATION_OPEN: "التسجيل مفتوح",
  IN_PROGRESS: "جاري",
  EVALUATION: "تقييم",
  COMPLETED: "مكتمل",
};

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  PUBLISHED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  REGISTRATION_OPEN: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  IN_PROGRESS: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  EVALUATION: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  COMPLETED: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
};

export default async function AdminDashboard() {
  const [
    totalUsers,
    totalOrganizations,
    activeEvents,
    completedEvents,
    recentEvents,
    roleDistribution,
    totalEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.event.count({
      where: { status: { in: ["PUBLISHED", "REGISTRATION_OPEN", "IN_PROGRESS"] } },
    }),
    prisma.event.count({ where: { status: "COMPLETED" } }),
    prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { nameAr: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.userPlatformRole.groupBy({
      by: ["roleId"],
      _count: true,
    }),
    prisma.event.count(),
  ]);

  const roleIds = roleDistribution.map((r) => r.roleId);
  const roles = await prisma.platformRole.findMany({
    where: { id: { in: roleIds } },
    select: { id: true, nameAr: true, color: true },
  });
  const roleMap = Object.fromEntries(roles.map((r) => [r.id, r]));

  const roleStats = roleDistribution
    .map((r) => ({
      nameAr: roleMap[r.roleId]?.nameAr || "غير معرف",
      color: roleMap[r.roleId]?.color || "#6B7280",
      count: r._count,
    }))
    .sort((a, b) => b.count - a.count);

  const maxRoleCount = Math.max(...roleStats.map((r) => r.count), 1);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء النور";

  const completionRate = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* ═══ Welcome Banner ═══ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-l from-brand-600 via-brand-500 to-purple-600" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative px-8 pt-10 pb-20">
          <div className="flex items-start justify-between animate-fade-in-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span className="text-purple-200 text-sm font-medium">لوحة التحكم</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{greeting}</h1>
              <p className="text-purple-200 text-sm max-w-md">
                نظرة شاملة على أداء منصة مكن AI — تابع الفعاليات والمستخدمين والمؤسسات
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/roles"
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/10 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                الأدوار
              </Link>
              <Link
                href="/organization/events/create"
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-brand-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                فعالية جديدة
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Bento Stats Grid ═══ */}
      <div className="px-8 -mt-12 relative z-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            {
              nameAr: "إجمالي المستخدمين",
              value: totalUsers,
              icon: Users,
              gradient: "from-brand-500 to-purple-600",
              ringColor: "ring-purple-100",
              change: "+12%",
              up: true,
            },
            {
              nameAr: "المؤسسات المسجلة",
              value: totalOrganizations,
              icon: Building2,
              gradient: "from-blue-500 to-cyan-500",
              ringColor: "ring-blue-100",
              change: "+3",
              up: true,
            },
            {
              nameAr: "الفعاليات النشطة",
              value: activeEvents,
              icon: Calendar,
              gradient: "from-emerald-500 to-teal-500",
              ringColor: "ring-emerald-100",
              change: "جارية",
              up: true,
            },
            {
              nameAr: "الفعاليات المكتملة",
              value: completedEvents,
              icon: Trophy,
              gradient: "from-amber-500 to-orange-500",
              ringColor: "ring-amber-100",
              change: `من ${totalEvents}`,
              up: false,
            },
          ].map((stat, i) => (
            <div
              key={stat.nameAr}
              className={`bento-card ring-click p-5 animate-fade-in-up delay-${i + 1}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ring-4 ${stat.ringColor}`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
                    stat.up ? "text-emerald-600 bg-emerald-50" : "text-gray-500 bg-gray-50"
                  }`}
                >
                  {stat.up && <ArrowUpLeft className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-3xl font-extrabold text-elm-navy tracking-tight">{stat.value}</h3>
              <p className="text-sm text-gray-400 mt-1">{stat.nameAr}</p>
              <div className="mt-4 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-l ${stat.gradient} animate-bar-grow`}
                  style={{ width: `${Math.min(40 + i * 15, 90)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-8 pb-10">
        {/* ═══ Bento Main Grid ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* ── Recent Events (spans 7 cols) ── */}
          <div className="xl:col-span-7 bento-card overflow-hidden animate-fade-in-up delay-3">
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-elm-navy">أحدث الفعاليات</h3>
                  <p className="text-xs text-gray-400">آخر الفعاليات المضافة للمنصة</p>
                </div>
              </div>
              <Link
                href="/organization/events"
                className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-700 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-brand-50"
              >
                عرض الكل
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="px-6 pb-6">
              {recentEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">لا توجد فعاليات بعد</p>
                  <Link
                    href="/organization/events/create"
                    className="text-xs text-brand-500 hover:underline mt-1 inline-block"
                  >
                    أنشئ أول فعالية
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentEvents.map((event, idx) => {
                    const sc = statusConfig[event.status] || statusConfig.DRAFT;
                    return (
                      <Link
                        key={event.id}
                        href={`/event/${event.id}/settings`}
                        className={`flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-brand-100 hover:bg-brand-50/30 transition-all duration-200 group cursor-pointer animate-fade-in-up delay-${idx + 1}`}
                      >
                        <div className="relative">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
                              event.type === "HACKATHON"
                                ? "bg-gradient-to-br from-brand-500 to-purple-600"
                                : "bg-gradient-to-br from-blue-500 to-cyan-500"
                            }`}
                          >
                            {event.type === "HACKATHON" ? (
                              <Trophy className="w-5 h-5 text-white" />
                            ) : (
                              <FileText className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm">
                            {idx + 1}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-elm-navy group-hover:text-brand-600 transition-colors truncate">
                            {event.titleAr || event.title}
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {event.organization?.nameAr || "—"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-bold text-elm-navy">{event._count.members}</span>
                        </div>

                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${sc.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          <span className={`text-xs font-medium ${sc.text}`}>
                            {statusLabels[event.status] || event.status}
                          </span>
                        </div>

                        <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-brand-400 group-hover:-translate-x-1 transition-all" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column (spans 5 cols) ── */}
          <div className="xl:col-span-5 space-y-6">

            {/* Completion Rate Ring */}
            <div className="bento-card p-6 animate-fade-in-up delay-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Target className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-elm-navy">نسبة الإنجاز</h3>
                  <p className="text-xs text-gray-400">الفعاليات المكتملة من الإجمالي</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {/* SVG Ring */}
                <div className="relative w-28 h-28 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="url(#progressGrad)" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${completionRate * 2.64} 264`}
                      className="animate-bar-grow"
                    />
                    <defs>
                      <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#14B8A6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-extrabold text-elm-navy">{completionRate}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">مكتملة</span>
                    <span className="text-sm font-bold text-teal-600">{completedEvents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">نشطة</span>
                    <span className="text-sm font-bold text-brand-600">{activeEvents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">الإجمالي</span>
                    <span className="text-sm font-bold text-elm-navy">{totalEvents}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="bento-card overflow-hidden animate-fade-in-up delay-5">
              <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-elm-navy">توزيع الأدوار</h3>
                    <p className="text-xs text-gray-400">
                      {totalUsers} مستخدم في {roleStats.length} أدوار
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                {roleStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">لا توجد بيانات</div>
                ) : (
                  <div className="space-y-3">
                    {roleStats.map((role, i) => {
                      const pct = Math.round((role.count / maxRoleCount) * 100);
                      return (
                        <div key={role.nameAr} className={`animate-fade-in-up delay-${i + 1}`}>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white"
                              style={{ backgroundColor: role.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium text-gray-700 truncate">
                                  {role.nameAr}
                                </span>
                                <span className="text-xs font-bold text-elm-navy mr-2">{role.count}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700 ease-out animate-bar-grow"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: role.color,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">الإجمالي</span>
                  <span className="text-sm font-extrabold text-elm-navy">{totalUsers} مستخدم</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Quick Access Bento Tiles ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            { label: "إدارة المستخدمين", value: totalUsers, sub: "مستخدم", icon: Users, href: "/admin/users", gradient: "from-brand-500 to-purple-600", bg: "bg-brand-50", text: "text-brand-600", border: "border-brand-100" },
            { label: "إدارة المؤسسات", value: totalOrganizations, sub: "مؤسسة", icon: Building2, href: "/admin/organizations", gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
            { label: "إدارة الفعاليات", value: totalEvents, sub: "فعالية", icon: Calendar, href: "/organization/events", gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
            { label: "الأدوار والصلاحيات", value: roleStats.length, sub: "دور", icon: Shield, href: "/admin/roles", gradient: "from-purple-500 to-pink-500", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
          ].map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={`bento-card ring-click p-5 group cursor-pointer animate-fade-in-up delay-${i + 1}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-extrabold text-elm-navy">{item.value} <span className="text-xs font-medium text-gray-400">{item.sub}</span></p>
                  <p className="text-xs text-gray-500 group-hover:text-brand-500 transition-colors">{item.label}</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-brand-400 group-hover:-translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
