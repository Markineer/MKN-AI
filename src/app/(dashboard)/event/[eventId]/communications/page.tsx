"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import {
  Send,
  Mail,
  Users,
  UserCheck,
  UserX,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Image,
  Calendar,
  X,
  ChevronDown,
  Search,
  Check,
  RefreshCw,
  FileText,
} from "lucide-react";

type MessageType = "ACCEPTANCE" | "REJECTION" | "CUSTOM";
type RecipientType = "ALL" | "ADVANCED" | "ELIMINATED" | "SPECIFIC";

interface PhaseInfo {
  id: string;
  nameAr: string;
  name: string;
  phaseNumber: number;
  status: string;
  isElimination: boolean;
  advanced: number;
  eliminated: number;
  totalTeams: number;
  _count: { results: number };
}

interface TeamInfo {
  id: string;
  name: string;
  nameAr: string | null;
  track: { nameAr: string; name: string } | null;
  _count: { members: number };
}

const MESSAGE_TEMPLATES: Record<MessageType, string> = {
  ACCEPTANCE: `يسعدنا إبلاغكم بأن فريقكم قد تم قبوله واجتاز هذه المرحلة بنجاح.\n\nنتطلع لرؤية إبداعاتكم في المرحلة القادمة. بالتوفيق!`,
  REJECTION: `نشكركم على مشاركتكم الفاعلة في هذه المرحلة.\n\nللأسف لم يتم اختيار فريقكم للتأهل للمرحلة القادمة. نتمنى لكم التوفيق في المشاركات القادمة.`,
  CUSTOM: "",
};

export default function CommunicationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [phases, setPhases] = useState<PhaseInfo[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [eventName, setEventName] = useState("");

  // Form state
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [messageType, setMessageType] = useState<MessageType>("ACCEPTANCE");
  const [recipients, setRecipients] = useState<RecipientType>("ADVANCED");
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [teamSearch, setTeamSearch] = useState("");
  const [message, setMessage] = useState(MESSAGE_TEMPLATES.ACCEPTANCE);
  const [acceptanceDate, setAcceptanceDate] = useState("");
  const [acceptanceTime, setAcceptanceTime] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Send state
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    failed: number;
    totalTeams: number;
    totalEmails: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/notify`);
      if (!res.ok) throw new Error("فشل التحميل");
      const data = await res.json();
      setPhases(data.phases || []);
      setTeams(data.teams || []);
      setEventName(data.event?.titleAr || data.event?.title || "");
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchData();
  }, [eventId, fetchData]);

  // When message type changes, update template
  const handleMessageTypeChange = (type: MessageType) => {
    setMessageType(type);
    if (type !== "CUSTOM") {
      setMessage(MESSAGE_TEMPLATES[type]);
    }
    // Adjust default recipients
    if (type === "ACCEPTANCE") setRecipients("ADVANCED");
    else if (type === "REJECTION") setRecipients("ELIMINATED");
    else setRecipients("ALL");
  };

  // Get the currently selected phase data
  const currentPhase = phases.find((p) => p.id === selectedPhase);

  // Compute recipient count preview
  const getRecipientPreview = () => {
    if (!currentPhase && recipients !== "ALL" && recipients !== "SPECIFIC") return 0;

    if (recipients === "ADVANCED") return currentPhase?.advanced || 0;
    if (recipients === "ELIMINATED") return currentPhase?.eliminated || 0;
    if (recipients === "SPECIFIC") return selectedTeams.size;
    if (recipients === "ALL") {
      if (currentPhase) return currentPhase.totalTeams;
      return teams.length;
    }
    return 0;
  };

  // Filter teams for selection
  const filteredTeams = teams.filter((t) => {
    const name = t.nameAr || t.name;
    return name.toLowerCase().includes(teamSearch.toLowerCase());
  });

  const handleSend = async () => {
    if (!message.trim()) {
      alert("الرجاء كتابة نص الرسالة");
      return;
    }

    const recipientCount = getRecipientPreview();
    if (recipientCount === 0) {
      alert("لا يوجد مستلمين");
      return;
    }

    if (!confirm(`سيتم إرسال البريد إلى ${recipientCount} فريق. هل أنت متأكد؟`)) return;

    setSending(true);
    setResult(null);

    try {
      let dateStr: string | null = null;
      if (acceptanceDate) {
        dateStr = acceptanceDate;
        if (acceptanceTime) dateStr += ` الساعة ${acceptanceTime}`;
      }

      const res = await fetch(`/api/events/${eventId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseId: selectedPhase || undefined,
          recipients,
          teamIds: recipients === "SPECIFIC" ? Array.from(selectedTeams) : undefined,
          messageType,
          message,
          acceptanceDate: dateStr,
          imageUrl: imageUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "فشل الإرسال");
        return;
      }

      setResult(data);
    } catch (err) {
      console.error("Failed to send:", err);
      alert("فشل الإرسال");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Communications" titleAr="الرسائل والإشعارات" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Communications" titleAr="الرسائل والإشعارات" />
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">الرسائل والإشعارات</h2>
            <p className="text-sm text-gray-500 mt-1">
              أرسل رسائل بريد إلكتروني للفرق المشاركة
            </p>
          </div>
          <button
            onClick={fetchData}
            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Success Result Banner */}
        {result && (
          <div
            className={`rounded-2xl p-5 border ${
              result.failed === 0
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {result.failed === 0 ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-elm-navy">
                  تم إرسال {result.sent} رسالة بنجاح إلى {result.totalTeams} فريق
                </p>
                {result.failed > 0 && (
                  <p className="text-[11px] text-amber-600 mt-0.5">
                    فشل إرسال {result.failed} رسالة
                  </p>
                )}
              </div>
              <button
                onClick={() => setResult(null)}
                className="mr-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Step 1: Choose Phase */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-bold text-elm-navy">اختر المرحلة</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedPhase("")}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors text-right ${
                  selectedPhase === ""
                    ? "bg-brand-50 border-brand-200 text-brand-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>كل الفعالية</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{teams.length} فريق</p>
              </button>
              {phases.map((phase) => (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhase(phase.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors text-right ${
                    selectedPhase === phase.id
                      ? "bg-brand-50 border-brand-200 text-brand-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded font-bold">
                      {phase.phaseNumber}
                    </span>
                    <span className="truncate">{phase.nameAr}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {phase.advanced > 0 && (
                      <span className="text-[10px] text-emerald-600">{phase.advanced} متأهل</span>
                    )}
                    {phase.eliminated > 0 && (
                      <span className="text-[10px] text-red-500">{phase.eliminated} مستبعد</span>
                    )}
                    {phase.advanced === 0 && phase.eliminated === 0 && (
                      <span className="text-[10px] text-gray-400">{phase.totalTeams} فريق</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Message Type */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-bold text-elm-navy">نوع الرسالة</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleMessageTypeChange("ACCEPTANCE")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  messageType === "ACCEPTANCE"
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <CheckCircle
                  className={`w-6 h-6 mx-auto mb-2 ${
                    messageType === "ACCEPTANCE" ? "text-emerald-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-xs font-bold ${
                    messageType === "ACCEPTANCE" ? "text-emerald-700" : "text-gray-600"
                  }`}
                >
                  قبول / تأهيل
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">إشعار بالقبول</p>
              </button>
              <button
                onClick={() => handleMessageTypeChange("REJECTION")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  messageType === "REJECTION"
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <UserX
                  className={`w-6 h-6 mx-auto mb-2 ${
                    messageType === "REJECTION" ? "text-red-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-xs font-bold ${
                    messageType === "REJECTION" ? "text-red-700" : "text-gray-600"
                  }`}
                >
                  رفض / استبعاد
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">إشعار بالاستبعاد</p>
              </button>
              <button
                onClick={() => handleMessageTypeChange("CUSTOM")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  messageType === "CUSTOM"
                    ? "border-brand-400 bg-brand-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <Mail
                  className={`w-6 h-6 mx-auto mb-2 ${
                    messageType === "CUSTOM" ? "text-brand-600" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-xs font-bold ${
                    messageType === "CUSTOM" ? "text-brand-700" : "text-gray-600"
                  }`}
                >
                  رسالة مخصصة
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">محتوى حر</p>
              </button>
            </div>
          </div>

          {/* Step 3: Recipients */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-bold text-elm-navy">المستلمين</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setRecipients("ALL")}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-colors ${
                  recipients === "ALL"
                    ? "bg-brand-50 border-brand-200 text-brand-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                جميع الفرق
              </button>
              {currentPhase && currentPhase.advanced > 0 && (
                <button
                  onClick={() => setRecipients("ADVANCED")}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-colors ${
                    recipients === "ADVANCED"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  المتأهلون ({currentPhase.advanced})
                </button>
              )}
              {currentPhase && currentPhase.eliminated > 0 && (
                <button
                  onClick={() => setRecipients("ELIMINATED")}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-colors ${
                    recipients === "ELIMINATED"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  المستبعدون ({currentPhase.eliminated})
                </button>
              )}
              <button
                onClick={() => setRecipients("SPECIFIC")}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-colors ${
                  recipients === "SPECIFIC"
                    ? "bg-purple-50 border-purple-200 text-purple-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                فرق محددة
              </button>
            </div>

            {/* Team selector for SPECIFIC */}
            {recipients === "SPECIFIC" && (
              <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    {selectedTeams.size} فريق محدد
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTeams(new Set(teams.map((t) => t.id)))}
                      className="text-[11px] text-brand-600 hover:text-brand-700 font-medium"
                    >
                      تحديد الكل
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setSelectedTeams(new Set())}
                      className="text-[11px] text-gray-500 hover:text-gray-700 font-medium"
                    >
                      إلغاء الكل
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="ابحث عن فريق..."
                    className="w-full pr-9 pl-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {filteredTeams.map((team) => {
                    const isSelected = selectedTeams.has(team.id);
                    return (
                      <label
                        key={team.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-brand-50" : "hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-brand-500 border-brand-500"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-xs font-medium text-elm-navy">
                            {team.nameAr || team.name}
                          </span>
                          {team.track && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {team.track.nameAr || team.track.name}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {team._count.members} عضو
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Compose Message */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                4
              </div>
              <h3 className="text-sm font-bold text-elm-navy">محتوى الرسالة</h3>
            </div>
            <div className="space-y-4">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    تاريخ القبول (اختياري)
                  </label>
                  <input
                    type="date"
                    value={acceptanceDate}
                    onChange={(e) => setAcceptanceDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    الساعة (اختياري)
                  </label>
                  <input
                    type="time"
                    value={acceptanceTime}
                    onChange={(e) => setAcceptanceTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>

              {/* Message body */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">نص الرسالة *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none leading-relaxed"
                  placeholder="اكتب نص الرسالة هنا..."
                  dir="rtl"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  رابط صورة (اختياري)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="https://example.com/image.jpg"
                  dir="ltr"
                />
                {imageUrl && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 inline-block">
                    <img
                      src={imageUrl}
                      alt="معاينة"
                      className="max-h-24 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 5: Preview & Send */}
          <div className="p-6 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                5
              </div>
              <h3 className="text-sm font-bold text-elm-navy">المعاينة والإرسال</h3>
            </div>

            {/* Preview Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-elm-navy">{getRecipientPreview()}</p>
                  <p className="text-[10px] text-gray-500">فريق مستلم</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-elm-navy">
                    {selectedPhase
                      ? currentPhase?.nameAr || "—"
                      : "كل الفعالية"}
                  </p>
                  <p className="text-[10px] text-gray-500">المرحلة</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-elm-navy">
                    {messageType === "ACCEPTANCE"
                      ? "قبول"
                      : messageType === "REJECTION"
                      ? "رفض"
                      : "مخصصة"}
                  </p>
                  <p className="text-[10px] text-gray-500">نوع الرسالة</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-elm-navy">
                    {recipients === "ALL"
                      ? "الكل"
                      : recipients === "ADVANCED"
                      ? "المتأهلون"
                      : recipients === "ELIMINATED"
                      ? "المستبعدون"
                      : "محدد"}
                  </p>
                  <p className="text-[10px] text-gray-500">المستلمين</p>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-500">
                سيتم إرسال البريد لجميع أعضاء الفرق المحددة
              </p>
              <button
                onClick={handleSend}
                disabled={sending || !message.trim() || getRecipientPreview() === 0}
                className="px-8 py-3 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                إرسال الرسائل
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
