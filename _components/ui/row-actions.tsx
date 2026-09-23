"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";

interface TRowActions {
  editTrigger: ReactNode;
  onDelete: () => void;
  isDeleting?: boolean;
  deleteDisabled?: boolean;
  deleteConfirmTitle?: string;
  deleteConfirmDescription?: string;
}

export function RowActions({
  editTrigger,
  onDelete,
  isDeleting = false,
  deleteDisabled,
  deleteConfirmTitle = "Excluir item?",
  deleteConfirmDescription = "Essa ação não pode ser desfeita.",
}: TRowActions) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const wasDeletingRef = useRef(false);

  // Closes the confirmation once the delete mutation settles, instead of dismissing it the
  // instant the button is clicked — so the dialog stays up (with a disabled, labeled button)
  // for as long as the request is actually in flight.
  useEffect(() => {
    if (wasDeletingRef.current && !isDeleting) {
      setIsConfirmOpen(false);
    }

    wasDeletingRef.current = isDeleting;
  }, [isDeleting]);

  return (
    <div className="flex justify-end gap-2">
      {editTrigger}

      <Button variant="destructive" size="icon-sm" onClick={() => setIsConfirmOpen(true)} disabled={deleteDisabled}>
        <Trash2 />
      </Button>

      <Dialog open={isConfirmOpen} onOpenChange={(open) => !isDeleting && setIsConfirmOpen(open)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{deleteConfirmTitle}</DialogTitle>
            <DialogDescription>{deleteConfirmDescription}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>

            <Button type="button" variant="destructive" className="flex-1" onClick={onDelete} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
