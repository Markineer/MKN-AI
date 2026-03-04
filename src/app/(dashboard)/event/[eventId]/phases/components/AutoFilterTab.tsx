"use client";

import { useState } from "react";
import { Check, X, Eye, Save, Loader2, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import type { Phase, AutoFilterRule, AutoFilterTeam } from "./types";
import { DEFAULT_RULES, autoFilterRuleLabels } from "./constants";

export default function AutoFilterTab({
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
    setRules((prev) => prev.map((r) => (r.type === type ? { ...r, enabled: !r.enabled } : r)));
  };

  const updateRuleValue = (type: string, field: "value" | "minCount", val: number) => {
    setRules((prev) => prev.map((r) => (r.type === type ? { ...r, [field]: val } : r)));
  };

  const handleSaveRules = async () => {
    setSavingRules(true);
    try {
      await fetch(`/api/events/${eventId}/phases/${phase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoFilterRules: { rules } }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to save rules:", err);
    } finally {
      setSavingRules(false);
    }
  };

  const handlePreview = async () => {
    setSavingRules(true);
    try {
      await fetch(`/api/events/${eventId}/phases/${phase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoFilterRules: { rules } }),
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
      const res = await fetch(`/api/events/${eventId}/phases/${phase.id}/auto-filter`, { method: "POST" });
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
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-elm-navy">قواعد التصفية التلقائية</p>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveRules} disabled={savingRules} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-100 transition-colors disabled:opacity-50">
              {savingRules ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              حفظ القواعد
            </button>
            <button onClick={handlePreview} disabled={previewLoading || savingRules} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50">
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
              <div key={rule.type} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${rule.enabled ? "bg-brand-50/50 border-brand-200" : "bg-gray-50 border-gray-100"}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleRule(rule.type)} className="flex-shrink-0">
                    {rule.enabled ? <ToggleRight className="w-6 h-6 text-brand-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                  </button>
                  <span className={`text-xs font-medium ${rule.enabled ? "text-elm-navy" : "text-gray-400"}`}>{autoFilterRuleLabels[rule.type]}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasValueInput && rule.enabled && (
                    <input type="number" min={1} value={rule.value || ""} onChange={(e) => updateRuleValue(rule.type, "value", Number(e.target.value))} className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-brand-200" placeholder="القيمة" />
                  )}
                  {hasMinCountInput && rule.enabled && (
                    <input type="number" min={1} value={rule.minCount || ""} onChange={(e) => updateRuleValue(rule.type, "minCount", Number(e.target.value))} className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-brand-200" placeholder="الحد الأدنى" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {previewData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-elm-navy">نتائج المعاينة</p>
            <button onClick={handleExecute} disabled={executingFilter} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
              {executingFilter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              تنفيذ التصفية التلقائية
            </button>
          </div>

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

          <div>
            <p className="text-xs font-bold text-emerald-700 mb-2">الفرق المؤهلة ({previewData.qualifying.length})</p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {previewData.qualifying.map((t) => (
                <div key={t.teamId} className="flex items-center justify-between bg-emerald-50/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                    {t.trackName && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: t.trackColor ? `${t.trackColor}20` : "#f3f4f6", color: t.trackColor || "#6b7280" }}>{t.trackName}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400">{t.memberCount} عضو</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-red-600 mb-2">الفرق المرفوضة ({previewData.rejected.length})</p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {previewData.rejected.map((t) => (
                <div key={t.teamId} className="flex items-center justify-between bg-red-50/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <X className="w-3 h-3 text-red-500" />
                    <span className="text-xs font-medium text-elm-navy">{t.teamName}</span>
                    {t.trackName && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: t.trackColor ? `${t.trackColor}20` : "#f3f4f6", color: t.trackColor || "#6b7280" }}>{t.trackName}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-red-400">{t.failedRules.map((r) => autoFilterRuleLabels[r] || r).join("، ")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
