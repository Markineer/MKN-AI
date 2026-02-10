"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Loader2,
  UserCheck,
  X,
  ChevronLeft,
  ChevronDown,
  MapPin,
} from "lucide-react";
import Link from "next/link";

interface Track {
  id: string;
  name: string;
  nameAr: string;
  color: string | null;
}

interface Judge {
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
  };
  track: Track | null;
}

interface SearchUser {
  id: string;
  firstName: string;
  firstNameAr: string | null;
  lastName: string;
  lastNameAr: string | null;
  email: string;
}

export default function JudgesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [judges, setJudges] = useState<Judge[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingTrack, setUpdatingTrack] = useState<string | null>(null);
  const [openTrackDropdown, setOpenTrackDropdown] = useState<string | null>(null);

  // Fetch judges + tracks
  useEffect(() => {
    async function fetchJudges() {
      try {
        const res = await fetch(`/api/events/${eventId}/judges`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setJudges(data.judges || []);
        setTracks(data.tracks || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchJudges();
  }, [eventId]);

  // Debounced search
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(search)}&limit=10`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const existingIds = judges.map(j => j.user.id);
        setSearchResults(
          (data.users || [])
            .filter((u: any) => !existingIds.includes(u.id))
            .map((u: any) => ({
              id: u.id,
              firstName: u.firstName || "",
              firstNameAr: u.firstNameAr || null,
              lastName: u.lastName || "",
              lastNameAr: u.lastNameAr || null,
              email: u.email,
            }))
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, judges]);

  // Close track dropdown on outside click
  useEffect(() => {
    function handleClick() {
      setOpenTrackDropdown(null);
    }
    if (openTrackDropdown) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [openTrackDropdown]);

  async function addJudge(userId: string) {
    setAdding(true);
    try {
      const res = await fetch(`/api/events/${eventId}/judges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      const member = await res.json();
      setJudges(prev => [member, ...prev]);
      setSearch("");
      setSearchResults([]);
    } catch {
      // silently fail
    } finally {
      setAdding(false);
    }
  }

  async function removeJudge(memberId: string) {
    setDeleting(memberId);
    try {
      const res = await fetch(`/api/events/${eventId}/judges?memberId=${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setJudges(prev => prev.filter(j => j.id !== memberId));
    } catch {
      // silently fail
    } finally {
      setDeleting(null);
    }
  }

  async function assignTrack(memberId: string, trackId: string | null) {
    setUpdatingTrack(memberId);
    try {
      const res = await fetch(`/api/events/${eventId}/judges/track`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, trackId }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setJudges(prev => prev.map(j => j.id === memberId ? updated : j));
    } catch {
      // silently fail
    } finally {
      setUpdatingTrack(null);
      setOpenTrackDropdown(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  // Group judges by track for summary
  const trackSummary = tracks.map(t => ({
    ...t,
    judgeCount: judges.filter(j => j.trackId === t.id).length,
  }));
  const unassignedCount = judges.filter(j => !j.trackId).length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
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
            <h1 className="text-2xl font-bold text-elm-navy">المحكمون</h1>
            <p className="text-sm text-gray-500">{judges.length} محكم مسجل في الفعالية</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة محكم
        </button>
      </div>

      {/* Track Summary Bar */}
      {tracks.length > 0 && judges.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {trackSummary.map(t => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 bg-white text-xs"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: t.color || "#7C3AED" }}
              />
              <span className="font-medium text-gray-700">{t.nameAr || t.name}</span>
              <span className="text-gray-400">{t.judgeCount} محكم</span>
            </div>
          ))}
          {unassignedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-100 bg-amber-50 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-medium text-amber-700">غير مخصص</span>
              <span className="text-amber-500">{unassignedCount} محكم</span>
            </div>
          )}
        </div>
      )}

      {/* Judges Grid */}
      {judges.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-elm-navy mb-2">لا يوجد محكمون</h3>
          <p className="text-sm text-gray-500 mb-6">ابدأ بإضافة محكمين لهذه الفعالية</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600"
          >
            إضافة محكم
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {judges.map((judge) => (
            <div
              key={judge.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 font-bold text-lg">
                    {(judge.user.firstNameAr || judge.user.firstName || "?")[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-elm-navy">
                      {judge.user.firstNameAr || judge.user.firstName} {judge.user.lastNameAr || judge.user.lastName}
                    </h3>
                    <p className="text-[11px] text-gray-400">{judge.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeJudge(judge.id)}
                  disabled={deleting === judge.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  {deleting === judge.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Status + Track */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  judge.status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  <UserCheck className="w-3 h-3" />
                  {judge.status === "APPROVED" ? "معتمد" : "قيد المراجعة"}
                </span>

                {/* Track badge */}
                {judge.track && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: (judge.track.color || "#7C3AED") + "15",
                      color: judge.track.color || "#7C3AED",
                    }}
                  >
                    <MapPin className="w-3 h-3" />
                    {judge.track.nameAr || judge.track.name}
                  </span>
                )}
              </div>

              {/* Track Selector */}
              {tracks.length > 0 && (
                <div className="mt-3 relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTrackDropdown(openTrackDropdown === judge.id ? null : judge.id);
                    }}
                    disabled={updatingTrack === judge.id}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {updatingTrack === judge.id ? (
                        <span className="text-gray-400">جاري التحديث...</span>
                      ) : judge.track ? (
                        <span>{judge.track.nameAr || judge.track.name}</span>
                      ) : (
                        <span className="text-gray-400">تحديد المسار</span>
                      )}
                    </span>
                    {updatingTrack === judge.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>

                  {openTrackDropdown === judge.id && (
                    <div
                      className="absolute z-20 top-full mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => assignTrack(judge.id, null)}
                        className={`w-full text-right px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                          !judge.trackId ? "text-brand-600 font-medium bg-brand-50" : "text-gray-600"
                        }`}
                      >
                        بدون مسار
                      </button>
                      {tracks.map(t => (
                        <button
                          key={t.id}
                          onClick={() => assignTrack(judge.id, t.id)}
                          className={`w-full text-right px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                            judge.trackId === t.id ? "text-brand-600 font-medium bg-brand-50" : "text-gray-600"
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: t.color || "#7C3AED" }}
                          />
                          {t.nameAr || t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Judge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-elm-navy">إضافة محكم</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearch("");
                  setSearchResults([]);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن مستخدم بالاسم أو البريد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                autoFocus
              />
              {searchLoading && <Loader2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
            </div>

            {/* Results */}
            <div className="max-h-64 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => addJudge(user.id)}
                      disabled={adding}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 rounded-xl text-right transition-colors disabled:opacity-50"
                    >
                      <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 text-sm font-bold">
                        {(user.firstNameAr || user.firstName || "?")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-elm-navy truncate">
                          {user.firstNameAr || user.firstName} {user.lastNameAr || user.lastName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      {adding ? (
                        <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 text-brand-500" />
                      )}
                    </button>
                  ))}
                </div>
              ) : search.trim() && !searchLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">لم يتم العثور على نتائج</p>
                </div>
              ) : !search.trim() ? (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">اكتب اسم أو بريد المحكم للبحث</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
