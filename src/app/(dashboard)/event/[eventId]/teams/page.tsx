"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  Search,
  Loader2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Crown,
  UserCircle,
  Mail,
  GraduationCap,
  Filter,
  Hash,
  MapPin,
} from "lucide-react";
import Link from "next/link";

interface Track {
  id: string;
  name: string;
  nameAr: string;
  color: string | null;
}

interface TeamMember {
  id: string;
  role: string;
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
  };
}

interface Team {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  status: string;
  trackId: string | null;
  createdAt: string;
  track: Track | null;
  members: TeamMember[];
}

interface Stats {
  total: number;
  active: number;
  forming: number;
  submitted: number;
  totalMembers: number;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  FORMING: { label: "قيد التشكيل", bg: "bg-amber-50", text: "text-amber-700" },
  ACTIVE: { label: "نشط", bg: "bg-emerald-50", text: "text-emerald-700" },
  SUBMITTED: { label: "تم التسليم", bg: "bg-blue-50", text: "text-blue-700" },
  EVALUATED: { label: "تم التقييم", bg: "bg-purple-50", text: "text-purple-700" },
  WINNER: { label: "فائز", bg: "bg-yellow-50", text: "text-yellow-700" },
  DISQUALIFIED: { label: "مستبعد", bg: "bg-red-50", text: "text-red-700" },
};

export default function TeamsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [teams, setTeams] = useState<Team[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTrack, setFilterTrack] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, [eventId, filterTrack, filterStatus]);

  async function fetchTeams() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTrack) params.set("trackId", filterTrack);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/events/${eventId}/teams?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTeams(data.teams || []);
      setTracks(data.tracks || []);
      setStats(data.stats || null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  // Local search filter
  const filteredTeams = search.trim()
    ? teams.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.nameAr && t.nameAr.includes(search)) ||
          t.members.some(
            (m) =>
              m.user.email.toLowerCase().includes(search.toLowerCase()) ||
              (m.user.firstNameAr && m.user.firstNameAr.includes(search)) ||
              (m.user.lastNameAr && m.user.lastNameAr.includes(search))
          )
      )
    : teams;

  // Parse bio into structured data
  function parseBio(bio: string | null): { college?: string; major?: string; role?: string; uniEmail?: string; studentId?: string; techLink?: string } {
    if (!bio) return {};
    const parts = bio.split(" | ");
    const result: any = {};
    for (const part of parts) {
      if (part.startsWith("الإيميل الجامعي:")) result.uniEmail = part.replace("الإيميل الجامعي:", "").trim();
      else if (part.startsWith("الرقم الجامعي:")) result.studentId = part.replace("الرقم الجامعي:", "").trim();
      else if (part.startsWith("الملف التقني:")) result.techLink = part.replace("الملف التقني:", "").trim();
      else if (!result.college) result.college = part;
      else if (!result.major) result.major = part;
      else if (!result.role) result.role = part;
    }
    return result;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
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
            <h1 className="text-2xl font-bold text-elm-navy">الفرق</h1>
            <p className="text-sm text-gray-500">
              {stats ? `${stats.total} فريق · ${stats.totalMembers} عضو` : ""}
            </p>
          </div>
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
              <span className="text-xs text-gray-500">إجمالي الفرق</span>
            </div>
            <p className="text-2xl font-bold text-elm-navy">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs text-gray-500">فرق نشطة</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-gray-500">قيد التشكيل</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.forming}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCircle className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">إجمالي الأعضاء</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalMembers}</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث باسم الفريق أو اسم العضو أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          {/* Track Filter */}
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

          {/* Status Filter */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pr-9 pl-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 cursor-pointer"
            >
              <option value="">كل الحالات</option>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Track Summary Bar */}
      {tracks.length > 0 && teams.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {tracks.map((t) => {
            const count = teams.filter((tm) => tm.trackId === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => setFilterTrack(filterTrack === t.id ? "" : t.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  filterTrack === t.id
                    ? "border-brand-300 bg-brand-50"
                    : "border-gray-100 bg-white hover:bg-gray-50"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: t.color || "#7C3AED" }}
                />
                <span className="font-medium text-gray-700">
                  {t.nameAr || t.name}
                </span>
                <span className="text-gray-400">{count} فريق</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Teams List */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-elm-navy mb-2">لا توجد فرق</h3>
          <p className="text-sm text-gray-500">
            {search || filterTrack || filterStatus
              ? "لا توجد نتائج مطابقة للبحث أو الفلاتر"
              : "لم يتم تسجيل فرق في هذه الفعالية بعد"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTeams.map((team) => {
            const isExpanded = expandedTeam === team.id;
            const statusInfo = STATUS_MAP[team.status] || STATUS_MAP.FORMING;
            const leader = team.members.find((m) => m.role === "LEADER");

            return (
              <div
                key={team.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Team Header */}
                <button
                  onClick={() =>
                    setExpandedTeam(isExpanded ? null : team.id)
                  }
                  className="w-full flex items-center gap-4 p-5 text-right"
                >
                  {/* Team avatar */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{
                      backgroundColor: team.track?.color || "#7C3AED",
                    }}
                  >
                    {(team.nameAr || team.name)[0]}
                  </div>

                  {/* Team info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-elm-navy">
                        {team.nameAr || team.name}
                      </h3>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {team.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {/* Status */}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        {statusInfo.label}
                      </span>
                      {/* Track */}
                      {team.track && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            backgroundColor:
                              (team.track.color || "#7C3AED") + "15",
                            color: team.track.color || "#7C3AED",
                          }}
                        >
                          <MapPin className="w-3 h-3" />
                          {team.track.nameAr || team.track.name}
                        </span>
                      )}
                      {/* Members count */}
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <Users className="w-3 h-3" />
                        {team.members.length} أعضاء
                      </span>
                      {/* Leader */}
                      {leader && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <Crown className="w-3 h-3 text-amber-500" />
                          {leader.user.firstNameAr || leader.user.firstName}{" "}
                          {leader.user.lastNameAr || leader.user.lastName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Members */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                    <h4 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      أعضاء الفريق ({team.members.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {team.members.map((member) => {
                        const bio = parseBio(member.user.bioAr || member.user.bio);
                        return (
                          <div
                            key={member.id}
                            className="bg-white rounded-xl p-4 border border-gray-100"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">
                                {(
                                  member.user.firstNameAr ||
                                  member.user.firstName ||
                                  "?"
                                )[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-bold text-elm-navy truncate">
                                    {member.user.firstNameAr ||
                                      member.user.firstName}{" "}
                                    {member.user.lastNameAr ||
                                      member.user.lastName}
                                  </h5>
                                  {member.role === "LEADER" && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700">
                                      <Crown className="w-2.5 h-2.5" />
                                      قائد
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  {member.user.email}
                                </p>
                                {/* Bio data */}
                                {(bio.college || bio.major) && (
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {bio.college && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-600">
                                        <GraduationCap className="w-3 h-3" />
                                        {bio.college}
                                      </span>
                                    )}
                                    {bio.major && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-600">
                                        {bio.major}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {bio.role && (
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    الدور: {bio.role}
                                  </p>
                                )}
                                {bio.studentId && (
                                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                    <Hash className="w-3 h-3" />
                                    {bio.studentId}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
