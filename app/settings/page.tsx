"use client";

import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { ThemeToggle } from "@/_components/app/theme-toggle";

import { useGetSettings } from "./query/useGetSettings";
import { GeneralInfoForm } from "./_components/general-info-form";
import { OperatorsSection } from "./_components/operators-section";
import { BackupSection } from "./_components/backup-section";

export default function SettingsPage() {
  const { data: settings } = useGetSettings();

  return (
    <section className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4">
        <Header title="Configurações" description="Dados do estabelecimento usados no sistema e na comanda." />
      </div>

      <Separator className="h-px w-full" />

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        <div className="mb-6 flex max-w-lg items-center justify-between rounded-lg border border-input px-3 py-2">
          <div>
            <p className="text-sm font-medium">Tema escuro</p>
            <p className="text-xs text-muted-foreground">Alterna a aparência do sistema entre claro e escuro.</p>
          </div>

          <ThemeToggle />
        </div>

        <GeneralInfoForm settings={settings} />

        <Separator className="my-6 max-w-lg" />

        <OperatorsSection settings={settings} />

        <Separator className="my-6 max-w-lg" />

        <BackupSection />
      </div>
    </section>
  );
}
