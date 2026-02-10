import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In production, get from session
  const mockUserRoles = ["super_admin"];
  const mockUserNameAr = "مدير علم";

  return (
    <div className="min-h-screen bg-surface-bg" dir="rtl">
      <Sidebar userRoles={mockUserRoles} userNameAr={mockUserNameAr} />
      <div className="mr-72">
        {children}
      </div>
    </div>
  );
}
