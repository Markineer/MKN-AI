"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ChevronLeft,
  Star,
  Save,
  CheckCircle,
  AlertCircle,
  Users,
  Target,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  GitBranch,
  Presentation,
  Globe,
  FileText,
  Link2,
} from "lucide-react";

interface Criterion {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  maxScore: number;
  weight: number;
  sortOrder: number;
}

interface TeamInfo {
  id: string;
  name: string;
  nameAr: string | null;
  trackNameAr: string | null;
  trackColor: string | null;
  memberCount: number;
  members: { name: string; role: string }[];
}

interface ExistingEvaluation {
  scores: Record<string, number>;
  totalScore: number;
  feedback: string | null;
  feedbackAr: string | null;
  strengths: string | null;
  weaknesses: string | null;
}

interface Deliverables {
  projectTitle: string | null;
  projectDescription: string | null;
  repositoryUrl: string | null;
  presentationUrl: string | null;
  demoUrl: string | null;
  miroBoard: string | null;
  oneDriveUrl: string | null;
  fileUrl: string | null;
  submissionContent: string | null;
}

export default function EvaluateTeamPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const teamId = params.teamId as string;

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedbackAr, setFeedbackAr] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [deliverables, setDeliverables] = useState<Deliverables | null>(null);
  const [deliverableConfig, setDeliverableConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/judges/my-events/${eventId}/teams/${teamId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCriteria(data.criteria || []);
        setTeam(data.team || null);
        if (data.deliverables) setDeliverables(data.deliverables);
        if (data.deliverableConfig) setDeliverableConfig(data.deliverableConfig);

        // Initialize scores
        const initial: Record<string, number> = {};
        for (const c of data.criteria || []) {
          initial[c.id] = 0;
        }

        // If there's an existing evaluation, load it
        if (data.existingEvaluation) {
          setIsEdit(true);
          const existing = data.existingEvaluation as ExistingEvaluation;
          setScores({ ...initial, ...existing.scores });
          setFeedbackAr(existing.feedbackAr || existing.feedback || "");
          setStrengths(existing.strengths || "");
          setWeaknesses(existing.weaknesses || "");
        } else {
          setScores(initial);
        }
      } catch {
        setError("فشل تحميل بيانات التقييم");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [eventId, teamId]);

  // Calculate weighted total score
  const totalScore = useMemo(() => {
    if (criteria.length === 0) return 0;
    let weightedSum = 0;
    let totalWeight = 0;
    for (const c of criteria) {
      const score = scores[c.id] || 0;
      weightedSum += (score / c.maxScore) * c.weight;
      totalWeight += c.weight;
    }
    return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  }, [scores, criteria]);

  async function handleSubmit() {
    setError("");

    // Validate all criteria have scores
    for (const c of criteria) {
      if (scores[c.id] === undefined || scores[c.id] === null) {
        setError(`يرجى تقييم معيار "${c.nameAr}"`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          scores,
          feedbackAr,
          strengths,
          weaknesses,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل حفظ التقييم");
      }
      setSuccess(true);
      setTimeout(() => {
        router.push(`/judge/event/${eventId}`);
      }, 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-elm-navy mb-2">
            {isEdit ? "تم تحديث التقييم!" : "تم إرسال التقييم بنجاح!"}
          </h2>
          <p className="text-sm text-gray-500">الدرجة النهائية: {totalScore.toFixed(1)}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/judge/event/${eventId}`}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-elm-navy">
            {isEdit ? "تعديل التقييم" : "تقييم الفريق"}
          </h1>
          <p className="text-sm text-gray-500">{team?.nameAr || team?.name}</p>
        </div>
      </div>

      {/* Team Info Card */}
      {team && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 font-bold text-lg">
              {(team.nameAr || team.name)?.[0]}
            </div>
            <div>
              <h3 className="font-bold text-elm-navy">{team.nameAr || team.name}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {team.memberCount} أعضاء
                </span>
                {team.trackNameAr && (
                  <span className="flex items-center gap-1" style={{ color: team.trackColor || "#7C3AED" }}>
                    {team.trackNameAr}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Deliverables - filtered by phase config if available */}
      {deliverables && (() => {
        // Helper to check if a field should be shown
        const shouldShow = (type: string): boolean => {
          if (!deliverableConfig?.fields) return true; // no config = show all
          const field = deliverableConfig.fields.find((f: any) => f.type === type);
          return field?.enabled ?? false;
        };
        const getLabel = (type: string, fallback: string): string => {
          if (!deliverableConfig?.fields) return fallback;
          const field = deliverableConfig.fields.find((f: any) => f.type === type);
          return field?.label || fallback;
        };

        const hasAny = (
          (shouldShow("repository") && deliverables.repositoryUrl) ||
          (shouldShow("presentation") && deliverables.presentationUrl) ||
          (shouldShow("demo") && deliverables.demoUrl) ||
          (shouldShow("miro") && deliverables.miroBoard) ||
          (shouldShow("onedrive") && deliverables.oneDriveUrl) ||
          (shouldShow("file") && deliverables.fileUrl) ||
          (shouldShow("description") && (deliverables.projectTitle || deliverables.submissionContent))
        );

        if (!hasAny) return null;

        return (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <h3 className="font-bold text-elm-navy mb-3 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-brand-500" />
              تسليمات الفريق
            </h3>
            {shouldShow("description") && deliverables.projectTitle && (
              <div className="mb-3">
                <p className="text-sm font-medium text-elm-navy">{deliverables.projectTitle}</p>
                {deliverables.projectDescription && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3">{deliverables.projectDescription}</p>
                )}
              </div>
            )}
            {shouldShow("description") && deliverables.submissionContent && (
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="text-xs text-gray-600 whitespace-pre-wrap">{deliverables.submissionContent}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {shouldShow("repository") && deliverables.repositoryUrl && (
                <a href={deliverables.repositoryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-xs hover:bg-brand-50 transition-colors group">
                  <GitBranch className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                  <span className="text-gray-700 group-hover:text-brand-600 truncate">{getLabel("repository", "المستودع")}</span>
                  <ExternalLink className="w-3 h-3 text-gray-300 mr-auto" />
                </a>
              )}
              {shouldShow("presentation") && deliverables.presentationUrl && (
                <a href={deliverables.presentationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-xs hover:bg-brand-50 transition-colors group">
                  <Presentation className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                  <span className="text-gray-700 group-hover:text-brand-600 truncate">{getLabel("presentation", "العرض التقديمي")}</span>
                  <ExternalLink className="w-3 h-3 text-gray-300 mr-auto" />
                </a>
              )}
              {shouldShow("demo") && deliverables.demoUrl && (
                <a href={deliverables.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-xs hover:bg-brand-50 transition-colors group">
                  <Globe className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                  <span className="text-gray-700 group-hover:text-brand-600 truncate">{getLabel("demo", "النموذج التجريبي")}</span>
                  <ExternalLink className="w-3 h-3 text-gray-300 mr-auto" />
                </a>
              )}
              {shouldShow("miro") && deliverables.miroBoard && (
                <a href={deliverables.miroBoard} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-xs hover:bg-brand-50 transition-colors group">
                  <Link2 className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                  <span className="text-gray-700 group-hover:text-brand-600 truncate">{getLabel("miro", "لوحة ميرو")}</span>
                  <ExternalLink className="w-3 h-3 text-gray-300 mr-auto" />
                </a>
              )}
              {shouldShow("onedrive") && deliverables.oneDriveUrl && (
                <a href={deliverables.oneDriveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-xs hover:bg-brand-50 transition-colors group">
                  <Link2 className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                  <span className="text-gray-700 group-hover:text-brand-600 truncate">{getLabel("onedrive", "ون درايف")}</span>
                  <ExternalLink className="w-3 h-3 text-gray-300 mr-auto" />
                </a>
              )}
              {shouldShow("file") && deliverables.fileUrl && (
                <a href={deliverables.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-xs hover:bg-brand-50 transition-colors group">
                  <FileText className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                  <span className="text-gray-700 group-hover:text-brand-600 truncate">{getLabel("file", "ملف مرفق")}</span>
                  <ExternalLink className="w-3 h-3 text-gray-300 mr-auto" />
                </a>
              )}
            </div>
          </div>
        );
      })()}

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Scoring Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-elm-navy mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-brand-500" />
          معايير التقييم
        </h2>

        <div className="space-y-6">
          {criteria.map((c) => (
            <div key={c.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold text-elm-navy">{c.nameAr || c.name}</h4>
                  {c.descriptionAr && (
                    <p className="text-xs text-gray-400 mt-0.5">{c.descriptionAr}</p>
                  )}
                </div>
                <div className="text-left flex-shrink-0 mr-4">
                  <span className="text-lg font-bold text-brand-600">{scores[c.id] || 0}</span>
                  <span className="text-xs text-gray-400"> / {c.maxScore}</span>
                  <span className="text-[10px] text-gray-300 block">الوزن: {c.weight}</span>
                </div>
              </div>

              {/* Score slider */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4">0</span>
                <input
                  type="range"
                  min={0}
                  max={c.maxScore}
                  step={0.5}
                  value={scores[c.id] || 0}
                  onChange={(e) => setScores(prev => ({ ...prev, [c.id]: parseFloat(e.target.value) }))}
                  className="flex-1 h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-brand-500"
                />
                <span className="text-xs text-gray-400 w-6">{c.maxScore}</span>
              </div>

              {/* Quick score buttons */}
              <div className="flex items-center gap-1.5 mt-2">
                {Array.from({ length: Math.min(Math.ceil(c.maxScore) + 1, 11) }, (_, i) => {
                  const val = c.maxScore <= 10 ? i : Math.round((i / 10) * c.maxScore);
                  return (
                    <button
                      key={i}
                      onClick={() => setScores(prev => ({ ...prev, [c.id]: val }))}
                      className={`w-7 h-7 rounded-lg text-[10px] font-medium transition-colors ${
                        scores[c.id] === val
                          ? "bg-brand-500 text-white"
                          : "bg-gray-50 text-gray-500 hover:bg-brand-50 hover:text-brand-600"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Score Preview */}
      <div className="bg-gradient-to-l from-brand-600 via-brand-500 to-purple-600 rounded-2xl p-5 mb-6 text-white text-center">
        <p className="text-purple-200 text-xs mb-1">الدرجة النهائية الموزونة</p>
        <p className="text-4xl font-bold">{totalScore.toFixed(1)}%</p>
      </div>

      {/* Feedback Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-elm-navy mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-500" />
          الملاحظات
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
              <ThumbsUp className="w-3 h-3 text-emerald-500" />
              نقاط القوة
            </label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 min-h-[80px] resize-y"
              placeholder="أبرز نقاط القوة في المشروع..."
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
              <ThumbsDown className="w-3 h-3 text-red-400" />
              نقاط الضعف / التحسين
            </label>
            <textarea
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 min-h-[80px] resize-y"
              placeholder="نقاط تحتاج تحسين..."
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-gray-400" />
              ملاحظات عامة
            </label>
            <textarea
              value={feedbackAr}
              onChange={(e) => setFeedbackAr(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 min-h-[80px] resize-y"
              placeholder="أي ملاحظات إضافية..."
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-500 text-white rounded-2xl text-sm font-bold hover:bg-brand-600 shadow-brand transition-colors disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        {isEdit ? "تحديث التقييم" : "إرسال التقييم"}
      </button>
    </div>
  );
}
