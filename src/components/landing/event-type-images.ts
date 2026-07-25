export const PUBLIC_EVENT_TYPE_IMAGES = {
  boda: "/media/catalogo-servicios/boda_persuasiva.png",
  xv: "/media/catalogo-servicios/xv-pista-iluminada-01.jpeg",
  social: "/media/catalogo-servicios/social_persuasivo.png",
  corporativo: "/media/catalogo-servicios/corporativo_persuasivo.png",
} as const;

export function getPublicEventTypeImage(title: string): string | undefined {
  const normalized = title.toLowerCase();

  if (normalized.includes("boda") || normalized.includes("casamiento")) {
    return PUBLIC_EVENT_TYPE_IMAGES.boda;
  }
  if (normalized.includes("xv") || normalized.includes("15") || normalized.includes("quince")) {
    return PUBLIC_EVENT_TYPE_IMAGES.xv;
  }
  if (normalized.includes("corporat") || normalized.includes("empres")) {
    return PUBLIC_EVENT_TYPE_IMAGES.corporativo;
  }
  if (normalized.includes("cumple") || normalized.includes("social")) {
    return PUBLIC_EVENT_TYPE_IMAGES.social;
  }

  return undefined;
}
