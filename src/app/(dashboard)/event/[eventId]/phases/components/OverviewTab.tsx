"use client";

import type { Phase } from "./types";
import { phaseTypeLabels, evaluationMethodLabels, qualificationModeLabels } from "./constants";

export default function OverviewTab({ phase }: { phase: Phase }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-elm-navy">{phase.totalParticipants}</p>
        <p className="text-[11px] text-gray-500 mt-1">إجمالي الفرق</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-elm-navy">{phase.criteria.length}</p>
        <p className="text-[11px] text-gray-500 mt-1">معايير التقييم</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-elm-navy">{phase.evaluatedTeams}</p>
        <p className="text-[11px] text-gray-500 mt-1">فرق تم تقييمها</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-elm-navy">{phase.pendingEvaluation}</p>
        <p className="text-[11px] text-gray-500 mt-1">بانتظار التقييم</p>
      </div>
      {phase.isElimination && (
        <>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">
              {phase.passThreshold != null ? `${phase.passThreshold}%` : "—"}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1">حد النجاح الأدنى</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {phase.maxAdvancing || (phase.advancePercent ? `${phase.advancePercent}%` : "—")}
            </p>
            <p className="text-[11px] text-blue-600 mt-1">
              {phase.maxAdvancing ? "الحد الأقصى للمتأهلين" : "نسبة التأهل"}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{phase.advanced}</p>
            <p className="text-[11px] text-emerald-600 mt-1">متأهلين</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{phase.eliminated}</p>
            <p className="text-[11px] text-red-600 mt-1">مستبعدين</p>
          </div>
        </>
      )}
      {!phase.isElimination && (
        <>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">
              {phaseTypeLabels[phase.phaseType]}
            </p>
            <p className="text-[11px] text-purple-600 mt-1">نوع المرحلة</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">
              {phase.evaluationMethod
                ? evaluationMethodLabels[phase.evaluationMethod]
                : "—"}
            </p>
            <p className="text-[11px] text-amber-600 mt-1">طريقة التقييم</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {qualificationModeLabels[phase.qualificationMode] || "بالدرجات"}
            </p>
            <p className="text-[11px] text-blue-600 mt-1">نمط التأهل</p>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-cyan-700">
              {phase.judgesPerTeam || 1}
            </p>
            <p className="text-[11px] text-cyan-600 mt-1">محكم لكل فريق</p>
          </div>
        </>
      )}
    </div>
  );
}
