import type { ReactNode } from "react";

interface TEmptyState {
  message: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ message, action, className = "p-8" }: TEmptyState) {
  return (
    <div className={`flex flex-col items-center gap-3 text-center ${className}`}>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
