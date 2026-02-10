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
  Trash2,
  Eye,
  Loader2,
  ArrowRight,
  FileText,
  Scale,
  GraduationCap,
  Award,
  Layers,
  MessageSquare,
  BarChart3,
  CheckCircle,
  XCircle,
  Globe,
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
  phases: { id: string; nameAr: string; phaseNumber: number; status: string }[];
  members: {
    id: string;
    role: string;
    status: string;
    user: { id: string; firstNameAr: string | null; lastNameAr: string | null; email: string; avatar: string | null };
  }[];
  teams: {
    id: string;
    nameAr: string;
    members: { id: string }[];
    track: { nameAr: string; color: string } | null;
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

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-blue-100 text-blue-600",
  REGISTRATION_OPEN: "bg-cyan-100 text-cyan-700",
  IN_PROGRESS: "bg-emerald-100 text-emerald-700",
  EVALUATION: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-purple-100 text-purple-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  REGISTRATION_OPEN: "التسجيل مفتوح",
  IN_PROGRESS: "جاري",
  EVALUATION: "تقييم",
  COMPLETED: "مكتمل",
  ARCHIVED: "مؤرشف",
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div>
        <TopBar title="Event" titleAr="تفاصيل الفعالية" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <span className="mr-2 text-sm text-gray-500">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div>
        <TopBar title="Event" titleAr="تفاصيل الفعالية" />
        <div className="text-center py-32">
          <XCircle className="w-12 h-12 mx-auto mb-3 text-red-300" />
          <p className="text-lg font-medium text-gray-600">{error || "الفعالية غير موجودة"}</p>
          <button
            onClick={() => router.push("/organization/events")}
            className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm hover:bg-brand-600 transition-colors"
          >
            العودة للفعاليات
          </button>
        </div>
      </div>
    );
  }

  const color = event.primaryColor || "#7C3AED";

  const managementLinks = [
    { href: `/event/${event.id}/participants`, label: "المشاركين", icon: Users, count: event._count.members },
    { href: `/event/${event.id}/teams`, label: "الفرق", icon: Users, count: event._count.teams },
    { href: `/event/${event.id}/tracks`, label: "المسارات", icon: Layers, count: event.tracks.length },
    { href: `/event/${event.id}/phases`, label: "المراحل", icon: Clock, count: event.phases.length },
    { href: `/event/${event.id}/questions`, label: "الأسئلة", icon: FileText, count: event.challenges.reduce((a, c) => a + c.questions.length, 0) },
    { href: `/event/${event.id}/criteria`, label: "معايير التقييم", icon: Scale, count: event.evaluationCriteria.length },
    { href: `/event/${event.id}/judges`, label: "المحكمين", icon: Scale, count: event.members.filter(m => m.role === "JUDGE").length },
    { href: `/event/${event.id}/mentors`, label: "المرشدين", icon: GraduationCap, count: event.members.filter(m => m.role === "MENTOR").length },
    { href: `/event/${event.id}/submissions`, label: "التقديمات", icon: FileText, count: event._count.submissions },
    { href: `/event/${event.id}/certificates`, label: "الشهادات", icon: Award, count: event._count.certificates },
    { href: `/event/${event.id}/settings`, label: "الإعدادات", icon: Settings, count: null },
  ];

  return (
    <div>
      <TopBar title="Event Details" titleAr="تفاصيل الفعالية" />
      <div className="p-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/organization/events")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 transition-colors mb-6"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للفعاليات
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="h-3" style={{ backgroundColor: color }} />
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white"
                  style={{ backgroundColor: color }}
                >
                  {event.type === "HACKATHON" ? (
                    <Trophy className="w-8 h-8" />
                  ) : (
                    <BookOpen className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-elm-navy">{event.titleAr || event.title}</h1>
                  <p className="text-sm text-gray-400 mt-0.5">{event.organization?.nameAr || "—"}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`badge ${statusColors[event.status] || "bg-gray-100 text-gray-600"}`}>
                      {statusLabels[event.status] || event.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-50 rounded-md text-gray-500">
                      {typeLabels[event.type] || event.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-50 rounded-md text-gray-500">
                      {categoryLabels[event.category] || event.category}
                    </span>
                    {event.aiEvaluationEnabled && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-brand-50 rounded-md text-brand-600">
                        <Cpu className="w-3 h-3" />
                        AI
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/event/${event.id}/settings`}>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                    <Edit className="w-4 h-4" />
                    تعديل
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: "مشارك", value: event._count.members, icon: Users, color: "text-brand-500", bg: "bg-brand-50" },
            { label: "فريق", value: event._count.teams, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "مسار", value: event.tracks.length, icon: Layers, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "مرحلة", value: event.phases.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "تقديم", value: event._count.submissions, icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "شهادة", value: event._count.certificates, icon: Award, color: "text-cyan-500", bg: "bg-cyan-50" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-elm-navy">{stat.value}</p>
                <p className="text-[11px] text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {(event.descriptionAr || event.description) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-elm-navy mb-3">الوصف</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {event.descriptionAr || event.description}
                </p>
              </div>
            )}

            {/* Event Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-elm-navy mb-4">معلومات الفعالية</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[11px] text-gray-400">تاريخ البداية</p>
                    <p className="text-sm font-medium text-elm-navy">{formatDate(event.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[11px] text-gray-400">تاريخ النهاية</p>
                    <p className="text-sm font-medium text-elm-navy">{formatDate(event.endDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[11px] text-gray-400">الموقع</p>
                    <p className="text-sm font-medium text-elm-navy">
                      {event.isOnline ? "عن بعد" : (event.locationAr || event.location || "غير محدد")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[11px] text-gray-400">نوع التسجيل</p>
                    <p className="text-sm font-medium text-elm-navy">{regModeLabels[event.registrationMode] || event.registrationMode}</p>
                  </div>
                </div>
                {event.maxParticipants && (
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[11px] text-gray-400">الحد الأقصى</p>
                      <p className="text-sm font-medium text-elm-navy">{event.maxParticipants} مشارك</p>
                    </div>
                  </div>
                )}
                {event.registrationEnd && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[11px] text-gray-400">آخر موعد للتسجيل</p>
                      <p className="text-sm font-medium text-elm-navy">{formatDate(event.registrationEnd)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tracks */}
            {event.tracks.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-elm-navy mb-4">المسارات</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {event.tracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: track.color || color }}
                      />
                      <span className="text-sm font-medium text-elm-navy">{track.nameAr || track.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phases */}
            {event.phases.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-elm-navy mb-4">المراحل</h3>
                <div className="space-y-3">
                  {event.phases.map((phase) => (
                    <div
                      key={phase.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 text-sm font-bold">
                          {phase.phaseNumber}
                        </div>
                        <span className="text-sm font-medium text-elm-navy">{phase.nameAr}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-md ${
                        phase.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                        phase.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {phase.status === "COMPLETED" ? "مكتمل" :
                         phase.status === "IN_PROGRESS" ? "جاري" : "قادم"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Management Links */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-elm-navy mb-4">إدارة الفعالية</h3>
              <div className="space-y-1">
                {managementLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                      <span className="text-sm text-gray-600 group-hover:text-elm-navy transition-colors">{link.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {link.count !== null && (
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                          {link.count}
                        </span>
                      )}
                      <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Teams */}
            {event.teams.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-elm-navy mb-4">أحدث الفرق</h3>
                <div className="space-y-3">
                  {event.teams.slice(0, 5).map((team) => (
                    <div key={team.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-elm-navy">{team.nameAr}</p>
                        {team.track && (
                          <p className="text-[11px] text-gray-400">{team.track.nameAr}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{team.members.length} عضو</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evaluation Criteria */}
            {event.evaluationCriteria.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-elm-navy mb-4">معايير التقييم</h3>
                <div className="space-y-3">
                  {event.evaluationCriteria.map((criteria) => (
                    <div key={criteria.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{criteria.nameAr}</span>
                      <span className="text-xs font-medium text-brand-500">{criteria.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
