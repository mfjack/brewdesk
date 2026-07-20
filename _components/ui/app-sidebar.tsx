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
import { ChefHat, HandCoins, Home, ScanBarcode, ScrollText, ShoppingBag, Tags } from "lucide-react";

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-base">Mañana Cafés y Coisinhas</SidebarGroupLabel>

          <SidebarGroupContent className="mt-5">
            <SidebarMenu className="space-y-3">
              <SidebarMenuItem>
                <SidebarMenuButton variant="outline" asChild>
                  <Link href="/order">
                    <HandCoins />
                    <p>PDV</p>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton variant="outline" asChild>
                  <Link href="/order-detail">
                    <ScrollText />
                    <p>Comandas</p>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton variant="outline" asChild>
                  <Link href="/kitchen">
                    <ChefHat />
                    <p>Cozinha</p>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton variant="outline" asChild>
                  <Link href="/category">
                    <Tags />
                    <p>Categorias</p>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton variant="outline" asChild>
                  <Link href="/product">
                    <ScanBarcode />
                    <p>Produtos</p>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}
