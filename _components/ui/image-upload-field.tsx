"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { resizeImage } from "@/_lib/resize-image";

interface TImageUploadField {
  label: string;
  description?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Chamado além de onChange(null) ao remover, útil para persistir a remoção imediatamente. */
  onRemove?: () => void;
  addLabel?: string;
  changeLabel?: string;
  resizeMaxDimension?: number;
  resizeMimeType?: string;
  imageClassName?: string;
}

export function ImageUploadField({
  label,
  description,
  value,
  onChange,
  onRemove,
  addLabel = "Adicionar imagem",
  changeLabel = "Trocar imagem",
  resizeMaxDimension,
  resizeMimeType,
  imageClassName = "h-12 w-12 rounded-md object-cover ring-1 ring-foreground/10",
}: TImageUploadField) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    onChange(await resizeImage(file, resizeMaxDimension, resizeMimeType));
  }

  function handleRemove() {
    onChange(null);
    setFileInputKey((key) => key + 1);
    onRemove?.();
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload />
          {value ? changeLabel : addLabel}
        </Button>

        {value && (
          <>
            <Image src={value} alt="" className={imageClassName} width={48} height={48} />

            <Button type="button" variant="outline" size="icon" onClick={handleRemove}>
              <Trash2 />
            </Button>
          </>
        )}

        <input
          key={fileInputKey}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
