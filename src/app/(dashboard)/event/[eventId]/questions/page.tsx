"use client";

import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import {
  FileText,
  Plus,
  Upload,
  Download,
  Cpu,
  Sparkles,
  Brain,
  Edit3,
  Trash2,
  Eye,
  Copy,
  Search,
  Filter,
  X,
  Check,
  Clock,
  FileUp,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Wand2,
  BookOpen,
  Code,
  Save,
  ChevronDown,
  ChevronUp,
  Target,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "CODE" | "FILE_UPLOAD" | "CASE_STUDY";
type QuestionSource = "MANUAL" | "FILE_UPLOAD" | "AI_GENERATED" | "MIXED";
type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT";

interface Question {
  id: string;
  type: QuestionType;
  contentAr: string;
  difficulty: Difficulty;
  points: number;
  source: QuestionSource;
  hasAnswer: boolean;
  aiGenerated: boolean;
}

// ─── Config ──────────────────────────────────────────────────
const questionTypeLabels: Record<QuestionType, { label: string; icon: any }> = {
  MULTIPLE_CHOICE: { label: "اختيار متعدد", icon: CheckCircle },
  TRUE_FALSE: { label: "صح أو خطأ", icon: ToggleLeft },
  SHORT_ANSWER: { label: "إجابة قصيرة", icon: Edit3 },
  ESSAY: { label: "مقالة", icon: FileText },
  CODE: { label: "برمجة", icon: Code },
  FILE_UPLOAD: { label: "رفع ملف", icon: FileUp },
  CASE_STUDY: { label: "دراسة حالة", icon: BookOpen },
};

const difficultyConfig: Record<Difficulty, { label: string; color: string }> = {
  EASY: { label: "سهل", color: "bg-emerald-50 text-emerald-700" },
  MEDIUM: { label: "متوسط", color: "bg-amber-50 text-amber-700" },
  HARD: { label: "صعب", color: "bg-orange-50 text-orange-700" },
  EXPERT: { label: "خبير", color: "bg-red-50 text-red-700" },
};

const sourceLabels: Record<QuestionSource, { label: string; color: string; icon: any }> = {
  MANUAL: { label: "يدوي", color: "bg-gray-100 text-gray-600", icon: Edit3 },
  FILE_UPLOAD: { label: "من ملف", color: "bg-blue-50 text-blue-600", icon: FileUp },
  AI_GENERATED: { label: "ذكاء اصطناعي", color: "bg-purple-50 text-purple-600", icon: Sparkles },
  MIXED: { label: "مختلط", color: "bg-cyan-50 text-cyan-600", icon: RefreshCw },
};

// ─── Mock Data ───────────────────────────────────────────────
const mockQuestions: Question[] = [
  { id: "q1", type: "MULTIPLE_CHOICE", contentAr: "ما هو الفرق بين REST و GraphQL في تصميم واجهات البرمجة؟", difficulty: "MEDIUM", points: 10, source: "MANUAL", hasAnswer: true, aiGenerated: false },
  { id: "q2", type: "CODE", contentAr: "اكتب دالة بلغة Python لحساب مجموع الأعداد الأولية حتى N", difficulty: "HARD", points: 20, source: "MANUAL", hasAnswer: true, aiGenerated: false },
  { id: "q3", type: "ESSAY", contentAr: "ناقش التحديات الأمنية في تطبيقات الذكاء الاصطناعي وكيف يمكن التغلب عليها", difficulty: "EXPERT", points: 25, source: "AI_GENERATED", hasAnswer: false, aiGenerated: true },
  { id: "q4", type: "TRUE_FALSE", contentAr: "يعتبر بروتوكول HTTPS آمناً تماماً ضد جميع أنواع الهجمات السيبرانية", difficulty: "EASY", points: 5, source: "FILE_UPLOAD", hasAnswer: true, aiGenerated: false },
  { id: "q5", type: "MULTIPLE_CHOICE", contentAr: "أي من التالي يعتبر من أنماط التصميم البنيوية (Structural Patterns)؟", difficulty: "MEDIUM", points: 10, source: "MANUAL", hasAnswer: true, aiGenerated: false },
  { id: "q6", type: "CASE_STUDY", contentAr: "دراسة حالة: تحليل اختراق بيانات شركة XYZ وتقديم خطة استجابة للحوادث", difficulty: "EXPERT", points: 30, source: "AI_GENERATED", hasAnswer: false, aiGenerated: true },
  { id: "q7", type: "SHORT_ANSWER", contentAr: "اشرح مفهوم الـ Dependency Injection ولماذا يُستخدم", difficulty: "MEDIUM", points: 15, source: "FILE_UPLOAD", hasAnswer: true, aiGenerated: false },
  { id: "q8", type: "CODE", contentAr: "صمم خوارزمية لتحديد أقصر مسار في رسم بياني موزون", difficulty: "HARD", points: 20, source: "AI_GENERATED", hasAnswer: true, aiGenerated: true },
];

const aiModels = [
  { id: "nuha", name: "Nuha (نهى)", provider: "Saudi AI", desc: "نموذج سعودي متخصص باللغة العربية" },
  { id: "llama3", name: "Llama 3", provider: "Meta", desc: "نموذج متعدد الأغراض" },
  { id: "falcon", name: "Falcon", provider: "TII", desc: "نموذج إماراتي عالي الأداء" },
  { id: "mistral", name: "Mistral", provider: "Mistral AI", desc: "نموذج أوروبي سريع" },
];

// ─── Components ──────────────────────────────────────────────

function QuestionCard({ question }: { question: Question }) {
  const TypeIcon = questionTypeLabels[question.type].icon;
  const SourceIcon = sourceLabels[question.source].icon;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <TypeIcon className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-elm-navy leading-relaxed line-clamp-2">{question.contentAr}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
              {questionTypeLabels[question.type].label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${difficultyConfig[question.difficulty].color}`}>
              {difficultyConfig[question.difficulty].label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${sourceLabels[question.source].color}`}>
              <SourceIcon className="w-3 h-3" />
              {sourceLabels[question.source].label}
            </span>
            <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-bold">
              {question.points} نقطة
            </span>
            {question.hasAnswer ? (
              <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> إجابة متوفرة
              </span>
            ) : (
              <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" /> بدون إجابة
              </span>
            )}
            {question.aiGenerated && (
              <span className="text-[10px] text-purple-600 flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AIGeneratePanel({ onClose }: { onClose: () => void }) {
  const [selectedModel, setSelectedModel] = useState("nuha");

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold text-elm-navy">إنشاء أسئلة بالذكاء الاصطناعي</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* AI Model Selection */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block font-medium">نموذج الذكاء الاصطناعي</label>
            <div className="grid grid-cols-2 gap-3">
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-3 rounded-xl border text-right transition-all ${
                    selectedModel === model.id
                      ? "border-purple-300 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-3 h-3 rounded-full ${selectedModel === model.id ? "bg-purple-500" : "bg-gray-200"}`} />
                    <div>
                      <p className="text-xs font-bold text-elm-navy">{model.name}</p>
                      <p className="text-[10px] text-gray-400">{model.provider}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{model.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generation Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الموضوع / المجال</label>
              <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="مثال: الأمن السيبراني" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">عدد الأسئلة</label>
              <input type="number" min={1} max={50} defaultValue={10} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">نوع الأسئلة</label>
              <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200">
                <option>مختلط</option>
                <option>اختيار متعدد</option>
                <option>صح أو خطأ</option>
                <option>إجابة قصيرة</option>
                <option>مقالة</option>
                <option>برمجة</option>
                <option>دراسة حالة</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">مستوى الصعوبة</label>
              <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200">
                <option>مختلط</option>
                <option>سهل</option>
                <option>متوسط</option>
                <option>صعب</option>
                <option>خبير</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">تعليمات إضافية (اختياري)</label>
            <textarea rows={3} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none" placeholder="أضف تعليمات خاصة لتوليد الأسئلة..." />
          </div>

          {/* AI Options */}
          <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-purple-700">خيارات الذكاء الاصطناعي</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-sm text-gray-700">إنشاء الإجابات الصحيحة تلقائياً</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-sm text-gray-700">إضافة شرح للإجابات</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-sm text-gray-700">تنويع مستويات الصعوبة</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            إلغاء
          </button>
          <button className="px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm">
            <Wand2 className="w-4 h-4" />
            إنشاء الأسئلة
          </button>
        </div>
      </div>
    </div>
  );
}

function FileUploadPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-elm-navy">رفع ملف أسئلة</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Upload Zone */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-300 transition-colors cursor-pointer">
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-elm-navy">اسحب الملف هنا أو اضغط للاختيار</p>
            <p className="text-[11px] text-gray-400 mt-1">
              يدعم: PDF, DOCX, XLSX, CSV, JSON | الحد الأقصى: 50MB
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              <div>
                <span className="text-sm text-gray-700">الملف يحتوي على الإجابات</span>
                <p className="text-[10px] text-gray-400">سيتم استخراج الإجابات تلقائياً من الملف</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              <div>
                <span className="text-sm text-gray-700">حل الإجابات بالذكاء الاصطناعي</span>
                <p className="text-[10px] text-gray-400">سيتم استخدام AI لحل الأسئلة التي بدون إجابات</p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            إلغاء
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            رفع ومعالجة
          </button>
        </div>
      </div>
    </div>
  );
}

function AISolvePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-elm-navy">حل الإجابات بالذكاء الاصطناعي</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">تنبيه مهم</p>
              <p className="text-[11px] text-amber-600 mt-1">
                سيتم حل {mockQuestions.filter((q) => !q.hasAnswer).length} أسئلة بدون إجابات. يرجى مراجعة الإجابات المولّدة قبل اعتمادها.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 block font-medium">نموذج الذكاء الاصطناعي</label>
            <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200">
              {aiModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name} - {m.provider}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">الأسئلة التي سيتم حلها:</p>
            {mockQuestions.filter((q) => !q.hasAnswer).map((q) => (
              <div key={q.id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600" />
                <p className="text-xs text-gray-600 truncate">{q.contentAr}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            إلغاء
          </button>
          <button className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <Brain className="w-4 h-4" />
            حل بالذكاء الاصطناعي
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function QuestionsPage() {
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showAISolve, setShowAISolve] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  const filteredQuestions = mockQuestions.filter((q) => {
    if (filterType !== "all" && q.type !== filterType) return false;
    if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) return false;
    return true;
  });

  const unanswered = mockQuestions.filter((q) => !q.hasAnswer).length;
  const totalPoints = mockQuestions.reduce((s, q) => s + q.points, 0);
  const aiCount = mockQuestions.filter((q) => q.aiGenerated).length;

  return (
    <div>
      <TopBar title="Question Management" titleAr="إدارة الأسئلة" />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">بنك الأسئلة</h2>
            <p className="text-sm text-gray-500 mt-1">
              {mockQuestions.length} سؤال | {totalPoints} نقطة إجمالية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <FileUp className="w-4 h-4" />
              رفع ملف
            </button>
            <button
              onClick={() => setShowAISolve(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <Brain className="w-4 h-4" />
              حل بالـ AI
            </button>
            <button
              onClick={() => setShowAIGenerate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              إنشاء بالـ AI
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              إضافة سؤال
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <FileText className="w-6 h-6 text-brand-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-elm-navy">{mockQuestions.length}</p>
            <p className="text-[11px] text-gray-500">إجمالي الأسئلة</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-700">{mockQuestions.length - unanswered}</p>
            <p className="text-[11px] text-gray-500">بإجابات</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-700">{unanswered}</p>
            <p className="text-[11px] text-gray-500">بدون إجابة</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">{aiCount}</p>
            <p className="text-[11px] text-gray-500">مولّدة بالـ AI</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{totalPoints}</p>
            <p className="text-[11px] text-gray-500">إجمالي النقاط</p>
          </div>
        </div>

        {/* Unanswered Alert */}
        {unanswered > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-800">{unanswered} أسئلة بدون إجابات</p>
                <p className="text-[11px] text-amber-600">يمكنك استخدام الذكاء الاصطناعي لحل الإجابات تلقائياً</p>
              </div>
            </div>
            <button
              onClick={() => setShowAISolve(true)}
              className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              حل بالـ AI
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث في الأسئلة..."
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="all">جميع الأنواع</option>
            {Object.entries(questionTypeLabels).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="all">جميع المستويات</option>
            {Object.entries(difficultyConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {filteredQuestions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-sm">لا توجد أسئلة مطابقة للفلتر المحدد</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAIGenerate && <AIGeneratePanel onClose={() => setShowAIGenerate(false)} />}
      {showUpload && <FileUploadPanel onClose={() => setShowUpload(false)} />}
      {showAISolve && <AISolvePanel onClose={() => setShowAISolve(false)} />}
    </div>
  );
}
