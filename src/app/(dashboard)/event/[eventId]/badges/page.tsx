"use client";

import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import {
  BadgeCheck,
  Plus,
  Download,
  Printer,
  Search,
  Filter,
  QrCode,
  Users,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Settings,
  X,
  ScanLine,
  UserCheck,
  LayoutGrid,
  List,
  Mail,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type BadgeType = "INDIVIDUAL" | "TEAM_MEMBER" | "JUDGE" | "MENTOR" | "ORGANIZER" | "EXPERT" | "SPEAKER" | "VIP";

interface Badge {
  id: string;
  badgeNo: string;
  participantName: string;
  participantNameAr: string;
  role: string;
  roleAr: string;
  badgeType: BadgeType;
  teamName?: string;
  trackName?: string;
  isCheckedIn: boolean;
  checkedInAt?: string;
  email: string;
}

// ─── Config ──────────────────────────────────────────────────
const badgeTypeConfig: Record<BadgeType, { label: string; color: string; bgColor: string }> = {
  INDIVIDUAL: { label: "مشارك فردي", color: "text-blue-700", bgColor: "bg-blue-50" },
  TEAM_MEMBER: { label: "عضو فريق", color: "text-purple-700", bgColor: "bg-purple-50" },
  JUDGE: { label: "محكّم", color: "text-amber-700", bgColor: "bg-amber-50" },
  MENTOR: { label: "مرشد", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  ORGANIZER: { label: "منظّم", color: "text-red-700", bgColor: "bg-red-50" },
  EXPERT: { label: "خبير", color: "text-cyan-700", bgColor: "bg-cyan-50" },
  SPEAKER: { label: "متحدث", color: "text-pink-700", bgColor: "bg-pink-50" },
  VIP: { label: "ضيف مميز", color: "text-yellow-700", bgColor: "bg-yellow-50" },
};

// ─── Mock Data ───────────────────────────────────────────────
const mockBadges: Badge[] = [
  { id: "1", badgeNo: "ELM-2025-0001", participantName: "Ahmed Ali", participantNameAr: "أحمد علي", role: "PARTICIPANT", roleAr: "مشارك", badgeType: "TEAM_MEMBER", teamName: "فريق الابتكار", trackName: "التقنية", isCheckedIn: true, checkedInAt: "2025-03-01 09:15", email: "ahmed@email.com" },
  { id: "2", badgeNo: "ELM-2025-0002", participantName: "Sara Omar", participantNameAr: "سارة عمر", role: "PARTICIPANT", roleAr: "مشاركة", badgeType: "TEAM_MEMBER", teamName: "فريق التقنية", trackName: "التقنية", isCheckedIn: true, checkedInAt: "2025-03-01 09:22", email: "sara@email.com" },
  { id: "3", badgeNo: "ELM-2025-0003", participantName: "Khalid Nasser", participantNameAr: "خالد ناصر", role: "PARTICIPANT", roleAr: "مشارك", badgeType: "INDIVIDUAL", trackName: "الأعمال", isCheckedIn: false, email: "khalid@email.com" },
  { id: "4", badgeNo: "ELM-2025-0004", participantName: "Dr. Fatima Hassan", participantNameAr: "د. فاطمة حسن", role: "JUDGE", roleAr: "محكّمة", badgeType: "JUDGE", isCheckedIn: true, checkedInAt: "2025-03-01 08:45", email: "fatima@email.com" },
  { id: "5", badgeNo: "ELM-2025-0005", participantName: "Mohammed Al-Qahtani", participantNameAr: "محمد القحطاني", role: "MENTOR", roleAr: "مرشد", badgeType: "MENTOR", trackName: "التقنية", isCheckedIn: true, checkedInAt: "2025-03-01 08:50", email: "mohammed@email.com" },
  { id: "6", badgeNo: "ELM-2025-0006", participantName: "Layla Abdullah", participantNameAr: "ليلى عبدالله", role: "ORGANIZER", roleAr: "منظّمة", badgeType: "ORGANIZER", isCheckedIn: true, checkedInAt: "2025-03-01 07:30", email: "layla@email.com" },
  { id: "7", badgeNo: "ELM-2025-0007", participantName: "Omar Hassan", participantNameAr: "عمر حسن", role: "PARTICIPANT", roleAr: "مشارك", badgeType: "TEAM_MEMBER", teamName: "فريق الحلول", trackName: "الأعمال", isCheckedIn: false, email: "omar@email.com" },
  { id: "8", badgeNo: "ELM-2025-0008", participantName: "Prof. Ali Salem", participantNameAr: "أ.د. علي سالم", role: "EXPERT", roleAr: "خبير", badgeType: "EXPERT", isCheckedIn: false, email: "ali@email.com" },
  { id: "9", badgeNo: "ELM-2025-0009", participantName: "Nora Al-Shamsi", participantNameAr: "نورة الشمسي", role: "SPEAKER", roleAr: "متحدثة", badgeType: "SPEAKER", isCheckedIn: true, checkedInAt: "2025-03-01 09:00", email: "nora@email.com" },
  { id: "10", badgeNo: "ELM-2025-0010", participantName: "Minister Al-Faisal", participantNameAr: "الأمير الفيصل", role: "VIP", roleAr: "ضيف مميز", badgeType: "VIP", isCheckedIn: false, email: "vip@email.com" },
];

// ─── Badge Preview Card ──────────────────────────────────────

function BadgePreview({ badge }: { badge: Badge }) {
  const typeCfg = badgeTypeConfig[badge.badgeType];
  return (
    <div className="w-[280px] h-[380px] bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden flex-shrink-0 relative">
      {/* Header Band */}
      <div className="h-20 bg-gradient-to-l from-brand-700 to-brand-500 relative flex items-end">
        <div className="absolute top-3 left-3 text-[8px] text-white/60 font-mono">{badge.badgeNo}</div>
        <div className="w-full flex items-center justify-center pb-2">
          <div className="text-white text-xs font-bold flex items-center gap-1">
            <span>مكن AI</span>
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex justify-center -mt-8 relative z-10">
        <div className="w-16 h-16 bg-gray-100 rounded-full border-4 border-white shadow flex items-center justify-center">
          <User className="w-7 h-7 text-gray-400" />
        </div>
      </div>

      {/* Info */}
      <div className="text-center px-4 mt-3">
        <h3 className="text-base font-bold text-elm-navy">{badge.participantNameAr}</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">{badge.participantName}</p>

        <div className={`inline-flex items-center gap-1 px-3 py-1 mt-3 rounded-full text-[11px] font-bold ${typeCfg.bgColor} ${typeCfg.color}`}>
          <BadgeCheck className="w-3.5 h-3.5" />
          {typeCfg.label}
        </div>

        {badge.teamName && (
          <p className="text-[11px] text-gray-500 mt-2 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" />
            {badge.teamName}
          </p>
        )}
        {badge.trackName && (
          <p className="text-[10px] text-gray-400 mt-1">
            المسار: {badge.trackName}
          </p>
        )}
      </div>

      {/* QR Code Placeholder */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
          <QrCode className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-[8px] text-gray-400 text-center mt-1">{badge.badgeNo}</p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function BadgesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCheckedIn, setFilterCheckedIn] = useState<string>("all");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const filteredBadges = mockBadges.filter((b) => {
    if (filterType !== "all" && b.badgeType !== filterType) return false;
    if (filterCheckedIn === "checked_in" && !b.isCheckedIn) return false;
    if (filterCheckedIn === "not_checked_in" && b.isCheckedIn) return false;
    return true;
  });

  const checkedInCount = mockBadges.filter((b) => b.isCheckedIn).length;
  const stats = Object.entries(badgeTypeConfig).map(([key, cfg]) => ({
    type: key,
    label: cfg.label,
    count: mockBadges.filter((b) => b.badgeType === key).length,
    color: cfg.color,
    bg: cfg.bgColor,
  }));

  return (
    <div>
      <TopBar title="Attendance Badges" titleAr="بطاقات الحضور" />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">بطاقات الحضور</h2>
            <p className="text-sm text-gray-500 mt-1">
              {mockBadges.length} بطاقة | {checkedInCount} حاضر
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <ScanLine className="w-4 h-4" />
              مسح QR
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <Download className="w-4 h-4" />
              تصدير الكل
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <Printer className="w-4 h-4" />
              طباعة الكل
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm">
              <RefreshCw className="w-4 h-4" />
              إنشاء البطاقات
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-elm-navy">{mockBadges.length}</p>
                <p className="text-[11px] text-gray-400">إجمالي البطاقات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{checkedInCount}</p>
                <p className="text-[11px] text-gray-400">حاضرون</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{mockBadges.length - checkedInCount}</p>
                <p className="text-[11px] text-gray-400">لم يحضروا بعد</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <QrCode className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {Math.round((checkedInCount / mockBadges.length) * 100)}%
                </p>
                <p className="text-[11px] text-gray-400">نسبة الحضور</p>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Type Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-elm-navy mb-3">توزيع البطاقات حسب النوع</h3>
          <div className="flex items-center gap-3 flex-wrap">
            {stats.filter((s) => s.count > 0).map((s) => (
              <div key={s.type} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${s.bg}`}>
                <span className={`text-lg font-bold ${s.color}`}>{s.count}</span>
                <span className={`text-xs ${s.color}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو رقم البطاقة..."
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="all">جميع الأنواع</option>
            {Object.entries(badgeTypeConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={filterCheckedIn}
            onChange={(e) => setFilterCheckedIn(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="all">الكل</option>
            <option value="checked_in">حاضر</option>
            <option value="not_checked_in">لم يحضر</option>
          </select>
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-400"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-400"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Badge List View */}
        {viewMode === "list" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-500 border-b border-gray-100 bg-gray-50/50">
                  <th className="text-right px-4 py-3 font-medium">رقم البطاقة</th>
                  <th className="text-right px-4 py-3 font-medium">المشارك</th>
                  <th className="text-center px-4 py-3 font-medium">النوع</th>
                  <th className="text-right px-4 py-3 font-medium">الفريق / المسار</th>
                  <th className="text-center px-4 py-3 font-medium">الحضور</th>
                  <th className="text-center px-4 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredBadges.map((badge) => {
                  const typeCfg = badgeTypeConfig[badge.badgeType];
                  return (
                    <tr key={badge.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {badge.badgeNo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-elm-navy">{badge.participantNameAr}</p>
                        <p className="text-[10px] text-gray-400">{badge.email}</p>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${typeCfg.bgColor} ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {badge.teamName && <span className="block">{badge.teamName}</span>}
                        {badge.trackName && <span className="text-[10px] text-gray-400">{badge.trackName}</span>}
                        {!badge.teamName && !badge.trackName && <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-center px-4 py-3">
                        {badge.isCheckedIn ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                              <CheckCircle className="w-3 h-3" /> حاضر
                            </span>
                            <p className="text-[9px] text-gray-400 mt-0.5">{badge.checkedInAt}</p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> لم يحضر
                          </span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setSelectedBadge(badge); setShowPreview(true); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          {!badge.isCheckedIn && (
                            <button className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded-lg hover:bg-emerald-100">
                              تسجيل حضور
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Badge Grid View */}
        {viewMode === "grid" && (
          <div className="flex flex-wrap gap-6 justify-center">
            {filteredBadges.map((badge) => (
              <BadgePreview key={badge.id} badge={badge} />
            ))}
          </div>
        )}
      </div>

      {/* Badge Preview Modal */}
      {showPreview && selectedBadge && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-elm-navy">معاينة البطاقة</h3>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex justify-center">
              <BadgePreview badge={selectedBadge} />
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200">
                <Download className="w-4 h-4" />
                تحميل
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-medium hover:bg-brand-600">
                <Printer className="w-4 h-4" />
                طباعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
