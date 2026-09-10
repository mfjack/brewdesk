export function toTitleCase(text: string): string {
  return text.toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
}
