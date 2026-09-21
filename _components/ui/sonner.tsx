"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "oklch(0.97 0.03 165)",
          "--success-text": "oklch(0.4 0.1 165)",
          "--success-border": "oklch(0.85 0.08 165)",
          "--error-bg": "oklch(0.97 0.03 25)",
          "--error-text": "oklch(0.45 0.15 25)",
          "--error-border": "oklch(0.85 0.08 25)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
