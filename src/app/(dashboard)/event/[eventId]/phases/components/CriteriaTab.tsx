"use client";

import { useState } from "react";
import { Plus, Edit3, Trash2, Save, Loader2 } from "lucide-react";
import type { Phase, PhaseCriteria } from "./types";

export default function CriteriaTab({
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
