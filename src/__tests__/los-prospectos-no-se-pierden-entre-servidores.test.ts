/**
 * MATAFUEGO — Prospectos, clientes, reuniones de agenda y mensajes programados no se
 * pierden entre servidores ni con dos operaciones a la vez (Orden 82).
 *
 * Encontrado el 23 de septiembre de 2026:
 * Guardar una lista entera leída un rato antes pisaba o borraba lo que otro servidor
 * guardó mientras tanto. Las operaciones ahora tocan UN solo registro a la vez
 * (`createDataItem`, `mutateDataItem`, `deleteDataItem`).
 *
 * La base de mentira devuelve copias y tarda en guardar para simular la concurrencia
 * real de varios servidores.
 */

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' }),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true }),
  requireAdminSession: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/whatsapp-automation-engine', () => ({
  triggerWhatsAppAutomation: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/google-workspace', () => ({
  syncAppointmentToGoogleWorkspace: jest.fn().mockResolvedValue(undefined),
  syncFiestaToGoogleWorkspace: jest.fn().mockResolvedValue(undefined),
  ensureFreshGoogleAccount: jest.fn().mockResolvedValue(null),
  hasGoogleContactsScope: jest.fn().mockReturnValue(false),
  upsertGoogleContact: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
  authAdmin: null,
  storageAdmin: null,
}));

jest.mock('@/lib/firebase/firestore', () => ({
  db: null,
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn().mockResolvedValue('https://storage.mock/file.pdf'),
  deleteFromStorage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  createNewFiestaForCustomer: jest.fn().mockResolvedValue({ success: true }),
  saveFiesta: jest.fn().mockResolvedValue({ success: true }),
  syncFiestaFromBudget: jest.fn().mockResolvedValue({ success: true }),
  getFiestas: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn().mockResolvedValue([]),
}));

const almacen: Record<string, any[]> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((seguir) => setTimeout(seguir, 15));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return guardado === undefined ? porDefecto : copia(guardado);
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    await esperar();
    almacen[archivo] = copia(datos);
  }),
  createDataItem: jest.fn(async (archivo: string, _coleccion: string, id: string, item: any) => {
    await esperar();
    const lista = almacen[archivo] || [];
    if (lista.some((x: any) => x.id === id)) {
      throw new Error(`Item ${id} ya existe en ${archivo}`);
    }
    lista.push(copia(item));
    almacen[archivo] = lista;
  }),
  mutateDataItem: jest.fn(async (archivo: string, _coleccion: string, id: string, cambiar: (x: any) => any) => {
    await esperar();
    const lista = almacen[archivo] || [];
    const indice = lista.findIndex((p: any) => p.id === id);
    if (indice === -1) return null;
    const nuevo = cambiar(copia(lista[indice]));
    if (!nuevo) return null;
    lista[indice] = copia(nuevo);
    almacen[archivo] = lista;
    return nuevo;
  }),
  deleteDataItem: jest.fn(async (archivo: string, _coleccion: string, id: string) => {
    await esperar();
    const lista = almacen[archivo] || [];
    const indice = lista.findIndex((p: any) => p.id === id);
    if (indice === -1) return false;
    lista.splice(indice, 1);
    almacen[archivo] = lista;
    return true;
  }),
}));

import { verifySession } from '@/lib/auth/session-token';
import { addCrmLead, updateCrmLeadField, deleteCrmLead } from '@/app/actions/crm';
import { saveCustomer, deleteCustomer } from '@/app/actions/customers';
import { createAppointment, updateAppointmentStatus, updateAppointment } from '@/app/actions/agenda';
import { saveScheduledMessage, markMessageAsSent, rescheduleMessage, cancelScheduledMessage } from '@/app/actions/scheduled-messages';

describe('Orden 82 — Una lista vieja no borra lo que otro guardó entre servidores', () => {
  beforeEach(() => {
    for (const clave of Object.keys(almacen)) delete almacen[clave];
    (verifySession as jest.Mock).mockResolvedValue({
      success: true,
      user: { userId: 'admin', email: 'admin@ak.test', role: 'admin', perfil: 'dueno' },
    });
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
  });

  describe('Bloque 1 — Prospectos (crm-leads.json)', () => {
    it('dos creaciones de prospectos a la vez: quedan los dos', async () => {
      almacen['crm-leads.json'] = [];
      almacen['crm-stages.json'] = [{ id: 'stage-nuevo', name: 'Nuevo', order: 0 }];

      const [resA, resB] = await Promise.all([
        addCrmLead({ name: 'Maria Gomez', phone: '099111222', partyType: '15 Años' }),
        addCrmLead({ name: 'Carlos Rodriguez', phone: '098333444', partyType: 'Boda' }),
      ]);

      expect(resA.success).toBe(true);
      expect(resB.success).toBe(true);

      const guardados = almacen['crm-leads.json'] || [];
      expect(guardados).toHaveLength(2);
      expect(guardados.some((l) => l.name === 'Maria Gomez')).toBe(true);
      expect(guardados.some((l) => l.name === 'Carlos Rodriguez')).toBe(true);
    });

    it('cambiar un prospecto mientras otro crea: queda el cambio Y el creado', async () => {
      const existente = {
        id: 'lead_existente_1',
        name: 'Ana Perez',
        phone: '099555666',
        currentStageId: 'stage-nuevo',
        estimatedBudget: 30000,
        timeline: [],
      };
      almacen['crm-leads.json'] = [copia(existente)];
      almacen['crm-stages.json'] = [{ id: 'stage-nuevo', name: 'Nuevo', order: 0 }];

      const [cambio, nuevo] = await Promise.all([
        updateCrmLeadField('lead_existente_1', { notes: 'Presupuesto ampliado por cliente' }),
        addCrmLead({ name: 'Lucas Silva', phone: '099777888', partyType: 'Cumpleaños' }),
      ]);

      expect(cambio.success).toBe(true);
      expect(nuevo.success).toBe(true);

      const guardados = almacen['crm-leads.json'] || [];
      expect(guardados).toHaveLength(2);
      const modificado = guardados.find((l) => l.id === 'lead_existente_1');
      expect(modificado?.notes).toBe('Presupuesto ampliado por cliente');
      expect(guardados.some((l) => l.name === 'Lucas Silva')).toBe(true);
    });

    it('borrar un prospecto no borra otro creado mientras tanto', async () => {
      const aBorrar = {
        id: 'lead_a_borrar',
        name: 'Prospecto Descartado',
        phone: '099000111',
        currentStageId: 'stage-nuevo',
        timeline: [],
      };
      almacen['crm-leads.json'] = [copia(aBorrar)];
      almacen['crm-stages.json'] = [{ id: 'stage-nuevo', name: 'Nuevo', order: 0 }];

      const [borrado, nuevo] = await Promise.all([
        deleteCrmLead('lead_a_borrar'),
        addCrmLead({ name: 'Valeria Morales', phone: '098222333', partyType: 'Empresarial' }),
      ]);

      expect(borrado.success).toBe(true);
      expect(nuevo.success).toBe(true);

      const guardados = almacen['crm-leads.json'] || [];
      expect(guardados).toHaveLength(1);
      expect(guardados[0].name).toBe('Valeria Morales');
      expect(guardados.some((l) => l.id === 'lead_a_borrar')).toBe(false);
    });
  });

  describe('Bloque 2 — Clientes (customers.json)', () => {
    it('dos creaciones de clientes a la vez: quedan los dos', async () => {
      almacen['customers.json'] = [];

      const [resA, resB] = await Promise.all([
        saveCustomer({ name: 'Empresa Alfa', phone: '099123456', estadoCliente: 'Actual' }),
        saveCustomer({ name: 'Empresa Beta', phone: '099654321', estadoCliente: 'Actual' }),
      ]);

      expect(resA.success).toBe(true);
      expect(resB.success).toBe(true);

      const guardados = almacen['customers.json'] || [];
      expect(guardados).toHaveLength(2);
      expect(guardados.some((c) => c.name === 'Empresa Alfa')).toBe(true);
      expect(guardados.some((c) => c.name === 'Empresa Beta')).toBe(true);
    });

    it('modificar un cliente mientras otro crea: se conservan ambos', async () => {
      const existente = {
        id: 'cust_existente_1',
        name: 'Cliente Original',
        phone: '099111333',
        estadoCliente: 'Actual',
        notes: 'Nota vieja',
      };
      almacen['customers.json'] = [copia(existente)];

      const [modificado, nuevo] = await Promise.all([
        saveCustomer({ id: 'cust_existente_1', name: 'Cliente Renombrado', notes: 'Nota nueva' } as any),
        saveCustomer({ name: 'Cliente Nuevo', phone: '099444555', estadoCliente: 'Actual' }),
      ]);

      expect(modificado.success).toBe(true);
      expect(nuevo.success).toBe(true);

      const guardados = almacen['customers.json'] || [];
      expect(guardados).toHaveLength(2);
      expect(guardados.find((c) => c.id === 'cust_existente_1')?.name).toBe('Cliente Renombrado');
      expect(guardados.some((c) => c.name === 'Cliente Nuevo')).toBe(true);
    });

    it('borrar un cliente no borra otro creado mientras tanto', async () => {
      const aEliminar = {
        id: 'cust_eliminar_1',
        name: 'Cliente Para Borrar',
        phone: '099888999',
        estadoCliente: 'Inactivo',
      };
      almacen['customers.json'] = [copia(aEliminar)];

      const [borrado, nuevo] = await Promise.all([
        deleteCustomer('cust_eliminar_1'),
        saveCustomer({ name: 'Cliente Fresco', phone: '099777111', estadoCliente: 'Actual' }),
      ]);

      expect(borrado.success).toBe(true);
      expect(nuevo.success).toBe(true);

      const guardados = almacen['customers.json'] || [];
      expect(guardados).toHaveLength(1);
      expect(guardados[0].name).toBe('Cliente Fresco');
      expect(guardados.some((c) => c.id === 'cust_eliminar_1')).toBe(false);
    });
  });

  describe('Bloque 3 — Reuniones de la agenda (crm-appointments.json)', () => {
    it('dos creaciones de citas a la vez: quedan las dos', async () => {
      almacen['crm-appointments.json'] = [];

      const [citaA, citaB] = await Promise.all([
        createAppointment({
          clienteNombre: 'Sonia Suarez',
          clienteContacto: '099222444',
          fechaHora: '2026-10-10T15:00:00.000Z',
          lugar: 'Oficina Central',
        }),
        createAppointment({
          clienteNombre: 'Martin Mendez',
          clienteContacto: '099333555',
          fechaHora: '2026-10-10T17:00:00.000Z',
          lugar: 'Salón Club Uruguay',
        }),
      ]);

      expect(citaA.success).toBe(true);
      expect(citaB.success).toBe(true);

      const guardadas = almacen['crm-appointments.json'] || [];
      expect(guardadas).toHaveLength(2);
      expect(guardadas.some((c) => c.clienteNombre === 'Sonia Suarez')).toBe(true);
      expect(guardadas.some((c) => c.clienteNombre === 'Martin Mendez')).toBe(true);
    });

    it('confirmar una cita mientras otra se agenda: quedan ambos cambios', async () => {
      const existente = {
        id: 'cita_previa_1',
        clienteNombre: 'Laura Lopez',
        clienteContacto: '099666777',
        fechaHora: '2026-10-12T18:00:00.000Z',
        estado: 'Agendada',
      };
      almacen['crm-appointments.json'] = [copia(existente)];

      const [confirmacion, nueva] = await Promise.all([
        updateAppointmentStatus('cita_previa_1', 'Confirmada'),
        createAppointment({
          clienteNombre: 'Pablo Pintos',
          clienteContacto: '099888111',
          fechaHora: '2026-10-14T11:00:00.000Z',
        }),
      ]);

      expect(confirmacion.success).toBe(true);
      expect(nueva.success).toBe(true);

      const guardadas = almacen['crm-appointments.json'] || [];
      expect(guardadas).toHaveLength(2);
      expect(guardadas.find((c) => c.id === 'cita_previa_1')?.estado).toBe('Confirmada');
      expect(guardadas.some((c) => c.clienteNombre === 'Pablo Pintos')).toBe(true);
    });

    it('actualizar notas de una cita mientras se agenda otra: se preservan ambos', async () => {
      const existente = {
        id: 'cita_notas_1',
        clienteNombre: 'Camila Castro',
        clienteContacto: '099999000',
        fechaHora: '2026-10-20T19:00:00.000Z',
        estado: 'Agendada',
        notas: 'Notas iniciales',
      };
      almacen['crm-appointments.json'] = [copia(existente)];

      const [actualizacion, nueva] = await Promise.all([
        updateAppointment('cita_notas_1', { notas: 'Se amplió el presupuesto solicitado' }),
        createAppointment({
          clienteNombre: 'Esteban Etcheverry',
          clienteContacto: '099111999',
          fechaHora: '2026-10-22T16:00:00.000Z',
        }),
      ]);

      expect(actualizacion.success).toBe(true);
      expect(nueva.success).toBe(true);

      const guardadas = almacen['crm-appointments.json'] || [];
      expect(guardadas).toHaveLength(2);
      expect(guardadas.find((c) => c.id === 'cita_notas_1')?.notas).toBe('Se amplió el presupuesto solicitado');
      expect(guardadas.some((c) => c.clienteNombre === 'Esteban Etcheverry')).toBe(true);
    });
  });

  describe('Bloque 4 — Mensajes programados (scheduled-messages.json)', () => {
    it('dos mensajes programados a la vez: quedan los dos', async () => {
      almacen['scheduled-messages.json'] = [];

      const [resA, resB] = await Promise.all([
        saveScheduledMessage({
          targetPhone: '099123123',
          targetName: 'Cliente Uno',
          scheduledAt: '2026-10-01T10:00:00.000Z',
          messageText: 'Recordatorio de seña para tu evento',
          status: 'pendiente',
        }),
        saveScheduledMessage({
          targetPhone: '099456456',
          targetName: 'Cliente Dos',
          scheduledAt: '2026-10-01T12:00:00.000Z',
          messageText: 'Bienvenida a AK Producciones',
          status: 'pendiente',
        }),
      ]);

      expect(resA.success).toBe(true);
      expect(resB.success).toBe(true);

      const guardados = almacen['scheduled-messages.json'] || [];
      expect(guardados).toHaveLength(2);
      expect(guardados.some((m) => m.targetName === 'Cliente Uno')).toBe(true);
      expect(guardados.some((m) => m.targetName === 'Cliente Dos')).toBe(true);
    });

    it('marcar un mensaje como enviado mientras se programa otro: quedan los dos', async () => {
      const existente = {
        id: 'msg_existente_1',
        targetPhone: '099789789',
        targetName: 'Cliente Anterior',
        scheduledAt: '2026-10-02T14:00:00.000Z',
        messageText: 'Confirmación de reunión comercial',
        status: 'pendiente',
        createdAt: '2026-09-20T10:00:00.000Z',
      };
      almacen['scheduled-messages.json'] = [copia(existente)];

      const [envio, nuevo] = await Promise.all([
        markMessageAsSent('msg_existente_1', 'operador_juan'),
        saveScheduledMessage({
          targetPhone: '099999111',
          targetName: 'Cliente Reciente',
          scheduledAt: '2026-10-05T09:00:00.000Z',
          messageText: 'Aviso de degustación de catering',
          status: 'pendiente',
        }),
      ]);

      expect(envio.success).toBe(true);
      expect(nuevo.success).toBe(true);

      const guardados = almacen['scheduled-messages.json'] || [];
      expect(guardados).toHaveLength(2);
      const enviado = guardados.find((m) => m.id === 'msg_existente_1');
      expect(enviado?.status).toBe('enviado');
      expect(enviado?.sentBy).toBe('operador_juan');
      expect(guardados.some((m) => m.targetName === 'Cliente Reciente')).toBe(true);
    });

    it('reprogramar un mensaje mientras otro se cancela: no se pierden estados', async () => {
      const msg1 = {
        id: 'msg_para_reprogramar',
        targetPhone: '099111222',
        targetName: 'Cliente A',
        scheduledAt: '2026-10-03T10:00:00.000Z',
        messageText: 'Mensaje A',
        status: 'pendiente',
        createdAt: '2026-09-20T10:00:00.000Z',
      };
      const msg2 = {
        id: 'msg_para_cancelar',
        targetPhone: '099333444',
        targetName: 'Cliente B',
        scheduledAt: '2026-10-04T11:00:00.000Z',
        messageText: 'Mensaje B',
        status: 'pendiente',
        createdAt: '2026-09-20T10:00:00.000Z',
      };
      almacen['scheduled-messages.json'] = [copia(msg1), copia(msg2)];

      const [reprog, canc] = await Promise.all([
        rescheduleMessage('msg_para_reprogramar', '2026-10-15T15:00:00.000Z'),
        cancelScheduledMessage('msg_para_cancelar', 'Evento cancelado por el cliente'),
      ]);

      expect(reprog.success).toBe(true);
      expect(canc.success).toBe(true);

      const guardados = almacen['scheduled-messages.json'] || [];
      expect(guardados).toHaveLength(2);
      const r1 = guardados.find((m) => m.id === 'msg_para_reprogramar');
      const r2 = guardados.find((m) => m.id === 'msg_para_cancelar');
      expect(r1?.status).toBe('reprogramado');
      expect(r1?.rescheduledTo).toBe('2026-10-15T15:00:00.000Z');
      expect(r2?.status).toBe('cancelado');
      expect(r2?.cancelReason).toBe('Evento cancelado por el cliente');
    });
  });
});
