export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("pt-BR");
}
