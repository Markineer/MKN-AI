"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Shield,
  Settings,
  BarChart3,
  FileText,
  FlaskConical,
  Bell,
  LogOut,
  Trophy,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  userRoles: string[];
  userNameAr: string;
}

const navigation = [
  {
    title: "الرئيسية",
    items: [
      { nameAr: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "الإدارة",
    items: [
      { nameAr: "المستخدمين", href: "/admin/users", icon: Users },
      { nameAr: "المؤسسات", href: "/admin/organizations", icon: Building2 },
      { nameAr: "الأدوار والصلاحيات", href: "/admin/roles", icon: Shield },
    ],
  },
  {
    title: "الفعاليات",
    items: [
      { nameAr: "جميع الفعاليات", href: "/organization/events", icon: Calendar },
      { nameAr: "الهاكاثونات", href: "/organization/events?type=HACKATHON", icon: Trophy },
      { nameAr: "التحديات", href: "/organization/events?type=CHALLENGE", icon: BookOpen },
    ],
  },
  {
    title: "التقارير",
    items: [
      { nameAr: "التقارير والتحليلات", href: "/admin/reports", icon: BarChart3 },
      { nameAr: "سجل النشاطات", href: "/admin/activity", icon: FileText },
    ],
  },
  {
    title: "أخرى",
    items: [
      { nameAr: "بيانات الباحثين", href: "/researcher/datasets", icon: FlaskConical },
      { nameAr: "الإشعارات", href: "/admin/notifications", icon: Bell },
      { nameAr: "الإعدادات", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ userRoles, userNameAr }: SidebarProps) {
  const pathname = usePathname();
  const isSuperAdmin = userRoles.includes("super_admin") || userRoles.includes("platform_admin");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <aside className="w-72 h-screen bg-white border-l border-gray-100/80 flex flex-col fixed right-0 top-0 z-40">
      {/* Logo */}
      <div className="p-5 border-b border-gray-50">
        <Link href="/admin" className="flex items-center gap-3 group cursor-pointer">
          <Image
            src="/images/LOGO.jpg"
            alt="علم elm"
            width={100}
            height={48}
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div>
            <h1 className="logo-text text-2xl leading-none">
              مكن<span className="text-[0.55em] align-super mr-0.5" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontWeight: 700, letterSpacing: '0.05em' }}>AI</span>
            </h1>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map((group) => {
          const isOpen = !collapsed[group.title];
          return (
            <div key={group.title} className="mb-1">
              <button
                onClick={() => toggle(group.title)}
                className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors cursor-pointer"
              >
                {group.title}
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    !isOpen && "-rotate-90"
                  )}
                />
              </button>
              <div
                className={cn(
                  "space-y-0.5 overflow-hidden transition-all duration-300",
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href.split("?")[0]));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "sidebar-item group/item",
                        isActive && "active"
                      )}
                    >
                      <item.icon className={cn(
                        "w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200",
                        "group-hover/item:scale-110"
                      )} />
                      <span className="text-sm">{item.nameAr}</span>
                      {isActive && (
                        <span className="mr-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-9 h-9 gradient-purple rounded-lg flex items-center justify-center ring-2 ring-purple-100">
            <span className="text-white text-sm font-bold">
              {userNameAr?.charAt(0) || "م"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {userNameAr}
            </p>
            <p className="text-[11px] text-gray-400">
              {isSuperAdmin ? "مدير أعلى" : "مستخدم"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
