import {
  BarChart3,
  Boxes,
  HandCoins,
  ScanBarcode,
  ScrollText,
  Settings,
  Tags,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface TAppPage {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const APP_PAGES: TAppPage[] = [
  { path: "/", label: "PDV", icon: HandCoins },
  { path: "/order-detail", label: "Comandas", icon: ScrollText },
  { path: "/fiado", label: "Fiado", icon: Wallet },
  { path: "/category", label: "Categorias", icon: Tags },
  { path: "/product", label: "Produtos", icon: ScanBarcode },
  { path: "/stock", label: "Insumos", icon: Boxes },
  { path: "/supplier", label: "Fornecedores", icon: Truck },
  { path: "/report", label: "Relatório", icon: BarChart3 },
  { path: "/settings", label: "Configurações", icon: Settings },
];

export function isPathAllowed(allowedRoutes: string[], pathname: string): boolean {
  if (pathname === "/order") {
    return allowedRoutes.includes("/");
  }

  if (pathname === "/kitchen") {
    return true;
  }

  return allowedRoutes.includes(pathname);
}
