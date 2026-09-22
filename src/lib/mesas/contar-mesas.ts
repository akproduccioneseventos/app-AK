import type { LayoutElement } from '@/types/fiesta';

/**
 * Filtra los elementos de tipo mesa en el diseño de salón.
 * Única fuente de verdad compartida entre cartelería y números de mesa.
 */
export function filterTableElements(salonElements: LayoutElement[] = []): LayoutElement[] {
  return (salonElements || []).filter(
    (el) =>
      el.type === 'element' &&
      (el.seats != null ||
        el.name?.toLowerCase().includes('mesa') ||
        el.category?.toLowerCase().includes('mesa'))
  );
}

/**
 * Cuenta la cantidad de mesas en el diseño de salón.
 */
export function contarMesasDeSalon(salonElements: LayoutElement[] = []): number {
  return filterTableElements(salonElements).length;
}

/** Alias para compatibilidad con la orden 75 */
export const contarMesas = contarMesasDeSalon;
