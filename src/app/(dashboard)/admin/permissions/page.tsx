import TopBar from "@/components/layout/TopBar";
import {
  Shield,
  Search,
  Filter,
  Check,
  X,
  Settings,
  Users,
  Building2,
  Calendar,
  Trophy,
  BookOpen,
  Scale,
  GraduationCap,
  FileText,
  FlaskConical,
  Cpu,
  Bell,
  CreditCard,
  Award,
  Download,
} from "lucide-react";

const moduleIcons: Record<string, any> = {
  PLATFORM: Settings,
  USERS: Users,
  ORGANIZATIONS: Building2,
  EVENTS: Calendar,
  HACKATHONS: Trophy,
  CHALLENGES: BookOpen,
  TEAMS: Users,
  SUBMISSIONS: FileText,
  EVALUATIONS: Scale,
  CERTIFICATES: Award,
  REPORTS: FileText,
  RESEARCH: FlaskConical,
  AI_TOOLS: Cpu,
  SETTINGS: Settings,
  NOTIFICATIONS: Bell,
  BILLING: CreditCard,
};

const moduleNames: Record<string, string> = {
  PLATFORM: "إدارة المنصة",
  USERS: "المستخدمين",
  ORGANIZATIONS: "المؤسسات",
  EVENTS: "الفعاليات",
  HACKATHONS: "الهاكاثونات",
  CHALLENGES: "التحديات",
  TEAMS: "الفرق",
  SUBMISSIONS: "التقديمات",
  EVALUATIONS: "التقييمات",
  CERTIFICATES: "الشهادات",
  REPORTS: "التقارير",
  RESEARCH: "البحث العلمي",
  AI_TOOLS: "الذكاء الاصطناعي",
  SETTINGS: "الإعدادات",
  NOTIFICATIONS: "الإشعارات",
  BILLING: "الفواتير",
};

const actionLabels: Record<string, string> = {
  CREATE: "إنشاء",
  READ: "عرض",
  UPDATE: "تحديث",
  DELETE: "حذف",
  MANAGE: "إدارة كاملة",
  EXPORT: "تصدير",
  IMPORT: "استيراد",
  APPROVE: "موافقة",
  REJECT: "رفض",
  ASSIGN: "تعيين",
  EVALUATE: "تقييم",
  PUBLISH: "نشر",
  ARCHIVE: "أرشفة",
};

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  READ: "bg-blue-50 text-blue-700",
  UPDATE: "bg-amber-50 text-amber-700",
  DELETE: "bg-red-50 text-red-700",
  MANAGE: "bg-purple-50 text-purple-700",
  EXPORT: "bg-cyan-50 text-cyan-700",
  IMPORT: "bg-indigo-50 text-indigo-700",
  APPROVE: "bg-emerald-50 text-emerald-700",
  REJECT: "bg-red-50 text-red-700",
  ASSIGN: "bg-violet-50 text-violet-700",
  EVALUATE: "bg-orange-50 text-orange-700",
  PUBLISH: "bg-blue-50 text-blue-700",
  ARCHIVE: "bg-gray-100 text-gray-600",
};

// All permissions grouped by module
const permissionsByModule = [
  {
    module: "PLATFORM",
    permissions: [
      { code: "platform.manage", nameAr: "إدارة المنصة الكاملة", action: "MANAGE", resource: "platform" },
      { code: "platform.settings.manage", nameAr: "إدارة إعدادات المنصة", action: "MANAGE", resource: "platform_settings" },
      { code: "platform.analytics.read", nameAr: "عرض تحليلات المنصة", action: "READ", resource: "platform_analytics" },
    ],
  },
  {
    module: "USERS",
    permissions: [
      { code: "users.create", nameAr: "إنشاء مستخدمين جدد", action: "CREATE", resource: "users" },
      { code: "users.read", nameAr: "عرض بيانات المستخدمين", action: "READ", resource: "users" },
      { code: "users.update", nameAr: "تحديث بيانات المستخدمين", action: "UPDATE", resource: "users" },
      { code: "users.delete", nameAr: "حذف المستخدمين", action: "DELETE", resource: "users" },
      { code: "users.manage", nameAr: "إدارة المستخدمين الكاملة", action: "MANAGE", resource: "users" },
      { code: "users.roles.assign", nameAr: "تعيين الأدوار للمستخدمين", action: "ASSIGN", resource: "user_roles" },
      { code: "users.export", nameAr: "تصدير بيانات المستخدمين", action: "EXPORT", resource: "users" },
      { code: "users.import", nameAr: "استيراد مستخدمين بالجملة", action: "IMPORT", resource: "users" },
    ],
  },
  {
    module: "ORGANIZATIONS",
    permissions: [
      { code: "organizations.create", nameAr: "تسجيل مؤسسات جديدة", action: "CREATE", resource: "organizations" },
      { code: "organizations.read", nameAr: "عرض بيانات المؤسسات", action: "READ", resource: "organizations" },
      { code: "organizations.update", nameAr: "تحديث بيانات المؤسسة", action: "UPDATE", resource: "organizations" },
      { code: "organizations.delete", nameAr: "حذف المؤسسات", action: "DELETE", resource: "organizations" },
      { code: "organizations.approve", nameAr: "الموافقة على تسجيل المؤسسات", action: "APPROVE", resource: "organizations" },
      { code: "organizations.members.manage", nameAr: "إدارة أعضاء المؤسسة", action: "MANAGE", resource: "organization_members" },
      { code: "organizations.settings.manage", nameAr: "إدارة إعدادات المؤسسة", action: "MANAGE", resource: "organization_settings" },
    ],
  },
  {
    module: "EVENTS",
    permissions: [
      { code: "events.create", nameAr: "إنشاء فعاليات جديدة", action: "CREATE", resource: "events" },
      { code: "events.read", nameAr: "عرض الفعاليات", action: "READ", resource: "events" },
      { code: "events.update", nameAr: "تحديث بيانات الفعالية", action: "UPDATE", resource: "events" },
      { code: "events.delete", nameAr: "حذف الفعاليات", action: "DELETE", resource: "events" },
      { code: "events.publish", nameAr: "نشر الفعاليات", action: "PUBLISH", resource: "events" },
      { code: "events.archive", nameAr: "أرشفة الفعاليات", action: "ARCHIVE", resource: "events" },
      { code: "events.members.manage", nameAr: "إدارة أعضاء الفعالية (محكمين، مرشدين، مشاركين)", action: "MANAGE", resource: "event_members" },
      { code: "events.members.approve", nameAr: "قبول ورفض طلبات الانضمام", action: "APPROVE", resource: "event_members" },
      { code: "events.tracks.manage", nameAr: "إدارة مسارات الفعالية", action: "MANAGE", resource: "event_tracks" },
      { code: "events.phases.manage", nameAr: "إدارة مراحل الفعالية", action: "MANAGE", resource: "event_phases" },
      { code: "events.settings.manage", nameAr: "إدارة إعدادات الفعالية", action: "MANAGE", resource: "event_settings" },
      { code: "events.announcements.manage", nameAr: "إدارة إعلانات الفعالية", action: "MANAGE", resource: "announcements" },
    ],
  },
  {
    module: "EVALUATIONS",
    permissions: [
      { code: "evaluations.create", nameAr: "إنشاء تقييمات جديدة", action: "CREATE", resource: "evaluations" },
      { code: "evaluations.read", nameAr: "عرض جميع التقييمات", action: "READ", resource: "evaluations" },
      { code: "evaluations.read.own", nameAr: "عرض التقييمات الخاصة فقط", action: "READ", resource: "own_evaluations" },
      { code: "evaluations.evaluate", nameAr: "تقييم التقديمات ومنح الدرجات", action: "EVALUATE", resource: "submissions" },
      { code: "evaluations.publish", nameAr: "نشر نتائج التقييم", action: "PUBLISH", resource: "evaluations" },
      { code: "evaluations.criteria.manage", nameAr: "إدارة معايير التقييم", action: "MANAGE", resource: "evaluation_criteria" },
    ],
  },
  {
    module: "SUBMISSIONS",
    permissions: [
      { code: "submissions.create", nameAr: "تقديم الحلول والمشاريع", action: "CREATE", resource: "submissions" },
      { code: "submissions.read", nameAr: "عرض جميع التقديمات", action: "READ", resource: "submissions" },
      { code: "submissions.read.own", nameAr: "عرض التقديمات الخاصة فقط", action: "READ", resource: "own_submissions" },
      { code: "submissions.manage", nameAr: "إدارة التقديمات الكاملة", action: "MANAGE", resource: "submissions" },
      { code: "submissions.export", nameAr: "تصدير بيانات التقديمات", action: "EXPORT", resource: "submissions" },
    ],
  },
  {
    module: "RESEARCH",
    permissions: [
      { code: "research.datasets.read", nameAr: "الوصول لمجموعات البيانات البحثية", action: "READ", resource: "datasets" },
      { code: "research.datasets.manage", nameAr: "إدارة مجموعات البيانات", action: "MANAGE", resource: "datasets" },
      { code: "research.access.manage", nameAr: "إدارة صلاحيات وصول الباحثين", action: "MANAGE", resource: "research_access" },
      { code: "research.export", nameAr: "تصدير بيانات البحث", action: "EXPORT", resource: "research_data" },
    ],
  },
  {
    module: "AI_TOOLS",
    permissions: [
      { code: "ai.evaluate", nameAr: "استخدام التقييم بالذكاء الاصطناعي", action: "EVALUATE", resource: "ai_evaluation" },
      { code: "ai.manage", nameAr: "إدارة إعدادات نماذج الذكاء الاصطناعي", action: "MANAGE", resource: "ai_config" },
    ],
  },
];

export default function PermissionsPage() {
  const totalPermissions = permissionsByModule.reduce(
    (sum, m) => sum + m.permissions.length, 0
  );

  return (
    <div>
      <TopBar title="Permissions" titleAr="إدارة الصلاحيات" />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">جميع الصلاحيات</h2>
            <p className="text-sm text-gray-500 mt-1">
              {totalPermissions} صلاحية موزعة على {permissionsByModule.length} وحدة
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            <Download className="w-4 h-4" />
            تصدير مصفوفة الصلاحيات
          </button>
        </div>

        {/* Module Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {permissionsByModule.map((group) => {
            const Icon = moduleIcons[group.module] || Settings;
            return (
              <div
                key={group.module}
                className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-4 h-4 text-brand-500" />
                </div>
                <p className="text-xs font-bold text-elm-navy">{moduleNames[group.module]}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {group.permissions.length} صلاحية
                </p>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث في الصلاحيات..."
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
          />
        </div>

        {/* Permissions by Module */}
        <div className="space-y-4">
          {permissionsByModule.map((group) => {
            const Icon = moduleIcons[group.module] || Settings;
            return (
              <div
                key={group.module}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="flex items-center gap-3 px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                  <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brand-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-elm-navy">
                      {moduleNames[group.module]}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {group.permissions.length} صلاحية
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {group.permissions.map((perm) => (
                    <div
                      key={perm.code}
                      className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${actionColors[perm.action]}`}>
                          {actionLabels[perm.action]}
                        </span>
                        <div>
                          <p className="text-sm text-elm-navy">{perm.nameAr}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{perm.code}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {perm.resource}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
