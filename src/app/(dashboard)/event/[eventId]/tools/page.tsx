"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Search,
  Loader2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Trash2,
  Pencil,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Link2,
  BarChart3,
  GitBranch,
  Globe,
  Layers,
  FileText,
  Map,
  Puzzle,
  RefreshCw,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";

interface Phase {
  id: string;
  name: string;
  nameAr: string;
}

interface ToolStats {
  total: number;
  generated: number;
  submitted: number;
  pending: number;
  failed: number;
}

interface Tool {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  toolType: string;
  provider: string;
  icon: string | null;
  templateUrl: string | null;
  externalUrl: string | null;
  opensAt: string | null;
  closesAt: string | null;
  isActive: boolean;
  sortOrder: number;
  phaseId: string | null;
  phase: Phase | null;
  stats: ToolStats;
  _count: { entries: number };
}

interface ToolEntry {
  id: string;
  teamId: string;
  teamName: string;
  trackName: string | null;
  status: string;
  generatedUrl: string | null;
  submittedUrl: string | null;
  generatedAt: string | null;
  submittedAt: string | null;
  errorMessage: string | null;
}

const PROVIDER_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  MIRO: { label: "Miro", icon: Layers, color: "text-yellow-600 bg-yellow-50" },
  GOOGLE_SLIDES: { label: "Google Slides", icon: FileText, color: "text-orange-600 bg-orange-50" },
  GOOGLE_DOCS: { label: "Google Docs", icon: FileText, color: "text-blue-600 bg-blue-50" },
  GITHUB: { label: "GitHub", icon: GitBranch, color: "text-gray-700 bg-gray-100" },
  GITHUB_PAGES: { label: "GitHub Pages", icon: Globe, color: "text-green-600 bg-green-50" },
  GOOGLE_MAPS: { label: "Google Maps", icon: Map, color: "text-red-600 bg-red-50" },
  CUSTOM: { label: "مخصص", icon: Puzzle, color: "text-purple-600 bg-purple-50" },
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  TEMPLATE: { label: "تامبلت", color: "text-brand-700 bg-brand-50" },
  LINK_SUBMISSION: { label: "رابط", color: "text-emerald-700 bg-emerald-50" },
  EXTERNAL_LINK: { label: "خارجي", color: "text-gray-700 bg-gray-100" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  PENDING: { label: "بانتظار", icon: Clock, color: "text-amber-600 bg-amber-50" },
  GENERATED: { label: "تم الإنشاء", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  SUBMITTED: { label: "تم التسليم", icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
  FAILED: { label: "فشل", icon: XCircle, color: "text-red-600 bg-red-50" },
};

export default function EventToolsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [tools, setTools] = useState<Tool[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, { entries: ToolEntry[]; stats: any }>>({});
  const [loadingEntries, setLoadingEntries] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nameAr: "",
    name: "",
    descriptionAr: "",
    toolType: "LINK_SUBMISSION" as string,
    provider: "GITHUB" as string,
    phaseId: "" as string,
    templateUrl: "",
    apiToken: "",
    externalUrl: "",
    opensAt: "",
    closesAt: "",
  });

  useEffect(() => {
    fetchTools();
    fetchPhases();
  }, [eventId]);

  const fetchTools = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/tools`);
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPhases = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/phases`);
      if (res.ok) {
        const data = await res.json();
        setPhases(data.phases || []);
      }
    } catch {}
  };

  const fetchEntries = async (toolId: string) => {
    setLoadingEntries(toolId);
    try {
      const res = await fetch(`/api/events/${eventId}/tools/${toolId}/entries`);
      if (res.ok) {
        const data = await res.json();
        setEntries((prev) => ({ ...prev, [toolId]: data }));
      }
    } finally {
      setLoadingEntries(null);
    }
  };

  const toggleExpand = (toolId: string) => {
    if (expandedTool === toolId) {
      setExpandedTool(null);
    } else {
      setExpandedTool(toolId);
      if (!entries[toolId]) fetchEntries(toolId);
    }
  };

  const handleGenerate = async (toolId: string) => {
    setGenerating(toolId);
    try {
      const res = await fetch(`/api/events/${eventId}/tools/${toolId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`تم إنشاء ${data.generated} نسخة${data.failed > 0 ? ` | فشل: ${data.failed}` : ""} | تم تخطي: ${data.skipped}`);
        fetchTools();
        fetchEntries(toolId);
      } else {
        const data = await res.json();
        alert(data.error || "فشل الإنشاء");
      }
    } finally {
      setGenerating(null);
    }
  };

  const openCreateModal = () => {
    setEditingTool(null);
    setForm({
      nameAr: "", name: "", descriptionAr: "",
      toolType: "LINK_SUBMISSION", provider: "GITHUB",
      phaseId: "", templateUrl: "", apiToken: "",
      externalUrl: "", opensAt: "", closesAt: "",
    });
    setShowModal(true);
  };

  const openEditModal = (tool: Tool) => {
    setEditingTool(tool);
    setForm({
      nameAr: tool.nameAr,
      name: tool.name,
      descriptionAr: tool.descriptionAr || "",
      toolType: tool.toolType,
      provider: tool.provider,
      phaseId: tool.phaseId || "",
      templateUrl: tool.templateUrl || "",
      apiToken: "",
      externalUrl: tool.externalUrl || "",
      opensAt: tool.opensAt ? tool.opensAt.slice(0, 16) : "",
      closesAt: tool.closesAt ? tool.closesAt.slice(0, 16) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nameAr) return alert("الاسم بالعربي مطلوب");
    setSaving(true);
    try {
      const payload: any = {
        nameAr: form.nameAr,
        name: form.name || form.nameAr,
        descriptionAr: form.descriptionAr || null,
        toolType: form.toolType,
        provider: form.provider,
        phaseId: form.phaseId || null,
        opensAt: form.opensAt || null,
        closesAt: form.closesAt || null,
      };

      if (form.toolType === "TEMPLATE") {
        payload.templateUrl = form.templateUrl;
        if (form.apiToken) payload.apiToken = form.apiToken;
      }
      if (form.toolType === "EXTERNAL_LINK") {
        payload.externalUrl = form.externalUrl;
      }

      const url = editingTool
        ? `/api/events/${eventId}/tools/${editingTool.id}`
        : `/api/events/${eventId}/tools`;

      const res = await fetch(url, {
        method: editingTool ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchTools();
      } else {
        const data = await res.json();
        alert(data.error || "فشل الحفظ");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (toolId: string) => {
    if (!confirm("هل تريد حذف هذه الأداة؟")) return;
    const res = await fetch(`/api/events/${eventId}/tools/${toolId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchTools();
  };

  const filtered = tools.filter(
    (t) =>
      t.nameAr.includes(search) ||
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  const templateCount = tools.filter((t) => t.toolType === "TEMPLATE").length;
  const linkCount = tools.filter((t) => t.toolType === "LINK_SUBMISSION").length;
  const externalCount = tools.filter((t) => t.toolType === "EXTERNAL_LINK").length;

  if (loading) {
    return (
      <div>
        <TopBar title="Event Tools" titleAr="الأدوات" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Event Tools" titleAr="الأدوات" />
      <div className="p-6 lg:p-8">
        {/* Back + Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/organization/events/${eventId}`}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-500 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            العودة للفعالية
          </Link>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة أداة
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "إجمالي الأدوات", value: tools.length, color: "text-brand-600", bg: "bg-brand-50", icon: Wrench },
            { label: "تامبلت", value: templateCount, color: "text-purple-600", bg: "bg-purple-50", icon: Copy },
            { label: "روابط", value: linkCount, color: "text-emerald-600", bg: "bg-emerald-50", icon: Link2 },
            { label: "خارجية", value: externalCount, color: "text-gray-600", bg: "bg-gray-100", icon: ExternalLink },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في الأدوات..."
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Tools List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">لا توجد أدوات</p>
            <button
              onClick={openCreateModal}
              className="mt-3 text-sm text-brand-500 hover:underline"
            >
              إضافة أداة جديدة
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tool) => {
              const providerCfg = PROVIDER_CONFIG[tool.provider] || PROVIDER_CONFIG.CUSTOM;
              const typeCfg = TYPE_LABELS[tool.toolType] || TYPE_LABELS.LINK_SUBMISSION;
              const ProviderIcon = providerCfg.icon;
              const isExpanded = expandedTool === tool.id;
              const totalEntries = tool.stats.total;
              const completedEntries = tool.stats.generated + tool.stats.submitted;
              const completionPct = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;

              return (
                <div key={tool.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Tool Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleExpand(tool.id)}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${providerCfg.color}`}>
                      <ProviderIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-gray-900">{tool.nameAr}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${providerCfg.color}`}>
                          {providerCfg.label}
                        </span>
                        {tool.phase && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-indigo-700 bg-indigo-50">
                            {tool.phase.nameAr}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {totalEntries > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-500 rounded-full transition-all"
                                style={{ width: `${completionPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500">{completionPct}%</span>
                          </div>
                        )}
                        {tool.closesAt && (
                          <span className="text-[10px] text-gray-400">
                            يغلق: {new Date(tool.closesAt).toLocaleDateString("ar-SA")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(tool); }}
                        className="p-1.5 text-gray-400 hover:text-brand-500 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(tool.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4">
                      {/* Generate Button for TEMPLATE */}
                      {tool.toolType === "TEMPLATE" && (
                        <div className="mb-4">
                          <button
                            onClick={() => handleGenerate(tool.id)}
                            disabled={generating === tool.id}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                          >
                            {generating === tool.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            إنشاء النسخ لجميع الفرق
                          </button>
                        </div>
                      )}

                      {/* Stats */}
                      {entries[tool.id] && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                          {[
                            { label: "إجمالي", value: entries[tool.id].stats.totalTeams, color: "text-gray-600" },
                            { label: "تم الإنشاء", value: entries[tool.id].stats.generated, color: "text-emerald-600" },
                            { label: "تم التسليم", value: entries[tool.id].stats.submitted, color: "text-blue-600" },
                            { label: "بانتظار", value: entries[tool.id].stats.pending, color: "text-amber-600" },
                            { label: "فشل", value: entries[tool.id].stats.failed, color: "text-red-600" },
                          ].map((s) => (
                            <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                              <p className="text-[10px] text-gray-500">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Entries Table */}
                      {loadingEntries === tool.id ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                        </div>
                      ) : entries[tool.id]?.entries.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-right text-[11px] text-gray-500 border-b border-gray-100">
                                <th className="pb-2 pr-2 font-medium">الفريق</th>
                                <th className="pb-2 font-medium">المسار</th>
                                <th className="pb-2 font-medium">الحالة</th>
                                <th className="pb-2 font-medium">الرابط</th>
                                <th className="pb-2 font-medium">التاريخ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entries[tool.id].entries.map((entry) => {
                                const statusCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.PENDING;
                                const StatusIcon = statusCfg.icon;
                                const entryUrl = entry.generatedUrl || entry.submittedUrl;
                                const entryDate = entry.generatedAt || entry.submittedAt;

                                return (
                                  <tr key={entry.id} className="border-b border-gray-50 last:border-0">
                                    <td className="py-2 pr-2 font-medium text-gray-900">{entry.teamName}</td>
                                    <td className="py-2 text-gray-500 text-xs">{entry.trackName || "-"}</td>
                                    <td className="py-2">
                                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusCfg.label}
                                      </span>
                                    </td>
                                    <td className="py-2">
                                      {entryUrl ? (
                                        <a
                                          href={entryUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-brand-500 hover:underline text-xs flex items-center gap-1 max-w-[200px] truncate"
                                        >
                                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                          {entryUrl.replace(/^https?:\/\//, "").slice(0, 30)}...
                                        </a>
                                      ) : entry.errorMessage ? (
                                        <span className="text-[10px] text-red-500">{entry.errorMessage.slice(0, 50)}</span>
                                      ) : (
                                        <span className="text-[10px] text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="py-2 text-[10px] text-gray-400">
                                      {entryDate ? new Date(entryDate).toLocaleDateString("ar-SA") : "-"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center text-sm text-gray-400 py-4">لا توجد إدخالات بعد</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {editingTool ? "تعديل الأداة" : "إضافة أداة جديدة"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">الاسم بالعربي *</label>
                <input
                  type="text"
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="مثال: لوحة ميرو"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">الوصف</label>
                <input
                  type="text"
                  value={form.descriptionAr}
                  onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="وصف مختصر للأداة"
                />
              </div>

              {/* Type + Provider */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">النوع *</label>
                  <select
                    value={form.toolType}
                    onChange={(e) => setForm({ ...form, toolType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="TEMPLATE">تامبلت (نسخة لكل فريق)</option>
                    <option value="LINK_SUBMISSION">رابط يسلمه الفريق</option>
                    <option value="EXTERNAL_LINK">رابط خارجي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">المزود *</label>
                  <select
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="MIRO">Miro</option>
                    <option value="GOOGLE_SLIDES">Google Slides</option>
                    <option value="GOOGLE_DOCS">Google Docs</option>
                    <option value="GITHUB">GitHub</option>
                    <option value="GITHUB_PAGES">GitHub Pages</option>
                    <option value="GOOGLE_MAPS">Google Maps</option>
                    <option value="CUSTOM">مخصص</option>
                  </select>
                </div>
              </div>

              {/* Phase */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">المرحلة (اختياري)</label>
                <select
                  value={form.phaseId}
                  onChange={(e) => setForm({ ...form, phaseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">جميع المراحل</option>
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>{p.nameAr || p.name}</option>
                  ))}
                </select>
              </div>

              {/* Template fields */}
              {form.toolType === "TEMPLATE" && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">رابط التامبلت *</label>
                    <input
                      type="url"
                      value={form.templateUrl}
                      onChange={(e) => setForm({ ...form, templateUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      placeholder="https://miro.com/app/board/..."
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      مفتاح API *
                      {editingTool && <span className="text-gray-400 mr-1">(اترك فارغ للاحتفاظ بالحالي)</span>}
                    </label>
                    <input
                      type="password"
                      value={form.apiToken}
                      onChange={(e) => setForm({ ...form, apiToken: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      placeholder="Bearer token..."
                      dir="ltr"
                    />
                  </div>
                </>
              )}

              {/* External link field */}
              {form.toolType === "EXTERNAL_LINK" && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">الرابط الخارجي *</label>
                  <input
                    type="url"
                    value={form.externalUrl}
                    onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">يفتح في</label>
                  <input
                    type="datetime-local"
                    value={form.opensAt}
                    onChange={(e) => setForm({ ...form, opensAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">يغلق في</label>
                  <input
                    type="datetime-local"
                    value={form.closesAt}
                    onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingTool ? "حفظ التعديلات" : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
