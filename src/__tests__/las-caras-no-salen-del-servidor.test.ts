/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/lib/firebase/modo-local', () => ({
  sinBaseDisponible: jest.fn(() => true),
  sinDepositoDisponible: jest.fn(() => true),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
}));

jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: { firestore: { FieldValue: { serverTimestamp: jest.fn(), increment: jest.fn(), arrayUnion: jest.fn() } } },
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: jest.fn(),
  requireAppSession: jest.fn(),
  requirePermiso: jest.fn(),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/auth/entertainment-token', () => ({
  verifyEntertainmentAccessToken: jest.fn(),
}));

jest.mock('@/lib/firebase/server-messaging', () => ({
  sendNotificationToTargets: jest.fn(),
}));

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: jest.fn(),
}));

jest.mock('@/app/actions/whatsapp', () => ({
  getWhatsAppConfig: jest.fn(),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

import { buscarmeEnLaGaleria, getCarasDeFiesta } from '@/app/actions/social-gallery';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { readData } from '@/lib/data-service';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { requireEventPermission } from '@/lib/auth/event-access';

const mockGetFiestaById = getFiestaById as jest.MockedFunction<typeof getFiestaById>;
const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockEnforceRateLimit = enforcePublicRateLimit as jest.MockedFunction<typeof enforcePublicRateLimit>;
const mockRequireEventPermission = requireEventPermission as jest.MockedFunction<typeof requireEventPermission>;

function vectorConDelta(delta: number): number[] {
  const vec = new Array(128).fill(0);
  vec[0] = delta;
  return vec;
}

describe('Orden 367 B3.2: las caras no salen del servidor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('buscarmeEnLaGaleria compara en el servidor y devuelve sólo fotoIds (nunca vectores ni datos privados)', async () => {
    const vectorInvitado = vectorConDelta(0.1);
    const vectorDudoso = vectorConDelta(0.65);
    const vectorOtro = vectorConDelta(3.0);

    mockGetFiestaById.mockResolvedValue({
      id: 'fiesta-367',
      socialGallerySettings: { enabled: true, carasPreparadas: true, modoCaras: 'grilla' },
      invitados: [{ id: 'inv-1', nombre: 'Invitado Privado', contacto: '099123456' }],
      carasIndexadas: [
        { fotoId: 'post-seguro', vector: vectorInvitado },
        { fotoId: 'post-dudoso', vector: vectorDudoso },
        { fotoId: 'post-ajeno', vector: vectorOtro },
        { fotoId: 'post-oculto', vector: vectorInvitado },
      ],
    } as any);

    mockReadData.mockResolvedValue([
      { id: 'post-seguro', fiestaId: 'fiesta-367', moderationStatus: 'approved' },
      { id: 'post-dudoso', fiestaId: 'fiesta-367', moderationStatus: 'approved' },
      { id: 'post-ajeno', fiestaId: 'fiesta-367', moderationStatus: 'approved' },
      { id: 'post-oculto', fiestaId: 'fiesta-367', moderationStatus: 'hidden' },
    ] as any);

    const res = await buscarmeEnLaGaleria('fiesta-367', vectorConDelta(0.12));

    expect(mockEnforceRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'social-buscarme-galeria', identity: 'fiesta-367' }),
    );
    expect(res.success).toBe(true);
    expect(res.seguras).toEqual(['post-seguro']);
    expect(res.dudosas).toEqual(['post-dudoso']);
    expect(res.fotoIds).toEqual(['post-seguro', 'post-dudoso']);

    const serializado = JSON.stringify(res);
    expect(serializado).not.toContain('vector');
    expect(serializado).not.toContain('carasIndexadas');
    expect(serializado).not.toContain('Invitado Privado');
    expect(serializado).not.toContain('099123456');
    expect(serializado).not.toContain('post-oculto');
  });

  it('getCarasDeFiesta exige permiso de equipo sobre la fiesta y bloquea accesos sin sesión', async () => {
    mockRequireEventPermission.mockRejectedValueOnce(new Error('Tu usuario no tiene permiso para controlar este evento.'));

    await expect(getCarasDeFiesta('fiesta-367')).rejects.toThrow('permiso');
    expect(mockGetFiestaById).not.toHaveBeenCalled();
  });

  it('la galería pública usa buscarmeEnLaGaleria y no llama a getCarasDeFiesta', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'src/app/evento/galeria/[fiestaId]/page.tsx'),
      'utf8',
    );
    expect(src).toContain('buscarmeEnLaGaleria');
    expect(src).not.toContain('getCarasDeFiesta');
  });
});
