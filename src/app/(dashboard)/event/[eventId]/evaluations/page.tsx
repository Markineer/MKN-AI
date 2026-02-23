"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ChevronLeft,
  Trophy,
  Users,
  Star,
  BarChart3,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  MapPin,
  Target,
} from "lucide-react";

interface Criterion {
  id: string;
  name: string;
  nameAr: string;
  maxScore: number;
  weight: number;
}

interface Track {
  id: string;
  name: string;
  nameAr: string;
  color: string | null;
}

interface TeamAverage {
  teamId: string;
  teamName: string;
  trackId: string | null;
  evaluationCount: number;
  averageScore: number;
  criteriaAverages: Record<string, number>;
}

interface EvalDetail {
  id: string;
  totalScore: number;
  scores: Record<string, number>;
  feedback: string | null;
  feedbackAr: string | null;
  strengths: string | null;
  weaknesses: string | null;
  evaluatedAt: string;
  evaluator: {
    id: string;
    firstNameAr: string | null;
    firstName: string;
    lastNameAr: string | null;
    lastName: string;
  } | null;
  team: {
    id: string;
    name: string;
    nameAr: string | null;
    trackId: string | null;
  } | null;
}

export default function EvaluationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [teamAverages, setTeamAverages] = useState<TeamAverage[]>([]);
  const [evaluations, setEvaluations] = useState<EvalDetail[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState({ totalTeams: 0, evaluatedTeams: 0, totalEvaluations: 0 });
  const [loading, setLoading] = useState(true);
  const [filterTrack, setFilterTrack] = useState<string>("");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "name">("score");

  useEffect(() => {
    async function fetchEvaluations() {
      try {
        const res = await fetch(`/api/events/${eventId}/evaluations`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTeamAverages(data.teamAverages || []);
        setEvaluations(data.evaluations || []);
        setCriteria(data.criteria || []);
        setTracks(data.tracks || []);
        setStats(data.stats || { totalTeams: 0, evaluatedTeams: 0, totalEvaluations: 0 });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchEvaluations();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  // Filter and sort
  let filtered = teamAverages;
  if (filterTrack) {
    filtered = filtered.filter(t => t.trackId === filterTrack);
  }
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "score") return b.averageScore - a.averageScore;
    return a.teamName.localeCompare(b.teamName, "ar");
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href={`/organization/events/${eventId}`}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-elm-navy">نتائج التقييمات</h1>
            <p className="text-sm text-gray-500">{stats.totalEvaluations} تقييم من {stats.evaluatedTeams} فريق</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <Users className="w-5 h-5 text-brand-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-elm-navy">{stats.totalTeams}</p>
          <p className="text-xs text-gray-500">إجمالي الفرق</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 text-center">
          <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-700">{stats.evaluatedTeams}</p>
          <p className="text-xs text-emerald-600">تم تقييمها</p>
        </div>
        <div className="bg-white rounded-2xl border border-brand-100 p-5 text-center">
          <BarChart3 className="w-5 h-5 text-brand-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-brand-700">{stats.totalEvaluations}</p>
          <p className="text-xs text-brand-600">إجمالي التقييمات</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {tracks.length > 0 && (
          <select
            value={filterTrack}
            onChange={(e) => setFilterTrack(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">جميع المسارات</option>
            {tracks.map(t => (
              <option key={t.id} value={t.id}>{t.nameAr || t.name}</option>
            ))}
          </select>
        )}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "score" | "name")}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="score">ترتيب بالدرجة</option>
          <option value="name">ترتيب بالاسم</option>
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-elm-navy mb-2">لا توجد تقييمات بعد</h3>
          <p className="text-sm text-gray-500">لم يتم تقديم أي تقييمات لهذه الفعالية</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((team, index) => {
            const track = tracks.find(t => t.id === team.trackId);
            const teamEvals = evaluations.filter(e => e.team?.id === team.teamId);
            const isExpanded = expandedTeam === team.teamId;

            return (
              <div
                key={team.teamId}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                {/* Team Row */}
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : team.teamId)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-right"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      index === 0 && sortBy === "score" && team.averageScore > 0
                        ? "bg-amber-50 text-amber-600"
                        : index === 1 && sortBy === "score" && team.averageScore > 0
                          ? "bg-gray-100 text-gray-600"
                          : index === 2 && sortBy === "score" && team.averageScore > 0
                            ? "bg-orange-50 text-orange-600"
                            : "bg-gray-50 text-gray-400"
                    }`}>
                      {sortBy === "score" ? `#${index + 1}` : (team.teamName)?.[0]}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-elm-navy">{team.teamName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {track && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{
                              backgroundColor: (track.color || "#7C3AED") + "15",
                              color: track.color || "#7C3AED",
                            }}
                          >
                            {track.nameAr}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {team.evaluationCount} تقييم{team.evaluationCount > 1 ? "ات" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {team.evaluationCount > 0 ? (
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-xl font-bold text-elm-navy">{team.averageScore.toFixed(1)}%</span>
                        </div>
                        <p className="text-[10px] text-gray-400">متوسط الدرجات</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">لم يقيّم بعد</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                    {/* Criteria Averages */}
                    {criteria.length > 0 && team.evaluationCount > 0 && (
                      <div className="mb-5">
                        <h4 className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          متوسط المعايير
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {criteria.map(c => (
                            <div key={c.id} className="bg-white rounded-xl p-3 border border-gray-100">
                              <p className="text-[10px] text-gray-500 mb-1">{c.nameAr}</p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-elm-navy">
                                  {(team.criteriaAverages[c.id] || 0).toFixed(1)}
                                </span>
                                <span className="text-[10px] text-gray-400">/ {c.maxScore}</span>
                              </div>
                              <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-brand-400 rounded-full"
                                  style={{ width: `${((team.criteriaAverages[c.id] || 0) / c.maxScore) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Individual Judge Evaluations */}
                    {teamEvals.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          تقييمات المحكمين
                        </h4>
                        <div className="space-y-2">
                          {teamEvals.map(ev => (
                            <div key={ev.id} className="bg-white rounded-xl p-4 border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 text-xs font-bold">
                                    {(ev.evaluator?.firstNameAr || ev.evaluator?.firstName || "?")[0]}
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-elm-navy">
                                      {ev.evaluator?.firstNameAr || ev.evaluator?.firstName} {ev.evaluator?.lastNameAr || ev.evaluator?.lastName}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                      {new Date(ev.evaluatedAt).toLocaleDateString("ar-SA")}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-brand-600">
                                  <Star className="w-3.5 h-3.5 fill-brand-400" />
                                  <span className="text-sm font-bold">{ev.totalScore.toFixed(1)}%</span>
                                </div>
                              </div>

                              {/* Criteria scores */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {criteria.map(c => {
                                  const score = (ev.scores as Record<string, number>)?.[c.id];
                                  return score !== undefined ? (
                                    <span key={c.id} className="text-[10px] bg-gray-50 rounded-lg px-2 py-1">
                                      {c.nameAr}: <strong>{score}</strong>/{c.maxScore}
                                    </span>
                                  ) : null;
                                })}
                              </div>

                              {/* Feedback */}
                              {(ev.strengths || ev.weaknesses || ev.feedbackAr || ev.feedback) && (
                                <div className="mt-3 space-y-1 text-xs text-gray-600">
                                  {ev.strengths && (
                                    <p><span className="text-emerald-600 font-medium">نقاط القوة:</span> {ev.strengths}</p>
                                  )}
                                  {ev.weaknesses && (
                                    <p><span className="text-red-500 font-medium">نقاط الضعف:</span> {ev.weaknesses}</p>
                                  )}
                                  {(ev.feedbackAr || ev.feedback) && (
                                    <p><span className="text-gray-500 font-medium">ملاحظات:</span> {ev.feedbackAr || ev.feedback}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {teamEvals.length === 0 && (
                      <div className="text-center py-6">
                        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">لم يتم تقييم هذا الفريق بعد</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
