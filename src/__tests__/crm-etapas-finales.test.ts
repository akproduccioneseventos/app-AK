import {
  idsDeEtapaGanadora,
  idsDeEtapaPerdida,
  idsDeEtapasTerminadas,
} from '@/lib/crm/etapas-finales';
import type { CrmStage } from '@/types/crm';

/**
 * Los números del embudo dependen de saber cuál es la etapa de "firmó" y cuál la
 * de "no contrató". Antes estaban escritas a mano como `s4` y `s5`: si el dueño
 * personalizaba el embudo, los números salían mal sin avisar.
 */

function etapa(id: string, name: string, extra: Partial<CrmStage> = {}): CrmStage {
  return {
    id,
    name,
    order: 1,
    bgColor: '',
    borderColor: '',
    textColor: '',
    headerBgColor: '',
    headerTextColor: '',
    ...extra,
  };
}

describe('etapas finales del embudo', () => {
  it('toma la etapa ganadora de la marca, no del código', () => {
    const stages = [
      etapa('propia-1', 'Charlamos'),
      etapa('propia-2', 'Cerramos trato', { isConversionStage: true }),
    ];

    expect([...idsDeEtapaGanadora(stages)]).toEqual(['propia-2']);
  });

  it('reconoce la etapa perdedora por su nombre', () => {
    const stages = [
      etapa('a', 'Consultó'),
      etapa('b', 'No contrató'),
    ];

    expect([...idsDeEtapaPerdida(stages)]).toEqual(['b']);
  });

  it('reconoce variantes de la etapa perdedora', () => {
    for (const nombre of ['Perdido', 'Descartado', 'Rechazó la propuesta']) {
      const stages = [etapa('a', 'Consultó'), etapa('x', nombre)];
      expect([...idsDeEtapaPerdida(stages)]).toEqual(['x']);
    }
  });

  it('con el embudo de fábrica sigue funcionando igual que antes', () => {
    const stages = [
      etapa('s1', 'Consultó'),
      etapa('s4', 'Firmó contrato', { isConversionStage: true }),
      etapa('s5', 'No contrató'),
    ];

    expect([...idsDeEtapasTerminadas(stages)].sort()).toEqual(['s4', 's5']);
  });

  it('un embudo sin marcas ni nombres conocidos no inventa etapas', () => {
    const stages = [etapa('x1', 'Primera'), etapa('x2', 'Segunda')];

    expect(idsDeEtapasTerminadas(stages).size).toBe(0);
  });
});
