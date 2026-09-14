"use client";

import { useEffect, useMemo, useState } from "react";

const SHOPPING_LIST_DISMISSED_KEY = "brewdesk.shopping-list-dismissed";

function loadDismissedIds(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const stored = window.localStorage.getItem(SHOPPING_LIST_DISMISSED_KEY);

    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedIds(ids: Set<string>) {
  window.localStorage.setItem(SHOPPING_LIST_DISMISSED_KEY, JSON.stringify(Array.from(ids)));
}

export function useShoppingListDismissals(currentIds: string[]) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => loadDismissedIds());

  const effectiveDismissedIds = useMemo(() => {
    const currentIdSet = new Set(currentIds);

    return new Set([...dismissedIds].filter((id) => currentIdSet.has(id)));
  }, [currentIds, dismissedIds]);

  useEffect(() => {
    if (effectiveDismissedIds.size !== dismissedIds.size) {
      saveDismissedIds(effectiveDismissedIds);
    }
  }, [effectiveDismissedIds, dismissedIds]);

  function clearList() {
    const next = new Set(currentIds);

    setDismissedIds(next);
    saveDismissedIds(next);
  }

  return { dismissedIds: effectiveDismissedIds, clearList };
}
