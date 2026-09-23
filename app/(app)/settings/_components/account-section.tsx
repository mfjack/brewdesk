"use client";

import { useEffect, useState } from "react";
import { LogOut, Trash2 } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { supabase } from "@/_lib/supabase/client";
import { HAS_ESTABLISHMENT_COOKIE } from "@/_lib/has-establishment-cookie";
import { useIsMasterOperator } from "@/_lib/operator-session";
import type { TStoreSettings } from "../../order/interface";

function clearHasEstablishmentCookie() {
  document.cookie = `${HAS_ESTABLISHMENT_COOKIE}=; Max-Age=0; path=/`;
}

export function AccountSection({ settings }: { settings: TStoreSettings | undefined }) {
  const isMaster = useIsMasterOperator(settings?.operators);
  const [email, setEmail] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    clearHasEstablishmentCookie();
    window.location.href = "/login";
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setError(null);

    const response = await fetch("/api/account/delete", { method: "POST" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      setError(body?.error ?? "Não foi possível excluir a conta.");
      setIsDeleting(false);

      return;
    }

    clearHasEstablishmentCookie();
    window.location.href = "/login";
  }

  const canConfirmDelete = Boolean(settings?.name) && confirmationText.trim() === settings?.name;

  if (!isMaster) {
    return null;
  }

  return (
    <div className="max-w-lg space-y-3">
      <div>
        <p className="text-sm font-medium">Conta</p>
        <p className="text-xs text-muted-foreground">{email ? `Conectado como ${email}` : "Carregando..."}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handleSignOut}>
          <LogOut />
          Sair da conta
        </Button>

        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            setConfirmationText("");
            setError(null);
            setIsDialogOpen(true);
          }}
        >
          <Trash2 />
          Excluir conta
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir conta permanentemente</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Isso apaga <strong className="text-foreground">todos os dados</strong> do estabelecimento (produtos, comandas,
              estoque, operadores, configurações) e a própria conta de login, sem volta. Pra confirmar, digite o nome do
              estabelecimento:{" "}
              <strong className="text-foreground">{settings?.name}</strong>.
            </p>

            <Input
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              placeholder="Nome do estabelecimento"
            />

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="destructive" disabled={!canConfirmDelete || isDeleting} onClick={handleDeleteAccount}>
              {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
