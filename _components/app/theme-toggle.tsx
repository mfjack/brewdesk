"use client";

import { useTheme } from "next-themes";

import { Switch } from "@/_components/ui/switch";
import { useIsHydrated } from "@/_lib/use-is-hydrated";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isHydrated = useIsHydrated();

  const isDark = isHydrated && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isDark}
        disabled={!isHydrated}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Alternar entre tema claro e escuro"
      />
    </div>
  );
}
