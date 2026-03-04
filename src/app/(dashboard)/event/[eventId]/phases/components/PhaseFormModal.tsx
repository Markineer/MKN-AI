"use client";

import { useState } from "react";
import { X, Save, Loader2, Trash2 } from "lucide-react";
import type { Phase, PhaseType, EvaluationMethod, AdvancementMode, QualificationMode } from "./types";
import { phaseTypeLabels, evaluationMethodLabels, advancementModeLabels, qualificationModeLabels } from "./constants";

export function PhaseFormModal({
  eventId,
  phase,
  onClose,
  onSaved,
}: {
  eventId: string;
  phase: Phase | null;
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
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
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
                <option key={key} value={key}>{label}</option>
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
                  <option key={key} value={key}>{label}</option>
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
                  <option key={key} value={key}>{label}</option>
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
                <p className="text-[11px] text-red-500">سيتم تصفية الفرق التي لا تستوفي الحد الأدنى</p>
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
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? "تحديث المرحلة" : "حفظ المرحلة"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteConfirmModal({
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
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
              إلغاء
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
