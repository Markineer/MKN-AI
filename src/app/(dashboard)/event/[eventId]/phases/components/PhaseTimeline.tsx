"use client";

import { Check } from "lucide-react";
import type { Phase } from "./types";

export default function PhaseTimeline({ phases }: { phases: Phase[] }) {
  return (
    <div className="flex items-center w-full overflow-x-auto pb-1">
      {phases.map((phase, idx) => {
        const isActive = phase.status === "ACTIVE";
        const isCompleted = phase.status === "COMPLETED";
        const isLast = idx === phases.length - 1;

        return (
          <div key={phase.id} className="flex items-center flex-1 min-w-0">
            {/* Step */}
            <div className="flex flex-col items-center gap-1.5 min-w-fit">
              {/* Dot */}
              <div
                className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isCompleted
                    ? "bg-blue-500 text-white"
                    : isActive
                    ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : phase.phaseNumber}
              </div>
              {/* Label */}
              <div className="text-center">
                <p
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    isActive
                      ? "text-emerald-700 font-bold"
                      : isCompleted
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                >
                  {phase.nameAr}
                </p>
                {phase.isElimination && (
                  <span className="text-[8px] text-red-500 font-bold">تصفية</span>
                )}
              </div>
            </div>
            {/* Connector */}
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-2 min-w-[20px] self-start mt-[14px] ${
                  isCompleted ? "bg-blue-300" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
