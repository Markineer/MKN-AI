"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  GripVertical,
  Settings,
  Copy,
  ChevronDown,
  ChevronUp,
  Star,
  Layers,
  CheckCircle,
  Download,
  Upload,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
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

const defaultTemplates = [
  { name: "هاكاثون تقني", criteria: ["الابتكار", "جودة الكود", "تجربة المستخدم", "العرض التقديمي", "العمل الجماعي"] },
  { name: "تحدي قانوني", criteria: ["صحة التحليل", "جودة الحجج", "المراجع القانونية", "الأسلوب", "الإبداع"] },
  { name: "مسابقة أعمال", criteria: ["نموذج العمل", "تحليل السوق", "الجدوى المالية", "العرض التقديمي", "الأثر"] },
  { name: "تقييم مهارات", criteria: ["الدقة", "السرعة", "الفهم", "التطبيق", "التحليل"] },
];

// ─── Components ──────────────────────────────────────────────

function CriterionCard({
  criterion,
  onEdit,
  onDelete,
}: {
  criterion: Criterion;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
      <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-elm-navy">{criterion.nameAr}</p>
          <span className="text-[10px] text-gray-400 font-mono">{criterion.name}</span>
        </div>
        {criterion.descriptionAr && (
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{criterion.descriptionAr}</p>
        )}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-center">
          <p className="text-xs font-bold text-elm-navy">{criterion.maxScore}</p>
          <p className="text-[9px] text-gray-400">الدرجة</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-brand-600">&times;{criterion.weight}</p>
          <p className="text-[9px] text-gray-400">الوزن</p>
        </div>
        <div className="text-center bg-brand-50 px-2 py-1 rounded-lg">
          <p className="text-xs font-bold text-brand-700">{(criterion.maxScore * criterion.weight).toFixed(1)}</p>
          <p className="text-[9px] text-brand-500">الموزونة</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CriterionFormModal({
  eventId,
  criterion,
  onClose,
  onSaved,
}: {
  eventId: string;
  criterion?: Criterion | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nameAr, setNameAr] = useState(criterion?.nameAr || "");
  const [name, setName] = useState(criterion?.name || "");
  const [descriptionAr, setDescriptionAr] = useState(criterion?.descriptionAr || "");
  const [description, setDescription] = useState(criterion?.description || "");
  const [maxScore, setMaxScore] = useState(criterion?.maxScore || 10);
  const [weight, setWeight] = useState(criterion?.weight || 1.0);
  const [sortOrder, setSortOrder] = useState(criterion?.sortOrder || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!criterion;

  async function handleSubmit() {
    if (!nameAr.trim()) {
      setError("يرجى إدخال اسم المعيار بالعربي");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { name: name || nameAr, nameAr, description, descriptionAr, maxScore, weight, sortOrder };

      let res: Response;
      if (isEditing) {
        res = await fetch(`/api/events/${eventId}/criteria`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: criterion.id }),
        });
      } else {
        res = await fetch(`/api/events/${eventId}/criteria`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل في الحفظ");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-elm-navy">
            {isEditing ? "تعديل معيار التقييم" : "إضافة معيار تقييم جديد"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">اسم المعيار (عربي) *</label>
              <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" placeholder="مثال: الابتكار" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Criterion Name (English)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" placeholder="e.g. Innovation" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الوصف (عربي)</label>
              <textarea rows={2} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none" placeholder="وصف المعيار..." />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description (English)</label>
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none" placeholder="Criterion description..." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الدرجة القصوى</label>
              <input type="number" min={1} max={100} value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الوزن (الترجيح)</label>
              <input type="number" min={0.1} max={5} step={0.1} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الترتيب</label>
              <input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isEditing ? "حفظ التعديلات" : "إضافة المعيار"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function CriteriaPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [deleteMsg, setDeleteMsg] = useState("");

  async function fetchCriteria() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/criteria`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCriteria(data);
    } catch {
      setCriteria([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) fetchCriteria();
  }, [eventId]);

  async function handleDelete(criterion: Criterion) {
    if (!confirm(`هل تريد حذف معيار "${criterion.nameAr}"؟`)) return;
    try {
      const res = await fetch(`/api/events/${eventId}/criteria?id=${criterion.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setDeleteMsg("تم الحذف بنجاح");
      fetchCriteria();
      setTimeout(() => setDeleteMsg(""), 3000);
    } catch {
      setDeleteMsg("فشل في الحذف");
    }
  }

  function handleEdit(criterion: Criterion) {
    setEditingCriterion(criterion);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingCriterion(null);
    setShowForm(true);
  }

  const totalMaxScore = criteria.reduce((s, c) => s + c.maxScore, 0);
  const totalWeighted = criteria.reduce((s, c) => s + c.maxScore * c.weight, 0);

  if (loading) {
    return (
      <div>
        <TopBar title="Evaluation Criteria" titleAr="معايير التقييم" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <span className="mr-2 text-sm text-gray-500">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Evaluation Criteria" titleAr="معايير التقييم" />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">معايير التقييم</h2>
            <p className="text-sm text-gray-500 mt-1">
              {criteria.length} معيار تقييم
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة معيار
            </button>
          </div>
        </div>

        {/* Delete message */}
        {deleteMsg && (
          <div className={`px-4 py-2 rounded-xl text-sm ${deleteMsg.includes("نجاح") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {deleteMsg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Target className="w-6 h-6 text-brand-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-elm-navy">{criteria.length}</p>
            <p className="text-[11px] text-gray-500">إجمالي المعايير</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-700">{totalMaxScore}</p>
            <p className="text-[11px] text-gray-500">الدرجة القصوى</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Layers className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">{totalWeighted.toFixed(1)}</p>
            <p className="text-[11px] text-gray-500">الدرجات الموزونة</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-700">{criteria.length}</p>
            <p className="text-[11px] text-gray-500">معايير مفعّلة</p>
          </div>
        </div>

        {/* Default Templates */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold text-elm-navy">قوالب معايير جاهزة</h3>
            </div>
            <p className="text-[11px] text-gray-400">اختر قالباً لتطبيق معايير مقترحة</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {defaultTemplates.map((tmpl, idx) => (
              <button
                key={idx}
                className="bg-gray-50 hover:bg-brand-50 border border-gray-100 hover:border-brand-200 rounded-xl p-3 text-right transition-all group"
              >
                <p className="text-xs font-bold text-elm-navy group-hover:text-brand-600">{tmpl.name}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tmpl.criteria.map((c, i) => (
                    <span key={i} className="text-[9px] bg-white px-1.5 py-0.5 rounded text-gray-500">
                      {c}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Criteria List */}
        {criteria.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">لا توجد معايير تقييم بعد</p>
            <p className="text-sm text-gray-400 mt-1">أضف معايير التقييم لهذه الفعالية</p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة معيار
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-elm-navy">جميع المعايير</h3>
            </div>
            <div className="px-6 pb-4 pt-3 space-y-2">
              {criteria.map((criterion) => (
                <CriterionCard
                  key={criterion.id}
                  criterion={criterion}
                  onEdit={() => handleEdit(criterion)}
                  onDelete={() => handleDelete(criterion)}
                />
              ))}
              {/* Summary */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl mt-3">
                <span className="text-xs font-bold text-elm-navy">المجموع</span>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-bold text-elm-navy">{totalMaxScore}</p>
                    <p className="text-[9px] text-gray-400">الدرجة القصوى</p>
                  </div>
                  <div className="text-center bg-brand-50 px-3 py-1 rounded-lg">
                    <p className="text-sm font-bold text-brand-700">{totalWeighted.toFixed(1)}</p>
                    <p className="text-[9px] text-brand-500">الموزونة</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Criterion Modal */}
      {showForm && (
        <CriterionFormModal
          eventId={eventId}
          criterion={editingCriterion}
          onClose={() => { setShowForm(false); setEditingCriterion(null); }}
          onSaved={fetchCriteria}
        />
      )}
    </div>
  );
}
