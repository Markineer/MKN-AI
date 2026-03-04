"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  Trophy,
  AlertTriangle,
  Target,
  Edit3,
  Play,
  CheckCircle,
  Trash2,
  BarChart3,
  UserCheck,
  UserX,
  Zap,
  FileText,
} from "lucide-react";
import type { Phase, PhaseStatus } from "./types";
import { phaseTypeIcons, statusConfig, evaluationMethodLabels } from "./constants";
import OverviewTab from "./OverviewTab";
import CriteriaTab from "./CriteriaTab";
import JudgingTab from "./JudgingTab";
import ResultsTab from "./ResultsTab";
import AutoFilterTab from "./AutoFilterTab";
import DeliverablesTab from "./DeliverablesTab";

export default function PhaseCard({
  phase,
  isExpanded,
  onToggle,
  eventId,
  onRefresh,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  phase: Phase;
  isExpanded: boolean;
  onToggle: () => void;
  eventId: string;
  onRefresh: () => void;
  onEdit: (phase: Phase) => void;
  onDelete: (phase: Phase) => void;
  onStatusChange: (phaseId: string, status: PhaseStatus) => void;
}) {
  type TabKey = "overview" | "criteria" | "judging" | "results" | "autofilter" | "deliverables";
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const PhaseIcon = phaseTypeIcons[phase.phaseType];
  const statusCfg = statusConfig[phase.status];
  const StatusIcon = statusCfg.icon;

  const showAutoFilter = phase.evaluationMethod === "AI_AUTO";
  const showJudging = phase.evaluationMethod === "JUDGE_MANUAL" || phase.evaluationMethod === "COMBINED";

  const tabs: { key: TabKey; label: string; icon: any; show: boolean }[] = [
    { key: "overview", label: "نظرة عامة", icon: BarChart3, show: true },
    { key: "criteria", label: "معايير التقييم", icon: Target, show: true },
    { key: "judging", label: "التحكيم", icon: UserCheck, show: showJudging },
    { key: "results", label: "النتائج والتأهيل", icon: Trophy, show: true },
    { key: "autofilter", label: "التصفية التلقائية", icon: Zap, show: showAutoFilter },
    { key: "deliverables", label: "التسليمات", icon: FileText, show: true },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Phase Header */}
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <PhaseIcon className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                المرحلة {phase.phaseNumber}
              </span>
              <h3 className="text-sm font-bold text-elm-navy">{phase.nameAr}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                <StatusIcon className="w-3 h-3 inline ml-1" />
                {statusCfg.label}
              </span>
              {phase.isElimination && (
                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  مرحلة تصفية
                </span>
              )}
              {phase.evaluationMethod && (
                <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                  {evaluationMethodLabels[phase.evaluationMethod]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(phase.startDate).toLocaleDateString("ar-SA")} &larr;{" "}
                {new Date(phase.endDate).toLocaleDateString("ar-SA")}
              </span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {phase.totalParticipants} فريق
              </span>
              <span className="text-[11px] text-gray-400">
                {phase.criteria.length} معيار تقييم
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {phase.isElimination && phase.status === "COMPLETED" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <UserCheck className="w-3.5 h-3.5" />
                {phase.advanced} متأهل
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <UserX className="w-3.5 h-3.5" />
                {phase.eliminated} مستبعد
              </span>
            </div>
          )}
          {phase.status === "UPCOMING" && (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(phase.id, "ACTIVE"); }}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> تفعيل
            </button>
          )}
          {phase.status === "ACTIVE" && (
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(phase.id, "COMPLETED"); }}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <CheckCircle className="w-3 h-3" /> إكمال
            </button>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(phase); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(phase); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Tabs */}
          <div className="flex items-center gap-0 px-6 border-b border-gray-100 overflow-x-auto">
            {tabs
              .filter((t) => t.show)
              .map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-brand-500 text-brand-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && <OverviewTab phase={phase} />}
            {activeTab === "criteria" && <CriteriaTab phase={phase} eventId={eventId} onRefresh={onRefresh} />}
            {activeTab === "judging" && showJudging && <JudgingTab phase={phase} eventId={eventId} onRefresh={onRefresh} />}
            {activeTab === "results" && <ResultsTab phase={phase} eventId={eventId} onRefresh={onRefresh} />}
            {activeTab === "autofilter" && showAutoFilter && <AutoFilterTab phase={phase} eventId={eventId} onRefresh={onRefresh} />}
            {activeTab === "deliverables" && <DeliverablesTab phase={phase} eventId={eventId} onRefresh={onRefresh} />}
          </div>
        </div>
      )}
    </div>
  );
}
