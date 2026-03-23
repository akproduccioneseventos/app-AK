import type { ItemPresupuestado } from '@/types/presupuesto';

/**
 * MOTOR DE CÁLCULO UNIFICADO - PASO 1: Determinar el universo de personas para el ítem.
 */
export function getGuestCountForItem(item: { nombreServicio: string, categoriaServicio?: string, subcategoria?: string }, adultos: number, adolescentes: number, ninos: number): number {
  if (!item) return adultos + (adolescentes || 0) + (ninos || 0);
  
  const name = (item.nombreServicio || '').toLowerCase();
  const cat = (item.categoriaServicio || '').toLowerCase();
  const sub = (item.subcategoria || '').toLowerCase();
  const ninosYAdolescentes = (ninos || 0) + (adolescentes || 0);
  
  // Regla A: Servicios exclusivos para menores
  if (cat.includes('infantil') || cat.includes('adolescente') || sub.includes('infantil') || sub.includes('adolescente') || name.includes('niño')) {
    return ninosYAdolescentes;
  }
  
  // Regla B: Platos principales para adultos (excluyendo si dice infantil)
  if ((cat.includes('plato principal') || sub.includes('plato principal') || name.includes('principal')) && !name.includes('niño')) {
    return adultos;
  }
  
  // Regla C: Servicios generales (Torta, Bebidas, Discoteca, Salón, etc.) -> Total de personas
  return adultos + ninosYAdolescentes;
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
  
  const totalInvitados = adultos + (adolescentes || 0) + (ninos || 0);
  const cantidadInvitadosTarget = getGuestCountForItem(item, adultos, adolescentes, ninos);
  
  if (cantidadInvitadosTarget === 0 && (item.calculationMethod === 'porPersona' || item.calculationMethod === 'ratio')) {
    return 0;
  }
  
  let itemTotal = 0;
  const precioAplicado = item.precioUnitarioPresupuesto ?? item.precioUnitario;

  switch (item.calculationMethod) {
    case 'fijo':
      itemTotal = (item.precioBase ?? precioAplicado) * (item.cantidad > 0 ? item.cantidad : 1);
      break;
    case 'porPersona':
      itemTotal = (item.precioPorPersona ?? precioAplicado) * cantidadInvitadosTarget;
      break;
    case 'ratio':
      const ratio = Number(item.invitadosPorUnidad);
      if (ratio > 0) {
        // MATEMÁTICA CRÍTICA: Redondeo hacia arriba para cubrir excedentes
        const unidadesNecesarias = Math.ceil(cantidadInvitadosTarget / ratio);
        itemTotal = unidadesNecesarias * (item.precioBase ?? precioAplicado);
      } else {
        itemTotal = item.precioBase ?? precioAplicado;
      }
      break;
    case 'tramos':
      // Para tramos usamos el total general del evento como referencia de escala
      const tramo = item.tramosDePrecio?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default:
      itemTotal = item.cantidad * precioAplicado;
  }
  return Math.round(itemTotal);
}
