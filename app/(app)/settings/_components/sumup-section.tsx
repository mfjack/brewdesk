"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Nfc } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { useGetSumupStatus } from "../../order/query/useGetSumupStatus";

export function SumupSection() {
  const queryClient = useQueryClient();
  const { data: status } = useGetSumupStatus();

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [merchantCode, setMerchantCode] = useState("");
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  const [pairingCode, setPairingCode] = useState("");
  const [readerName, setReaderName] = useState("");
  const [isPairing, setIsPairing] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  async function handleSaveCredentials() {
    setIsSavingCredentials(true);
    setCredentialsError(null);

    const response = await fetch("/api/sumup/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret, merchantCode }),
    });

    const data = await response.json();

    if (!response.ok) {
      setCredentialsError(data.error ?? "Não foi possível salvar as credenciais.");
      setIsSavingCredentials(false);

      return;
    }

    setClientId("");
    setClientSecret("");
    setMerchantCode("");
    setIsSavingCredentials(false);
    queryClient.invalidateQueries({ queryKey: ["sumupStatus"] });
  }

  async function handlePairReader() {
    setIsPairing(true);
    setPairingError(null);

    const response = await fetch("/api/sumup/pair-reader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairingCode, name: readerName }),
    });

    const data = await response.json();

    if (!response.ok) {
      setPairingError(data.error ?? "Não foi possível parear a maquininha.");
      setIsPairing(false);

      return;
    }

    setPairingCode("");
    setReaderName("");
    setIsPairing(false);
    queryClient.invalidateQueries({ queryKey: ["sumupStatus"] });
  }

  return (
    <div className="max-w-lg space-y-3">
      <div>
        <p className="text-sm font-medium">Maquininha (SumUp)</p>
        <p className="text-xs text-muted-foreground">
          Cobra direto na maquininha Solo pareada, sem digitar o valor duas vezes. Precisa de um app cadastrado em{" "}
          <span className="font-medium text-foreground">developer.sumup.com</span> com acesso liberado aos escopos de
          pagamento.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-input p-3">
        <Nfc className={status?.configured ? "text-foreground" : "text-muted-foreground"} />
        <div className="flex-1">
          <p className="text-sm font-medium">{status?.configured ? "Credenciais salvas" : "Não configurado"}</p>
          {status?.readerId && (
            <p className="text-xs text-muted-foreground">
              Maquininha: {status.readerName} ({status.readerStatus})
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-input p-3">
        <label className="text-sm font-medium">Client ID</label>
        <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Client ID da SumUp" />

        <label className="text-sm font-medium">Client Secret</label>
        <Input
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="Client Secret da SumUp"
        />

        <label className="text-sm font-medium">Merchant Code</label>
        <Input value={merchantCode} onChange={(e) => setMerchantCode(e.target.value)} placeholder="Ex.: MQEXXXXXXX" />

        {credentialsError && <p className="text-xs text-destructive">{credentialsError}</p>}

        <Button
          type="button"
          onClick={handleSaveCredentials}
          disabled={isSavingCredentials || !clientId.trim() || !clientSecret.trim() || !merchantCode.trim()}
        >
          {isSavingCredentials ? "Salvando..." : "Salvar credenciais"}
        </Button>
      </div>

      {status?.configured && (
        <div className="flex flex-col gap-2 rounded-lg border border-input p-3">
          <label className="text-sm font-medium">Código de pareamento</label>
          <p className="text-xs text-muted-foreground">
            Na maquininha, inicie o pareamento e digite aqui o código de 8-9 caracteres que aparecer na tela dela.
          </p>
          <Input value={pairingCode} onChange={(e) => setPairingCode(e.target.value)} placeholder="Ex.: 4WLFDSBF" />

          <label className="text-sm font-medium">Nome (opcional)</label>
          <Input value={readerName} onChange={(e) => setReaderName(e.target.value)} placeholder="Ex.: Caixa 1" />

          {pairingError && <p className="text-xs text-destructive">{pairingError}</p>}

          <Button type="button" variant="outline" onClick={handlePairReader} disabled={isPairing || !pairingCode.trim()}>
            {isPairing ? "Pareando..." : "Parear maquininha"}
          </Button>
        </div>
      )}
    </div>
  );
}
