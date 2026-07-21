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
  {
    icon: ChefHat,
    label: "Cozinha",
    href: "/kitchen",
  },
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
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-base pb-6">Mañana Cafés y Coisinhas</SidebarGroupLabel>

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

      <SidebarFooter />
    </Sidebar>
  );
}
