"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import TopBar from "@/components/layout/TopBar";
import {
  Shield,
  Users,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  Edit,
  Lock,
  Crown,
  Building2,
  Calendar,
  Scale,
  GraduationCap,
  Star,
  User,
  FlaskConical,
  Loader2,
  Save,
  Search,
  UserPlus,
  X,
  Trash2,
} from "lucide-react";

/* ────────── Types ────────── */
interface RoleData {
  id: string;
  name: string;
  nameAr: string;
  descriptionAr: string | null;
  level: string;
  color: string;
  icon: string | null;
  isSystem: boolean;
  _count: { users: number };
  permissions: {
    permission: { id: string; code: string; nameAr: string; module: string };
  }[];
}

interface PermissionItem {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  module: string;
  action: string;
}

interface RoleMember {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    firstNameAr?: string;
    lastName?: string;
    lastNameAr?: string;
    avatar?: string;
    isActive?: boolean;
  };
}

interface SearchUser {
  id: string;
  email: string;
  firstName?: string;
  firstNameAr?: string;
  lastName?: string;
  lastNameAr?: string;
  avatar?: string;
}

/* ────────── Icon Maps ────────── */
const iconMap: Record<string, any> = {
  crown: Crown,
  shield: Shield,
  building: Building2,
  calendar: Calendar,
  scale: Scale,
  graduation: GraduationCap,
  star: Star,
  user: User,
  flask: FlaskConical,
  eye: Eye,
};

const moduleLabels: Record<string, { nameAr: string; icon: any }> = {
  PLATFORM: { nameAr: "إدارة المنصة", icon: Settings },
  USERS: { nameAr: "إدارة المستخدمين", icon: Users },
  ORGANIZATIONS: { nameAr: "إدارة المؤسسات", icon: Building2 },
  EVENTS: { nameAr: "إدارة الفعاليات", icon: Calendar },
  HACKATHONS: { nameAr: "الهاكاثونات", icon: Calendar },
  CHALLENGES: { nameAr: "التحديات", icon: Scale },
  EVALUATIONS: { nameAr: "التقييمات", icon: Scale },
  TEAMS: { nameAr: "الفرق", icon: Users },
  SUBMISSIONS: { nameAr: "التقديمات", icon: Edit },
  CERTIFICATES: { nameAr: "الشهادات", icon: Star },
  REPORTS: { nameAr: "التقارير", icon: Eye },
  RESEARCH: { nameAr: "البحث العلمي", icon: FlaskConical },
  MENTORING: { nameAr: "الإرشاد", icon: GraduationCap },
  AI_TOOLS: { nameAr: "أدوات الذكاء الاصطناعي", icon: Star },
  SETTINGS: { nameAr: "الإعدادات", icon: Settings },
  NOTIFICATIONS: { nameAr: "الإشعارات", icon: Eye },
  BILLING: { nameAr: "الفواتير", icon: Building2 },
};

/* ────────── Toggle Switch ────────── */
function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        disabled ? "cursor-default opacity-50" : "cursor-pointer"
      } ${enabled ? "bg-brand-500" : "bg-gray-200"}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "-translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ────────── Add User Modal ────────── */
function AddUserModal({
  roleId,
  roleName,
  onClose,
  onAdded,
}: {
  roleId: string;
  roleName: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState("");

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(q)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || data || []);
      }
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(query), 400);
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  async function assignUser(userId: string) {
    setAssigning(userId);
    setError("");
    try {
      const res = await fetch(`/api/roles/${roleId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "فشل تعيين المستخدم");
        return;
      }
      onAdded();
      onClose();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-elm-navy">إضافة مستخدم</h3>
            <p className="text-xs text-gray-400 mt-0.5">إضافة مستخدم إلى دور: {roleName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-5">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none"
              autoFocus
            />
          </div>

          {error && (
            <div className="mt-3 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
          )}

          {/* Results */}
          <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
            {searching && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              </div>
            )}
            {!searching && query.length >= 2 && results.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-6">لا توجد نتائج</p>
            )}
            {!searching && results.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm">
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      (u.firstNameAr || u.firstName || u.email)?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-elm-navy">
                      {u.firstNameAr || u.firstName || ""} {u.lastNameAr || u.lastName || ""}
                    </p>
                    <p className="text-[11px] text-gray-400">{u.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => assignUser(u.id)}
                  disabled={assigning === u.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-xs font-bold rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  {assigning === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                  تعيين
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────── Main Page ────────── */
export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, PermissionItem[]>>({});
  const [loading, setLoading] = useState(true);

  // Editing state
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editedPerms, setEditedPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Members
  const [members, setMembers] = useState<RoleMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  // Expanded modules
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  async function fetchData() {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/permissions"),
      ]);
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      setRoles(rolesData.roles || []);
      setPermissionsByModule(permsData.grouped || {});
    } catch {
      setRoles([]);
      setPermissionsByModule({});
    } finally {
      setLoading(false);
    }
  }

  async function fetchMembers(roleId: string) {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/roles/${roleId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data || []);
      }
    } catch { setMembers([]); } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function getRoleIcon(role: RoleData) {
    if (role.icon && iconMap[role.icon.toLowerCase()]) return iconMap[role.icon.toLowerCase()];
    if (role.level === "SUPER_ADMIN") return Crown;
    if (role.level === "PLATFORM_ADMIN") return Shield;
    if (role.level === "ORGANIZATION_ADMIN") return Building2;
    if (role.level === "EVENT_MANAGER") return Calendar;
    if (role.level === "JUDGE") return Scale;
    if (role.level === "MENTOR") return GraduationCap;
    if (role.level === "EXPERT") return Star;
    if (role.level === "PARTICIPANT") return User;
    if (role.level === "RESEARCHER") return FlaskConical;
    if (role.level === "VIEWER") return Eye;
    return Shield;
  }

  function selectRole(role: RoleData) {
    setSelectedRole(role.id);
    setEditedPerms(new Set(role.permissions.map((p) => p.permission.id)));
    setIsEditing(false);
    setSaveMsg("");
    setExpandedModules(new Set());
    fetchMembers(role.id);
  }

  function togglePermission(permId: string) {
    setEditedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  }

  function toggleModule(moduleName: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleName)) next.delete(moduleName);
      else next.add(moduleName);
      return next;
    });
  }

  function toggleAllModulePerms(perms: PermissionItem[]) {
    const allEnabled = perms.every((p) => editedPerms.has(p.id));
    setEditedPerms((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => {
        if (allEnabled) next.delete(p.id);
        else next.add(p.id);
      });
      return next;
    });
  }

  async function savePermissions() {
    if (!selectedRole) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/roles/${selectedRole}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: Array.from(editedPerms) }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      setSaveMsg("تم الحفظ بنجاح");
      setIsEditing(false);
      await fetchData();
    } catch {
      setSaveMsg("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(userId: string) {
    if (!selectedRole) return;
    try {
      await fetch(`/api/roles/${selectedRole}/members?userId=${userId}`, { method: "DELETE" });
      fetchMembers(selectedRole);
      fetchData();
    } catch { /* ignore */ }
  }

  const selectedRoleData = roles.find((r) => r.id === selectedRole);

  if (loading) {
    return (
      <div>
        <TopBar title="Roles & Permissions" titleAr="الأدوار والصلاحيات" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <span className="mr-2 text-sm text-gray-500">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Roles & Permissions" titleAr="الأدوار والصلاحيات" />
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">نظام الأدوار والصلاحيات</h2>
            <p className="text-sm text-gray-500 mt-1">
              إدارة أدوار المستخدمين وصلاحياتهم على مستوى المنصة والمؤسسات والفعاليات
            </p>
          </div>
        </div>

        {/* Save Message */}
        {saveMsg && (
          <div className={`px-4 py-2 rounded-xl text-sm ${saveMsg.includes("نجاح") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {saveMsg}
          </div>
        )}

        {/* Role Hierarchy */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-elm-navy mb-6">هرمية الأدوار</h3>
          <div className="flex items-start gap-2 overflow-x-auto pb-4">
            {roles.map((role, index) => {
              const Icon = getRoleIcon(role);
              const isSelected = selectedRole === role.id;
              return (
                <div key={role.id} className="flex items-center">
                  <button
                    onClick={() => selectRole(role)}
                    className="flex flex-col items-center min-w-[120px] group"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-2 transition-all ${
                        isSelected ? "ring-3 ring-brand-400 scale-110" : "group-hover:scale-105"
                      }`}
                      style={{ backgroundColor: role.color }}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <p className={`text-xs font-bold text-center leading-tight ${isSelected ? "text-brand-600" : "text-elm-navy"}`}>
                      {role.nameAr}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {role._count.users} مستخدم
                    </p>
                  </button>
                  {index < roles.length - 1 && (
                    <ChevronLeft className="w-5 h-5 text-gray-300 flex-shrink-0 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Cards Grid */}
        <div>
          <h3 className="text-lg font-bold text-elm-navy mb-4">جميع الأدوار</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {roles.map((role) => {
              const Icon = getRoleIcon(role);
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => selectRole(role)}
                  className={`text-right bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                    isSelected ? "border-brand-500 ring-2 ring-brand-200 shadow-md" : "border-gray-100 hover:shadow-md hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: role.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-elm-navy">{role.nameAr}</h4>
                        <p className="text-[10px] text-gray-400">{role.level}</p>
                      </div>
                    </div>
                    {role.isSystem && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        <Lock className="w-3 h-3" />
                        نظام
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{role.descriptionAr || "—"}</p>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-elm-navy">{role._count.users}</p>
                      <p className="text-[10px] text-gray-400">مستخدم</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-brand-500">{role.permissions.length}</p>
                      <p className="text-[10px] text-gray-400">صلاحية</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Role Detail Panel */}
        {selectedRoleData && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Panel Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: selectedRoleData.color }}
                  >
                    {(() => { const I = getRoleIcon(selectedRoleData); return <I className="w-6 h-6" />; })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-elm-navy">{selectedRoleData.nameAr}</h3>
                    <p className="text-xs text-gray-400">{selectedRoleData.descriptionAr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedPerms(new Set(selectedRoleData.permissions.map((p) => p.permission.id)));
                        }}
                        className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={savePermissions}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        حفظ التغييرات
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      تعديل الصلاحيات
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Two-column layout: Permissions + Members */}
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* Permissions - Expandable Modules */}
              <div className="lg:col-span-2 p-6 border-l border-gray-100">
                <h4 className="text-sm font-bold text-elm-navy mb-4">الصلاحيات</h4>
                <div className="space-y-2">
                  {Object.entries(permissionsByModule).map(([moduleName, perms]) => {
                    const moduleInfo = moduleLabels[moduleName] || { nameAr: moduleName, icon: Settings };
                    const ModIcon = moduleInfo.icon;
                    const isExpanded = expandedModules.has(moduleName);
                    const enabledCount = perms.filter((p) => editedPerms.has(p.id)).length;
                    const allEnabled = enabledCount === perms.length;

                    return (
                      <div key={moduleName} className="border border-gray-100 rounded-xl overflow-hidden">
                        {/* Module Header */}
                        <button
                          onClick={() => toggleModule(moduleName)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ModIcon className="w-4 h-4 text-brand-500" />
                            <span className="text-sm font-bold text-elm-navy">{moduleInfo.nameAr}</span>
                            <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {enabledCount}/{perms.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {isEditing && isExpanded && (
                              <div onClick={(e) => { e.stopPropagation(); toggleAllModulePerms(perms); }}>
                                <Toggle enabled={allEnabled} onChange={() => toggleAllModulePerms(perms)} />
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Permissions */}
                        {isExpanded && (
                          <div className="border-t border-gray-100">
                            {perms.map((perm) => {
                              const hasPerm = editedPerms.has(perm.id);
                              return (
                                <div
                                  key={perm.id}
                                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50 border-b border-gray-50 last:border-b-0"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600">{perm.nameAr}</span>
                                    <span className="text-[10px] text-gray-300 font-mono">{perm.code}</span>
                                  </div>
                                  <Toggle
                                    enabled={hasPerm}
                                    onChange={() => togglePermission(perm.id)}
                                    disabled={!isEditing}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Members */}
              <div className="p-6 bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-elm-navy">
                    المستخدمون ({members.length})
                  </h4>
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-xs font-bold rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    إضافة
                  </button>
                </div>

                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">لا يوجد مستخدمون بهذا الدور</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xs">
                            {m.user.avatar ? (
                              <img src={m.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              (m.user.firstNameAr || m.user.firstName || m.user.email)?.[0]?.toUpperCase() || "?"
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-elm-navy">
                              {m.user.firstNameAr || m.user.firstName || ""} {m.user.lastNameAr || m.user.lastName || ""}
                            </p>
                            <p className="text-[10px] text-gray-400">{m.user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeMember(m.user.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="إزالة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && selectedRoleData && (
        <AddUserModal
          roleId={selectedRoleData.id}
          roleName={selectedRoleData.nameAr}
          onClose={() => setShowAddUser(false)}
          onAdded={() => {
            fetchMembers(selectedRoleData.id);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
