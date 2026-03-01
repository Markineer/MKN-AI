"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, ChevronLeft, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, FileEdit, Users, AlertCircle, Send,
} from "lucide-react";

interface EditRequest {
  id: string;
  teamId: string;
  status: string;
  originalData: any;
  proposedData: any;
  reviewNote: string | null;
  createdAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  team: { id: string; name: string; nameAr: string | null };
  leader: {
    id: string; email: string;
    firstNameAr: string | null; lastNameAr: string | null;
    firstName: string | null; lastName: string | null;
  } | null;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  PENDING: { label: "بانتظار القائد", bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  SUBMITTED: { label: "بانتظار المراجعة", bg: "bg-blue-50", text: "text-blue-700", icon: Send },
  APPROVED: { label: "تمت الموافقة", bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "مرفوض", bg: "bg-red-50", text: "text-red-700", icon: XCircle },
  EXPIRED: { label: "منتهي", bg: "bg-gray-50", text: "text-gray-500", icon: Clock },
};

const TABS = [
  { key: "", label: "الكل" },
  { key: "SUBMITTED", label: "بانتظار المراجعة" },
  { key: "PENDING", label: "بانتظار القائد" },
  { key: "APPROVED", label: "تمت الموافقة" },
  { key: "REJECTED", label: "مرفوض" },
];

// Member field labels for diff view
const MEMBER_FIELD_LABELS: Record<string, string> = {
  fullName: "الاسم الكامل",
  personalEmail: "البريد الشخصي",
  universityEmail: "البريد الجامعي",
  studentId: "الرقم الجامعي",
  college: "الكلية",
  major: "التخصص",
  techLink: "الرابط التقني",
  memberRole: "الدور",
};

export default function EditRequestsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchRequests(); }, [eventId, filterStatus]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filterStatus) p.set("status", filterStatus);
      const res = await fetch(`/api/events/${eventId}/edit-requests?${p}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data.editRequests || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  async function handleReview(requestId: string, action: "approve" | "reject") {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/edit-requests/${requestId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote }),
      });
      if (res.ok) { setReviewingId(null); setReviewNote(""); fetchRequests(); }
    } catch { /* silent */ } finally { setActionLoading(false); }
  }

  // Compare team-level fields
  function getTeamChanges(original: any, proposed: any) {
    if (!original || !proposed) return [];
    const changes: { label: string; from: string; to: string }[] = [];
    if (original.nameAr !== proposed.nameAr) {
      changes.push({ label: "اسم الفريق", from: original.nameAr || "—", to: proposed.nameAr || "—" });
    }
    if (original.trackId !== proposed.trackId) {
      changes.push({ label: "المسار", from: original.trackId || "—", to: proposed.trackId || "—" });
    }
    return changes;
  }

  // Compare member-level field changes
  function getMemberChanges(original: any, proposed: any) {
    if (!original?.members || !proposed?.members) return [];
    const changes: { memberName: string; fields: { label: string; from: string; to: string }[] }[] = [];

    for (const pm of proposed.members) {
      const om = original.members.find((m: any) => m.userId === pm.userId);
      if (!om) continue;

      const fieldChanges: { label: string; from: string; to: string }[] = [];
      for (const [key, label] of Object.entries(MEMBER_FIELD_LABELS)) {
        const ov = String(om[key] || "");
        const pv = String(pm[key] || "");
        if (ov !== pv) {
          fieldChanges.push({ label, from: ov || "—", to: pv || "—" });
        }
      }
      if (fieldChanges.length > 0) {
        changes.push({ memberName: pm.fullName || om.fullName || pm.personalEmail, fields: fieldChanges });
      }
    }
    return changes;
  }

  function getTotalChangeCount(original: any, proposed: any) {
    const teamChanges = getTeamChanges(original, proposed).length;
    const memberChanges = getMemberChanges(original, proposed).reduce((sum, m) => sum + m.fields.length, 0);
    return teamChanges + memberChanges;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href={`/event/${eventId}/teams`} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-elm-navy">طلبات تعديل الفرق</h1>
            <p className="text-sm text-gray-500">{requests.length} طلب</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${filterStatus === tab.key ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FileEdit className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-elm-navy mb-2">لا توجد طلبات تعديل</h3>
          <p className="text-sm text-gray-500">يمكنك إرسال طلب تعديل من صفحة الفرق</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === req.id;
            const teamChanges = getTeamChanges(req.originalData, req.proposedData);
            const memberChanges = getMemberChanges(req.originalData, req.proposedData);
            const totalChanges = getTotalChangeCount(req.originalData, req.proposedData);

            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <button onClick={() => setExpandedId(isExpanded ? null : req.id)} className="w-full flex items-center gap-4 p-5 text-right">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <FileEdit className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-elm-navy">{req.team.nameAr || req.team.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      {req.leader && (
                        <span>القائد: {req.leader.firstNameAr || req.leader.firstName} {req.leader.lastNameAr || req.leader.lastName}</span>
                      )}
                      <span>{new Date(req.createdAt).toLocaleDateString("ar-SA")}</span>
                      {req.status === "SUBMITTED" && totalChanges > 0 && (
                        <span className="text-blue-500">{totalChanges} تعديل</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                    {req.status === "SUBMITTED" && req.proposedData ? (
                      <>
                        {/* Team-level changes */}
                        {teamChanges.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-500 mb-3">تعديلات الفريق</h4>
                            <div className="space-y-2">
                              {teamChanges.map((c, i) => (
                                <div key={i} className="bg-white rounded-xl p-3 border border-gray-100">
                                  <p className="text-[11px] text-gray-500 mb-1">{c.label}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-500 line-through flex-1 truncate">{c.from}</span>
                                    <span className="text-gray-300">←</span>
                                    <span className="text-xs text-emerald-600 font-medium flex-1 truncate">{c.to}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Member-level changes */}
                        {memberChanges.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              تعديلات بيانات الأعضاء
                            </h4>
                            <div className="space-y-3">
                              {memberChanges.map((mc, i) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                  <div className="px-3 py-2 bg-purple-50 border-b border-gray-100">
                                    <p className="text-xs font-bold text-purple-700">{mc.memberName}</p>
                                  </div>
                                  <div className="p-3 space-y-2">
                                    {mc.fields.map((f, j) => (
                                      <div key={j}>
                                        <p className="text-[10px] text-gray-400 mb-0.5">{f.label}</p>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-red-500 line-through flex-1 truncate">{f.from}</span>
                                          <span className="text-gray-300">←</span>
                                          <span className="text-xs text-emerald-600 font-medium flex-1 truncate">{f.to}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {totalChanges === 0 && (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-400">لا توجد تعديلات</p>
                          </div>
                        )}

                        {/* Review actions */}
                        {reviewingId === req.id ? (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <label className="block text-xs text-gray-500 mb-2">ملاحظة (اختياري)</label>
                            <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
                              rows={2} placeholder="أضف ملاحظة..."
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => { setReviewingId(null); setReviewNote(""); }}
                                className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">إلغاء</button>
                              <button onClick={() => handleReview(req.id, "reject")} disabled={actionLoading}
                                className="px-4 py-2 bg-red-500 text-white text-xs font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors">
                                {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "رفض"}
                              </button>
                              <button onClick={() => handleReview(req.id, "approve")} disabled={actionLoading}
                                className="px-4 py-2 bg-emerald-500 text-white text-xs font-medium rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                                {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "موافقة"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                            <button onClick={() => setReviewingId(req.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-medium rounded-xl hover:bg-brand-700 transition-colors">
                              مراجعة
                            </button>
                          </div>
                        )}
                      </>
                    ) : req.status === "PENDING" ? (
                      <div className="text-center py-4">
                        <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">بانتظار القائد لتعديل البيانات</p>
                      </div>
                    ) : req.status === "APPROVED" ? (
                      <div className="text-center py-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">تمت الموافقة وتحديث البيانات</p>
                        {req.reviewNote && <p className="text-xs text-gray-400 mt-2">ملاحظة: {req.reviewNote}</p>}
                      </div>
                    ) : req.status === "REJECTED" ? (
                      <div className="text-center py-4">
                        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">تم رفض الطلب</p>
                        {req.reviewNote && <p className="text-xs text-gray-400 mt-2">السبب: {req.reviewNote}</p>}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">انتهت صلاحية الرابط</p>
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
