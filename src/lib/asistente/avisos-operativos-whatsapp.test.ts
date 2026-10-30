jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-service', () => ({ readDataConDetalle: jest.fn() }));
jest.mock('@/lib/generic-json-store', () => ({ mutarDocumentoConTransaccion: jest.fn() }));
jest.mock('./avisar-al-duenio', () => ({
  ...jest.requireActual('./avisar-al-duenio'), getAsistenteSettings: jest.fn(),
}));
jest.mock('@/lib/ia/reglas-de-la-ia', () => ({ getReglaParaTarea: jest.fn() }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: jest.fn() }));

import { readDataConDetalle } from '@/lib/data-service';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { getAsistenteSettings } from './avisar-al-duenio';
import { getReglaParaTarea } from '@/lib/ia/reglas-de-la-ia';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { enviarAvisosOperativosWhatsApp } from './avisos-operativos-whatsapp';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const ahora = new Date('2026-10-29T22:00:00Z');
const fiesta = {
  id: 'f1', estado: 'aceptada', configuracion: { fechaEvento: '2026-10-29', horaInicio: '18:00', horaFin: '22:00' },
  personalAsignado: [{ empleadoId: 'e1', rolId: 'coordinacion', eventSalary: 900 }],
} as FiestaEnPlanificacion;
const aviso = { clave: 'agente:vigilante_noche:f1:programa:2026-10-29-19', fiestaId: 'f1', tipoPropuesta: 'vigilante_noche' };
let registros: Record<string, any>;
const settings = {
  avisosProactivosActivos: true, whatsappDuenioHabilitado: true,
  numeroDuenio: '099123456', horarioNoMolestarInicio: 23, horarioNoMolestarFin: 8,
  numerosEquipo: [{ telefono: '099123456', rol: 'Dueño' }, { telefono: '099654321', rol: 'Coordinador' }],
};

beforeEach(() => {
  jest.clearAllMocks(); registros = {};
  process.env.META_WHATSAPP_TOKEN = 'token'; process.env.META_WHATSAPP_PHONE_ID = '123';
  (getReglaParaTarea as jest.Mock).mockResolvedValue('sola');
  (getAsistenteSettings as jest.Mock).mockResolvedValue(settings);
  (readDataConDetalle as jest.Mock).mockImplementation(async file => ({ huboFalla: false, valor: file === 'empleados.json'
    ? [{ id: 'e1', telefono: '099654321' }]
    : [{ id: 'coordinacion', nombre: 'Coordinador' }] }));
  (mutarDocumentoConTransaccion as jest.Mock).mockImplementation(async (_file, _empty, update) => {
    const next = update(registros); if (next) registros = next; return next;
  });
  (sendMetaWhatsAppMessage as jest.Mock).mockResolvedValue({ success: true, messageId: 'wamid-ok' });
});

afterEach(() => { delete process.env.META_WHATSAPP_TOKEN; delete process.env.META_WHATSAPP_PHONE_ID; });

it('sends only to authorized owner and assigned coordinator, once per topic/hour under concurrency', async () => {
  const results = await Promise.all([enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora), enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora)]);
  expect(results.reduce((sum, r) => sum + r.enviados, 0)).toBe(2);
  expect(sendMetaWhatsAppMessage).toHaveBeenCalledTimes(2);
  expect((sendMetaWhatsAppMessage as jest.Mock).mock.calls.map(([p]) => p.to).sort()).toEqual(['59899123456', '59899654321']);
  for (const [p] of (sendMetaWhatsAppMessage as jest.Mock).mock.calls) expect(p.text).not.toMatch(/900|salario|cuota|saldo/i);
  await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora);
  expect(sendMetaWhatsAppMessage).toHaveBeenCalledTimes(2);
});

it('never sends to a prospect, a non-assigned coordinator or an unauthorized configured owner', async () => {
  (getAsistenteSettings as jest.Mock).mockResolvedValue({ ...settings, numeroDuenio: '098000000', numerosEquipo: [] });
  const result = await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora);
  expect(result.enviados).toBe(0); expect(sendMetaWhatsAppMessage).not.toHaveBeenCalled();
  (getAsistenteSettings as jest.Mock).mockResolvedValue({ ...settings, numeroDuenio: '', numerosEquipo: settings.numerosEquipo.slice(1) });
  await enviarAvisosOperativosWhatsApp([aviso], [{ ...fiesta, personalAsignado: [] }], ahora);
  expect(sendMetaWhatsAppMessage).not.toHaveBeenCalled();
});

it('recognizes an authorized assigned coordinadora without allowing a non-assigned person', async () => {
  (getAsistenteSettings as jest.Mock).mockResolvedValue({ ...settings, numeroDuenio: '', numerosEquipo: [
    { telefono: '099654321', rol: 'Coordinadora' }, { telefono: '099111111', rol: 'Coordinadora' },
  ] });
  (readDataConDetalle as jest.Mock).mockImplementation(async file => ({ huboFalla: false, valor: file === 'empleados.json'
    ? [{ id: 'e1', telefono: '099654321' }, { id: 'e2', telefono: '099111111' }]
    : [{ id: 'coordinacion', nombre: 'Coordinadora de evento' }] }));
  expect((await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora)).enviados).toBe(1);
  expect(sendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);
  expect(sendMetaWhatsAppMessage).toHaveBeenCalledWith(expect.objectContaining({ to: '59899654321' }));
});

it('respects task asking/off, no-disturb, missing connection and read failures', async () => {
  for (const modo of ['preguntar', 'apagada']) {
    (getReglaParaTarea as jest.Mock).mockResolvedValue(modo);
    await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora);
  }
  (getReglaParaTarea as jest.Mock).mockResolvedValue('sola');
  (getAsistenteSettings as jest.Mock).mockResolvedValue({ ...settings, horarioNoMolestarInicio: 18 });
  await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora);
  (getAsistenteSettings as jest.Mock).mockResolvedValue(settings);
  delete process.env.META_WHATSAPP_TOKEN;
  await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora);
  process.env.META_WHATSAPP_TOKEN = 'token';
  (readDataConDetalle as jest.Mock).mockResolvedValue({ huboFalla: true, valor: [] });
  await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora);
  expect(sendMetaWhatsAppMessage).not.toHaveBeenCalled();
});

it('keeps an uncertain delivery reserved, but permits retry after a definite rejection', async () => {
  (sendMetaWhatsAppMessage as jest.Mock).mockResolvedValue({ success: false, delivery: 'uncertain' });
  expect((await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora)).inciertos).toBe(2);
  await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora);
  expect(sendMetaWhatsAppMessage).toHaveBeenCalledTimes(2);
  registros = {};
  (sendMetaWhatsAppMessage as jest.Mock).mockResolvedValue({ success: false, delivery: 'not_sent' });
  await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora);
  (sendMetaWhatsAppMessage as jest.Mock).mockResolvedValue({ success: true, messageId: 'wamid-retry' });
  expect((await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora)).enviados).toBe(2);
});

it('does not send after losing a transaction retry, for an expired alert, or outside the event', async () => {
  (mutarDocumentoConTransaccion as jest.Mock).mockImplementation(async (_file, _empty, update) => {
    const tentative = update({});
    update(tentative);
    return null;
  });
  await enviarAvisosOperativosWhatsApp([aviso], [fiesta], ahora);
  await enviarAvisosOperativosWhatsApp([{ ...aviso, clave: aviso.clave.replace('-19', '-18') }], [fiesta], ahora);
  await enviarAvisosOperativosWhatsApp([aviso], [{ ...fiesta, configuracion: { ...fiesta.configuracion, horaFin: '18:30' } }], ahora);
  expect(sendMetaWhatsAppMessage).not.toHaveBeenCalled();
});
