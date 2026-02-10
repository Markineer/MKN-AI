"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import { Wrench, ArrowRight } from "lucide-react";

interface UnderDevelopmentProps {
  title: string;
  titleAr: string;
}

export default function UnderDevelopment({ title, titleAr }: UnderDevelopmentProps) {
  const router = useRouter();
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <TopBar title={title} titleAr={titleAr} />
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
          <Wrench className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-elm-navy mb-2">{titleAr}</h2>
        <p className="text-gray-500 mb-6">هذه الصفحة قيد التطوير وستكون متاحة قريباً</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="toast-dev">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            <span>هذه الصفحة تحت التطوير</span>
          </div>
        </div>
      )}
    </div>
  );
}
