import { buildSofiaBusinessContext } from '@/lib/ai/sofia-context';
import type { ArmadoRapidoConfig } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

describe('Orden 304 Bloques 2 y 3: Sofía no improvisa paquetes ni fechas', () => {
  it('incluye los servicios exactos del paquete Intermedio sin sumar los del Premium', () => {
    const services = [
      { id: 's1', nombre: 'Audio e Iluminación' },
      { id: 's2', nombre: 'Fotocabina 360' },
      { id: 's3', nombre: 'Animación y show en vivo' },
    ] as ServicioEmpresa[];

    const config = {
      paquetes: [
        {
          id: 'intermedio',
          nombre: 'Intermedio',
          descripcion: 'Paquete intermedio',
          recommended: true,
          serviciosIncluidos: [{ id: 's1' }, { id: 's2' }],
        },
        {
          id: 'premium',
          nombre: 'Premium',
          descripcion: 'Paquete premium',
          recommended: false,
          serviciosIncluidos: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
        },
      ],
      menus: [],
    } as unknown as ArmadoRapidoConfig;

    const contextJson = buildSofiaBusinessContext(config, services, []);
    const parsed = JSON.parse(contextJson);
    const intermedio = parsed.paquetesCatalog.find((p: { id: string }) => p.id === 'intermedio');

    expect(intermedio.serviciosIncluidos.map((s: { nombre: string }) => s.nombre)).toEqual([
      'Audio e Iluminación',
      'Fotocabina 360',
    ]);
    expect(intermedio.serviciosIncluidos.map((s: { nombre: string }) => s.nombre)).not.toContain(
      'Animación y show en vivo',
    );
  });

  it('incluye reglas explícitas de disponibilidad con fecha exacta y sin promesas falsas', () => {
    const contextJson = buildSofiaBusinessContext(null, [], []);
    expect(contextJson).toContain('lo confirmamos con la fecha exacta');
    expect(contextJson).not.toContain('te avisamos al instante si alguien consulta por tu fecha');
  });
});
