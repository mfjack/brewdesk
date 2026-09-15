import { CreateEstablishmentForm } from "./create-establishment-form";

export default function OnboardingPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-bold">Bem-vindo ao Tably</h1>
        <p className="text-sm text-muted-foreground">Antes de começar, dê um nome ao seu estabelecimento.</p>
      </div>

      <CreateEstablishmentForm />
    </div>
  );
}
