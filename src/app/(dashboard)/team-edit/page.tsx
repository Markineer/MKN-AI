"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Users,
  X,
  Search,
  Crown,
  MapPin,
  Link as LinkIcon,
  FileText,
} from "lucide-react";

interface MemberInfo {
  userId: string;
  email: string;
  firstName: string | null;
  firstNameAr: string | null;
  lastName: string | null;
  lastNameAr: string | null;
  role: string;
}

interface TrackInfo {
  id: string;
  name: string;
  nameAr: string;
  color: string | null;
  maxTeams: number | null;
  currentTeams: number;
  remaining: number | null;
  isFull: boolean;
}

interface TeamData {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  trackId: string | null;
  projectTitle: string | null;
  projectTitleAr: string | null;
  projectDescription: string | null;
  projectDescriptionAr: string | null;
  repositoryUrl: string | null;
  presentationUrl: string | null;
  demoUrl: string | null;
  miroBoard: string | null;
  members: MemberInfo[];
}

export default function TeamEditPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [team, setTeam] = useState<TeamData | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [availableParticipants, setAvailableParticipants] = useState<MemberInfo[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [trackId, setTrackId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectTitleAr, setProjectTitleAr] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDescriptionAr, setProjectDescriptionAr] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [presentationUrl, setPresentationUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [miroBoard, setMiroBoard] = useState("");
  const [members, setMembers] = useState<MemberInfo[]>([]);

  const [memberSearch, setMemberSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("رابط غير صالح");
      setLoading(false);
      return;
    }
    fetchData();
  }, [token]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/team-edit/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        setLoading(false);
        return;
      }

      setTeam(data.team);
      setEvent(data.event);
      setTracks(data.tracks);
      setAvailableParticipants(data.availableParticipants);

      // Pre-fill form
      setName(data.team.name || "");
      setNameAr(data.team.nameAr || "");
      setDescription(data.team.description || "");
      setTrackId(data.team.trackId);
      setProjectTitle(data.team.projectTitle || "");
      setProjectTitleAr(data.team.projectTitleAr || "");
      setProjectDescription(data.team.projectDescription || "");
      setProjectDescriptionAr(data.team.projectDescriptionAr || "");
      setRepositoryUrl(data.team.repositoryUrl || "");
      setPresentationUrl(data.team.presentationUrl || "");
      setDemoUrl(data.team.demoUrl || "");
      setMiroBoard(data.team.miroBoard || "");
      setMembers(data.team.members);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setShowConfirm(false);
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/team-edit/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nameAr,
          description,
          trackId,
          projectTitle,
          projectTitleAr,
          projectDescription,
          projectDescriptionAr,
          repositoryUrl,
          presentationUrl,
          demoUrl,
          miroBoard,
          members: members.map((m) => ({ userId: m.userId, role: m.role })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSubmitting(false);
    }
  }

  function addMember(participant: MemberInfo) {
    setMembers((prev) => [
      ...prev,
      { ...participant, role: "MEMBER" },
    ]);
    setAvailableParticipants((prev) =>
      prev.filter((p) => p.userId !== participant.userId)
    );
    setMemberSearch("");
  }

  function removeMember(userId: string) {
    const member = members.find((m) => m.userId === userId);
    if (!member || member.role === "LEADER") return;

    setMembers((prev) => prev.filter((m) => m.userId !== userId));
    setAvailableParticipants((prev) => [
      ...prev,
      { ...member, role: "MEMBER" },
    ]);
  }

  const filteredParticipants = memberSearch.trim()
    ? availableParticipants.filter(
        (p) =>
          p.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
          (p.firstNameAr && p.firstNameAr.includes(memberSearch)) ||
          (p.lastNameAr && p.lastNameAr.includes(memberSearch)) ||
          (p.firstName &&
            p.firstName.toLowerCase().includes(memberSearch.toLowerCase()))
      )
    : [];

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-gray-500">جاري التحقق من الرابط...</p>
      </div>
    );
  }

  // Error
  if (error && !team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-elm-navy">{error}</h2>
        <p className="text-sm text-gray-500">
          تأكد من صحة الرابط أو تواصل مع المشرف
        </p>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-elm-navy">
          تم إرسال التعديلات بنجاح
        </h2>
        <p className="text-sm text-gray-500">
          بانتظار موافقة المشرف على التعديلات
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-elm-navy mb-2">
          تعديل بيانات الفريق
        </h1>
        <p className="text-sm text-gray-500">
          {event?.titleAr || event?.title} — {team?.nameAr || team?.name}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-elm-navy mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            المعلومات الأساسية
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                اسم الفريق (عربي)
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                اسم الفريق (إنجليزي)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1">
              وصف الفريق
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
            />
          </div>
        </div>

        {/* Section 2: Track Selection */}
        {tracks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-elm-navy mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              المسار
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => !track.isFull && setTrackId(track.id)}
                  disabled={track.isFull}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 text-right transition-all ${
                    trackId === track.id
                      ? "border-brand-500 bg-brand-50"
                      : track.isFull
                      ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-gray-100 bg-white hover:border-brand-200"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: track.color || "#7C3AED" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-elm-navy truncate">
                      {track.nameAr || track.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {track.isFull
                        ? "مكتمل"
                        : track.remaining !== null
                        ? `${track.remaining} مقعد متاح`
                        : "مفتوح"}
                    </p>
                  </div>
                  {trackId === track.id && (
                    <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Project Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-elm-navy mb-4 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            تفاصيل المشروع
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                عنوان المشروع (عربي)
              </label>
              <input
                type="text"
                value={projectTitleAr}
                onChange={(e) => setProjectTitleAr(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                عنوان المشروع (إنجليزي)
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1">
              وصف المشروع (عربي)
            </label>
            <textarea
              value={projectDescriptionAr}
              onChange={(e) => setProjectDescriptionAr(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1">
              وصف المشروع (إنجليزي)
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                رابط المستودع (GitHub)
              </label>
              <input
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                رابط العرض التقديمي
              </label>
              <input
                type="url"
                value={presentationUrl}
                onChange={(e) => setPresentationUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                رابط العرض التجريبي
              </label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                رابط Miro Board
              </label>
              <input
                type="url"
                value={miroBoard}
                onChange={(e) => setMiroBoard(e.target.value)}
                placeholder="https://miro.com/..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Team Members */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-elm-navy mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            أعضاء الفريق ({members.length})
            {event?.minTeamSize && event?.maxTeamSize && (
              <span className="text-[11px] text-gray-400 font-normal">
                (الحد: {event.minTeamSize} - {event.maxTeamSize})
              </span>
            )}
          </h2>

          {/* Current members */}
          <div className="space-y-2 mb-4">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-bold text-xs flex-shrink-0">
                  {(member.firstNameAr || member.firstName || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-elm-navy truncate">
                      {member.firstNameAr || member.firstName}{" "}
                      {member.lastNameAr || member.lastName}
                    </p>
                    {member.role === "LEADER" && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700">
                        <Crown className="w-2.5 h-2.5" />
                        قائد
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">{member.email}</p>
                </div>
                {member.role !== "LEADER" && (
                  <button
                    onClick={() => removeMember(member.userId)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add member search */}
          {availableParticipants.length > 0 && (
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو البريد لإضافة عضو..."
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>

              {/* Search results dropdown */}
              {filteredParticipants.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredParticipants.map((p) => (
                    <button
                      key={p.userId}
                      onClick={() => addMember(p)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-right transition-colors"
                    >
                      <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-xs flex-shrink-0">
                        {(p.firstNameAr || p.firstName || "?")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-elm-navy truncate">
                          {p.firstNameAr || p.firstName}{" "}
                          {p.lastNameAr || p.lastName}
                        </p>
                        <p className="text-[11px] text-gray-400">{p.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting || !name.trim()}
            className="flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ وإرسال التعديلات
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-elm-navy mb-2">
              تأكيد إرسال التعديلات
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              سيتم إرسال التعديلات للمشرف للمراجعة. لن تتمكن من استخدام هذا
              الرابط مرة أخرى بعد الإرسال.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
              >
                تأكيد الإرسال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
