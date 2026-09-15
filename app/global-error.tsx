"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div
          style={{
            display: "flex",
            height: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Algo deu errado ao carregar o Tably.</p>
          <p style={{ maxWidth: "24rem", fontSize: "0.75rem", color: "#71717a" }}>
            Recarregue a página. Se o problema continuar, tente novamente em alguns minutos.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              background: "#18181b",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
