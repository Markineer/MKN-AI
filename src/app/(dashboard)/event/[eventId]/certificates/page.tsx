"use client";

import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import {
  Award,
  Plus,
  Download,
  Search,
  Eye,
  Mail,
  Printer,
  Settings,
  X,
  Trophy,
  Users,
  User,
  Star,
  Crown,
  Medal,
  CheckCircle,
  Clock,
  LayoutGrid,
  List,
  Filter,
  FileText,
  RefreshCw,
  Palette,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type CertificateType = "PARTICIPATION" | "COMPLETION" | "ACHIEVEMENT" | "WINNER" | "JUDGE" | "MENTOR" | "ORGANIZER";

interface Certificate {
  id: string;
  certificateNo: string;
  recipientName: string;
  recipientNameAr: string;
  type: CertificateType;
  title: string;
  titleAr: string;
  rank: number | null;
  rankLabel: string | null;
  totalScore: number | null;
  isTeam: boolean;
  teamName: string | null;
  issuedAt: string;
  email: string;
  status: "ISSUED" | "SENT" | "DOWNLOADED";
}

// ─── Config ──────────────────────────────────────────────────
const certTypeConfig: Record<CertificateType, { label: string; icon: any; color: string; bgColor: string }> = {
  PARTICIPATION: { label: "شهادة مشاركة", icon: Award, color: "text-blue-700", bgColor: "bg-blue-50" },
  COMPLETION: { label: "شهادة إتمام", icon: CheckCircle, color: "text-emerald-700", bgColor: "bg-emerald-50" },
  ACHIEVEMENT: { label: "شهادة إنجاز", icon: Star, color: "text-purple-700", bgColor: "bg-purple-50" },
  WINNER: { label: "شهادة فائز", icon: Trophy, color: "text-amber-700", bgColor: "bg-amber-50" },
  JUDGE: { label: "شهادة تحكيم", icon: FileText, color: "text-cyan-700", bgColor: "bg-cyan-50" },
  MENTOR: { label: "شهادة إرشاد", icon: Users, color: "text-pink-700", bgColor: "bg-pink-50" },
  ORGANIZER: { label: "شهادة تنظيم", icon: Settings, color: "text-red-700", bgColor: "bg-red-50" },
};

const rankConfig: Record<number, { label: string; labelAr: string; icon: any; color: string; bgColor: string }> = {
  1: { label: "1st Place", labelAr: "المركز الأول", icon: Crown, color: "text-amber-600", bgColor: "bg-amber-50" },
  2: { label: "2nd Place", labelAr: "المركز الثاني", icon: Medal, color: "text-gray-500", bgColor: "bg-gray-100" },
  3: { label: "3rd Place", labelAr: "المركز الثالث", icon: Medal, color: "text-amber-800", bgColor: "bg-amber-100/50" },
};

// ─── Mock Data ───────────────────────────────────────────────
const mockCertificates: Certificate[] = [
  { id: "1", certificateNo: "CERT-ELM-2025-001", recipientName: "Ahmed Ali", recipientNameAr: "أحمد علي", type: "WINNER", title: "Winner - 1st Place", titleAr: "الفائز بالمركز الأول", rank: 1, rankLabel: "المركز الأول", totalScore: 95.5, isTeam: true, teamName: "فريق الابتكار", issuedAt: "2025-04-15", email: "ahmed@email.com", status: "SENT" },
  { id: "2", certificateNo: "CERT-ELM-2025-002", recipientName: "Sara Omar", recipientNameAr: "سارة عمر", type: "WINNER", title: "Winner - 2nd Place", titleAr: "الفائزة بالمركز الثاني", rank: 2, rankLabel: "المركز الثاني", totalScore: 91.2, isTeam: true, teamName: "فريق التقنية", issuedAt: "2025-04-15", email: "sara@email.com", status: "SENT" },
  { id: "3", certificateNo: "CERT-ELM-2025-003", recipientName: "Khalid Nasser", recipientNameAr: "خالد ناصر", type: "WINNER", title: "Winner - 3rd Place", titleAr: "الفائز بالمركز الثالث", rank: 3, rankLabel: "المركز الثالث", totalScore: 88.7, isTeam: true, teamName: "فريق الحلول", issuedAt: "2025-04-15", email: "khalid@email.com", status: "ISSUED" },
  { id: "4", certificateNo: "CERT-ELM-2025-004", recipientName: "Mona Al-Rashed", recipientNameAr: "منى الراشد", type: "ACHIEVEMENT", title: "Best Innovation Award", titleAr: "جائزة أفضل ابتكار", rank: null, rankLabel: "أفضل ابتكار", totalScore: 92.0, isTeam: true, teamName: "فريق المستقبل", issuedAt: "2025-04-15", email: "mona@email.com", status: "ISSUED" },
  { id: "5", certificateNo: "CERT-ELM-2025-005", recipientName: "Omar Hassan", recipientNameAr: "عمر حسن", type: "COMPLETION", title: "Completion Certificate", titleAr: "شهادة إتمام", rank: null, rankLabel: null, totalScore: 78.3, isTeam: false, teamName: null, issuedAt: "2025-04-15", email: "omar@email.com", status: "DOWNLOADED" },
  { id: "6", certificateNo: "CERT-ELM-2025-006", recipientName: "Nouf Al-Salem", recipientNameAr: "نوف السالم", type: "PARTICIPATION", title: "Participation Certificate", titleAr: "شهادة مشاركة", rank: null, rankLabel: null, totalScore: null, isTeam: false, teamName: null, issuedAt: "2025-04-15", email: "nouf@email.com", status: "SENT" },
  { id: "7", certificateNo: "CERT-ELM-2025-007", recipientName: "Dr. Fatima Hassan", recipientNameAr: "د. فاطمة حسن", type: "JUDGE", title: "Judging Certificate", titleAr: "شهادة تحكيم", rank: null, rankLabel: null, totalScore: null, isTeam: false, teamName: null, issuedAt: "2025-04-15", email: "fatima@email.com", status: "SENT" },
  { id: "8", certificateNo: "CERT-ELM-2025-008", recipientName: "Mohammed Al-Qahtani", recipientNameAr: "محمد القحطاني", type: "MENTOR", title: "Mentoring Certificate", titleAr: "شهادة إرشاد", rank: null, rankLabel: null, totalScore: null, isTeam: false, teamName: null, issuedAt: "2025-04-15", email: "mohammed@email.com", status: "ISSUED" },
];

// ─── Certificate Preview ─────────────────────────────────────

function CertificatePreview({ cert }: { cert: Certificate }) {
  const typeCfg = certTypeConfig[cert.type];
  const TypeIcon = typeCfg.icon;
  const rankCfg = cert.rank ? rankConfig[cert.rank] : null;

  return (
    <div className="w-[400px] h-[280px] bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden flex-shrink-0 relative">
      {/* Border Design */}
      <div className="absolute inset-2 border-2 border-brand-500/10 rounded-lg" />
      <div className="absolute inset-3 border border-brand-400/10 rounded-lg" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-bl from-brand-700 to-brand-500 rounded-lg flex items-center justify-center">
            <Award className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold text-elm-navy">مكن AI</span>
        </div>

        {/* Type */}
        <p className={`text-[10px] font-bold px-3 py-0.5 rounded-full ${typeCfg.bgColor} ${typeCfg.color} mb-2`}>
          {typeCfg.label}
        </p>

        {/* Rank Badge */}
        {rankCfg && (
          <div className={`flex items-center gap-1 text-xs font-bold ${rankCfg.color} mb-1`}>
            <rankCfg.icon className="w-4 h-4" />
            {rankCfg.labelAr}
          </div>
        )}

        {/* Recipient */}
        <h3 className="text-xl font-bold text-elm-navy mt-1">{cert.recipientNameAr}</h3>

        {cert.teamName && (
          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {cert.teamName}
          </p>
        )}

        {/* Title */}
        <p className="text-xs text-gray-500 mt-2">{cert.titleAr}</p>

        {/* Score */}
        {cert.totalScore && (
          <p className="text-[10px] text-brand-600 font-bold mt-1">
            الدرجة: {cert.totalScore}%
          </p>
        )}

        {/* Certificate No */}
        <p className="text-[8px] text-gray-300 font-mono mt-3">{cert.certificateNo}</p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function CertificatesPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterType, setFilterType] = useState<string>("all");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const filteredCerts = mockCertificates.filter((c) => {
    if (filterType !== "all" && c.type !== filterType) return false;
    return true;
  });

  const winners = mockCertificates.filter((c) => c.type === "WINNER");
  const totalIssued = mockCertificates.length;
  const sentCount = mockCertificates.filter((c) => c.status === "SENT").length;

  return (
    <div>
      <TopBar title="Certificates" titleAr="الشهادات" />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">الشهادات والترتيب</h2>
            <p className="text-sm text-gray-500 mt-1">
              {totalIssued} شهادة | {winners.length} فائزين
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <Palette className="w-4 h-4" />
              القوالب
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <Download className="w-4 h-4" />
              تصدير الكل
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              <Mail className="w-4 h-4" />
              إرسال الكل
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm">
              <RefreshCw className="w-4 h-4" />
              إنشاء الشهادات
            </button>
          </div>
        </div>

        {/* Ranking Podium */}
        {winners.length > 0 && (
          <div className="bg-gradient-to-l from-brand-700 to-brand-500 rounded-2xl p-8 text-white">
            <h3 className="text-lg font-bold mb-6 text-center">الترتيب النهائي</h3>
            <div className="flex items-end justify-center gap-8">
              {/* 2nd Place */}
              {winners[1] && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-white/30">
                    <User className="w-7 h-7 text-white/80" />
                  </div>
                  <Medal className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-sm font-bold">{winners[1].recipientNameAr}</p>
                  {winners[1].teamName && (
                    <p className="text-[10px] text-white/60">{winners[1].teamName}</p>
                  )}
                  <p className="text-xs text-white/80 mt-1">{winners[1].totalScore}%</p>
                  <div className="w-20 h-20 bg-white/10 rounded-t-xl mt-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white/40">2</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {winners[0] && (
                <div className="text-center -mt-4">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-amber-400 shadow-lg shadow-amber-400/30">
                    <User className="w-9 h-9 text-white" />
                  </div>
                  <Crown className="w-7 h-7 text-amber-400 mx-auto mb-1" />
                  <p className="text-lg font-bold">{winners[0].recipientNameAr}</p>
                  {winners[0].teamName && (
                    <p className="text-[11px] text-white/60">{winners[0].teamName}</p>
                  )}
                  <p className="text-sm text-amber-300 font-bold mt-1">{winners[0].totalScore}%</p>
                  <div className="w-24 h-28 bg-white/10 rounded-t-xl mt-3 flex items-center justify-center">
                    <span className="text-3xl font-bold text-amber-400/60">1</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {winners[2] && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-amber-700/50">
                    <User className="w-7 h-7 text-white/80" />
                  </div>
                  <Medal className="w-6 h-6 text-amber-700 mx-auto mb-1" />
                  <p className="text-sm font-bold">{winners[2].recipientNameAr}</p>
                  {winners[2].teamName && (
                    <p className="text-[10px] text-white/60">{winners[2].teamName}</p>
                  )}
                  <p className="text-xs text-white/80 mt-1">{winners[2].totalScore}%</p>
                  <div className="w-20 h-16 bg-white/10 rounded-t-xl mt-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white/40">3</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Award className="w-6 h-6 text-brand-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-elm-navy">{totalIssued}</p>
            <p className="text-[11px] text-gray-500">شهادات صادرة</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-700">{winners.length}</p>
            <p className="text-[11px] text-gray-500">فائزين</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Mail className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-700">{sentCount}</p>
            <p className="text-[11px] text-gray-500">تم إرسالها</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Star className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">
              {mockCertificates.filter((c) => c.type === "ACHIEVEMENT").length}
            </p>
            <p className="text-[11px] text-gray-500">جوائز خاصة</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو رقم الشهادة..."
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="all">جميع الأنواع</option>
            {Object.entries(certTypeConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
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

        {/* Certificates List */}
        {viewMode === "list" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-500 border-b border-gray-100 bg-gray-50/50">
                  <th className="text-right px-4 py-3 font-medium">#</th>
                  <th className="text-right px-4 py-3 font-medium">المستلم</th>
                  <th className="text-center px-4 py-3 font-medium">النوع</th>
                  <th className="text-center px-4 py-3 font-medium">المركز</th>
                  <th className="text-center px-4 py-3 font-medium">الدرجة</th>
                  <th className="text-center px-4 py-3 font-medium">الحالة</th>
                  <th className="text-center px-4 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCerts.map((cert, idx) => {
                  const typeCfg = certTypeConfig[cert.type];
                  const TypeIcon = typeCfg.icon;
                  const rankCfg = cert.rank ? rankConfig[cert.rank] : null;

                  return (
                    <tr key={cert.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono text-gray-400">{cert.certificateNo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {cert.isTeam ? (
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-purple-500" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-elm-navy">{cert.recipientNameAr}</p>
                            {cert.teamName && (
                              <p className="text-[10px] text-gray-400">{cert.teamName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${typeCfg.bgColor} ${typeCfg.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeCfg.label}
                        </span>
                      </td>
                      <td className="text-center px-4 py-3">
                        {rankCfg ? (
                          <span className={`inline-flex items-center gap-1 font-bold text-xs ${rankCfg.color}`}>
                            <rankCfg.icon className="w-4 h-4" />
                            {rankCfg.labelAr}
                          </span>
                        ) : cert.rankLabel ? (
                          <span className="text-xs text-gray-500">{cert.rankLabel}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        {cert.totalScore ? (
                          <span className="font-bold text-xs text-elm-navy">{cert.totalScore}%</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        {cert.status === "SENT" && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            <Mail className="w-3 h-3" /> تم الإرسال
                          </span>
                        )}
                        {cert.status === "ISSUED" && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle className="w-3 h-3" /> صادرة
                          </span>
                        )}
                        {cert.status === "DOWNLOADED" && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            <Download className="w-3 h-3" /> تم التحميل
                          </span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setSelectedCert(cert); setShowPreview(true); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="flex flex-wrap gap-6 justify-center">
            {filteredCerts.map((cert) => (
              <CertificatePreview key={cert.id} cert={cert} />
            ))}
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      {showPreview && selectedCert && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-elm-navy">معاينة الشهادة</h3>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex justify-center">
              <CertificatePreview cert={selectedCert} />
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200">
                <Download className="w-4 h-4" />
                تحميل PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-medium hover:bg-emerald-600">
                <Mail className="w-4 h-4" />
                إرسال بالإيميل
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
