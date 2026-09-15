"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { Avatar, AvatarFallback, AvatarImage } from "@/_components/ui/avatar";
import { supabase } from "@/_lib/supabase/client";
import { toTitleCase } from "@/_lib/to-title-case";

export function AccountInfo() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  if (!user) {
    return null;
  }

  const name = (user.user_metadata.full_name as string | undefined) ?? (user.user_metadata.name as string | undefined) ?? user.email ?? "";
  const avatarUrl = (user.user_metadata.avatar_url as string | undefined) ?? (user.user_metadata.picture as string | undefined);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex w-full items-center gap-2 rounded-lg p-1.5">
      <Avatar>
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
        <span className="w-full truncate text-xs font-medium">{toTitleCase(name)}</span>
        <span className="w-full truncate text-xs text-muted-foreground">{user.email}</span>
      </div>
    </div>
  );
}
