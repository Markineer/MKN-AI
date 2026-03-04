"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  X,
  CheckCircle,
  Clock,
  UserCheck,
  UserX,
  Eye,
  Loader2,
  Send,
  Image,
  Calendar,
  Mail,
  ArrowLeft,
} from "lucide-react";
import type { Phase, EliminationTeam } from "./types";

export default function ResultsTab({
  phase,
  eventId,
  onRefresh,
}: {
  phase: Phase;
  eventId: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [showEliminationPreview, setShowEliminationPreview] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ advanced: number; eliminated: number } | null>(null);
  const [eliminationPreview, setEliminationPreview] = useState<{
    advancing: EliminationTeam[];
    eliminated: EliminationTeam[];
    teams?: { teamId: string; teamName: string; trackId: string | null; avgScore: number; evaluationCount: number }[];
    stats: { total: number; advancing: number; eliminated: number };
    phase: any;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [selectedAdvancing, setSelectedAdvancing] = useState<Set<string>>(new Set());

  // Notification state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyForm, setNotifyForm] = useState({
    message: `يسعدنا إبلاغكم بأن فريقكم قد تم قبوله واجتاز هذه المرحلة بنجاح.\n\nنتطلع لرؤية إبداعاتكم في المرحلة القادمة. بالتوفيق!`,
    acceptanceDate: "",
    acceptanceTime: "",
    imageUrl: "",
    sendToEliminated: false,
  });
  const [sendingNotify, setSendingNotify] = useState(false);
  const [notifyResult, setNotifyResult] = useState<{ sent: number; failed: number; totalTeams: number } | null>(null);

  const handleSendNotifications = async () => {
    if (!notifyForm.message.trim()) {
      alert("الرجاء كتابة نص الرسالة");
      return;
    }
    if (!confirm("هل أنت متأكد من إرسال الإشعارات لجميع الفرق المتأهلة؟")) return;

    setSendingNotify(true);
    setNotifyResult(null);
    try {
      let acceptanceDate: string | null = null;
      if (notifyForm.acceptanceDate) {
        acceptanceDate = notifyForm.acceptanceDate;
        if (notifyForm.acceptanceTime) {
          acceptanceDate += ` الساعة ${notifyForm.acceptanceTime}`;
        }
      }

      const res = await fetch(`/api/events/${eventId}/phases/${phase.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: notifyForm.message,
          acceptanceDate,
          imageUrl: notifyForm.imageUrl || null,
          sendToEliminated: notifyForm.sendToEliminated,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "فشل إرسال الإشعارات");
        return;
      }

      setNotifyResult(data);
    } catch (err) {
      console.error("Failed to send notifications:", err);
      alert("فشل إرسال الإشعارات");
    } finally {
      setSendingNotify(false);
    }
  };

  const qualMode = phase.qualificationMode || "SCORE_BASED";

  const handlePreviewElimination = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/events/${eventId}/phases/${phase.id}/eliminate`);
      if (!res.ok) throw new Error("فشل تحميل المعاينة");
      const data = await res.json();
      setEliminationPreview(data);
      setShowEliminationPreview(true);
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
      setExecutionResult({ advanced: data.advanced, eliminated: data.eliminated });
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
      {/* ADVANCE_ALL Mode Banner */}
      {qualMode === "ADVANCE_ALL" && phase.status === "ACTIVE" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-800">تأهل الجميع</p>
              <p className="text-[11px] text-emerald-600">جميع الفرق ستتأهل تلقائياً للمرحلة التالية</p>
            </div>
          </div>
          <button
            onClick={handlePreviewElimination}
            disabled={loadingPreview}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loadingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
            تأهيل جميع الفرق
          </button>
        </div>
      )}

      {/* MANUAL Mode Banner */}
      {qualMode === "MANUAL" && phase.status === "ACTIVE" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-bold text-purple-800">تأهل يدوي</p>
              <p className="text-[11px] text-purple-600">اختر الفرق المتأهلة يدوياً بناءً على تقييمك</p>
            </div>
          </div>
          <button
            onClick={handlePreviewElimination}
            disabled={loadingPreview}
            className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loadingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            عرض الفرق للتأهيل
          </button>
        </div>
      )}

      {/* SCORE_BASED Mode Banner */}
      {qualMode === "SCORE_BASED" && phase.isElimination && phase.status === "ACTIVE" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-800">مرحلة تصفية نشطة</p>
              <p className="text-[11px] text-amber-600">
                سيتم تصفية الفرق بناءً على الدرجات. حد النجاح: {phase.passThreshold ?? "—"}% | الحد الأقصى للمتأهلين: {phase.maxAdvancing ?? "—"}
              </p>
            </div>
          </div>
          <button
            onClick={handlePreviewElimination}
            disabled={loadingPreview}
            className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loadingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            معاينة التصفية
          </button>
        </div>
      )}

      {/* Execution Result + Send Emails */}
      {executionResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">تم تنفيذ التأهيل بنجاح</p>
              <p className="text-xs text-emerald-600">
                {executionResult.advanced} فريق متأهل | {executionResult.eliminated} فريق مستبعد
              </p>
            </div>
            <button
              onClick={() => setExecutionResult(null)}
              className="mr-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-100"
            >
              <X className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-emerald-200">
            <p className="text-xs text-emerald-700">أرسل إشعارات للفرق الآن:</p>
            <button
              onClick={() => {
                setExecutionResult(null);
                setShowNotifyModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              إرسال من هنا
            </button>
            <button
              onClick={() => {
                setExecutionResult(null);
                router.push(`/event/${eventId}/communications`);
              }}
              className="px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-xl border border-emerald-300 hover:bg-emerald-50 transition-colors flex items-center gap-2"
            >
              <Mail className="w-3.5 h-3.5" />
              صفحة الرسائل
            </button>
          </div>
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
                <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">لا توجد نتائج بعد لهذه المرحلة</td>
              </tr>
            ) : (
              phase.results.map((r, idx) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-elm-navy">{r.teamName || r.nameAr || r.name || "—"}</p>
                  </td>
                  <td className="text-center px-4 py-3">
                    {r.totalScore !== null && r.totalScore !== undefined ? (
                      <span className="font-bold text-elm-navy">{typeof r.totalScore === "number" ? r.totalScore.toFixed(1) : r.totalScore}</span>
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
                  <td className="text-center px-4 py-3 text-[10px] text-gray-400 max-w-[200px] truncate">{r.feedback || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Send Notifications Section */}
      {(phase.advanced > 0 || phase.results.some((r) => r.status === "ADVANCED")) && (
        <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-brand-600" />
            <div>
              <p className="text-sm font-bold text-brand-800">إرسال إشعارات القبول</p>
              <p className="text-[11px] text-brand-600">
                أرسل رسائل بريد إلكتروني لجميع أعضاء الفرق المتأهلة
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifyModal(true)}
              className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              إرسال سريع
            </button>
            <button
              onClick={() => router.push(`/event/${eventId}/communications`)}
              className="px-4 py-2 bg-white text-brand-600 text-xs font-bold rounded-xl border border-brand-200 hover:bg-brand-50 transition-colors flex items-center gap-2"
            >
              <Mail className="w-3.5 h-3.5" />
              صفحة الرسائل
            </button>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-elm-navy">إرسال إشعارات القبول</h3>
              <button
                onClick={() => { setShowNotifyModal(false); setNotifyResult(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Success result */}
              {notifyResult && (
                <div className={`rounded-xl p-4 ${notifyResult.failed === 0 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {notifyResult.failed === 0 ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <p className="text-sm font-bold text-elm-navy">
                      تم الإرسال: {notifyResult.sent} رسالة | {notifyResult.totalTeams} فريق
                    </p>
                  </div>
                  {notifyResult.failed > 0 && (
                    <p className="text-[11px] text-amber-600">فشل إرسال {notifyResult.failed} رسالة</p>
                  )}
                </div>
              )}

              {/* Acceptance Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    تاريخ القبول
                  </label>
                  <input
                    type="date"
                    value={notifyForm.acceptanceDate}
                    onChange={(e) => setNotifyForm({ ...notifyForm, acceptanceDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    الساعة
                  </label>
                  <input
                    type="time"
                    value={notifyForm.acceptanceTime}
                    onChange={(e) => setNotifyForm({ ...notifyForm, acceptanceTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">نص الرسالة *</label>
                <textarea
                  value={notifyForm.message}
                  onChange={(e) => setNotifyForm({ ...notifyForm, message: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                  placeholder="اكتب نص الرسالة هنا..."
                  dir="rtl"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  رابط صورة (اختياري)
                </label>
                <input
                  type="url"
                  value={notifyForm.imageUrl}
                  onChange={(e) => setNotifyForm({ ...notifyForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="https://example.com/image.jpg"
                  dir="ltr"
                />
              </div>

              {/* Send to eliminated option */}
              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  checked={notifyForm.sendToEliminated}
                  onChange={(e) => setNotifyForm({ ...notifyForm, sendToEliminated: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-medium text-elm-navy">إرسال للفرق المستبعدة أيضاً</span>
                  <p className="text-[10px] text-gray-400">رسالة مختلفة تلقائياً للفرق غير المتأهلة</p>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => { setShowNotifyModal(false); setNotifyResult(null); }}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                إغلاق
              </button>
              <button
                onClick={handleSendNotifications}
                disabled={sendingNotify || !notifyForm.message.trim()}
                className="px-6 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {sendingNotify ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال الإشعارات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCE_ALL Preview Modal */}
      {showEliminationPreview && eliminationPreview && qualMode === "ADVANCE_ALL" && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-elm-navy">تأهيل جميع الفرق</h3>
              <button onClick={() => setShowEliminationPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-elm-navy mb-2">{eliminationPreview.stats.total} فريق سيتأهلون</p>
              <p className="text-sm text-gray-500">سيتم تأهيل جميع الفرق المسجلة للمرحلة التالية</p>
            </div>
            <div className="px-6 pb-4 max-h-[200px] overflow-y-auto space-y-1">
              {eliminationPreview.advancing.map((t, i) => (
                <div key={t.teamId} className="flex items-center justify-between bg-emerald-50/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 w-5 h-5 rounded-full flex items-center justify-center">{i + 1}</span>
                    <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                  </div>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowEliminationPreview(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">إلغاء</button>
              <button onClick={handleExecuteElimination} disabled={executing} className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                تأهيل الجميع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL Mode Modal */}
      {showEliminationPreview && eliminationPreview && qualMode === "MANUAL" && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-elm-navy">اختيار الفرق المتأهلة</h3>
              <button onClick={() => setShowEliminationPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
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
            <div className="flex items-center gap-2 px-6 pb-2">
              <button onClick={selectAllTeams} className="text-[11px] text-brand-600 hover:text-brand-700 font-medium">تحديد الكل</button>
              <span className="text-gray-300">|</span>
              <button onClick={deselectAllTeams} className="text-[11px] text-gray-500 hover:text-gray-700 font-medium">إلغاء تحديد الكل</button>
            </div>
            <div className="px-6 pb-4 max-h-[350px] overflow-y-auto space-y-1">
              {(eliminationPreview.teams || []).map((t: any) => {
                const isSelected = selectedAdvancing.has(t.teamId);
                return (
                  <div key={t.teamId} onClick={() => toggleTeamSelection(t.teamId)} className={`flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer border transition-colors ${isSelected ? "bg-emerald-50/50 border-emerald-200" : "bg-red-50/30 border-red-100"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-emerald-500 border-emerald-500" : "border-gray-300 bg-white"}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                        {t.evaluationCount > 0 && <span className="text-[10px] text-gray-400 mr-2">({t.evaluationCount} تقييم)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {t.avgScore > 0 && <span className="text-xs font-bold text-elm-navy">{t.avgScore.toFixed(1)}%</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {isSelected ? "متأهل" : "مستبعد"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-[11px] text-gray-500">{selectedAdvancing.size} فريق متأهل من أصل {eliminationPreview.teams?.length || 0}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowEliminationPreview(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">إلغاء</button>
                <button onClick={handleExecuteElimination} disabled={executing || selectedAdvancing.size === 0} className="px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                  {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  تنفيذ التأهيل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCORE_BASED Elimination Preview Modal */}
      {showEliminationPreview && eliminationPreview && qualMode === "SCORE_BASED" && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-elm-navy">معاينة نتائج التصفية</h3>
              <button onClick={() => setShowEliminationPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
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
            <div className="px-6 pb-2">
              <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> المتأهلون ({eliminationPreview.advancing.length})</p>
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {eliminationPreview.advancing.map((t, i) => (
                  <div key={t.teamId} className="flex items-center justify-between bg-emerald-50/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 w-5 h-5 rounded-full flex items-center justify-center">{t.rank || i + 1}</span>
                      <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">{t.avgScore.toFixed(1)}</span>
                  </div>
                ))}
                {eliminationPreview.advancing.length === 0 && <p className="text-center text-xs text-gray-400 py-3">لا يوجد فرق متأهلة</p>}
              </div>
            </div>
            <div className="px-6 pb-4">
              <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1"><UserX className="w-3.5 h-3.5" /> المستبعدون ({eliminationPreview.eliminated.length})</p>
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {eliminationPreview.eliminated.map((t) => (
                  <div key={t.teamId} className="flex items-center justify-between bg-red-50/50 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                    <span className="text-xs font-bold text-red-600">{t.avgScore.toFixed(1)}</span>
                  </div>
                ))}
                {eliminationPreview.eliminated.length === 0 && <p className="text-center text-xs text-gray-400 py-3">لا يوجد فرق مستبعدة</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowEliminationPreview(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">إلغاء</button>
              <button onClick={handleExecuteElimination} disabled={executing} className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                تنفيذ التصفية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
