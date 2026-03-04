"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Clock,
  Save,
  Loader2,
  ExternalLink,
  FileText,
  Link2,
  Play,
  Layers,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Phase, DeliverableFieldConfig, DeliverableConfig, Deliverable } from "./types";
import { DEFAULT_DELIVERABLE_FIELDS, deliverableTypeLabels, PHASE_PRESETS } from "./constants";

export default function DeliverablesTab({
  phase,
  eventId,
  onRefresh,
}: {
  phase: Phase;
  eventId: string;
  onRefresh: () => void;
}) {
  // ── Config State ──
  const [showConfig, setShowConfig] = useState(false);
  const [fields, setFields] = useState<DeliverableFieldConfig[]>(() => {
    const existing = phase.deliverableConfig?.fields || [];
    return DEFAULT_DELIVERABLE_FIELDS.map((def) => {
      const found = existing.find((f) => f.type === def.type);
      return found ? { ...def, ...found } : { ...def };
    });
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Deliverables State ──
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

  // ── Config Handlers ──
  const toggleField = (type: string) => {
    setFields((prev) => prev.map((f) => (f.type === type ? { ...f, enabled: !f.enabled } : f)));
    setSaved(false);
  };

  const toggleRequired = (type: string) => {
    setFields((prev) => prev.map((f) => (f.type === type ? { ...f, required: !f.required } : f)));
    setSaved(false);
  };

  const updateField = (type: string, key: string, value: any) => {
    setFields((prev) => prev.map((f) => (f.type === type ? { ...f, [key]: value } : f)));
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

  const handleSaveConfig = async () => {
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
      {/* Collapsible Config Section */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2Icon className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-elm-navy">إعدادات التسليمات</span>
            <span className="text-[10px] text-gray-400">({enabledCount} مفعّل، {requiredCount} مطلوب)</span>
          </div>
          {showConfig ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showConfig && (
          <div className="p-4 border-t border-gray-100 space-y-4">
            {/* Save + Presets */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">قوالب سريعة:</span>
                <button onClick={() => applyPreset("idea_review")} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors font-medium">
                  مراجعة أفكار
                </button>
                <button onClick={() => applyPreset("development")} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors font-medium">
                  تطوير
                </button>
                <button onClick={() => applyPreset("finals")} className="px-3 py-1.5 text-[11px] rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors font-medium">
                  نهائيات
                </button>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saved ? "تم الحفظ" : "حفظ الإعدادات"}
              </button>
            </div>

            {/* Fields */}
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
                        {field.enabled ? <ToggleRight className="w-7 h-7 text-brand-500" /> : <ToggleLeft className="w-7 h-7" />}
                      </button>
                      <p className={`text-sm font-bold ${field.enabled ? "text-elm-navy" : "text-gray-400"}`}>
                        {deliverableTypeLabels[field.type]}
                      </p>
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

                  {field.enabled && (
                    <div className="mt-3 mr-10 space-y-2">
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
        )}
      </div>

      {/* Deliverables List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : (
        <>
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
          {config && config.fields.some((f) => f.enabled) && (
            <div className="bg-brand-50/50 rounded-xl p-3 border border-brand-100">
              <p className="text-[11px] font-bold text-brand-700 mb-2">التسليمات المطلوبة لهذه المرحلة:</p>
              <div className="flex flex-wrap gap-2">
                {config.fields
                  .filter((f) => f.enabled)
                  .map((f) => (
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
                      <td className="text-center px-4 py-3 text-xs text-gray-500">{d.memberCount}</td>
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
                            <a href={d.repositoryUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors" title="المستودع">
                              <Link2 className="w-3 h-3" />
                            </a>
                          )}
                          {d.presentationUrl && (
                            <a href={d.presentationUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors" title="العرض">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {d.demoUrl && (
                            <a href={d.demoUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-md bg-purple-50 hover:bg-purple-100 text-purple-500 transition-colors" title="العرض التجريبي">
                              <Play className="w-3 h-3" />
                            </a>
                          )}
                          {d.miroBoard && (
                            <a href={d.miroBoard} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-md bg-amber-50 hover:bg-amber-100 text-amber-500 transition-colors" title="Miro">
                              <Layers className="w-3 h-3" />
                            </a>
                          )}
                          {d.oneDriveUrl && (
                            <a href={d.oneDriveUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-500 transition-colors" title="OneDrive">
                              <FileText className="w-3 h-3" />
                            </a>
                          )}
                          {d.submissionFileUrl && (
                            <a href={d.submissionFileUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-md bg-green-50 hover:bg-green-100 text-green-500 transition-colors" title="ملف التسليم">
                              <FileText className="w-3 h-3" />
                            </a>
                          )}
                          {!d.hasDeliverable && <span className="text-gray-300 text-[10px]">&mdash;</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// Small settings icon for the collapsible header
function Settings2Icon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
    </svg>
  );
}
