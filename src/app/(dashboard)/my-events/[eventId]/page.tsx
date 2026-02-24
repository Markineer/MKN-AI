"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import {
  Loader2,
  AlertCircle,
  Check,
  Clock,
  Users,
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Timer,
  ClipboardList,
  ChevronLeft,
  Trophy,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface TeamMember {
  name: string;
  role: string;
}

interface EventInfo {
  id: string;
  title: string;
  titleAr: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  primaryColor: string;
}

interface TeamInfo {
  id: string;
  name: string;
  nameAr: string;
  trackName: string;
  trackColor: string;
  members: TeamMember[];
  projectTitle: string;
}

interface PhaseResult {
  score: number;
  status: string;
  feedback: string | null;
}

interface DeliverableField {
  type: string;
  enabled: boolean;
  required: boolean;
  label: string;
  allowFile?: boolean;
  allowLink?: boolean;
  providedUrl?: string;
}

interface PhaseInfo {
  id: string;
  name: string;
  nameAr: string;
  phaseNumber: number;
  phaseType: string;
  status: string;
  startDate: string;
  endDate: string;
  isElimination: boolean;
  deliverableConfig: Record<string, DeliverableField> | null;
  result: PhaseResult | null;
  hasSubmitted: boolean;
}

interface ProgressInfo {
  totalPhases: number;
  completedPhases: number;
  currentPhase: string | null;
  percentage: number;
}

interface ProgressData {
  event: EventInfo;
  team: TeamInfo | null;
  phases: PhaseInfo[];
  progress: ProgressInfo;
}

// ─── Label Maps ─────────────────────────────────────────────────

const eventTypeLabels: Record<string, string> = {
  HACKATHON: "هاكاثون",
  CHALLENGE: "تحدي",
  COMPETITION: "مسابقة",
};

const eventTypeColors: Record<string, { bg: string; text: string }> = {
  HACKATHON: { bg: "bg-purple-50", text: "text-purple-700" },
  CHALLENGE: { bg: "bg-blue-50", text: "text-blue-700" },
  COMPETITION: { bg: "bg-amber-50", text: "text-amber-700" },
};

const eventStatusLabels: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  DRAFT: { label: "مسودة", bg: "bg-gray-100", text: "text-gray-600" },
  REGISTRATION_OPEN: { label: "تسجيل", bg: "bg-blue-50", text: "text-blue-600" },
  IN_PROGRESS: { label: "جاري", bg: "bg-emerald-50", text: "text-emerald-600" },
  EVALUATION: { label: "تقييم", bg: "bg-orange-50", text: "text-orange-600" },
  COMPLETED: { label: "مكتمل", bg: "bg-purple-50", text: "text-purple-600" },
  CANCELLED: { label: "ملغي", bg: "bg-red-50", text: "text-red-600" },
};

const phaseStatusLabels: Record<string, string> = {
  COMPLETED: "مكتملة",
  ACTIVE: "جارية",
  UPCOMING: "قادمة",
  LOCKED: "مقفلة",
};

const resultStatusLabels: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  QUALIFIED: { label: "تأهل", bg: "bg-emerald-50", text: "text-emerald-600" },
  ELIMINATED: { label: "لم يتأهل", bg: "bg-red-50", text: "text-red-600" },
  PENDING: { label: "بانتظار", bg: "bg-yellow-50", text: "text-yellow-600" },
};

// ─── Helper Functions ───────────────────────────────────────────

function formatDateAr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getRemainingTime(endDate: string): { days: number; hours: number } | null {
  const now = new Date().getTime();
  const end = new Date(endDate).getTime();
  const diff = end - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[0].charAt(0) + parts[1].charAt(0);
  }
  return parts[0]?.charAt(0) || "؟";
}

function getEnabledDeliverables(
  config: Record<string, DeliverableField> | null
): DeliverableField[] {
  if (!config) return [];
  return Object.values(config).filter((f) => f.enabled);
}

// ─── Main Page Component ────────────────────────────────────────

export default function EventProgressPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`/api/my-events/${eventId}/progress`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load progress:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, [eventId]);

  // ─── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <TopBar title="Event Progress" titleAr="تقدم الفعالية" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-3">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────
  if (error || !data) {
    return (
      <div>
        <TopBar title="Event Progress" titleAr="تقدم الفعالية" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">فشل في تحميل بيانات الفعالية</p>
            <Link
              href="/my-events"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة لفعالياتي
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { event, team, phases, progress } = data;
  const sortedPhases = [...phases].sort(
    (a, b) => a.phaseNumber - b.phaseNumber
  );

  const typeCfg = eventTypeColors[event.type] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
  };
  const statusCfg = eventStatusLabels[event.status] || {
    label: event.status,
    bg: "bg-gray-100",
    text: "text-gray-600",
  };

  return (
    <div>
      <TopBar title="Event Progress" titleAr="تقدم الفعالية" />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/my-events"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          العودة لفعالياتي
        </Link>

        {/* ═══ A. Event Header Card ═══ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="h-2"
            style={{
              backgroundColor: event.primaryColor || "#7C3AED",
            }}
          />

          <div className="p-6">
            {/* Event name + badges */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-800 mb-3">
                  {event.titleAr || event.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Type Badge */}
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full ${typeCfg.bg} ${typeCfg.text}`}
                  >
                    {eventTypeLabels[event.type] || event.type}
                  </span>
                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Team Info */}
            {team && (
              <div className="mt-5 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {team.nameAr || team.name}
                      </p>
                      {team.projectTitle && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {team.projectTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Track Badge */}
                  {team.trackName && (
                    <span
                      className="text-[11px] font-medium px-3 py-1 rounded-full self-start"
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
                </div>

                {/* Members Avatars */}
                {team.members && team.members.length > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs text-gray-400 ml-1">الأعضاء:</span>
                    <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                      {team.members.map((member, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 bg-brand-100 border-2 border-white rounded-full flex items-center justify-center"
                          title={member.name}
                        >
                          <span className="text-[10px] font-bold text-brand-600">
                            {getInitials(member.name)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      ({team.members.length})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ B. Progress Bar ═══ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-800">التقدم العام</span>
            <span className="text-sm font-bold text-brand-600">
              {progress.percentage}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-brand-700 to-brand-500 transition-all duration-700"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {progress.completedPhases} من {progress.totalPhases} مراحل مكتملة
          </p>
        </div>

        {/* ═══ C. Vertical Timeline ═══ */}
        <div className="space-y-0">
          {sortedPhases.map((phase, index) => {
            const isCompleted = phase.status === "COMPLETED";
            const isActive = phase.status === "ACTIVE";
            const isUpcoming =
              phase.status === "UPCOMING" || phase.status === "LOCKED";
            const isLast = index === sortedPhases.length - 1;

            const remaining = isActive
              ? getRemainingTime(phase.endDate)
              : null;
            const deliverables = getEnabledDeliverables(
              phase.deliverableConfig
            );

            return (
              <div key={phase.id} className="relative flex gap-4">
                {/* Timeline Column */}
                <div className="flex flex-col items-center flex-shrink-0">
                  {/* Node Circle */}
                  {isCompleted && (
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm z-10">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {isActive && (
                    <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center shadow-sm shadow-brand-500/30 animate-pulse z-10">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  )}
                  {isUpcoming && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center z-10">
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    </div>
                  )}

                  {/* Connecting Line */}
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 min-h-[24px] ${
                        isCompleted
                          ? "bg-emerald-300"
                          : isActive
                          ? "bg-gradient-to-b from-brand-300 to-gray-200"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>

                {/* Content Column */}
                <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
                  {/* ── Active Phase: Expanded Card ── */}
                  {isActive && (
                    <div className="bg-white rounded-2xl border-2 border-brand-200 shadow-sm overflow-hidden">
                      {/* Active indicator bar */}
                      <div className="h-1 bg-gradient-to-l from-brand-700 to-brand-500" />

                      <div className="p-5">
                        {/* Phase header */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <p className="text-xs text-brand-500 font-bold mb-1">
                              المرحلة {phase.phaseNumber} -{" "}
                              {phaseStatusLabels[phase.status] || phase.status}
                            </p>
                            <h3 className="text-lg font-bold text-gray-800">
                              {phase.nameAr || phase.name}
                            </h3>
                          </div>
                          {/* Submission status icon */}
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

                        {/* Countdown */}
                        {remaining && (
                          <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl mb-4">
                            <Timer className="w-5 h-5 text-brand-500 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-brand-700">
                                باقي {remaining.days} يوم و {remaining.hours} ساعة
                              </p>
                              <p className="text-xs text-brand-500">
                                ينتهي في {formatDateAr(phase.endDate)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Date Range */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {formatDateAr(phase.startDate)} -{" "}
                            {formatDateAr(phase.endDate)}
                          </span>
                        </div>

                        {/* Deliverable Requirements */}
                        {deliverables.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <ClipboardList className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-bold text-gray-700">
                                التسليمات المطلوبة
                              </span>
                            </div>
                            <div className="space-y-2">
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

                        {/* Submit Button */}
                        {team && (
                          <Link
                            href={`/team/${team.id}/submit/${phase.id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 shadow-brand transition-colors"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            الذهاب للتسليم
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Completed Phase: Result Card ── */}
                  {isCompleted && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-emerald-500 font-bold mb-1">
                            المرحلة {phase.phaseNumber} - مكتملة
                          </p>
                          <h3 className="text-base font-bold text-gray-800">
                            {phase.nameAr || phase.name}
                          </h3>
                        </div>

                        {/* Score */}
                        {phase.result?.score != null && (
                          <div className="text-center flex-shrink-0">
                            <p className="text-2xl font-bold text-brand-600">
                              {phase.result.score}
                            </p>
                            <p className="text-[10px] text-gray-400">درجة</p>
                          </div>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {formatDateAr(phase.startDate)} -{" "}
                          {formatDateAr(phase.endDate)}
                        </span>
                      </div>

                      {/* Result Status + Feedback */}
                      {phase.result && (
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-2">
                            {/* Result status badge */}
                            {(() => {
                              const rCfg = resultStatusLabels[phase.result.status] || {
                                label: phase.result.status,
                                bg: "bg-gray-50",
                                text: "text-gray-600",
                              };
                              return (
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${rCfg.bg} ${rCfg.text}`}
                                >
                                  {phase.result.status === "QUALIFIED" && (
                                    <CheckCircle className="w-3 h-3 inline ml-1" />
                                  )}
                                  {phase.result.status === "ELIMINATED" && (
                                    <XCircle className="w-3 h-3 inline ml-1" />
                                  )}
                                  {rCfg.label}
                                </span>
                              );
                            })()}

                            {/* Elimination indicator */}
                            {phase.isElimination && (
                              <span className="text-[10px] text-gray-400">
                                (مرحلة تصفية)
                              </span>
                            )}
                          </div>

                          {/* Feedback */}
                          {phase.result.feedback && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-400 mb-1 font-medium">
                                ملاحظات المحكمين:
                              </p>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {phase.result.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Upcoming Phase: Minimal Card ── */}
                  {isUpcoming && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 opacity-60">
                      <p className="text-xs text-gray-400 font-bold mb-1">
                        المرحلة {phase.phaseNumber} - قادمة
                      </p>
                      <h3 className="text-base font-bold text-gray-500">
                        {phase.nameAr || phase.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>تبدأ: {formatDateAr(phase.startDate)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
