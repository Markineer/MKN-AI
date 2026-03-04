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
  Mail,
  Send,
  Clock,
  CheckCircle,
  Copy,
  RefreshCw,
  AlertCircle,
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
  trackIds: string[];
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

interface Invitation {
  id: string;
  email: string;
  trackId: string | null;
  trackIds: string[];
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
  track: Track | null;
}

export default function JudgesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [judges, setJudges] = useState<Judge[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingTrack, setUpdatingTrack] = useState<string | null>(null);
  const [openTrackDropdown, setOpenTrackDropdown] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTrackIds, setInviteTrackIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [lastAcceptUrl, setLastAcceptUrl] = useState("");

  // Fetch judges + tracks + invitations
  useEffect(() => {
    async function fetchData() {
      try {
        const [judgesRes, invitesRes] = await Promise.all([
          fetch(`/api/events/${eventId}/judges`),
          fetch(`/api/events/${eventId}/judges/invite`),
        ]);
        if (judgesRes.ok) {
          const data = await judgesRes.json();
          setJudges(data.judges || []);
          setTracks(data.tracks || []);
        }
        if (invitesRes.ok) {
          const data = await invitesRes.json();
          setInvitations(data.invitations || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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

  async function assignTracks(memberId: string, trackIds: string[]) {
    setUpdatingTrack(memberId);
    try {
      const res = await fetch(`/api/events/${eventId}/judges/track`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, trackIds }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setJudges(prev => prev.map(j => j.id === memberId ? { ...updated, trackIds } : j));
    } catch {
      // silently fail
    } finally {
      setUpdatingTrack(null);
    }
  }

  async function sendInvite() {
    setInviteError("");
    setInviteSuccess("");
    setLastAcceptUrl("");

    if (!inviteEmail.trim()) {
      setInviteError("البريد الإلكتروني مطلوب");
      return;
    }

    setInviting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/judges/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), trackIds: inviteTrackIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إرسال الدعوة");

      setInviteSuccess(data.message);
      setLastAcceptUrl(data.acceptUrl || "");
      setInvitations(prev => [data.invitation, ...prev]);
      setInviteEmail("");
      setInviteTrackIds([]);
    } catch (e: any) {
      setInviteError(e.message);
    } finally {
      setInviting(false);
    }
  }

  async function deleteInvitation(invitationId: string) {
    try {
      await fetch(`/api/events/${eventId}/judges/invite?invitationId=${invitationId}`, { method: "DELETE" });
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
    } catch {
      // silently fail
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
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
    judgeCount: judges.filter(j =>
      (j.trackIds && j.trackIds.length > 0 ? j.trackIds.includes(t.id) : j.trackId === t.id)
    ).length,
  }));
  const unassignedCount = judges.filter(j => !j.trackId && (!j.trackIds || j.trackIds.length === 0)).length;

  const pendingInvites = invitations.filter(i => !i.acceptedAt && new Date(i.expiresAt) > new Date());
  const acceptedInvites = invitations.filter(i => i.acceptedAt);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-brand-200 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-50 shadow-sm transition-colors"
          >
            <Mail className="w-4 h-4" />
            دعوة عبر الإيميل
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة محكم
          </button>
        </div>
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

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            دعوات معلقة ({pendingInvites.length})
          </h3>
          <div className="space-y-2">
            {pendingInvites.map(inv => (
              <div
                key={inv.id}
                className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800" dir="ltr">{inv.email}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>أرسلت {new Date(inv.createdAt).toLocaleDateString("ar-SA")}</span>
                      {inv.trackIds && inv.trackIds.length > 0 ? (
                        inv.trackIds.map(tid => {
                          const t = tracks.find(tr => tr.id === tid);
                          return t ? (
                            <span key={tid} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: (t.color || "#7C3AED") + "15", color: t.color || "#7C3AED" }}>
                              {t.nameAr || t.name}
                            </span>
                          ) : null;
                        })
                      ) : inv.track ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: (inv.track.color || "#7C3AED") + "15", color: inv.track.color || "#7C3AED" }}>
                          {inv.track.nameAr}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteInvitation(inv.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                  title="إلغاء الدعوة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Judges Grid */}
      {judges.length === 0 && pendingInvites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-elm-navy mb-2">لا يوجد محكمون</h3>
          <p className="text-sm text-gray-500 mb-6">ابدأ بإضافة محكمين أو دعوتهم عبر الإيميل</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-6 py-2.5 bg-white border border-brand-200 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-50"
            >
              دعوة عبر الإيميل
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600"
            >
              إضافة محكم
            </button>
          </div>
        </div>
      ) : judges.length > 0 && (
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

                {/* Track badges */}
                {judge.trackIds && judge.trackIds.length > 0 ? (
                  judge.trackIds.map(tid => {
                    const t = tracks.find(tr => tr.id === tid);
                    return t ? (
                      <span
                        key={tid}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: (t.color || "#7C3AED") + "15",
                          color: t.color || "#7C3AED",
                        }}
                      >
                        <MapPin className="w-3 h-3" />
                        {t.nameAr || t.name}
                      </span>
                    ) : null;
                  })
                ) : judge.track ? (
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
                ) : null}
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
                      ) : (judge.trackIds && judge.trackIds.length > 0) ? (
                        <span>{judge.trackIds.length} مسار</span>
                      ) : judge.track ? (
                        <span>{judge.track.nameAr || judge.track.name}</span>
                      ) : (
                        <span className="text-gray-400">تحديد المسارات</span>
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
                      className="absolute z-20 top-full mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg p-2 space-y-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tracks.map(t => {
                        const judgeTrackIds = judge.trackIds && judge.trackIds.length > 0
                          ? judge.trackIds
                          : (judge.trackId ? [judge.trackId] : []);
                        const isSelected = judgeTrackIds.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                              isSelected ? "text-brand-600 font-medium bg-brand-50" : "text-gray-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newIds = e.target.checked
                                  ? [...judgeTrackIds, t.id]
                                  : judgeTrackIds.filter(id => id !== t.id);
                                assignTracks(judge.id, newIds);
                              }}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                            />
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: t.color || "#7C3AED" }}
                            />
                            {t.nameAr || t.name}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Judge Modal (existing users) */}
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

      {/* Invite Judge Modal (via email) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-elm-navy flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-500" />
                دعوة محكم عبر الإيميل
              </h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail("");
                  setInviteTrackIds([]);
                  setInviteError("");
                  setInviteSuccess("");
                  setLastAcceptUrl("");
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              أدخل البريد الإلكتروني للمحكم. سيتم إرسال دعوة له لإنشاء حسابه والانضمام كمحكم.
            </p>

            {inviteError && (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="bg-emerald-50 text-emerald-700 text-xs px-3 py-2 rounded-xl mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {inviteSuccess}
              </div>
            )}

            {lastAcceptUrl && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-3">
                <p className="text-[10px] text-blue-600 mb-1">رابط القبول (للمشاركة يدوياً):</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-blue-800 truncate flex-1" dir="ltr">{lastAcceptUrl}</p>
                  <button
                    onClick={() => copyToClipboard(lastAcceptUrl)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-100 text-blue-500"
                    title="نسخ الرابط"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="judge@example.com"
                  dir="ltr"
                />
              </div>

              {tracks.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">المسارات (اختياري)</label>
                  <div className="space-y-1.5 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    {tracks.map(t => (
                      <label key={t.id} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={inviteTrackIds.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInviteTrackIds(prev => [...prev, t.id]);
                            } else {
                              setInviteTrackIds(prev => prev.filter(id => id !== t.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.color || "#7C3AED" }}
                        />
                        <span className="text-sm text-gray-600 group-hover:text-elm-navy transition-colors">
                          {t.nameAr || t.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={sendInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 shadow-sm transition-colors disabled:opacity-50"
              >
                {inviting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                إرسال الدعوة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
