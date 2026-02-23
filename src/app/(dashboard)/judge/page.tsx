"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Loader2,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  ChevronLeft,
  MapPin,
  ClipboardCheck,
} from "lucide-react";

interface JudgeEvent {
  eventId: string;
  eventTitle: string;
  eventTitleAr: string;
  trackNameAr: string | null;
  trackColor: string | null;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
}

export default function JudgeDashboard() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<JudgeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJudgeEvents() {
      try {
        const res = await fetch("/api/judges/my-events");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEvents(data.events || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchJudgeEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-elm-navy mb-1">لوحة المحكم</h1>
        <p className="text-sm text-gray-500">
          مرحباً {(session?.user as any)?.nameAr || (session?.user as any)?.name || "بك"}، هذه الفعاليات المعين فيها كمحكم
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-elm-navy mb-2">لا توجد فعاليات حالياً</h3>
          <p className="text-sm text-gray-500">لم يتم تعيينك كمحكم في أي فعالية بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev) => (
            <Link
              key={ev.eventId}
              href={`/judge/event/${ev.eventId}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-elm-navy group-hover:text-brand-600 transition-colors">
                    {ev.eventTitleAr || ev.eventTitle}
                  </h3>
                  {ev.trackNameAr && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ev.trackColor || "#7C3AED" }}
                      />
                      <span className="text-xs text-gray-500">{ev.trackNameAr}</span>
                    </div>
                  )}
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-brand-500 transition-colors" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-elm-navy">{ev.totalAssignments}</p>
                  <p className="text-[10px] text-gray-500">إجمالي الفرق</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-emerald-700">{ev.completedAssignments}</p>
                  <p className="text-[10px] text-emerald-600">مُقيّمة</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-amber-700">{ev.pendingAssignments}</p>
                  <p className="text-[10px] text-amber-600">متبقية</p>
                </div>
              </div>

              {/* Progress bar */}
              {ev.totalAssignments > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span>التقدم</span>
                    <span>{Math.round((ev.completedAssignments / ev.totalAssignments) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${(ev.completedAssignments / ev.totalAssignments) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
