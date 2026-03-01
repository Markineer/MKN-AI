"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
  Users,
  AlertCircle,
  Send,
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
    id: string;
    email: string;
    firstNameAr: string | null;
    lastNameAr: string | null;
    firstName: string | null;
    lastName: string | null;
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

// Fields to show in diff view
const FIELD_LABELS: Record<string, string> = {
  name: "اسم الفريق (إنجليزي)",
  nameAr: "اسم الفريق (عربي)",
  description: "وصف الفريق",
  trackId: "المسار",
  projectTitle: "عنوان المشروع (إنجليزي)",
  projectTitleAr: "عنوان المشروع (عربي)",
  projectDescription: "وصف المشروع (إنجليزي)",
  projectDescriptionAr: "وصف المشروع (عربي)",
  repositoryUrl: "رابط المستودع",
  presentationUrl: "رابط العرض",
  demoUrl: "رابط العرض التجريبي",
  miroBoard: "رابط Miro",
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

  useEffect(() => {
    fetchRequests();
  }, [eventId, filterStatus]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/events/${eventId}/edit-requests?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data.editRequests || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(requestId: string, action: "approve" | "reject") {
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/events/${eventId}/edit-requests/${requestId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reviewNote }),
        }
      );
      if (res.ok) {
        setReviewingId(null);
        setReviewNote("");
        fetchRequests();
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(false);
    }
  }

  function getChangedFields(original: any, proposed: any) {
    if (!original || !proposed) return [];
    const changed: { key: string; label: string; from: any; to: any }[] = [];
    for (const key of Object.keys(FIELD_LABELS)) {
      const ov = original[key] ?? "";
      const pv = proposed[key] ?? "";
      if (String(ov) !== String(pv)) {
        changed.push({
          key,
          label: FIELD_LABELS[key],
          from: ov || "—",
          to: pv || "—",
        });
      }
    }
    return changed;
  }

  function getMemberChanges(original: any, proposed: any) {
    if (!original?.members || !proposed?.members) return { added: [], removed: [] };
    const origIds = new Set(original.members.map((m: any) => m.userId));
    const propIds = new Set(proposed.members.map((m: any) => m.userId));

    const added = proposed.members.filter((m: any) => !origIds.has(m.userId));
    const removed = original.members.filter((m: any) => !propIds.has(m.userId));
    return { added, removed };
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
          <Link
            href={`/event/${eventId}/teams`}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-elm-navy">
              طلبات تعديل الفرق
            </h1>
            <p className="text-sm text-gray-500">{requests.length} طلب</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
              filterStatus === tab.key
                ? "bg-brand-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FileEdit className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-elm-navy mb-2">
            لا توجد طلبات تعديل
          </h3>
          <p className="text-sm text-gray-500">
            يمكنك إرسال طلب تعديل من صفحة الفرق
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === req.id;
            const changedFields = getChangedFields(req.originalData, req.proposedData);
            const memberChanges = getMemberChanges(req.originalData, req.proposedData);

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Request Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full flex items-center gap-4 p-5 text-right"
                >
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <FileEdit className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-elm-navy">
                        {req.team.nameAr || req.team.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      {req.leader && (
                        <span>
                          القائد: {req.leader.firstNameAr || req.leader.firstName}{" "}
                          {req.leader.lastNameAr || req.leader.lastName}
                        </span>
                      )}
                      <span>
                        {new Date(req.createdAt).toLocaleDateString("ar-SA")}
                      </span>
                      {req.status === "SUBMITTED" && changedFields.length > 0 && (
                        <span className="text-blue-500">
                          {changedFields.length} تعديل
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                    {req.status === "SUBMITTED" && req.proposedData ? (
                      <>
                        {/* Changed fields diff */}
                        {changedFields.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-500 mb-3">
                              التعديلات المقترحة
                            </h4>
                            <div className="space-y-2">
                              {changedFields.map((f) => (
                                <div
                                  key={f.key}
                                  className="bg-white rounded-xl p-3 border border-gray-100"
                                >
                                  <p className="text-[11px] text-gray-500 mb-1">
                                    {f.label}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-500 line-through flex-1 truncate">
                                      {f.from}
                                    </span>
                                    <span className="text-gray-300">←</span>
                                    <span className="text-xs text-emerald-600 font-medium flex-1 truncate">
                                      {f.to}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Member changes */}
                        {(memberChanges.added.length > 0 ||
                          memberChanges.removed.length > 0) && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              تغييرات الأعضاء
                            </h4>
                            <div className="space-y-1">
                              {memberChanges.added.map((m: any) => (
                                <div
                                  key={m.userId}
                                  className="flex items-center gap-2 bg-emerald-50 rounded-lg p-2 text-xs text-emerald-700"
                                >
                                  <span>+</span>
                                  <span>
                                    {m.firstNameAr || m.email} (إضافة)
                                  </span>
                                </div>
                              ))}
                              {memberChanges.removed.map((m: any) => (
                                <div
                                  key={m.userId}
                                  className="flex items-center gap-2 bg-red-50 rounded-lg p-2 text-xs text-red-700"
                                >
                                  <span>-</span>
                                  <span>
                                    {m.firstNameAr || m.email} (حذف)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {changedFields.length === 0 &&
                          memberChanges.added.length === 0 &&
                          memberChanges.removed.length === 0 && (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-400">
                                لا توجد تعديلات
                              </p>
                            </div>
                          )}

                        {/* Review actions */}
                        {reviewingId === req.id ? (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <label className="block text-xs text-gray-500 mb-2">
                              ملاحظة (اختياري)
                            </label>
                            <textarea
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              rows={2}
                              placeholder="أضف ملاحظة..."
                              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setReviewingId(null);
                                  setReviewNote("");
                                }}
                                className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                              >
                                إلغاء
                              </button>
                              <button
                                onClick={() => handleReview(req.id, "reject")}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-500 text-white text-xs font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "رفض"
                                )}
                              </button>
                              <button
                                onClick={() => handleReview(req.id, "approve")}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-emerald-500 text-white text-xs font-medium rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "موافقة"
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                            <button
                              onClick={() => setReviewingId(req.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-medium rounded-xl hover:bg-brand-700 transition-colors"
                            >
                              مراجعة
                            </button>
                          </div>
                        )}
                      </>
                    ) : req.status === "PENDING" ? (
                      <div className="text-center py-4">
                        <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          بانتظار القائد لتعديل البيانات
                        </p>
                      </div>
                    ) : req.status === "APPROVED" ? (
                      <div className="text-center py-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          تمت الموافقة وتحديث البيانات
                        </p>
                        {req.reviewNote && (
                          <p className="text-xs text-gray-400 mt-2">
                            ملاحظة: {req.reviewNote}
                          </p>
                        )}
                      </div>
                    ) : req.status === "REJECTED" ? (
                      <div className="text-center py-4">
                        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">تم رفض الطلب</p>
                        {req.reviewNote && (
                          <p className="text-xs text-gray-400 mt-2">
                            السبب: {req.reviewNote}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          انتهت صلاحية الرابط
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
