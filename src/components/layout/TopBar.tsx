"use client";

import { Bell, Search, Globe, Moon } from "lucide-react";

interface TopBarProps {
  title: string;
  titleAr: string;
}

export default function TopBar({ title, titleAr }: TopBarProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
      <div>
        <h2 className="text-lg font-bold text-gray-800">{titleAr}</h2>
      </div>
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث..."
            className="input-field pr-10 pl-4 w-64"
          />
        </div>
        {/* Actions */}
        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
          <Globe className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
