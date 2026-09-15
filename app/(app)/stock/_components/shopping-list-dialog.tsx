"use client";

import type { ReactNode } from "react";
import { MessageCircle, Printer, Trash2 } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/_components/ui/dialog";
import { EmptyState } from "@/_components/ui/empty-state";
import { buildWhatsappLink } from "@/_lib/whatsapp-link";
import { toTitleCase } from "@/_lib/to-title-case";
import { buildShoppingOrderMessage, type TShoppingListGroup } from "@/_lib/shopping-list";

interface TShoppingListDialog {
  trigger: ReactNode;
  groups: TShoppingListGroup[];
  onClearList: () => void;
}

export function ShoppingListDialog({ trigger, groups, onClearList }: TShoppingListDialog) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto no-scrollbar print:hidden">
        <DialogHeader>
          <DialogTitle>Lista de compras</DialogTitle>
          <DialogDescription>Insumos e produtos com estoque baixo, agrupados por fornecedor.</DialogDescription>
        </DialogHeader>

        {groups.length === 0 ? (
          <EmptyState message="Nada precisa ser reposto no momento." />
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.supplier?.id ?? "sem-fornecedor"} className="flex flex-col gap-2 rounded-lg border border-input p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {group.supplier ? toTitleCase(group.supplier.companyName) : "Sem fornecedor definido"}
                  </p>

                  {group.supplier?.whatsapp && (
                    <a
                      href={buildWhatsappLink(group.supplier.whatsapp, buildShoppingOrderMessage(group.items))}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button type="button" variant="outline" size="sm">
                        <MessageCircle />
                        Pedir
                      </Button>
                    </a>
                  )}
                </div>

                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{toTitleCase(item.name)}</span>
                      <span className="text-xs text-muted-foreground">{item.quantityLabel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {groups.length > 0 && (
          <DialogFooter className="flex-row gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClearList}>
              <Trash2 />
              Limpar lista
            </Button>

            <Button type="button" className="flex-1" onClick={() => window.print()}>
              <Printer />
              Imprimir lista
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
