/** @jest-environment node */
process.env.AK_SESSION_SECRET = 'prueba-345-empezar-2027-secreto';
process.env.FIREBASE_PROJECT_ID = 'demo-ak-producciones';
delete process.env.AK_USE_LOCAL_JSON_ONLY;
jest.setTimeout(60000);

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, getAll: () => [] }),
  headers: async () => new Headers(),
}));

let mockSessionUser: { email: string; role: string; perfil: string } = {
  email: 'dueno@ak.uy',
  role: 'admin',
  perfil: 'dueno',
};

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: async () => ({ success: true, user: mockSessionUser }),
}));
jest.mock('@/lib/backup/schedule-after-write', () => ({
  scheduleAutoBackupAfterWrite: async () => undefined,
}));

const notificacionesCreadas: any[] = [];
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: async (data: any) => {
    notificacionesCreadas.push(data);
    return { success: true, notification: data };
  },
}));

import fs from 'node:fs';
import path from 'node:path';
import { correrMigracionEmpezar2027 } from '@/lib/automatico/empezar-2027';
import { writeData } from '@/lib/data-service';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { FiestaHistorica } from '@/types/fiesta-historica';

const ARCHIVOS_LOCALES_BACKUP = [
  path.join(process.cwd(), 'data', 'presupuestos.json'),
  path.join(process.cwd(), 'src', 'data', 'presupuestos.json'),
  path.join(process.cwd(), 'data', 'fiestas.json'),
  path.join(process.cwd(), 'src', 'data', 'fiestas.json'),
  path.join(process.cwd(), 'data', 'fiestas-historicas.json'),
  path.join(process.cwd(), 'src', 'data', 'fiestas-historicas.json'),
  path.join(process.cwd(), 'data', 'invoices.json'),
  path.join(process.cwd(), 'src', 'data', 'invoices.json'),
  path.join(process.cwd(), 'data', 'customers.json'),
  path.join(process.cwd(), 'src', 'data', 'customers.json'),
  path.join(process.cwd(), 'data', 'company-info.json'),
  path.join(process.cwd(), 'src', 'data', 'company-info.json'),
  path.join(process.cwd(), 'data', 'backup-status.json'),
  path.join(process.cwd(), 'src', 'data', 'backup-status.json'),
];

const backupsLocales = new Map<string, string | null>();
const fiestasCreadasEnTest = new Set<string>();

async function limpiarColeccionesEmulador() {
  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) return;
  const colecciones = ['presupuestos', 'fiestas', 'fiestas_historicas', 'facturas', 'clientes', 'migraciones'];
  for (const col of colecciones) {
    const snap = await dbAdmin.collection(col).get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
    }
  }
  const snapBackups = await dbAdmin.collection('backup_snapshots_v2').get();
  for (const manifest of snapBackups.docs) {
    const chunks = await manifest.ref.collection('chunks').get();
    for (const chunk of chunks.docs) await chunk.ref.delete();
    await manifest.ref.delete();
  }
  const backupSys = await dbAdmin.collection('backup_system').get();
  for (const doc of backupSys.docs) await doc.ref.delete();

  for (const dir of [
    path.join(process.cwd(), 'data', 'fiestas'),
    path.join(process.cwd(), 'src', 'data', 'fiestas'),
  ]) {
    for (const fId of fiestasCreadasEnTest) {
      const p = path.join(dir, `${fId}.json`);
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
        } catch {}
      }
    }
  }
  fiestasCreadasEnTest.clear();
}

function makePresupuesto(overrides: Partial<Presupuesto> & { id: string }): Presupuesto {
  return {
    clienteNombre: 'Cliente Test',
    clienteContacto: '099111222',
    eventoTipo: 'XV años',
    eventoFecha: '2026-06-15',
    invitadosCantidad: 120,
    salonFiestas: 'Salón Genérico',
    itemsPresupuestados: [],
    costoTotalEstimado: 150000,
    totalConDescuento: 150000,
    timestamp: '2026-01-10T12:00:00.000Z',
    estado: 'Enviado',
    ...overrides,
  };
}

const BASE_TEST_CONFIG: FiestaEnPlanificacion['configuracion'] = {
  nombreEvento: 'Evento Test',
  fechaEvento: '2026-06-15',
  nombreLugar: 'Salón Genérico',
  invitadosEstimados: 120,
  presupuestoEstimado: 150000,
  tipoCelebracion: 'Boda',
  horaInicio: '21:00',
  horaFin: '05:00',
  notesAdicionales: '',
};

function makeFiesta(
  overrides: Omit<Partial<FiestaEnPlanificacion>, 'configuracion'> & {
    id: string;
    configuracion?: Partial<FiestaEnPlanificacion['configuracion']>;
  },
): FiestaEnPlanificacion {
  return {
    estado: 'En Planificación',
    personalAsignado: [],
    ...overrides,
    id: overrides.id,
    configuracion: {
      ...BASE_TEST_CONFIG,
      ...(overrides.configuracion || {}),
    },
  };
}

describe('Orden 345 Bloque 4: Empezar 2027 de cero en emulador Firestore', () => {
  beforeAll(() => {
    expect(Boolean(process.env.FIRESTORE_EMULATOR_HOST)).toBe(true);
    for (const file of ARCHIVOS_LOCALES_BACKUP) {
      backupsLocales.set(file, fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);
    }
  });

  beforeEach(async () => {
    mockSessionUser = { email: 'dueno@ak.uy', role: 'admin', perfil: 'dueno' };
    notificacionesCreadas.length = 0;
    await limpiarColeccionesEmulador();
  });

  afterAll(async () => {
    await limpiarColeccionesEmulador();
    for (const [file, content] of backupsLocales.entries()) {
      try {
        if (content === null) {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        } else {
          fs.writeFileSync(file, content, 'utf8');
        }
      } catch {}
    }
  });

  it('no corre si el usuario no es dueño (auditor / personal / solo_lectura)', async () => {
    const { dbAdmin } = await import('@/lib/firebase/server');
    expect(dbAdmin).toBeTruthy();

    await writeData(
      'presupuestos.json',
      [makePresupuesto({ id: 'p_2026_no_dueno', eventoFecha: '2026-05-01' })],
      undefined,
      { skipAutoBackup: true },
    );

    mockSessionUser = { email: 'auditor@ak.uy', role: 'admin', perfil: 'auditor' };
    const rAuditor = await correrMigracionEmpezar2027();
    expect(rAuditor).toEqual({ omitido: 'solo_dueno' });

    mockSessionUser = { email: 'mozo@ak.uy', role: 'personal', perfil: 'personal' };
    const rPersonal = await correrMigracionEmpezar2027();
    expect(rPersonal).toEqual({ omitido: 'solo_dueno' });

    const rSoloLectura = await correrMigracionEmpezar2027({
      currentRole: 'solo_lectura',
      isSoloLectura: true,
    });
    expect(rSoloLectura).toEqual({ omitido: 'solo_dueno' });

    const migDoc = await dbAdmin!.collection('migraciones').doc('empezar-2027').get();
    expect(migDoc.exists).toBe(false);
    const pSnap = await dbAdmin!.collection('presupuestos').doc('p_2026_no_dueno').get();
    expect(pSnap.exists).toBe(true);
  });

  it('si falla el respaldo no borra nada y marca estado fallo', async () => {
    const { dbAdmin } = await import('@/lib/firebase/server');
    await writeData(
      'presupuestos.json',
      [makePresupuesto({ id: 'p_2026_respaldo_falla', eventoFecha: '2026-08-10' })],
      undefined,
      { skipAutoBackup: true },
    );
    await writeData(
      'fiestas/f_2026_respaldo_falla.json',
      makeFiesta({ id: 'f_2026_respaldo_falla', presupuestoId: 'p_2026_respaldo_falla' }),
      undefined,
      { skipAutoBackup: true },
    );
    fiestasCreadasEnTest.add('f_2026_respaldo_falla');

    const res = await correrMigracionEmpezar2027({
      crearRespaldoFn: async () => ({ success: false, error: 'Falla simulada de respaldo' }),
    });

    expect(res.success).toBe(false);
    expect(res.fallo).toBe('respaldo');

    const pSnap = await dbAdmin!.collection('presupuestos').doc('p_2026_respaldo_falla').get();
    const fSnap = await dbAdmin!.collection('fiestas').doc('f_2026_respaldo_falla').get();
    expect(pSnap.exists).toBe(true);
    expect(fSnap.exists).toBe(true);

    const migSnap = await dbAdmin!.collection('migraciones').doc('empezar-2027').get();
    expect(migSnap.data()?.estado).toBe('fallo');
    expect(notificacionesCreadas.some((n) => n.rolDestino === 'admin')).toBe(true);
  });

  it('borra 2026 sin plata y sus fiestas; protege cobros/histórica/muestra; prepara 2027 con contratos y es idempotente', async () => {
    const { dbAdmin } = await import('@/lib/firebase/server');

    const p2026Borrar = makePresupuesto({
      id: 'p_2026_borrar',
      clienteNombre: 'Ana 2026',
      eventoFecha: '2026-05-10',
    });
    const pSinFechaBorrar = makePresupuesto({
      id: 'p_sin_fecha_borrar',
      clienteNombre: 'Sin Fecha',
      eventoFecha: '',
    });
    const p2026ConCobro = makePresupuesto({
      id: 'p_2026_con_cobro',
      clienteNombre: 'Bruno Cobro',
      eventoFecha: '2026-09-20',
      pagosCliente: [
        {
          id: 'pago_1',
          fecha: '2026-04-01',
          monto: 20000,
          metodoPago: 'Efectivo',
          estadoPago: 'confirmado',
        },
      ],
    });
    const p2027ClubUruguay = makePresupuesto({
      id: 'p_2027_club',
      clienteNombre: 'Camila 2027 Club',
      eventoFecha: '2027-03-15',
      salonFiestas: 'Club Uruguay',
      estado: 'Enviado',
      leadId: 'cust_2027_1',
      ...({ tipoAjusteAnual: 'simple' } as any),
    });
    const p2027OtroSalon = makePresupuesto({
      id: 'p_2027_otro',
      clienteNombre: 'Diego 2027 Otro',
      eventoFecha: '2027-11-22',
      salonFiestas: 'Salón Jardín',
      estado: 'Borrador',
    });

    await writeData(
      'presupuestos.json',
      [p2026Borrar, pSinFechaBorrar, p2026ConCobro, p2027ClubUruguay, p2027OtroSalon],
      undefined,
      { skipAutoBackup: true },
    );

    await writeData(
      'customers.json',
      [
        {
          id: 'cust_2027_1',
          name: 'Camila 2027 Club',
          taxId: '4.123.456-7',
          address: 'Uruguay 1234',
          phone: '099777888',
          estadoCliente: 'Potencial',
        },
      ],
      undefined,
      { skipAutoBackup: true },
    );

    const historica: FiestaHistorica = {
      id: 'hist_2024_1',
      nombreEvento: 'Boda Histórica 2024',
      clienteNombre: 'Elena Histórica',
      anioOriginal: 2024,
      lugar: 'Club Uruguay',
      tipoFiesta: 'Boda',
      cantidadInvitados: 150,
      presupuestoTotalOriginal: 200000,
      detalleCostos: [],
      checklistBase: [],
      fechaCreacion: '2024-01-01T00:00:00.000Z',
    };
    await writeData('fiestas-historicas.json', [historica], undefined, { skipAutoBackup: true });

    const fiestasSeed: FiestaEnPlanificacion[] = [
      makeFiesta({ id: 'f_2026_borrar', presupuestoId: 'p_2026_borrar' }),
      makeFiesta({ id: 'f_2026_cobro', presupuestoId: 'p_2026_con_cobro' }),
      makeFiesta({ id: 'hist_2024_1', configuracion: { nombreEvento: 'Boda Histórica', fechaEvento: '2024-10-10' } }),
      makeFiesta({
        id: 'fiesta_muestra_auditor',
        esMuestra: true,
        configuracion: { nombreEvento: 'Muestra Auditor', fechaEvento: '2026-12-01' },
      }),
    ];
    for (const f of fiestasSeed) {
      fiestasCreadasEnTest.add(f.id);
      await writeData(`fiestas/${f.id}.json`, f, undefined, { skipAutoBackup: true });
    }

    const res = await correrMigracionEmpezar2027();

    expect(res.success).toBe(true);
    expect(res.yaCorrio).toBe(false);
    expect(res.presupuestosBorrados).toBe(2);
    expect(res.fiestasBorradas).toBe(1);
    expect(res.presupuestos2027).toBe(2);
    expect(res.fiestasCreadas).toBe(2);
    expect(res.contratosGenerados).toBe(2);
    expect(res.contratosSalonGenerados).toBe(1);
    expect(res.protegidos).toBe(1);

    // Verificar borrados en Firestore
    expect((await dbAdmin!.collection('presupuestos').doc('p_2026_borrar').get()).exists).toBe(false);
    expect((await dbAdmin!.collection('presupuestos').doc('p_sin_fecha_borrar').get()).exists).toBe(false);
    expect((await dbAdmin!.collection('fiestas').doc('f_2026_borrar').get()).exists).toBe(false);

    // Verificar protegidos intactos
    expect((await dbAdmin!.collection('presupuestos').doc('p_2026_con_cobro').get()).exists).toBe(true);
    expect((await dbAdmin!.collection('fiestas').doc('f_2026_cobro').get()).exists).toBe(true);
    expect((await dbAdmin!.collection('fiestas').doc('hist_2024_1').get()).exists).toBe(true);
    expect((await dbAdmin!.collection('fiestas').doc('fiesta_muestra_auditor').get()).exists).toBe(true);
    expect((await dbAdmin!.collection('fiestas_historicas').doc('hist_2024_1').get()).exists).toBe(true);

    // Verificar presupuestos 2027 Aceptado y sin tipoAjusteAnual
    const pClubSnap = await dbAdmin!.collection('presupuestos').doc('p_2027_club').get();
    const pOtroSnap = await dbAdmin!.collection('presupuestos').doc('p_2027_otro').get();
    expect(pClubSnap.data()?.estado).toBe('Aceptado');
    expect(pClubSnap.data()?.tipoAjusteAnual).toBeUndefined();
    expect(pOtroSnap.data()?.estado).toBe('Aceptado');
    expect(pOtroSnap.data()?.tipoAjusteAnual).toBeUndefined();

    // Verificar fiestas 2027 creadas con contratos
    const fiestasSnap = await dbAdmin!.collection('fiestas').get();
    const todasFiestas = fiestasSnap.docs.map((d) => d.data() as FiestaEnPlanificacion);
    const fClub = todasFiestas.find((f) => f.presupuestoId === 'p_2027_club');
    const fOtro = todasFiestas.find((f) => f.presupuestoId === 'p_2027_otro');

    expect(fClub).toBeDefined();
    expect(fOtro).toBeDefined();
    fiestasCreadasEnTest.add(fClub!.id);
    fiestasCreadasEnTest.add(fOtro!.id);

    expect(fClub!.estado).toBe('En Planificación');
    expect(fClub!.contratoServicioTexto).toContain('Camila 2027 Club');
    expect(fClub!.contratoServicioTexto).not.toContain('{{SENIA}}');
    expect(fClub!.contratoServicioTexto).toContain('__________________________');
    expect(fClub!.contratoSalonTexto).toContain('CONTRATO DE ARRENDAMIENTO DE SALÓN');
    expect(fClub!.contratoSalonTexto).toContain('Club Uruguay');
    expect(fClub!.contratoGenerado?.tipo).toBe('servicios');
    expect(fClub!.contratoFirmaInfo?.isSigned).not.toBe(true);
    expect(fClub!.firmaDigitalConstancia).toBeUndefined();

    expect(fOtro!.contratoServicioTexto).toContain('Diego 2027 Otro');
    expect(fOtro!.contratoSalonTexto).toBeUndefined();
    expect(fOtro!.contratoFirmaInfo?.isSigned).not.toBe(true);

    // Verificar aviso en Asistente AK
    expect(
      notificacionesCreadas.some(
        (n) => n.rolDestino === 'admin' && String(n.mensaje).includes('p_2026_con_cobro'),
      ),
    ).toBe(true);

    // Segunda ejecución: idempotente, no hace nada
    const res2 = await correrMigracionEmpezar2027();
    expect(res2).toEqual({ yaCorrio: true });
  });
});
