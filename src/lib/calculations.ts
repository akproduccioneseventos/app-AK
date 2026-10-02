import type { ItemPresupuestado } from '@/types/presupuesto';

/**
 * Quita los acentos para poder comparar sin depender de cómo se haya escrito el
 * nombre del servicio: "Menú Niños" y "Menu Ninos" tienen que valer lo mismo.
 */
function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Palabras que marcan a un servicio como exclusivo de menores.
 *
 * A propósito NO están "chico" ni "menor" en singular: en este rubro aparecen
 * en nombres que no tienen nada que ver con la edad ("Salón chico", "pantalla
 * de menor tamaño"), y darían por infantil un servicio para toda la fiesta.
 */
const PALABRAS_DE_MENORES = ['nino', 'ninos', 'infantil', 'infantiles', 'menores', 'kids'];

/** ¿El nombre del servicio dice que es exclusivo para menores? */
function esParaMenores(nombre: string): boolean {
  const limpio = sinAcentos(nombre.toLowerCase());
  return PALABRAS_DE_MENORES.some(palabra => new RegExp(`\\b${palabra}\\b`).test(limpio));
}

/**
 * MOTOR DE CÁLCULO UNIFICADO - PASO 1: Determinar el universo de personas para el ítem.
 */
export function getGuestCountForItem(item: { nombreServicio: string, categoriaServicio?: string, subcategoria?: string }, adultos: number, adolescentes: number, ninos: number): number {
  if (!item) return (Number(adultos) || 0) + (Number(adolescentes) || 0) + (Number(ninos) || 0);

  const name = (item.nombreServicio || '').toLowerCase();
  const cat = (item.categoriaServicio || '').toLowerCase();
  const sub = (item.subcategoria || '').toLowerCase();
  const ninosYAdolescentes = (ninos || 0) + (adolescentes || 0);

  // Regla A: Servicios exclusivos para menores
  if (cat.includes('infantil') || cat.includes('adolescente') || sub.includes('infantil') || sub.includes('adolescente') || esParaMenores(name)) {
    return ninosYAdolescentes;
  }

  // Regla B: Platos principales para adultos (excluyendo si dice infantil)
  if ((cat.includes('plato principal') || sub.includes('plato principal') || name.includes('principal')) && !esParaMenores(name)) {
    return adultos;
  }

  // Regla C: Servicios generales (Torta, Bebidas, Discoteca, Salón, etc.) -> Total de personas
  return (Number(adultos) || 0) + ninosYAdolescentes;
}

/**
 * MOTOR DE CÁLCULO UNIFICADO - PASO 2: Calcular la cantidad sugerida basada en el método
 */
export function calculateSuggestedQuantity(item: { calculationMethod?: string, invitadosPorUnidad?: number, cantidad?: number, nombreServicio: string, categoriaServicio?: string, subcategoria?: string }, adultos: number, ninos: number): number {
    const totalGuests = getGuestCountForItem(item, adultos, 0, ninos);
  
    switch (item.calculationMethod) {
        case 'porPersona':
            return totalGuests;
        case 'ratio':
            return Math.ceil(totalGuests / (item.invitadosPorUnidad || 1));
        case 'fijo':
            return item.cantidad || 1;
        case 'tramos':
            return 1;
        default:
            return item.cantidad || 1;
    }
}

/**
 * MOTOR DE CÁLCULO UNIFICADO - PASO 3: Calcular el importe total de la línea.
 */
export function recalcularCostoItem(item: ItemPresupuestado, adultos: number, adolescentes: number, ninos: number): number {
  if (!item) return 0;
  if (item.esRegalo) return 0;

  const totalInvitados = (Number(adultos) || 0) + (Number(adolescentes) || 0) + (Number(ninos) || 0);
  const cantidadInvitadosTarget = getGuestCountForItem(item, Number(adultos) || 0, Number(adolescentes) || 0, Number(ninos) || 0);

  if (cantidadInvitadosTarget === 0 && (item.calculationMethod === 'porPersona' || item.calculationMethod === 'ratio')) {
    return 0;
  }

  let itemTotal = 0;
  const precioAplicado = Number(item.precioUnitarioPresupuesto ?? item.precioUnitario) || 0;

  switch (item.calculationMethod) {
    case 'fijo':
      itemTotal = precioAplicado * ((Number(item.cantidad) || 0) > 0 ? Number(item.cantidad) : 1);
      break;
    case 'porPersona':
      itemTotal = precioAplicado * cantidadInvitadosTarget;
      break;
    case 'ratio':
      const ratio = Number(item.invitadosPorUnidad);
      if (ratio > 0) {
        // MATEMÁTICA CRÍTICA: Redondeo hacia arriba para cubrir excedentes
        const unidadesNecesarias = Math.ceil(cantidadInvitadosTarget / ratio);
        itemTotal = unidadesNecesarias * precioAplicado;
      } else {
        itemTotal = precioAplicado;
      }
      break;
    case 'tramos':
      // Para tramos usamos el total general del evento como referencia de escala
      const tramo = item.tramosDePrecio?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default:
      itemTotal = (Number(item.cantidad) || 1) * precioAplicado;
  }
  return Math.round(Number(itemTotal) || 0);
}
