"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import {
  Plus,
  Search,
  Building2,
  GraduationCap,
  Briefcase,
  Landmark,
  Heart,
  MoreVertical,
  Users,
  Calendar,
  CheckCircle,
  MapPin,
  Loader2,
  X,
  ChevronLeft,
} from "lucide-react";

interface OrgData {
  id: string;
  name: string;
  nameAr: string;
  type: string;
  sector: string;
  city: string | null;
  isActive: boolean;
  isVerified: boolean;
  subscriptionPlan: string;
  primaryColor: string | null;
  _count: { members: number; events: number };
}

const typeIcons: Record<string, any> = {
  UNIVERSITY: GraduationCap,
  COMPANY: Briefcase,
  GOVERNMENT: Landmark,
  NON_PROFIT: Heart,
  RESEARCH_CENTER: Building2,
  TRAINING_CENTER: Building2,
};

const typeLabels: Record<string, string> = {
  UNIVERSITY: "جامعة",
  COMPANY: "شركة",
  GOVERNMENT: "جهة حكومية",
  NON_PROFIT: "جهة خيرية",
  RESEARCH_CENTER: "مركز بحثي",
  TRAINING_CENTER: "مركز تدريب",
  OTHER: "أخرى",
};

const sectorLabels: Record<string, string> = {
  EDUCATION: "تعليم",
  TECHNOLOGY: "تقنية",
  HEALTH: "صحة",
  LEGAL: "قانوني",
  FINANCE: "مالية",
  ENERGY: "طاقة",
  TOURISM: "سياحة",
  ENTREPRENEURSHIP: "ريادة أعمال",
  SUSTAINABILITY: "استدامة",
  ENGINEERING: "هندسة",
  OTHER: "أخرى",
};

const planColors: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-600",
  BASIC: "bg-blue-100 text-blue-600",
  PROFESSIONAL: "bg-purple-100 text-purple-600",
  ENTERPRISE: "bg-emerald-100 text-emerald-600",
};

const planLabels: Record<string, string> = {
  FREE: "مجاني",
  BASIC: "أساسي",
  PROFESSIONAL: "احترافي",
  ENTERPRISE: "مؤسسي",
};

function AddOrganizationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nameAr: "", name: "", type: "UNIVERSITY", sector: "EDUCATION",
    descriptionAr: "", email: "", website: "", city: "الرياض",
    primaryColor: "#7C3AED", subscriptionPlan: "PROFESSIONAL",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.nameAr.trim()) { setError("اسم المؤسسة مطلوب"); return; }
    setSaving(true);
    setError("");
    try {
      const slug = (form.name || form.nameAr).toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0621-\u064A-]/g, "");
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug, country: "SA", isActive: true, isVerified: true, maxEvents: 50, maxMembers: 200 }),
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-elm-navy">إضافة مؤسسة جديدة</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">اسم المؤسسة (عربي) *</label>
              <input value={form.nameAr} onChange={(e) => update("nameAr", e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" placeholder="مثال: جامعة الملك سعود" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name (English)</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" placeholder="e.g. King Saud University" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">النوع *</label>
              <select value={form.type} onChange={(e) => update("type", e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <option value="UNIVERSITY">جامعة</option>
                <option value="COMPANY">شركة</option>
                <option value="GOVERNMENT">جهة حكومية</option>
                <option value="NON_PROFIT">جهة خيرية</option>
                <option value="RESEARCH_CENTER">مركز بحثي</option>
                <option value="TRAINING_CENTER">مركز تدريب</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">القطاع *</label>
              <select value={form.sector} onChange={(e) => update("sector", e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <option value="EDUCATION">تعليم</option>
                <option value="TECHNOLOGY">تقنية</option>
                <option value="HEALTH">صحة</option>
                <option value="LEGAL">قانوني</option>
                <option value="FINANCE">مالية</option>
                <option value="ENERGY">طاقة</option>
                <option value="ENTREPRENEURSHIP">ريادة أعمال</option>
                <option value="OTHER">أخرى</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">الوصف</label>
            <textarea value={form.descriptionAr} onChange={(e) => update("descriptionAr", e.target.value)} rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none" placeholder="وصف مختصر عن المؤسسة..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">المدينة</label>
              <input value={form.city} onChange={(e) => update("city", e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">البريد الإلكتروني</label>
              <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="info@org.sa" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الخطة</label>
              <select value={form.subscriptionPlan} onChange={(e) => update("subscriptionPlan", e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <option value="FREE">مجاني</option>
                <option value="BASIC">أساسي</option>
                <option value="PROFESSIONAL">احترافي</option>
                <option value="ENTERPRISE">مؤسسي</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">إلغاء</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة المؤسسة
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrgData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchOrgs();
  }, [search, typeFilter]);

  async function fetchOrgs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/organizations?${params}`);
      const data = await res.json();
      setOrganizations(data.organizations || []);
    } catch {
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }

  const typeCounts = organizations.reduce((acc, org) => {
    acc[org.type] = (acc[org.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <TopBar title="Organizations" titleAr="إدارة المؤسسات" />
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">المؤسسات</h2>
            <p className="text-sm text-gray-500 mt-1">جامعات وشركات وجهات حكومية وخيرية</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            إضافة مؤسسة
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "جامعات", type: "UNIVERSITY", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "شركات", type: "COMPANY", icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "جهات حكومية", type: "GOVERNMENT", icon: Landmark, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "أخرى", type: "OTHER", icon: Heart, color: "text-amber-500", bg: "bg-amber-50" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-elm-navy">
                  {stat.type === "OTHER"
                    ? organizations.length - (typeCounts["UNIVERSITY"] || 0) - (typeCounts["COMPANY"] || 0) - (typeCounts["GOVERNMENT"] || 0)
                    : typeCounts[stat.type] || 0}
                </p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            <option value="">جميع الأنواع</option>
            <option value="UNIVERSITY">جامعات</option>
            <option value="COMPANY">شركات</option>
            <option value="GOVERNMENT">جهات حكومية</option>
            <option value="NON_PROFIT">جهات خيرية</option>
          </select>
        </div>

        {/* Organization Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <span className="mr-2 text-sm text-gray-500">جاري التحميل...</span>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">لا توجد مؤسسات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => {
              const TypeIcon = typeIcons[org.type] || Building2;
              return (
                <Link
                  key={org.id}
                  href={`/admin/organizations/${org.id}`}
                  className="bento-card p-5 group cursor-pointer block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                        style={{ backgroundColor: org.primaryColor || "#7C3AED" }}
                      >
                        {org.nameAr.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-elm-navy group-hover:text-brand-600 transition-colors">{org.nameAr}</h3>
                          {org.isVerified && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <TypeIcon className="w-3 h-3" />
                            {typeLabels[org.type] || org.type}
                          </span>
                          {org.city && (
                            <>
                              <span className="text-xs text-gray-300">|</span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {org.city}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${planColors[org.subscriptionPlan] || "bg-gray-100 text-gray-600"}`}>
                        {planLabels[org.subscriptionPlan] || org.subscriptionPlan}
                      </span>
                      <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-brand-400 group-hover:-translate-x-1 transition-all" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-elm-navy">{org._count.members}</span>
                      <span className="text-xs">عضو</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-elm-navy">{org._count.events}</span>
                      <span className="text-xs">فعالية</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <span className="text-xs px-2 py-0.5 bg-gray-50 rounded-md">{sectorLabels[org.sector] || org.sector}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      {showAddModal && <AddOrganizationModal onClose={() => setShowAddModal(false)} onSuccess={fetchOrgs} />}
    </div>
  );
}
