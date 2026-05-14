import type { Trago } from '@/types/fiesta';

type DrinkMarketingFields = Pick<Trago, 'nombre' | 'ingredientes' | 'descripcion' | 'description' | 'videoUrl'>;

export function getDrinkDescription(drink: DrinkMarketingFields): string {
  const customDescription = (drink.descripcion || drink.description || '').trim();
  if (customDescription) return customDescription;

  const ingredients = drink.ingredientes?.filter(Boolean) || [];
  if (ingredients.length) {
    return `${drink.nombre} combina ${ingredients.join(', ')} en una propuesta pensada para elegir rapido desde la barra y disfrutar durante la fiesta.`;
  }

  return `${drink.nombre} esta disponible en la barra interactiva AK. Toca la tarjeta, confirma el pedido y el barman lo recibe al instante.`;
}

export function getDrinkTags(drink: DrinkMarketingFields): string[] {
  const text = `${drink.nombre} ${drink.ingredientes?.join(' ') || ''} ${drink.descripcion || drink.description || ''}`.toLowerCase();
  const tags = new Set<string>();

  if (text.includes('sin alcohol') || text.includes('mocktail') || text.includes('virgen')) tags.add('Sin alcohol');
  if (text.includes('limon') || text.includes('lima') || text.includes('citr')) tags.add('Citrico');
  if (text.includes('frut') || text.includes('durazno') || text.includes('anana') || text.includes('frutilla')) tags.add('Frutal');
  if (text.includes('sprite') || text.includes('coca') || text.includes('te') || text.includes('jugo')) tags.add('Refrescante');
  if (text.includes('granadina') || text.includes('azucar') || text.includes('dulce')) tags.add('Dulce');
  if (text.includes('ron') || text.includes('vodka') || text.includes('tequila') || text.includes('fernet')) tags.add('Con alcohol');

  if (!tags.size) tags.add('AK Bar');
  return Array.from(tags).slice(0, 4);
}

export function normalizeSocialHandle(handle?: string): string {
  const clean = String(handle || '')
    .trim()
    .replace(/^@+/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .split(/[/?#]/)[0]
    .replace(/[^\w.]/g, '');
  return clean || 'akproducciones';
}

export function buildInstagramUrl(handle?: string): string {
  return `https://www.instagram.com/${normalizeSocialHandle(handle)}/`;
}

export function isTruthyFollowConfirmation(value: FormDataEntryValue | null): boolean {
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
}
