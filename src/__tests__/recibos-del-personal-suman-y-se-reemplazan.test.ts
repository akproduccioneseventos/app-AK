/** @jest-environment node */
/**
 * Codex, auditoría 91: recibos de sueldo del personal.
 *
 * - El desglose (base + vacacional + aguinaldo) de un recibo de $1.000 sumaba $999,99: cada
 *   renglón se redondeaba por su lado. Ahora el último renglón se lleva la diferencia.
 * - "Reemplazar" el papel de un recibo ya firmado se rechazaba: la pantalla sólo aceptaba
 *   "pagado". El servidor ya lo dejaba (sin cambiar monto ni fecha); acá queda comprobado.
 * - La fecha del recibo se leía como medianoche de Greenwich y salía un día antes.
 *
 * Probado rompiéndolo: con el redondeo por renglón, o con la pantalla aceptando sólo "pagado", en rojo.
 */
import fs from 'fs';
import path from 'path';
import { calculateSalaryBreakdown } from '@/lib/personal/desglose-recibo';

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => ({ ok: true, user: { email: 'duenio@ak' } })),
  requireAppSession: jest.fn(async () => undefined),
}));
let guardado: any[] = [];
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => JSON.parse(JSON.stringify(guardado))),
  writeData: jest.fn(async (_f: string, v: any) => { guardado = JSON.parse(JSON.stringify(v)); }),
}));

const suma = (b: { base: number; vacacional: number; aguinaldo: number }) =>
  Math.round((b.base + b.vacacional + b.aguinaldo) * 100) / 100;

describe('el desglose suma el total del recibo', () => {
  // 8,33 y 8,33 es el caso que daba $999,99; 5 y 10 daba $1.000,01.
  it.each([
    [1000, 8.33, 8.33], [1000, 5, 10], [1234.56, 8.33, 8.33], [3333.33, 4.17, 8.33], [17.01, 5, 10],
  ])('total %p con %p%% y %p%%', (total, vac, agui) => {
    const b = calculateSalaryBreakdown(total, { porcentajeSalarioVacacional: vac, porcentajeAguinaldo: agui } as any);
    expect(suma(b)).toBe(total);
    for (const v of Object.values(b)) expect(Math.round(v * 100) / 100).toBe(v);
  });

  it('sin porcentajes, todo es sueldo base', () => {
    expect(calculateSalaryBreakdown(1000)).toEqual({ base: 1000, vacacional: 0, aguinaldo: 0 });
  });
});

describe('reemplazar el papel firmado', () => {
  beforeEach(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    guardado = [{ id: 'r1', fiestaId: 'f1', empleadoId: 'e1', monto: 1000, estado: 'firmado_subido', archivoUrl: 'https://x/viejo.pdf' }];
  });

  it('un recibo firmado sin fecha acepta el papel nuevo', async () => {
    const { saveReciboFirmado } = await import('@/app/actions/recibos-personal');
    const r = await saveReciboFirmado({
      id: 'r1', fiestaId: 'f1', empleadoId: 'e1', monto: 1000, fecha: '', estado: 'firmado_subido',
      archivoUrl: 'https://x/nuevo.pdf', archivoNombre: 'nuevo.pdf',
    });
    expect(r.success).toBe(true);
    expect(guardado[0].archivoUrl).toBe('https://x/nuevo.pdf');
  });

  it('pero el monto de un recibo firmado sigue cerrado', async () => {
    const { saveReciboFirmado } = await import('@/app/actions/recibos-personal');
    const r = await saveReciboFirmado({ id: 'r1', fiestaId: 'f1', empleadoId: 'e1', monto: 5000, estado: 'firmado_subido' });
    expect(r.success).toBe(false);
    expect(guardado[0].monto).toBe(1000);
  });

  it('la pantalla deja reemplazar cuando ya está firmado', () => {
    const fuente = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/empleados/[id]/historial/page.tsx'), 'utf8');
    expect(fuente).toMatch(/estadoActual !== 'pagado' && estadoActual !== 'firmado_subido'/);
  });
});

it('la fecha del recibo no se lee como medianoche de Greenwich', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/personal/recibos/page.tsx'), 'utf8');
  expect(fuente).not.toMatch(/new Date\(dateString\)/);
  expect(fuente).toMatch(/formatearFechaEvento\(dateString\)/);
});

describe('la pantalla /fiestas/nueva/personal/recibos usa el desglose que suma', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/personal/recibos/page.tsx'), 'utf8');
  it('lo calcula con la función probada, para el papel y para la pantalla', () => {
    expect(fuente).toMatch(/from '@\/lib\/personal\/desglose-recibo'/);
    expect((fuente.match(/calculateSalaryBreakdown\(/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(fuente).not.toMatch(/totalPayment \/ divisor/);
  });
});
