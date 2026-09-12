export const OPERATOR_ROLES = ["ATENDENTE", "ADM", "GERENTE"] as const;

export type TOperatorRole = (typeof OPERATOR_ROLES)[number];

export const OPERATOR_ROLE_LABELS: Record<TOperatorRole, string> = {
  ATENDENTE: "Atendente",
  ADM: "Administrador",
  GERENTE: "Gerente",
};

const ROLE_ALLOWED_ROUTES: Record<TOperatorRole, string[]> = {
  ATENDENTE: ["/", "/order", "/order-detail"],
  ADM: ["/", "/order", "/order-detail", "/category", "/product", "/stock"],
  GERENTE: ["/", "/order", "/order-detail", "/category", "/product", "/stock", "/supplier", "/report", "/settings", "/kitchen"],
};

export function isRouteAllowedForRole(role: TOperatorRole, pathname: string): boolean {
  return (ROLE_ALLOWED_ROUTES[role] ?? []).includes(pathname);
}

export function getAllowedRoutesForRole(role: TOperatorRole): string[] {
  return ROLE_ALLOWED_ROUTES[role] ?? [];
}
