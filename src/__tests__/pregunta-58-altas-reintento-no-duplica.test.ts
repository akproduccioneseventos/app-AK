/**
 * PREGUNTA 58 (13 de octubre de 2026): la respuesta se pierde, la persona vuelve a tocar "Guardar" y
 * se guarda dos veces. Aca, las altas que viven en una coleccion o en una lista propia.
 *
 * Pantallas tocadas: `/incidentes`, `/calendario`, `/empresa/salones`, `/alertas`,
 * `/settings/templates/invitaciones`, `/contabilidad/crm` (AddLeadDialog), `/proveedores/new`,
 * `/empleados/nuevo` y `/empresa/servicios/nuevo`.
 *
 * Se usan las acciones reales. La base de mentira devuelve COPIAS en cada lectura (como la de
 * verdad) y rechaza crear un id que ya existe.
 *
 * Se probo rompiendolo: sacando la comprobacion "ya esta con ese id" de cada accion, la prueba de
 * "misma identidad dos veces" de esa accion se pone en rojo.
 */
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true })),
  requirePermisoAlguno: jest.fn(async () => ({ ok: true })),
}));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: true, user: { userId: 'u1', perfil: 'admin' } })) }));
jest.mock('@/lib/server-cache', () => ({
  cachedFetch: jest.fn(async (_k: string, f: () => Promise<unknown>) => f()),
  cacheInvalidate: jest.fn(),
}));

const almacen: Record<string, any[]> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    await new Promise((r) => setTimeout(r, 2));
    return almacen[archivo] === undefined ? copia(porDefecto) : copia(almacen[archivo]);
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = copia(datos); }),
  createDataItem: jest.fn(async (archivo: string, _c: string, id: string, item: any) => {
    const lista = almacen[archivo] || [];
    if (lista.some((x: any) => x.id === id)) throw new Error('ya existe');
    almacen[archivo] = [...lista, copia({ ...item, id })];
  }),
  updateDataItem: jest.fn(async () => true),
  mutateDataItem: jest.fn(async () => null),
  deleteDataItem: jest.fn(async () => true),
}));
jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (archivo: string, cambiar: (l: any[]) => any[]) => {
    await new Promise((r) => setTimeout(r, 2));
    almacen[archivo] = copia(cambiar(copia(almacen[archivo] || [])));
  }),
}));
jest.mock('@/app/actions/google-workspace', () => ({ syncAppointmentToGoogleWorkspace: jest.fn(async () => undefined), syncFiestaToGoogleWorkspace: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestas: jest.fn(), getHistorialFiestas: jest.fn(), saveFiesta: jest.fn(), syncFiestaFromBudget: jest.fn() }));
jest.mock('@/lib/staff-agenda-data', () => ({ readActiveFiestasForStaffAgenda: jest.fn(async () => []) }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(), deleteFromStorage: jest.fn() }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => ({ success: true })) }));
jest.mock('@/app/actions/customers', () => ({ saveCustomer: jest.fn(), getCustomers: jest.fn() }));
jest.mock('@/app/actions/presupuestos', () => ({ addPagoToPresupuesto: jest.fn(), getPresupuestoById: jest.fn(), updatePresupuesto: jest.fn() }));
jest.mock('@/app/actions/invoices', () => ({ getInvoiceById: jest.fn(), saveInvoice: jest.fn() }));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: jest.fn(async () => []) }));
jest.mock('@/lib/crm/public-lead-persistence', () => ({ upsertPublicCommercialLead: jest.fn() }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/crm/crm-meeting', () => ({ scheduleCrmMeetingInternal: jest.fn() }));

import { createIncidente } from '@/app/actions/incidents';
import { createAppointment } from '@/app/actions/agenda';
import { saveSalon } from '@/app/actions/salones';
import { duplicateInvitationTemplate } from '@/app/actions/invitacion-digital-templates';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { addCrmLead } from '@/app/actions/crm';
import { saveProveedor } from '@/app/actions/proveedores';
import { saveEmpleado } from '@/app/actions/empleados';
import { saveServicioEmpresa } from '@/app/actions/servicios-empresa';

const AHORA = Date.now();
beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  delete process.env.AK_USE_LOCAL_JSON_ONLY;
});
const total = (archivo: string) => (almacen[archivo] || []).length;

describe('Incidente nuevo', () => {
  const dato = { titulo: 'Se corto la luz', descripcion: 'x', categoria: 'Otro', prioridad: 'Alta', estado: 'Abierto', responsable: 'Ana', fiestaId: 'f1' } as any;
  it('misma identidad dos veces = un solo incidente', async () => {
    const a = await createIncidente(dato, { idIntento: 'intento-inc-0001' });
    const b = await createIncidente(dato, { idIntento: 'intento-inc-0001' });
    expect(a.success && b.success).toBe(true);
    expect(total('incidentes.json')).toBe(1);
    expect(b.incidente?.id).toBe(a.incidente?.id);
  });
  it('identidad distinta = dos incidentes', async () => {
    await createIncidente(dato, { idIntento: 'intento-inc-0001' });
    await createIncidente(dato, { idIntento: 'intento-inc-0002' });
    expect(total('incidentes.json')).toBe(2);
  });
});

describe('Cita de agenda nueva', () => {
  const dato = { clienteNombre: 'Ana', clienteContacto: '099123456', eventoTipo: 'Boda', fechaHora: '2027-03-01T15:00:00.000Z', lugar: 'Oficina' } as any;
  const archivo = () => Object.keys(almacen).find((k) => /cita|appointment|agenda/i.test(k)) || '';
  it('misma identidad dos veces = una sola cita', async () => {
    const a = await createAppointment(dato, { idIntento: 'intento-cita-001' });
    const b = await createAppointment(dato, { idIntento: 'intento-cita-001' });
    expect(a.success && b.success).toBe(true);
    expect(almacen[archivo()]).toHaveLength(1);
    expect(b.appointment?.id).toBe(a.appointment?.id);
  });
  it('identidad distinta = dos citas', async () => {
    await createAppointment(dato, { idIntento: 'intento-cita-001' });
    await createAppointment(dato, { idIntento: 'intento-cita-002' });
    expect(almacen[archivo()]).toHaveLength(2);
  });
});

describe('Salon nuevo (solo el alta, no los pagos)', () => {
  const dato = { nombre: 'Salon Central', capacidad: 120 } as any;
  it('misma identidad dos veces = un solo salon', async () => {
    const a = await saveSalon({ ...dato }, { idIntento: 'intento-salon-01' });
    const b = await saveSalon({ ...dato }, { idIntento: 'intento-salon-01' });
    expect(a.success && b.success).toBe(true);
    expect(total('salones.json')).toBe(1);
    expect(b.salon?.id).toBe(a.salon?.id);
  });
  it('identidad distinta = dos salones', async () => {
    await saveSalon({ ...dato }, { idIntento: 'intento-salon-01' });
    await saveSalon({ ...dato }, { idIntento: 'intento-salon-02' });
    expect(total('salones.json')).toBe(2);
  });
});

describe('Plantilla de invitacion duplicada', () => {
  it('misma identidad dos veces = una sola copia', async () => {
    const lista = (await import('@/app/actions/invitacion-digital-templates')).getInvitationTemplates;
    const base = (await lista())[0];
    const a = await duplicateInvitationTemplate(base.id, { idIntento: 'intento-copia-01' });
    const b = await duplicateInvitationTemplate(base.id, { idIntento: 'intento-copia-01' });
    expect(a.success && b.success).toBe(true);
    expect(b.newTemplate?.id).toBe(a.newTemplate?.id);
    const guardadas = (almacen[Object.keys(almacen).find((k) => /template/i.test(k)) || ''] || []);
    expect(guardadas.filter((t: any) => String(t.name).startsWith('[COPIA]'))).toHaveLength(1);
  });
  it('identidad distinta = dos copias', async () => {
    const base = (await (await import('@/app/actions/invitacion-digital-templates')).getInvitationTemplates())[0];
    await duplicateInvitationTemplate(base.id, { idIntento: 'intento-copia-01' });
    await duplicateInvitationTemplate(base.id, { idIntento: 'intento-copia-02' });
    const guardadas = (almacen[Object.keys(almacen).find((k) => /template/i.test(k)) || ''] || []);
    expect(guardadas.filter((t: any) => String(t.name).startsWith('[COPIA]'))).toHaveLength(2);
  });
});

describe('Aviso programado manual (/alertas)', () => {
  const aviso = { targetType: 'cliente', targetId: 'f1', targetName: 'Ana', targetPhone: '099123456', templateType: 'personalizado', messageText: 'Hola', scheduledAt: new Date(AHORA).toISOString(), status: 'pendiente', sendingMode: 'manual_click', fiestaId: 'f1' } as any;
  it('misma identidad dos veces = un solo aviso', async () => {
    const a = await saveScheduledMessage(aviso, undefined, { idEstable: 'msg_intento-aviso-01' });
    const b = await saveScheduledMessage(aviso, undefined, { idEstable: 'msg_intento-aviso-01' });
    expect(a.success && b.success).toBe(true);
    expect(total('scheduled-messages.json')).toBe(1);
  });
  it('identidad distinta = dos avisos', async () => {
    await saveScheduledMessage(aviso, undefined, { idEstable: 'msg_intento-aviso-01' });
    await saveScheduledMessage(aviso, undefined, { idEstable: 'msg_intento-aviso-02' });
    expect(total('scheduled-messages.json')).toBe(2);
  });
});

describe('Error falso despues de guardar: el reintento es exito, no "ya existe"', () => {
  it('prospecto CRM', async () => {
    const lead = { name: 'Maria Gonzalez', phone: '099111222', partyType: 'Boda' } as any;
    const a = await addCrmLead(lead, { idIntento: 'intento-lead-001' });
    const b = await addCrmLead(lead, { idIntento: 'intento-lead-001' });
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(b.lead?.id).toBe(a.lead?.id);
    expect(total('crm-leads.json')).toBe(1);
  });
  it('prospecto CRM: otra persona con el mismo telefono sigue siendo "ya existe"', async () => {
    const lead = { name: 'Maria Gonzalez', phone: '099111222', partyType: 'Boda' } as any;
    await addCrmLead(lead, { idIntento: 'intento-lead-001' });
    const otro = await addCrmLead({ ...lead, name: 'Pedro Suarez' }, { idIntento: 'intento-lead-002' });
    expect(otro.success).toBe(false);
  });
  it('proveedor', async () => {
    const dato = { tipo: 'Proveedor', nombre: 'Juan', nombreEmpresa: 'Sonido Uno', servicioPrincipal: 'Sonido' } as any;
    const a = await saveProveedor(dato, { idIntento: 'intento-prov-001' });
    const b = await saveProveedor(dato, { idIntento: 'intento-prov-001' });
    expect(a.success && b.success).toBe(true);
    expect(b.id).toBe(a.id);
    expect(total('proveedores.json')).toBe(1);
    const otro = await saveProveedor(dato, { idIntento: 'intento-prov-002' });
    expect(otro.success).toBe(false);
  });
  it('empleado', async () => {
    const dato = { nombre: 'Lucia Mora', rolIds: [] } as any;
    const a = await saveEmpleado(dato, { idIntento: 'intento-emp-0001' });
    const b = await saveEmpleado({ ...dato }, { idIntento: 'intento-emp-0001' });
    expect(a.success && b.success).toBe(true);
    expect(b.id).toBe(a.id);
    expect(total('empleados.json')).toBe(1);
    const otro = await saveEmpleado({ ...dato }, { idIntento: 'intento-emp-0002' });
    expect(otro.success).toBe(false);
  });
  it('servicio del catalogo', async () => {
    const dato = { nombre: 'Barra libre', categoria: 'Bebidas', tipoItem: 'Servicio' } as any;
    const a = await saveServicioEmpresa({ ...dato }, { idIntento: 'intento-serv-001' });
    const b = await saveServicioEmpresa({ ...dato }, { idIntento: 'intento-serv-001' });
    expect(a.success && b.success).toBe(true);
    expect(b.id).toBe(a.id);
    expect(total('servicios-empresa.json')).toBe(1);
    const otro = await saveServicioEmpresa({ ...dato }, { idIntento: 'intento-serv-002' });
    expect(otro.success).toBe(false);
  });
});
