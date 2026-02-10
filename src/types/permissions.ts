// ============================================================================
// Nafath Platform - Permission Types & Constants
// نظام الصلاحيات المتكامل
// ============================================================================

// ============================================================================
// ROLE HIERARCHY - هرمية الأدوار
// ============================================================================
//
// Level 1: SUPER_ADMIN (علم + ماركنير)
//   └── Full control over entire platform
//
// Level 2: PLATFORM_ADMIN (مدير المنصة)
//   └── Manage all organizations, events, users
//
// Level 3: ORGANIZATION_ADMIN (مدير المؤسسة)
//   └── Full control within their organization
//   └── Create events, manage members
//
// Level 4: EVENT_MANAGER (مدير الفعالية)
//   └── Full control within their event
//   └── Manage participants, judges, mentors
//
// Level 5: JUDGE (محكم)
//   └── Evaluate submissions, give scores
//
// Level 5: MENTOR (مرشد)
//   └── Guide teams, review ideas, give feedback
//
// Level 5: EXPERT (خبير)
//   └── Provide expertise, consult
//
// Level 6: PARTICIPANT (مشارك)
//   └── Register, submit, interact
//
// Level 7: RESEARCHER (باحث)
//   └── Access anonymized data for research
//
// Level 8: VIEWER (مشاهد)
//   └── Read-only access to public content
// ============================================================================

export type RoleLevel =
  | "SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "ORGANIZATION_ADMIN"
  | "EVENT_MANAGER"
  | "JUDGE"
  | "MENTOR"
  | "EXPERT"
  | "PARTICIPANT"
  | "RESEARCHER"
  | "VIEWER";

export type PermissionModule =
  | "PLATFORM"
  | "USERS"
  | "ORGANIZATIONS"
  | "EVENTS"
  | "HACKATHONS"
  | "CHALLENGES"
  | "TEAMS"
  | "SUBMISSIONS"
  | "EVALUATIONS"
  | "CERTIFICATES"
  | "REPORTS"
  | "RESEARCH"
  | "AI_TOOLS"
  | "SETTINGS"
  | "NOTIFICATIONS"
  | "BILLING";

export type PermissionAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "MANAGE"
  | "EXPORT"
  | "IMPORT"
  | "APPROVE"
  | "REJECT"
  | "ASSIGN"
  | "EVALUATE"
  | "PUBLISH"
  | "ARCHIVE";

export interface PermissionDefinition {
  code: string;
  name: string;
  nameAr: string;
  description: string;
  module: PermissionModule;
  action: PermissionAction;
  resource: string;
}

export interface RoleDefinition {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  level: RoleLevel;
  isSystem: boolean;
  color: string;
  icon: string;
  permissions: string[]; // permission codes
}

// ============================================================================
// ALL PERMISSIONS - جميع الصلاحيات
// ============================================================================

export const PERMISSIONS: PermissionDefinition[] = [
  // ── Platform Management ─────────────────────────
  { code: "platform.manage", name: "Manage Platform", nameAr: "إدارة المنصة", description: "Full platform management", module: "PLATFORM", action: "MANAGE", resource: "platform" },
  { code: "platform.settings.manage", name: "Manage Platform Settings", nameAr: "إدارة إعدادات المنصة", description: "Configure platform settings", module: "PLATFORM", action: "MANAGE", resource: "platform_settings" },
  { code: "platform.analytics.read", name: "View Platform Analytics", nameAr: "عرض تحليلات المنصة", description: "View platform-wide analytics", module: "PLATFORM", action: "READ", resource: "platform_analytics" },

  // ── User Management ─────────────────────────────
  { code: "users.create", name: "Create Users", nameAr: "إنشاء مستخدمين", description: "Create new users", module: "USERS", action: "CREATE", resource: "users" },
  { code: "users.read", name: "View Users", nameAr: "عرض المستخدمين", description: "View user profiles", module: "USERS", action: "READ", resource: "users" },
  { code: "users.update", name: "Update Users", nameAr: "تحديث المستخدمين", description: "Edit user information", module: "USERS", action: "UPDATE", resource: "users" },
  { code: "users.delete", name: "Delete Users", nameAr: "حذف المستخدمين", description: "Remove users", module: "USERS", action: "DELETE", resource: "users" },
  { code: "users.manage", name: "Manage Users", nameAr: "إدارة المستخدمين", description: "Full user management", module: "USERS", action: "MANAGE", resource: "users" },
  { code: "users.roles.assign", name: "Assign User Roles", nameAr: "تعيين أدوار المستخدمين", description: "Assign roles to users", module: "USERS", action: "ASSIGN", resource: "user_roles" },
  { code: "users.export", name: "Export Users", nameAr: "تصدير المستخدمين", description: "Export user data", module: "USERS", action: "EXPORT", resource: "users" },
  { code: "users.import", name: "Import Users", nameAr: "استيراد المستخدمين", description: "Import users in bulk", module: "USERS", action: "IMPORT", resource: "users" },

  // ── Organization Management ─────────────────────
  { code: "organizations.create", name: "Create Organizations", nameAr: "إنشاء مؤسسات", description: "Register new organizations", module: "ORGANIZATIONS", action: "CREATE", resource: "organizations" },
  { code: "organizations.read", name: "View Organizations", nameAr: "عرض المؤسسات", description: "View organization details", module: "ORGANIZATIONS", action: "READ", resource: "organizations" },
  { code: "organizations.update", name: "Update Organizations", nameAr: "تحديث المؤسسات", description: "Edit organization info", module: "ORGANIZATIONS", action: "UPDATE", resource: "organizations" },
  { code: "organizations.delete", name: "Delete Organizations", nameAr: "حذف المؤسسات", description: "Remove organizations", module: "ORGANIZATIONS", action: "DELETE", resource: "organizations" },
  { code: "organizations.manage", name: "Manage Organizations", nameAr: "إدارة المؤسسات", description: "Full org management", module: "ORGANIZATIONS", action: "MANAGE", resource: "organizations" },
  { code: "organizations.approve", name: "Approve Organizations", nameAr: "الموافقة على المؤسسات", description: "Approve org registrations", module: "ORGANIZATIONS", action: "APPROVE", resource: "organizations" },
  { code: "organizations.members.manage", name: "Manage Org Members", nameAr: "إدارة أعضاء المؤسسة", description: "Manage organization members", module: "ORGANIZATIONS", action: "MANAGE", resource: "organization_members" },
  { code: "organizations.settings.manage", name: "Manage Org Settings", nameAr: "إدارة إعدادات المؤسسة", description: "Configure org settings", module: "ORGANIZATIONS", action: "MANAGE", resource: "organization_settings" },

  // ── Event Management ────────────────────────────
  { code: "events.create", name: "Create Events", nameAr: "إنشاء فعاليات", description: "Create new events", module: "EVENTS", action: "CREATE", resource: "events" },
  { code: "events.read", name: "View Events", nameAr: "عرض الفعاليات", description: "View event details", module: "EVENTS", action: "READ", resource: "events" },
  { code: "events.update", name: "Update Events", nameAr: "تحديث الفعاليات", description: "Edit events", module: "EVENTS", action: "UPDATE", resource: "events" },
  { code: "events.delete", name: "Delete Events", nameAr: "حذف الفعاليات", description: "Remove events", module: "EVENTS", action: "DELETE", resource: "events" },
  { code: "events.manage", name: "Manage Events", nameAr: "إدارة الفعاليات", description: "Full event management", module: "EVENTS", action: "MANAGE", resource: "events" },
  { code: "events.publish", name: "Publish Events", nameAr: "نشر الفعاليات", description: "Publish events", module: "EVENTS", action: "PUBLISH", resource: "events" },
  { code: "events.archive", name: "Archive Events", nameAr: "أرشفة الفعاليات", description: "Archive events", module: "EVENTS", action: "ARCHIVE", resource: "events" },
  { code: "events.members.manage", name: "Manage Event Members", nameAr: "إدارة أعضاء الفعالية", description: "Manage event stakeholders", module: "EVENTS", action: "MANAGE", resource: "event_members" },
  { code: "events.members.approve", name: "Approve Event Members", nameAr: "قبول أعضاء الفعالية", description: "Approve registrations", module: "EVENTS", action: "APPROVE", resource: "event_members" },
  { code: "events.tracks.manage", name: "Manage Tracks", nameAr: "إدارة المسارات", description: "Manage event tracks", module: "EVENTS", action: "MANAGE", resource: "event_tracks" },
  { code: "events.phases.manage", name: "Manage Phases", nameAr: "إدارة المراحل", description: "Manage event phases", module: "EVENTS", action: "MANAGE", resource: "event_phases" },
  { code: "events.settings.manage", name: "Manage Event Settings", nameAr: "إدارة إعدادات الفعالية", description: "Configure event settings", module: "EVENTS", action: "MANAGE", resource: "event_settings" },
  { code: "events.announcements.manage", name: "Manage Announcements", nameAr: "إدارة الإعلانات", description: "Manage announcements", module: "EVENTS", action: "MANAGE", resource: "announcements" },

  // ── Hackathon-specific ──────────────────────────
  { code: "hackathons.manage", name: "Manage Hackathons", nameAr: "إدارة الهاكاثونات", description: "Full hackathon management", module: "HACKATHONS", action: "MANAGE", resource: "hackathons" },

  // ── Challenge Management ────────────────────────
  { code: "challenges.create", name: "Create Challenges", nameAr: "إنشاء تحديات", description: "Create new challenges", module: "CHALLENGES", action: "CREATE", resource: "challenges" },
  { code: "challenges.read", name: "View Challenges", nameAr: "عرض التحديات", description: "View challenges", module: "CHALLENGES", action: "READ", resource: "challenges" },
  { code: "challenges.update", name: "Update Challenges", nameAr: "تحديث التحديات", description: "Edit challenges", module: "CHALLENGES", action: "UPDATE", resource: "challenges" },
  { code: "challenges.delete", name: "Delete Challenges", nameAr: "حذف التحديات", description: "Remove challenges", module: "CHALLENGES", action: "DELETE", resource: "challenges" },
  { code: "challenges.manage", name: "Manage Challenges", nameAr: "إدارة التحديات", description: "Full challenge management", module: "CHALLENGES", action: "MANAGE", resource: "challenges" },
  { code: "challenges.questions.manage", name: "Manage Questions", nameAr: "إدارة الأسئلة", description: "Manage challenge questions", module: "CHALLENGES", action: "MANAGE", resource: "questions" },

  // ── Team Management ─────────────────────────────
  { code: "teams.create", name: "Create Teams", nameAr: "إنشاء فرق", description: "Create teams", module: "TEAMS", action: "CREATE", resource: "teams" },
  { code: "teams.read", name: "View Teams", nameAr: "عرض الفرق", description: "View teams", module: "TEAMS", action: "READ", resource: "teams" },
  { code: "teams.update", name: "Update Teams", nameAr: "تحديث الفرق", description: "Edit teams", module: "TEAMS", action: "UPDATE", resource: "teams" },
  { code: "teams.manage", name: "Manage Teams", nameAr: "إدارة الفرق", description: "Full team management", module: "TEAMS", action: "MANAGE", resource: "teams" },

  // ── Submission Management ───────────────────────
  { code: "submissions.create", name: "Create Submissions", nameAr: "إنشاء تقديمات", description: "Submit solutions", module: "SUBMISSIONS", action: "CREATE", resource: "submissions" },
  { code: "submissions.read", name: "View Submissions", nameAr: "عرض التقديمات", description: "View submissions", module: "SUBMISSIONS", action: "READ", resource: "submissions" },
  { code: "submissions.read.own", name: "View Own Submissions", nameAr: "عرض تقديماتي", description: "View own submissions", module: "SUBMISSIONS", action: "READ", resource: "own_submissions" },
  { code: "submissions.update", name: "Update Submissions", nameAr: "تحديث التقديمات", description: "Edit submissions", module: "SUBMISSIONS", action: "UPDATE", resource: "submissions" },
  { code: "submissions.manage", name: "Manage Submissions", nameAr: "إدارة التقديمات", description: "Full submission management", module: "SUBMISSIONS", action: "MANAGE", resource: "submissions" },
  { code: "submissions.export", name: "Export Submissions", nameAr: "تصدير التقديمات", description: "Export submission data", module: "SUBMISSIONS", action: "EXPORT", resource: "submissions" },

  // ── Evaluation Management ───────────────────────
  { code: "evaluations.create", name: "Create Evaluations", nameAr: "إنشاء تقييمات", description: "Submit evaluations", module: "EVALUATIONS", action: "CREATE", resource: "evaluations" },
  { code: "evaluations.read", name: "View Evaluations", nameAr: "عرض التقييمات", description: "View evaluations", module: "EVALUATIONS", action: "READ", resource: "evaluations" },
  { code: "evaluations.read.own", name: "View Own Evaluations", nameAr: "عرض تقييماتي", description: "View own evaluation results", module: "EVALUATIONS", action: "READ", resource: "own_evaluations" },
  { code: "evaluations.manage", name: "Manage Evaluations", nameAr: "إدارة التقييمات", description: "Full evaluation management", module: "EVALUATIONS", action: "MANAGE", resource: "evaluations" },
  { code: "evaluations.evaluate", name: "Evaluate Submissions", nameAr: "تقييم التقديمات", description: "Evaluate and score", module: "EVALUATIONS", action: "EVALUATE", resource: "submissions" },
  { code: "evaluations.criteria.manage", name: "Manage Criteria", nameAr: "إدارة معايير التقييم", description: "Manage scoring criteria", module: "EVALUATIONS", action: "MANAGE", resource: "evaluation_criteria" },
  { code: "evaluations.publish", name: "Publish Results", nameAr: "نشر النتائج", description: "Publish evaluation results", module: "EVALUATIONS", action: "PUBLISH", resource: "evaluations" },

  // ── Certificate Management ──────────────────────
  { code: "certificates.create", name: "Create Certificates", nameAr: "إنشاء شهادات", description: "Issue certificates", module: "CERTIFICATES", action: "CREATE", resource: "certificates" },
  { code: "certificates.read", name: "View Certificates", nameAr: "عرض الشهادات", description: "View certificates", module: "CERTIFICATES", action: "READ", resource: "certificates" },
  { code: "certificates.manage", name: "Manage Certificates", nameAr: "إدارة الشهادات", description: "Full certificate management", module: "CERTIFICATES", action: "MANAGE", resource: "certificates" },
  { code: "certificates.templates.manage", name: "Manage Templates", nameAr: "إدارة قوالب الشهادات", description: "Manage certificate templates", module: "CERTIFICATES", action: "MANAGE", resource: "certificate_templates" },

  // ── Reports ─────────────────────────────────────
  { code: "reports.read", name: "View Reports", nameAr: "عرض التقارير", description: "View reports", module: "REPORTS", action: "READ", resource: "reports" },
  { code: "reports.export", name: "Export Reports", nameAr: "تصدير التقارير", description: "Export reports", module: "REPORTS", action: "EXPORT", resource: "reports" },
  { code: "reports.manage", name: "Manage Reports", nameAr: "إدارة التقارير", description: "Full report management", module: "REPORTS", action: "MANAGE", resource: "reports" },

  // ── Research ────────────────────────────────────
  { code: "research.datasets.read", name: "View Datasets", nameAr: "عرض مجموعات البيانات", description: "Access research datasets", module: "RESEARCH", action: "READ", resource: "datasets" },
  { code: "research.datasets.manage", name: "Manage Datasets", nameAr: "إدارة مجموعات البيانات", description: "Manage datasets", module: "RESEARCH", action: "MANAGE", resource: "datasets" },
  { code: "research.access.manage", name: "Manage Research Access", nameAr: "إدارة صلاحيات البحث", description: "Manage research access", module: "RESEARCH", action: "MANAGE", resource: "research_access" },
  { code: "research.export", name: "Export Research Data", nameAr: "تصدير بيانات البحث", description: "Export research data", module: "RESEARCH", action: "EXPORT", resource: "research_data" },

  // ── AI Tools ────────────────────────────────────
  { code: "ai.evaluate", name: "Use AI Evaluation", nameAr: "استخدام التقييم الذكي", description: "Use AI for evaluation", module: "AI_TOOLS", action: "EVALUATE", resource: "ai_evaluation" },
  { code: "ai.manage", name: "Manage AI Config", nameAr: "إدارة إعدادات الذكاء الاصطناعي", description: "Configure AI models", module: "AI_TOOLS", action: "MANAGE", resource: "ai_config" },

  // ── Settings ────────────────────────────────────
  { code: "settings.read", name: "View Settings", nameAr: "عرض الإعدادات", description: "View settings", module: "SETTINGS", action: "READ", resource: "settings" },
  { code: "settings.manage", name: "Manage Settings", nameAr: "إدارة الإعدادات", description: "Full settings management", module: "SETTINGS", action: "MANAGE", resource: "settings" },

  // ── Notifications ───────────────────────────────
  { code: "notifications.read", name: "View Notifications", nameAr: "عرض الإشعارات", description: "View notifications", module: "NOTIFICATIONS", action: "READ", resource: "notifications" },
  { code: "notifications.manage", name: "Manage Notifications", nameAr: "إدارة الإشعارات", description: "Send notifications", module: "NOTIFICATIONS", action: "MANAGE", resource: "notifications" },

  // ── Billing ─────────────────────────────────────
  { code: "billing.read", name: "View Billing", nameAr: "عرض الفواتير", description: "View billing info", module: "BILLING", action: "READ", resource: "billing" },
  { code: "billing.manage", name: "Manage Billing", nameAr: "إدارة الفواتير", description: "Manage billing", module: "BILLING", action: "MANAGE", resource: "billing" },
];

// ============================================================================
// ROLE DEFINITIONS - تعريفات الأدوار
// ============================================================================

export const ROLES: RoleDefinition[] = [
  {
    name: "super_admin",
    nameAr: "مدير أعلى (علم / ماركنير)",
    description: "Elm & Markineer Super Administrator - Full platform control",
    descriptionAr: "المدير الأعلى لشركة علم وماركنير - تحكم كامل بالمنصة",
    level: "SUPER_ADMIN",
    isSystem: true,
    color: "#DC2626",
    icon: "Shield",
    permissions: PERMISSIONS.map((p) => p.code), // ALL permissions
  },
  {
    name: "platform_admin",
    nameAr: "مدير المنصة",
    description: "Platform Administrator - Manages all organizations and events",
    descriptionAr: "مدير المنصة - يدير جميع المؤسسات والفعاليات",
    level: "PLATFORM_ADMIN",
    isSystem: true,
    color: "#7C3AED",
    icon: "Crown",
    permissions: [
      "platform.analytics.read",
      "users.manage", "users.roles.assign", "users.export", "users.import",
      "organizations.manage", "organizations.approve", "organizations.members.manage", "organizations.settings.manage",
      "events.manage", "events.publish", "events.archive", "events.members.manage", "events.members.approve",
      "events.tracks.manage", "events.phases.manage", "events.settings.manage", "events.announcements.manage",
      "hackathons.manage",
      "challenges.manage", "challenges.questions.manage",
      "teams.manage",
      "submissions.manage", "submissions.export",
      "evaluations.manage", "evaluations.criteria.manage", "evaluations.publish",
      "certificates.manage", "certificates.templates.manage",
      "reports.manage", "reports.export",
      "research.datasets.manage", "research.access.manage",
      "ai.manage", "ai.evaluate",
      "settings.manage",
      "notifications.manage",
      "billing.manage",
    ],
  },
  {
    name: "organization_admin",
    nameAr: "مدير المؤسسة",
    description: "Organization Administrator - Full control within their organization",
    descriptionAr: "مدير المؤسسة - تحكم كامل داخل المؤسسة",
    level: "ORGANIZATION_ADMIN",
    isSystem: true,
    color: "#2563EB",
    icon: "Building2",
    permissions: [
      "organizations.read", "organizations.update",
      "organizations.members.manage", "organizations.settings.manage",
      "users.read",
      "events.create", "events.read", "events.update", "events.delete",
      "events.publish", "events.archive",
      "events.members.manage", "events.members.approve",
      "events.tracks.manage", "events.phases.manage",
      "events.settings.manage", "events.announcements.manage",
      "hackathons.manage",
      "challenges.manage", "challenges.questions.manage",
      "teams.manage",
      "submissions.manage", "submissions.export",
      "evaluations.manage", "evaluations.criteria.manage", "evaluations.publish",
      "certificates.manage",
      "reports.read", "reports.export",
      "ai.evaluate",
      "notifications.manage",
      "billing.read",
    ],
  },
  {
    name: "event_manager",
    nameAr: "مدير الفعالية / المشرف",
    description: "Event Manager/Supervisor - Manages a specific event",
    descriptionAr: "مدير الفعالية - إدارة الفعالية ومتابعة التقدم وإصدار التقارير",
    level: "EVENT_MANAGER",
    isSystem: true,
    color: "#059669",
    icon: "Settings",
    permissions: [
      "events.read", "events.update",
      "events.members.manage", "events.members.approve",
      "events.tracks.manage", "events.phases.manage",
      "events.settings.manage", "events.announcements.manage",
      "challenges.manage", "challenges.questions.manage",
      "teams.manage",
      "submissions.read", "submissions.manage", "submissions.export",
      "evaluations.manage", "evaluations.criteria.manage", "evaluations.publish",
      "certificates.create", "certificates.read",
      "reports.read", "reports.export",
      "ai.evaluate",
      "notifications.manage",
    ],
  },
  {
    name: "judge",
    nameAr: "محكّم",
    description: "Judge - Evaluates projects, gives scores, selects winners",
    descriptionAr: "المحكّم - تقييم المشاريع ومنح الدرجات واختيار الفائزين",
    level: "JUDGE",
    isSystem: true,
    color: "#D97706",
    icon: "Scale",
    permissions: [
      "events.read",
      "teams.read",
      "submissions.read",
      "evaluations.create", "evaluations.read", "evaluations.evaluate",
      "reports.read",
      "notifications.read",
    ],
  },
  {
    name: "mentor",
    nameAr: "مرشد",
    description: "Mentor - Guides teams, reviews ideas, provides feedback",
    descriptionAr: "المرشد - توجيه الفرق ومراجعة الأفكار وتقديم التغذية الراجعة",
    level: "MENTOR",
    isSystem: true,
    color: "#7C3AED",
    icon: "GraduationCap",
    permissions: [
      "events.read",
      "teams.read",
      "submissions.read",
      "evaluations.read.own",
      "notifications.read",
    ],
  },
  {
    name: "expert",
    nameAr: "خبير",
    description: "Expert - Provides domain expertise and consultation",
    descriptionAr: "الخبير - تقديم الخبرة المتخصصة والاستشارات",
    level: "EXPERT",
    isSystem: true,
    color: "#0891B2",
    icon: "Star",
    permissions: [
      "events.read",
      "teams.read",
      "submissions.read",
      "evaluations.read",
      "notifications.read",
    ],
  },
  {
    name: "participant",
    nameAr: "مشارك",
    description: "Participant - Registers, submits solutions, interacts with mentors",
    descriptionAr: "المشارك - تسجيل الفرق ورفع المشاريع والتفاعل مع المرشدين",
    level: "PARTICIPANT",
    isSystem: true,
    color: "#1F2937",
    icon: "User",
    permissions: [
      "events.read",
      "teams.create", "teams.read", "teams.update",
      "submissions.create", "submissions.read.own", "submissions.update",
      "evaluations.read.own",
      "certificates.read",
      "challenges.read",
      "notifications.read",
    ],
  },
  {
    name: "researcher",
    nameAr: "باحث",
    description: "Researcher - Accesses anonymized data for scientific research",
    descriptionAr: "الباحث - الوصول لبيانات التحديات وتطوير الأبحاث العلمية وتحليل سلوكيات المتعلمين",
    level: "RESEARCHER",
    isSystem: true,
    color: "#0EA5E9",
    icon: "FlaskConical",
    permissions: [
      "research.datasets.read",
      "research.export",
      "reports.read",
      "notifications.read",
    ],
  },
  {
    name: "viewer",
    nameAr: "مشاهد",
    description: "Viewer - Read-only access to public content",
    descriptionAr: "مشاهد - عرض المحتوى العام فقط",
    level: "VIEWER",
    isSystem: true,
    color: "#6B7280",
    icon: "Eye",
    permissions: [
      "events.read",
      "notifications.read",
    ],
  },
];

// ============================================================================
// PERMISSION CHECK HELPERS
// ============================================================================

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // Super admin has all permissions
  if (userPermissions.includes("platform.manage")) return true;

  // Check for manage permission on the module
  const [module] = requiredPermission.split(".");
  if (userPermissions.includes(`${module}.manage`)) return true;

  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((p) => hasPermission(userPermissions, p));
}

export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((p) => hasPermission(userPermissions, p));
}

export function getRoleByLevel(level: RoleLevel): RoleDefinition | undefined {
  return ROLES.find((r) => r.level === level);
}

export function getPermissionsByModule(
  module: PermissionModule
): PermissionDefinition[] {
  return PERMISSIONS.filter((p) => p.module === module);
}
