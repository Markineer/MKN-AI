"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import {
  Plus,
  Search,
  Trophy,
  BookOpen,
  Calendar,
  Users,
  MapPin,
  MoreVertical,
  Cpu,
  Loader2,
} from "lucide-react";

interface EventData {
  id: string;
  title: string;
  titleAr: string;
  type: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string | null;
  locationAr: string | null;
  isOnline: boolean;
  maxParticipants: number | null;
  aiEvaluationEnabled: boolean;
  primaryColor: string | null;
  organization: {
    name: string;
    nameAr: string;
  } | null;
  _count: {
    members: number;
    tracks: number;
    teams: number;
    submissions: number;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-blue-100 text-blue-600",
  REGISTRATION_OPEN: "bg-cyan-100 text-cyan-700",
  IN_PROGRESS: "bg-emerald-100 text-emerald-700",
  EVALUATION: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-purple-100 text-purple-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  REGISTRATION_OPEN: "التسجيل مفتوح",
  IN_PROGRESS: "جاري",
  EVALUATION: "تقييم",
  COMPLETED: "مكتمل",
  ARCHIVED: "مؤرشف",
};

const categoryLabels: Record<string, string> = {
  PROGRAMMING: "برمجة",
  LEGAL: "قانوني",
  AI_ML: "ذكاء اصطناعي",
  BUSINESS: "أعمال",
  DESIGN: "تصميم",
  HEALTH: "صحة",
  CYBERSECURITY: "أمن سيبراني",
  DATA_SCIENCE: "علوم بيانات",
  GENERAL: "عام",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchEvents() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (typeFilter) params.set("type", typeFilter);
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(`/api/events?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.pagination?.total || 0);
      } catch (err: any) {
        if (err.name !== "AbortError") setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    const debounce = setTimeout(fetchEvents, 300);
    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [search, typeFilter, statusFilter]);

  const typeTabs = [
    { label: "الكل", value: "" },
    { label: "هاكاثونات", value: "HACKATHON", icon: Trophy },
    { label: "تحديات", value: "CHALLENGE", icon: BookOpen },
    { label: "مسابقات", value: "COMPETITION", icon: Calendar },
    { label: "ورش عمل", value: "WORKSHOP", icon: Users },
  ];

  return (
    <div>
      <TopBar title="Events" titleAr="إدارة الفعاليات" />
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-elm-navy">الفعاليات</h2>
            <p className="text-sm text-gray-500 mt-1">هاكاثونات وتحديات ومسابقات وورش عمل</p>
          </div>
          <Link href="/organization/events/create">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              إنشاء فعالية جديدة
            </button>
          </Link>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-3 mb-6">
          {typeTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setTypeFilter(tab.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                typeFilter === tab.value
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.value === "" && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${typeFilter === tab.value ? "bg-white/20" : "bg-gray-100"}`}>
                  {total}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث في الفعاليات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600"
          >
            <option value="">جميع الحالات</option>
            <option value="DRAFT">مسودة</option>
            <option value="PUBLISHED">منشور</option>
            <option value="REGISTRATION_OPEN">التسجيل مفتوح</option>
            <option value="IN_PROGRESS">جاري</option>
            <option value="EVALUATION">تقييم</option>
            <option value="COMPLETED">مكتمل</option>
            <option value="ARCHIVED">مؤرشف</option>
          </select>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <span className="mr-2 text-sm text-gray-500">جاري التحميل...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">لا توجد فعاليات</p>
            <p className="text-sm mt-1">قم بإنشاء فعالية جديدة للبدء</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/organization/events/${event.id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Color Top Bar */}
                <div className="h-2" style={{ backgroundColor: event.primaryColor || "#7C3AED" }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: event.primaryColor || "#7C3AED" }}
                      >
                        {event.type === "HACKATHON" ? (
                          <Trophy className="w-6 h-6" />
                        ) : (
                          <BookOpen className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-elm-navy">{event.titleAr || event.title}</h3>
                        <p className="text-xs text-gray-400">{event.organization?.nameAr || event.organization?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${statusColors[event.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabels[event.status] || event.status}
                      </span>
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(event.startDate)} - {formatDate(event.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.isOnline ? "عن بعد" : (event.locationAr || event.location || "غير محدد")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-elm-navy">{event._count.members}</span>
                        <span className="text-xs text-gray-400">مشارك</span>
                      </div>
                      {event._count.teams > 0 && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-semibold text-elm-navy">{event._count.teams}</span>
                          <span className="text-xs text-gray-400">فريق</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-semibold text-elm-navy">{event._count.tracks}</span>
                        <span className="text-xs text-gray-400">مسار</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-50 rounded-md text-gray-500">
                        {categoryLabels[event.category] || event.category}
                      </span>
                      {event.aiEvaluationEnabled && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-brand-50 rounded-md text-brand-600">
                          <Cpu className="w-3 h-3" />
                          AI
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
