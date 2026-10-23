/**
 * MATAFUEGO — Codex 264 (orden 219), 23/10/2026: el equipo empieza a guardar el texto B del contrato;
 * pasa la guarda (todavía sin firma), el cliente firma el texto A en su portal y recién ahí se escribe
 * B. Las dos acciones decían "listo" y quedaba la constancia de A junto al texto B.
 *
 * Ahora el texto del contrato se escribe adentro de la escritura de la fiesta, mirando la constancia
 * ahí mismo. La base de mentira devuelve COPIAS y atiende de a una (error 11). Se probó rompiéndolo:
 * con la escritura de antes (`updateDataPartial` después de la guarda), el primer caso se pone en rojo.
 */
import { createHash } from 'crypto';

const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((r) => setTimeout(r, 5));
let comoCliente = false;
let entreLecturaYGuardado: (() => Promise<void>) | null = null;

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const leido = almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]);
    if (archivo === 'fiestas/f1.json' && entreLecturaYGuardado) {
      const hacer = entreLecturaYGuardado;
      entreLecturaYGuardado = null;
      await hacer();
    }
    return leido;
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = copia(datos); }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => { await esperar(); almacen[archivo] = { ...almacen[archivo], ...copia(parcial) }; }),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => (comoCliente ? { success: false } : { success: true, user: { perfil: 'admin', role: 'admin' } })),
  generateBudgetToken: jest.fn(async (id: string) => `enlace-${id}`),
}));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { perfil: 'admin' } })),
  requirePermisoAlguno: jest.fn(async () => ({ ok: true, user: { perfil: 'admin' } })),
}));
jest.mock('@/lib/auth/equipo-de-la-fiesta', () => ({
  quienEsElEquipo: jest.fn(async () => () => !comoCliente),
  usuarioDelEquipo: jest.fn(async () => (comoCliente ? null : { perfil: 'admin' })),
}));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => true) }));
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
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestoById: jest.fn(async () => null) }));

import { signContractDigitally } from '@/app/actions/fiesta/documentos.actions';
import { updateFiestaPartial } from '@/app/actions/fiesta/fiesta.actions';

const TEXTO_A = 'Contrato de servicio, versión A.';
const TEXTO_B = 'Contrato de servicio, versión B.';
const huella = (t: string) => createHash('sha256').update(t).digest('hex');
const fiesta = () => almacen['fiestas/f1.json'];
const firmaElCliente = async () => {
  comoCliente = true;
  try {
    const r = await signContractDigitally('f1', 'Ana', false, huella(TEXTO_A));
    expect(r.success).toBe(true);
  } finally {
    comoCliente = false;
  }
};

beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen['fiestas/f1.json'] = {
    id: 'f1', estado: 'En Planificacion', presupuestoId: 'p1',
    configuracion: { nombreEvento: 'XV de Sofía', fechaEvento: '2026-12-10' },
    clientPortalSettings: { enabled: true, accessKey: 'clave' },
    contratoServicioTexto: TEXTO_A,
    contratoFirmaInfo: { isSigned: false },
  };
  comoCliente = false;
  entreLecturaYGuardado = null;
});

describe('un guardado que empezó antes de la firma no cambia el texto firmado (orden 219)', () => {
  it('el cliente firma A entre la guarda y la escritura: se rechaza B y quedan A y su huella', async () => {
    entreLecturaYGuardado = firmaElCliente;
    const r = await updateFiestaPartial('f1', { contratoServicioTexto: TEXTO_B } as any);
    expect(fiesta().firmaDigitalConstancia?.textoHuella).toBe(huella(TEXTO_A));
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/adenda/);
    expect(fiesta().contratoServicioTexto).toBe(TEXTO_A);
  });

  it('control: firmado antes de empezar, también se rechaza', async () => {
    await firmaElCliente();
    const r = await updateFiestaPartial('f1', { contratoServicioTexto: TEXTO_B } as any);
    expect(r.success).toBe(false);
    expect(fiesta().contratoServicioTexto).toBe(TEXTO_A);
  });

  it('sin firma, el equipo cambia el texto como siempre', async () => {
    const r = await updateFiestaPartial('f1', { contratoServicioTexto: TEXTO_B } as any);
    expect(r.success).toBe(true);
    expect(fiesta().contratoServicioTexto).toBe(TEXTO_B);
  });

  it('guardar el mismo texto ya firmado no es un cambio y pasa', async () => {
    await firmaElCliente();
    const r = await updateFiestaPartial('f1', { contratoServicioTexto: TEXTO_A, clientNotes: 'x' } as any);
    expect(r.success).toBe(true);
    expect(fiesta().firmaDigitalConstancia?.textoHuella).toBe(huella(TEXTO_A));
  });
});
