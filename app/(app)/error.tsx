"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/_components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <AlertTriangle className="text-destructive" size={32} />
      <p className="text-sm font-medium">Algo deu errado ao carregar essa página.</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Verifique sua conexão e tente novamente. Se o problema continuar, recarregue a página.
      </p>
      <Button onClick={reset} size="lg">
        <RotateCw />
        Tentar de novo
      </Button>
    </div>
  );
}
