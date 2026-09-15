"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { setActiveOperator, useActiveOperator } from "@/_lib/operator-session";
import { useGetSettings } from "@/app/(app)/settings/query/useGetSettings";
import { isPathAllowed } from "@/_lib/app-pages";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeOperator = useActiveOperator();
  const { data: settings, isLoading } = useGetSettings();

  const currentOperator = activeOperator ? settings?.operators.find((operator) => operator.id === activeOperator.id) : undefined;
  const isOperatorMissing = Boolean(activeOperator) && !isLoading && !currentOperator;
  const isAllowed = !activeOperator || isLoading || Boolean(currentOperator && isPathAllowed(currentOperator.allowedRoutes, pathname));

  useEffect(() => {
    if (isOperatorMissing) {
      setActiveOperator(null);

      return;
    }

    if (!isAllowed) {
      router.replace("/");
    }
  }, [isAllowed, isOperatorMissing, router]);

  if (isOperatorMissing) {
    return null;
  }

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
