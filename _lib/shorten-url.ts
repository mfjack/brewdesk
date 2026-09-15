export function shortenUrl(url: string): string {
  try {
    const { hostname } = new URL(url);

    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
