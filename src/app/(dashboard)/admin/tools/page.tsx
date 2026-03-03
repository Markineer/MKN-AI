"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import {
  Wrench,
  Loader2,
  Calendar,
  ChevronLeft,
  ExternalLink,
  Copy,
  Link2,
  GitBranch,
  Globe,
  FileText,
  Layers,
  Map,
  Puzzle,
  Plus,
  Search,
} from "lucide-react";

interface EventWithTools {
  id: string;
  title: string;
  titleAr: string;
  status: string;
  type: string;
  toolsCount: number;
  tools: {
    id: string;
    nameAr: string;
    toolType: string;
    provider: string;
    stats: { total: number; generated: number; submitted: number; pending: number; failed: number };
  }[];
}

const PROVIDER_ICONS: Record<string, any> = {
  MIRO: Layers,
  GOOGLE_SLIDES: FileText,
  GOOGLE_DOCS: FileText,
  GITHUB: GitBranch,
  GITHUB_PAGES: Globe,
  GOOGLE_MAPS: Map,
  CUSTOM: Puzzle,
};

const PROVIDER_COLORS: Record<string, string> = {
  MIRO: "text-yellow-600 bg-yellow-50",
  GOOGLE_SLIDES: "text-orange-600 bg-orange-50",
  GOOGLE_DOCS: "text-blue-600 bg-blue-50",
  GITHUB: "text-gray-700 bg-gray-100",
  GITHUB_PAGES: "text-green-600 bg-green-50",
  GOOGLE_MAPS: "text-red-600 bg-red-50",
  CUSTOM: "text-purple-600 bg-purple-50",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "مسودة", color: "text-gray-600 bg-gray-100" },
  PUBLISHED: { label: "منشورة", color: "text-blue-600 bg-blue-50" },
  REGISTRATION_OPEN: { label: "التسجيل مفتوح", color: "text-emerald-600 bg-emerald-50" },
  IN_PROGRESS: { label: "جارية", color: "text-brand-600 bg-brand-50" },
  EVALUATION: { label: "تقييم", color: "text-purple-600 bg-purple-50" },
  COMPLETED: { label: "مكتملة", color: "text-gray-600 bg-gray-100" },
};

export default function AdminToolsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithTools[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Fetch all events
      const eventsRes = await fetch("/api/events");
      if (!eventsRes.ok) return;
      const eventsData = await eventsRes.json();
      const allEvents = eventsData.events || eventsData || [];

      // Fetch tools for each event
      const eventsWithTools: EventWithTools[] = [];
      for (const event of allEvents) {
        try {
          const toolsRes = await fetch(`/api/events/${event.id}/tools`);
          if (toolsRes.ok) {
            const toolsData = await toolsRes.json();
            eventsWithTools.push({
              id: event.id,
              title: event.title,
              titleAr: event.titleAr || event.title,
              status: event.status,
              type: event.type,
              toolsCount: toolsData.tools?.length || 0,
              tools: toolsData.tools || [],
            });
          }
        } catch {
          eventsWithTools.push({
            id: event.id,
            title: event.title,
            titleAr: event.titleAr || event.title,
            status: event.status,
            type: event.type,
            toolsCount: 0,
            tools: [],
          });
        }
      }

      setEvents(eventsWithTools);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter(
    (e) =>
      e.titleAr.includes(search) ||
      e.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalTools = events.reduce((sum, e) => sum + e.toolsCount, 0);

  if (loading) {
    return (
      <div>
        <TopBar title="Tools Management" titleAr="إدارة الأدوات" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Tools Management" titleAr="إدارة الأدوات" />
      <div className="p-6 lg:p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalTools}</p>
                <p className="text-xs text-gray-500">إجمالي الأدوات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                <p className="text-xs text-gray-500">الفعاليات</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{events.filter((e) => e.toolsCount > 0).length}</p>
                <p className="text-xs text-gray-500">فعاليات بأدوات</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في الفعاليات..."
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Events List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">لا توجد فعاليات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((event) => {
              const statusCfg = STATUS_MAP[event.status] || { label: event.status, color: "text-gray-600 bg-gray-100" };

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Event Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-brand-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{event.titleAr}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {event.toolsCount} أداة
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/event/${event.id}/tools`}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
                      >
                        <Wrench className="w-4 h-4" />
                        إدارة الأدوات
                      </Link>
                    </div>

                    {/* Tools Preview */}
                    {event.tools.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {event.tools.map((tool) => {
                          const ToolIcon = PROVIDER_ICONS[tool.provider] || Puzzle;
                          const color = PROVIDER_COLORS[tool.provider] || "text-gray-600 bg-gray-100";
                          const completed = tool.stats.generated + tool.stats.submitted;
                          const total = tool.stats.total;

                          return (
                            <div
                              key={tool.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              <div className={`w-6 h-6 rounded flex items-center justify-center ${color}`}>
                                <ToolIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-medium text-gray-700">{tool.nameAr}</span>
                              {total > 0 && (
                                <span className="text-[10px] text-gray-400">
                                  {completed}/{total}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {event.tools.length === 0 && (
                      <p className="text-xs text-gray-400 mt-2">لم يتم إضافة أدوات بعد</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
