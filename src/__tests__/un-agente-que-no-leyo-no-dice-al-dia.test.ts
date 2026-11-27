import { marcarLecturaFallida } from '@/lib/marca-de-lectura';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) => {
    if (file === 'presupuestos.json') {
      return marcarLecturaFallida([], 'Error de conexión leyendo presupuestos');
    }
    return def;
  }),
  writeData: jest.fn(),
}));

import { ejecutarPerseguidorPresupuestos, ejecutarCobrador } from '@/lib/agentes/motor-agentes';
import { esFalla } from '@/lib/automatico/al-entrar-a-la-app';
import { diasHastaEnUruguay } from '@/lib/utils';

describe('Orden 362: un agente que no leyó no dice al día y el cobrador usa horario UY', () => {
  it('si la lectura de presupuestos falla, perseguidor devuelve estado error y esFalla lo marca como fallo', async () => {
    const res = await ejecutarPerseguidorPresupuestos(new Date('2026-11-26T22:00:00-03:00'));
    expect(res.estado).toBe('error');
    expect(res.lecturaFallida).toBe(true);
    expect(res.hallazgos[0]).toContain('No se pudieron leer');

    const check = esFalla(res);
    expect(check.fallo).toBe(true);
    expect(check.motivo).toContain('No se pudieron leer');
  });

  it('el cobrador devuelve falla en lectura fallida y diasHastaEnUruguay calcula 1 día entre 21-24hs UY', async () => {
    const resCob = await ejecutarCobrador(new Date('2026-11-26T22:30:00-03:00'));
    expect(resCob.estado).toBe('error');
    expect(resCob.lecturaFallida).toBe(true);

    // 22:30 UY del 26/11 (ya es 01:30 UTC del 27/11) para fiesta del 27/11: falta 1 día en Uruguay
    const diff = diasHastaEnUruguay('2026-11-27', new Date('2026-11-26T22:30:00-03:00'));
    expect(diff).toBe(1);
  });
});
