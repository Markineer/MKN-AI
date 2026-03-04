"use client";

import { ArrowLeft } from "lucide-react";
import type { Phase } from "./types";
import { statusConfig } from "./constants";

export default function PhaseTimeline({ phases }: { phases: Phase[] }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {phases.map((phase, idx) => {
        const StatusIcon = statusConfig[phase.status].icon;
        return (
          <div key={phase.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                phase.status === "ACTIVE"
                  ? "bg-emerald-50 border-emerald-200 shadow-sm"
                  : phase.status === "COMPLETED"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <StatusIcon
                className={`w-4 h-4 ${
                  phase.status === "ACTIVE"
                    ? "text-emerald-600"
                    : phase.status === "COMPLETED"
                    ? "text-blue-600"
                    : "text-gray-400"
                }`}
              />
              <div className="text-center">
                <p className="text-[10px] text-gray-400">المرحلة {phase.phaseNumber}</p>
                <p
                  className={`text-xs font-bold ${
                    phase.status === "ACTIVE"
                      ? "text-emerald-700"
                      : phase.status === "COMPLETED"
                      ? "text-blue-700"
                      : "text-gray-500"
                  }`}
                >
                  {phase.nameAr}
                </p>
              </div>
              {phase.isElimination && (
                <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                  تصفية
                </span>
              )}
            </div>
            {idx < phases.length - 1 && (
              <ArrowLeft className="w-5 h-5 text-gray-300 mx-1 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
