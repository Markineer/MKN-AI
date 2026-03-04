"use client";

import { Target, Users, Calendar, AlertTriangle, ArrowUp, UserCheck } from "lucide-react";
import type { Phase } from "./types";
import { phaseTypeLabels, evaluationMethodLabels, qualificationModeLabels } from "./constants";

export default function OverviewTab({ phase }: { phase: Phase }) {
  const hasEvaluation = phase.evaluationMethod !== null;
  const hasCriteria = phase.criteria.length > 0;
  const evaluationProgress =
    phase.totalParticipants > 0
      ? Math.round((phase.evaluatedTeams / phase.totalParticipants) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Key Info */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <Users className="w-4 h-4 text-brand-500 flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-elm-navy">{phase.totalParticipants}</p>
            <p className="text-[10px] text-gray-500">فريق مشارك</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <Target className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-elm-navy">{phase.criteria.length}</p>
            <p className="text-[10px] text-gray-500">معيار تقييم</p>
          </div>
        </div>
        {hasEvaluation && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <UserCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-elm-navy">
                {evaluationMethodLabels[phase.evaluationMethod!]}
              </p>
              <p className="text-[10px] text-gray-500">طريقة التقييم</p>
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Progress */}
      {hasEvaluation && phase.status !== "UPCOMING" && phase.totalParticipants > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-elm-navy">تقدم التقييم</span>
            <span className="text-xs text-gray-500">
              {phase.evaluatedTeams} / {phase.totalParticipants} فريق
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${evaluationProgress}%` }}
            />
          </div>
          {phase.pendingEvaluation > 0 && (
            <p className="text-[10px] text-amber-600 mt-1.5">
              {phase.pendingEvaluation} فريق بانتظار التقييم
            </p>
          )}
        </div>
      )}

      {/* Elimination Settings */}
      {phase.isElimination && (
        <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
          <p className="text-xs font-bold text-red-700 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            إعدادات التصفية
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {phase.passThreshold != null && (
              <div className="text-center bg-white rounded-lg p-2.5 border border-red-100">
                <p className="text-lg font-bold text-red-700">{phase.passThreshold}%</p>
                <p className="text-[10px] text-red-500">حد النجاح</p>
              </div>
            )}
            {phase.maxAdvancing != null && (
              <div className="text-center bg-white rounded-lg p-2.5 border border-red-100">
                <p className="text-lg font-bold text-blue-700">{phase.maxAdvancing}</p>
                <p className="text-[10px] text-blue-500">الحد الأقصى</p>
              </div>
            )}
            {phase.advancePercent != null && (
              <div className="text-center bg-white rounded-lg p-2.5 border border-red-100">
                <p className="text-lg font-bold text-blue-700">{phase.advancePercent}%</p>
                <p className="text-[10px] text-blue-500">نسبة التأهل</p>
              </div>
            )}
            <div className="text-center bg-white rounded-lg p-2.5 border border-red-100">
              <p className="text-sm font-bold text-purple-700">
                {qualificationModeLabels[phase.qualificationMode]}
              </p>
              <p className="text-[10px] text-purple-500">نمط التأهل</p>
            </div>
          </div>
          {phase.status === "COMPLETED" && (phase.advanced > 0 || phase.eliminated > 0) && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-red-100">
              <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
                <ArrowUp className="w-3 h-3" />
                {phase.advanced} متأهل
              </span>
              <span className="flex items-center gap-1 text-xs text-red-600 font-bold">
                <AlertTriangle className="w-3 h-3" />
                {phase.eliminated} مستبعد
              </span>
            </div>
          )}
        </div>
      )}

      {/* Dates & Info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          {new Date(phase.startDate).toLocaleDateString("ar-SA")} &larr;{" "}
          {new Date(phase.endDate).toLocaleDateString("ar-SA")}
        </span>
        <span className="text-gray-300">|</span>
        <span>{phaseTypeLabels[phase.phaseType]}</span>
        {phase.judgesPerTeam > 1 && (
          <>
            <span className="text-gray-300">|</span>
            <span>{phase.judgesPerTeam} محكم/فريق</span>
          </>
        )}
      </div>

      {/* Action Hints */}
      {!hasCriteria && phase.status !== "COMPLETED" && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            لم يتم إضافة معايير تقييم بعد. انتقل لتاب <strong>معايير التقييم</strong> لإضافتها.
          </p>
        </div>
      )}
      {!hasEvaluation && phase.status !== "COMPLETED" && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            لم يتم تحديد طريقة التقييم. عدّل المرحلة لتحديدها.
          </p>
        </div>
      )}
    </div>
  );
}
