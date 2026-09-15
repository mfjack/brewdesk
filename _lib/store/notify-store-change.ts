export function notifyStoreChange(queryKeys: string[]) {
  window.dispatchEvent(new CustomEvent("brewdesk-store-change", { detail: { queryKeys } }));
}
