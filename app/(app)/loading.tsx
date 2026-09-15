import { Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-muted-foreground" size={24} />
    </div>
  );
}
