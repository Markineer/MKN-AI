"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import {
  Building2,
  Users,
  Calendar,
  Layers,
  Plus,
  Search,
  ChevronLeft,
  ChevronDown,
  Loader2,
  X,
  CheckCircle,
  MapPin,
  GraduationCap,
  Briefcase,
  Landmark,
  Heart,
  Trophy,
  FileText,
  UserPlus,
  Shield,
  Crown,
  Eye,
} from "lucide-react";

/* ═══ Types ═══ */
interface DeptData {
  id: string;
  name: string;
  nameAr: string;
  headId: string | null;
  isActive: boolean;
  members: MemberData[];
  events: EventMin[];
  _count: { members: number; events: number };
}

interface MemberData {
  id: string;
  role: string;
  titleAr: string | null;
  departmentId: string | null;
  isActive: boolean;
  user: {
    id: string;
    firstName: string | null;
    firstNameAr: string | null;
    lastName: string | null;
    lastNameAr: string | null;
    email: string;
    avatar: string | null;
    isActive?: boolean;
  };
  department: { id: string; nameAr: string } | null;
}

interface EventMin {
  id: string;
  title: string;
  titleAr: string;
  type: string;
  status: string;
  startDate: string;
  departmentId?: string | null;
}

interface OrgFull {
  id: string;
  name: string;
  nameAr: string;
  type: string;
  sector: string;
  city: string | null;
  email: string | null;
  website: string | null;
  isVerified: boolean;
  subscriptionPlan: string;
  primaryColor: string | null;
  descriptionAr: string | null;
  _count: { members: number; events: number; departments: number };
  departments: DeptData[];
  events: EventMin[];
  members: MemberData[];
}

/* ═══ Maps ═══ */
const typeLabels: Record<string, string> = { UNIVERSITY: "جامعة", COMPANY: "شركة", GOVERNMENT: "جهة حكومية", NON_PROFIT: "جهة خيرية", RESEARCH_CENTER: "مركز بحثي", TRAINING_CENTER: "مركز تدريب", OTHER: "أخرى" };
const typeIcons: Record<string, any> = { UNIVERSITY: GraduationCap, COMPANY: Briefcase, GOVERNMENT: Landmark, NON_PROFIT: Heart, RESEARCH_CENTER: Building2, TRAINING_CENTER: Building2 };
const sectorLabels: Record<string, string> = { EDUCATION: "تعليم", TECHNOLOGY: "تقنية", HEALTH: "صحة", LEGAL: "قانوني", FINANCE: "مالية", ENERGY: "طاقة", TOURISM: "سياحة", ENTREPRENEURSHIP: "ريادة أعمال", SUSTAINABILITY: "استدامة", ENGINEERING: "هندسة", OTHER: "أخرى" };
const roleLabels: Record<string, string> = { OWNER: "مالك", ADMIN: "مدير", DEPARTMENT_HEAD: "رئيس قسم", COORDINATOR: "منسق", MEMBER: "عضو" };
const roleColors: Record<string, string> = { OWNER: "bg-amber-50 text-amber-700", ADMIN: "bg-purple-50 text-purple-700", DEPARTMENT_HEAD: "bg-blue-50 text-blue-700", COORDINATOR: "bg-teal-50 text-teal-700", MEMBER: "bg-gray-100 text-gray-600" };
const roleIcons: Record<string, any> = { OWNER: Crown, ADMIN: Shield, DEPARTMENT_HEAD: GraduationCap, COORDINATOR: Users, MEMBER: Eye };
const statusLabels: Record<string, string> = { DRAFT: "مسودة", PUBLISHED: "منشور", REGISTRATION_OPEN: "التسجيل مفتوح", IN_PROGRESS: "جاري", EVALUATION: "تقييم", COMPLETED: "مكتمل" };
const statusColors: Record<string, string> = { DRAFT: "bg-gray-100 text-gray-600", PUBLISHED: "bg-blue-50 text-blue-700", REGISTRATION_OPEN: "bg-emerald-50 text-emerald-700", IN_PROGRESS: "bg-purple-50 text-purple-700", EVALUATION: "bg-amber-50 text-amber-700", COMPLETED: "bg-teal-50 text-teal-700" };

/* ═══ Tabs ═══ */
const TABS = [
  { id: "departments", label: "الأقسام", icon: Layers },
  { id: "members", label: "الأعضاء", icon: Users },
  { id: "events", label: "الفعاليات", icon: Calendar },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<OrgFull | null>(null);
  const [departments, setDepartments] = useState<DeptData[]>([]);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("departments");
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, deptRes, memRes] = await Promise.all([
        fetch(`/api/organizations/${id}`),
        fetch(`/api/organizations/${id}/departments`),
        fetch(`/api/organizations/${id}/members`),
      ]);
      const orgData = await orgRes.json();
      const deptData = await deptRes.json();
      const memData = await memRes.json();
      setOrg(orgData);
      setDepartments(deptData.departments || []);
      setMembers(memData.members || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        <span className="mr-2 text-sm text-gray-500">جاري التحميل...</span>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
        <Building2 className="w-12 h-12 mb-3" />
        <p className="text-sm">المؤسسة غير موجودة</p>
        <Link href="/admin/organizations" className="text-brand-500 text-sm mt-2 hover:underline">العودة</Link>
      </div>
    );
  }

  const TypeIcon = typeIcons[org.type] || Building2;

  return (
    <div>
      <TopBar title="Organization" titleAr={org.nameAr} />

      <div className="p-8">
        {/* ═══ Back link ═══ */}
        <Link href="/admin/organizations" className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-500 transition-colors mb-4 cursor-pointer">
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          العودة للمؤسسات
        </Link>

        {/* ═══ Header Card ═══ */}
        <div className="bento-card p-6 mb-6 animate-fade-in-up">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                style={{ backgroundColor: org.primaryColor || "#7C3AED" }}
              >
                {org.nameAr.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-elm-navy">{org.nameAr}</h1>
                  {org.isVerified && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                </div>
                {org.name && <p className="text-sm text-gray-400">{org.name}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    <TypeIcon className="w-3.5 h-3.5" />
                    {typeLabels[org.type] || org.type}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    {sectorLabels[org.sector] || org.sector}
                  </span>
                  {org.city && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" /> {org.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddDept(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> قسم جديد
              </button>
              <button onClick={() => setShowAddMember(true)} className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white rounded-xl text-xs font-medium hover:bg-brand-600 transition-colors cursor-pointer">
                <UserPlus className="w-3.5 h-3.5" /> إضافة عضو
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
            {[
              { label: "عضو", value: members.length, icon: Users, color: "text-brand-500" },
              { label: "قسم", value: departments.length, icon: Layers, color: "text-blue-500" },
              { label: "فعالية", value: org._count.events, icon: Calendar, color: "text-emerald-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <span className="text-lg font-extrabold text-elm-navy">{s.value}</span>
                  <span className="text-xs text-gray-400 mr-1">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Tabs ═══ */}
        <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                tab === t.id
                  ? "bg-brand-50 text-brand-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ Tab Content ═══ */}
        {tab === "departments" && (
          <DepartmentsTab
            departments={departments}
            expandedDept={expandedDept}
            setExpandedDept={setExpandedDept}
            orgId={id}
            onRefresh={fetchAll}
          />
        )}
        {tab === "members" && (
          <MembersTab members={members} departments={departments} orgId={id} onRefresh={fetchAll} />
        )}
        {tab === "events" && (
          <EventsTab events={org.events || []} departments={departments} />
        )}
      </div>

      {/* Modals */}
      {showAddDept && <AddDepartmentModal orgId={id} onClose={() => setShowAddDept(false)} onSuccess={fetchAll} />}
      {showAddMember && <AddMemberModal orgId={id} departments={departments} onClose={() => setShowAddMember(false)} onSuccess={fetchAll} />}
    </div>
  );
}

/* ═══════════════════════ DEPARTMENTS TAB ═══════════════════════ */
function DepartmentsTab({ departments, expandedDept, setExpandedDept, orgId, onRefresh }: {
  departments: DeptData[];
  expandedDept: string | null;
  setExpandedDept: (id: string | null) => void;
  orgId: string;
  onRefresh: () => void;
}) {
  if (departments.length === 0) {
    return (
      <div className="bento-card p-12 text-center animate-fade-in-up">
        <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400 mb-1">لا توجد أقسام بعد</p>
        <p className="text-xs text-gray-400">أضف أول قسم لبدء تنظيم المؤسسة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {departments.map((dept, i) => {
        const isExpanded = expandedDept === dept.id;
        const head = dept.members.find((m) => m.user.id === dept.headId);
        return (
          <div key={dept.id} className={`bento-card overflow-hidden animate-fade-in-up delay-${i + 1}`}>
            {/* Department card header */}
            <button
              onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-elm-navy">{dept.nameAr}</h3>
                  {head && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      رئيس القسم: {head.user.firstNameAr || head.user.firstName} {head.user.lastNameAr || head.user.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5" /> {dept._count.members} عضو
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" /> {dept._count.events} فعالية
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
              </div>
            </button>

            {/* Expanded content */}
            <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="border-t border-gray-100 p-5 space-y-4">
                {/* Department members */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">أعضاء القسم</h4>
                  {dept.members.length === 0 ? (
                    <p className="text-xs text-gray-400 py-3">لا يوجد أعضاء في هذا القسم</p>
                  ) : (
                    <div className="space-y-2">
                      {dept.members.map((m) => {
                        const RIcon = roleIcons[m.role] || Eye;
                        return (
                          <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                              {(m.user.firstNameAr || m.user.firstName || "?").charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-elm-navy truncate">
                                {m.user.firstNameAr || m.user.firstName} {m.user.lastNameAr || m.user.lastName}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                            </div>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${roleColors[m.role] || "bg-gray-100 text-gray-600"}`}>
                              <RIcon className="w-3 h-3" />
                              {roleLabels[m.role] || m.role}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Department events */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">فعاليات القسم</h4>
                  {dept.events.length === 0 ? (
                    <p className="text-xs text-gray-400 py-3">لا توجد فعاليات لهذا القسم</p>
                  ) : (
                    <div className="space-y-2">
                      {dept.events.map((ev) => (
                        <Link
                          key={ev.id}
                          href={`/event/${ev.id}/settings`}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 hover:bg-brand-50/50 transition-colors group cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            ev.type === "HACKATHON" ? "bg-purple-100" : "bg-blue-100"
                          }`}>
                            {ev.type === "HACKATHON" ? (
                              <Trophy className="w-4 h-4 text-purple-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-elm-navy group-hover:text-brand-600 transition-colors truncate">{ev.titleAr || ev.title}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusColors[ev.status] || "bg-gray-100 text-gray-600"}`}>
                            {statusLabels[ev.status] || ev.status}
                          </span>
                          <ChevronLeft className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-400 transition-colors" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════ MEMBERS TAB ═══════════════════════ */
function MembersTab({ members, departments, orgId, onRefresh }: {
  members: MemberData[];
  departments: DeptData[];
  orgId: string;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.user.email?.toLowerCase().includes(q) ||
      m.user.firstNameAr?.includes(search) ||
      m.user.lastNameAr?.includes(search) ||
      m.user.firstName?.toLowerCase().includes(q) ||
      m.user.lastName?.toLowerCase().includes(q)
    );
  });

  async function updateMember(memberId: string, data: Record<string, any>) {
    await fetch(`/api/organizations/${orgId}/members`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, ...data }),
    });
    onRefresh();
  }

  return (
    <div className="animate-fade-in-up">
      {/* Search bar */}
      <div className="relative max-w-md mb-4">
        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو البريد..."
          className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bento-card p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{search ? "لا توجد نتائج" : "لا يوجد أعضاء بعد"}</p>
        </div>
      ) : (
        <div className="bento-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400">العضو</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400">الدور</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400">القسم</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const RIcon = roleIcons[m.role] || Eye;
                return (
                  <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 text-sm font-bold">
                          {(m.user.firstNameAr || m.user.firstName || "?").charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-elm-navy">
                            {m.user.firstNameAr || m.user.firstName} {m.user.lastNameAr || m.user.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{m.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={m.role}
                        onChange={(e) => updateMember(m.id, { role: e.target.value })}
                        className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs cursor-pointer"
                      >
                        <option value="OWNER">مالك</option>
                        <option value="ADMIN">مدير</option>
                        <option value="DEPARTMENT_HEAD">رئيس قسم</option>
                        <option value="COORDINATOR">منسق</option>
                        <option value="MEMBER">عضو</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={m.departmentId || ""}
                        onChange={(e) => updateMember(m.id, { departmentId: e.target.value || null })}
                        className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs cursor-pointer"
                      >
                        <option value="">بدون قسم</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.nameAr}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium w-fit ${roleColors[m.role]}`}>
                        <RIcon className="w-3 h-3" />
                        {roleLabels[m.role] || m.role}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ EVENTS TAB ═══════════════════════ */
function EventsTab({ events, departments }: { events: EventMin[]; departments: DeptData[] }) {
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.nameAr]));

  // Group events: collect all department events from departments, then unassigned from org.events
  const deptEvents: Record<string, EventMin[]> = {};
  const unassigned: EventMin[] = [];

  // Get events from departments (already associated)
  departments.forEach((dept) => {
    if (dept.events.length > 0) {
      deptEvents[dept.id] = dept.events;
    }
  });

  // Org-level events that have no departmentId
  events.forEach((ev) => {
    if (!ev.departmentId) {
      // Check it's not already in a dept
      const alreadyListed = departments.some((d) => d.events.some((de) => de.id === ev.id));
      if (!alreadyListed) {
        unassigned.push(ev);
      }
    }
  });

  const hasDeptEvents = Object.keys(deptEvents).length > 0;

  if (!hasDeptEvents && unassigned.length === 0 && events.length === 0) {
    return (
      <div className="bento-card p-12 text-center animate-fade-in-up">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">لا توجد فعاليات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Events by department */}
      {departments.map((dept) => {
        const devts = deptEvents[dept.id];
        if (!devts || devts.length === 0) return null;
        return (
          <div key={dept.id}>
            <h3 className="text-sm font-bold text-elm-navy mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              {dept.nameAr}
              <span className="text-xs font-normal text-gray-400">({devts.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {devts.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Unassigned events */}
      {(unassigned.length > 0 || (!hasDeptEvents && events.length > 0)) && (
        <div>
          <h3 className="text-sm font-bold text-elm-navy mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            {hasDeptEvents ? "بدون قسم" : "جميع الفعاليات"}
            <span className="text-xs font-normal text-gray-400">({unassigned.length > 0 ? unassigned.length : events.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(unassigned.length > 0 ? unassigned : events).map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: EventMin }) {
  return (
    <Link
      href={`/event/${event.id}/settings`}
      className="bento-card p-4 flex items-center gap-3 group cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        event.type === "HACKATHON" ? "bg-gradient-to-br from-brand-500 to-purple-600" : "bg-gradient-to-br from-blue-500 to-cyan-500"
      }`}>
        {event.type === "HACKATHON" ? <Trophy className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-elm-navy group-hover:text-brand-600 transition-colors truncate">{event.titleAr || event.title}</p>
        <p className="text-xs text-gray-400">{new Date(event.startDate).toLocaleDateString("ar-SA")}</p>
      </div>
      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusColors[event.status] || "bg-gray-100 text-gray-600"}`}>
        {statusLabels[event.status] || event.status}
      </span>
      <ChevronLeft className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-400 transition-colors" />
    </Link>
  );
}

/* ═══════════════════════ ADD DEPARTMENT MODAL ═══════════════════════ */
function AddDepartmentModal({ orgId, onClose, onSuccess }: { orgId: string; onClose: () => void; onSuccess: () => void }) {
  const [nameAr, setNameAr] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!nameAr.trim()) { setError("اسم القسم مطلوب"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/organizations/${orgId}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameAr, name: name || nameAr }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "فشل الإنشاء"); }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-elm-navy">إضافة قسم جديد</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl">{error}</div>}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">اسم القسم (عربي) *</label>
            <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="input-field" placeholder="مثال: قسم علوم الحاسب" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name (English)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="e.g. Computer Science" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer">إلغاء</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة القسم
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ ADD MEMBER MODAL (Invitation Flow) ═══════════════════════ */
function AddMemberModal({ orgId, departments, onClose, onSuccess }: { orgId: string; departments: DeptData[]; onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [deptId, setDeptId] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ message: string; acceptUrl?: string; emailSent?: boolean } | null>(null);

  async function handleSubmit() {
    if (!email.trim()) { setError("البريد الإلكتروني مطلوب"); return; }
    setSaving(true);
    setError("");
    setSuccess(null);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          organizationId: orgId,
          role,
          departmentId: deptId || null,
          titleAr: titleAr || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإرسال");

      setSuccess({
        message: data.emailSent
          ? "تم إرسال الدعوة على البريد الإلكتروني بنجاح"
          : "تم إنشاء الدعوة بنجاح",
        acceptUrl: data.acceptUrl,
        emailSent: data.emailSent,
      });
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-elm-navy">دعوة عضو جديد</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-elm-navy mb-2">{success.message}</p>
            {success.emailSent && (
              <p className="text-xs text-gray-400 mb-3">تم إرسال الرسالة على البريد الإلكتروني</p>
            )}
            {success.acceptUrl && (
              <div className="bg-gray-50 rounded-xl p-3 mt-3">
                <p className="text-xs text-gray-400 mb-1.5">رابط الدعوة:</p>
                <p className="text-xs text-brand-600 break-all font-mono mb-2" dir="ltr">{success.acceptUrl}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(success.acceptUrl!); }}
                  className="text-xs text-brand-500 hover:text-brand-700 font-medium cursor-pointer"
                >
                  نسخ الرابط
                </button>
              </div>
            )}
            <button onClick={() => { onSuccess(); onClose(); }} className="btn-primary text-sm mt-4 cursor-pointer">
              حسناً
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4">
              <div className="bg-brand-50/50 rounded-xl p-3 flex items-start gap-2">
                <Shield className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-brand-700 leading-relaxed">سيتم إرسال بريد إلكتروني للمدعو مع رابط لإنشاء كلمة المرور والانضمام للمؤسسة.</p>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl">{error}</div>}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">البريد الإلكتروني *</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input-field" placeholder="user@example.com" dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">الدور</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field cursor-pointer">
                    <option value="ADMIN">مدير المؤسسة</option>
                    <option value="DEPARTMENT_HEAD">رئيس قسم</option>
                    <option value="COORDINATOR">منسق</option>
                    <option value="MEMBER">عضو</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">القسم</label>
                  <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="input-field cursor-pointer">
                    <option value="">بدون قسم</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.nameAr}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">المسمى الوظيفي</label>
                <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="input-field" placeholder="مثال: مشرف الهاكاثون" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer">إلغاء</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                إرسال الدعوة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
