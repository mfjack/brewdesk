import { cookies } from "next/headers";
import { SIDEBAR_COOKIE_NAME, SidebarInset, SidebarProvider } from "@/_components/ui/sidebar";
import { AppSidebar } from "@/_components/app/app-sidebar";
import { OperatorGate } from "@/_components/app/operator-gate";
import { RoleGuard } from "@/_components/app/role-guard";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sidebarDefaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <OperatorGate>
      <SidebarProvider defaultOpen={sidebarDefaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <main>
            <RoleGuard>{children}</RoleGuard>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OperatorGate>
  );
}
