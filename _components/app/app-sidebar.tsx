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
  useSidebar,
} from "@/_components/ui/sidebar";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { useGetSettings } from "@/app/(app)/settings/query/useGetSettings";
import { setActiveOperator, useActiveOperator } from "@/_lib/operator-session";
import { APP_PAGES } from "@/_lib/app-pages";
import { toTitleCase } from "@/_lib/to-title-case";
import { Button } from "@/_components/ui/button";
import { AccountInfo } from "./account-info";
import { NetworkStatusBadge } from "./network-status-badge";

export function AppSidebar() {
  const { data: settings } = useGetSettings();
  const activeOperator = useActiveOperator();
  const { setOpen } = useSidebar();

  const currentOperator = activeOperator ? settings?.operators.find((operator) => operator.id === activeOperator.id) : undefined;

  const isCreditSaleEnabled = settings?.featureFlags.creditSale ?? false;
  const isOrderTicketsEnabled = settings?.featureFlags.orderTickets ?? true;

  const visibleNavLinks = APP_PAGES.filter((page) => page.path !== "/conta" || isCreditSaleEnabled)
    .filter((page) => page.path !== "/order-detail" || isOrderTicketsEnabled)
    .filter((page) => (activeOperator ? currentOperator?.allowedRoutes.includes(page.path) : true));

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

            <SidebarGroupLabel className="font-bold text-base">{settings?.name}</SidebarGroupLabel>
          </div>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              {visibleNavLinks.map(({ icon: Icon, label, path }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton variant="outline" asChild>
                    <Link href={path} onClick={() => setOpen(false)}>
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

      <SidebarFooter className="gap-2 p-2">
        <NetworkStatusBadge />

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
        <AccountInfo />
      </SidebarFooter>
    </Sidebar>
  );
}
