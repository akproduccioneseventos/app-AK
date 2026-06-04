import type { ClientPortalSettings, CostoItem } from '@/types/fiesta';
import type { ItemPresupuestado } from '@/types/presupuesto';
import { defaultClientPortalSettings } from '@/lib/fiesta-defaults';

export function normalizeBudgetItemsForSync(items: ItemPresupuestado[] | null | undefined): ItemPresupuestado[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is ItemPresupuestado => !!item && typeof item === 'object');
}

export function mergeClientPortalSettingsForSync(current?: ClientPortalSettings): ClientPortalSettings {
  const existing: Partial<ClientPortalSettings> = current || {};
  return {
    ...defaultClientPortalSettings,
    ...existing,
    enabled: true, // force enable when syncing from budget
    checklist: { visible: true, editable: true, ...existing.checklist },
    itinerario: { visible: true, ...existing.itinerario },
    musica: { visible: true, editable: true, ...existing.musica },
    videoVida: { visible: true, editable: true, ...existing.videoVida },
    listaRegalos: { visible: true, ...existing.listaRegalos },
    documentos: { visible: true, ...existing.documentos },
    notasCliente: { visible: true, editable: true, ...existing.notasCliente },
    invitados: { visible: true, ...existing.invitados },
    fotografiaYFilmacion: { visible: true, ...existing.fotografiaYFilmacion },
    moodboard: { visible: true, editable: true, ...existing.moodboard },
    contrato: { visible: true, ...existing.contrato },
    pagos: { visible: true, ...existing.pagos },
    calculadoraBebidas: { visible: true, items: defaultClientPortalSettings.calculadoraBebidas?.items ?? [], ...existing.calculadoraBebidas },
    menu: { visible: true, ...existing.menu },
    cartaTragos: { visible: true, ...existing.cartaTragos },
    dressCode: { visible: true, ...existing.dressCode },
    faq: { visible: true, ...existing.faq },
    informarPago: { visible: true, editable: true, ...existing.informarPago },
  };
}

export function applyLaundryCosts(
  baseItems: CostoItem[],
  guests: number,
  budgetItems: ItemPresupuestado[] | null | undefined
): CostoItem[] {
  const items = [...baseItems];
  const safeItems = Array.isArray(budgetItems) ? budgetItems : [];
  const hasMantel = safeItems.some(i => (i?.nombreServicio || '').toLowerCase().includes('mantel'));
  const hasCompleta = safeItems.some(i => (i?.nombreServicio || '').toLowerCase().includes('completa'));

  const updateOrCreateCost = (name: string, amount: number) => {
    const index = items.findIndex(i => i.nombre === name);
    if (amount > 0) {
      if (index > -1) {
        items[index].montoEstimado = Math.round(amount);
      } else {
        const stableIdPart = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        items.push({
          id: `laundry_${stableIdPart}`,
          nombre: name,
          category: 'Servicio Proveedor',
          montoEstimado: Math.round(amount),
          notas: 'Auto-generado: Lavadero del Sol'
        });
      }
    } else if (index > -1) {
      items.splice(index, 1);
    }
  };

  if (hasMantel) {
    const normalizedGuests = Math.max(0, Math.round(guests || 0));
    const units = Math.ceil(normalizedGuests / 8);
    updateOrCreateCost('Lavado Mantel ($50)', units * 50);
    updateOrCreateCost('Lavado Cubre ($18)', units * 18);
    if (hasCompleta) {
      updateOrCreateCost('Lavado Cubre Silla ($18)', normalizedGuests * 18);
    }
  } else {
    updateOrCreateCost('Lavado Mantel ($50)', 0);
    updateOrCreateCost('Lavado Cubre ($18)', 0);
    updateOrCreateCost('Lavado Cubre Silla ($18)', 0);
  }

  return items;
}
