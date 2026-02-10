"use client";

import { useState } from "react";
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
  ArrowRight,
  ArrowLeft,
  Settings,
  Trash2,
  Edit3,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Filter as FilterIcon,
  BarChart3,
  UserCheck,
  UserX,
  Percent,
  Target,
  GripVertical,
  Eye,
  Save,
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

interface PhaseCriteria {
  id: string;
  name: string;
  nameAr: string;
  maxScore: number;
  weight: number;
}

interface PhaseResult {
  id: string;
  name: string;
  nameAr: string;
  teamName?: string;
  score: number | null;
  totalScore: number | null;
  status: "PENDING" | "EVALUATED" | "ADVANCED" | "ELIMINATED";
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
  criteria: PhaseCriteria[];
  results: PhaseResult[];
  totalParticipants: number;
  advanced: number;
  eliminated: number;
}

// ─── Mock Data ───────────────────────────────────────────────
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

const mockPhases: Phase[] = [
  {
    id: "1",
    name: "Idea Submission",
    nameAr: "تقديم الأفكار",
    phaseNumber: 1,
    phaseType: "IDEA_REVIEW",
    status: "COMPLETED",
    startDate: "2025-03-01",
    endDate: "2025-03-10",
    isElimination: true,
    passThreshold: 60,
    maxAdvancing: 20,
    advancePercent: 50,
    criteria: [
      { id: "c1", name: "Innovation", nameAr: "الابتكار", maxScore: 10, weight: 1.5 },
      { id: "c2", name: "Feasibility", nameAr: "قابلية التنفيذ", maxScore: 10, weight: 1.0 },
      { id: "c3", name: "Impact", nameAr: "الأثر المتوقع", maxScore: 10, weight: 1.2 },
    ],
    results: [
      { id: "r1", name: "Ahmed Ali", nameAr: "أحمد علي", teamName: "فريق الابتكار", score: 85, totalScore: 85, status: "ADVANCED" },
      { id: "r2", name: "Sara Omar", nameAr: "سارة عمر", teamName: "فريق التقنية", score: 78, totalScore: 78, status: "ADVANCED" },
      { id: "r3", name: "Khalid Nasser", nameAr: "خالد ناصر", teamName: "فريق الحلول", score: 45, totalScore: 45, status: "ELIMINATED" },
    ],
    totalParticipants: 40,
    advanced: 20,
    eliminated: 20,
  },
  {
    id: "2",
    name: "Development Phase",
    nameAr: "مرحلة التطوير",
    phaseNumber: 2,
    phaseType: "DEVELOPMENT",
    status: "ACTIVE",
    startDate: "2025-03-15",
    endDate: "2025-04-01",
    isElimination: true,
    passThreshold: 70,
    maxAdvancing: 10,
    advancePercent: 50,
    criteria: [
      { id: "c4", name: "Code Quality", nameAr: "جودة الكود", maxScore: 10, weight: 1.5 },
      { id: "c5", name: "User Experience", nameAr: "تجربة المستخدم", maxScore: 10, weight: 1.0 },
      { id: "c6", name: "Technical Architecture", nameAr: "البنية التقنية", maxScore: 10, weight: 1.3 },
      { id: "c7", name: "Documentation", nameAr: "التوثيق", maxScore: 10, weight: 0.8 },
    ],
    results: [
      { id: "r4", name: "Ahmed Ali", nameAr: "أحمد علي", teamName: "فريق الابتكار", score: null, totalScore: null, status: "PENDING" },
      { id: "r5", name: "Sara Omar", nameAr: "سارة عمر", teamName: "فريق التقنية", score: null, totalScore: null, status: "PENDING" },
    ],
    totalParticipants: 20,
    advanced: 0,
    eliminated: 0,
  },
  {
    id: "3",
    name: "Final Presentations",
    nameAr: "العروض النهائية",
    phaseNumber: 3,
    phaseType: "FINALS",
    status: "UPCOMING",
    startDate: "2025-04-10",
    endDate: "2025-04-12",
    isElimination: false,
    passThreshold: null,
    maxAdvancing: null,
    advancePercent: null,
    criteria: [
      { id: "c8", name: "Presentation Skills", nameAr: "مهارات العرض", maxScore: 10, weight: 1.0 },
      { id: "c9", name: "Demo Quality", nameAr: "جودة العرض التجريبي", maxScore: 10, weight: 1.5 },
      { id: "c10", name: "Q&A Response", nameAr: "الإجابة على الأسئلة", maxScore: 10, weight: 1.0 },
    ],
    results: [],
    totalParticipants: 10,
    advanced: 0,
    eliminated: 0,
  },
];

// ─── Components ──────────────────────────────────────────────

function PhaseTimeline({ phases }: { phases: Phase[] }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {phases.map((phase, idx) => {
        const StatusIcon = statusConfig[phase.status].icon;
        return (
          <div key={phase.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
              phase.status === "ACTIVE"
                ? "bg-emerald-50 border-emerald-200 shadow-sm"
                : phase.status === "COMPLETED"
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-200"
            }`}>
              <StatusIcon className={`w-4 h-4 ${
                phase.status === "ACTIVE" ? "text-emerald-600" :
                phase.status === "COMPLETED" ? "text-blue-600" : "text-gray-400"
              }`} />
              <div className="text-center">
                <p className="text-[10px] text-gray-400">المرحلة {phase.phaseNumber}</p>
                <p className={`text-xs font-bold ${
                  phase.status === "ACTIVE" ? "text-emerald-700" :
                  phase.status === "COMPLETED" ? "text-blue-700" : "text-gray-500"
                }`}>{phase.nameAr}</p>
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

function PhaseCard({
  phase,
  isExpanded,
  onToggle,
}: {
  phase: Phase;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "criteria" | "results">("overview");
  const PhaseIcon = phaseTypeIcons[phase.phaseType];
  const statusCfg = statusConfig[phase.status];
  const StatusIcon = statusCfg.icon;

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
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {phase.startDate} → {phase.endDate}
              </span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {phase.totalParticipants} مشارك
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
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
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
          <div className="flex items-center gap-0 px-6 border-b border-gray-100">
            {[
              { key: "overview", label: "نظرة عامة", icon: BarChart3 },
              { key: "criteria", label: "معايير التقييم", icon: Target },
              { key: "results", label: "النتائج والتصفية", icon: Trophy },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-elm-navy">{phase.totalParticipants}</p>
                  <p className="text-[11px] text-gray-500 mt-1">إجمالي المشاركين</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-elm-navy">{phase.criteria.length}</p>
                  <p className="text-[11px] text-gray-500 mt-1">معايير التقييم</p>
                </div>
                {phase.isElimination && (
                  <>
                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-700">
                        {phase.passThreshold}%
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-1">حد النجاح الأدنى</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-700">
                        {phase.maxAdvancing || `${phase.advancePercent}%`}
                      </p>
                      <p className="text-[11px] text-blue-600 mt-1">
                        {phase.maxAdvancing ? "الحد الأقصى للمتأهلين" : "نسبة التأهل"}
                      </p>
                    </div>
                  </>
                )}
                {!phase.isElimination && (
                  <>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-purple-700">{phaseTypeLabels[phase.phaseType]}</p>
                      <p className="text-[11px] text-purple-600 mt-1">نوع المرحلة</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-amber-700">—</p>
                      <p className="text-[11px] text-amber-600 mt-1">لا تصفية</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "criteria" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-elm-navy">
                    معايير تقييم المرحلة ({phase.criteria.length} معايير)
                  </p>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-100 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    إضافة معيار
                  </button>
                </div>
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
                      {phase.criteria.map((c) => (
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
                            <span className="text-xs font-bold text-brand-600">×{c.weight}</span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="text-xs font-bold text-elm-navy">
                              {(c.maxScore * c.weight).toFixed(1)}
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-400">
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100/50">
                        <td className="px-4 py-3 font-bold text-sm text-elm-navy">المجموع</td>
                        <td className="text-center px-4 py-3 font-bold text-sm text-elm-navy">
                          {phase.criteria.reduce((s, c) => s + c.maxScore, 0)}
                        </td>
                        <td className="text-center px-4 py-3">—</td>
                        <td className="text-center px-4 py-3 font-bold text-sm text-brand-600">
                          {phase.criteria.reduce((s, c) => s + c.maxScore * c.weight, 0).toFixed(1)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "results" && (
              <div className="space-y-4">
                {/* Elimination Controls */}
                {phase.isElimination && phase.status === "ACTIVE" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">مرحلة تصفية نشطة</p>
                        <p className="text-[11px] text-amber-600">
                          سيتم تصفية المشاركين بناءً على الدرجات. حد النجاح: {phase.passThreshold}% | الحد الأقصى للمتأهلين: {phase.maxAdvancing}
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors">
                      تنفيذ التصفية
                    </button>
                  </div>
                )}

                {/* Results Table */}
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-gray-500 border-b border-gray-200">
                        <th className="text-right px-4 py-3 font-medium">#</th>
                        <th className="text-right px-4 py-3 font-medium">المشارك / الفريق</th>
                        <th className="text-center px-4 py-3 font-medium">الدرجة</th>
                        <th className="text-center px-4 py-3 font-medium">الحالة</th>
                        <th className="text-center px-4 py-3 font-medium">إجراء</th>
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
                              <p className="font-medium text-elm-navy">{r.nameAr}</p>
                              {r.teamName && (
                                <p className="text-[10px] text-gray-400">{r.teamName}</p>
                              )}
                            </td>
                            <td className="text-center px-4 py-3">
                              {r.totalScore !== null ? (
                                <span className="font-bold text-elm-navy">{r.totalScore}%</span>
                              ) : (
                                <span className="text-gray-300">—</span>
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
                            <td className="text-center px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                {r.status === "PENDING" && (
                                  <button className="px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-medium rounded-lg hover:bg-brand-100">
                                    تقييم
                                  </button>
                                )}
                                {r.status === "EVALUATED" && phase.isElimination && (
                                  <>
                                    <button className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded-lg hover:bg-emerald-100">
                                      <UserCheck className="w-3 h-3" />
                                    </button>
                                    <button className="px-2 py-1 bg-red-50 text-red-500 text-[10px] font-medium rounded-lg hover:bg-red-100">
                                      <UserX className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                                <button className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-lg hover:bg-gray-200">
                                  <Eye className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Phase Modal ─────────────────────────────────────────

function AddPhaseForm({ onClose }: { onClose: () => void }) {
  const [isElimination, setIsElimination] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-elm-navy">إضافة مرحلة جديدة</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">اسم المرحلة (عربي)</label>
              <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" placeholder="مثال: مرحلة التطوير" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phase Name (English)</label>
              <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" placeholder="e.g. Development Phase" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">نوع المرحلة</label>
            <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200">
              {Object.entries(phaseTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">تاريخ البداية</label>
              <input type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">تاريخ النهاية</label>
              <input type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
          </div>

          {/* Elimination Toggle */}
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isElimination}
                onChange={(e) => setIsElimination(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <div>
                <span className="text-sm font-bold text-red-700">مرحلة تصفية (إقصاء)</span>
                <p className="text-[11px] text-red-500">سيتم تصفية المشاركين الذين لا يستوفون الحد الأدنى</p>
              </div>
            </label>

            {isElimination && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-red-500 mb-1 block">حد النجاح (%)</label>
                  <input type="number" min={0} max={100} placeholder="60" className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                </div>
                <div>
                  <label className="text-[10px] text-red-500 mb-1 block">الحد الأقصى للمتأهلين</label>
                  <input type="number" min={1} placeholder="20" className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                </div>
                <div>
                  <label className="text-[10px] text-red-500 mb-1 block">نسبة التأهل (%)</label>
                  <input type="number" min={0} max={100} placeholder="50" className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            إلغاء
          </button>
          <button className="px-6 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" />
            حفظ المرحلة
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function PhasesPage() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>("2");
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <TopBar title="Phase Management" titleAr="إدارة المراحل" />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">مراحل الفعالية</h2>
            <p className="text-sm text-gray-500 mt-1">
              {mockPhases.length} مراحل | {mockPhases.filter((p) => p.isElimination).length} مراحل تصفية
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            إضافة مرحلة
          </button>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-[11px] text-gray-400 mb-3 font-medium">الجدول الزمني للمراحل</p>
          <PhaseTimeline phases={mockPhases} />
        </div>

        {/* Phase Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Layers className="w-6 h-6 text-brand-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-elm-navy">{mockPhases.length}</p>
            <p className="text-[11px] text-gray-500">إجمالي المراحل</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Play className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-700">
              {mockPhases.filter((p) => p.status === "ACTIVE").length}
            </p>
            <p className="text-[11px] text-gray-500">مراحل نشطة</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">
              {mockPhases.filter((p) => p.isElimination).length}
            </p>
            <p className="text-[11px] text-gray-500">مراحل تصفية</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <CheckCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">
              {mockPhases.filter((p) => p.status === "COMPLETED").length}
            </p>
            <p className="text-[11px] text-gray-500">مراحل مكتملة</p>
          </div>
        </div>

        {/* Phase Cards */}
        <div className="space-y-4">
          {mockPhases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              isExpanded={expandedPhase === phase.id}
              onToggle={() =>
                setExpandedPhase(expandedPhase === phase.id ? null : phase.id)
              }
            />
          ))}
        </div>
      </div>

      {/* Add Phase Modal */}
      {showAddForm && <AddPhaseForm onClose={() => setShowAddForm(false)} />}
    </div>
  );
}
