"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import {
  Loader2,
  Calendar,
  Trophy,
  Users,
  CalendarDays,
  Inbox,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface EventTeam {
  id: string;
  name: string;
  role: string;
  trackName: string | null;
  trackColor: string | null;
  totalScore: number | null;
  rank: number | null;
  status: string;
  projectTitle: string | null;
  members: { name: string; role: string }[];
}

interface EventCertificate {
  id: string;
  type: string;
  title: string;
  rank: number | null;
  rankLabel: string | null;
  totalScore: number | null;
  issuedAt: string;
}

interface EventHistoryItem {
  eventId: string;
  eventName: string;
  eventType: string;
  eventCategory: string;
  eventStatus: string;
  eventColor: string | null;
  startDate: string;
  endDate: string;
  role: string;
  memberStatus: string;
  team: EventTeam | null;
  certificates: EventCertificate[];
}

interface ProfileData {
  profile: any;
  stats: any;
  eventHistory: EventHistoryItem[];
}

// ─── Label Maps ─────────────────────────────────────────────────

const eventTypeLabels: Record<string, string> = {
  HACKATHON: "هاكاثون",
  CHALLENGE: "تحدي",
  COMPETITION: "مسابقة",
};

const eventTypeColors: Record<string, { bg: string; text: string }> = {
  HACKATHON: { bg: "bg-purple-50", text: "text-purple-700" },
  CHALLENGE: { bg: "bg-blue-50", text: "text-blue-700" },
  COMPETITION: { bg: "bg-amber-50", text: "text-amber-700" },
};

const eventStatusLabels: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  DRAFT: { label: "مسودة", bg: "bg-gray-100", text: "text-gray-600" },
  REGISTRATION_OPEN: { label: "تسجيل", bg: "bg-blue-50", text: "text-blue-600" },
  IN_PROGRESS: { label: "جاري", bg: "bg-emerald-50", text: "text-emerald-600" },
  EVALUATION: { label: "تقييم", bg: "bg-orange-50", text: "text-orange-600" },
  COMPLETED: { label: "مكتمل", bg: "bg-purple-50", text: "text-purple-600" },
  CANCELLED: { label: "ملغي", bg: "bg-red-50", text: "text-red-600" },
};

// ─── Sort Helper ────────────────────────────────────────────────

const statusSortOrder: Record<string, number> = {
  IN_PROGRESS: 0,
  EVALUATION: 1,
  REGISTRATION_OPEN: 2,
  COMPLETED: 3,
  DRAFT: 4,
  CANCELLED: 5,
};

function sortEvents(events: EventHistoryItem[]): EventHistoryItem[] {
  return [...events].sort((a, b) => {
    const orderA = statusSortOrder[a.eventStatus] ?? 99;
    const orderB = statusSortOrder[b.eventStatus] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });
}

// ─── Main Page Component ────────────────────────────────────────

export default function MyEventsPage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // ─── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <TopBar title="My Events" titleAr="فعالياتي" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-3">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Empty / Error State ────────────────────────────────────
  if (!data || data.eventHistory.length === 0) {
    return (
      <div>
        <TopBar title="My Events" titleAr="فعالياتي" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-bold text-gray-400">لا توجد فعاليات</p>
            <p className="text-sm text-gray-400 mt-1">
              لم تشارك في أي فعالية حتى الآن
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sortedEvents = sortEvents(data.eventHistory);

  return (
    <div>
      <TopBar title="My Events" titleAr="فعالياتي" />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header Summary */}
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-brand-500" />
          <h3 className="text-xl font-bold text-gray-800">فعالياتي</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full mr-2">
            {sortedEvents.length}
          </span>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedEvents.map((event) => {
            const typeCfg = eventTypeColors[event.eventType] || {
              bg: "bg-gray-50",
              text: "text-gray-600",
            };
            const statusCfg = eventStatusLabels[event.eventStatus] || {
              label: event.eventStatus,
              bg: "bg-gray-100",
              text: "text-gray-600",
            };

            return (
              <div
                key={event.eventId}
                onClick={() => router.push(`/my-events/${event.eventId}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-brand-200 transition-all duration-200 group"
              >
                {/* Color accent bar */}
                <div
                  className="h-1.5"
                  style={{
                    backgroundColor: event.eventColor || "#7C3AED",
                  }}
                />

                <div className="p-5">
                  {/* Event Name */}
                  <h4 className="text-base font-bold text-gray-800 group-hover:text-brand-600 transition-colors mb-3 line-clamp-1">
                    {event.eventName}
                  </h4>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {/* Type Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.text}`}
                    >
                      {eventTypeLabels[event.eventType] || event.eventType}
                    </span>
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Team Name */}
                  {event.team && (
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">
                        {event.team.name}
                      </span>
                    </div>
                  )}

                  {/* Date Range */}
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(event.startDate).toLocaleDateString("ar-SA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" - "}
                      {new Date(event.endDate).toLocaleDateString("ar-SA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Rank Badge */}
                  {event.team?.rank != null && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>
                          المركز{" "}
                          {event.team.rank === 1
                            ? "الأول"
                            : event.team.rank === 2
                            ? "الثاني"
                            : event.team.rank === 3
                            ? "الثالث"
                            : event.team.rank}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
