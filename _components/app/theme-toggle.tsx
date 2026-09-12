"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Switch } from "@/_components/ui/switch";

function subscribe() {
  return () => {};
}

function useIsHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isHydrated = useIsHydrated();

  const isDark = isHydrated && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />

      <Switch
        checked={isDark}
        disabled={!isHydrated}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Alternar entre tema claro e escuro"
      />

      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
