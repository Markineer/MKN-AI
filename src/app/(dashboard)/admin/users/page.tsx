"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import {
  Plus,
  Search,
  Download,
  Upload,
  MoreVertical,
  Shield,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  firstNameAr: string | null;
  lastName: string;
  lastNameAr: string | null;
  phone: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  platformRoles: {
    role: { name: string; nameAr: string; level: string; color: string };
  }[];
}

function timeAgo(date: string | null): string {
  if (!date) return "لم يسجل دخول";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  return new Date(date).toLocaleDateString("ar-SA");
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { total: 0, pages: 0 });
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <TopBar title="Users" titleAr="إدارة المستخدمين" />
      <div className="p-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">المستخدمين</h2>
            <p className="text-sm text-gray-500 mt-1">إدارة جميع مستخدمي المنصة وصلاحياتهم</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <Upload className="w-4 h-4" />
              استيراد
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <Download className="w-4 h-4" />
              تصدير
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              إضافة مستخدم
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد الإلكتروني..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">جميع الأدوار</option>
            <option value="super_admin">مدير أعلى</option>
            <option value="platform_admin">مدير المنصة</option>
            <option value="organization_admin">مدير مؤسسة</option>
            <option value="event_manager">مدير فعالية</option>
            <option value="judge">محكّم</option>
            <option value="mentor">مرشد</option>
            <option value="expert">خبير</option>
            <option value="participant">مشارك</option>
            <option value="researcher">باحث</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              <span className="mr-2 text-sm text-gray-500">جاري التحميل...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm">لا يوجد مستخدمين</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">المستخدم</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">التواصل</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">الدور</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">الحالة</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">آخر دخول</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => {
                    const role = user.platformRoles[0]?.role;
                    const displayName = `${user.firstNameAr || user.firstName} ${user.lastNameAr || user.lastName}`;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: role?.color || "#6B7280" }}
                            >
                              {(user.firstNameAr || user.firstName || "").charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-elm-navy">{displayName}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {role ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-white"
                              style={{ backgroundColor: role.color }}
                            >
                              <Shield className="w-3 h-3" />
                              {role.nameAr}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">بدون دور</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {user.isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">نشط</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">غير نشط</span>
                            )}
                            {user.isVerified ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{timeAgo(user.lastLoginAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  عرض <span className="font-medium">{(page - 1) * 20 + 1}-{Math.min(page * 20, pagination.total)}</span> من <span className="font-medium">{pagination.total}</span> مستخدم
                </p>
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        p === page ? "bg-brand-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {pagination.pages > 1 && page < pagination.pages && (
                    <button
                      onClick={() => setPage(page + 1)}
                      className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      التالي
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
