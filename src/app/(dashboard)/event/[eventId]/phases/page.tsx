"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import {
  Layers,
  Plus,
  AlertTriangle,
  Play,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { Phase, PhaseStatus } from "./components/types";
import { statusConfig } from "./components/constants";
import PhaseTimeline from "./components/PhaseTimeline";
import PhaseCard from "./components/PhaseCard";
import { PhaseFormModal, DeleteConfirmModal } from "./components/PhaseFormModal";

export default function PhasesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [phases, setPhases] = useState<Phase[]>([]);
  const [totalTeams, setTotalTeams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [deletingPhase, setDeletingPhase] = useState<Phase | null>(null);

  const fetchPhases = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/events/${eventId}/phases`);
      if (!res.ok) throw new Error("فشل تحميل المراحل");
      const data = await res.json();
      setPhases(data.phases || []);
      setTotalTeams(data.totalTeams || 0);
      if (!expandedPhase && data.phases?.length > 0) {
        const active = data.phases.find((p: Phase) => p.status === "ACTIVE");
        if (active) setExpandedPhase(active.id);
      }
    } catch (err) {
      console.error("Failed to fetch phases:", err);
      setError("فشل تحميل بيانات المراحل. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchPhases();
  }, [eventId, fetchPhases]);

  const handleStatusChange = async (phaseId: string, newStatus: PhaseStatus) => {
    const statusLabel = statusConfig[newStatus].label;
    if (!confirm(`هل أنت متأكد من تغيير حالة المرحلة إلى "${statusLabel}"؟`)) return;
    try {
      const res = await fetch(`/api/events/${eventId}/phases/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("فشل تحديث الحالة");
      fetchPhases();
    } catch (err) {
      console.error("Failed to change status:", err);
      alert("فشل تحديث حالة المرحلة");
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Phase Management" titleAr="إدارة المراحل" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400">جاري تحميل المراحل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <TopBar title="Phase Management" titleAr="إدارة المراحل" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => { setLoading(true); fetchPhases(); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm rounded-xl hover:bg-brand-600 transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Phase Management" titleAr="إدارة المراحل" />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">مراحل الفعالية</h2>
            <p className="text-sm text-gray-500 mt-1">
              {phases.length} مراحل | {phases.filter((p) => p.isElimination).length} مراحل تصفية |{" "}
              {totalTeams} فريق
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPhases}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة مرحلة
            </button>
          </div>
        </div>

        {/* Timeline */}
        {phases.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-[11px] text-gray-400 mb-3 font-medium">الجدول الزمني للمراحل</p>
            <PhaseTimeline phases={phases} />
          </div>
        )}

        {/* Phase Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Layers className="w-6 h-6 text-brand-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-elm-navy">{phases.length}</p>
            <p className="text-[11px] text-gray-500">إجمالي المراحل</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <Play className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-700">
              {phases.filter((p) => p.status === "ACTIVE").length}
            </p>
            <p className="text-[11px] text-gray-500">مراحل نشطة</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">
              {phases.filter((p) => p.isElimination).length}
            </p>
            <p className="text-[11px] text-gray-500">مراحل تصفية</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <CheckCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">
              {phases.filter((p) => p.status === "COMPLETED").length}
            </p>
            <p className="text-[11px] text-gray-500">مراحل مكتملة</p>
          </div>
        </div>

        {/* Phase Cards */}
        {phases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Layers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-400 mb-2">لا توجد مراحل بعد</p>
            <p className="text-[11px] text-gray-300 mb-4">أضف أول مرحلة للفعالية</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة مرحلة
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                isExpanded={expandedPhase === phase.id}
                onToggle={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                eventId={eventId}
                onRefresh={fetchPhases}
                onEdit={(p) => setEditingPhase(p)}
                onDelete={(p) => setDeletingPhase(p)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <PhaseFormModal
          eventId={eventId}
          phase={null}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchPhases}
        />
      )}

      {editingPhase && (
        <PhaseFormModal
          eventId={eventId}
          phase={editingPhase}
          onClose={() => setEditingPhase(null)}
          onSaved={fetchPhases}
        />
      )}

      {deletingPhase && (
        <DeleteConfirmModal
          phase={deletingPhase}
          eventId={eventId}
          onClose={() => setDeletingPhase(null)}
          onDeleted={fetchPhases}
        />
      )}
    </div>
  );
}
