"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2, Save, AlertCircle, CheckCircle2, Users,
  Crown, MapPin, GraduationCap, Mail, Hash, Link as LinkIcon, User,
} from "lucide-react";

interface MemberData {
  userId: string;
  role: string;
  fullName: string;
  personalEmail: string;
  universityEmail: string;
  studentId: string;
  college: string;
  major: string;
  techLink: string;
  memberRole: string;
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

export default function TeamEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-sm text-gray-500">جاري التحميل...</p>
        </div>
      }
    >
      <TeamEditContent />
    </Suspense>
  );
}

function TeamEditContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [event, setEvent] = useState<any>(null);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);

  // Form state
  const [nameAr, setNameAr] = useState("");
  const [trackId, setTrackId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) { setError("رابط غير صالح"); setLoading(false); return; }
    fetchData();
  }, [token]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/team-edit/${token}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "حدث خطأ"); setLoading(false); return; }

      setEvent(data.event);
      setTracks(data.tracks);
      setNameAr(data.team.nameAr || "");
      setTrackId(data.team.trackId);
      setMembers(data.team.members);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  function updateMember(index: number, field: keyof MemberData, value: string) {
    setMembers((prev) => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  }

  async function handleSubmit() {
    setShowConfirm(false);
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/team-edit/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameAr, trackId, members }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "حدث خطأ"); setSubmitting(false); return; }
      setSuccess(true);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-sm text-gray-500">جاري التحقق من الرابط...</p>
      </div>
    );
  }

  if (error && members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">{error}</h2>
        <p className="text-sm text-gray-500">تأكد من صحة الرابط أو تواصل مع المشرف</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">تم إرسال التعديلات بنجاح</h2>
        <p className="text-sm text-gray-500">بانتظار موافقة المشرف على التعديلات</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">تعديل بيانات الفريق</h1>
        <p className="text-sm text-gray-500">{event?.titleAr || event?.title}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Team Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            معلومات الفريق
          </h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">اسم الفريق</label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>

        {/* Section 2: Track */}
        {tracks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                      ? "border-purple-500 bg-purple-50"
                      : track.isFull
                      ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-gray-100 bg-white hover:border-purple-200"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: track.color || "#7C3AED" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{track.nameAr || track.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {track.isFull ? "مكتمل" : track.remaining !== null ? `${track.remaining} مقعد متاح` : "مفتوح"}
                    </p>
                  </div>
                  {trackId === track.id && <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Members */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 px-1">
            <GraduationCap className="w-4 h-4" />
            بيانات الأعضاء ({members.length})
          </h2>

          {members.map((member, idx) => (
            <div key={member.userId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">
                  {idx + 1}
                </div>
                <h3 className="text-sm font-bold text-gray-800 flex-1">
                  {member.fullName || `عضو ${idx + 1}`}
                </h3>
                {member.role === "LEADER" && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <Crown className="w-3 h-3" />
                    قائد
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <User className="w-3 h-3" />
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={member.fullName}
                    onChange={(e) => updateMember(idx, "fullName", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                {/* Personal Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Mail className="w-3 h-3" />
                    البريد الشخصي
                  </label>
                  <input
                    type="email"
                    value={member.personalEmail}
                    onChange={(e) => updateMember(idx, "personalEmail", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    dir="ltr"
                  />
                </div>

                {/* University Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Mail className="w-3 h-3" />
                    البريد الجامعي
                  </label>
                  <input
                    type="email"
                    value={member.universityEmail}
                    onChange={(e) => updateMember(idx, "universityEmail", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    dir="ltr"
                  />
                </div>

                {/* Student ID */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Hash className="w-3 h-3" />
                    الرقم الجامعي
                  </label>
                  <input
                    type="text"
                    value={member.studentId}
                    onChange={(e) => updateMember(idx, "studentId", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    dir="ltr"
                  />
                </div>

                {/* College */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <GraduationCap className="w-3 h-3" />
                    الكلية
                  </label>
                  <input
                    type="text"
                    value={member.college}
                    onChange={(e) => updateMember(idx, "college", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                {/* Major */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <GraduationCap className="w-3 h-3" />
                    التخصص
                  </label>
                  <input
                    type="text"
                    value={member.major}
                    onChange={(e) => updateMember(idx, "major", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                {/* Tech Link */}
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <LinkIcon className="w-3 h-3" />
                    الرابط التقني
                  </label>
                  <input
                    type="url"
                    value={member.techLink}
                    onChange={(e) => updateMember(idx, "techLink", e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting || !nameAr.trim()}
            className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ وإرسال التعديلات
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">تأكيد إرسال التعديلات</h3>
            <p className="text-sm text-gray-500 mb-6">
              سيتم إرسال التعديلات للمشرف للمراجعة. لن تتمكن من استخدام هذا الرابط مرة أخرى بعد الإرسال.
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
                className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors"
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
