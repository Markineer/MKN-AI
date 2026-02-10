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
  Shuffle,
  AlertTriangle,
  X,
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

const evalMethodLabels: Record<string, string> = {
  AI_AUTO: "تقييم آلي",
  JUDGE_MANUAL: "تحكيم يدوي",
  COMBINED: "مدمج",
  MENTOR_REVIEW: "مراجعة مرشد",
  PEER_REVIEW: "مراجعة أقران",
};

const evalMethodColors: Record<string, string> = {
  AI_AUTO: "bg-cyan-50 text-cyan-700",
  JUDGE_MANUAL: "bg-brand-50 text-brand-600",
  COMBINED: "bg-amber-50 text-amber-700",
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

  // Preview distribution
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

  // Execute distribution
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
  const judges = event.members.filter(m => m.role === "JUDGE" && m.status === "APPROVED");
  const judgingPhases = event.phases.filter(p =>
    p.evaluationMethod === "JUDGE_MANUAL" || p.evaluationMethod === "COMBINED"
  );

  const managementLinks = [
    { href: `/event/${event.id}/participants`, label: "المشاركين", icon: Users, count: event._count.members },
    { href: `/event/${event.id}/teams`, label: "الفرق", icon: Users, count: event._count.teams },
    { href: `/event/${event.id}/tracks`, label: "المسارات", icon: Layers, count: event.tracks.length },
    { href: `/event/${event.id}/phases`, label: "المراحل", icon: Clock, count: event.phases.length },
    { href: `/event/${event.id}/questions`, label: "الأسئلة", icon: FileText, count: event.challenges.reduce((a, c) => a + c.questions.length, 0) },
    { href: `/event/${event.id}/criteria`, label: "معايير التقييم", icon: Scale, count: event.evaluationCriteria.length },
    { href: `/event/${event.id}/judges`, label: "المحكمين", icon: Scale, count: judges.length },
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
            { label: "محكم", value: judges.length, icon: Scale, color: "text-purple-500", bg: "bg-purple-50" },
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

            {/* Judging & Distribution Overview */}
            {event.phases.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-elm-navy">التحكيم والتوزيع</h3>
                  {judgingPhases.length > 0 && judges.length > 0 && event.teams.length > 0 && (
                    <button
                      onClick={() => {
                        setShowDistModal(true);
                        setSelectedPhaseId(judgingPhases[0]?.id || "");
                        setDistPreview(null);
                        setDistDone(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-medium hover:bg-brand-600 transition-colors"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      توزيع المحكمين على الفرق
                    </button>
                  )}
                </div>

                {/* Per-phase cards */}
                <div className="space-y-3">
                  {event.phases.map((phase) => {
                    const evalMethod = phase.evaluationMethod;
                    return (
                      <div
                        key={phase.id}
                        className="p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 text-sm font-bold">
                              {phase.phaseNumber}
                            </div>
                            <span className="text-sm font-medium text-elm-navy">{phase.nameAr || phase.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {evalMethod && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${evalMethodColors[evalMethod] || "bg-gray-100 text-gray-600"}`}>
                                {evalMethodLabels[evalMethod] || evalMethod}
                              </span>
                            )}
                            {phase.isElimination && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
                                تصفية
                              </span>
                            )}
                            <span className={`text-[10px] px-2 py-0.5 rounded-md ${
                              phase.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                              phase.status === "ACTIVE" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {phase.status === "COMPLETED" ? "مكتمل" :
                               phase.status === "ACTIVE" ? "جاري" : "قادم"}
                            </span>
                          </div>
                        </div>

                        {/* Phase details row */}
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-gray-500 mt-2">
                          {phase.isElimination && phase.maxAdvancing && (
                            <span>يتأهل: {phase.maxAdvancing} فريق</span>
                          )}
                          {phase.isElimination && phase.advancePercent && (
                            <span>نسبة التأهل: {phase.advancePercent}%</span>
                          )}
                          {phase.isElimination && phase.passThreshold && (
                            <span>الحد الأدنى: {phase.passThreshold}</span>
                          )}
                          {phase.isElimination && (
                            <span>التأهل: {advancementLabels[phase.advancementMode] || phase.advancementMode}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Per-track judge/team breakdown */}
                {event.tracks.length > 0 && judges.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-500 mb-3">توزيع المحكمين على المسارات</h4>
                    <div className="space-y-2">
                      {event.tracks.map(track => {
                        const trackJudges = judges.filter(j => j.trackId === track.id);
                        const trackTeams = event.teams.filter(t => t.track?.id === track.id);
                        const teamsPerJudge = trackJudges.length > 0 ? Math.ceil(trackTeams.length / trackJudges.length) : 0;

                        return (
                          <div key={track.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: track.color || color }} />
                              <span className="text-xs font-medium text-gray-700">{track.nameAr || track.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-gray-500">
                              <span>{trackJudges.length} محكم</span>
                              <span>{trackTeams.length} فريق</span>
                              {trackJudges.length > 0 && (
                                <span className="text-brand-600 font-medium">~{teamsPerJudge} فريق/محكم</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {(() => {
                        const unassignedJudges = judges.filter(j => !j.trackId);
                        if (unassignedJudges.length === 0) return null;
                        return (
                          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                              <span className="text-xs font-medium text-amber-700">غير مخصص</span>
                            </div>
                            <span className="text-[11px] text-amber-600">{unassignedJudges.length} محكم</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                        <p className="text-sm font-medium text-elm-navy">{team.nameAr || team.name}</p>
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

      {/* Distribution Modal */}
      {showDistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Shuffle className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-elm-navy">توزيع المحكمين على الفرق</h2>
                  <p className="text-xs text-gray-400">توزيع عشوائي عادل حسب المسارات</p>
                </div>
              </div>
              <button
                onClick={() => setShowDistModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Phase Selector */}
            <div className="mb-5">
              <label className="text-xs font-medium text-gray-500 mb-2 block">اختر المرحلة</label>
              <div className="flex flex-wrap gap-2">
                {judgingPhases.map(phase => (
                  <button
                    key={phase.id}
                    onClick={() => {
                      setSelectedPhaseId(phase.id);
                      setDistPreview(null);
                      setDistDone(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      selectedPhaseId === phase.id
                        ? "bg-brand-50 border-brand-200 text-brand-600"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-brand-100 flex items-center justify-center text-brand-600 text-[10px] font-bold">
                      {phase.phaseNumber}
                    </span>
                    {phase.nameAr || phase.name}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${evalMethodColors[phase.evaluationMethod || ""] || "bg-gray-100 text-gray-500"}`}>
                      {evalMethodLabels[phase.evaluationMethod || ""] || "—"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview / Execute */}
            {!distPreview && !distLoading && (
              <button
                onClick={() => previewDistribution(selectedPhaseId)}
                disabled={!selectedPhaseId}
                className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                معاينة التوزيع
              </button>
            )}

            {distLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                <span className="mr-2 text-sm text-gray-500">جاري حساب التوزيع...</span>
              </div>
            )}

            {distPreview && !distLoading && (
              <div className="space-y-4">
                {/* Warnings */}
                {distPreview.warnings && distPreview.warnings.length > 0 && (
                  <div className="space-y-2">
                    {distPreview.warnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Distribution breakdown */}
                {distPreview.distributions.map((dist, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                      <div className="flex items-center gap-2">
                        {dist.trackColor && (
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dist.trackColor }} />
                        )}
                        <span className="text-sm font-medium text-elm-navy">{dist.trackName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span>{dist.judges.length} محكم</span>
                        <span>{dist.teams.length} فريق</span>
                        <span className="text-brand-600 font-medium">~{dist.teamsPerJudge} فريق/محكم</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        {dist.judges.map(judge => {
                          const judgeAssignments = dist.assignments.filter(a => a.judgeId === judge.memberId);
                          return (
                            <div key={judge.memberId} className="flex items-start gap-3">
                              <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 text-[10px] font-bold flex-shrink-0 mt-0.5">
                                {judge.name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-elm-navy">{judge.name}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {judgeAssignments.map(a => (
                                    <span key={a.teamId} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-md text-gray-600">
                                      {a.teamName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-400 flex-shrink-0">{judgeAssignments.length} فريق</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Execute / Done */}
                {distDone ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-emerald-700">تم التوزيع بنجاح</p>
                      <p className="text-xs text-emerald-600">تم إنشاء {distPreview.created} مهمة تحكيم</p>
                    </div>
                  </div>
                ) : distPreview.distributions.length > 0 ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => previewDistribution(selectedPhaseId)}
                      className="flex-1 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      إعادة الخلط
                    </button>
                    <button
                      onClick={executeDistribution}
                      disabled={distExecuting}
                      className="flex-1 py-3 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
