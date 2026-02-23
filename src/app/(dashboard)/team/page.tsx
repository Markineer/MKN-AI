"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import {
  Loader2,
  Users,
  Calendar,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface TeamPhase {
  id: string;
  nameAr: string;
  status: string;
  endDate: string;
  hasDeliverableConfig: boolean;
}

interface MyTeam {
  teamId: string;
  teamName: string;
  eventId: string;
  eventName: string;
  trackName: string | null;
  trackColor: string | null;
  memberCount: number;
  phases: TeamPhase[];
}

export default function TeamDashboardPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("/api/teams/my-teams");
        if (!res.ok) throw new Error("Failed to fetch teams");
        const data = await res.json();
        setTeams(data.teams || []);
      } catch (err) {
        console.error("Failed to load teams:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div>
        <TopBar title="My Teams" titleAr="فرقي" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="My Teams" titleAr="فرقي" />
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-elm-navy">فرقي</h2>
          <p className="text-sm text-gray-400 mt-1">الفرق المشارك فيها والمراحل النشطة</p>
        </div>

        {teams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">لا توجد فرق حالياً</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.teamId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Team Header */}
                <div className="px-6 py-4 border-b border-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-elm-navy">{team.teamName}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{team.eventName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {team.trackName && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: team.trackColor ? `${team.trackColor}20` : "#f3f4f6",
                            color: team.trackColor || "#6b7280",
                          }}
                        >
                          {team.trackName}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {team.memberCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Phases with Submission Links */}
                <div className="p-4">
                  {team.phases.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">لا توجد مراحل نشطة حالياً</p>
                  ) : (
                    <div className="space-y-2">
                      {team.phases.map((phase) => (
                        <div
                          key={phase.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-brand-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {phase.status === "ACTIVE" ? (
                              <Clock className="w-4 h-4 text-emerald-500" />
                            ) : phase.status === "COMPLETED" ? (
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Calendar className="w-4 h-4 text-gray-400" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-elm-navy">{phase.nameAr}</p>
                              <p className="text-[10px] text-gray-400">
                                ينتهي {new Date(phase.endDate).toLocaleDateString("ar-SA")}
                              </p>
                            </div>
                          </div>

                          {phase.hasDeliverableConfig && phase.status === "ACTIVE" && (
                            <Link
                              href={`/team/${team.teamId}/submit/${phase.id}`}
                              className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold hover:bg-brand-600 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              تسليم
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
