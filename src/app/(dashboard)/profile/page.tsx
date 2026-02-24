"use client";

import { useState, useEffect, Fragment } from "react";
import TopBar from "@/components/layout/TopBar";
import {
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  Trophy,
  Award,
  Users,
  Target,
  Star,
  ChevronLeft,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  Medal,
  FileText,
  Pencil,
  Building2,
  BookOpen,
  Briefcase,
  Sparkles,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface Profile {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  city: string | null;
  country: string | null;
  university: string | null;
  college: string | null;
  major: string | null;
  specialization: string | null;
  roles: string[];
  memberSince: string;
}

interface Stats {
  hackathons: number;
  challenges: number;
  competitions: number;
  teams: number;
  certificates: number;
  bestRank: number | null;
}

interface TeamMember {
  name: string;
  role: string;
}

interface EventTeam {
  id: string;
  name: string;
  role: string;
  trackName: string | null;
  trackColor: string | null;
  totalScore: number | null;
  rank: number | null;
  status: string;
  projectTitle: string | null;
  members: TeamMember[];
}

interface EventCertificate {
  id: string;
  type: string;
  title: string;
  rank: number | null;
  rankLabel: string | null;
  totalScore: number | null;
  issuedAt: string;
}

interface EventHistoryItem {
  eventId: string;
  eventName: string;
  eventType: string;
  eventCategory: string;
  eventStatus: string;
  eventColor: string | null;
  startDate: string;
  endDate: string;
  role: string;
  memberStatus: string;
  team: EventTeam | null;
  certificates: EventCertificate[];
}

interface ProfileData {
  profile: Profile;
  stats: Stats;
  eventHistory: EventHistoryItem[];
}

// ─── Label Maps ─────────────────────────────────────────────────

const eventTypeLabels: Record<string, string> = {
  HACKATHON: "هاكاثون",
  CHALLENGE: "تحدي",
  COMPETITION: "مسابقة",
};

const eventTypeColors: Record<string, { bg: string; text: string }> = {
  HACKATHON: { bg: "bg-purple-50", text: "text-purple-700" },
  CHALLENGE: { bg: "bg-blue-50", text: "text-blue-700" },
  COMPETITION: { bg: "bg-amber-50", text: "text-amber-700" },
};

const eventStatusLabels: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: "مسودة", bg: "bg-gray-100", text: "text-gray-600" },
  REGISTRATION: { label: "تسجيل", bg: "bg-blue-50", text: "text-blue-600" },
  ACTIVE: { label: "نشط", bg: "bg-emerald-50", text: "text-emerald-600" },
  COMPLETED: { label: "مكتمل", bg: "bg-purple-50", text: "text-purple-600" },
  CANCELLED: { label: "ملغي", bg: "bg-red-50", text: "text-red-600" },
};

const teamRoleLabels: Record<string, string> = {
  LEADER: "قائد الفريق",
  MEMBER: "عضو",
};

const certTypeLabels: Record<string, { label: string; bg: string; text: string; icon: typeof Award }> = {
  WINNER: { label: "فائز", bg: "bg-amber-50", text: "text-amber-700", icon: Trophy },
  PARTICIPATION: { label: "مشاركة", bg: "bg-blue-50", text: "text-blue-700", icon: Award },
  ACHIEVEMENT: { label: "إنجاز", bg: "bg-purple-50", text: "text-purple-700", icon: Star },
};

const roleLabels: Record<string, string> = {
  PARTICIPANT: "مشارك",
  JUDGE: "محكم",
  MENTOR: "مرشد",
  ORGANIZER: "منظم",
  ADMIN: "مدير",
  RESEARCHER: "باحث",
};

// ─── Edit Profile Modal ─────────────────────────────────────────

function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstNameAr, setFirstNameAr] = useState(profile.firstName || "");
  const [lastNameAr, setLastNameAr] = useState(profile.lastName || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [city, setCity] = useState(profile.city || "");
  const [universityAr, setUniversityAr] = useState(profile.university || "");
  const [collegeAr, setCollegeAr] = useState(profile.college || "");
  const [majorAr, setMajorAr] = useState(profile.major || "");
  const [specializationAr, setSpecializationAr] = useState(profile.specialization || "");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSave() {
    setErrorMsg("");
    setSuccessMsg("");

    if (!firstNameAr.trim() || !lastNameAr.trim()) {
      setErrorMsg("يرجى إدخال الاسم الأول واسم العائلة");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstNameAr: firstNameAr.trim(),
          lastNameAr: lastNameAr.trim(),
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          city: city.trim() || null,
          universityAr: universityAr.trim() || null,
          collegeAr: collegeAr.trim() || null,
          majorAr: majorAr.trim() || null,
          specializationAr: specializationAr.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل في حفظ التعديلات");
      }

      setSuccessMsg("تم حفظ التعديلات بنجاح");
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-elm-navy">تعديل البيانات</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Messages */}
          {errorMsg && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">
                الاسم الأول *
              </label>
              <input
                type="text"
                dir="rtl"
                value={firstNameAr}
                onChange={(e) => setFirstNameAr(e.target.value)}
                placeholder="الاسم الأول"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-elm-navy mb-1.5">
                اسم العائلة *
              </label>
              <input
                type="text"
                dir="rtl"
                value={lastNameAr}
                onChange={(e) => setLastNameAr(e.target.value)}
                placeholder="اسم العائلة"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-elm-navy mb-1.5">
              رقم الجوال
            </label>
            <input
              type="tel"
              dir="rtl"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-elm-navy mb-1.5">
              نبذة شخصية
            </label>
            <textarea
              dir="rtl"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="اكتب نبذة مختصرة عنك..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 resize-none"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-elm-navy mb-1.5">
              المدينة
            </label>
            <input
              type="text"
              dir="rtl"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="مثال: الرياض"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>

          {/* Academic Section Header */}
          <div className="flex items-center gap-2 pt-2">
            <GraduationCap className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-bold text-elm-navy">البيانات الأكاديمية</span>
          </div>

          {/* University */}
          <div>
            <label className="block text-sm font-medium text-elm-navy mb-1.5">
              الجامعة
            </label>
            <input
              type="text"
              dir="rtl"
              value={universityAr}
              onChange={(e) => setUniversityAr(e.target.value)}
              placeholder="مثال: جامعة الملك سعود"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>

          {/* College */}
          <div>
            <label className="block text-sm font-medium text-elm-navy mb-1.5">
              الكلية
            </label>
            <input
              type="text"
              dir="rtl"
              value={collegeAr}
              onChange={(e) => setCollegeAr(e.target.value)}
              placeholder="مثال: كلية علوم الحاسب"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>

          {/* Major */}
          <div>
            <label className="block text-sm font-medium text-elm-navy mb-1.5">
              التخصص
            </label>
            <input
              type="text"
              dir="rtl"
              value={majorAr}
              onChange={(e) => setMajorAr(e.target.value)}
              placeholder="مثال: علوم الحاسب"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-elm-navy mb-1.5">
              المسار الدقيق
            </label>
            <input
              type="text"
              dir="rtl"
              value={specializationAr}
              onChange={(e) => setSpecializationAr(e.target.value)}
              placeholder="مثال: ذكاء اصطناعي"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 shadow-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  function handleSaved() {
    setLoading(true);
    fetchProfile();
  }

  // ─── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <TopBar title="Profile" titleAr="الملف الشخصي" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-3">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <TopBar title="Profile" titleAr="الملف الشخصي" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">فشل في تحميل الملف الشخصي</p>
            <button
              onClick={() => {
                setLoading(true);
                fetchProfile();
              }}
              className="mt-4 px-5 py-2 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { profile, stats, eventHistory } = data;

  // Get the first letter for the avatar
  const avatarLetter = profile.fullName?.charAt(0) || profile.firstName?.charAt(0) || "م";

  // Build the academic breadcrumb segments
  const academicSegments = [
    profile.university,
    profile.college,
    profile.major,
    profile.specialization,
  ].filter(Boolean);

  return (
    <div>
      <TopBar title="Profile" titleAr="الملف الشخصي" />

      <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* ═══ A. Personal Info Card ═══ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-2 bg-gradient-to-l from-brand-700 to-brand-500" />

          <div className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 bg-gradient-to-bl from-brand-700 to-brand-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-brand">
                <span className="text-3xl font-bold text-white">{avatarLetter}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    {/* Name */}
                    <h2 className="text-2xl font-bold text-elm-navy">{profile.fullName}</h2>

                    {/* Role Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {profile.roles.map((role) => (
                        <span
                          key={role}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600"
                        >
                          {roleLabels[role] || role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setShowEdit(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-50 text-brand-600 rounded-xl text-sm font-bold hover:bg-brand-100 transition-colors self-start"
                  >
                    <Pencil className="w-4 h-4" />
                    تعديل البيانات
                  </button>
                </div>

                {/* Academic Breadcrumb */}
                {academicSegments.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1.5 mt-4">
                    <GraduationCap className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    {academicSegments.map((segment, idx) => (
                      <Fragment key={idx}>
                        <span className="text-sm text-gray-600">{segment}</span>
                        {idx < academicSegments.length - 1 && (
                          <ChevronLeft className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        )}
                      </Fragment>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">{profile.bio}</p>
                )}

                {/* Meta Info Items */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
                  {profile.city && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {profile.city}
                      {profile.country && `, ${profile.country}`}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {profile.email}
                  </span>
                  {profile.phone && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {profile.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    عضو منذ{" "}
                    {new Date(profile.memberSince).toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ B. Stats Grid ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Hackathons */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-elm-navy">{stats.hackathons}</p>
            <p className="text-xs text-gray-500 mt-1">هاكاثونات</p>
          </div>

          {/* Challenges */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-elm-navy">{stats.challenges}</p>
            <p className="text-xs text-gray-500 mt-1">تحديات</p>
          </div>

          {/* Teams */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-elm-navy">{stats.teams}</p>
            <p className="text-xs text-gray-500 mt-1">الفرق</p>
          </div>

          {/* Certificates */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-elm-navy">{stats.certificates}</p>
            <p className="text-xs text-gray-500 mt-1">الشهادات</p>
          </div>
        </div>

        {/* Best Rank Badge */}
        {stats.bestRank && (
          <div className="bg-gradient-to-l from-brand-700 to-brand-500 rounded-2xl p-5 flex items-center gap-4 text-white shadow-brand">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Crown className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <p className="text-sm text-white/70">أفضل ترتيب</p>
              <p className="text-3xl font-bold">
                المركز {stats.bestRank === 1 ? "الأول" : stats.bestRank === 2 ? "الثاني" : stats.bestRank === 3 ? "الثالث" : stats.bestRank}
              </p>
            </div>
          </div>
        )}

        {/* ═══ C. Event History Timeline ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-brand-500" />
            <h3 className="text-xl font-bold text-elm-navy">سجل الفعاليات</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mr-2">
              {eventHistory.length}
            </span>
          </div>

          {eventHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">لا توجد فعاليات حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventHistory.map((event) => {
                const typeCfg = eventTypeColors[event.eventType] || {
                  bg: "bg-gray-50",
                  text: "text-gray-600",
                };
                const statusCfg = eventStatusLabels[event.eventStatus] || {
                  label: event.eventStatus,
                  bg: "bg-gray-100",
                  text: "text-gray-600",
                };

                return (
                  <div
                    key={event.eventId}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* Event color accent */}
                    <div
                      className="h-1"
                      style={{
                        backgroundColor: event.eventColor || "#7C3AED",
                      }}
                    />

                    <div className="p-5 lg:p-6">
                      {/* Event Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h4 className="text-lg font-bold text-elm-navy">
                              {event.eventName}
                            </h4>
                            {/* Type Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.text}`}
                            >
                              {eventTypeLabels[event.eventType] || event.eventType}
                            </span>
                            {/* Status Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
                            >
                              {statusCfg.label}
                            </span>
                          </div>

                          {/* Role + Dates */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {event.role === "PARTICIPANT"
                                ? "مشارك"
                                : event.role === "JUDGE"
                                ? "محكم"
                                : event.role === "MENTOR"
                                ? "مرشد"
                                : event.role}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {new Date(event.startDate).toLocaleDateString("ar-SA", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                              {" ← "}
                              {new Date(event.endDate).toLocaleDateString("ar-SA", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Team Details */}
                      {event.team && (
                        <div className="mt-4 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-brand-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-elm-navy">
                                  {event.team.name}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {teamRoleLabels[event.team.role] || event.team.role}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Track */}
                              {event.team.trackName && (
                                <span
                                  className="text-[10px] font-medium px-2.5 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: event.team.trackColor
                                      ? `${event.team.trackColor}20`
                                      : "#f3f4f6",
                                    color: event.team.trackColor || "#6b7280",
                                  }}
                                >
                                  {event.team.trackName}
                                </span>
                              )}
                              {/* Score */}
                              {event.team.totalScore != null && (
                                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                                  {event.team.totalScore}%
                                </span>
                              )}
                              {/* Rank */}
                              {event.team.rank != null && (
                                <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                                  <Trophy className="w-3.5 h-3.5" />
                                  المركز {event.team.rank}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Project Title */}
                          {event.team.projectTitle && (
                            <div className="flex items-center gap-2 mb-3">
                              <FileText className="w-3.5 h-3.5 text-gray-400" />
                              <p className="text-sm text-gray-600">
                                <span className="text-gray-400">المشروع: </span>
                                {event.team.projectTitle}
                              </p>
                            </div>
                          )}

                          {/* Team Members */}
                          {event.team.members && event.team.members.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] text-gray-400">الأعضاء:</span>
                              {event.team.members.map((member, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[10px] bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-600"
                                >
                                  <User className="w-2.5 h-2.5" />
                                  {member.name}
                                  {member.role === "LEADER" && (
                                    <Crown className="w-2.5 h-2.5 text-amber-500" />
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Certificates */}
                      {event.certificates && event.certificates.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {event.certificates.map((cert) => {
                            const certCfg = certTypeLabels[cert.type] || {
                              label: cert.type,
                              bg: "bg-gray-50",
                              text: "text-gray-600",
                              icon: Award,
                            };
                            const CertIcon = certCfg.icon;

                            return (
                              <div
                                key={cert.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${certCfg.bg} border-transparent`}
                              >
                                <CertIcon className={`w-4 h-4 ${certCfg.text}`} />
                                <div>
                                  <p className={`text-xs font-bold ${certCfg.text}`}>
                                    {cert.title}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] ${certCfg.text} opacity-80`}>
                                      {certCfg.label}
                                    </span>
                                    {cert.rankLabel && (
                                      <span className="text-[10px] text-gray-500">
                                        - {cert.rankLabel}
                                      </span>
                                    )}
                                    {cert.totalScore != null && (
                                      <span className="text-[10px] font-bold text-gray-500">
                                        {cert.totalScore}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ D. Edit Profile Modal ═══ */}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Slide-in animation */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}
