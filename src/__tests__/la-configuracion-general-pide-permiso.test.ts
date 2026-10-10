/**
 * Auditoria 86 (Codex): las acciones que guardan configuracion GENERAL de la empresa
 * (datos de la empresa, WhatsApp, roles, promos, credenciales de redes, flags) pedian solo
 * sesion, y el personal y el operador tambien tienen sesion. Este control las recorre todas con
 * un usuario de perfil "personal" y exige que ninguna escriba. Despues prueba un perfil que si
 * corresponde por cada grupo de permisos.
 */
const mockWriteData = jest.fn();
const mockReadData = jest.fn();
const mockVerifySession = jest.fn();

jest.mock('@/lib/data-service', () => ({
  readData: (...a: unknown[]) => mockReadData(...a),
  writeData: (...a: unknown[]) => mockWriteData(...a),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: (...a: unknown[]) => mockVerifySession(...a),
}));
jest.mock('@/lib/firebase/server', () => ({}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn(), revalidateTag: jest.fn() }));

import * as settings from '@/app/actions/settings';
import * as whatsapp from '@/app/actions/whatsapp';
import * as copilot from '@/app/actions/simulador-copilot';
import * as seo from '@/app/actions/seo-posicionamiento';
import * as flags from '@/app/actions/feature-flags';
import * as roles from '@/app/actions/roles';
import * as social from '@/app/actions/social-connections';
import * as promos from '@/app/actions/promos';
import * as socialAdmin from '@/app/actions/social-admin';
import * as landing from '@/app/actions/landing-editor';
import * as publico from '@/app/actions/contenido-publico';
import * as invitacion from '@/app/actions/invitacion-config';

const sesion = (perfil: string, role = 'user') => ({
  success: true,
  user: { userId: 'u1', role, perfil },
});

type Accion = [string, (...a: any[]) => Promise<unknown>, unknown[]];
const X = {} as any;

const todas: Accion[] = [
  ['saveCompanyInfo', settings.saveCompanyInfo, [X]],
  ['saveWhatsAppSettings', settings.saveWhatsAppSettings, [X]],
  ['saveWhatsAppTemplates', settings.saveWhatsAppTemplates, [X]],
  ['saveAiAssistantSettings', settings.saveAiAssistantSettings, [X]],
  ['saveAjustesLlegadaPersonal', settings.saveAjustesLlegadaPersonal, [X]],
  ['saveInvoiceTemplateSettings', settings.saveInvoiceTemplateSettings, [X]],
  ['saveContractTemplate', settings.saveContractTemplate, ['texto']],
  ['deleteContractTemplate', settings.deleteContractTemplate, ['t1']],
  ['saveBudgetDisplaySettings', settings.saveBudgetDisplaySettings, [X]],
  ['saveContractSettings', settings.saveContractSettings, [X]],
  ['saveWhatsAppConfig', whatsapp.saveWhatsAppConfig, [X]],
  ['saveCopilotConfig', copilot.saveCopilotConfig, [X]],
  ['guardarGoogleSiteVerificationAction', seo.guardarGoogleSiteVerificationAction, ['abc']],
  ['updateDefaultTier', flags.updateDefaultTier, ['basic']],
  ['updateGlobalOverride', flags.updateGlobalOverride, ['x', true]],
  ['setEventTier', flags.setEventTier, ['f1', 'basic']],
  ['setEventModuleOverride', flags.setEventModuleOverride, ['f1', 'x', true]],
  ['saveRol', roles.saveRol, [{ nombre: 'Rol' }]],
  ['deleteRol', roles.deleteRol, ['r1']],
  ['saveWhatsAppNumber', social.saveWhatsAppNumber, ['099123456']],
  ['saveSocialLink', social.saveSocialLink, ['instagram', 'https://x.test']],
  ['disconnectSocialPlatform', social.disconnectSocialPlatform, ['instagram']],
  ['saveMetaPublishingCredentials', social.saveMetaPublishingCredentials, [{}]],
  ['saveSocialCredentials', social.saveSocialCredentials, ['instagram', {}]],
  ['saveUnifiedGatewaySettings', social.saveUnifiedGatewaySettings, [{}]],
  ['savePromo', promos.savePromo, [X]],
  ['deletePromo', promos.deletePromo, ['p1']],
  ['togglePromo', promos.togglePromo, ['p1']],
  ['saveSocialGlobalSettings', socialAdmin.saveSocialGlobalSettings, [X]],
  ['saveLandingSettings', landing.saveLandingSettings, [X]],
  ['savePresentacionLedSettings', publico.savePresentacionLedSettings, [X]],
  ['saveCatalogoSettings', publico.saveCatalogoSettings, ['x', X]],
  ['saveInvitacionConfig', invitacion.saveInvitacionConfig, ['f1', X]],
];

/** Rechazada POR PERMISO: no alcanza con que falle, el motivo tiene que ser el acceso. */
async function rechazada(fn: Accion[1], args: unknown[]): Promise<boolean> {
  const permiso = /no tiene acceso/i;
  try {
    const r: any = await fn(...args);
    return r?.success === false && permiso.test(String(r?.error ?? r?.mensaje ?? ''));
  } catch (e: any) {
    return permiso.test(String(e?.message ?? ''));
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  mockReadData.mockResolvedValue({});
  mockWriteData.mockResolvedValue(undefined);
});

describe('la configuracion general pide permiso, no solo sesion', () => {
  test.each(todas)('%s: el personal con sesion es rechazado y no escribe', async (_n, fn, args) => {
    mockVerifySession.mockResolvedValue(sesion('personal'));
    expect(await rechazada(fn, args)).toBe(true);
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  test.each(todas)('%s: el operador sin acceso no escribe cuando no le corresponde', async (nombre, fn, args) => {
    mockVerifySession.mockResolvedValue(sesion('operador'));
    const puedeOrganizacion = nombre === 'saveInvitacionConfig';
    if (puedeOrganizacion) return;
    expect(await rechazada(fn, args)).toBe(true);
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  test('administracion: el dueno guarda los ajustes de WhatsApp', async () => {
    mockVerifySession.mockResolvedValue(sesion('dueno', 'admin'));
    const r = await settings.saveWhatsAppSettings({} as any);
    expect(r.success).toBe(true);
    expect(mockWriteData).toHaveBeenCalled();
  });

  test('administracion: la secretaria NO guarda los ajustes de WhatsApp', async () => {
    mockVerifySession.mockResolvedValue(sesion('secretaria'));
    const r = await settings.saveWhatsAppSettings({} as any);
    expect(r.success).toBe(false);
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  test('contabilidad: la secretaria guarda los ajustes de contrato', async () => {
    mockVerifySession.mockResolvedValue(sesion('secretaria'));
    const r = await settings.saveContractSettings({} as any);
    expect(r.success).toBe(true);
    expect(mockWriteData).toHaveBeenCalled();
  });

  test('crm: la secretaria guarda la configuracion social global', async () => {
    mockVerifySession.mockResolvedValue(sesion('secretaria'));
    const r = await socialAdmin.saveSocialGlobalSettings({} as any);
    expect(r.success).toBe(true);
    expect(mockWriteData).toHaveBeenCalled();
  });

  test('organizacion: el operador guarda la invitacion de una fiesta', async () => {
    mockVerifySession.mockResolvedValue(sesion('operador'));
    const r = await invitacion.saveInvitacionConfig('f1', {} as any);
    expect(r.success).toBe(true);
    expect(mockWriteData).toHaveBeenCalled();
  });
});
