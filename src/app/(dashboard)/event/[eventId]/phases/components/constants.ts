import {
  Layers,
  Users,
  Eye,
  Settings,
  Play,
  Target,
  Trophy,
  Filter as FilterIcon,
  Clock,
  CheckCircle,
} from "lucide-react";
import type { PhaseType, PhaseStatus, EvaluationMethod, AdvancementMode, QualificationMode, AutoFilterRule, DeliverableFieldConfig } from "./types";

export const phaseTypeLabels: Record<PhaseType, string> = {
  GENERAL: "عام",
  REGISTRATION: "تسجيل",
  IDEA_REVIEW: "مراجعة أفكار",
  DEVELOPMENT: "تطوير",
  PRESENTATION: "عرض تقديمي",
  JUDGING: "تحكيم",
  FINALS: "نهائيات",
  ELIMINATION: "تصفيات",
};

export const evaluationMethodLabels: Record<EvaluationMethod, string> = {
  AI_AUTO: "تقييم تلقائي",
  JUDGE_MANUAL: "تحكيم يدوي",
  COMBINED: "مدمج",
  MENTOR_REVIEW: "مراجعة مرشد",
  PEER_REVIEW: "مراجعة أقران",
};

export const advancementModeLabels: Record<AdvancementMode, string> = {
  PER_TRACK: "لكل مسار",
  OVERALL: "شامل",
};

export const qualificationModeLabels: Record<QualificationMode, string> = {
  SCORE_BASED: "بناءً على الدرجات",
  ADVANCE_ALL: "تأهل الجميع (100%)",
  MANUAL: "تأهل يدوي",
};

export const phaseTypeIcons: Record<PhaseType, any> = {
  GENERAL: Layers,
  REGISTRATION: Users,
  IDEA_REVIEW: Eye,
  DEVELOPMENT: Settings,
  PRESENTATION: Play,
  JUDGING: Target,
  FINALS: Trophy,
  ELIMINATION: FilterIcon,
};

export const statusConfig: Record<PhaseStatus, { label: string; color: string; icon: any }> = {
  UPCOMING: { label: "قادمة", color: "bg-gray-100 text-gray-600", icon: Clock },
  ACTIVE: { label: "جارية", color: "bg-emerald-50 text-emerald-700", icon: Play },
  COMPLETED: { label: "مكتملة", color: "bg-blue-50 text-blue-700", icon: CheckCircle },
};

export const autoFilterRuleLabels: Record<string, string> = {
  has_technical_member: "عضو تقني في الفريق",
  diverse_specializations: "تنوع التخصصات",
  has_business_link: "رابط أعمال",
  has_repository: "رابط المستودع",
  has_presentation: "رابط العرض",
  team_size_min: "الحد الأدنى لحجم الفريق",
  team_size_max: "الحد الأقصى لحجم الفريق",
  max_per_track: "الحد الأقصى لكل مسار",
};

export const DEFAULT_RULES: AutoFilterRule[] = [
  { type: "has_technical_member", enabled: false },
  { type: "diverse_specializations", enabled: false, minCount: 2 },
  { type: "has_business_link", enabled: false },
  { type: "has_repository", enabled: false },
  { type: "has_presentation", enabled: false },
  { type: "team_size_min", enabled: false, value: 2 },
  { type: "team_size_max", enabled: false, value: 5 },
  { type: "max_per_track", enabled: false, value: 10 },
];

export const DEFAULT_DELIVERABLE_FIELDS: DeliverableFieldConfig[] = [
  { type: "description", enabled: true, required: true, label: "وصف المشروع" },
  { type: "repository", enabled: false, required: false, label: "رابط GitHub" },
  { type: "presentation", enabled: false, required: false, label: "العرض التقديمي", allowFile: false, allowLink: true },
  { type: "demo", enabled: false, required: false, label: "رابط التجربة" },
  { type: "miro", enabled: false, required: false, label: "لوحة Miro", providedUrl: "" },
  { type: "onedrive", enabled: false, required: false, label: "OneDrive" },
  { type: "file", enabled: false, required: false, label: "ملفات إضافية" },
];

export const deliverableTypeLabels: Record<string, string> = {
  description: "وصف المشروع",
  repository: "رابط المستودع (GitHub)",
  presentation: "العرض التقديمي",
  demo: "رابط التجربة / النموذج",
  miro: "لوحة Miro",
  onedrive: "OneDrive",
  file: "ملفات مرفقة",
};

export const PHASE_PRESETS: Record<string, string[]> = {
  idea_review: ["description", "miro"],
  development: ["description", "repository", "presentation", "miro"],
  finals: ["description", "repository", "presentation", "demo", "miro", "file"],
};
