import type { ReactNode } from "react";

interface TSettingRow {
  label: string;
  description?: string;
  children: ReactNode;
  extra?: ReactNode;
}

export function SettingRow({ label, description, children, extra }: TSettingRow) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-input px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>

        {children}
      </div>

      {extra}
    </div>
  );
}
