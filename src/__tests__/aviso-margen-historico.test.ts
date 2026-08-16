import { calcularAvisoMargenHistorico } from '@/lib/costos/aviso-margen-historico';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Bloque E — Aviso de margen histórico al cotizar', () => {
  const mockFiesta = (tipo: string, invitados: number, costoEstimado: number, costoReal: number): FiestaEnPlanificacion => ({
    id: `fiesta_${Math.random()}`,
    nombre: 'Fiesta Test',
    tipo,
    configuracion: {
      tipoEvento: tipo,
      invitadosEstimados: invitados,
    },
    gestionCostos: {
      costosItems: [
        {
          id: 'item_1',
          categoria: 'Gastronomía',
          descripcion: 'Catering',
          costoEstimado,
          costoReal: 0,
        },
      ],
    },
    pagosProveedores: [
      {
        id: 'pago_1',
        costoItemId: 'item_1',
        monto: costoReal,
        fecha: '2026-08-01',
        medioPago: 'transferencia',
      },
    ],
  } as unknown as FiestaEnPlanificacion);

  it('devuelve null si no hay fiestas históricas parecidas suficientes (< 2)', () => {
    const fiestas = [
      mockFiesta('15_anos', 100, 50000, 65000),
    ];
    const aviso = calcularAvisoMargenHistorico(fiestas, { tipoEvento: '15_anos', invitados: 100 });
    expect(aviso).toBeNull();
  });

  it('devuelve null si los costos reales estuvieron dentro del rango estimado (desvío <= 5%)', () => {
    const fiestas = [
      mockFiesta('15_anos', 100, 50000, 51000),
      mockFiesta('15_anos', 110, 55000, 56000),
    ];
    const aviso = calcularAvisoMargenHistorico(fiestas, { tipoEvento: '15_anos', invitados: 100 });
    expect(aviso).toBeNull();
  });

  it('emite aviso en lenguaje claro si el costo real superó el estimado en las últimas fiestas parecidas', () => {
    const fiestas = [
      mockFiesta('15_anos', 100, 50000, 60000), // +20%
      mockFiesta('15_anos', 105, 50000, 60000), // +20%
      mockFiesta('15_anos', 95, 50000, 60000),  // +20%
    ];
    const aviso = calcularAvisoMargenHistorico(fiestas, { tipoEvento: '15_anos', invitados: 100 });
    expect(aviso).not.toBeNull();
    expect(aviso?.desvioPorcentaje).toBe(20);
    expect(aviso?.mensaje).toContain('En las últimas 3 fiestas parecidas');
    expect(aviso?.mensaje).toContain('superaron un 20% lo estimado');
  });

  it('no frena ni modifica ningún cálculo de precios (es puramente informativo)', () => {
    const fiestas = [
      mockFiesta('boda', 150, 100000, 130000), // +30%
      mockFiesta('boda', 140, 100000, 130000), // +30%
    ];
    const aviso = calcularAvisoMargenHistorico(fiestas, { tipoEvento: 'boda', invitados: 150 });
    expect(aviso?.cantidadFiestas).toBe(2);
    expect(aviso?.desvioPorcentaje).toBe(30);
  });
});
