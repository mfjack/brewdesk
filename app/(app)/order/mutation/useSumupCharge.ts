"use client";

import { useState } from "react";
import { supabase } from "@/_lib/supabase/client";
import type { TSumupChargeState } from "@/_lib/sumup/client";

interface TSumupChargeResult {
  status: "successful" | "failed";
  failureReason?: string | null;
}

export function useSumupCharge() {
  const [state, setState] = useState<TSumupChargeState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function charge(orderId: number, cardType?: "credit" | "debit"): Promise<TSumupChargeResult> {
    setState("charging");
    setError(null);

    const response = await fetch("/api/sumup/charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, cardType }),
    });

    const data = await response.json();

    if (!response.ok) {
      setState("failed");
      setError(data.error ?? "Não foi possível iniciar a cobrança.");

      return { status: "failed", failureReason: data.error };
    }

    setState("waiting");

    return new Promise<TSumupChargeResult>((resolve) => {
      const channel = supabase
        .channel(`sumup-charge-${data.chargeId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "sumup_charges", filter: `id=eq.${data.chargeId}` },
          (payload) => {
            const newStatus = payload.new.status as string;

            if (newStatus === "successful") {
              setState("successful");
              supabase.removeChannel(channel);
              resolve({ status: "successful" });
            } else if (newStatus === "failed") {
              const failureReason = payload.new.failure_reason as string | null;

              setState("failed");
              setError(failureReason ?? "Pagamento recusado na maquininha.");
              supabase.removeChannel(channel);
              resolve({ status: "failed", failureReason });
            }
          },
        )
        .subscribe();
    });
  }

  function reset() {
    setState("idle");
    setError(null);
  }

  return { state, error, charge, reset };
}
