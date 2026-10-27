import type { FullMenu } from '@/types/catering';
import type { Invitado } from '@/types/fiesta';

export interface ChoqueAlergiaPlato {
  platoNombre: string;
  tipoPlato: string;
  restriccion: string;
  personasAfectadas: number;
  ingredientesEnConflicto: string[];
}

export function detectarChoquesMenuYAlergias(
  menu: FullMenu | null,
  invitados: Invitado[],
): ChoqueAlergiaPlato[] {
  if (!menu || !menu.items || !invitados) return [];
  const choques: ChoqueAlergiaPlato[] = [];

  for (const item of menu.items) {
    const itemText = `${item.name} ${item.allergens || ''} ${(item.allergenTags || []).join(' ')} ${(item.ingredients || []).map((i) => i.name).join(' ')}`.toLowerCase();

    // Check Gluten / Celiaco
    const tieneGluten =
      item.allergenTags?.includes('gluten') ||
      /(gluten|trigo|harina|tacc|pan|pasta|cebada|centeno)/i.test(itemText);
    if (tieneGluten) {
      const afectados = invitados.filter(
        (g) => g.rsvp === 'Confirmado' && (g.isCeliac || g.dietaryRestriction === 'Celiaco' || g.dietaryRestriction === 'Sin Gluten'),
      );
      if (afectados.length > 0) {
        const pax = afectados.reduce((s, g) => s + (g.partySize || 1), 0);
        choques.push({
          platoNombre: item.name,
          tipoPlato: item.type || 'Plato',
          restriccion: 'Celíaco / Sin Gluten',
          personasAfectadas: pax,
          ingredientesEnConflicto: ['Gluten / TACC'],
        });
      }
    }

    // Check Lactosa
    const tieneLactosa =
      item.allergenTags?.includes('lacteos') ||
      /(lactosa|leche|queso|crema|manteca|yogur)/i.test(itemText);
    if (tieneLactosa) {
      const afectados = invitados.filter(
        (g) => g.rsvp === 'Confirmado' && g.dietaryRestriction === 'Sin Lactosa',
      );
      if (afectados.length > 0) {
        const pax = afectados.reduce((s, g) => s + (g.partySize || 1), 0);
        choques.push({
          platoNombre: item.name,
          tipoPlato: item.type || 'Plato',
          restriccion: 'Sin Lactosa',
          personasAfectadas: pax,
          ingredientesEnConflicto: ['Lácteos / Lactosa'],
        });
      }
    }

    // Check Vegano / Vegetariano
    const tieneCarne = /(carne|asado|pollo|pescado|cerdo|chivito|jamon|chorizo)/i.test(itemText);
    if (tieneCarne) {
      const afectadosVeg = invitados.filter(
        (g) => g.rsvp === 'Confirmado' && (g.dietaryRestriction === 'Vegano' || g.dietaryRestriction === 'Vegetariano'),
      );
      if (afectadosVeg.length > 0) {
        const pax = afectadosVeg.reduce((s, g) => s + (g.partySize || 1), 0);
        choques.push({
          platoNombre: item.name,
          tipoPlato: item.type || 'Plato',
          restriccion: 'Vegano / Vegetariano',
          personasAfectadas: pax,
          ingredientesEnConflicto: ['Carne / Derivados animales'],
        });
      }
    }

    // Check Mariscos
    const tieneMariscos =
      item.allergenTags?.includes('mariscos') ||
      /(marisco|camaron|langostino|langosta|cangrejo|calamar|pulpo|mejillon|almeja|ostra|crustace|molusco)/i.test(
        itemText.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      );
    if (tieneMariscos) {
      const afectados = invitados.filter(
        (g) => g.rsvp === 'Confirmado' && g.dietaryRestriction === 'Alergia Mariscos',
      );
      if (afectados.length > 0) {
        const pax = afectados.reduce((s, g) => s + (g.partySize || 1), 0);
        choques.push({
          platoNombre: item.name,
          tipoPlato: item.type || 'Plato',
          restriccion: 'Alergia a Mariscos',
          personasAfectadas: pax,
          ingredientesEnConflicto: ['Mariscos / Crustáceos'],
        });
      }
    }

    // Check Frutos Secos
    const tieneFrutosSecos =
      item.allergenTags?.includes('frutos_secos') ||
      /(nuez|almendra|frutos secos|mani|pistacho)/i.test(itemText);
    if (tieneFrutosSecos) {
      const afectados = invitados.filter(
        (g) => g.rsvp === 'Confirmado' && g.dietaryRestriction === 'Alergia Frutos Secos',
      );
      if (afectados.length > 0) {
        const pax = afectados.reduce((s, g) => s + (g.partySize || 1), 0);
        choques.push({
          platoNombre: item.name,
          tipoPlato: item.type || 'Plato',
          restriccion: 'Frutos Secos',
          personasAfectadas: pax,
          ingredientesEnConflicto: ['Frutos secos'],
        });
      }
    }
  }

  return choques;
}

