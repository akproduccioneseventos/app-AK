/**
 * MATAFUEGO — Codex 240 (orden 216-claude), 22/10/2026: la firma del contrato desde el portal.
 *
 * C1 el cliente autorizado recibía 0 / seña por defecto en el resumen, porque su presupuesto se
 *    leía sin el enlace; y si no se podía leer, se inventaban importes.
 * C2 el guardado general dejaba reemplazar una constancia ya firmada (otro nombre, otra fecha).
 * C3 dos firmas a la vez: las dos "salían bien" y la segunda pisaba a la primera.
 * C4 si el equipo cambiaba el texto después de que el cliente lo leyó, se le atribuía el nuevo.
 *
 * La base de mentira devuelve COPIAS y atiende de a una transacción, con una espera adentro
 * (error 11 de CLAUDE.md). Se probó rompiéndolo: con la firma de antes (leer, después guardar con
 * el guardado parcial) los casos de C2, C3 y C4 se ponen en rojo.
 */
import { createHash } from 'crypto';

const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((r) => setTimeout(r, 5));
let cliente = true;
let presupuesto: any = null;
const notificar = jest.fn(async (..._a: any[]) => undefined);
const leerPresupuesto = jest.fn(async (_id: string, token?: string) => (token === 'enlace-p1' ? copia(presupuesto) : null));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => (almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]))),
  writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = copia(datos); }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => { almacen[archivo] = { ...almacen[archivo], ...copia(parcial) }; }),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: false })),
  generateBudgetToken: jest.fn(async (id: string) => `enlace-${id}`),
}));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => cliente) }));
jest.mock('@/app/actions/empleados', () => ({ getEmpleados: jest.fn(async () => []) }));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => [copia(almacen['fiestas/f1.json'])]),
  leerHistorialCrudo: jest.fn(async () => []),
}));
let turno: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn((id: string, cambiar: (f: any) => any) => {
    const r = turno.then(async () => {
      try {
        const nueva = await cambiar(copia(almacen[`fiestas/${id}.json`]));
        await esperar();
        almacen[`fiestas/${id}.json`] = copia(nueva);
        return { success: true, updatedFiesta: copia(nueva) };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    });
    turno = r.catch(() => undefined);
    return r;
  }),
}));
jest.mock('next/headers', () => ({ headers: jest.fn(async () => new Map()) }));
jest.mock('@/app/actions/invoices', () => ({ registerBookingDeposit: jest.fn() }));
jest.mock('@/lib/invoices/leer-facturas', () => ({ leerFacturasSinGuardia: jest.fn(async () => []) }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(), deleteFromStorage: jest.fn() }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: (...a: any[]) => notificar(...a) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestoById: (id: string, token?: string) => leerPresupuesto(id, token) }));

import { getContractSigningSummary, signContractDigitally } from '@/app/actions/fiesta/documentos.actions';
import { saveFiesta, updateFiestaPartial } from '@/app/actions/fiesta/fiesta.actions';

const TEXTO_A = 'Contrato de servicio, versión A.';
const huella = (t: string) => createHash('sha256').update(t).digest('hex');
const fiesta = () => almacen['fiestas/f1.json'];

beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen['fiestas/f1.json'] = {
    id: 'f1', estado: 'En Planificacion', presupuestoId: 'p1',
    configuracion: { nombreEvento: 'XV de Sofía', fechaEvento: '2026-12-10', nombreLugar: 'Salón' },
    clientPortalSettings: { enabled: true, accessKey: 'clave' },
    contratoServicioTexto: TEXTO_A,
    contratoFirmaInfo: { isSigned: false },
  };
  presupuesto = { id: 'p1', totalConDescuento: 100000, costoTotalEstimado: 100000, senia: 30000, itemsPresupuestados: [] };
  cliente = true;
  notificar.mockClear();
  leerPresupuesto.mockClear();
});

describe('C1: el cliente ve SU resumen económico, sin importes inventados', () => {
  it('lee su presupuesto con el enlace de ese presupuesto', async () => {
    const r = await getContractSigningSummary('f1');
    expect(r.success).toBe(true);
    expect(r.summary?.senia).toBe(30000);
    expect(r.summary?.totalEstimado).toBeGreaterThanOrEqual(100000);
    expect(r.summary?.saldo).toBe((r.summary?.totalEstimado ?? 0) - 30000);
    expect(leerPresupuesto).toHaveBeenCalledWith('p1', 'enlace-p1');
  });

  it('si el presupuesto no se puede leer, lo dice: no muestra 0 ni la seña por defecto', async () => {
    presupuesto = null;
    const r = await getContractSigningSummary('f1');
    expect(r.success).toBe(false);
    expect(r.summary).toBeUndefined();
  });

  it('sin sesión del portal no hay resumen', async () => {
    cliente = false;
    expect((await getContractSigningSummary('f1')).success).toBe(false);
    expect(leerPresupuesto).not.toHaveBeenCalled();
  });
});

describe('C4: sólo se acepta el texto que el cliente vio', () => {
  it('con la huella del texto que tiene en pantalla, queda la constancia de ESE texto', async () => {
    expect((await signContractDigitally('f1', 'Ana', false, huella(TEXTO_A))).success).toBe(true);
    expect(fiesta().firmaDigitalConstancia.signedBy).toBe('Ana');
    expect(fiesta().firmaDigitalConstancia.textoHuella).toBe(huella(TEXTO_A));
    expect(fiesta().estado).toBe('En Planificacion');
    expect(fiesta().contratoFirmaInfo.isSigned).toBe(false);
    expect(notificar).toHaveBeenCalledTimes(1);
  });

  it('si el equipo cambió el texto después de que lo leyó, no se firma y se le pide recargar', async () => {
    fiesta().contratoServicioTexto = 'Contrato de servicio, versión B.';
    const r = await signContractDigitally('f1', 'Ana', false, huella(TEXTO_A));
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/cambió/);
    expect(fiesta().firmaDigitalConstancia).toBeUndefined();
    expect(notificar).not.toHaveBeenCalled();
  });

  it('sin la huella de lo que vio, no se firma', async () => {
    expect((await signContractDigitally('f1', 'Ana', false)).success).toBe(false);
    expect(fiesta().firmaDigitalConstancia).toBeUndefined();
  });
});

describe('C3: dos firmas a la vez no pisan la primera', () => {
  it('queda la de quien llegó primero y sale un solo aviso', async () => {
    const [a, b] = await Promise.all([
      signContractDigitally('f1', 'Firmante A', false, huella(TEXTO_A)),
      signContractDigitally('f1', 'Firmante B', false, huella(TEXTO_A)),
    ]);
    expect(a.success && b.success).toBe(true);
    expect(fiesta().firmaDigitalConstancia.signedBy).toBe('Firmante A');
    expect(notificar).toHaveBeenCalledTimes(1);
  });

  it('un reintento después de firmar no cambia la constancia', async () => {
    await signContractDigitally('f1', 'Ana', false, huella(TEXTO_A));
    const primera = copia(fiesta().firmaDigitalConstancia);
    expect((await signContractDigitally('f1', 'Otro', false, huella(TEXTO_A))).success).toBe(true);
    expect(fiesta().firmaDigitalConstancia).toEqual(primera);
  });
});

describe('C2: el guardado general no falsifica la constancia', () => {
  const falsa = { signedBy: 'Reemplazo desde parcial', signedAt: '1900-01-01', textoHuella: 'falso' };

  it('de a partes, desde el portal: se rechaza y la constancia queda igual', async () => {
    await signContractDigitally('f1', 'Ana', false, huella(TEXTO_A));
    const original = copia(fiesta().firmaDigitalConstancia);
    const r = await updateFiestaPartial('f1', { firmaDigitalConstancia: falsa } as any, { allowPortal: true });
    expect(r.success).toBe(false);
    expect(fiesta().firmaDigitalConstancia).toEqual(original);
  });

  it('entera, desde el portal: lo demás se guarda y la constancia queda la firmada', async () => {
    await signContractDigitally('f1', 'Ana', false, huella(TEXTO_A));
    const original = copia(fiesta().firmaDigitalConstancia);
    const r = await saveFiesta({ ...copia(fiesta()), firmaDigitalConstancia: falsa, programa: [{ id: 'x' }] } as any);
    expect(r.success).toBe(true);
    expect(fiesta().firmaDigitalConstancia).toEqual(original);
  });

  it('entera, sin firma previa: no aparece una constancia inventada', async () => {
    const r = await saveFiesta({ ...copia(fiesta()), firmaDigitalConstancia: falsa } as any);
    expect(r.success).toBe(true);
    expect(fiesta().firmaDigitalConstancia).toBeUndefined();
  });

  it('lo legítimo del portal sigue pasando por el guardado parcial', async () => {
    const r = await updateFiestaPartial('f1', { clientNotes: 'Traemos torta' } as any, { allowPortal: true });
    expect(r.success).toBe(true);
    expect(fiesta().clientNotes).toBe('Traemos torta');
  });
});

describe('después de firmar en el portal, el texto del contrato no se cambia (revisión contable 22/10)', () => {
  it('ni desde la pantalla del equipo ni desde el portal: hace falta una adenda', async () => {
    await signContractDigitally('f1', 'Ana', false, huella(TEXTO_A));
    const equipo = await updateFiestaPartial('f1', { contratoServicioTexto: 'Versión B' } as any);
    const portal = await updateFiestaPartial('f1', { contratoServicioTexto: 'Versión B' } as any, { allowPortal: true });
    expect(equipo.success).toBe(false);
    expect(equipo.error).toMatch(/adenda/);
    expect(portal.success).toBe(false);
    expect(fiesta().contratoServicioTexto).toBe(TEXTO_A);
  });
});
