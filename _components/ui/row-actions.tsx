"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";

interface TRowActions {
  editTrigger: ReactNode;
  onDelete: () => void;
  deleteDisabled?: boolean;
  deleteConfirmTitle?: string;
  deleteConfirmDescription?: string;
}

export function RowActions({
  editTrigger,
  onDelete,
  deleteDisabled,
  deleteConfirmTitle = "Excluir item?",
  deleteConfirmDescription = "Essa ação não pode ser desfeita.",
}: TRowActions) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <div className="flex justify-end gap-2">
      {editTrigger}

      <Button variant="destructive" size="icon-sm" onClick={() => setIsConfirmOpen(true)} disabled={deleteDisabled}>
        <Trash2 />
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{deleteConfirmTitle}</DialogTitle>
            <DialogDescription>{deleteConfirmDescription}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-row gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsConfirmOpen(false)}>
              Cancelar
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={() => {
                setIsConfirmOpen(false);
                onDelete();
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
