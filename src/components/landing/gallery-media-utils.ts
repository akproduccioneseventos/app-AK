export const GALLERY_CATEGORY_FILTERS = [
  "Todos",
  "Eventos",
  "Discoteca",
  "Catering",
  "Decoraci\u00f3n",
  "Barra de Tragos",
  "Fotocabina",
  "Reposter\u00eda",
  "Fotograf\u00eda",
  "Sal\u00f3n",
] as const;

type GalleryCategory = Exclude<(typeof GALLERY_CATEGORY_FILTERS)[number], "Todos">;

interface GalleryMediaIdentity {
  src: string;
  sourceId?: string;
  sourceUrl?: string;
}

const TRUSTED_CATEGORY_ALIASES: Array<[GalleryCategory, RegExp]> = [
  ["Barra de Tragos", /^(barra( de)? tragos|bebidas|cocteleria|cocktails?)$/],
  ["Fotocabina", /^(fotocabina|photobooth|espejo magico|plataforma 360)$/],
  ["Reposter\u00eda", /^(reposteria|candy bar|postres?)$/],
  ["Catering", /^(catering|gastronomia|entrada|plato principal|menu infantil)$/],
  ["Discoteca", /^(discoteca|dj(\/sonido)?|iluminacion)$/],
  ["Decoraci\u00f3n", /^(decoracion|ambientacion)$/],
  ["Sal\u00f3n", /^(salon|club uruguay)$/],
  ["Fotograf\u00eda", /^(fotografia|filmacion)$/],
];

const CATEGORY_RULES: Array<[GalleryCategory, RegExp]> = [
  ["Reposter\u00eda", /(torta|dulce|candy|postre|reposteria|chocolat|volcan|helado)/],
  ["Barra de Tragos", /(trago|bebida|\bbar\b|barra|coctel|whisky|gin|cerveza)/],
  ["Fotocabina", /(cabina|espejo|plataforma|touchpix|fotocabina|fotobina|totem| 360)/],
  ["Catering", /(comida|catering|menu|finger|gastro|plato|bocado|recepcion|kebab|kebat|shawarma|asado|parrilla|picada|brochete|sandwich|tabla|perro|pancho|hamburguesa|pizza|pizzeta|empanada|lunch|carne|snack|buffet)/],
  ["Sal\u00f3n", /(salon|club|uruguay)/],
  ["Decoraci\u00f3n", /(decor|ambient|mesa principal|velas|flores|estilo|cortinas)/],
  ["Discoteca", /(disco|luz|luces|pantalla|led|\bdj\b|sonido|pista|baile|valz|vals|robot)/],
  ["Fotograf\u00eda", /(foto|video|film|bogue|exteriores|civil|iglesia|pintada|sesion|retrato)/],
];

const CONTENT_FIRST_CATEGORIES = new Set<GalleryCategory>([
  "Catering",
  "Reposter\u00eda",
  "Barra de Tragos",
  "Fotocabina",
]);

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\u00c3\u00a1/g, "a")
    .replace(/\u00c3\u00a9/g, "e")
    .replace(/\u00c3\u00ad/g, "i")
    .replace(/\u00c3\u00b3/g, "o")
    .replace(/\u00c3\u00ba/g, "u")
    .replace(/\u00c3\u00b1/g, "n")
    .trim();
}

function trustedCategory(categoriaOriginal: string): GalleryCategory | undefined {
  const normalized = normalizeSearchText(categoriaOriginal);
  return TRUSTED_CATEGORY_ALIASES.find(([, pattern]) => pattern.test(normalized))?.[0];
}

function categoryFromText(text: string): GalleryCategory | undefined {
  return CATEGORY_RULES.find(([, pattern]) => pattern.test(text))?.[0];
}

export function classifyGalleryCategories(
  titulo: string,
  descripcion: string,
  categoriaOriginal: string,
): GalleryCategory[] {
  const titleCategory = categoryFromText(normalizeSearchText(titulo));

  // A named dish, drink, dessert or booth is more reliable than incidental copy
  // such as "decoracion" in the description of the same photo.
  if (titleCategory && CONTENT_FIRST_CATEGORIES.has(titleCategory)) {
    return [titleCategory];
  }

  const sourceCategory = trustedCategory(categoriaOriginal);
  if (sourceCategory) return [sourceCategory];

  // Descriptions coming from social networks are marketing copy, not an
  // authoritative label for the pictured service. A generic photo stays in
  // Eventos until its owner assigns a verified service category.
  const titleOnlyCategory = categoryFromText(normalizeSearchText(titulo));
  return [titleOnlyCategory ?? "Eventos"];
}

function canonicalMediaUrl(value?: string) {
  if (!value) return "";

  const clean = value.trim();
  if (!clean) return "";

  try {
    const url = new URL(clean, "https://ak-producciones.local");
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, "").toLowerCase();
    return url.origin === "https://ak-producciones.local" ? path : `${url.origin.toLowerCase()}${path}`;
  } catch {
    return clean.split(/[?#]/, 1)[0].replace(/\/+$/, "").toLowerCase();
  }
}

function uniqueMediaBasename(value?: string) {
  const canonical = canonicalMediaUrl(value);
  const basename = canonical.split("/").at(-1)?.replace(/\.[a-z0-9]+$/i, "") ?? "";
  return /(?:[a-f0-9]{12,}|[a-z0-9_-]{20,})/i.test(basename) ? basename : "";
}

export function galleryIdentityKeys(item: GalleryMediaIdentity) {
  const keys = new Set<string>();
  const sourceId = item.sourceId?.trim().toLowerCase();
  if (sourceId) keys.add(`source-id:${sourceId}`);

  for (const value of [item.src, item.sourceUrl]) {
    const canonical = canonicalMediaUrl(value);
    if (canonical) keys.add(`url:${canonical}`);

    const basename = uniqueMediaBasename(value);
    if (basename) keys.add(`basename:${basename}`);
  }

  return keys;
}
