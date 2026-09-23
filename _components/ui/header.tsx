import { Separator } from "./separator";
import { SidebarTrigger, useSidebar } from "./sidebar";

interface THeader {
  title: string;
  description?: string;
}

export function Header({ title, description }: THeader) {
  const { locked } = useSidebar();

  return (
    <header className="flex items-center gap-6">
      {!locked && (
        <>
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-8 w-px" />
        </>
      )}

      <div>
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}
