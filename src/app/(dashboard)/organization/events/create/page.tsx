"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TopBar from "@/components/layout/TopBar";
import {
  Trophy,
  BookOpen,
  Calendar,
  GraduationCap,
  Users,
  User,
  UsersRound,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Upload,
  Sparkles,
  FileText,
  Layers,
  Filter,
  Check,
  Save,
  Eye,
  Loader2,
  AlertCircle,
  MapPin,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

const eventTypes = [
  { value: "HACKATHON", label: "هاكاثون", icon: Trophy, color: "#7C3AED", desc: "مسابقة بناء مشاريع وحلول مبتكرة" },
  { value: "CHALLENGE", label: "تحدي", icon: BookOpen, color: "#14B8A6", desc: "أسئلة وتحديات تعليمية أو مهنية" },
  { value: "COMPETITION", label: "مسابقة", icon: Calendar, color: "#F59E0B", desc: "مسابقة عامة مع تقييم" },
  { value: "WORKSHOP", label: "ورشة عمل", icon: GraduationCap, color: "#059669", desc: "ورشة تدريبية تفاعلية" },
  { value: "ASSESSMENT", label: "تقييم مستوى", icon: FileText, color: "#D97706", desc: "اختبار وتحديد مستوى" },
];

const registrationModes = [
  { value: "INDIVIDUAL", label: "تسجيل فردي", icon: User, desc: "كل مشارك يسجل ويشارك بشكل فردي" },
  { value: "TEAM", label: "تسجيل كفرق", icon: UsersRound, desc: "المشاركون يسجلون ضمن فرق (مناسب للهاكاثونات)" },
  { value: "BOTH", label: "فردي وفرق", icon: Users, desc: "يُسمح بالتسجيل الفردي أو ضمن فرق" },
];

const questionSources = [
  { value: "MANUAL", label: "إنشاء يدوي", icon: FileText, desc: "أنشئ الأسئلة واحداً تلو الآخر" },
  { value: "FILE_UPLOAD", label: "رفع ملف أسئلة", icon: Upload, desc: "ارفع ملف جاهز بالأسئلة (Excel, CSV, PDF)" },
  { value: "AI_GENERATED", label: "إنشاء بالذكاء الاصطناعي", icon: Sparkles, desc: "دع الذكاء الاصطناعي ينشئ الأسئلة تلقائياً" },
  { value: "MIXED", label: "مختلط", icon: Layers, desc: "اجمع بين الطرق المختلفة" },
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

export default function CreateEventPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // --- Wizard step ---
  const [step, setStep] = useState<Step>(1);

  // --- Step 1: Event type ---
  const [eventType, setEventType] = useState("");

  // --- Step 2: Basic info ---
  const [titleAr, setTitleAr] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [category, setCategory] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [location, setLocation] = useState("");
  const [locationAr, setLocationAr] = useState("");

  // --- Step 3: Registration & phases ---
  const [regMode, setRegMode] = useState("");
  const [minTeamSize, setMinTeamSize] = useState<number>(3);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(5);
  const [hasPhases, setHasPhases] = useState(false);
  const [hasElimination, setHasElimination] = useState(false);
  const [totalPhases, setTotalPhases] = useState(3);

  // --- Step 4: Questions & AI ---
  const [questionSource, setQuestionSource] = useState("");
  const [aiEval, setAiEval] = useState(false);
  const [aiSolve, setAiSolve] = useState(false);

  // --- Step 4: Evaluation Criteria ---
  const [criteria, setCriteria] = useState<{ name: string; maxScore: number }[]>([]);

  // Auto-populate criteria when event type changes
  useEffect(() => {
    const defaults: Record<string, { name: string; maxScore: number }[]> = {
      HACKATHON: [
        { name: "الابتكار والإبداع", maxScore: 25 },
        { name: "جودة التنفيذ التقني", maxScore: 25 },
        { name: "تأثير الحل وقابليته للتطبيق", maxScore: 20 },
        { name: "العرض التقديمي", maxScore: 15 },
        { name: "العمل الجماعي", maxScore: 15 },
      ],
      CHALLENGE: [
        { name: "صحة الإجابة", maxScore: 40 },
        { name: "عمق التحليل", maxScore: 25 },
        { name: "جودة العرض", maxScore: 20 },
        { name: "الإبداع في الحل", maxScore: 15 },
      ],
      ASSESSMENT: [
        { name: "صحة الإجابة", maxScore: 40 },
        { name: "عمق التحليل", maxScore: 25 },
        { name: "جودة العرض", maxScore: 20 },
        { name: "الإبداع في الحل", maxScore: 15 },
      ],
      COMPETITION: [
        { name: "جودة المشروع", maxScore: 30 },
        { name: "الابتكار", maxScore: 25 },
        { name: "العرض التقديمي", maxScore: 25 },
        { name: "الأثر", maxScore: 20 },
      ],
      WORKSHOP: [
        { name: "المشاركة الفعالة", maxScore: 40 },
        { name: "جودة التطبيق", maxScore: 35 },
        { name: "الفهم", maxScore: 25 },
      ],
      TRAINING: [
        { name: "المشاركة الفعالة", maxScore: 40 },
        { name: "جودة التطبيق", maxScore: 35 },
        { name: "الفهم", maxScore: 25 },
      ],
    };
    if (eventType && defaults[eventType]) {
      setCriteria(defaults[eventType].map(c => ({ ...c })));
    }
  }, [eventType]);

  // --- Submission state ---
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- Organization ID (fetched from user profile) ---
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    if (!session?.user?.id) return;
    async function fetchOrg() {
      try {
        const res = await fetch(`/api/users/${session!.user.id}`);
        if (!res.ok) return;
        const user = await res.json();
        const orgMembership = user.organizationMembers?.[0];
        if (orgMembership?.organization?.id) {
          setOrganizationId(orgMembership.organization.id);
        }
      } catch {
        // silently ignore -- user may not have an org yet
      }
    }
    fetchOrg();
  }, [session?.user?.id]);

  const steps = [
    { num: 1, label: "نوع الفعالية" },
    { num: 2, label: "المعلومات الأساسية" },
    { num: 3, label: "التسجيل والمراحل" },
    { num: 4, label: "الأسئلة والتقييم" },
    { num: 5, label: "المراجعة والنشر" },
  ];

  const isHackathon = eventType === "HACKATHON";
  const isChallenge = ["CHALLENGE", "ASSESSMENT"].includes(eventType);

  // --- Generate slug from English title (or Arabic if no English) ---
  function generateSlugFromTitle(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // --- Submit handler ---
  async function handleSubmit(status: "PUBLISHED" | "DRAFT") {
    setErrorMsg("");

    // Validation
    if (!eventType) {
      setErrorMsg("يرجى اختيار نوع الفعالية");
      setStep(1);
      return;
    }
    if (!titleAr.trim()) {
      setErrorMsg("يرجى إدخال اسم الفعالية بالعربي");
      setStep(2);
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg("يرجى تحديد تاريخ البداية والنهاية");
      setStep(2);
      return;
    }

    setSubmitting(true);

    try {
      const slug = generateSlugFromTitle(title || titleAr) + "-" + Date.now().toString(36);

      const payload: Record<string, unknown> = {
        title: title || titleAr,
        titleAr,
        slug,
        description: description || undefined,
        descriptionAr: descriptionAr || undefined,
        type: eventType,
        category: category || "GENERAL",
        status,
        visibility: "PUBLIC",
        startDate,
        endDate,
        registrationStart: registrationStart || undefined,
        registrationEnd: registrationEnd || undefined,
        location: location || undefined,
        locationAr: locationAr || undefined,
        isOnline: false,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        registrationMode: regMode || "INDIVIDUAL",
        minTeamSize: (regMode === "TEAM" || regMode === "BOTH") ? minTeamSize : undefined,
        maxTeamSize: (regMode === "TEAM" || regMode === "BOTH") ? maxTeamSize : undefined,
        allowIndividual: regMode !== "TEAM",
        hasPhases,
        hasElimination: hasPhases ? hasElimination : false,
        totalPhases: hasPhases ? totalPhases : 1,
        aiEvaluationEnabled: aiEval,
        questionSource: questionSource || "MANUAL",
        criteria: criteria.filter(c => c.name.trim()),
      };

      if (organizationId) {
        payload.organizationId = organizationId;
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `فشل في حفظ الفعالية (${res.status})`);
      }

      router.push("/organization/events");
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء حفظ الفعالية");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <TopBar title="Create Event" titleAr="إنشاء فعالية جديدة" />
      <div className="p-8 max-w-5xl mx-auto">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg("")}
              className="mr-auto text-red-400 hover:text-red-600 font-bold text-lg leading-none"
            >
              &times;
            </button>
          </div>
        )}

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <button
                onClick={() => setStep(s.num as Step)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  step === s.num
                    ? "bg-brand-500 text-white shadow-md"
                    : step > s.num
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-50 text-gray-400"
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : <span>{s.num}</span>}
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <ChevronLeft className="w-4 h-4 text-gray-300 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Event Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-elm-navy">اختر نوع الفعالية</h2>
              <p className="text-gray-500 mt-1">حدد النوع المناسب لفعاليتك</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setEventType(t.value);
                    if (t.value === "HACKATHON") setRegMode("TEAM");
                  }}
                  className={`p-6 rounded-2xl border-2 text-right transition-all ${
                    eventType === t.value
                      ? "border-brand-500 bg-brand-50 shadow-md"
                      : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white mb-4"
                    style={{ backgroundColor: t.color }}
                  >
                    <t.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-elm-navy">{t.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-xl font-bold text-elm-navy">المعلومات الأساسية</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">اسم الفعالية (عربي) *</label>
                <input
                  type="text"
                  placeholder="مثال: هاكاثون الابتكار التقني"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">اسم الفعالية (إنجليزي)</label>
                <input
                  type="text"
                  placeholder="e.g. Tech Innovation Hackathon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">الوصف (عربي)</label>
                <textarea
                  rows={3}
                  placeholder="وصف مختصر عن الفعالية بالعربية..."
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">الوصف (إنجليزي)</label>
                <textarea
                  rows={3}
                  placeholder="Short description in English..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">التصنيف *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option value="">اختر التصنيف</option>
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">الحد الأقصى للمشاركين</label>
                <input
                  type="number"
                  placeholder="مثال: 150"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">تاريخ البداية *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">تاريخ النهاية *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">بداية التسجيل</label>
                <input
                  type="date"
                  value={registrationStart}
                  onChange={(e) => setRegistrationStart(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">نهاية التسجيل</label>
                <input
                  type="date"
                  value={registrationEnd}
                  onChange={(e) => setRegistrationEnd(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">الموقع (عربي)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="مثال: الرياض، فندق الفيصلية"
                    value={locationAr}
                    onChange={(e) => setLocationAr(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-elm-navy mb-1.5">Location (English)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Riyadh, Al Faisaliah Hotel"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Registration & Phases */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Registration Mode */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-elm-navy mb-2">نوع التسجيل</h2>
              <p className="text-sm text-gray-500 mb-6">حدد كيف يسجل المشاركون في الفعالية</p>
              <div className="grid grid-cols-3 gap-4">
                {registrationModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setRegMode(mode.value)}
                    className={`p-5 rounded-2xl border-2 text-right transition-all ${
                      regMode === mode.value
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <mode.icon className={`w-8 h-8 mb-3 ${regMode === mode.value ? "text-brand-500" : "text-gray-400"}`} />
                    <h3 className="text-sm font-bold text-elm-navy">{mode.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{mode.desc}</p>
                  </button>
                ))}
              </div>
              {(regMode === "TEAM" || regMode === "BOTH") && (
                <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-brand-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-elm-navy mb-1">الحد الأدنى لحجم الفريق</label>
                    <input
                      type="number"
                      value={minTeamSize}
                      onChange={(e) => setMinTeamSize(Number(e.target.value))}
                      min={2}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-elm-navy mb-1">الحد الأقصى لحجم الفريق</label>
                    <input
                      type="number"
                      value={maxTeamSize}
                      onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                      min={2}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Phases */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-elm-navy">المراحل</h2>
                  <p className="text-sm text-gray-500 mt-1">هل الفعالية تتضمن عدة مراحل متتالية؟</p>
                </div>
                <button
                  onClick={() => setHasPhases(!hasPhases)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${hasPhases ? "bg-brand-500" : "bg-gray-200"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-all ${hasPhases ? "left-1" : "right-1"}`} />
                </button>
              </div>

              {hasPhases && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-elm-navy mb-1">عدد المراحل</label>
                      <input
                        type="number"
                        value={totalPhases}
                        onChange={(e) => setTotalPhases(Number(e.target.value))}
                        min={2}
                        max={10}
                        className="w-24 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center"
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-amber-50 px-4 py-3 rounded-xl">
                      <Filter className="w-5 h-5 text-amber-600" />
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasElimination}
                            onChange={(e) => setHasElimination(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-500"
                          />
                          <span className="text-sm font-medium text-amber-800">تفعيل التصفيات</span>
                        </label>
                        <p className="text-xs text-amber-600 mt-0.5">قبول ورفض المشاركين بين المراحل</p>
                      </div>
                    </div>
                  </div>

                  {/* Phase Preview */}
                  <div className="flex gap-3 overflow-x-auto pb-2 mt-4">
                    {Array.from({ length: totalPhases }, (_, i) => (
                      <div key={i} className="flex items-center">
                        <div className="min-w-[180px] bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${i === totalPhases - 1 ? "bg-emerald-500" : "bg-brand-500"}`}>
                              {i + 1}
                            </div>
                            <span className="text-xs font-bold text-elm-navy">المرحلة {i + 1}</span>
                          </div>
                          <input
                            type="text"
                            placeholder={i === 0 ? "التسجيل" : i === totalPhases - 1 ? "النهائيات" : `المرحلة ${i + 1}`}
                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                          {hasElimination && i < totalPhases - 1 && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                              <Filter className="w-3 h-3" />
                              تصفية
                            </div>
                          )}
                        </div>
                        {i < totalPhases - 1 && (
                          <ChevronLeft className="w-4 h-4 text-gray-300 mx-1 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Questions & Evaluation */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Question Source (for challenges/assessments) */}
            {(isChallenge || eventType === "COMPETITION") && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-elm-navy mb-2">مصدر الأسئلة</h2>
                <p className="text-sm text-gray-500 mb-6">كيف تريد إضافة الأسئلة للفعالية؟</p>
                <div className="grid grid-cols-2 gap-4">
                  {questionSources.map((src) => (
                    <button
                      key={src.value}
                      onClick={() => setQuestionSource(src.value)}
                      className={`p-5 rounded-2xl border-2 text-right transition-all ${
                        questionSource === src.value
                          ? "border-brand-500 bg-brand-50"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200"
                      }`}
                    >
                      <src.icon className={`w-7 h-7 mb-3 ${questionSource === src.value ? "text-brand-500" : "text-gray-400"}`} />
                      <h3 className="text-sm font-bold text-elm-navy">{src.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{src.desc}</p>
                    </button>
                  ))}
                </div>

                {questionSource === "FILE_UPLOAD" && (
                  <div className="mt-6 p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-elm-navy">ارفع ملف الأسئلة</h4>
                    <p className="text-xs text-gray-500 mt-1">Excel, CSV, PDF, DOCX - بحد أقصى 50MB</p>
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-500" />
                        <span className="text-xs text-gray-600">الملف يحتوي على الحلول</span>
                      </label>
                    </div>
                    <button className="mt-4 px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium">
                      اختر ملف
                    </button>
                  </div>
                )}

                {questionSource === "AI_GENERATED" && (
                  <div className="mt-6 p-6 bg-brand-50 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-brand-500" />
                      <h4 className="text-sm font-bold text-elm-navy">إعدادات توليد الأسئلة بالذكاء الاصطناعي</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-elm-navy mb-1">عدد الأسئلة</label>
                        <input type="number" defaultValue={20} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-elm-navy mb-1">مستوى الصعوبة</label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm" defaultValue="MEDIUM">
                          <option value="EASY">سهل</option>
                          <option value="MEDIUM">متوسط</option>
                          <option value="HARD">صعب</option>
                          <option value="MIXED">مختلط</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-elm-navy mb-1">وصف المحتوى المطلوب</label>
                        <textarea rows={2} placeholder="مثال: أسئلة عن القانون التجاري السعودي للمبتدئين..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-elm-navy mb-1">نموذج AI</label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm">
                          <option value="nuha">نُهى (عربي)</option>
                          <option value="llama3">Llama 3</option>
                          <option value="falcon">Falcon</option>
                          <option value="mistral">Mistral</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-elm-navy mb-1">أنواع الأسئلة</label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm">
                          <option value="MIXED">مختلط</option>
                          <option value="MCQ">اختيار متعدد</option>
                          <option value="ESSAY">مقالية</option>
                          <option value="TF">صح وخطأ</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-brand-600">* سيتم توليد الأسئلة كمسودة يمكنك تعديلها قبل النشر</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Settings */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Cpu className="w-6 h-6 text-brand-500" />
                <div>
                  <h2 className="text-xl font-bold text-elm-navy">إعدادات الذكاء الاصطناعي</h2>
                  <p className="text-sm text-gray-500">تفعيل التقييم والحل بالذكاء الاصطناعي</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-elm-navy">التقييم الذكي للإجابات</h4>
                    <p className="text-xs text-gray-500">يقيّم الذكاء الاصطناعي إجابات المشاركين ويمنح درجات</p>
                  </div>
                  <button
                    onClick={() => setAiEval(!aiEval)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${aiEval ? "bg-brand-500" : "bg-gray-200"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-all ${aiEval ? "left-1" : "right-1"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-elm-navy">حل الأسئلة بالذكاء الاصطناعي</h4>
                    <p className="text-xs text-gray-500">إنشاء نموذج إجابة ذكي للأسئلة المرفوعة</p>
                  </div>
                  <button
                    onClick={() => setAiSolve(!aiSolve)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${aiSolve ? "bg-brand-500" : "bg-gray-200"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-all ${aiSolve ? "left-1" : "right-1"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Evaluation Criteria */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-elm-navy">بنود التحكيم والتقييم</h2>
                  <p className="text-sm text-gray-500">حدد البنود ودرجاتها {isHackathon ? "للهاكاثون" : "للتقييم"}</p>
                </div>
                <span className="text-xs text-gray-400">{criteria.length} بنود</span>
              </div>
              <div className="space-y-3">
                {criteria.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-fade-in-up">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-500 text-sm font-bold">
                      {idx + 1}
                    </div>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => {
                        const updated = [...criteria];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setCriteria(updated);
                      }}
                      placeholder="اسم البند"
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={c.maxScore}
                        onChange={(e) => {
                          const updated = [...criteria];
                          updated[idx] = { ...updated[idx], maxScore: Math.max(0, Number(e.target.value) || 0) };
                          setCriteria(updated);
                        }}
                        min={0}
                        className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                      <span className="text-xs text-gray-500">نقطة</span>
                    </div>
                    <button
                      onClick={() => setCriteria(prev => prev.filter((_, i) => i !== idx))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setCriteria(prev => [...prev, { name: "", maxScore: 10 }])}
                  className="w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-brand-300 hover:text-brand-500 transition-colors"
                >
                  + إضافة بند تقييم جديد
                </button>
                <div className="flex justify-end">
                  <div className={`px-4 py-2 rounded-xl text-sm ${criteria.reduce((sum, c) => sum + c.maxScore, 0) === 100 ? "bg-elm-navy text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    المجموع: <span className="font-bold">{criteria.reduce((sum, c) => sum + c.maxScore, 0)}</span> نقطة
                    {criteria.reduce((sum, c) => sum + c.maxScore, 0) !== 100 && <span className="text-xs mr-2">(يُفضل 100)</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-xl font-bold text-elm-navy">مراجعة ونشر</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">نوع الفعالية</p>
                <p className="text-sm font-bold text-elm-navy">{eventTypes.find(t => t.value === eventType)?.label || "---"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">الاسم (عربي)</p>
                <p className="text-sm font-bold text-elm-navy">{titleAr || "---"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">الاسم (إنجليزي)</p>
                <p className="text-sm font-bold text-elm-navy">{title || "---"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">التصنيف</p>
                <p className="text-sm font-bold text-elm-navy">{categories.find(c => c.value === category)?.label || "---"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">نوع التسجيل</p>
                <p className="text-sm font-bold text-elm-navy">{registrationModes.find(m => m.value === regMode)?.label || "---"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">المراحل</p>
                <p className="text-sm font-bold text-elm-navy">{hasPhases ? `${totalPhases} مراحل ${hasElimination ? "(مع تصفيات)" : ""}` : "بدون مراحل"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">تاريخ البداية</p>
                <p className="text-sm font-bold text-elm-navy">{startDate || "---"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">تاريخ النهاية</p>
                <p className="text-sm font-bold text-elm-navy">{endDate || "---"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">الموقع</p>
                <p className="text-sm font-bold text-elm-navy">{locationAr || location || "---"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">الذكاء الاصطناعي</p>
                <p className="text-sm font-bold text-elm-navy">{aiEval ? "تقييم ذكي" : "---"} {aiSolve ? "+ حل ذكي" : ""}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">بنود التقييم</p>
                <p className="text-sm font-bold text-elm-navy">{criteria.filter(c => c.name.trim()).length} بنود ({criteria.reduce((s, c) => s + c.maxScore, 0)} نقطة)</p>
              </div>
              {maxParticipants && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">الحد الأقصى للمشاركين</p>
                  <p className="text-sm font-bold text-elm-navy">{maxParticipants}</p>
                </div>
              )}
              {(regMode === "TEAM" || regMode === "BOTH") && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">حجم الفريق</p>
                  <p className="text-sm font-bold text-elm-navy">{minTeamSize} - {maxTeamSize} اعضاء</p>
                </div>
              )}
            </div>
            <div className="flex gap-4 justify-end pt-4">
              <button
                onClick={() => handleSubmit("DRAFT")}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ كمسودة
              </button>
              <button
                onClick={() => handleSubmit("PUBLISHED")}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                نشر الفعالية
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setStep(Math.max(1, step - 1) as Step)}
            disabled={step === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors ${step === 1 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </button>
          {step < 5 && (
            <button
              onClick={() => setStep(Math.min(5, step + 1) as Step)}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 shadow-sm"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
