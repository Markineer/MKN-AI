"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import {
  Loader2,
  Users,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  Timer,
  ClipboardList,
  ArrowLeft,
  Sparkles,
  Video,
  MapPin,
  Megaphone,
  Coffee,
  Presentation,
  GraduationCap,
  AlertTriangle,
  Check,
  XCircle,
  ChevronLeft,
  ExternalLink,
  Trophy,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface TeamMember {
  name: string;
  role: string;
}

interface ActiveEvent {
  id: string;
  titleAr: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  primaryColor: string;
}

interface TeamInfo {
  id: string;
  nameAr: string;
  trackName: string | null;
  trackColor: string | null;
  projectTitle: string | null;
  members: TeamMember[];
}

interface DeliverableField {
  type: string;
  enabled: boolean;
  required: boolean;
  label: string;
}

interface CurrentPhase {
  id: string;
  nameAr: string;
  phaseType: string;
  status: string;
  startDate: string;
  endDate: string;
  descriptionAr: string | null;
  deliverableConfig: { fields: DeliverableField[] } | null;
  hasSubmitted: boolean;
  isElimination: boolean;
}

interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  isOnline: boolean;
  isInPerson: boolean;
  onlineLink?: string | null;
  location?: string | null;
  speaker?: string | null;
  date?: string;
}

interface PhaseInfo {
  id: string;
  nameAr: string;
  status: string;
  phaseNumber: number;
  phaseType: string;
}

interface ProgressInfo {
  totalPhases: number;
  completedPhases: number;
  percentage: number;
}

interface OtherTeam {
  teamId: string;
  teamName: string;
  eventId: string;
  eventName: string;
  eventStatus: string;
  trackName: string | null;
  trackColor: string | null;
  memberCount: number;
}

interface DashboardData {
  activeEvent: ActiveEvent | null;
  team?: TeamInfo;
  currentPhase?: CurrentPhase | null;
  schedule?: {
    today: ScheduleItem[];
    tomorrow: ScheduleItem[];
    upcoming: ScheduleItem[];
  };
  allPhases?: PhaseInfo[];
  progress?: ProgressInfo;
  otherTeams: OtherTeam[];
}

// ─── Config Maps ─────────────────────────────────────────────────

const eventTypeLabels: Record<string, string> = {
  HACKATHON: "هاكاثون",
  CHALLENGE: "تحدي",
  COMPETITION: "مسابقة",
  WORKSHOP: "ورشة",
};

const phaseTypeLabels: Record<string, string> = {
  REGISTRATION: "تسجيل",
  IDEA_REVIEW: "مراجعة أفكار",
  DEVELOPMENT: "تطوير",
  PRESENTATION: "عرض تقديمي",
  JUDGING: "تحكيم",
  FINALS: "نهائيات",
  GENERAL: "عام",
  ELIMINATION: "تصفيات",
};

const scheduleTypeConfig: Record<
  string,
  { icon: any; label: string; color: string; bg: string }
> = {
  WORKSHOP: {
    icon: GraduationCap,
    label: "ورشة عمل",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  SESSION: {
    icon: Users,
    label: "جلسة",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  DEADLINE: {
    icon: AlertTriangle,
    label: "موعد تسليم",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  CEREMONY: {
    icon: Trophy,
    label: "حفل",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  BREAK: {
    icon: Coffee,
    label: "استراحة",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  MENTORING: {
    icon: Sparkles,
    label: "إرشاد",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  PRESENTATION: {
    icon: Presentation,
    label: "عرض",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────

function getRemainingTime(
  endDate: string
): { days: number; hours: number; minutes: number } | null {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

function formatDateAr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? parts[0].charAt(0) + parts[1].charAt(0)
    : parts[0]?.charAt(0) || "؟";
}

// ─── Main Component ─────────────────────────────────────────────

export default function TeamDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/team/active-dashboard");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <TopBar title="My Teams" titleAr="فرقي وتسليماتي" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-3">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.activeEvent) {
    // No active event — show simple teams list or empty state
    return (
      <div>
        <TopBar title="My Teams" titleAr="فرقي وتسليماتي" />
        <div className="p-6 lg:p-8">
          {data?.otherTeams && data.otherTeams.length > 0 ? (
            <OtherTeamsList teams={data.otherTeams} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                لا توجد فعاليات نشطة حالياً
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const { activeEvent, team, currentPhase, schedule, allPhases, progress, otherTeams } = data;

  return (
    <div>
      <TopBar title="My Teams" titleAr="فرقي وتسليماتي" />

      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
        {/* ═══ A. Event Header ═══ */}
        <EventHeader event={activeEvent} team={team!} progress={progress!} allPhases={allPhases!} />

        {/* ═══ B. Current Phase Card ═══ */}
        {currentPhase && (
          <CurrentPhaseCard phase={currentPhase} teamId={team!.id} />
        )}

        {/* ═══ C. Today's Schedule ═══ */}
        {schedule && schedule.today.length > 0 && (
          <ScheduleSection
            title="جدول اليوم"
            subtitle={formatDateAr(new Date().toISOString())}
            items={schedule.today}
            showLinks
          />
        )}

        {/* ═══ D. Tomorrow Preview ═══ */}
        {schedule && schedule.tomorrow.length > 0 && (
          <ScheduleSection
            title="غداً"
            subtitle={formatDateAr(
              new Date(Date.now() + 86400000).toISOString()
            )}
            items={schedule.tomorrow}
            showLinks={false}
          />
        )}

        {/* ═══ E. Upcoming Schedule ═══ */}
        {schedule && schedule.upcoming.length > 0 && (
          <UpcomingSection items={schedule.upcoming} />
        )}

        {/* ═══ F. Other Teams ═══ */}
        {otherTeams && otherTeams.length > 0 && (
          <div className="pt-4">
            <h3 className="text-sm font-bold text-gray-500 mb-3">
              فرق أخرى
            </h3>
            <OtherTeamsList teams={otherTeams} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────

function EventHeader({
  event,
  team,
  progress,
  allPhases,
}: {
  event: ActiveEvent;
  team: TeamInfo;
  progress: ProgressInfo;
  allPhases: PhaseInfo[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Color accent */}
      <div
        className="h-2"
        style={{ backgroundColor: event.primaryColor || "#7C3AED" }}
      />

      <div className="p-5">
        {/* Event Name + Badges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{event.titleAr}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700">
                {eventTypeLabels[event.type] || event.type}
              </span>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
                جاري
              </span>
            </div>
          </div>
        </div>

        {/* Team Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{team.nameAr}</p>
              {team.projectTitle && (
                <p className="text-xs text-gray-500">{team.projectTitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {team.trackName && (
              <span
                className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: team.trackColor ? `${team.trackColor}20` : "#f3f4f6",
                  color: team.trackColor || "#6b7280",
                }}
              >
                {team.trackName}
              </span>
            )}
            <div className="flex -space-x-1.5 rtl:space-x-reverse">
              {team.members.slice(0, 4).map((m, i) => (
                <div
                  key={i}
                  className="w-7 h-7 bg-brand-100 border-2 border-white rounded-full flex items-center justify-center"
                  title={m.name}
                >
                  <span className="text-[9px] font-bold text-brand-600">
                    {getInitials(m.name)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-600">التقدم العام</span>
            <span className="text-xs font-bold text-brand-600">
              {progress.percentage}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-brand-700 to-brand-500 transition-all duration-700"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {/* Phase dots */}
          <div className="flex items-center gap-1 mt-3">
            {allPhases.map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    p.status === "COMPLETED"
                      ? "bg-emerald-500"
                      : p.status === "ACTIVE"
                      ? "bg-brand-500 animate-pulse"
                      : "bg-gray-200"
                  }`}
                  title={p.nameAr}
                />
              </div>
            ))}
            <span className="text-[10px] text-gray-400 mr-2">
              {progress.completedPhases}/{progress.totalPhases} مراحل
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentPhaseCard({
  phase,
  teamId,
}: {
  phase: CurrentPhase;
  teamId: string;
}) {
  const remaining = getRemainingTime(phase.endDate);
  const deliverables =
    phase.deliverableConfig?.fields?.filter((f) => f.enabled) || [];

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-200 shadow-sm overflow-hidden">
      {/* Active indicator */}
      <div className="h-1.5 bg-gradient-to-l from-brand-700 to-brand-500" />

      <div className="p-5 space-y-4">
        {/* Phase Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">
                المرحلة الحالية
              </span>
              <span className="text-[10px] text-gray-400">
                {phaseTypeLabels[phase.phaseType] || phase.phaseType}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-800">{phase.nameAr}</h2>
          </div>

          {/* Submission Status */}
          {phase.hasSubmitted ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5" />
              تم التسليم
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg flex-shrink-0">
              <XCircle className="w-3.5 h-3.5" />
              لم يُسلّم
            </div>
          )}
        </div>

        {/* Description */}
        {phase.descriptionAr && (
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl">
            {phase.descriptionAr}
          </p>
        )}

        {/* Countdown */}
        {remaining && (
          <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl">
            <Timer className="w-5 h-5 text-brand-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-brand-700">
                باقي{" "}
                {remaining.days > 0 && `${remaining.days} يوم و `}
                {remaining.hours} ساعة و {remaining.minutes} دقيقة
              </p>
              <p className="text-xs text-brand-500">
                ينتهي في {formatDateAr(phase.endDate)}
              </p>
            </div>
          </div>
        )}

        {/* Deliverable Requirements */}
        {deliverables.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-700">
                التسليمات المطلوبة
              </span>
            </div>
            <div className="space-y-1.5">
              {deliverables.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-600 pr-6"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>{d.label}</span>
                  {d.required && (
                    <span className="text-[10px] text-red-400 font-medium">
                      (مطلوب)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href={`/team/${teamId}/submit/${phase.id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            تسليم المخرجات
          </Link>

          <Link
            href="/ai-models/ideaflow-coach/chat"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-l from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-indigo-700 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            شات IdeaFlow
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScheduleSection({
  title,
  subtitle,
  items,
  showLinks,
}: {
  title: string;
  subtitle: string;
  items: ScheduleItem[];
  showLinks: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <Calendar className="w-5 h-5 text-gray-300" />
      </div>

      <div className="px-5 pb-4 space-y-2">
        {items.map((item) => {
          const cfg = scheduleTypeConfig[item.type] || {
            icon: Calendar,
            label: item.type,
            color: "text-gray-600",
            bg: "bg-gray-50",
          };
          const Icon = cfg.icon;

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/50 transition-colors"
            >
              {/* Time */}
              <div className="text-left min-w-[52px] flex-shrink-0">
                <p className="text-sm font-bold text-gray-700 font-mono">
                  {item.startTime || "—"}
                </p>
                {item.endTime && (
                  <p className="text-[10px] text-gray-400 font-mono">
                    {item.endTime}
                  </p>
                )}
              </div>

              {/* Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
              >
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{item.title}</p>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>

                  {item.isOnline && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 flex items-center gap-0.5">
                      <Video className="w-2.5 h-2.5" />
                      عن بُعد
                    </span>
                  )}

                  {item.isInPerson && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      حضوري
                    </span>
                  )}

                  {item.speaker && (
                    <span className="text-[10px] text-gray-400">
                      {item.speaker}
                    </span>
                  )}
                </div>

                {/* Location */}
                {showLinks && item.location && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </p>
                )}

                {/* Description */}
                {showLinks && item.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {item.description}
                  </p>
                )}

                {/* Online Link — only for today */}
                {showLinks && item.onlineLink && (
                  <a
                    href={item.onlineLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-bold hover:bg-sky-100 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    انضمام للجلسة
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpcomingSection({ items }: { items: ScheduleItem[] }) {
  // Group by date
  const grouped = items.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    const dateKey = item.date
      ? new Date(item.date).toLocaleDateString("ar-SA", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "قادم";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-gray-800 mb-3">الأيام القادمة</h3>

      <div className="space-y-3">
        {Object.entries(grouped).map(([dateLabel, dayItems]) => (
          <div key={dateLabel}>
            <p className="text-xs font-bold text-gray-400 mb-1.5">{dateLabel}</p>
            <div className="space-y-1">
              {dayItems.map((item) => {
                const cfg = scheduleTypeConfig[item.type] || {
                  icon: Calendar,
                  label: item.type,
                  color: "text-gray-600",
                  bg: "bg-gray-50",
                };
                const Icon = cfg.icon;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg opacity-70"
                  >
                    <span className="text-xs text-gray-400 font-mono min-w-[40px]">
                      {item.startTime || "—"}
                    </span>
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${cfg.bg}`}>
                      <Icon className={`w-3 h-3 ${cfg.color}`} />
                    </div>
                    <span className="text-sm text-gray-600">{item.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OtherTeamsList({ teams }: { teams: OtherTeam[] }) {
  const statusLabels: Record<string, string> = {
    IN_PROGRESS: "جاري",
    COMPLETED: "مكتمل",
    EVALUATION: "تقييم",
    REGISTRATION_OPEN: "تسجيل",
    DRAFT: "مسودة",
  };

  return (
    <div className="space-y-2">
      {teams.map((team) => (
        <Link
          key={team.teamId}
          href={`/my-events/${team.eventId}`}
          className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-200 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">{team.teamName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{team.eventName}</p>
            </div>
            <div className="flex items-center gap-2">
              {team.trackName && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: team.trackColor
                      ? `${team.trackColor}20`
                      : "#f3f4f6",
                    color: team.trackColor || "#6b7280",
                  }}
                >
                  {team.trackName}
                </span>
              )}
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                {statusLabels[team.eventStatus] || team.eventStatus}
              </span>
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
