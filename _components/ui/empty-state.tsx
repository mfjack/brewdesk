interface TEmptyState {
  message: string;
  className?: string;
}

export function EmptyState({ message, className = "p-8" }: TEmptyState) {
  return <p className={`text-center text-sm text-muted-foreground ${className}`}>{message}</p>;
}
