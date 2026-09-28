import { describe, it, expect } from '@jest/globals';
import { sugerirPlantillaPorTipo, ordenarPlantillasPorTipo } from '@/lib/itinerario/sugerir-plantilla';
import type { ItineraryTemplate, ProgramaEventoItem } from '@/types/fiesta';

describe('Sugerencia de plantillas de cronograma por tipo de evento', () => {
  const plantillaBoda: ItineraryTemplate = {
    id: 'tpl-boda',
    name: 'Cronograma Clásico de Boda',
    tipoEvento: 'Boda',
    items: [
      { id: '1', hora: '20:30', titulo: 'Llegada de novios', visibleParaCliente: true },
      { id: '2', hora: '21:30', titulo: 'Vals principal', visibleParaCliente: true },
      { id: '3', hora: '22:00', titulo: 'Cena de bodas', visibleParaCliente: true },
      { id: '4', hora: '00:00', titulo: 'Tanda de baile', visibleParaCliente: true },
    ],
  };

  const plantillaXV: ItineraryTemplate = {
    id: 'tpl-xv',
    name: 'Cronograma Estándar de 15 Años',
    tipoEvento: '15 Años',
    items: [
      { id: '1', hora: '21:00', titulo: 'Entrada de la quinceañera', visibleParaCliente: true },
      { id: '2', hora: '22:00', titulo: 'Vals con el padre', visibleParaCliente: true },
      { id: '3', hora: '22:30', titulo: 'Cena', visibleParaCliente: true },
      { id: '4', hora: '01:00', titulo: 'Cotillón y carnaval carioca', visibleParaCliente: true },
    ],
  };

  const plantillaCumple: ItineraryTemplate = {
    id: 'tpl-cumple',
    name: 'Cumpleaños Infantil / General',
    tipoEvento: 'Cumpleaños',
    items: [
      { id: '1', hora: '17:00', titulo: 'Bienvenida', visibleParaCliente: true },
    ],
  };

  const todasLasPlantillas = [plantillaXV, plantillaBoda, plantillaCumple];

  it('con una boda y plantillas de Boda y XV, sugiere la de Boda', () => {
    const programaVacio: ProgramaEventoItem[] = [];
    const tipoEventoBoda = 'Boda';

    const sugerencia = sugerirPlantillaPorTipo(programaVacio, todasLasPlantillas, tipoEventoBoda);

    expect(sugerencia).not.toBeNull();
    expect(sugerencia?.id).toBe('tpl-boda');
    expect(sugerencia?.tipoEvento).toBe('Boda');
    expect(sugerencia?.items).toHaveLength(4);
  });

  it('con el programa ya cargado, no sugiere nada', () => {
    const programaConItems: ProgramaEventoItem[] = [
      { id: 'item-existente', hora: '21:00', titulo: 'Recepción ya planificada', visibleParaCliente: true },
    ];
    const tipoEventoBoda = 'Boda';

    const sugerencia = sugerirPlantillaPorTipo(programaConItems, todasLasPlantillas, tipoEventoBoda);

    // Nunca debe pisar un cronograma que ya tiene ítems
    expect(sugerencia).toBeNull();
  });

  it('si no hay coincidencia de tipo de evento, no sugiere nada', () => {
    const programaVacio: ProgramaEventoItem[] = [];
    const tipoSinPlantilla = 'Bautismo';

    const sugerencia = sugerirPlantillaPorTipo(programaVacio, todasLasPlantillas, tipoSinPlantilla);

    expect(sugerencia).toBeNull();
  });

  it('ordena las plantillas colocando primero las del mismo tipo de fiesta', () => {
    const ordenadas = ordenarPlantillasPorTipo(todasLasPlantillas, 'Boda');

    // La de Boda debe ser la primera
    expect(ordenadas[0].id).toBe('tpl-boda');
    expect(ordenadas[0].tipoEvento).toBe('Boda');
  });
});
