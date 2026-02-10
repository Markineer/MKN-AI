"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import {
  Trophy,
  BookOpen,
  Calendar,
  Users,
  MapPin,
  Clock,
  Cpu,
  Settings,
  ChevronLeft,
  Edit,
  Loader2,
  ArrowRight,
  FileText,
  Scale,
  GraduationCap,
  Award,
  Layers,
  CheckCircle,
  XCircle,
  Globe,
  Shuffle,
  AlertTriangle,
  X,
  Target,
  Zap,
  TrendingUp,
  Shield,
} from "lucide-react";

interface EventDetail {
  id: string;
  title: string;
  titleAr: string;
  slug: string;
  description: string | null;
  descriptionAr: string | null;
  type: string;
  category: string;
  status: string;
  visibility: string;
  startDate: string;
  endDate: string;
  registrationStart: string | null;
  registrationEnd: string | null;
  location: string | null;
  locationAr: string | null;
  isOnline: boolean;
  onlineLink: string | null;
  maxParticipants: number | null;
  registrationMode: string;
  minTeamSize: number | null;
  maxTeamSize: number | null;
  hasPhases: boolean;
  hasElimination: boolean;
  totalPhases: number | null;
  primaryColor: string | null;
  aiEvaluationEnabled: boolean;
  rules: string | null;
  rulesAr: string | null;
  prizes: any;
  publishedAt: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    nameAr: string;
    logo: string | null;
  } | null;
  tracks: { id: string; name: string; nameAr: string; color: string }[];
  phases: {
    id: string;
    name: string;
    nameAr: string;
    phaseNumber: number;
    status: string;
    evaluationMethod: string | null;
    isElimination: boolean;
    advancementMode: string;
    passThreshold: number | null;
    maxAdvancing: number | null;
    advancePercent: number | null;
  }[];
  members: {
    id: string;
    role: string;
    status: string;
    trackId: string | null;
    user: { id: string; firstName: string; firstNameAr: string | null; lastName: string; lastNameAr: string | null; email: string; avatar: string | null };
  }[];
  teams: {
    id: string;
    name: string;
    nameAr: string;
    members: { id: string }[];
    track: { id: string; nameAr: string; color: string } | null;
  }[];
  evaluationCriteria: { id: string; nameAr: string; weight: number }[];
  challenges: { id: string; titleAr: string; questions: { id: string }[] }[];
  _count: {
    members: number;
    teams: number;
    submissions: number;
    certificates: number;
  };
}

interface DistributionResult {
  distributions: {
    trackId: string;
    trackName: string;
    trackColor: string | null;
    judges: { id: string; memberId: string; name: string }[];
    teams: { id: string; name: string }[];
    assignments: { judgeId: string; judgeName: string; teamId: string; teamName: string }[];
    teamsPerJudge: number;
  }[];
  warnings: string[];
  created?: number;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: "مسودة" },
  PUBLISHED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "منشور" },
  REGISTRATION_OPEN: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500", label: "التسجيل مفتوح" },
  IN_PROGRESS: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "جاري" },
  EVALUATION: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "تقييم" },
  COMPLETED: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", label: "مكتمل" },
  ARCHIVED: { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-400", label: "مؤرشف" },
};

const typeLabels: Record<string, string> = {
  HACKATHON: "هاكاثون",
  CHALLENGE: "تحدي",
  COMPETITION: "مسابقة",
  WORKSHOP: "ورشة عمل",
  ASSESSMENT: "تقييم مستوى",
};

const categoryLabels: Record<string, string> = {
  PROGRAMMING: "برمجة",
  LEGAL: "قانوني",
  AI_ML: "ذكاء اصطناعي",
  BUSINESS: "أعمال",
  DESIGN: "تصميم",
  HEALTH: "صحة",
  CYBERSECURITY: "أمن سيبراني",
  DATA_SCIENCE: "علوم بيانات",
  GENERAL: "عام",
};

const regModeLabels: Record<string, string> = {
  INDIVIDUAL: "فردي",
  TEAM: "فرق",
  BOTH: "فردي وفرق",
};

const evalMethodLabels: Record<string, string> = {
  AI_AUTO: "تقييم آلي",
  JUDGE_MANUAL: "تحكيم يدوي",
  COMBINED: "مدمج",
  MENTOR_REVIEW: "مراجعة مرشد",
  PEER_REVIEW: "مراجعة أقران",
};

const evalMethodColors: Record<string, string> = {
  AI_AUTO: "bg-cyan-50 text-cyan-700 border-cyan-200",
  JUDGE_MANUAL: "bg-brand-50 text-brand-600 border-brand-200",
  COMBINED: "bg-amber-50 text-amber-700 border-amber-200",
  MENTOR_REVIEW: "bg-green-50 text-green-700 border-green-200",
  PEER_REVIEW: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const evalMethodIcons: Record<string, typeof Cpu> = {
  AI_AUTO: Cpu,
  JUDGE_MANUAL: Scale,
  COMBINED: Zap,
  MENTOR_REVIEW: GraduationCap,
  PEER_REVIEW: Users,
};

const advancementLabels: Record<string, string> = {
  PER_TRACK: "الأفضل من كل مسار",
  OVERALL: "الأفضل من جميع المسارات",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Distribution modal state
  const [showDistModal, setShowDistModal] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("");
  const [distPreview, setDistPreview] = useState<DistributionResult | null>(null);
  const [distLoading, setDistLoading] = useState(false);
  const [distExecuting, setDistExecuting] = useState(false);
  const [distDone, setDistDone] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) setError("الفعالية غير موجودة");
          else setError("خطأ في تحميل البيانات");
          return;
        }
        const data = await res.json();
        setEvent(data);
      } catch {
        setError("خطأ في الاتصال");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchEvent();
  }, [params.id]);

  async function previewDistribution(phaseId: string) {
    setDistLoading(true);
    setDistPreview(null);
    setDistDone(false);
    try {
      const res = await fetch(`/api/events/${event!.id}/distribute?phaseId=${phaseId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDistPreview(data);
    } catch {
      setDistPreview({ distributions: [], warnings: ["خطأ في تحميل المعاينة"] });
    } finally {
      setDistLoading(false);
    }
  }

  async function executeDistribution() {
    if (!selectedPhaseId) return;
    setDistExecuting(true);
    try {
      const res = await fetch(`/api/events/${event!.id}/distribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId: selectedPhaseId }),
      });
      if (!res.ok) {
        const err = await res.json();
        setDistPreview(prev => prev ? {
          ...prev,
          warnings: [...(prev.warnings || []), err.error || "خطأ في التوزيع"],
        } : null);
        return;
      }
      const data = await res.json();
      setDistPreview(data);
      setDistDone(true);
    } catch {
      // silently fail
    } finally {
      setDistExecuting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Event" titleAr="تفاصيل الفعالية" />
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
          <span className="text-sm text-gray-400">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div>
        <TopBar title="Event" titleAr="تفاصيل الفعالية" />
        <div className="text-center py-32">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-300" />
          </div>
          <p className="text-lg font-bold text-gray-700 mb-1">{error || "الفعالية غير موجودة"}</p>
          <p className="text-sm text-gray-400 mb-6">تعذر العثور على الفعالية المطلوبة</p>
          <button
            onClick={() => router.push("/organization/events")}
            className="px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-all shadow-sm hover:shadow-md"
          >
            العودة للفعاليات
          </button>
        </div>
      </div>
    );
  }

  const color = event.primaryColor || "#7C3AED";
  const judges = event.members.filter(m => m.role === "JUDGE" && m.status === "APPROVED");
  const judgingPhases = event.phases.filter(p =>
    p.evaluationMethod === "JUDGE_MANUAL" || p.evaluationMethod === "COMBINED"
  );
  const daysRemaining = getDaysRemaining(event.endDate);
  const status = statusConfig[event.status] || statusConfig.DRAFT;

  const managementLinks = [
    { href: `/event/${event.id}/participants`, label: "المشاركين", icon: Users, count: event._count.members, color: "text-blue-500", bg: "bg-blue-50" },
    { href: `/event/${event.id}/teams`, label: "الفرق", icon: Users, count: event._count.teams, color: "text-emerald-500", bg: "bg-emerald-50" },
    { href: `/event/${event.id}/tracks`, label: "المسارات", icon: Layers, count: event.tracks.length, color: "text-purple-500", bg: "bg-purple-50" },
    { href: `/event/${event.id}/phases`, label: "المراحل", icon: Clock, count: event.phases.length, color: "text-amber-500", bg: "bg-amber-50" },
    { href: `/event/${event.id}/questions`, label: "الأسئلة", icon: FileText, count: event.challenges.reduce((a, c) => a + c.questions.length, 0), color: "text-orange-500", bg: "bg-orange-50" },
    { href: `/event/${event.id}/criteria`, label: "معايير التقييم", icon: Target, count: event.evaluationCriteria.length, color: "text-pink-500", bg: "bg-pink-50" },
    { href: `/event/${event.id}/judges`, label: "المحكمين", icon: Scale, count: judges.length, color: "text-brand-500", bg: "bg-brand-50" },
    { href: `/event/${event.id}/mentors`, label: "المرشدين", icon: GraduationCap, count: event.members.filter(m => m.role === "MENTOR").length, color: "text-teal-500", bg: "bg-teal-50" },
    { href: `/event/${event.id}/submissions`, label: "التقديمات", icon: FileText, count: event._count.submissions, color: "text-indigo-500", bg: "bg-indigo-50" },
    { href: `/event/${event.id}/certificates`, label: "الشهادات", icon: Award, count: event._count.certificates, color: "text-yellow-600", bg: "bg-yellow-50" },
    { href: `/event/${event.id}/settings`, label: "الإعدادات", icon: Settings, count: null, color: "text-gray-500", bg: "bg-gray-50" },
  ];

  return (
    <div>
      <TopBar title="Event Details" titleAr="تفاصيل الفعالية" />
      <div className="p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/organization/events")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-500 transition-colors mb-6 group"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          العودة للفعاليات
        </button>

        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-sm">
          {/* Gradient Background */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}88 50%, transparent 100%)`,
            }}
          />
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />

          {/* Color Strip */}
          <div className="h-1.5 relative" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* Left: Event Info */}
              <div className="flex items-start gap-5">
                <div
                  className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 8px 24px ${color}40` }}
                >
                  {event.type === "HACKATHON" ? (
                    <Trophy className="w-8 h-8" />
                  ) : event.type === "COMPETITION" ? (
                    <Award className="w-8 h-8" />
                  ) : (
                    <BookOpen className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-elm-navy mb-1">{event.titleAr || event.title}</h1>
                  <p className="text-sm text-gray-400 mb-3">{event.organization?.nameAr || "—"}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {typeLabels[event.type] || event.type}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {categoryLabels[event.category] || event.category}
                    </span>
                    {event.aiEvaluationEnabled && (
                      <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-gradient-to-l from-brand-50 to-cyan-50 text-brand-600 font-medium border border-brand-100">
                        <Cpu className="w-3 h-3" />
                        AI
                      </span>
                    )}
                    {event.isOnline && (
                      <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-600 font-medium">
                        <Globe className="w-3 h-3" />
                        عن بعد
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions + Date */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <Link href={`/event/${event.id}/settings`}>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm hover:shadow-md group">
                    <Edit className="w-4 h-4 group-hover:text-brand-500 transition-colors" />
                    تعديل الفعالية
                  </button>
                </Link>
                <div className="text-left text-xs text-gray-400">
                  {daysRemaining > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      متبقي {daysRemaining} يوم
                    </span>
                  ) : daysRemaining === 0 ? (
                    <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                      <Zap className="w-3.5 h-3.5" />
                      اليوم
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      انتهت منذ {Math.abs(daysRemaining)} يوم
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "مشارك", value: event._count.members, icon: Users, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100" },
            { label: "فريق", value: event._count.teams, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
            { label: "مسار", value: event.tracks.length, icon: Layers, color: "text-purple-600", bg: "bg-purple-50", ring: "ring-purple-100" },
            { label: "مرحلة", value: event.phases.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100" },
            { label: "محكم", value: judges.length, icon: Scale, color: "text-brand-600", bg: "bg-brand-50", ring: "ring-brand-100" },
            { label: "شهادة", value: event._count.certificates, icon: Award, color: "text-cyan-600", bg: "bg-cyan-50", ring: "ring-cyan-100" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-all hover:shadow-md group cursor-default"
            >
              <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center mb-3 ring-4 ${stat.ring} group-hover:scale-105 transition-transform`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-elm-navy">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {(event.descriptionAr || event.description) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-brand-500" />
                  </div>
                  <h3 className="text-sm font-bold text-elm-navy">الوصف</h3>
                </div>
                <p className="text-sm text-gray-600 leading-7">
                  {event.descriptionAr || event.description}
                </p>
              </div>
            )}

            {/* Event Info Cards */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-elm-navy">معلومات الفعالية</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Calendar, iconColor: "text-blue-500", iconBg: "bg-blue-50", label: "تاريخ البداية", value: formatDate(event.startDate) },
                  { icon: Calendar, iconColor: "text-red-400", iconBg: "bg-red-50", label: "تاريخ النهاية", value: formatDate(event.endDate) },
                  { icon: event.isOnline ? Globe : MapPin, iconColor: "text-emerald-500", iconBg: "bg-emerald-50", label: "الموقع", value: event.isOnline ? "عن بعد" : (event.locationAr || event.location || "غير محدد") },
                  { icon: Users, iconColor: "text-purple-500", iconBg: "bg-purple-50", label: "نوع التسجيل", value: regModeLabels[event.registrationMode] || event.registrationMode },
                  ...(event.maxParticipants ? [{ icon: Users, iconColor: "text-amber-500", iconBg: "bg-amber-50", label: "الحد الأقصى", value: `${event.maxParticipants} مشارك` }] : []),
                  ...(event.registrationEnd ? [{ icon: Clock, iconColor: "text-pink-500", iconBg: "bg-pink-50", label: "آخر موعد للتسجيل", value: formatDate(event.registrationEnd) }] : []),
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-9 h-9 ${item.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400">{item.label}</p>
                      <p className="text-sm font-medium text-elm-navy truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phases Timeline */}
            {event.phases.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="text-sm font-bold text-elm-navy">المراحل</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">
                      {event.phases.length} مراحل
                    </span>
                  </div>
                  {judgingPhases.length > 0 && judges.length > 0 && event.teams.length > 0 && (
                    <button
                      onClick={() => {
                        setShowDistModal(true);
                        setSelectedPhaseId(judgingPhases[0]?.id || "");
                        setDistPreview(null);
                        setDistDone(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-medium hover:bg-brand-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      توزيع المحكمين
                    </button>
                  )}
                </div>

                {/* Timeline */}
                <div className="relative">
                  {event.phases.map((phase, idx) => {
                    const evalMethod = phase.evaluationMethod;
                    const EvalIcon = evalMethod ? (evalMethodIcons[evalMethod] || Scale) : null;
                    const isLast = idx === event.phases.length - 1;
                    const isCompleted = phase.status === "COMPLETED";
                    const isActive = phase.status === "ACTIVE";

                    return (
                      <div key={phase.id} className="relative flex gap-4">
                        {/* Timeline Line + Dot */}
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                            isCompleted
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                              : isActive
                              ? "bg-brand-500 text-white shadow-md shadow-brand-200 animate-pulse"
                              : "bg-gray-100 text-gray-400"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              phase.phaseNumber
                            )}
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 flex-1 my-1 min-h-[24px] ${
                              isCompleted ? "bg-emerald-200" : "bg-gray-100"
                            }`} />
                          )}
                        </div>

                        {/* Phase Content */}
                        <div className={`flex-1 pb-5 ${isLast ? "pb-0" : ""}`}>
                          <div className={`p-4 rounded-xl border transition-all ${
                            isActive
                              ? "bg-brand-50/50 border-brand-200 shadow-sm"
                              : isCompleted
                              ? "bg-emerald-50/30 border-emerald-100"
                              : "bg-gray-50/50 border-gray-100"
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-elm-navy">{phase.nameAr || phase.name}</h4>
                              <div className="flex items-center gap-1.5">
                                {evalMethod && (
                                  <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium border ${evalMethodColors[evalMethod] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                    {EvalIcon && <EvalIcon className="w-3 h-3" />}
                                    {evalMethodLabels[evalMethod] || evalMethod}
                                  </span>
                                )}
                                {phase.isElimination && (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium bg-red-50 text-red-600 border border-red-200">
                                    <Shield className="w-3 h-3" />
                                    تصفية
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Phase Details */}
                            {phase.isElimination && (
                              <div className="flex flex-wrap gap-3 mt-2">
                                {phase.maxAdvancing && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white px-2.5 py-1 rounded-lg">
                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                    يتأهل {phase.maxAdvancing} فريق
                                  </span>
                                )}
                                {phase.advancePercent && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white px-2.5 py-1 rounded-lg">
                                    <Target className="w-3 h-3 text-blue-500" />
                                    {phase.advancePercent}%
                                  </span>
                                )}
                                {phase.passThreshold && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white px-2.5 py-1 rounded-lg">
                                    <Scale className="w-3 h-3 text-amber-500" />
                                    الحد الأدنى: {phase.passThreshold}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white px-2.5 py-1 rounded-lg">
                                  <Layers className="w-3 h-3 text-purple-500" />
                                  {advancementLabels[phase.advancementMode] || phase.advancementMode}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tracks Visual Grid */}
            {event.tracks.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-purple-500" />
                  </div>
                  <h3 className="text-sm font-bold text-elm-navy">المسارات</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">
                    {event.tracks.length} مسارات
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {event.tracks.map((track) => {
                    const trackTeams = event.teams.filter(t => t.track?.id === track.id);
                    const trackJudges = judges.filter(j => j.trackId === track.id);
                    return (
                      <div
                        key={track.id}
                        className="relative p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group overflow-hidden"
                      >
                        {/* Top Color Accent */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                          style={{ backgroundColor: track.color || color }}
                        />
                        <div className="flex items-center gap-3 mt-1">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${track.color || color}15` }}
                          >
                            <Layers className="w-5 h-5" style={{ color: track.color || color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-elm-navy truncate">{track.nameAr || track.name}</p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                              <span>{trackTeams.length} فريق</span>
                              <span>{trackJudges.length} محكم</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Judging Distribution Overview */}
            {event.tracks.length > 0 && judges.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-brand-500" />
                  </div>
                  <h3 className="text-sm font-bold text-elm-navy">توزيع المحكمين على المسارات</h3>
                </div>
                <div className="space-y-3">
                  {event.tracks.map(track => {
                    const trackJudges = judges.filter(j => j.trackId === track.id);
                    const trackTeams = event.teams.filter(t => t.track?.id === track.id);
                    const teamsPerJudge = trackJudges.length > 0 ? Math.ceil(trackTeams.length / trackJudges.length) : 0;
                    const ratio = trackJudges.length > 0 && trackTeams.length > 0
                      ? Math.min(100, Math.round((trackJudges.length / trackTeams.length) * 100))
                      : 0;

                    return (
                      <div key={track.id} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3 h-3 rounded-full ring-4"
                              style={{
                                backgroundColor: track.color || color,
                                boxShadow: `0 0 0 4px ${track.color || color}20`,
                              }}
                            />
                            <span className="text-sm font-medium text-elm-navy">{track.nameAr || track.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-500">{trackJudges.length} محكم</span>
                            <span className="text-gray-500">{trackTeams.length} فريق</span>
                            {trackJudges.length > 0 && (
                              <span className="text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-md">
                                ~{teamsPerJudge} فريق/محكم
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${ratio}%`,
                              backgroundColor: track.color || color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(() => {
                    const unassignedJudges = judges.filter(j => !j.trackId);
                    if (unassignedJudges.length === 0) return null;
                    return (
                      <div className="flex items-center justify-between p-4 bg-amber-50/80 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-medium text-amber-700">محكمون بدون مسار</span>
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                          {unassignedJudges.length} محكم
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Management Links */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-gray-500" />
                </div>
                <h3 className="text-sm font-bold text-elm-navy">إدارة الفعالية</h3>
              </div>
              <div className="space-y-1">
                {managementLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${link.bg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <link.icon className={`w-4 h-4 ${link.color}`} />
                      </div>
                      <span className="text-sm text-gray-600 group-hover:text-elm-navy font-medium transition-colors">{link.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {link.count !== null && (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-lg group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                          {link.count}
                        </span>
                      )}
                      <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-brand-500 group-hover:-translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Evaluation Criteria */}
            {event.evaluationCriteria.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Target className="w-4 h-4 text-pink-500" />
                  </div>
                  <h3 className="text-sm font-bold text-elm-navy">معايير التقييم</h3>
                </div>
                <div className="space-y-3">
                  {event.evaluationCriteria.map((criteria) => (
                    <div key={criteria.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-600">{criteria.nameAr}</span>
                        <span className="text-xs font-bold text-brand-600">{criteria.weight}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-brand-500 to-brand-400 transition-all duration-500"
                          style={{ width: `${criteria.weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Teams */}
            {event.teams.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="text-sm font-bold text-elm-navy">أحدث الفرق</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                    {event.teams.length} فريق
                  </span>
                </div>
                <div className="space-y-3">
                  {event.teams.slice(0, 5).map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-100 to-purple-100 rounded-lg flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">
                          {(team.nameAr || team.name)[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-elm-navy truncate">{team.nameAr || team.name}</p>
                          {team.track && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: team.track.color }} />
                              <p className="text-[11px] text-gray-400">{team.track.nameAr}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400 bg-white px-2 py-0.5 rounded-md flex-shrink-0">{team.members.length} عضو</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Distribution Modal */}
      {showDistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 mx-4 max-h-[85vh] overflow-y-auto border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
                  <Shuffle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-elm-navy">توزيع المحكمين على الفرق</h2>
                  <p className="text-xs text-gray-400">توزيع عشوائي عادل حسب المسارات</p>
                </div>
              </div>
              <button
                onClick={() => setShowDistModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Phase Selector */}
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-500 mb-3 block">اختر المرحلة</label>
              <div className="flex flex-wrap gap-2">
                {judgingPhases.map(phase => {
                  const EvalIcon = evalMethodIcons[phase.evaluationMethod || ""] || Scale;
                  return (
                    <button
                      key={phase.id}
                      onClick={() => {
                        setSelectedPhaseId(phase.id);
                        setDistPreview(null);
                        setDistDone(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        selectedPhaseId === phase.id
                          ? "bg-brand-50 border-brand-300 text-brand-600 shadow-sm shadow-brand-100"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        selectedPhaseId === phase.id ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {phase.phaseNumber}
                      </span>
                      {phase.nameAr || phase.name}
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${evalMethodColors[phase.evaluationMethod || ""] || "bg-gray-100 text-gray-500"}`}>
                        <EvalIcon className="w-2.5 h-2.5" />
                        {evalMethodLabels[phase.evaluationMethod || ""] || "-"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview / Execute */}
            {!distPreview && !distLoading && (
              <button
                onClick={() => previewDistribution(selectedPhaseId)}
                disabled={!selectedPhaseId}
                className="w-full py-3.5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:border-gray-300 transition-all disabled:opacity-50"
              >
                معاينة التوزيع
              </button>
            )}

            {distLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                </div>
                <span className="text-sm text-gray-400">جاري حساب التوزيع...</span>
              </div>
            )}

            {distPreview && !distLoading && (
              <div className="space-y-4">
                {/* Warnings */}
                {distPreview.warnings && distPreview.warnings.length > 0 && (
                  <div className="space-y-2">
                    {distPreview.warnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Distribution breakdown */}
                {distPreview.distributions.map((dist, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80">
                      <div className="flex items-center gap-2.5">
                        {dist.trackColor && (
                          <span
                            className="w-3 h-3 rounded-full ring-4"
                            style={{
                              backgroundColor: dist.trackColor,
                              boxShadow: `0 0 0 4px ${dist.trackColor}20`,
                            }}
                          />
                        )}
                        <span className="text-sm font-bold text-elm-navy">{dist.trackName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-gray-500">{dist.judges.length} محكم</span>
                        <span className="text-gray-500">{dist.teams.length} فريق</span>
                        <span className="text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-md">
                          ~{dist.teamsPerJudge} فريق/محكم
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {dist.judges.map(judge => {
                        const judgeAssignments = dist.assignments.filter(a => a.judgeId === judge.memberId);
                        return (
                          <div key={judge.memberId} className="flex items-start gap-3 p-3 bg-gray-50/60 rounded-xl">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: dist.trackColor || color }}
                            >
                              {judge.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-elm-navy">{judge.name}</p>
                                <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-md">{judgeAssignments.length} فريق</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {judgeAssignments.map(a => (
                                  <span key={a.teamId} className="text-[10px] px-2.5 py-1 bg-white rounded-lg text-gray-600 border border-gray-100 font-medium">
                                    {a.teamName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Execute / Done */}
                {distDone ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">تم التوزيع بنجاح</p>
                      <p className="text-xs text-emerald-600">تم إنشاء {distPreview.created} مهمة تحكيم</p>
                    </div>
                  </div>
                ) : distPreview.distributions.length > 0 ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => previewDistribution(selectedPhaseId)}
                      className="flex-1 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all"
                    >
                      إعادة الخلط
                    </button>
                    <button
                      onClick={executeDistribution}
                      disabled={distExecuting}
                      className="flex-1 py-3 bg-gradient-to-l from-brand-500 to-brand-600 text-white rounded-xl text-sm font-bold hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-brand-200"
                    >
                      {distExecuting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري التنفيذ...
                        </>
                      ) : (
                        "تنفيذ التوزيع"
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
