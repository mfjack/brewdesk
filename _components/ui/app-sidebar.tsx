"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./sidebar";
import Image from "next/image";
import { HandCoins, LogOut, ScanBarcode, ScrollText, Settings, Tags } from "lucide-react";
import { useGetSettings } from "@/app/settings/query/useGetSettings";
import { setActiveOperator, useActiveOperator } from "@/_lib/operator-session";
import { toTitleCase } from "@/_lib/to-title-case";
import { Button } from "./button";

const navLinks = [
  {
    icon: HandCoins,
    label: "PDV",
    href: "/",
  },
  {
    icon: ScrollText,
    label: "Comandas",
    href: "/order-detail",
  },
  // {
  //   icon: ChefHat,
  //   label: "Cozinha",
  //   href: "/kitchen",
  // },
  {
    icon: Tags,
    label: "Categorias",
    href: "/category",
  },
  {
    icon: ScanBarcode,
    label: "Produtos",
    href: "/product",
  },
  {
    icon: Settings,
    label: "Configurações",
    href: "/settings",
  },
];

export function AppSidebar() {
  const { data: settings } = useGetSettings();
  const activeOperator = useActiveOperator();

  return (
    <Sidebar collapsible="offcanvas" className="print:hidden">
      <SidebarHeader />

      <SidebarContent>
        <SidebarGroup>
          <div className="flex flex-col items-center gap-2 pb-6 pt-2">
            {settings?.logoUrl && (
              <Image
                src={settings.logoUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-1 ring-foreground/10"
                width={64}
                height={64}
              />
            )}

            <SidebarGroupLabel className="font-bold text-base">{settings?.name ?? "BrewDesk"}</SidebarGroupLabel>
          </div>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              {navLinks.map(({ icon: Icon, label, href }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton variant="outline" asChild>
                    <Link href={href}>
                      <Icon />
                      <p>{label}</p>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {activeOperator && (
          <div className="flex items-center justify-between gap-2 px-2 py-1 text-xs text-muted-foreground">
            <span>
              Operador: <strong className="text-foreground">{toTitleCase(activeOperator.name)}</strong>
            </span>

            <Button variant="ghost" size="icon-sm" onClick={() => setActiveOperator(null)} title="Trocar operador">
              <LogOut />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
