"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { useActiveOperator } from "@/_lib/operator-session";
import { isRouteAllowedForRole } from "@/_lib/operator-roles";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeOperator = useActiveOperator();

  const isAllowed = !activeOperator || isRouteAllowedForRole(activeOperator.role, pathname);

  useEffect(() => {
    if (!isAllowed) {
      router.replace("/");
    }
  }, [isAllowed, router]);

  if (!isAllowed) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-2 text-center">
        <ShieldAlert className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Você não tem acesso a essa página.</p>
      </div>
    );
  }

  return <>{children}</>;
}
