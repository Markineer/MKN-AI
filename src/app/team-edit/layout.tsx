import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تعديل بيانات الفريق — مكن AI",
};

export default function TeamEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">مكن</span>
          </div>
          <div>
            <p className="text-sm font-bold text-elm-navy">منصة مكن AI</p>
            <p className="text-[11px] text-gray-400">تعديل بيانات الفريق</p>
          </div>
        </div>
      </header>
      <main className="pb-12">{children}</main>
    </div>
  );
}
