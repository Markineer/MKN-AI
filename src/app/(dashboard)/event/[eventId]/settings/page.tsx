"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import {
  Save,
  Loader2,
  ArrowRight,
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Cpu,
  Eye,
  Trash2,
} from "lucide-react";

const eventTypes = [
  { value: "HACKATHON", label: "هاكاثون" },
  { value: "CHALLENGE", label: "تحدي" },
  { value: "COMPETITION", label: "مسابقة" },
  { value: "WORKSHOP", label: "ورشة عمل" },
  { value: "ASSESSMENT", label: "تقييم مستوى" },
];

const categories = [
  { value: "PROGRAMMING", label: "برمجة" },
  { value: "LEGAL", label: "قانوني" },
  { value: "BUSINESS", label: "أعمال" },
  { value: "AI_ML", label: "ذكاء اصطناعي" },
  { value: "DESIGN", label: "تصميم" },
  { value: "HEALTH", label: "صحة" },
  { value: "EDUCATION", label: "تعليم" },
  { value: "SUSTAINABILITY", label: "استدامة" },
  { value: "GENERAL", label: "عام" },
];

const statuses = [
  { value: "DRAFT", label: "مسودة" },
  { value: "PUBLISHED", label: "منشور" },
  { value: "REGISTRATION_OPEN", label: "التسجيل مفتوح" },
  { value: "IN_PROGRESS", label: "جاري" },
  { value: "EVALUATION", label: "تقييم" },
  { value: "COMPLETED", label: "مكتمل" },
  { value: "ARCHIVED", label: "مؤرشف" },
];

const regModes = [
  { value: "INDIVIDUAL", label: "فردي" },
  { value: "TEAM", label: "فرق" },
  { value: "BOTH", label: "فردي وفرق" },
];

function toDateInput(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function EventSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form fields
  const [titleAr, setTitleAr] = useState("");
  const [title, setTitle] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [locationAr, setLocationAr] = useState("");
  const [location, setLocation] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [registrationMode, setRegistrationMode] = useState("");
  const [minTeamSize, setMinTeamSize] = useState<number | "">(3);
  const [maxTeamSize, setMaxTeamSize] = useState<number | "">(5);
  const [hasPhases, setHasPhases] = useState(false);
  const [hasElimination, setHasElimination] = useState(false);
  const [totalPhases, setTotalPhases] = useState<number>(1);
  const [aiEvaluationEnabled, setAiEvaluationEnabled] = useState(false);
  const [rulesAr, setRulesAr] = useState("");

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          setErrorMsg("فشل في تحميل بيانات الفعالية");
          return;
        }
        const ev = await res.json();
        setTitleAr(ev.titleAr || "");
        setTitle(ev.title || "");
        setDescriptionAr(ev.descriptionAr || "");
        setDescription(ev.description || "");
        setType(ev.type || "");
        setCategory(ev.category || "");
        setStatus(ev.status || "");
        setStartDate(toDateInput(ev.startDate));
        setEndDate(toDateInput(ev.endDate));
        setRegistrationStart(toDateInput(ev.registrationStart));
        setRegistrationEnd(toDateInput(ev.registrationEnd));
        setLocationAr(ev.locationAr || "");
        setLocation(ev.location || "");
        setIsOnline(ev.isOnline || false);
        setMaxParticipants(ev.maxParticipants || "");
        setRegistrationMode(ev.registrationMode || "INDIVIDUAL");
        setMinTeamSize(ev.minTeamSize || 3);
        setMaxTeamSize(ev.maxTeamSize || 5);
        setHasPhases(ev.hasPhases || false);
        setHasElimination(ev.hasElimination || false);
        setTotalPhases(ev.totalPhases || 1);
        setAiEvaluationEnabled(ev.aiEvaluationEnabled || false);
        setRulesAr(ev.rulesAr || "");
      } catch {
        setErrorMsg("خطأ في الاتصال");
      } finally {
        setLoading(false);
      }
    }
    if (eventId) fetchEvent();
  }, [eventId]);

  async function handleSave() {
    setErrorMsg("");
    setSuccessMsg("");
    if (!titleAr.trim()) {
      setErrorMsg("يرجى إدخال اسم الفعالية بالعربي");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || titleAr,
          titleAr,
          description: description || undefined,
          descriptionAr: descriptionAr || undefined,
          type,
          category,
          status,
          startDate,
          endDate,
          registrationStart: registrationStart || null,
          registrationEnd: registrationEnd || null,
          location: location || null,
          locationAr: locationAr || null,
          isOnline,
          maxParticipants: maxParticipants ? Number(maxParticipants) : null,
          registrationMode,
          minTeamSize: (registrationMode === "TEAM" || registrationMode === "BOTH") ? Number(minTeamSize) || 3 : null,
          maxTeamSize: (registrationMode === "TEAM" || registrationMode === "BOTH") ? Number(maxTeamSize) || 5 : null,
          hasPhases,
          hasElimination: hasPhases ? hasElimination : false,
          totalPhases: hasPhases ? totalPhases : 1,
          aiEvaluationEnabled,
          rulesAr: rulesAr || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل في حفظ التعديلات");
      }
      setSuccessMsg("تم حفظ التعديلات بنجاح");
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Event Settings" titleAr="إعدادات الفعالية" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <span className="mr-2 text-sm text-gray-500">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  const showTeamFields = registrationMode === "TEAM" || registrationMode === "BOTH";

  return (
    <div>
      <TopBar title="Event Settings" titleAr="إعدادات الفعالية" />
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => router.push(`/organization/events/${eventId}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لتفاصيل الفعالية
        </button>

        {/* Messages */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="mr-auto text-red-400 hover:text-red-600 font-bold">&times;</button>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
            <Save className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-lg font-bold text-elm-navy">المعلومات الأساسية</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">اسم الفعالية (عربي) *</label>
              <input type="text" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">اسم الفعالية (إنجليزي)</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">الوصف (عربي)</label>
              <textarea rows={3} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">الوصف (إنجليزي)</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">النوع</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200">
                {eventTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">التصنيف</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200">
                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">الحالة</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200">
                {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">الحد الأقصى للمشاركين</label>
              <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : "")} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-bold text-elm-navy">التواريخ</h3>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">تاريخ البداية *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">تاريخ النهاية *</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">بداية التسجيل</label>
              <input type="date" value={registrationStart} onChange={(e) => setRegistrationStart(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">نهاية التسجيل</label>
              <input type="date" value={registrationEnd} onChange={(e) => setRegistrationEnd(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-bold text-elm-navy">الموقع</h3>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
              <span className="text-sm text-gray-600">فعالية عن بعد (أونلاين)</span>
            </label>
          </div>
          {!isOnline && (
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">الموقع (عربي)</label>
                <input type="text" value={locationAr} onChange={(e) => setLocationAr(e.target.value)} placeholder="مثال: الرياض، فندق الفيصلية" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">Location (English)</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Riyadh" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
              </div>
            </div>
          )}
        </div>

        {/* Registration */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-bold text-elm-navy">التسجيل والفرق</h3>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">نوع التسجيل</label>
              <select value={registrationMode} onChange={(e) => setRegistrationMode(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200">
                {regModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          {showTeamFields && (
            <div className="grid grid-cols-2 gap-5 p-4 bg-brand-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1">الحد الأدنى لحجم الفريق</label>
                <input type="number" value={minTeamSize} onChange={(e) => setMinTeamSize(e.target.value ? Number(e.target.value) : "")} min={2} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1">الحد الأقصى لحجم الفريق</label>
                <input type="number" value={maxTeamSize} onChange={(e) => setMaxTeamSize(e.target.value ? Number(e.target.value) : "")} min={2} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm" />
              </div>
            </div>
          )}
        </div>

        {/* Phases */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-elm-navy">المراحل</h3>
            <button
              onClick={() => setHasPhases(!hasPhases)}
              className={`w-12 h-7 rounded-full transition-colors relative ${hasPhases ? "bg-brand-500" : "bg-gray-200"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-all ${hasPhases ? "left-1" : "right-1"}`} />
            </button>
          </div>
          {hasPhases && (
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">عدد المراحل</label>
                <input type="number" value={totalPhases} onChange={(e) => setTotalPhases(Number(e.target.value))} min={2} max={10} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasElimination} onChange={(e) => setHasElimination(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-500" />
                  <span className="text-sm text-gray-600">تفعيل التصفيات بين المراحل</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* AI */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-bold text-elm-navy">الذكاء الاصطناعي</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h4 className="text-sm font-bold text-elm-navy">التقييم الذكي للإجابات</h4>
              <p className="text-xs text-gray-500">يقيّم الذكاء الاصطناعي إجابات المشاركين</p>
            </div>
            <button
              onClick={() => setAiEvaluationEnabled(!aiEvaluationEnabled)}
              className={`w-12 h-7 rounded-full transition-colors relative ${aiEvaluationEnabled ? "bg-brand-500" : "bg-gray-200"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-all ${aiEvaluationEnabled ? "left-1" : "right-1"}`} />
            </button>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-lg font-bold text-elm-navy">القوانين والشروط</h3>
          <textarea
            rows={5}
            value={rulesAr}
            onChange={(e) => setRulesAr(e.target.value)}
            placeholder="أدخل القوانين والشروط الخاصة بالفعالية..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => router.push(`/organization/events/${eventId}`)}
            className="px-5 py-3 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
}
