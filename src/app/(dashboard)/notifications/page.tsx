"use client";

import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/layout/TopBar";
import {
  Calendar,
  Users,
  FileCheck,
  BarChart3,
  Award,
  Mail,
  Clock,
  Volume2,
  Bell,
  CheckCheck,
  Loader2,
  BellOff,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

type NotificationType =
  | "EVENT"
  | "TEAM"
  | "SUBMISSION"
  | "EVALUATION"
  | "CERTIFICATE"
  | "INVITATION"
  | "REMINDER"
  | "ANNOUNCEMENT"
  | "SYSTEM";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ─── Type Config ────────────────────────────────────────────────

const typeConfig: Record<
  NotificationType,
  {
    icon: typeof Calendar;
    bg: string;
    color: string;
    label: string;
  }
> = {
  EVENT: { icon: Calendar, bg: "bg-emerald-50", color: "text-emerald-600", label: "فعالية" },
  TEAM: { icon: Users, bg: "bg-purple-50", color: "text-purple-600", label: "فريق" },
  SUBMISSION: { icon: FileCheck, bg: "bg-blue-50", color: "text-blue-600", label: "تسليم" },
  EVALUATION: { icon: BarChart3, bg: "bg-green-50", color: "text-green-600", label: "تقييم" },
  CERTIFICATE: { icon: Award, bg: "bg-amber-50", color: "text-amber-600", label: "شهادة" },
  INVITATION: { icon: Mail, bg: "bg-indigo-50", color: "text-indigo-600", label: "دعوة" },
  REMINDER: { icon: Clock, bg: "bg-orange-50", color: "text-orange-600", label: "تذكير" },
  ANNOUNCEMENT: { icon: Volume2, bg: "bg-violet-50", color: "text-violet-600", label: "إعلان" },
  SYSTEM: { icon: Bell, bg: "bg-gray-50", color: "text-gray-600", label: "نظام" },
};

// ─── Filter Tabs ────────────────────────────────────────────────

type FilterKey = "all" | "unread" | "acceptance" | "results" | "announcements";

const filterTabs: { key: FilterKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "unread", label: "غير مقروء" },
  { key: "acceptance", label: "القبول والفرق" },
  { key: "results", label: "النتائج" },
  { key: "announcements", label: "الإعلانات" },
];

// ─── Relative Time ──────────────────────────────────────────────

function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `منذ ${diffDays} يوم`;
  const diffMonths = Math.floor(diffDays / 30);
  return `منذ ${diffMonths} شهر`;
}

// ─── Filter Logic ───────────────────────────────────────────────

function applyFilter(
  notifications: Notification[],
  filter: FilterKey
): Notification[] {
  switch (filter) {
    case "unread":
      return notifications.filter((n) => !n.isRead);
    case "acceptance":
      return notifications.filter(
        (n) => n.type === "EVENT" || n.type === "TEAM"
      );
    case "results":
      return notifications.filter(
        (n) => n.type === "EVALUATION" || n.type === "CERTIFICATE"
      );
    case "announcements":
      return notifications.filter(
        (n) => n.type === "ANNOUNCEMENT" || n.type === "REMINDER"
      );
    default:
      return notifications;
  }
}

// ─── Main Page Component ────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data: NotificationsResponse = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark single notification as read
  async function markAsRead(id: string) {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (!res.ok) {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
        );
        setUnreadCount((prev) => prev + 1);
      }
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }

  // Mark all as read
  async function markAllAsRead() {
    setMarkingAllRead(true);

    // Optimistic update
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read-all" }),
      });
      if (!res.ok) {
        // Revert on failure
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
      }
    } catch {
      // Revert on failure
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    } finally {
      setMarkingAllRead(false);
    }
  }

  // Filtered list
  const filtered = applyFilter(notifications, activeFilter);

  // ─── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <div dir="rtl">
        <TopBar title="Notifications" titleAr="التنبيهات" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-3">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <TopBar title="Notifications" titleAr="التنبيهات" />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* ═══ Filter Tabs ═══ */}
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-brand-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Actions Bar ═══ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 bg-brand-500 rounded-full" />
                {unreadCount} غير مقروء
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markingAllRead ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        {/* ═══ Notifications List ═══ */}
        {filtered.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">لا توجد تنبيهات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((notification) => {
              const config =
                typeConfig[notification.type] || typeConfig.SYSTEM;
              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 transition-colors ${
                    notification.isRead
                      ? "border-gray-100"
                      : "bg-brand-50/30 border-brand-100"
                  }`}
                >
                  {/* Left: Icon Circle */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Center: Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-gray-800 truncate">
                        {notification.title}
                      </h4>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color} flex-shrink-0`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Right: Unread Indicator + Mark as Read */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-1">
                    {!notification.isRead && (
                      <>
                        <span className="w-2.5 h-2.5 bg-brand-500 rounded-full" />
                        <button
                          onClick={() => markAsRead(notification.id)}
                          title="تحديد كمقروء"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-brand-500 transition-colors"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      </>
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
