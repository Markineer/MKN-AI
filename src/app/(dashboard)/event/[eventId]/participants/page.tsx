"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  Search,
  Loader2,
  ChevronLeft,
  ChevronDown,
  Crown,
  UserCircle,
  Mail,
  GraduationCap,
  Filter,
  Hash,
  MapPin,
  LinkIcon,
  UserCheck,
  UsersRound,
  FileText,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";

interface Track {
  id: string;
  name: string;
  nameAr: string;
  color: string | null;
}

interface TeamInfo {
  teamId: string;
  teamName: string;
  teamNameAr: string | null;
  teamRole: string;
}

interface Participant {
  id: string;
  userId: string;
  status: string;
  trackId: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    firstNameAr: string | null;
    lastName: string;
    lastNameAr: string | null;
    email: string;
    avatar: string | null;
    bio: string | null;
    bioAr: string | null;
    phone: string | null;
    nationalId: string | null;
  };
  track: Track | null;
  team: TeamInfo | null;
}

interface TeamOption {
  id: string;
  name: string;
  nameAr: string | null;
}

interface Stats {
  total: number;
  withTeam: number;
  leaders: number;
  members: number;
}

// Parse bio string into structured data (supports both labeled and legacy formats)
function parseBio(bio: string | null): {
  college?: string;
  major?: string;
  role?: string;
  uniEmail?: string;
  studentId?: string;
  techLink?: string;
} {
  if (!bio) return {};
  const parts = bio.split(" | ");
  const result: any = {};
  const unlabeled: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith("الكلية:"))
      result.college = trimmed.replace("الكلية:", "").trim();
    else if (trimmed.startsWith("التخصص:"))
      result.major = trimmed.replace("التخصص:", "").trim();
    else if (trimmed.startsWith("الدور:"))
      result.role = trimmed.replace("الدور:", "").trim();
    else if (trimmed.startsWith("الإيميل الجامعي:"))
      result.uniEmail = trimmed.replace("الإيميل الجامعي:", "").trim();
    else if (trimmed.startsWith("الرقم الجامعي:"))
      result.studentId = trimmed.replace("الرقم الجامعي:", "").trim();
    else if (trimmed.startsWith("الملف التقني:"))
      result.techLink = trimmed.replace("الملف التقني:", "").trim();
    else if (trimmed) unlabeled.push(trimmed);
  }
  // Fallback for legacy unlabeled format: college, major, role
  if (!result.college && unlabeled.length > 0) result.college = unlabeled[0];
  if (!result.major && unlabeled.length > 1) result.major = unlabeled[1];
  if (!result.role && unlabeled.length > 2) result.role = unlabeled[2];
  return result;
}

export default function ParticipantsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTrack, setFilterTrack] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  useEffect(() => {
    fetchParticipants();
  }, [eventId, filterTrack, filterTeam, filterRole]);

  async function fetchParticipants() {
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      if (filterTrack) qp.set("trackId", filterTrack);
      if (filterTeam) qp.set("teamId", filterTeam);
      if (filterRole) qp.set("role", filterRole);
      const res = await fetch(`/api/events/${eventId}/participants?${qp}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setParticipants(data.participants || []);
      setTracks(data.tracks || []);
      setTeams(data.teams || []);
      setStats(data.stats || null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, fieldId: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  }

  // Local search filter
  const filtered = search.trim()
    ? participants.filter((p) => {
        const q = search.toLowerCase();
        const bio = parseBio(p.user.bioAr || p.user.bio);
        return (
          (p.user.firstNameAr && p.user.firstNameAr.includes(search)) ||
          (p.user.lastNameAr && p.user.lastNameAr.includes(search)) ||
          p.user.firstName.toLowerCase().includes(q) ||
          p.user.lastName.toLowerCase().includes(q) ||
          p.user.email.toLowerCase().includes(q) ||
          (p.team?.teamNameAr && p.team.teamNameAr.includes(search)) ||
          (p.team?.teamName && p.team.teamName.toLowerCase().includes(q)) ||
          (bio.studentId && bio.studentId.includes(search)) ||
          (p.user.nationalId && p.user.nationalId.includes(search))
        );
      })
    : participants;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href={`/organization/events/${eventId}`}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-elm-navy">المشاركين</h1>
            <p className="text-sm text-gray-500">
              {stats
                ? `${stats.total} مشارك · ${stats.withTeam} في فرق · ${stats.leaders} قائد`
                : ""}
            </p>
          </div>
        </div>
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "cards"
                ? "bg-white text-elm-navy shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            بطاقات
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "table"
                ? "bg-white text-elm-navy shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            جدول
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-brand-600" />
              </div>
              <span className="text-xs text-gray-500">إجمالي المشاركين</span>
            </div>
            <p className="text-2xl font-bold text-elm-navy">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UsersRound className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs text-gray-500">في فرق</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {stats.withTeam}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-gray-500">قادة فرق</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {stats.leaders}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">أعضاء</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {stats.members}
            </p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو البريد أو الرقم الجامعي أو اسم الفريق..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          {tracks.length > 0 && (
            <div className="relative">
              <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterTrack}
                onChange={(e) => setFilterTrack(e.target.value)}
                className="appearance-none pr-9 pl-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 cursor-pointer"
              >
                <option value="">كل المسارات</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr || t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
          {teams.length > 0 && (
            <div className="relative">
              <UsersRound className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="appearance-none pr-9 pl-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 cursor-pointer"
              >
                <option value="">كل الفرق</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr || t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
          <div className="relative">
            <Crown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="appearance-none pr-9 pl-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 cursor-pointer"
            >
              <option value="">كل الأدوار</option>
              <option value="LEADER">قائد فريق</option>
              <option value="MEMBER">عضو</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-elm-navy mb-2">
            لا يوجد مشاركين
          </h3>
          <p className="text-sm text-gray-500">
            {search || filterTrack || filterTeam || filterRole
              ? "لا توجد نتائج مطابقة للبحث أو الفلاتر"
              : "لم يتم تسجيل مشاركين في هذه الفعالية بعد"}
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* ───── Table View ───── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">
                    #
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">
                    الاسم
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">
                    الإيميل الشخصي
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">
                    الفريق
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">
                    الدور
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">
                    المسار
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">
                    الرقم الجامعي
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">
                    الكلية
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">
                    الملف التقني
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const bio = parseBio(p.user.bioAr || p.user.bio);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-bold text-xs flex-shrink-0">
                            {(
                              p.user.firstNameAr ||
                              p.user.firstName ||
                              "?"
                            )[0]}
                          </div>
                          <div>
                            <p className="font-medium text-elm-navy text-xs">
                              {p.user.firstNameAr || p.user.firstName}{" "}
                              {p.user.lastNameAr || p.user.lastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {p.user.email}
                      </td>
                      <td className="px-4 py-3">
                        {p.team && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600">
                            {p.team.teamName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.team?.teamRole === "LEADER" ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
                            <Crown className="w-2.5 h-2.5" />
                            قائد
                          </span>
                        ) : p.team ? (
                          <span className="text-xs text-gray-400">عضو</span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.track && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{
                              backgroundColor:
                                (p.track.color || "#7C3AED") + "15",
                              color: p.track.color || "#7C3AED",
                            }}
                          >
                            {p.track.nameAr || p.track.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {bio.studentId || p.user.nationalId || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {bio.college || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {bio.techLink ? (
                          <a
                            href={bio.techLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            رابط
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ───── Cards View ───── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const bio = parseBio(p.user.bioAr || p.user.bio);
            const isExpanded = expandedCard === p.id;
            const studentId = bio.studentId || p.user.nationalId;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 font-bold text-lg flex-shrink-0">
                      {(
                        p.user.firstNameAr ||
                        p.user.firstName ||
                        "?"
                      )[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-elm-navy truncate">
                          {p.user.firstNameAr || p.user.firstName}{" "}
                          {p.user.lastNameAr || p.user.lastName}
                        </h3>
                        {p.team?.teamRole === "LEADER" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700 flex-shrink-0">
                            <Crown className="w-2.5 h-2.5" />
                            قائد
                          </span>
                        )}
                      </div>
                      {/* Badges row */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {p.track && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{
                              backgroundColor:
                                (p.track.color || "#7C3AED") + "15",
                              color: p.track.color || "#7C3AED",
                            }}
                          >
                            <MapPin className="w-3 h-3" />
                            {p.track.nameAr || p.track.name}
                          </span>
                        )}
                        {p.team && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600">
                            <UsersRound className="w-3 h-3" />
                            {p.team.teamName}
                            {p.team.teamNameAr && (
                              <span className="text-blue-400 mr-0.5">
                                ({p.team.teamNameAr})
                              </span>
                            )}
                          </span>
                        )}
                        {bio.college && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600">
                            <GraduationCap className="w-3 h-3" />
                            {bio.college}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Key Info Grid - Always visible */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {/* Personal Email */}
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        الإيميل الشخصي
                      </p>
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] text-elm-navy font-medium truncate flex-1" dir="ltr">
                          {p.user.email}
                        </p>
                        <button
                          onClick={() => copyToClipboard(p.user.email, `email-${p.id}`)}
                          className="flex-shrink-0 text-gray-300 hover:text-brand-500 transition-colors"
                        >
                          {copiedField === `email-${p.id}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Team Code */}
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                        <UsersRound className="w-3 h-3" />
                        رمز الفريق
                      </p>
                      <p className="text-[11px] text-elm-navy font-medium font-mono">
                        {p.team?.teamName || "-"}
                      </p>
                    </div>

                    {/* Student ID */}
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        الرقم الجامعي
                      </p>
                      <p className="text-[11px] text-elm-navy font-medium font-mono">
                        {studentId || "-"}
                      </p>
                    </div>

                    {/* Major */}
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        التخصص
                      </p>
                      <p className="text-[11px] text-elm-navy font-medium truncate">
                        {bio.major || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Tech Link - Always visible if exists */}
                  {bio.techLink && (
                    <div className="mt-2 bg-brand-50 rounded-lg p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-brand-400">
                            الملف التقني / الرابط
                          </p>
                          <p
                            className="text-[11px] text-brand-600 truncate"
                            dir="ltr"
                          >
                            {bio.techLink}
                          </p>
                        </div>
                      </div>
                      <a
                        href={bio.techLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 bg-brand-500 text-white rounded-lg text-[10px] font-medium hover:bg-brand-600 transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                        فتح
                      </a>
                    </div>
                  )}
                </div>

                {/* Expandable: more details */}
                <button
                  onClick={() =>
                    setExpandedCard(isExpanded ? null : p.id)
                  }
                  className="w-full flex items-center justify-center gap-1 py-2.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 hover:text-brand-500 hover:bg-gray-100 transition-colors"
                >
                  {isExpanded ? "إخفاء التفاصيل الإضافية" : "مزيد من التفاصيل"}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 bg-gray-50/50 border-t border-gray-100 space-y-2.5">
                    {bio.role && (
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">
                          الدور في الفريق:
                        </span>
                        <span className="text-xs text-elm-navy font-medium">
                          {bio.role}
                        </span>
                      </div>
                    )}
                    {bio.uniEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">
                          الإيميل الجامعي:
                        </span>
                        <span
                          className="text-xs text-elm-navy font-medium font-mono truncate"
                          dir="ltr"
                        >
                          {bio.uniEmail}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              bio.uniEmail!,
                              `uni-${p.id}`
                            )
                          }
                          className="flex-shrink-0 text-gray-300 hover:text-brand-500 transition-colors"
                        >
                          {copiedField === `uni-${p.id}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                    {bio.college && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">الكلية:</span>
                        <span className="text-xs text-elm-navy font-medium">
                          {bio.college}
                        </span>
                      </div>
                    )}
                    {p.user.phone && (
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">الجوال:</span>
                        <span className="text-xs text-elm-navy font-medium font-mono">
                          {p.user.phone}
                        </span>
                      </div>
                    )}
                    {/* Raw bio for debugging if anything was missed */}
                    {p.user.bioAr && !bio.college && !bio.major && (
                      <div className="bg-gray-100 rounded-lg p-2 mt-2">
                        <p className="text-[10px] text-gray-400 mb-1">
                          بيانات التسجيل:
                        </p>
                        <p className="text-[11px] text-gray-600">
                          {p.user.bioAr}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
