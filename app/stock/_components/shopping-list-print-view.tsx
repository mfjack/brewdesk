import { toTitleCase } from "@/_lib/to-title-case";
import type { TShoppingListGroup } from "@/_lib/shopping-list";
import { useGetSettings } from "@/app/settings/query/useGetSettings";

interface TShoppingListPrintView {
  groups: TShoppingListGroup[];
}

export function ShoppingListPrintView({ groups }: TShoppingListPrintView) {
  const { data: settings } = useGetSettings();

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="shopping-list-print hidden px-2 h-fit print:block">
      <h1 className="text-base font-bold text-center my-2">Lista de compras</h1>

      {settings?.name && <p className="text-xs text-center mb-2">{settings.name}</p>}

      {groups.map((group) => (
        <div key={group.supplier?.id ?? "sem-fornecedor"} className="border-b pb-2 mb-2">
          <p className="text-xs font-bold">
            {group.supplier ? toTitleCase(group.supplier.companyName) : "Sem fornecedor definido"}
          </p>

          <div className="space-y-1 mt-1">
            {group.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-xs">
                <span>{toTitleCase(item.name)}</span>
                <span>{item.quantityLabel}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
