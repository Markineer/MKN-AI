import TopBar from "@/components/layout/TopBar";
import {
  Settings,
  Globe,
  Palette,
  Shield,
  Bell,
  Database,
  Cpu,
  CreditCard,
  Mail,
  Key,
  Upload,
  Save,
} from "lucide-react";

const settingsSections = [
  {
    id: "general",
    nameAr: "عام",
    icon: Settings,
    settings: [
      { key: "platform.name", nameAr: "اسم المنصة (إنجليزي)", value: "Makan AI Platform", type: "text" },
      { key: "platform.name.ar", nameAr: "اسم المنصة (عربي)", value: "مكن AI", type: "text" },
      { key: "platform.tagline", nameAr: "الشعار (إنجليزي)", value: "Smart Event Management", type: "text" },
      { key: "platform.tagline.ar", nameAr: "الشعار (عربي)", value: "منصة إدارة الفعاليات الذكية", type: "text" },
    ],
  },
  {
    id: "branding",
    nameAr: "الهوية البصرية",
    icon: Palette,
    settings: [
      { key: "platform.primary_color", nameAr: "اللون الأساسي", value: "#7C3AED", type: "color" },
      { key: "platform.secondary_color", nameAr: "اللون الثانوي", value: "#14B8A6", type: "color" },
      { key: "platform.logo", nameAr: "شعار المنصة", value: "", type: "file" },
      { key: "platform.favicon", nameAr: "أيقونة المتصفح", value: "", type: "file" },
    ],
  },
  {
    id: "localization",
    nameAr: "اللغة والمنطقة",
    icon: Globe,
    settings: [
      { key: "platform.default_language", nameAr: "اللغة الافتراضية", value: "ar", type: "select", options: ["ar", "en"] },
      { key: "platform.timezone", nameAr: "المنطقة الزمنية", value: "Asia/Riyadh", type: "text" },
      { key: "platform.date_format", nameAr: "تنسيق التاريخ", value: "DD/MM/YYYY", type: "text" },
    ],
  },
  {
    id: "security",
    nameAr: "الأمان",
    icon: Shield,
    settings: [
      { key: "platform.mfa_required", nameAr: "المصادقة الثنائية إلزامية", value: "false", type: "toggle" },
      { key: "platform.password_min_length", nameAr: "الحد الأدنى لطول كلمة المرور", value: "8", type: "number" },
      { key: "platform.session_timeout", nameAr: "مهلة انتهاء الجلسة (بالدقائق)", value: "60", type: "number" },
      { key: "platform.max_login_attempts", nameAr: "الحد الأقصى لمحاولات الدخول", value: "5", type: "number" },
      { key: "platform.data_encryption", nameAr: "تشفير البيانات", value: "true", type: "toggle" },
      { key: "platform.audit_logging", nameAr: "سجل النشاطات", value: "true", type: "toggle" },
    ],
  },
  {
    id: "ai",
    nameAr: "الذكاء الاصطناعي",
    icon: Cpu,
    settings: [
      { key: "ai.default_model", nameAr: "النموذج الافتراضي", value: "nuha", type: "select", options: ["nuha", "llama3", "falcon", "mistral"] },
      { key: "ai.auto_evaluate", nameAr: "التقييم الآلي التلقائي", value: "true", type: "toggle" },
      { key: "ai.confidence_threshold", nameAr: "حد الثقة للتقييم", value: "0.8", type: "number" },
      { key: "ai.stt_enabled", nameAr: "تحويل الصوت للنص", value: "true", type: "toggle" },
      { key: "ai.lvm_enabled", nameAr: "الرؤية الحاسوبية", value: "true", type: "toggle" },
    ],
  },
  {
    id: "uploads",
    nameAr: "الملفات والرفع",
    icon: Upload,
    settings: [
      { key: "platform.max_file_size_mb", nameAr: "الحد الأقصى لحجم الملف (MB)", value: "50", type: "number" },
      { key: "platform.allowed_file_types", nameAr: "أنواع الملفات المسموحة", value: "pdf,doc,docx,ppt,pptx,zip,png,jpg,mp4", type: "text" },
      { key: "platform.max_avatar_size_mb", nameAr: "الحد الأقصى لحجم الصورة الشخصية (MB)", value: "5", type: "number" },
    ],
  },
  {
    id: "notifications",
    nameAr: "الإشعارات",
    icon: Bell,
    settings: [
      { key: "notifications.email_enabled", nameAr: "إشعارات البريد الإلكتروني", value: "true", type: "toggle" },
      { key: "notifications.sms_enabled", nameAr: "إشعارات الرسائل النصية", value: "false", type: "toggle" },
      { key: "notifications.push_enabled", nameAr: "الإشعارات الفورية", value: "true", type: "toggle" },
    ],
  },
  {
    id: "compliance",
    nameAr: "الامتثال والتنظيم",
    icon: Key,
    settings: [
      { key: "compliance.pdpl", nameAr: "نظام حماية البيانات الشخصية (PDPL)", value: "true", type: "toggle" },
      { key: "compliance.nca", nameAr: "الهيئة الوطنية للأمن السيبراني (NCA)", value: "true", type: "toggle" },
      { key: "compliance.gdpr", nameAr: "اللائحة العامة لحماية البيانات (GDPR)", value: "true", type: "toggle" },
      { key: "compliance.data_retention_days", nameAr: "مدة الاحتفاظ بالبيانات (أيام)", value: "365", type: "number" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div>
      <TopBar title="Settings" titleAr="إعدادات المنصة" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">إعدادات المنصة</h2>
            <p className="text-sm text-gray-500 mt-1">تخصيص وإدارة جميع إعدادات المنصة</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            حفظ التغييرات
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 sticky top-20">
              {settingsSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                >
                  <section.icon className="w-4 h-4" />
                  {section.nameAr}
                </a>
              ))}
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 space-y-6">
            {settingsSections.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-brand-500" />
                  </div>
                  <h3 className="text-lg font-bold text-elm-navy">{section.nameAr}</h3>
                </div>
                <div className="space-y-5">
                  {section.settings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-elm-navy">{setting.nameAr}</label>
                        <p className="text-xs text-gray-400 mt-0.5">{setting.key}</p>
                      </div>
                      <div className="w-72">
                        {setting.type === "toggle" ? (
                          <div className="flex items-center justify-end">
                            <button
                              className={`w-11 h-6 rounded-full transition-colors relative ${
                                setting.value === "true" ? "bg-brand-500" : "bg-gray-200"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${
                                  setting.value === "true" ? "left-0.5" : "right-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        ) : setting.type === "color" ? (
                          <div className="flex items-center gap-2 justify-end">
                            <input
                              type="color"
                              defaultValue={setting.value}
                              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer"
                            />
                            <input
                              type="text"
                              defaultValue={setting.value}
                              className="w-28 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center"
                            />
                          </div>
                        ) : setting.type === "select" ? (
                          <select
                            defaultValue={setting.value}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                          >
                            {(setting as any).options?.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : setting.type === "file" ? (
                          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 border-dashed rounded-xl text-sm text-gray-500 hover:bg-gray-100 w-full justify-center">
                            <Upload className="w-4 h-4" />
                            رفع ملف
                          </button>
                        ) : (
                          <input
                            type={setting.type === "number" ? "number" : "text"}
                            defaultValue={setting.value}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
