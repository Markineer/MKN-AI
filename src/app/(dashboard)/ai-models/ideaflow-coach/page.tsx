"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  MessageSquare,
  ArrowRight,
  Lightbulb,
  Calendar,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Sparkles,
  BookOpen,
  Target,
  Users,
  Zap,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  titleAr: string;
  type: string;
  status: string;
  phases: Phase[];
}

interface Phase {
  id: string;
  name: string;
  nameAr: string;
  phaseNumber: number;
  phaseType: string;
  status: string;
}

interface LinkedPhase {
  eventId: string;
  eventTitle: string;
  eventTitleAr: string;
  phaseId: string;
  phaseName: string;
  phaseNameAr: string;
  phaseNumber: number;
}

const PROCESS_STEPS = [
  {
    step: "SEED",
    title: "تحديد المشكلة",
    description: "توضيح التحدي أو الهدف",
    icon: Target,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    step: "SOLVE",
    title: "توليد الأفكار",
    description: "١٠ أفكار خام + ٥ أفكار سيئة",
    icon: Lightbulb,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    step: "CLUSTER",
    title: "تصنيف الأفكار",
    description: "تجميع في ٢-٥ مجموعات",
    icon: Layers,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    step: "CHOOSE",
    title: "الاختيار والتعمق",
    description: "اختيار مجموعة وتوسيعها",
    icon: Zap,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    step: "TEST",
    title: "تصميم الاختبار",
    description: "MVP سريع وبسيط",
    icon: Sparkles,
    color: "text-brand-500",
    bg: "bg-brand-50",
  },
];

export default function IdeaFlowCoachPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [linkedPhases, setLinkedPhases] = useState<LinkedPhase[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || data || []);
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const handleLinkPhase = async () => {
    if (!selectedEventId || !selectedPhaseId || !selectedEvent) return;

    const phase = selectedEvent.phases?.find((p) => p.id === selectedPhaseId);
    if (!phase) return;

    const alreadyLinked = linkedPhases.some(
      (lp) => lp.eventId === selectedEventId && lp.phaseId === selectedPhaseId
    );
    if (alreadyLinked) return;

    setIsSaving(true);
    try {
      const newLink: LinkedPhase = {
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        eventTitleAr: selectedEvent.titleAr,
        phaseId: phase.id,
        phaseName: phase.name,
        phaseNameAr: phase.nameAr,
        phaseNumber: phase.phaseNumber,
      };

      setLinkedPhases((prev) => [...prev, newLink]);
      setSelectedEventId("");
      setSelectedPhaseId("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlinkPhase = (eventId: string, phaseId: string) => {
    setLinkedPhases((prev) =>
      prev.filter((lp) => !(lp.eventId === eventId && lp.phaseId === phaseId))
    );
  };

  return (
    <>
      <TopBar title="IdeaFlow Coach" titleAr="مدرب IdeaFlow" />
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/ai-models"
              className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </Link>
            <div className="w-14 h-14 rounded-2xl gradient-purple flex items-center justify-center shadow-brand">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                IdeaFlow Coach
              </h1>
              <p className="text-sm text-gray-500">
                مدرب الإبداع وتوليد الأفكار — مستوحى من كتاب IdeaFlow
              </p>
            </div>
          </div>
          <Link
            href="/ai-models/ideaflow-coach/chat"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors shadow-brand"
          >
            <MessageSquare className="w-4 h-4" />
            تجربة الشات
          </Link>
        </div>

        {/* Process Flow */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            مسار العملية الإبداعية
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            يتبع النموذج هذا المسار المنظم لتوجيه المستخدم
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {PROCESS_STEPS.map((step, idx) => (
              <div key={step.step} className="flex items-center gap-2">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl min-w-[180px]">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      step.bg
                    )}
                  >
                    <step.icon className={cn("w-5 h-5", step.color)} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">
                      {step.step}
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      {step.title}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {step.description}
                    </div>
                  </div>
                </div>
                {idx < PROCESS_STEPS.length - 1 && (
                  <div className="w-6 h-px bg-gray-200 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Link to Event/Phase */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            ربط النموذج بالفعاليات
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            اختر الفعالية والمرحلة لتفعيل النموذج فيها للمشاركين
          </p>

          <div className="flex items-end gap-3 mb-6">
            {/* Event Selector */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 inline-block ml-1 text-gray-400" />
                الفعالية
              </label>
              {isLoadingEvents ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحميل...
                </div>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    setSelectedPhaseId("");
                  }}
                  className="input-field w-full"
                >
                  <option value="">اختر فعالية...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.titleAr || event.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Phase Selector */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Layers className="w-4 h-4 inline-block ml-1 text-gray-400" />
                المرحلة
              </label>
              <select
                value={selectedPhaseId}
                onChange={(e) => setSelectedPhaseId(e.target.value)}
                className="input-field w-full"
                disabled={!selectedEventId || !selectedEvent?.phases?.length}
              >
                <option value="">اختر مرحلة...</option>
                {selectedEvent?.phases?.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.phaseNumber}. {phase.nameAr || phase.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Link Button */}
            <button
              onClick={handleLinkPhase}
              disabled={!selectedEventId || !selectedPhaseId || isSaving}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                selectedEventId && selectedPhaseId
                  ? "bg-brand-500 hover:bg-brand-600 text-white shadow-brand"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              تفعيل
            </button>
          </div>

          {/* Linked Phases Table */}
          {linkedPhases.length > 0 ? (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-right">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                      الفعالية
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                      المرحلة
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-16">
                      إجراء
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linkedPhases.map((lp, idx) => (
                    <tr
                      key={`${lp.eventId}-${lp.phaseId}`}
                      className={cn(
                        "border-t border-gray-50",
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-300" />
                          <span className="text-sm text-gray-800">
                            {lp.eventTitleAr || lp.eventTitle}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-brand-50 text-brand-600 text-[10px] font-bold flex items-center justify-center">
                            {lp.phaseNumber}
                          </span>
                          <span className="text-sm text-gray-700">
                            {lp.phaseNameAr || lp.phaseName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          مفعل
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            handleUnlinkPhase(lp.eventId, lp.phaseId)
                          }
                          className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm">لم يتم ربط النموذج بأي فعالية بعد</p>
              <p className="text-xs text-gray-300 mt-1">
                اختر فعالية ومرحلة من الأعلى لتفعيل النموذج
              </p>
            </div>
          )}
        </div>

        {/* Model Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              مستوحى من كتاب IdeaFlow
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              بقلم Jeremy Utley و Perry Klebahn من جامعة ستانفورد
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              ٧ تمارين إبداعية
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              من توليد الأفكار الخام إلى تصميم اختبار عملي MVP
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm p-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <Bot className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              مدعوم بنموذج نهى
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              يعمل على Nuha AI Gateway مع دعم إدارة الجلسات
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
