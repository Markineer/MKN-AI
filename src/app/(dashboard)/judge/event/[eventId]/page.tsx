"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Users,
  CheckCircle,
  Clock,
  ChevronLeft,
  MapPin,
  Star,
  ClipboardCheck,
  ArrowLeft,
} from "lucide-react";

interface TeamAssignment {
  teamId: string;
  teamName: string;
  teamNameAr: string | null;
  teamCode: string;
  trackNameAr: string | null;
  trackColor: string | null;
  memberCount: number;
  members: { name: string; role: string }[];
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  evaluation: {
    totalScore: number;
    evaluatedAt: string;
  } | null;
}

export default function JudgeEventTeams() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [teams, setTeams] = useState<TeamAssignment[]>([]);
  const [eventName, setEventName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await fetch(`/api/judges/my-events/${eventId}/teams`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTeams(data.teams || []);
        setEventName(data.eventNameAr || data.eventName || "");
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const completed = teams.filter(t => t.status === "COMPLETED").length;
  const pending = teams.filter(t => t.status !== "COMPLETED").length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/judge"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-elm-navy">{eventName}</h1>
          <p className="text-sm text-gray-500">
            {completed} مقيّمة من {teams.length} فريق
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <Users className="w-5 h-5 text-brand-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-elm-navy">{teams.length}</p>
          <p className="text-xs text-gray-500">إجمالي الفرق</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 text-center">
          <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-700">{completed}</p>
          <p className="text-xs text-emerald-600">تم تقييمها</p>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-5 text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-700">{pending}</p>
          <p className="text-xs text-amber-600">متبقية</p>
        </div>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-elm-navy mb-2">لا توجد فرق معينة</h3>
          <p className="text-sm text-gray-500">لم يتم تعيين فرق لك بعد في هذه الفعالية</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.teamId}
              className={`bg-white rounded-2xl border p-5 transition-shadow hover:shadow-md ${
                team.status === "COMPLETED" ? "border-emerald-100" : "border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                    team.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-brand-50 text-brand-600"
                  }`}>
                    {(team.teamNameAr || team.teamName)?.[0] || "?"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-elm-navy">
                      {team.teamNameAr || team.teamName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-400">{team.teamCode}</span>
                      <span className="text-[10px] text-gray-400">{team.memberCount} أعضاء</span>
                      {team.trackNameAr && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px]"
                          style={{
                            backgroundColor: (team.trackColor || "#7C3AED") + "15",
                            color: team.trackColor || "#7C3AED",
                          }}
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          {team.trackNameAr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {team.status === "COMPLETED" && team.evaluation ? (
                    <div className="text-left">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Star className="w-4 h-4 fill-emerald-500" />
                        <span className="text-lg font-bold">{team.evaluation.totalScore.toFixed(1)}</span>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {new Date(team.evaluation.evaluatedAt).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  ) : null}

                  <Link
                    href={`/judge/event/${eventId}/evaluate/${team.teamId}`}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      team.status === "COMPLETED"
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-brand-500 text-white hover:bg-brand-600 shadow-sm"
                    }`}
                  >
                    {team.status === "COMPLETED" ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        تعديل التقييم
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-4 h-4" />
                        تقييم
                      </>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
