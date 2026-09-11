export function buildWhatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;

  return `https://wa.me/${withCountryCode}`;
}
