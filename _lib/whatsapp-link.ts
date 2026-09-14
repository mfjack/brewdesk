export function buildWhatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;

  return message ? `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}` : `https://wa.me/${withCountryCode}`;
}
