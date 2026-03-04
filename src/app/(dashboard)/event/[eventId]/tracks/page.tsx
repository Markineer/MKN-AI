"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import {
  Plus,
  Edit3,
  Trash2,
  Users,
  UserCheck,
  Loader2,
  RefreshCw,
  AlertTriangle,
  X,
  Save,
  Palette,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type TrackDomain =
  | "TECHNOLOGY"
  | "HEALTH"
  | "EDUCATION"
  | "TOURISM"
  | "ENTREPRENEURSHIP"
  | "SUSTAINABILITY"
  | "LEGAL"
  | "FINANCE"
  | "DESIGN"
  | "GENERAL";

const domainLabels: Record<TrackDomain, string> = {
  TECHNOLOGY: "تقنية",
  HEALTH: "صحة",
  EDUCATION: "تعليم",
  TOURISM: "سياحة",
  ENTREPRENEURSHIP: "ريادة أعمال",
  SUSTAINABILITY: "استدامة",
  LEGAL: "قانون",
  FINANCE: "مالية",
  DESIGN: "تصميم",
  GENERAL: "عام",
};

const TRACK_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
  "#84CC16", "#D946EF",
];

interface Track {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  color: string | null;
  domain: TrackDomain;
  maxTeams: number | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { teams: number; judges: number };
}

export default function TracksPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTracks = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/events/${eventId}/tracks`);
      if (!res.ok) throw new Error("فشل تحميل المسارات");
      const data = await res.json();
      setTracks(data.tracks || []);
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
      setError("فشل تحميل المسارات. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchTracks();
  }, [eventId, fetchTracks]);

  const handleDelete = async () => {
    if (!deletingTrack) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/events/${eventId}/tracks?trackId=${deletingTrack.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "فشل حذف المسار");
        return;
      }
      setDeletingTrack(null);
      fetchTracks();
    } catch (err) {
      console.error("Failed to delete track:", err);
      alert("فشل حذف المسار");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (track: Track) => {
    try {
      await fetch(`/api/events/${eventId}/tracks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id, isActive: !track.isActive }),
      });
      fetchTracks();
    } catch (err) {
      console.error("Failed to toggle track:", err);
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Tracks" titleAr="المسارات" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400">جاري تحميل المسارات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <TopBar title="Tracks" titleAr="المسارات" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => { setLoading(true); fetchTracks(); }}
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

  const totalTeams = tracks.reduce((s, t) => s + t._count.teams, 0);
  const totalJudges = tracks.reduce((s, t) => s + t._count.judges, 0);

  return (
    <div>
      <TopBar title="Tracks" titleAr="المسارات" />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">مسارات الفعالية</h2>
            <p className="text-sm text-gray-500 mt-1">
              {tracks.length} مسارات | {totalTeams} فريق | {totalJudges} محكم
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTracks}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditingTrack(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة مسار
            </button>
          </div>
        </div>

        {/* Tracks Grid */}
        {tracks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-400 mb-2">لا توجد مسارات بعد</p>
            <p className="text-[11px] text-gray-300 mb-4">أضف مسارات لتنظيم فرق الهاكاثون</p>
            <button
              onClick={() => { setEditingTrack(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة مسار
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  track.isActive
                    ? "border-gray-100 shadow-sm"
                    : "border-gray-200 opacity-60"
                }`}
              >
                {/* Color bar */}
                <div
                  className="h-1.5"
                  style={{ backgroundColor: track.color || "#E5E7EB" }}
                />
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: track.color || "#9CA3AF" }}
                      >
                        {track.nameAr.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-elm-navy">{track.nameAr}</h3>
                        {track.name !== track.nameAr && (
                          <p className="text-[10px] text-gray-400">{track.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(track)}
                        className="text-gray-400 hover:text-brand-500 transition-colors"
                        title={track.isActive ? "تعطيل" : "تفعيل"}
                      >
                        {track.isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>
                      <button
                        onClick={() => { setEditingTrack(track); setShowModal(true); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTrack(track)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {track.descriptionAr && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{track.descriptionAr}</p>
                  )}

                  {/* Domain badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: track.color ? `${track.color}15` : "#f3f4f6",
                        color: track.color || "#6b7280",
                      }}
                    >
                      {domainLabels[track.domain]}
                    </span>
                    {track.maxTeams && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        حد أقصى: {track.maxTeams} فريق
                      </span>
                    )}
                    {!track.isActive && (
                      <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-bold">
                        معطّل
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-bold text-elm-navy">{track._count.teams}</span>
                      <span>فريق</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="font-bold text-elm-navy">{track._count.judges}</span>
                      <span>محكم</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <TrackFormModal
          eventId={eventId}
          track={editingTrack}
          onClose={() => { setShowModal(false); setEditingTrack(null); }}
          onSaved={() => { setShowModal(false); setEditingTrack(null); fetchTracks(); }}
        />
      )}

      {/* Delete Confirm */}
      {deletingTrack && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-elm-navy">حذف المسار</h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  هل أنت متأكد من حذف مسار &quot;{deletingTrack.nameAr}&quot;؟
                </p>
                {deletingTrack._count.teams > 0 && (
                  <p className="text-[11px] text-red-500 mt-2 font-bold">
                    تحذير: يحتوي على {deletingTrack._count.teams} فريق
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeletingTrack(null)}
                  className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
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
      )}
    </div>
  );
}

// ── Track Form Modal ──
function TrackFormModal({
  eventId,
  track,
  onClose,
  onSaved,
}: {
  eventId: string;
  track: Track | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!track;

  const [form, setForm] = useState({
    nameAr: track?.nameAr || "",
    name: track?.name || "",
    descriptionAr: track?.descriptionAr || "",
    description: track?.description || "",
    color: track?.color || TRACK_COLORS[0],
    domain: (track?.domain || "GENERAL") as TrackDomain,
    maxTeams: track?.maxTeams?.toString() || "",
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.nameAr.trim()) {
      alert("اسم المسار بالعربي مطلوب");
      return;
    }

    setSaving(true);
    try {
      const body: any = {
        nameAr: form.nameAr,
        name: form.name || form.nameAr,
        descriptionAr: form.descriptionAr,
        description: form.description,
        color: form.color,
        domain: form.domain,
        maxTeams: form.maxTeams || null,
      };

      if (isEdit) {
        body.trackId = track!.id;
        const res = await fetch(`/api/events/${eventId}/tracks`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("فشل تحديث المسار");
      } else {
        const res = await fetch(`/api/events/${eventId}/tracks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("فشل إضافة المسار");
      }

      onSaved();
    } catch (err) {
      console.error("Failed to save track:", err);
      alert(isEdit ? "فشل تحديث المسار" : "فشل إضافة المسار");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-elm-navy">
            {isEdit ? "تعديل المسار" : "إضافة مسار جديد"}
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
              <label className="text-xs text-gray-500 mb-1 block">اسم المسار (عربي) *</label>
              <input
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="مثال: مسار التقنية"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Track Name (English)</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="e.g. Technology Track"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">وصف المسار (عربي)</label>
            <textarea
              value={form.descriptionAr}
              onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
              placeholder="وصف مختصر للمسار..."
            />
          </div>

          {/* Domain */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">المجال</label>
            <select
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value as TrackDomain })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {Object.entries(domainLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">لون المسار</label>
            <div className="flex flex-wrap gap-2">
              {TRACK_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    form.color === color
                      ? "ring-2 ring-offset-2 ring-brand-500 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Max Teams */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              الحد الأقصى للفرق (اختياري)
            </label>
            <input
              type="number"
              min={1}
              value={form.maxTeams}
              onChange={(e) => setForm({ ...form, maxTeams: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="بدون حد"
            />
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
            {isEdit ? "تحديث المسار" : "حفظ المسار"}
          </button>
        </div>
      </div>
    </div>
  );
}
