export const AK_WHATSAPP_NUMBER = '59898355530';

export function buildAkWhatsAppUrl(message: string, number = AK_WHATSAPP_NUMBER) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
