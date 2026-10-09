/**
 * Barrido de la pregunta 43 tras Codex, auditoría 81: dos caminos sin sesión que pasaban su
 * guardia con la llave y después llamaban a una función que volvía a pedir sesión.
 *
 * - Avisos de reunión desde la tarea automática: `getFiestas` pedía sesión y fallaba siempre.
 * - Mensaje de un prospecto nuevo por WhatsApp: `getCrmLeads`/`addCrmLead` pedían permiso de CRM,
 *   tiraban, y la conversación no se guardaba.
 *
 * Probado rompiéndolo: con `getFiestas` o `getCrmLeads` de vuelta, se pone en rojo.
 */
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => { throw new Error('Sesion no autorizada.'); }),
  hasAppSession: jest.fn(async () => false),
  requirePermiso: jest.fn(async () => ({ ok: false, error: 'Sesión no autorizada' })),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestas: jest.fn(async () => { throw new Error('Sesion no autorizada.'); }) }));
jest.mock('@/app/actions/crm', () => ({
  getCrmLeads: jest.fn(async () => { throw new Error('No autorizado'); }),
  addCrmLead: jest.fn(async () => ({ success: false, error: 'No autorizado' })),
}));
const base: Record<string, any> = {};
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (base[f] === undefined ? d : JSON.parse(JSON.stringify(base[f])))),
  writeData: jest.fn(async (f: string, v: any) => { base[f] = JSON.parse(JSON.stringify(v)); }),
  createDataItem: jest.fn(async () => undefined),
}));
const fiestas = jest.fn();
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: () => fiestas() }));
const avisos: any[] = [];
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async (d: any) => { avisos.push(d); return { success: true }; }) }));
const prospectos: any[] = [];
jest.mock('@/lib/crm/public-lead-persistence', () => ({
  upsertPublicCommercialLead: jest.fn(async (input: any) => { prospectos.push(input); return { lead: { id: 'lead_1' }, isNew: true }; }),
}));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: jest.fn(async () => ({ success: true })) }));

import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN, WHATSAPP_WEBHOOK_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';

beforeEach(() => {
  for (const k of Object.keys(base)) delete base[k];
  avisos.length = 0;
  prospectos.length = 0;
  process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
});

it('la tarea automática arma el aviso de la reunión de dentro de una hora', async () => {
  const enMediaHora = new Date(Date.now() + 30 * 60_000).toISOString();
  fiestas.mockResolvedValue([{ id: 'f1', estado: 'Confirmada', configuracion: { nombreEvento: 'Los 15 de Ana' }, reuniones: [{ fecha: enMediaHora, titulo: 'Degustación' }] }]);
  const { checkAndCreateReunionReminders } = await import('@/app/actions/notifications');
  const r = await checkAndCreateReunionReminders(WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
  expect(r.success).toBe(true);
  expect(r.created).toBeGreaterThan(0);
});

it('el primer mensaje de un prospecto por WhatsApp se guarda y queda en el CRM', async () => {
  base['whatsapp-config.json'] = { enabled: true, mode: 'manual', integrations: { createCrmLead: true } };
  const { processIncomingMessage } = await import('@/app/actions/whatsapp');
  const r = await processIncomingMessage('59899123456', 'Hola, quiero presupuesto', 'Ana', WHATSAPP_WEBHOOK_INTERNAL_TOKEN);
  expect(r.success).toBe(true);
  const convs = Object.entries(base).find(([k]) => /conversation/i.test(k))?.[1] as any[];
  expect(convs?.[0]?.messages?.[0]?.content).toBe('Hola, quiero presupuesto');
  expect(convs?.[0]?.leadId).toBe('lead_1');
  expect(prospectos[0]).toMatchObject({ phone: '59899123456' });
});
