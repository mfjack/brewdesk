"use client";

import { X } from "lucide-react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";

interface TSearchInput {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className = "" }: TSearchInput) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <Input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />

      {value && (
        <Button size="icon" variant="ghost" onClick={() => onChange("")} className="h-10 w-10">
          <X size={16} />
        </Button>
      )}
    </div>
  );
}
