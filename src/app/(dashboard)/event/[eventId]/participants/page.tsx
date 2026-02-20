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
  Phone,
  Link as LinkIcon,
  UserCheck,
  UsersRound,
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

  useEffect(() => {
    fetchParticipants();
  }, [eventId, filterTrack, filterTeam, filterRole]);

  async function fetchParticipants() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTrack) params.set("trackId", filterTrack);
      if (filterTeam) params.set("teamId", filterTeam);
      if (filterRole) params.set("role", filterRole);
      const res = await fetch(`/api/events/${eventId}/participants?${params}`);
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

  // Local search filter
  const filtered = search.trim()
    ? participants.filter(
        (p) =>
          (p.user.firstNameAr && p.user.firstNameAr.includes(search)) ||
          (p.user.lastNameAr && p.user.lastNameAr.includes(search)) ||
          p.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
          p.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
          p.user.email.toLowerCase().includes(search.toLowerCase()) ||
          (p.team?.teamNameAr && p.team.teamNameAr.includes(search)) ||
          (p.team?.teamName && p.team.teamName.toLowerCase().includes(search.toLowerCase()))
      )
    : participants;

  // Parse bio
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
            <h1 className="text-2xl font-bold text-elm-navy">المشاركين</h1>
            <p className="text-sm text-gray-500">
              {stats
                ? `${stats.total} مشارك · ${stats.withTeam} في فرق · ${stats.leaders} قائد`
                : ""}
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
            <p className="text-2xl font-bold text-emerald-600">{stats.withTeam}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-gray-500">قادة فرق</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.leaders}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">أعضاء</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.members}</p>
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
              placeholder="ابحث بالاسم أو البريد أو اسم الفريق..."
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

          {/* Team Filter */}
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

          {/* Role Filter */}
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

      {/* Participants Grid */}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const bio = parseBio(p.user.bioAr || p.user.bio);
            const isExpanded = expandedCard === p.id;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Top section */}
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
                    <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      {p.user.email}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {/* Track */}
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
                  {/* Team */}
                  {p.team && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600">
                      <UsersRound className="w-3 h-3" />
                      {p.team.teamNameAr || p.team.teamName}
                    </span>
                  )}
                  {/* College */}
                  {bio.college && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600">
                      <GraduationCap className="w-3 h-3" />
                      {bio.college}
                    </span>
                  )}
                </div>

                {/* Expandable details */}
                <button
                  onClick={() =>
                    setExpandedCard(isExpanded ? null : p.id)
                  }
                  className="w-full flex items-center justify-center gap-1 mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-400 hover:text-brand-500 transition-colors"
                >
                  {isExpanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-2 text-[11px]">
                    {bio.major && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                        <span>التخصص: {bio.major}</span>
                      </div>
                    )}
                    {bio.role && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <UserCircle className="w-3.5 h-3.5 text-gray-400" />
                        <span>الدور: {bio.role}</span>
                      </div>
                    )}
                    {bio.studentId && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Hash className="w-3.5 h-3.5 text-gray-400" />
                        <span>الرقم الجامعي: {bio.studentId}</span>
                      </div>
                    )}
                    {bio.uniEmail && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>الإيميل الجامعي: {bio.uniEmail}</span>
                      </div>
                    )}
                    {p.user.phone && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{p.user.phone}</span>
                      </div>
                    )}
                    {bio.techLink && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
                        <a
                          href={bio.techLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-500 hover:underline truncate"
                        >
                          الملف التقني
                        </a>
                      </div>
                    )}
                    {p.user.nationalId && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Hash className="w-3.5 h-3.5 text-gray-400" />
                        <span>المعرف: {p.user.nationalId}</span>
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
