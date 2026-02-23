"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import {
  Loader2,
  ArrowRight,
  Save,
  Check,
  AlertCircle,
  ExternalLink,
  GitBranch,
  Globe,
  FileText,
  Layers,
  Link2,
  Clock,
  CheckCircle,
} from "lucide-react";

interface FieldConfig {
  type: string;
  enabled: boolean;
  required: boolean;
  label: string;
  allowFile?: boolean;
  allowLink?: boolean;
  providedUrl?: string;
}

interface PhaseInfo {
  id: string;
  name: string;
  status: string;
  endDate: string;
}

interface TeamInfo {
  id: string;
  name: string;
  projectTitle: string;
  projectDescription: string;
  repositoryUrl: string;
  presentationUrl: string;
  demoUrl: string;
  miroBoard: string;
}

const fieldIcons: Record<string, any> = {
  repository: GitBranch,
  presentation: FileText,
  demo: Globe,
  miro: Layers,
  onedrive: Link2,
  file: FileText,
  description: FileText,
};

export default function TeamSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const phaseId = params.phaseId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [phase, setPhase] = useState<PhaseInfo | null>(null);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/teams/${teamId}/deliverables/${phaseId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "فشل تحميل البيانات");
          return;
        }
        const data = await res.json();
        setPhase(data.phase);
        setTeam(data.team);

        const config = data.deliverableConfig;
        const enabledFields = config?.fields?.filter((f: FieldConfig) => f.enabled) || [];
        setFields(enabledFields);

        // Pre-fill from existing data
        const initial: Record<string, string> = {};
        const sub = data.submission;
        const t = data.team;

        for (const field of enabledFields) {
          switch (field.type) {
            case "description":
              initial.description = sub?.content || t?.projectDescription || "";
              break;
            case "repository":
              initial.repository = sub?.repositoryUrl || t?.repositoryUrl || "";
              break;
            case "presentation":
              initial.presentation = sub?.presentationUrl || t?.presentationUrl || "";
              break;
            case "demo":
              initial.demo = sub?.demoUrl || t?.demoUrl || "";
              break;
            case "miro":
              initial.miro = sub?.miroUrl || t?.miroBoard || "";
              break;
            case "onedrive":
              initial.onedrive = sub?.oneDriveUrl || "";
              break;
            case "file":
              initial.file = sub?.fileUrl || "";
              break;
          }
        }
        setValues(initial);
      } catch (err) {
        setError("حدث خطأ في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teamId, phaseId]);

  const handleSubmit = async () => {
    setError("");
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/teams/${teamId}/deliverables/${phaseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: values.description || null,
          repositoryUrl: values.repository || null,
          presentationUrl: values.presentation || null,
          demoUrl: values.demo || null,
          miroUrl: values.miro || null,
          oneDriveUrl: values.onedrive || null,
          fileUrl: values.file || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "فشل الحفظ");
        return;
      }

      setSaved(true);
    } catch (err) {
      setError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Submit Deliverables" titleAr="تسليم المخرجات" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !phase) {
    return (
      <div>
        <TopBar title="Submit Deliverables" titleAr="تسليم المخرجات" />
        <div className="p-6 lg:p-8">
          <div className="bg-red-50 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error}</p>
            <Link href="/team" className="text-xs text-brand-500 hover:underline mt-3 inline-block">
              العودة لفرقي
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Submit Deliverables" titleAr="تسليم المخرجات" />
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Back */}
        <Link
          href="/team"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-500 transition-colors mb-6 group"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          العودة لفرقي
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-elm-navy">{team?.name}</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {phase?.name} — تسليم المخرجات المطلوبة
              </p>
            </div>
            {phase?.status === "ACTIVE" && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                ينتهي {phase?.endDate ? new Date(phase.endDate).toLocaleDateString("ar-SA") : ""}
              </div>
            )}
          </div>
        </div>

        {/* Success Banner */}
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">تم حفظ التسليمات بنجاح!</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Fields */}
        {fields.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">لم يتم تحديد تسليمات مطلوبة لهذه المرحلة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => {
              const Icon = fieldIcons[field.type] || FileText;
              const isMiroWithProvided = field.type === "miro" && field.providedUrl;

              return (
                <div key={field.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-elm-navy">{field.label}</p>
                      {field.required && (
                        <span className="text-[10px] text-red-500 font-medium">مطلوب *</span>
                      )}
                    </div>
                  </div>

                  {/* Miro with provided URL */}
                  {isMiroWithProvided && (
                    <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-[11px] text-amber-700 font-medium mb-1">لوحة Miro جاهزة من المنظم:</p>
                      <a
                        href={field.providedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        فتح اللوحة
                      </a>
                    </div>
                  )}

                  {/* Input field */}
                  {field.type === "description" ? (
                    <textarea
                      value={values.description || ""}
                      onChange={(e) => setValues({ ...values, description: e.target.value })}
                      rows={4}
                      placeholder="اكتب وصف المشروع..."
                      className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors resize-none"
                      dir="rtl"
                    />
                  ) : (
                    <input
                      type="url"
                      value={values[field.type] || ""}
                      onChange={(e) => setValues({ ...values, [field.type]: e.target.value })}
                      placeholder={
                        field.type === "repository" ? "https://github.com/..." :
                        field.type === "presentation" ? "رابط العرض التقديمي" :
                        field.type === "demo" ? "https://..." :
                        field.type === "miro" ? "https://miro.com/..." :
                        field.type === "onedrive" ? "https://onedrive.live.com/..." :
                        "https://..."
                      }
                      className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                      dir="ltr"
                    />
                  )}
                </div>
              );
            })}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-500 text-white rounded-2xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? "تم الحفظ" : "حفظ التسليمات"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
