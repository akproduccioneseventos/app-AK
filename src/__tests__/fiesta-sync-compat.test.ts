import { applyLaundryCosts, deriveBudgetModulesForSync, mergeClientPortalSettingsForSync } from '@/lib/fiesta-sync-utils';
import { defaultClientPortalSettings } from '@/lib/fiesta-defaults';
import type { CostoItem } from '@/types/fiesta';
import type { ItemPresupuestado } from '@/types/presupuesto';

describe('syncFiestaFromBudget compatibility helpers', () => {
  it('preserva accessKey y configuración existente del portal cliente al sincronizar', () => {
    const merged = mergeClientPortalSettingsForSync({
      ...defaultClientPortalSettings,
      enabled: true,
      accessKey: 'ABC123',
      musica: { visible: true, editable: false },
      checklist: { visible: false, editable: false },
    });

    expect(merged.accessKey).toBe('ABC123');
    expect(merged.musica?.visible).toBe(true);
    expect(merged.checklist?.visible).toBe(true);
    expect(merged.checklist?.editable).toBe(true);
    expect(merged.itinerario?.visible).toBe(true);
  });

  it('tolera budgetItems malformados y limpia costos de lavadero cuando no aplica', () => {
    const existing: CostoItem[] = [
      { id: 'x1', nombre: 'Lavado Mantel ($50)', category: 'Servicio Proveedor', montoEstimado: 120 },
      { id: 'x2', nombre: 'Otro costo', category: 'Manual', montoEstimado: 500 },
    ];
    const malformedBudgetItems: ItemPresupuestado[] = [
      {} as ItemPresupuestado,
      { nombreServicio: undefined as unknown as string } as ItemPresupuestado,
    ];

    const updated = applyLaundryCosts(existing, 80, malformedBudgetItems);
    expect(updated.find(i => i.nombre === 'Lavado Mantel ($50)')).toBeUndefined();
    expect(updated.find(i => i.nombre === 'Otro costo')).toBeDefined();
  });

  it('calcula costos de lavadero con mantel y completa', () => {
    const updated = applyLaundryCosts([], 80, [
      { nombreServicio: 'Mantel premium' },
      { nombreServicio: 'Mantelería completa salón' },
    ]);

    expect(updated.find(i => i.nombre === 'Lavado Mantel ($50)')?.montoEstimado).toBe(500);
    expect(updated.find(i => i.nombre === 'Lavado Cubre ($18)')?.montoEstimado).toBe(180);
    expect(updated.find(i => i.nombre === 'Lavado Cubre Silla ($18)')?.montoEstimado).toBe(1440);
  });

  it('activa tecnologia y entretenimiento contratados con nombres normalizados', () => {
    const modules = deriveBudgetModulesForSync([
      { nombreServicio: 'Muro Social Interactivo' } as ItemPresupuestado,
      { nombreServicio: 'Plataforma 360' } as ItemPresupuestado,
      { nombreServicio: 'Pantalla Tótem personalizada' } as ItemPresupuestado,
      { nombreServicio: 'Invitación Digital' } as ItemPresupuestado,
    ]);

    expect(modules.muroSocial).toBe(true);
    expect(modules.entretenimiento).toBe(true);
    expect(modules.pantallasTotem).toBe(true);
    expect(modules.paginaWeb).toBe(true);
  });

  it('no confunde pantallas comunes ni bebidas con tecnologia contratada', () => {
    const modules = deriveBudgetModulesForSync([
      { nombreServicio: 'Pantalla y proyector' } as ItemPresupuestado,
      { nombreServicio: 'Barra de bebidas sin alcohol' } as ItemPresupuestado,
      { nombreServicio: 'Menú adolescente' } as ItemPresupuestado,
    ]);

    expect(modules.muroSocial).toBe(false);
    expect(modules.pantallasTotem).toBe(false);
    expect(modules.barraTecnologica).toBe(false);
    expect(modules.zonaDigital).toBe(false);
  });
});
