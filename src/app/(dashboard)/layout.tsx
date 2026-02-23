import Sidebar from "@/components/layout/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userRoles = (session?.user as any)?.roles || [];
  const userNameAr = (session?.user as any)?.nameAr || (session?.user as any)?.name || "مستخدم";

  return (
    <div className="min-h-screen bg-surface-bg" dir="rtl">
      <Sidebar userRoles={userRoles} userNameAr={userNameAr} />
      <div className="mr-72">
        {children}
      </div>
    </div>
  );
}
