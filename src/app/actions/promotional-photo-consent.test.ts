jest.mock('@/lib/generic-json-store', () => ({ mutarDocumento: jest.fn() }));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requirePermisoAlguno: jest.fn() }));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ getFiestaByIdRaw: jest.fn() }));
jest.mock('@/lib/asistente/comercial-borrador', () => ({ validarFotosPromocionalesAlEnviar: jest.fn() }));

import { mutarDocumento } from '@/lib/generic-json-store';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { verifySession } from '@/lib/auth/session-token';
import { getFiestaByIdRaw } from '@/lib/fiesta/get-fiesta-raw';
import { registrarPermisoFotoPromocional, revocarPermisoFotoPromocional } from './promotional-photo-consent';

const mutate = mutarDocumento as jest.Mock;
const requirePermission = requirePermisoAlguno as jest.Mock;
const session = verifySession as jest.Mock;
const getEvent = getFiestaByIdRaw as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  requirePermission.mockResolvedValue(undefined);
  session.mockResolvedValue({ success: true, user: { email: 'owner@example.test' } });
  getEvent.mockResolvedValue({ id: 'event-1', contratoFirmaInfo: { isSigned: true } });
  mutate.mockImplementation(async (_file, current, update) => update(current));
});

const validConsent = {
  eventId: 'event-1',
  authorized: true,
  grantedBy: 'owner',
  method: 'contract',
  evidenceReference: 'Contrato firmado v3, cláusula 12',
  contractVersion: 'contract-v3',
};

describe('photo promotional consent authorization', () => {
  it('rejects malformed runtime booleans and enum values without writing', async () => {
    const badBoolean = await registrarPermisoFotoPromocional({ ...validConsent, authorized: 'false' } as any);
    const badEnum = await registrarPermisoFotoPromocional({ ...validConsent, method: 'marketingContactConsent' } as any);
    expect(badBoolean.success).toBe(false);
    expect(badEnum.success).toBe(false);
    expect(mutate).not.toHaveBeenCalled();
  });

  it('requires an authorized app permission and authenticated actor', async () => {
    requirePermission.mockRejectedValueOnce(new Error('forbidden'));
    await expect(registrarPermisoFotoPromocional(validConsent as any)).rejects.toThrow('forbidden');
    requirePermission.mockResolvedValueOnce(undefined);
    session.mockResolvedValueOnce({ success: false });
    await expect(registrarPermisoFotoPromocional(validConsent as any)).resolves.toMatchObject({ success: false });
    expect(mutate).not.toHaveBeenCalled();
  });

  it('binds documentary authorization and revocation to a real event id', async () => {
    getEvent.mockResolvedValueOnce({ id: 'another-event', contratoFirmaInfo: { isSigned: true } });
    await expect(registrarPermisoFotoPromocional(validConsent as any)).resolves.toMatchObject({ success: false });
    getEvent.mockResolvedValueOnce({ id: 'event-1', contratoFirmaInfo: { isSigned: false } });
    await expect(registrarPermisoFotoPromocional(validConsent as any)).resolves.toMatchObject({ success: false });
    getEvent.mockResolvedValueOnce(null);
    await expect(revocarPermisoFotoPromocional('event-1')).resolves.toMatchObject({ success: false });
    expect(mutate).not.toHaveBeenCalled();
  });

  it('records a valid evidence-backed decision and permits an authenticated event revocation', async () => {
    await expect(registrarPermisoFotoPromocional(validConsent as any)).resolves.toEqual({ success: true });
    const storedConsent = mutate.mock.results[0].value;
    expect(mutate).toHaveBeenCalledWith('promotional-photo-consents.json', {}, expect.any(Function));
    getEvent.mockResolvedValue({ id: 'event-1' });
    await expect(revocarPermisoFotoPromocional('event-1')).resolves.toEqual({ success: true });
    expect(mutate).toHaveBeenCalledTimes(2);
    expect(storedConsent).toBeDefined();
  });
});
