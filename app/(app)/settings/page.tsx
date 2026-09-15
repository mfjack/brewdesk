"use client";

import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";

import { useGetSettings } from "./query/useGetSettings";
import { GeneralInfoForm } from "./_components/general-info-form";
import { OperatorsSection } from "./_components/operators-section";
import { FeatureFlagsSection } from "./_components/feature-flags-section";
import { AccountSection } from "./_components/account-section";

export default function SettingsPage() {
  const { data: settings } = useGetSettings();

  return (
    <section className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4">
        <Header title="Configurações" description="Dados do estabelecimento usados no sistema e na comanda." />
      </div>

      <Separator className="h-px w-full" />

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        <GeneralInfoForm settings={settings} />

        <Separator className="my-6 max-w-lg" />

        <OperatorsSection settings={settings} />

        <Separator className="my-6 max-w-lg" />

        <FeatureFlagsSection settings={settings} />

        <Separator className="my-6 max-w-lg" />

        <AccountSection settings={settings} />
      </div>
    </section>
  );
}
