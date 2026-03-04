"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Eye, UserCheck, Loader2, RefreshCw } from "lucide-react";
import type { Phase } from "./types";

export default function JudgingTab({
  phase,
  eventId,
  onRefresh,
}: {
  phase: Phase;
  eventId: string;
  onRefresh: () => void;
}) {
  const [distributions, setDistributions] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [loadingDist, setLoadingDist] = useState(false);
  const [loadingEvals, setLoadingEvals] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [hasDistributed, setHasDistributed] = useState(false);

  useEffect(() => {
    fetchExistingData();
  }, []);

  const fetchExistingData = async () => {
    setLoadingEvals(true);
    try {
      const [assignRes, evalRes] = await Promise.all([
        fetch(`/api/events/${eventId}/distribute?phaseId=${phase.id}`),
        fetch(`/api/events/${eventId}/evaluations?phaseId=${phase.id}`),
      ]);

      const assignData = assignRes.ok ? await assignRes.json() : null;
      if (assignData) {
        setDistributions(assignData.distributions || []);
        setWarnings(assignData.warnings || []);
      }

      const evalData = evalRes.ok ? await evalRes.json() : null;
      if (evalData) {
        setEvaluationData(evalData);
      }

      setHasDistributed(phase.assignments && phase.assignments.length > 0);
    } catch {
      // silently fail
    } finally {
      setLoadingEvals(false);
    }
  };

  const handlePreview = async () => {
    setLoadingDist(true);
    try {
      const res = await fetch(`/api/events/${eventId}/distribute?phaseId=${phase.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDistributions(data.distributions || []);
      setWarnings(data.warnings || []);
    } catch {
      alert("فشل تحميل معاينة التوزيع");
    } finally {
      setLoadingDist(false);
    }
  };

  const handleExecute = async () => {
    if (!confirm("هل أنت متأكد من تنفيذ توزيع المحكمين؟")) return;
    setExecuting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/distribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseId: phase.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "فشل تنفيذ التوزيع");
        return;
      }
      const data = await res.json();
      alert(`تم التوزيع بنجاح: ${data.created} تعيين`);
      setHasDistributed(true);
      onRefresh();
      fetchExistingData();
    } catch {
      alert("فشل تنفيذ التوزيع");
    } finally {
      setExecuting(false);
    }
  };

  if (loadingEvals) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  const teamAverages = evaluationData?.teamAverages || [];
  const stats = evaluationData?.stats || {};
  const criteria = evaluationData?.criteria || [];
  const evaluations = evaluationData?.evaluations || [];

  return (
    <div className="space-y-6">
      {/* Distribution Controls */}
      <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-elm-navy">توزيع المحكمين</h4>
            <p className="text-[11px] text-gray-500">كل فريق سيُقيّم من {phase.judgesPerTeam || 1} محكم</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePreview} disabled={loadingDist} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-200 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-50 transition-colors disabled:opacity-50">
              {loadingDist ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
              معاينة التوزيع
            </button>
            <button onClick={handleExecute} disabled={executing} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 transition-colors disabled:opacity-50">
              {executing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              تنفيذ التوزيع
            </button>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="space-y-1 mt-2">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                {w}
              </div>
            ))}
          </div>
        )}

        {distributions.length > 0 && (
          <div className="mt-3 space-y-3">
            {distributions.map((dist, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {dist.trackColor && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dist.trackColor }} />}
                    <span className="text-xs font-bold text-elm-navy">{dist.trackName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span>{dist.judges.length} محكم</span>
                    <span>{dist.teams.length} فريق</span>
                    <span>{dist.judgesPerTeam} محكم/فريق</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] text-gray-500 border-b border-gray-200">
                        <th className="text-right px-3 py-2 font-medium">الفريق</th>
                        <th className="text-right px-3 py-2 font-medium">المحكمون المعينون</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dist.teams.map((team: any) => {
                        const teamAssignments = dist.assignments.filter((a: any) => a.teamId === team.id);
                        return (
                          <tr key={team.id} className="border-b border-gray-100 last:border-0">
                            <td className="px-3 py-2 font-medium text-elm-navy">{team.name}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {teamAssignments.map((a: any, i: number) => (
                                  <span key={i} className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full text-[10px] font-medium">{a.judgeName}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evaluation Progress */}
      {hasDistributed && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-elm-navy">تقدم التقييم</h4>
            {stats.totalAssignments > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(stats.completedAssignments / stats.totalAssignments) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-500">{stats.completedAssignments}/{stats.totalAssignments}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-elm-navy">{stats.totalTeams || 0}</p>
              <p className="text-[10px] text-gray-500">الفرق</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">{stats.evaluatedTeams || 0}</p>
              <p className="text-[10px] text-emerald-600">تم تقييمها</p>
            </div>
            <div className="bg-brand-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-brand-700">{stats.totalEvaluations || 0}</p>
              <p className="text-[10px] text-brand-600">تقييمات</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-amber-700">{(stats.totalAssignments || 0) - (stats.completedAssignments || 0)}</p>
              <p className="text-[10px] text-amber-600">بانتظار</p>
            </div>
          </div>

          {teamAverages.length > 0 && (
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-gray-500 border-b border-gray-200">
                    <th className="text-right px-4 py-3 font-medium">#</th>
                    <th className="text-right px-4 py-3 font-medium">الفريق</th>
                    <th className="text-center px-4 py-3 font-medium">التقييمات</th>
                    <th className="text-center px-4 py-3 font-medium">المتوسط</th>
                    {criteria.map((c: any) => (
                      <th key={c.id} className="text-center px-3 py-3 font-medium text-[10px]">{c.nameAr}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...teamAverages]
                    .sort((a: any, b: any) => b.averageScore - a.averageScore)
                    .map((team: any, idx: number) => (
                      <tr key={team.teamId} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3"><p className="text-xs font-medium text-elm-navy">{team.teamName}</p></td>
                        <td className="text-center px-4 py-3">
                          <span className={`text-xs font-medium ${team.completedJudges >= team.assignedJudges && team.assignedJudges > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                            {team.completedJudges}/{team.assignedJudges}
                          </span>
                        </td>
                        <td className="text-center px-4 py-3">
                          {team.evaluationCount > 0 ? <span className="text-sm font-bold text-elm-navy">{team.averageScore.toFixed(1)}%</span> : <span className="text-gray-300">&mdash;</span>}
                        </td>
                        {criteria.map((c: any) => (
                          <td key={c.id} className="text-center px-3 py-3 text-xs text-gray-600">
                            {team.criteriaAverages[c.id] !== undefined ? team.criteriaAverages[c.id].toFixed(1) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!hasDistributed && distributions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-elm-navy mb-1">لم يتم التوزيع بعد</p>
          <p className="text-xs text-gray-500">اضغط على &quot;معاينة التوزيع&quot; لرؤية التوزيع المقترح</p>
        </div>
      )}
    </div>
  );
}
