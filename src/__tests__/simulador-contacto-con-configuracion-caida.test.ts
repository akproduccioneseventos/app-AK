/**
 * Orden 126 (CONTACT75): el WhatsApp que recibe el prospecto del simulador es el OFICIAL de AK
 * aunque falle la lectura de la configuracion. Nunca un numero de ejemplo.
 *
 * Se simulan los lectores de configuracion; el bootstrap y la agenda son los REALES.
 */
const mockSocial = jest.fn();
jest.mock('@/app/actions/social-connections', () => ({ getSocialConnectionsPublicas: (...a: any[]) => mockSocial(...a) }));
jest.mock('@/app/actions/armado-rapido', () => ({ getArmadoRapidoConfig: jest.fn(async () => null) }));
jest.mock('@/app/actions/menus-catering', () => ({ getMenusPublicos: jest.fn(async () => []) }));
jest.mock('@/app/actions/servicios-empresa', () => ({ getServiciosEmpresaPublicos: jest.fn(async () => []) }));
jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: jest.fn(async () => null),
  getInvoiceTemplateSettings: jest.fn(async () => null),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn(async () => undefined) }));
const archivos: Record<string, any> = {};
let leerLeadsFalla = false;
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, def: any) => {
    if (f === 'crm-leads.json' && leerLeadsFalla) throw new Error('base caida');
    return f in archivos ? JSON.parse(JSON.stringify(archivos[f])) : def;
  }),
  writeData: jest.fn(async (f: string, d: any) => { archivos[f] = JSON.parse(JSON.stringify(d)); }),
  mutateDataItem: jest.fn(),
}));

import { getPublicSimulatorBootstrap } from '@/app/actions/public-simulator-bootstrap';
import { bookAppointmentFromSimulator, getSimulatorAvailableSlots } from '@/app/actions/simulator-agenda';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

describe('el simulador da el WhatsApp oficial con la configuracion caida', () => {
  beforeEach(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    mockSocial.mockReset();
    leerLeadsFalla = false;
    for (const k of Object.keys(archivos)) delete archivos[k];
  });

  it('la lectura de conexiones TIRA: va el numero oficial', async () => {
    mockSocial.mockRejectedValue(new Error('base caida'));
    const r = await getPublicSimulatorBootstrap();
    expect(r.whatsappNumber).toBe(AK_WHATSAPP_NUMBER);
  });

  it('la lectura devuelve vacio: va el numero oficial', async () => {
    mockSocial.mockResolvedValue([]);
    expect((await getPublicSimulatorBootstrap()).whatsappNumber).toBe(AK_WHATSAPP_NUMBER);
  });

  it('la lectura devuelve nada (null): va el numero oficial', async () => {
    mockSocial.mockResolvedValue(null);
    expect((await getPublicSimulatorBootstrap()).whatsappNumber).toBe(AK_WHATSAPP_NUMBER);
  });

  it('una conexion de WhatsApp NO conectada no se usa: va el numero oficial', async () => {
    mockSocial.mockResolvedValue([{ platform: 'WhatsApp', isConnected: false, phoneNumber: '59899999999' }]);
    expect((await getPublicSimulatorBootstrap()).whatsappNumber).toBe(AK_WHATSAPP_NUMBER);
  });

  it('una conexion sin numero cargado: va el numero oficial', async () => {
    mockSocial.mockResolvedValue([{ platform: 'WhatsApp', isConnected: true, phoneNumber: '' }]);
    expect((await getPublicSimulatorBootstrap()).whatsappNumber).toBe(AK_WHATSAPP_NUMBER);
  });

  it('control: una conexion valida y conectada del negocio se conserva', async () => {
    mockSocial.mockResolvedValue([{ platform: 'WhatsApp', isConnected: true, phoneNumber: '59898111222' }]);
    expect((await getPublicSimulatorBootstrap()).whatsappNumber).toBe('59898111222');
  });

  it('la agenda del simulador devuelve el enlace oficial, tambien con la lectura del prospecto caida', async () => {
    leerLeadsFalla = true;
    const { days } = await getSimulatorAvailableSlots();
    const slot = days.flatMap((d) => d.slots)[0];
    expect(slot).toBeTruthy();
    const r = await bookAppointmentFromSimulator({
      clienteNombre: 'Ana Perez',
      clienteContacto: '099123456',
      fechaHora: slot.datetimeIso,
      presupuestoId: 'pres_x',
    });
    expect(r.success).toBe(true);
    expect(r.whatsappUrl).toMatch(new RegExp(`^https://wa\\.me/${AK_WHATSAPP_NUMBER}\\?text=`));
  });
});
