import { Separator } from "./separator";
import { SidebarTrigger } from "./sidebar";
import { Button } from "./button";
import Link from "next/link";

interface THeader {
  title: string;
  description: string;
}

export function Header({ title, description }: THeader) {
  return (
    <header className="flex items-center gap-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-8 w-px" />
      <Button variant="default" asChild size="lg">
        <Link href="/order-detail">Comandas</Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}
