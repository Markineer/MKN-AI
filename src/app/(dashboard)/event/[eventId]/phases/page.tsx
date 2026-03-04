"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import {
  Plus,
  AlertTriangle,
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
              onClick={() => {
                setLoading(true);
                fetchPhases();
              }}
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

  const activeCount = phases.filter((p) => p.status === "ACTIVE").length;
  const eliminationCount = phases.filter((p) => p.isElimination).length;

  return (
    <div>
      <TopBar title="Phase Management" titleAr="إدارة المراحل" />
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">مراحل الفعالية</h2>
            <p className="text-sm text-gray-500 mt-1">
              {phases.length} مراحل
              {activeCount > 0 && (
                <>
                  {" "}
                  |{" "}
                  <span className="text-emerald-600 font-medium">{activeCount} نشطة</span>
                </>
              )}
              {eliminationCount > 0 && <> | {eliminationCount} تصفية</>}
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
            <PhaseTimeline phases={phases} />
          </div>
        )}

        {/* Phase Cards */}
        {phases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-300" />
            </div>
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
                onToggle={() =>
                  setExpandedPhase(expandedPhase === phase.id ? null : phase.id)
                }
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
