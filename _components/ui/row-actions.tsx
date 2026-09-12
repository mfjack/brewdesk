import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/_components/ui/button";

interface TRowActions {
  editTrigger: ReactNode;
  onDelete: () => void;
  deleteDisabled?: boolean;
}

export function RowActions({ editTrigger, onDelete, deleteDisabled }: TRowActions) {
  return (
    <div className="flex justify-end gap-2">
      {editTrigger}

      <Button variant="destructive" size="icon-sm" onClick={onDelete} disabled={deleteDisabled}>
        <Trash2 />
      </Button>
    </div>
  );
}
