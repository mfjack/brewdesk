export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
