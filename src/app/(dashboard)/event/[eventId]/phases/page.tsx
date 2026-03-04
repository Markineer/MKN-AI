"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import {
  Layers,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  Trophy,
  AlertTriangle,
  Check,
  X,
  ArrowLeft,
  Settings,
  Trash2,
  Edit3,
  Play,
  CheckCircle,
  Clock,
  Filter as FilterIcon,
  BarChart3,
  UserCheck,
  UserX,
  Target,
  GripVertical,
  Eye,
  Save,
  Loader2,
  ExternalLink,
  Zap,
  FileText,
  Link2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type PhaseType =
  | "GENERAL"
  | "REGISTRATION"
  | "IDEA_REVIEW"
  | "DEVELOPMENT"
  | "PRESENTATION"
  | "JUDGING"
  | "FINALS"
  | "ELIMINATION";

type PhaseStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";

type EvaluationMethod = "AI_AUTO" | "JUDGE_MANUAL" | "COMBINED" | "MENTOR_REVIEW" | "PEER_REVIEW";

type AdvancementMode = "PER_TRACK" | "OVERALL";

type QualificationMode = "SCORE_BASED" | "ADVANCE_ALL" | "MANUAL";

interface PhaseCriteria {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  maxScore: number;
  weight: number;
  sortOrder?: number;
}

interface PhaseResult {
  id: string;
  teamId?: string;
  name?: string;
  nameAr?: string;
  teamName?: string;
  score?: number | null;
  totalScore: number | null;
  status: "PENDING" | "EVALUATED" | "ADVANCED" | "ELIMINATED";
  feedback?: string | null;
}

interface AutoFilterRule {
  type: string;
  enabled: boolean;
  value?: number;
  minCount?: number;
}

interface DeliverableFieldConfig {
  type: "repository" | "presentation" | "demo" | "miro" | "onedrive" | "file" | "description";
  enabled: boolean;
  required: boolean;
  label: string;
  allowFile?: boolean;
  allowLink?: boolean;
  providedUrl?: string;
}

interface DeliverableConfig {
  fields: DeliverableFieldConfig[];
}

interface Phase {
  id: string;
  name: string;
  nameAr: string;
  phaseNumber: number;
  phaseType: PhaseType;
  status: PhaseStatus;
  startDate: string;
  endDate: string;
  isElimination: boolean;
  passThreshold: number | null;
  maxAdvancing: number | null;
  advancePercent: number | null;
  evaluationMethod: EvaluationMethod | null;
  advancementMode: AdvancementMode;
  judgesPerTeam: number;
  qualificationMode: QualificationMode;
  autoFilterRules: { rules: AutoFilterRule[] } | null;
  deliverableConfig: DeliverableConfig | null;
  criteria: PhaseCriteria[];
  results: PhaseResult[];
  assignments: any[];
  totalParticipants: number;
  evaluatedTeams: number;
  advanced: number;
  eliminated: number;
  pendingEvaluation: number;
}

interface Deliverable {
  teamId: string;
  teamName: string;
  trackName: string | null;
  trackColor: string | null;
  memberCount: number;
  repositoryUrl: string | null;
  presentationUrl: string | null;
  demoUrl: string | null;
  miroBoard: string | null;
  oneDriveUrl: string | null;
  submissionFileUrl: string | null;
  hasDeliverable: boolean;
  submittedAt: string | null;
}

interface AutoFilterTeam {
  teamId: string;
  teamName: string;
  trackName: string | null;
  trackColor: string | null;
  memberCount: number;
  passedRules: string[];
  failedRules: string[];
}

interface EliminationTeam {
  teamId: string;
  teamName: string;
  trackId: string | null;
  avgScore: number;
  rank?: number;
}

// ─── Constants ───────────────────────────────────────────────
const phaseTypeLabels: Record<PhaseType, string> = {
  GENERAL: "عام",
  REGISTRATION: "تسجيل",
  IDEA_REVIEW: "مراجعة أفكار",
  DEVELOPMENT: "تطوير",
  PRESENTATION: "عرض تقديمي",
  JUDGING: "تحكيم",
  FINALS: "نهائيات",
  ELIMINATION: "تصفيات",
};

const evaluationMethodLabels: Record<EvaluationMethod, string> = {
  AI_AUTO: "تقييم تلقائي",
  JUDGE_MANUAL: "تحكيم يدوي",
  COMBINED: "مدمج",
  MENTOR_REVIEW: "مراجعة مرشد",
  PEER_REVIEW: "مراجعة أقران",
};

const advancementModeLabels: Record<AdvancementMode, string> = {
  PER_TRACK: "لكل مسار",
  OVERALL: "شامل",
};

const qualificationModeLabels: Record<QualificationMode, string> = {
  SCORE_BASED: "بناءً على الدرجات",
  ADVANCE_ALL: "تأهل الجميع (100%)",
  MANUAL: "تأهل يدوي",
};

const phaseTypeIcons: Record<PhaseType, any> = {
  GENERAL: Layers,
  REGISTRATION: Users,
  IDEA_REVIEW: Eye,
  DEVELOPMENT: Settings,
  PRESENTATION: Play,
  JUDGING: Target,
  FINALS: Trophy,
  ELIMINATION: FilterIcon,
};

const statusConfig: Record<PhaseStatus, { label: string; color: string; icon: any }> = {
  UPCOMING: { label: "قادمة", color: "bg-gray-100 text-gray-600", icon: Clock },
  ACTIVE: { label: "جارية", color: "bg-emerald-50 text-emerald-700", icon: Play },
  COMPLETED: { label: "مكتملة", color: "bg-blue-50 text-blue-700", icon: CheckCircle },
};

const autoFilterRuleLabels: Record<string, string> = {
  has_technical_member: "عضو تقني في الفريق",
  diverse_specializations: "تنوع التخصصات",
  has_business_link: "رابط أعمال",
  has_repository: "رابط المستودع",
  has_presentation: "رابط العرض",
  team_size_min: "الحد الأدنى لحجم الفريق",
  team_size_max: "الحد الأقصى لحجم الفريق",
  max_per_track: "الحد الأقصى لكل مسار",
};

const DEFAULT_RULES: AutoFilterRule[] = [
  { type: "has_technical_member", enabled: false },
  { type: "diverse_specializations", enabled: false, minCount: 2 },
  { type: "has_business_link", enabled: false },
  { type: "has_repository", enabled: false },
  { type: "has_presentation", enabled: false },
  { type: "team_size_min", enabled: false, value: 2 },
  { type: "team_size_max", enabled: false, value: 5 },
  { type: "max_per_track", enabled: false, value: 10 },
];

const DEFAULT_DELIVERABLE_FIELDS: DeliverableFieldConfig[] = [
  { type: "description", enabled: true, required: true, label: "وصف المشروع" },
  { type: "repository", enabled: false, required: false, label: "رابط GitHub" },
  { type: "presentation", enabled: false, required: false, label: "العرض التقديمي", allowFile: false, allowLink: true },
  { type: "demo", enabled: false, required: false, label: "رابط التجربة" },
  { type: "miro", enabled: false, required: false, label: "لوحة Miro", providedUrl: "" },
  { type: "onedrive", enabled: false, required: false, label: "OneDrive" },
  { type: "file", enabled: false, required: false, label: "ملفات إضافية" },
];

const deliverableTypeLabels: Record<string, string> = {
  description: "وصف المشروع",
  repository: "رابط المستودع (GitHub)",
  presentation: "العرض التقديمي",
  demo: "رابط التجربة / النموذج",
  miro: "لوحة Miro",
  onedrive: "OneDrive",
  file: "ملفات مرفقة",
};

const PHASE_PRESETS: Record<string, string[]> = {
  idea_review: ["description", "miro"],
  development: ["description", "repository", "presentation", "miro"],
  finals: ["description", "repository", "presentation", "demo", "miro", "file"],
};

// ─── Phase Timeline ─────────────────────────────────────────
function PhaseTimeline({ phases }: { phases: Phase[] }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {phases.map((phase, idx) => {
        const StatusIcon = statusConfig[phase.status].icon;
        return (
          <div key={phase.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                phase.status === "ACTIVE"
                  ? "bg-emerald-50 border-emerald-200 shadow-sm"
                  : phase.status === "COMPLETED"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <StatusIcon
                className={`w-4 h-4 ${
                  phase.status === "ACTIVE"
                    ? "text-emerald-600"
                    : phase.status === "COMPLETED"
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              />
              <div className="text-center">
                <p className="text-[10px] text-gray-400">المرحلة {phase.phaseNumber}</p>
                <p
                  className={`text-xs font-bold ${
                    phase.status === "ACTIVE"
                      ? "text-emerald-700"
                      : phase.status === "COMPLETED"
                      ? "text-blue-700"
                      : "text-gray-500"
                  }`}
                >
                  {phase.nameAr}
                </p>
              </div>
              {phase.isElimination && (
                <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                  تصفية
                </span>
              )}
            </div>
            {idx < phases.length - 1 && (
              <ArrowLeft className="w-5 h-5 text-gray-300 mx-1 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Phase Card ─────────────────────────────────────────────
function PhaseCard({
  phase,
  isExpanded,
  onToggle,
  eventId,
  onRefresh,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  phase: Phase;
  isExpanded: boolean;
  onToggle: () => void;
  eventId: string;
  onRefresh: () => void;
  onEdit: (phase: Phase) => void;
  onDelete: (phase: Phase) => void;
  onStatusChange: (phaseId: string, status: PhaseStatus) => void;
}) {
  type TabKey = "overview" | "criteria" | "judging" | "results" | "autofilter" | "deliverable-config" | "deliverables";
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const PhaseIcon = phaseTypeIcons[phase.phaseType];
  const statusCfg = statusConfig[phase.status];
  const StatusIcon = statusCfg.icon;

  const showAutoFilter = phase.evaluationMethod === "AI_AUTO";
  const showJudging = phase.evaluationMethod === "JUDGE_MANUAL" || phase.evaluationMethod === "COMBINED";

  const tabs: { key: TabKey; label: string; icon: any; show: boolean }[] = [
    { key: "overview", label: "نظرة عامة", icon: BarChart3, show: true },
    { key: "criteria", label: "معايير التقييم", icon: Target, show: true },
    { key: "judging", label: "التحكيم", icon: UserCheck, show: showJudging },
    { key: "results", label: "النتائج والتأهيل", icon: Trophy, show: true },
    { key: "autofilter", label: "التصفية التلقائية", icon: Zap, show: showAutoFilter },
    { key: "deliverable-config", label: "إعدادات التسليمات", icon: Settings, show: true },
    { key: "deliverables", label: "التسليمات", icon: FileText, show: true },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Phase Header */}
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-300" />
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <PhaseIcon className="w-5 h-5 text-brand-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                المرحلة {phase.phaseNumber}
              </span>
              <h3 className="text-sm font-bold text-elm-navy">{phase.nameAr}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                <StatusIcon className="w-3 h-3 inline ml-1" />
                {statusCfg.label}
              </span>
              {phase.isElimination && (
                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  مرحلة تصفية
                </span>
              )}
              {phase.evaluationMethod && (
                <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                  {evaluationMethodLabels[phase.evaluationMethod]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(phase.startDate).toLocaleDateString("ar-SA")} &larr;{" "}
                {new Date(phase.endDate).toLocaleDateString("ar-SA")}
              </span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {phase.totalParticipants} فريق
              </span>
              <span className="text-[11px] text-gray-400">
                {phase.criteria.length} معيار تقييم
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {phase.isElimination && phase.status === "COMPLETED" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <UserCheck className="w-3.5 h-3.5" />
                {phase.advanced} متأهل
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <UserX className="w-3.5 h-3.5" />
                {phase.eliminated} مستبعد
              </span>
            </div>
          )}
          {/* Status Change Buttons */}
          {phase.status === "UPCOMING" && (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(phase.id, "ACTIVE"); }}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> تفعيل
            </button>
          )}
          {phase.status === "ACTIVE" && (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(phase.id, "COMPLETED"); }}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <CheckCircle className="w-3 h-3" /> إكمال
            </button>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(phase); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(phase); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Tabs */}
          <div className="flex items-center gap-0 px-6 border-b border-gray-100 overflow-x-auto">
            {tabs
              .filter((t) => t.show)
              .map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-brand-500 text-brand-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <OverviewTab phase={phase} />
            )}
            {activeTab === "criteria" && (
              <CriteriaTab phase={phase} eventId={eventId} onRefresh={onRefresh} />
            )}
            {activeTab === "judging" && showJudging && (
              <JudgingTab phase={phase} eventId={eventId} onRefresh={onRefresh} />
            )}
            {activeTab === "results" && (
              <ResultsTab phase={phase} eventId={eventId} onRefresh={onRefresh} />
            )}
            {activeTab === "autofilter" && showAutoFilter && (
              <AutoFilterTab phase={phase} eventId={eventId} onRefresh={onRefresh} />
            )}
            {activeTab === "deliverable-config" && (
              <DeliverableConfigTab phase={phase} eventId={eventId} onRefresh={onRefresh} />
            )}
            {activeTab === "deliverables" && (
              <DeliverablesTab phase={phase} eventId={eventId} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────
function OverviewTab({ phase }: { phase: Phase }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-elm-navy">{phase.totalParticipants}</p>
        <p className="text-[11px] text-gray-500 mt-1">إجمالي الفرق</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-elm-navy">{phase.criteria.length}</p>
        <p className="text-[11px] text-gray-500 mt-1">معايير التقييم</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-elm-navy">{phase.evaluatedTeams}</p>
        <p className="text-[11px] text-gray-500 mt-1">فرق تم تقييمها</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-elm-navy">{phase.pendingEvaluation}</p>
        <p className="text-[11px] text-gray-500 mt-1">بانتظار التقييم</p>
      </div>
      {phase.isElimination && (
        <>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">
              {phase.passThreshold != null ? `${phase.passThreshold}%` : "—"}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1">حد النجاح الأدنى</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {phase.maxAdvancing || (phase.advancePercent ? `${phase.advancePercent}%` : "—")}
            </p>
            <p className="text-[11px] text-blue-600 mt-1">
              {phase.maxAdvancing ? "الحد الأقصى للمتأهلين" : "نسبة التأهل"}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{phase.advanced}</p>
            <p className="text-[11px] text-emerald-600 mt-1">متأهلين</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{phase.eliminated}</p>
            <p className="text-[11px] text-red-600 mt-1">مستبعدين</p>
          </div>
        </>
      )}
      {!phase.isElimination && (
        <>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">
              {phaseTypeLabels[phase.phaseType]}
            </p>
            <p className="text-[11px] text-purple-600 mt-1">نوع المرحلة</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">
              {phase.evaluationMethod
                ? evaluationMethodLabels[phase.evaluationMethod]
                : "—"}
            </p>
            <p className="text-[11px] text-amber-600 mt-1">طريقة التقييم</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {qualificationModeLabels[phase.qualificationMode] || "بالدرجات"}
            </p>
            <p className="text-[11px] text-blue-600 mt-1">نمط التأهل</p>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-cyan-700">
              {phase.judgesPerTeam || 1}
            </p>
            <p className="text-[11px] text-cyan-600 mt-1">محكم لكل فريق</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Criteria Tab ───────────────────────────────────────────
function CriteriaTab({
  phase,
  eventId,
  onRefresh,
}: {
  phase: Phase;
  eventId: string;
  onRefresh: () => void;
}) {
  const [showAddCriteria, setShowAddCriteria] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<PhaseCriteria | null>(null);
  const [criteriaForm, setCriteriaForm] = useState({ name: "", nameAr: "", maxScore: 10, weight: 1.0 });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const resetForm = () => {
    setCriteriaForm({ name: "", nameAr: "", maxScore: 10, weight: 1.0 });
    setShowAddCriteria(false);
    setEditingCriteria(null);
  };

  const handleSaveCriteria = async () => {
    if (!criteriaForm.nameAr) return;
    setSaving(true);
    try {
      if (editingCriteria) {
        await fetch(`/api/events/${eventId}/phases/${phase.id}/criteria`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            criteriaId: editingCriteria.id,
            name: criteriaForm.name,
            nameAr: criteriaForm.nameAr,
            maxScore: criteriaForm.maxScore,
            weight: criteriaForm.weight,
          }),
        });
      } else {
        await fetch(`/api/events/${eventId}/phases/${phase.id}/criteria`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(criteriaForm),
        });
      }
      resetForm();
      onRefresh();
    } catch (err) {
      console.error("Failed to save criteria:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCriteria = async (criteriaId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المعيار؟")) return;
    setDeleting(criteriaId);
    try {
      await fetch(
        `/api/events/${eventId}/phases/${phase.id}/criteria?criteriaId=${criteriaId}`,
        { method: "DELETE" }
      );
      onRefresh();
    } catch (err) {
      console.error("Failed to delete criteria:", err);
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (c: PhaseCriteria) => {
    setEditingCriteria(c);
    setCriteriaForm({ name: c.name, nameAr: c.nameAr, maxScore: c.maxScore, weight: c.weight });
    setShowAddCriteria(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-elm-navy">
          معايير تقييم المرحلة ({phase.criteria.length} معايير)
        </p>
        <button
          onClick={() => { resetForm(); setShowAddCriteria(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          إضافة معيار
        </button>
      </div>

      {/* Add/Edit Criteria Form */}
      {showAddCriteria && (
        <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-brand-700">
            {editingCriteria ? "تعديل المعيار" : "إضافة معيار جديد"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">اسم المعيار (عربي) *</label>
              <input
                value={criteriaForm.nameAr}
                onChange={(e) => setCriteriaForm({ ...criteriaForm, nameAr: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="مثال: الابتكار"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Criteria Name (English)</label>
              <input
                value={criteriaForm.name}
                onChange={(e) => setCriteriaForm({ ...criteriaForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="e.g. Innovation"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">الدرجة القصوى</label>
              <input
                type="number"
                min={1}
                value={criteriaForm.maxScore}
                onChange={(e) => setCriteriaForm({ ...criteriaForm, maxScore: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">الوزن</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={criteriaForm.weight}
                onChange={(e) => setCriteriaForm({ ...criteriaForm, weight: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveCriteria}
              disabled={saving || !criteriaForm.nameAr}
              className="px-4 py-1.5 bg-brand-500 text-white text-xs font-bold rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {editingCriteria ? "تحديث" : "حفظ"}
            </button>
          </div>
        </div>
      )}

      {/* Criteria Table */}
      <div className="bg-gray-50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-gray-500 border-b border-gray-200">
              <th className="text-right px-4 py-3 font-medium">المعيار</th>
              <th className="text-center px-4 py-3 font-medium">الدرجة القصوى</th>
              <th className="text-center px-4 py-3 font-medium">الوزن</th>
              <th className="text-center px-4 py-3 font-medium">الدرجة الموزونة</th>
              <th className="text-center px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {phase.criteria.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                  لا توجد معايير بعد. أضف معيار تقييم جديد.
                </td>
              </tr>
            ) : (
              phase.criteria.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-elm-navy">{c.nameAr}</p>
                    <p className="text-[10px] text-gray-400">{c.name}</p>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className="bg-white px-3 py-1 rounded-lg border text-xs font-bold text-elm-navy">
                      {c.maxScore}
                    </span>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className="text-xs font-bold text-brand-600">&times;{c.weight}</span>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className="text-xs font-bold text-elm-navy">
                      {(c.maxScore * c.weight).toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => startEdit(c)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-400"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteCriteria(c.id)}
                        disabled={deleting === c.id}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-50"
                      >
                        {deleting === c.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {phase.criteria.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100/50">
                <td className="px-4 py-3 font-bold text-sm text-elm-navy">المجموع</td>
                <td className="text-center px-4 py-3 font-bold text-sm text-elm-navy">
                  {phase.criteria.reduce((s, c) => s + c.maxScore, 0)}
                </td>
                <td className="text-center px-4 py-3">&mdash;</td>
                <td className="text-center px-4 py-3 font-bold text-sm text-brand-600">
                  {phase.criteria.reduce((s, c) => s + c.maxScore * c.weight, 0).toFixed(1)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ─── Results Tab ────────────────────────────────────────────
function ResultsTab({
  phase,
  eventId,
  onRefresh,
}: {
  phase: Phase;
  eventId: string;
  onRefresh: () => void;
}) {
  const [showEliminationPreview, setShowEliminationPreview] = useState(false);
  const [eliminationPreview, setEliminationPreview] = useState<{
    advancing: EliminationTeam[];
    eliminated: EliminationTeam[];
    teams?: { teamId: string; teamName: string; trackId: string | null; avgScore: number; evaluationCount: number }[];
    stats: { total: number; advancing: number; eliminated: number };
    phase: any;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);
  // Manual mode: selected team IDs
  const [selectedAdvancing, setSelectedAdvancing] = useState<Set<string>>(new Set());

  const qualMode = phase.qualificationMode || "SCORE_BASED";

  const handlePreviewElimination = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/events/${eventId}/phases/${phase.id}/eliminate`);
      if (!res.ok) throw new Error("فشل تحميل المعاينة");
      const data = await res.json();
      setEliminationPreview(data);
      setShowEliminationPreview(true);
      // For MANUAL mode, pre-select all teams by default
      if (qualMode === "MANUAL" && data.teams) {
        setSelectedAdvancing(new Set(data.teams.map((t: any) => t.teamId)));
      }
    } catch (err) {
      console.error("Failed to preview elimination:", err);
      alert("فشل تحميل معاينة التصفية");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteElimination = async () => {
    if (!confirm("هل أنت متأكد من تنفيذ التأهيل؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setExecuting(true);
    try {
      let bodyData: any = undefined;
      let headers: any = {};

      if (qualMode === "MANUAL" && eliminationPreview?.teams) {
        const allTeamIds = eliminationPreview.teams.map((t: any) => t.teamId);
        const advancingIds = Array.from(selectedAdvancing);
        const eliminatedIds = allTeamIds.filter((id: string) => !selectedAdvancing.has(id));
        bodyData = JSON.stringify({ advancingIds, eliminatedIds });
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(`/api/events/${eventId}/phases/${phase.id}/eliminate`, {
        method: "POST",
        headers,
        ...(bodyData && { body: bodyData }),
      });
      if (!res.ok) throw new Error("فشل تنفيذ التأهيل");
      const data = await res.json();
      alert(`تم التنفيذ بنجاح: ${data.advanced} متأهل، ${data.eliminated} مستبعد`);
      setShowEliminationPreview(false);
      setEliminationPreview(null);
      onRefresh();
    } catch (err) {
      console.error("Failed to execute elimination:", err);
      alert("فشل تنفيذ التأهيل");
    } finally {
      setExecuting(false);
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedAdvancing((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const selectAllTeams = () => {
    if (eliminationPreview?.teams) {
      setSelectedAdvancing(new Set(eliminationPreview.teams.map((t: any) => t.teamId)));
    }
  };

  const deselectAllTeams = () => {
    setSelectedAdvancing(new Set());
  };

  return (
    <div className="space-y-4">
      {/* ── ADVANCE_ALL Mode Banner ── */}
      {qualMode === "ADVANCE_ALL" && phase.status === "ACTIVE" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-800">تأهل الجميع</p>
              <p className="text-[11px] text-emerald-600">
                جميع الفرق ستتأهل تلقائياً للمرحلة التالية
              </p>
            </div>
          </div>
          <button
            onClick={handlePreviewElimination}
            disabled={loadingPreview}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loadingPreview ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserCheck className="w-3.5 h-3.5" />
            )}
            تأهيل جميع الفرق
          </button>
        </div>
      )}

      {/* ── MANUAL Mode Banner ── */}
      {qualMode === "MANUAL" && phase.status === "ACTIVE" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-bold text-purple-800">تأهل يدوي</p>
              <p className="text-[11px] text-purple-600">
                اختر الفرق المتأهلة يدوياً بناءً على تقييمك
              </p>
            </div>
          </div>
          <button
            onClick={handlePreviewElimination}
            disabled={loadingPreview}
            className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loadingPreview ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            عرض الفرق للتأهيل
          </button>
        </div>
      )}

      {/* ── SCORE_BASED Mode Banner (existing) ── */}
      {qualMode === "SCORE_BASED" && phase.isElimination && phase.status === "ACTIVE" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-800">مرحلة تصفية نشطة</p>
              <p className="text-[11px] text-amber-600">
                سيتم تصفية الفرق بناءً على الدرجات. حد النجاح:{" "}
                {phase.passThreshold ?? "—"}% | الحد الأقصى للمتأهلين: {phase.maxAdvancing ?? "—"}
              </p>
            </div>
          </div>
          <button
            onClick={handlePreviewElimination}
            disabled={loadingPreview}
            className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loadingPreview ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            معاينة التصفية
          </button>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-gray-50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-gray-500 border-b border-gray-200">
              <th className="text-right px-4 py-3 font-medium">#</th>
              <th className="text-right px-4 py-3 font-medium">الفريق</th>
              <th className="text-center px-4 py-3 font-medium">الدرجة</th>
              <th className="text-center px-4 py-3 font-medium">الحالة</th>
              <th className="text-center px-4 py-3 font-medium">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {phase.results.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                  لا توجد نتائج بعد لهذه المرحلة
                </td>
              </tr>
            ) : (
              phase.results.map((r, idx) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-elm-navy">
                      {r.teamName || r.nameAr || r.name || "—"}
                    </p>
                  </td>
                  <td className="text-center px-4 py-3">
                    {r.totalScore !== null && r.totalScore !== undefined ? (
                      <span className="font-bold text-elm-navy">
                        {typeof r.totalScore === "number" ? r.totalScore.toFixed(1) : r.totalScore}
                      </span>
                    ) : (
                      <span className="text-gray-300">&mdash;</span>
                    )}
                  </td>
                  <td className="text-center px-4 py-3">
                    {r.status === "ADVANCED" && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        <Check className="w-3 h-3" /> متأهل
                      </span>
                    )}
                    {r.status === "ELIMINATED" && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">
                        <X className="w-3 h-3" /> مستبعد
                      </span>
                    )}
                    {r.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        <Clock className="w-3 h-3" /> بانتظار التقييم
                      </span>
                    )}
                    {r.status === "EVALUATED" && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> تم التقييم
                      </span>
                    )}
                  </td>
                  <td className="text-center px-4 py-3 text-[10px] text-gray-400 max-w-[200px] truncate">
                    {r.feedback || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── ADVANCE_ALL Preview Modal ── */}
      {showEliminationPreview && eliminationPreview && qualMode === "ADVANCE_ALL" && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-elm-navy">تأهيل جميع الفرق</h3>
              <button
                onClick={() => setShowEliminationPreview(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-elm-navy mb-2">
                {eliminationPreview.stats.total} فريق سيتأهلون
              </p>
              <p className="text-sm text-gray-500">
                سيتم تأهيل جميع الفرق المسجلة للمرحلة التالية
              </p>
            </div>

            <div className="px-6 pb-4 max-h-[200px] overflow-y-auto space-y-1">
              {eliminationPreview.advancing.map((t, i) => (
                <div key={t.teamId} className="flex items-center justify-between bg-emerald-50/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 w-5 h-5 rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                  </div>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowEliminationPreview(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecuteElimination}
                disabled={executing}
                className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {executing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                تأهيل الجميع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANUAL Mode Modal ── */}
      {showEliminationPreview && eliminationPreview && qualMode === "MANUAL" && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-elm-navy">اختيار الفرق المتأهلة</h3>
              <button
                onClick={() => setShowEliminationPreview(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 px-6 py-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-elm-navy">{eliminationPreview.teams?.length || 0}</p>
                <p className="text-[10px] text-gray-500">إجمالي الفرق</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">{selectedAdvancing.size}</p>
                <p className="text-[10px] text-emerald-600">سيتأهلون</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-red-600">{(eliminationPreview.teams?.length || 0) - selectedAdvancing.size}</p>
                <p className="text-[10px] text-red-500">سيُستبعدون</p>
              </div>
            </div>

            {/* Select/Deselect All */}
            <div className="flex items-center gap-2 px-6 pb-2">
              <button
                onClick={selectAllTeams}
                className="text-[11px] text-brand-600 hover:text-brand-700 font-medium"
              >
                تحديد الكل
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={deselectAllTeams}
                className="text-[11px] text-gray-500 hover:text-gray-700 font-medium"
              >
                إلغاء تحديد الكل
              </button>
            </div>

            {/* Teams Checklist */}
            <div className="px-6 pb-4 max-h-[350px] overflow-y-auto space-y-1">
              {(eliminationPreview.teams || []).map((t: any, idx: number) => {
                const isSelected = selectedAdvancing.has(t.teamId);
                return (
                  <div
                    key={t.teamId}
                    onClick={() => toggleTeamSelection(t.teamId)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer border transition-colors ${
                      isSelected
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-red-50/30 border-red-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-300 bg-white"
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                        {t.evaluationCount > 0 && (
                          <span className="text-[10px] text-gray-400 mr-2">
                            ({t.evaluationCount} تقييم)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {t.avgScore > 0 && (
                        <span className="text-xs font-bold text-elm-navy">{t.avgScore.toFixed(1)}%</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {isSelected ? "متأهل" : "مستبعد"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-[11px] text-gray-500">
                {selectedAdvancing.size} فريق متأهل من أصل {eliminationPreview.teams?.length || 0}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEliminationPreview(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleExecuteElimination}
                  disabled={executing || selectedAdvancing.size === 0}
                  className="px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {executing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  تنفيذ التأهيل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SCORE_BASED Elimination Preview Modal ── */}
      {showEliminationPreview && eliminationPreview && qualMode === "SCORE_BASED" && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-elm-navy">معاينة نتائج التصفية</h3>
              <button
                onClick={() => setShowEliminationPreview(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 px-6 py-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-elm-navy">{eliminationPreview.stats.total}</p>
                <p className="text-[10px] text-gray-500">إجمالي الفرق</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">{eliminationPreview.stats.advancing}</p>
                <p className="text-[10px] text-emerald-600">سيتأهلون</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-red-600">{eliminationPreview.stats.eliminated}</p>
                <p className="text-[10px] text-red-500">سيُستبعدون</p>
              </div>
            </div>

            {/* Advancing List */}
            <div className="px-6 pb-2">
              <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> المتأهلون ({eliminationPreview.advancing.length})
              </p>
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {eliminationPreview.advancing.map((t, i) => (
                  <div key={t.teamId} className="flex items-center justify-between bg-emerald-50/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 w-5 h-5 rounded-full flex items-center justify-center">
                        {t.rank || i + 1}
                      </span>
                      <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">{t.avgScore.toFixed(1)}</span>
                  </div>
                ))}
                {eliminationPreview.advancing.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-3">لا يوجد فرق متأهلة</p>
                )}
              </div>
            </div>

            {/* Eliminated List */}
            <div className="px-6 pb-4">
              <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                <UserX className="w-3.5 h-3.5" /> المستبعدون ({eliminationPreview.eliminated.length})
              </p>
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {eliminationPreview.eliminated.map((t, i) => (
                  <div key={t.teamId} className="flex items-center justify-between bg-red-50/50 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                    <span className="text-xs font-bold text-red-600">{t.avgScore.toFixed(1)}</span>
                  </div>
                ))}
                {eliminationPreview.eliminated.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-3">لا يوجد فرق مستبعدة</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowEliminationPreview(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecuteElimination}
                disabled={executing}
                className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {executing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                تنفيذ التصفية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Judging Tab ────────────────────────────────────────────
function JudgingTab({
  phase,
  eventId,
  onRefresh,
}: {
  phase: Phase;
  eventId: string;
  onRefresh: () => void;
}) {
  const [distributions, setDistributions] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [loadingDist, setLoadingDist] = useState(false);
  const [loadingEvals, setLoadingEvals] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [hasDistributed, setHasDistributed] = useState(false);

  // Fetch existing assignments + evaluations on mount
  useEffect(() => {
    fetchExistingData();
  }, []);

  const fetchExistingData = async () => {
    setLoadingEvals(true);
    try {
      const [assignRes, evalRes] = await Promise.all([
        fetch(`/api/events/${eventId}/distribute?phaseId=${phase.id}`),
        fetch(`/api/events/${eventId}/evaluations?phaseId=${phase.id}`),
      ]);

      // Check if already distributed by looking for existing assignments
      const assignData = assignRes.ok ? await assignRes.json() : null;
      if (assignData) {
        setDistributions(assignData.distributions || []);
        setWarnings(assignData.warnings || []);
      }

      const evalData = evalRes.ok ? await evalRes.json() : null;
      if (evalData) {
        setEvaluationData(evalData);
      }

      // Check if there are actual assignments in DB
      // Use assignments from phases API data
      setHasDistributed(phase.assignments && phase.assignments.length > 0);
    } catch {
      // silently fail
    } finally {
      setLoadingEvals(false);
    }
  };

  const handlePreview = async () => {
    setLoadingDist(true);
    try {
      const res = await fetch(`/api/events/${eventId}/distribute?phaseId=${phase.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDistributions(data.distributions || []);
      setWarnings(data.warnings || []);
    } catch {
      alert("فشل تحميل معاينة التوزيع");
    } finally {
      setLoadingDist(false);
    }
  };

  const handleExecute = async () => {
    if (!confirm("هل أنت متأكد من تنفيذ توزيع المحكمين؟")) return;
    setExecuting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/distribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId: phase.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "فشل تنفيذ التوزيع");
        return;
      }
      const data = await res.json();
      alert(`تم التوزيع بنجاح: ${data.created} تعيين`);
      setHasDistributed(true);
      onRefresh();
      fetchExistingData();
    } catch {
      alert("فشل تنفيذ التوزيع");
    } finally {
      setExecuting(false);
    }
  };

  if (loadingEvals) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  const teamAverages = evaluationData?.teamAverages || [];
  const stats = evaluationData?.stats || {};
  const criteria = evaluationData?.criteria || [];
  const evaluations = evaluationData?.evaluations || [];

  return (
    <div className="space-y-6">
      {/* Distribution Controls */}
      <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-elm-navy">توزيع المحكمين</h4>
            <p className="text-[11px] text-gray-500">
              كل فريق سيُقيّم من {phase.judgesPerTeam || 1} محكم
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              disabled={loadingDist}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-200 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-50 transition-colors disabled:opacity-50"
            >
              {loadingDist ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
              معاينة التوزيع
            </button>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {executing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              تنفيذ التوزيع
            </button>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1 mt-2">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                {w}
              </div>
            ))}
          </div>
        )}

        {/* Distribution Preview */}
        {distributions.length > 0 && (
          <div className="mt-3 space-y-3">
            {distributions.map((dist, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {dist.trackColor && (
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dist.trackColor }} />
                    )}
                    <span className="text-xs font-bold text-elm-navy">{dist.trackName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span>{dist.judges.length} محكم</span>
                    <span>{dist.teams.length} فريق</span>
                    <span>{dist.judgesPerTeam} محكم/فريق</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] text-gray-500 border-b border-gray-200">
                        <th className="text-right px-3 py-2 font-medium">الفريق</th>
                        <th className="text-right px-3 py-2 font-medium">المحكمون المعينون</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dist.teams.map((team: any) => {
                        const teamAssignments = dist.assignments.filter((a: any) => a.teamId === team.id);
                        return (
                          <tr key={team.id} className="border-b border-gray-100 last:border-0">
                            <td className="px-3 py-2 font-medium text-elm-navy">{team.name}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {teamAssignments.map((a: any, i: number) => (
                                  <span key={i} className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                    {a.judgeName}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evaluation Progress */}
      {hasDistributed && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-elm-navy">تقدم التقييم</h4>
            {stats.totalAssignments > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(stats.completedAssignments / stats.totalAssignments) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {stats.completedAssignments}/{stats.totalAssignments}
                </span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-elm-navy">{stats.totalTeams || 0}</p>
              <p className="text-[10px] text-gray-500">الفرق</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">{stats.evaluatedTeams || 0}</p>
              <p className="text-[10px] text-emerald-600">تم تقييمها</p>
            </div>
            <div className="bg-brand-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-brand-700">{stats.totalEvaluations || 0}</p>
              <p className="text-[10px] text-brand-600">تقييمات</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-amber-700">{(stats.totalAssignments || 0) - (stats.completedAssignments || 0)}</p>
              <p className="text-[10px] text-amber-600">بانتظار</p>
            </div>
          </div>

          {/* Team Scores Table */}
          {teamAverages.length > 0 && (
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-gray-500 border-b border-gray-200">
                    <th className="text-right px-4 py-3 font-medium">#</th>
                    <th className="text-right px-4 py-3 font-medium">الفريق</th>
                    <th className="text-center px-4 py-3 font-medium">التقييمات</th>
                    <th className="text-center px-4 py-3 font-medium">المتوسط</th>
                    {criteria.map((c: any) => (
                      <th key={c.id} className="text-center px-3 py-3 font-medium text-[10px]">
                        {c.nameAr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...teamAverages]
                    .sort((a: any, b: any) => b.averageScore - a.averageScore)
                    .map((team: any, idx: number) => {
                      const teamEvals = evaluations.filter((e: any) => e.team?.id === team.teamId);
                      return (
                        <tr key={team.teamId} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-elm-navy">{team.teamName}</p>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className={`text-xs font-medium ${
                              team.completedJudges >= team.assignedJudges && team.assignedJudges > 0
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}>
                              {team.completedJudges}/{team.assignedJudges}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            {team.evaluationCount > 0 ? (
                              <span className="text-sm font-bold text-elm-navy">{team.averageScore.toFixed(1)}%</span>
                            ) : (
                              <span className="text-gray-300">&mdash;</span>
                            )}
                          </td>
                          {criteria.map((c: any) => (
                            <td key={c.id} className="text-center px-3 py-3 text-xs text-gray-600">
                              {team.criteriaAverages[c.id] !== undefined
                                ? team.criteriaAverages[c.id].toFixed(1)
                                : "—"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* No distribution yet */}
      {!hasDistributed && distributions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-elm-navy mb-1">لم يتم التوزيع بعد</p>
          <p className="text-xs text-gray-500">اضغط على &quot;معاينة التوزيع&quot; لرؤية التوزيع المقترح</p>
        </div>
      )}
    </div>
  );
}

// ─── Auto-Filter Tab ────────────────────────────────────────
function AutoFilterTab({
  phase,
  eventId,
  onRefresh,
}: {
  phase: Phase;
  eventId: string;
  onRefresh: () => void;
}) {
  const [rules, setRules] = useState<AutoFilterRule[]>(() => {
    const existingRules = (phase.autoFilterRules as any)?.rules;
    if (existingRules && Array.isArray(existingRules) && existingRules.length > 0) {
      // Merge with defaults to ensure all rule types exist
      return DEFAULT_RULES.map((def) => {
        const existing = existingRules.find((r: AutoFilterRule) => r.type === def.type);
        return existing || def;
      });
    }
    return DEFAULT_RULES.map((r) => ({ ...r }));
  });

  const [savingRules, setSavingRules] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [executingFilter, setExecutingFilter] = useState(false);
  const [previewData, setPreviewData] = useState<{
    qualifying: AutoFilterTeam[];
    rejected: AutoFilterTeam[];
    stats: { total: number; qualifying: number; rejected: number; byTrack: any };
  } | null>(null);

  const toggleRule = (type: string) => {
    setRules((prev) =>
      prev.map((r) => (r.type === type ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const updateRuleValue = (type: string, field: "value" | "minCount", val: number) => {
    setRules((prev) =>
      prev.map((r) => (r.type === type ? { ...r, [field]: val } : r))
    );
  };

  const handleSaveRules = async () => {
    setSavingRules(true);
    try {
      await fetch(`/api/events/${eventId}/phases/${phase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoFilterRules: { rules },
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to save rules:", err);
    } finally {
      setSavingRules(false);
    }
  };

  const handlePreview = async () => {
    // Save rules first, then preview
    setSavingRules(true);
    try {
      await fetch(`/api/events/${eventId}/phases/${phase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoFilterRules: { rules },
        }),
      });
    } catch (err) {
      console.error("Failed to save rules before preview:", err);
      setSavingRules(false);
      return;
    }
    setSavingRules(false);

    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/phases/${phase.id}/auto-filter`);
      if (!res.ok) throw new Error("فشل تحميل المعاينة");
      const data = await res.json();
      setPreviewData(data);
    } catch (err) {
      console.error("Failed to preview auto-filter:", err);
      alert("فشل تحميل معاينة التصفية التلقائية");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!confirm("هل أنت متأكد من تنفيذ التصفية التلقائية؟ سيتم تحديث حالة الفرق.")) return;
    setExecutingFilter(true);
    try {
      const res = await fetch(`/api/events/${eventId}/phases/${phase.id}/auto-filter`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("فشل تنفيذ التصفية");
      const data = await res.json();
      alert(`تم تنفيذ التصفية التلقائية بنجاح: ${data.advanced} متأهل، ${data.eliminated} مستبعد`);
      setPreviewData(null);
      onRefresh();
    } catch (err) {
      console.error("Failed to execute auto-filter:", err);
      alert("فشل تنفيذ التصفية التلقائية");
    } finally {
      setExecutingFilter(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rules Configuration */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-elm-navy">قواعد التصفية التلقائية</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveRules}
              disabled={savingRules}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-100 transition-colors disabled:opacity-50"
            >
              {savingRules ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              حفظ القواعد
            </button>
            <button
              onClick={handlePreview}
              disabled={previewLoading || savingRules}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              {previewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
              معاينة النتائج
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {rules.map((rule) => {
            const hasValueInput = ["team_size_min", "team_size_max", "max_per_track"].includes(rule.type);
            const hasMinCountInput = rule.type === "diverse_specializations";

            return (
              <div
                key={rule.type}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                  rule.enabled
                    ? "bg-brand-50/50 border-brand-200"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleRule(rule.type)} className="flex-shrink-0">
                    {rule.enabled ? (
                      <ToggleRight className="w-6 h-6 text-brand-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-300" />
                    )}
                  </button>
                  <span className={`text-xs font-medium ${rule.enabled ? "text-elm-navy" : "text-gray-400"}`}>
                    {autoFilterRuleLabels[rule.type]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasValueInput && rule.enabled && (
                    <input
                      type="number"
                      min={1}
                      value={rule.value || ""}
                      onChange={(e) => updateRuleValue(rule.type, "value", Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-brand-200"
                      placeholder="القيمة"
                    />
                  )}
                  {hasMinCountInput && rule.enabled && (
                    <input
                      type="number"
                      min={1}
                      value={rule.minCount || ""}
                      onChange={(e) => updateRuleValue(rule.type, "minCount", Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-brand-200"
                      placeholder="الحد الأدنى"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Results */}
      {previewData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-elm-navy">نتائج المعاينة</p>
            <button
              onClick={handleExecute}
              disabled={executingFilter}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {executingFilter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              تنفيذ التصفية التلقائية
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-elm-navy">{previewData.stats.total}</p>
              <p className="text-[10px] text-gray-500">إجمالي الفرق</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">{previewData.stats.qualifying}</p>
              <p className="text-[10px] text-emerald-600">مؤهلين</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-red-600">{previewData.stats.rejected}</p>
              <p className="text-[10px] text-red-500">مرفوضين</p>
            </div>
          </div>

          {/* By Track Stats */}
          {previewData.stats.byTrack && Object.keys(previewData.stats.byTrack).length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-elm-navy mb-2">حسب المسار</p>
              <div className="space-y-1">
                {Object.entries(previewData.stats.byTrack).map(([track, stats]: [string, any]) => (
                  <div key={track} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{track}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600">{stats.qualifying} مؤهل</span>
                      <span className="text-red-500">{stats.rejected} مرفوض</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Qualifying Teams */}
          <div>
            <p className="text-xs font-bold text-emerald-700 mb-2">
              الفرق المؤهلة ({previewData.qualifying.length})
            </p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {previewData.qualifying.map((t) => (
                <div key={t.teamId} className="flex items-center justify-between bg-emerald-50/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                    {t.trackName && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: t.trackColor ? `${t.trackColor}20` : "#f3f4f6",
                          color: t.trackColor || "#6b7280",
                        }}
                      >
                        {t.trackName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400">{t.memberCount} عضو</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rejected Teams */}
          <div>
            <p className="text-xs font-bold text-red-600 mb-2">
              الفرق المرفوضة ({previewData.rejected.length})
            </p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {previewData.rejected.map((t) => (
                <div key={t.teamId} className="flex items-center justify-between bg-red-50/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <X className="w-3 h-3 text-red-500" />
                    <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                    {t.trackName && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: t.trackColor ? `${t.trackColor}20` : "#f3f4f6",
                          color: t.trackColor || "#6b7280",
                        }}
                      >
                        {t.trackName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-red-400">
                      {t.failedRules.map((r) => autoFilterRuleLabels[r] || r).join("، ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Deliverable Config Tab ──────────────────────────────────
function DeliverableConfigTab({
  phase,
  eventId,
  onRefresh,
}: {
  phase: Phase;
  eventId: string;
  onRefresh: () => void;
}) {
  const [fields, setFields] = useState<DeliverableFieldConfig[]>(() => {
    const existing = phase.deliverableConfig?.fields || [];
    return DEFAULT_DELIVERABLE_FIELDS.map((def) => {
      const found = existing.find((f) => f.type === def.type);
      return found ? { ...def, ...found } : { ...def };
    });
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleField = (type: string) => {
    setFields((prev) =>
      prev.map((f) => (f.type === type ? { ...f, enabled: !f.enabled } : f))
    );
    setSaved(false);
  };

  const toggleRequired = (type: string) => {
    setFields((prev) =>
      prev.map((f) => (f.type === type ? { ...f, required: !f.required } : f))
    );
    setSaved(false);
  };

  const updateField = (type: string, key: string, value: any) => {
    setFields((prev) =>
      prev.map((f) => (f.type === type ? { ...f, [key]: value } : f))
    );
    setSaved(false);
  };

  const applyPreset = (presetKey: string) => {
    const enabledTypes = PHASE_PRESETS[presetKey] || [];
    setFields((prev) =>
      prev.map((f) => ({
        ...f,
        enabled: enabledTypes.includes(f.type),
        required: enabledTypes.includes(f.type),
      }))
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/phases/${phase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverableConfig: { fields } }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      setSaved(true);
      onRefresh();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = fields.filter((f) => f.enabled).length;
  const requiredCount = fields.filter((f) => f.enabled && f.required).length;

  return (
    <div className="space-y-6">
      {/* Header + Save */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-elm-navy">إعدادات التسليمات المطلوبة</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">
            حدد ما يجب على الفرق تسليمه في هذه المرحلة ({enabledCount} مفعّل، {requiredCount} مطلوب)
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "تم الحفظ" : "حفظ الإعدادات"}
        </button>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400">قوالب سريعة:</span>
        <button
          onClick={() => applyPreset("idea_review")}
          className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors font-medium"
        >
          مراجعة أفكار
        </button>
        <button
          onClick={() => applyPreset("development")}
          className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors font-medium"
        >
          تطوير
        </button>
        <button
          onClick={() => applyPreset("finals")}
          className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors font-medium"
        >
          نهائيات
        </button>
      </div>

      {/* Fields Configuration */}
      <div className="space-y-3">
        {fields.map((field) => (
          <div
            key={field.type}
            className={`rounded-xl border p-4 transition-all ${
              field.enabled ? "border-brand-200 bg-brand-50/30" : "border-gray-100 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleField(field.type)} className="text-gray-400 hover:text-brand-500 transition-colors">
                  {field.enabled ? (
                    <ToggleRight className="w-7 h-7 text-brand-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7" />
                  )}
                </button>
                <div>
                  <p className={`text-sm font-bold ${field.enabled ? "text-elm-navy" : "text-gray-400"}`}>
                    {deliverableTypeLabels[field.type]}
                  </p>
                </div>
              </div>

              {field.enabled && (
                <button
                  onClick={() => toggleRequired(field.type)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    field.required
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}
                >
                  {field.required ? "مطلوب" : "اختياري"}
                </button>
              )}
            </div>

            {/* Extended options when enabled */}
            {field.enabled && (
              <div className="mt-3 mr-10 space-y-2">
                {/* Custom label */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-16 shrink-0">التسمية:</span>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.type, "label", e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                    dir="rtl"
                  />
                </div>

                {/* Presentation: allowFile + allowLink */}
                {field.type === "presentation" && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <input
                        type="checkbox"
                        checked={field.allowLink !== false}
                        onChange={(e) => updateField(field.type, "allowLink", e.target.checked)}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      رابط
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <input
                        type="checkbox"
                        checked={field.allowFile === true}
                        onChange={(e) => updateField(field.type, "allowFile", e.target.checked)}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      ملف
                    </label>
                  </div>
                )}

                {/* Miro: providedUrl */}
                {field.type === "miro" && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-16 shrink-0">رابط جاهز:</span>
                    <input
                      type="url"
                      value={field.providedUrl || ""}
                      onChange={(e) => updateField(field.type, "providedUrl", e.target.value)}
                      placeholder="https://miro.com/app/board/..."
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                      dir="ltr"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Deliverables Tab ───────────────────────────────────────
function DeliverablesTab({
  phase,
  eventId,
}: {
  phase: Phase;
  eventId: string;
}) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [stats, setStats] = useState<{ total: number; delivered: number; pending: number } | null>(null);
  const [config, setConfig] = useState<DeliverableConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliverables = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}/phases/${phase.id}/deliverables`);
        if (!res.ok) throw new Error("فشل تحميل التسليمات");
        const data = await res.json();
        setDeliverables(data.deliverables || []);
        setStats(data.stats || null);
        setConfig(data.deliverableConfig || null);
      } catch (err) {
        console.error("Failed to load deliverables:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliverables();
  }, [eventId, phase.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-elm-navy">{stats.total}</p>
            <p className="text-[10px] text-gray-500">إجمالي الفرق</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-700">{stats.delivered}</p>
            <p className="text-[10px] text-emerald-600">سلّموا</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-[10px] text-amber-600">بانتظار التسليم</p>
          </div>
        </div>
      )}

      {/* Config Summary */}
      {config && config.fields.some(f => f.enabled) && (
        <div className="bg-brand-50/50 rounded-xl p-3 border border-brand-100">
          <p className="text-[11px] font-bold text-brand-700 mb-2">التسليمات المطلوبة لهذه المرحلة:</p>
          <div className="flex flex-wrap gap-2">
            {config.fields.filter(f => f.enabled).map(f => (
              <span
                key={f.type}
                className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                  f.required ? "bg-red-50 text-red-600 border border-red-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                {f.label} {f.required ? "(مطلوب)" : "(اختياري)"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Deliverables Table */}
      <div className="bg-gray-50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-gray-500 border-b border-gray-200">
              <th className="text-right px-4 py-3 font-medium">الفريق</th>
              <th className="text-center px-4 py-3 font-medium">المسار</th>
              <th className="text-center px-4 py-3 font-medium">الأعضاء</th>
              <th className="text-center px-4 py-3 font-medium">الحالة</th>
              <th className="text-center px-4 py-3 font-medium">الروابط</th>
            </tr>
          </thead>
          <tbody>
            {deliverables.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                  لا توجد تسليمات بعد
                </td>
              </tr>
            ) : (
              deliverables.map((d) => (
                <tr key={d.teamId} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-elm-navy text-xs">{d.teamName}</p>
                  </td>
                  <td className="text-center px-4 py-3">
                    {d.trackName ? (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: d.trackColor ? `${d.trackColor}20` : "#f3f4f6",
                          color: d.trackColor || "#6b7280",
                        }}
                      >
                        {d.trackName}
                      </span>
                    ) : (
                      <span className="text-gray-300">&mdash;</span>
                    )}
                  </td>
                  <td className="text-center px-4 py-3 text-xs text-gray-500">
                    {d.memberCount}
                  </td>
                  <td className="text-center px-4 py-3">
                    {d.hasDeliverable ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        <Check className="w-3 h-3" /> تم التسليم
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                        <Clock className="w-3 h-3" /> بانتظار
                      </span>
                    )}
                  </td>
                  <td className="text-center px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {d.repositoryUrl && (
                        <a
                          href={d.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                          title="المستودع"
                        >
                          <Link2 className="w-3 h-3" />
                        </a>
                      )}
                      {d.presentationUrl && (
                        <a
                          href={d.presentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors"
                          title="العرض"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {d.demoUrl && (
                        <a
                          href={d.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-purple-50 hover:bg-purple-100 text-purple-500 transition-colors"
                          title="العرض التجريبي"
                        >
                          <Play className="w-3 h-3" />
                        </a>
                      )}
                      {d.miroBoard && (
                        <a
                          href={d.miroBoard}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-amber-50 hover:bg-amber-100 text-amber-500 transition-colors"
                          title="Miro"
                        >
                          <Layers className="w-3 h-3" />
                        </a>
                      )}
                      {d.oneDriveUrl && (
                        <a
                          href={d.oneDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-500 transition-colors"
                          title="OneDrive"
                        >
                          <FileText className="w-3 h-3" />
                        </a>
                      )}
                      {d.submissionFileUrl && (
                        <a
                          href={d.submissionFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-green-50 hover:bg-green-100 text-green-500 transition-colors"
                          title="ملف التسليم"
                        >
                          <FileText className="w-3 h-3" />
                        </a>
                      )}
                      {!d.hasDeliverable && (
                        <span className="text-gray-300 text-[10px]">&mdash;</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Phase Form Modal ───────────────────────────────────────
function PhaseFormModal({
  eventId,
  phase,
  onClose,
  onSaved,
}: {
  eventId: string;
  phase: Phase | null; // null = add mode
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!phase;

  const [form, setForm] = useState({
    nameAr: phase?.nameAr || "",
    name: phase?.name || "",
    phaseType: (phase?.phaseType || "GENERAL") as PhaseType,
    startDate: phase?.startDate ? new Date(phase.startDate).toISOString().split("T")[0] : "",
    endDate: phase?.endDate ? new Date(phase.endDate).toISOString().split("T")[0] : "",
    isElimination: phase?.isElimination || false,
    passThreshold: phase?.passThreshold?.toString() || "",
    maxAdvancing: phase?.maxAdvancing?.toString() || "",
    advancePercent: phase?.advancePercent?.toString() || "",
    evaluationMethod: (phase?.evaluationMethod || "") as EvaluationMethod | "",
    advancementMode: (phase?.advancementMode || "OVERALL") as AdvancementMode,
    judgesPerTeam: (phase?.judgesPerTeam || 1).toString(),
    qualificationMode: (phase?.qualificationMode || "SCORE_BASED") as QualificationMode,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.nameAr || !form.startDate || !form.endDate) {
      alert("الرجاء تعبئة الحقول المطلوبة: الاسم العربي، تاريخ البداية والنهاية");
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        nameAr: form.nameAr,
        name: form.name || form.nameAr,
        phaseType: form.phaseType,
        startDate: form.startDate,
        endDate: form.endDate,
        isElimination: form.isElimination,
        passThreshold: form.passThreshold || null,
        maxAdvancing: form.maxAdvancing || null,
        advancePercent: form.advancePercent || null,
        evaluationMethod: form.evaluationMethod || null,
        advancementMode: form.advancementMode,
        judgesPerTeam: parseInt(form.judgesPerTeam) || 1,
        qualificationMode: form.qualificationMode,
      };

      if (isEdit) {
        const res = await fetch(`/api/events/${eventId}/phases/${phase!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("فشل تحديث المرحلة");
      } else {
        const res = await fetch(`/api/events/${eventId}/phases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("فشل إضافة المرحلة");
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save phase:", err);
      alert(isEdit ? "فشل تحديث المرحلة" : "فشل إضافة المرحلة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-elm-navy">
            {isEdit ? "تعديل المرحلة" : "إضافة مرحلة جديدة"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">اسم المرحلة (عربي) *</label>
              <input
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="مثال: مرحلة التطوير"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phase Name (English)</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="e.g. Development Phase"
              />
            </div>
          </div>

          {/* Phase Type */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">نوع المرحلة</label>
            <select
              value={form.phaseType}
              onChange={(e) => setForm({ ...form, phaseType: e.target.value as PhaseType })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {Object.entries(phaseTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Evaluation Method + Advancement Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">طريقة التقييم</label>
              <select
                value={form.evaluationMethod}
                onChange={(e) => setForm({ ...form, evaluationMethod: e.target.value as EvaluationMethod | "" })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                <option value="">بدون</option>
                {Object.entries(evaluationMethodLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">وضع التأهل</label>
              <select
                value={form.advancementMode}
                onChange={(e) => setForm({ ...form, advancementMode: e.target.value as AdvancementMode })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                {Object.entries(advancementModeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Qualification Mode + Judges Per Team */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-blue-600 mb-1 block">نمط التأهل</label>
                <select
                  value={form.qualificationMode}
                  onChange={(e) => setForm({ ...form, qualificationMode: e.target.value as QualificationMode })}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {Object.entries(qualificationModeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              {(form.evaluationMethod === "JUDGE_MANUAL" || form.evaluationMethod === "COMBINED") && (
                <div>
                  <label className="text-xs text-blue-600 mb-1 block">عدد المحكمين لكل فريق</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.judgesPerTeam}
                    onChange={(e) => setForm({ ...form, judgesPerTeam: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="2"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">تاريخ البداية *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">تاريخ النهاية *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>

          {/* Elimination Toggle */}
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isElimination}
                onChange={(e) => setForm({ ...form, isElimination: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <div>
                <span className="text-sm font-bold text-red-700">مرحلة تصفية (إقصاء)</span>
                <p className="text-[11px] text-red-500">
                  سيتم تصفية الفرق التي لا تستوفي الحد الأدنى
                </p>
              </div>
            </label>

            {form.isElimination && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-red-500 mb-1 block">حد النجاح (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.passThreshold}
                    onChange={(e) => setForm({ ...form, passThreshold: e.target.value })}
                    placeholder="60"
                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-red-500 mb-1 block">الحد الأقصى للمتأهلين</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxAdvancing}
                    onChange={(e) => setForm({ ...form, maxAdvancing: e.target.value })}
                    placeholder="20"
                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-red-500 mb-1 block">نسبة التأهل (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.advancePercent}
                    onChange={(e) => setForm({ ...form, advancePercent: e.target.value })}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? "تحديث المرحلة" : "حفظ المرحلة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ──────────────────────────────
function DeleteConfirmModal({
  phase,
  eventId,
  onClose,
  onDeleted,
}: {
  phase: Phase;
  eventId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/phases/${phase.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("فشل حذف المرحلة");
      onDeleted();
      onClose();
    } catch (err) {
      console.error("Failed to delete phase:", err);
      alert("فشل حذف المرحلة");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-elm-navy">حذف المرحلة</h3>
            <p className="text-[11px] text-gray-500 mt-1">
              هل أنت متأكد من حذف مرحلة &quot;{phase.nameAr}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function PhasesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [phases, setPhases] = useState<Phase[]>([]);
  const [totalTeams, setTotalTeams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [deletingPhase, setDeletingPhase] = useState<Phase | null>(null);

  const fetchPhases = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/events/${eventId}/phases`);
      if (!res.ok) throw new Error("فشل تحميل المراحل");
      const data = await res.json();
      setPhases(data.phases || []);
      setTotalTeams(data.totalTeams || 0);
      // Auto-expand the first active phase
      if (!expandedPhase && data.phases?.length > 0) {
        const active = data.phases.find((p: Phase) => p.status === "ACTIVE");
        if (active) setExpandedPhase(active.id);
      }
    } catch (err) {
      console.error("Failed to fetch phases:", err);
      setError("فشل تحميل بيانات المراحل. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchPhases();
  }, [eventId, fetchPhases]);

  const handleStatusChange = async (phaseId: string, newStatus: PhaseStatus) => {
    const statusLabel = statusConfig[newStatus].label;
    if (!confirm(`هل أنت متأكد من تغيير حالة المرحلة إلى "${statusLabel}"؟`)) return;
    try {
      const res = await fetch(`/api/events/${eventId}/phases/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("فشل تحديث الحالة");
      fetchPhases();
    } catch (err) {
      console.error("Failed to change status:", err);
      alert("فشل تحديث حالة المرحلة");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <TopBar title="Phase Management" titleAr="إدارة المراحل" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400">جاري تحميل المراحل...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <TopBar title="Phase Management" titleAr="إدارة المراحل" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => { setLoading(true); fetchPhases(); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm rounded-xl hover:bg-brand-600 transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Phase Management" titleAr="إدارة المراحل" />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">مراحل الفعالية</h2>
            <p className="text-sm text-gray-500 mt-1">
              {phases.length} مراحل | {phases.filter((p) => p.isElimination).length} مراحل تصفية |{" "}
              {totalTeams} فريق
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPhases}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة مرحلة
            </button>
          </div>
        </div>

        {/* Timeline */}
        {phases.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-[11px] text-gray-400 mb-3 font-medium">الجدول الزمني للمراحل</p>
            <PhaseTimeline phases={phases} />
          </div>
        )}

        {/* Phase Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Layers className="w-6 h-6 text-brand-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-elm-navy">{phases.length}</p>
            <p className="text-[11px] text-gray-500">إجمالي المراحل</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Play className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-700">
              {phases.filter((p) => p.status === "ACTIVE").length}
            </p>
            <p className="text-[11px] text-gray-500">مراحل نشطة</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">
              {phases.filter((p) => p.isElimination).length}
            </p>
            <p className="text-[11px] text-gray-500">مراحل تصفية</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <CheckCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">
              {phases.filter((p) => p.status === "COMPLETED").length}
            </p>
            <p className="text-[11px] text-gray-500">مراحل مكتملة</p>
          </div>
        </div>

        {/* Phase Cards */}
        {phases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Layers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-400 mb-2">لا توجد مراحل بعد</p>
            <p className="text-[11px] text-gray-300 mb-4">أضف أول مرحلة للفعالية</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة مرحلة
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                isExpanded={expandedPhase === phase.id}
                onToggle={() =>
                  setExpandedPhase(expandedPhase === phase.id ? null : phase.id)
                }
                eventId={eventId}
                onRefresh={fetchPhases}
                onEdit={(p) => setEditingPhase(p)}
                onDelete={(p) => setDeletingPhase(p)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Phase Modal */}
      {showAddModal && (
        <PhaseFormModal
          eventId={eventId}
          phase={null}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchPhases}
        />
      )}

      {/* Edit Phase Modal */}
      {editingPhase && (
        <PhaseFormModal
          eventId={eventId}
          phase={editingPhase}
          onClose={() => setEditingPhase(null)}
          onSaved={fetchPhases}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingPhase && (
        <DeleteConfirmModal
          phase={deletingPhase}
          eventId={eventId}
          onClose={() => setDeletingPhase(null)}
          onDeleted={fetchPhases}
        />
      )}
    </div>
  );
}
