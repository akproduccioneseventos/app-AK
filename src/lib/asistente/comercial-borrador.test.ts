jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn() }));
jest.mock('@/lib/budget/public-simulator-persistence', () => ({ persistPublicSimulatorBudget: jest.fn() }));
jest.mock('@/app/actions/scheduled-messages', () => ({ saveScheduledMessage: jest.fn() }));
jest.mock('@/lib/simulator/catalog', () => ({ buildAuthoritativeSimulatorServices: jest.fn(() => [{ id: 'service-1' }]) }));
jest.mock('@/lib/simulator/package-customization', () => ({ getRemovablePackageServices: jest.fn(() => [{ id: 'service-1' }]) }));

import { readData } from '@/lib/data-service';
import { persistPublicSimulatorBudget } from '@/lib/budget/public-simulator-persistence';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import {
  fotosDeFiestasParecidas,
  fotosPromocionalesDeFiesta,
  prepararBorradorProspectoAnuncio,
  rankPromotionalPhotos,
  validarFotosPromocionalesAlEnviar,
} from './comercial-borrador';

const read = readData as jest.Mock;
const persist = persistPublicSimulatorBudget as jest.Mock;
const saveDraft = saveScheduledMessage as jest.Mock;
const input = {
  phone: '099123456',
  name: 'Ana Pérez',
  fecha: '2027-03-15',
  invitados: 100,
  salon: 'Salón Norte',
  tipoEvento: 'Boda' as const,
  requestId: 'request-255-0001',
};

beforeEach(() => {
  jest.clearAllMocks();
  read.mockImplementation(async (file: string) => {
    if (file === 'promotional-photo-consents.json') {
      return {
        e1: {
          eventId: 'e1', authorized: true, grantedBy: 'client', method: 'client_portal',
          evidenceReference: 'portal explícito', contractVersion: 'photo-promo-v1',
          recordedBy: 'Cliente de prueba', recordedAt: '2026-01-01T10:00:00.000Z',
        },
        e2: { eventId: 'e2', authorized: false, grantedBy: 'client', method: 'client_portal',
          evidenceReference: 'portal explícito', contractVersion: 'photo-promo-v1',
          recordedBy: 'Cliente de prueba', recordedAt: '2026-01-01T10:00:00.000Z' },
      };
    }
    if (file === 'galeria-publica.json') return { fotos: [
      { id: 'p1', eventoId: 'e1', url: 'https://img.test/1.jpg', tipoFiesta: 'Bodas' },
      { id: 'p2', eventoId: 'e2', url: 'https://img.test/2.jpg', tipoFiesta: 'Bodas' },
    ], videos: [] };
    if (file === 'armado-rapido-config.json') {
      return { paquetes: [{ id: 'pkg', tiposDeEventoAplicables: ['Boda'], serviciosIncluidos: [{ id: 'service-1' }] }] };
    }
    return [];
  });
  persist.mockResolvedValue({ presupuesto: { id: 'budget-1', totalConDescuento: 25000, estado: 'Borrador' } });
  saveDraft.mockResolvedValue({ success: true, message: { id: 'draft-1' } });
});

describe('commercial assistant draft', () => {
  it('selecciona una foto consentida del evento aunque haya más de 30 fotos de otros eventos antes', async () => {
    const consents = Object.fromEntries(Array.from({ length: 36 }, (_, index) => {
      const eventId = index === 35 ? 'evento-objetivo' : `competidor-${index}`;
      return [eventId, {
        eventId, authorized: true, grantedBy: 'client', method: 'client_portal',
        evidenceReference: 'consentimiento de prueba', contractVersion: 'v1',
        recordedBy: 'cliente de prueba', recordedAt: '2026-01-01T10:00:00.000Z',
      }];
    }));
    read.mockImplementation(async (file: string) => file === 'promotional-photo-consents.json'
      ? consents
      : file === 'galeria-publica.json'
        ? { fotos: Array.from({ length: 36 }, (_, index) => ({
            id: `foto-${index}`, eventoId: index === 35 ? 'evento-objetivo' : `competidor-${index}`,
            url: `https://img.test/${index}.jpg`, tipoFiesta: 'Boda',
          })), videos: [] }
        : []);
    const fotos = await fotosPromocionalesDeFiesta('evento-objetivo');
    expect(fotos).toEqual([expect.objectContaining({ id: 'foto-35', eventId: 'evento-objetivo' })]);
  });

  it('rejects impossible calendar dates before pricing or writes', async () => {
    const result = await prepararBorradorProspectoAnuncio({ ...input, fecha: '2027-02-31' });
    expect(result.status).toBe('manual_review');
    expect(persist).not.toHaveBeenCalled();
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('ranks distinct photos by venue and keeps missing or revoked consent excluded', async () => {
    const ranked = rankPromotionalPhotos([
      { id: 'near', eventId: 'a', url: 'a', tipoFiesta: 'Boda', invitados: 98, salon: 'otro' },
      { id: 'venue', eventId: 'b', url: 'b', tipoFiesta: 'Boda', invitados: 250, salon: 'Salón Norte' },
      { id: 'wrong-type', eventId: 'c', url: 'c', tipoFiesta: 'XV años' },
    ], 'Boda', 100, 'Salón Norte');
    expect(ranked.map(photo => photo.id)).toEqual(['venue', 'near']);
    expect((await fotosDeFiestasParecidas('Boda', 100, 'Salón Norte')).map(photo => photo.id)).toEqual(['p1']);
    read.mockImplementation(async (file: string) => file === 'promotional-photo-consents.json'
      ? { e1: { eventId: 'e1', authorized: false, revokedAt: 'now' } }
      : { fotos: [{ id: 'p1', eventoId: 'e1', url: 'x', tipoFiesta: 'Bodas' }], videos: [] });
    await expect(validarFotosPromocionalesAlEnviar(['p1'])).resolves.toEqual({ allowed: false, authorizedPhotoIds: [] });
  });

  it('fails closed when consent provenance or its timestamp is malformed', async () => {
    read.mockImplementation(async (file: string) => file === 'promotional-photo-consents.json'
      ? { e1: { eventId: 'e1', authorized: true, grantedBy: 'client', method: 'client_portal', contractVersion: 'v1', evidenceReference: 'portal', recordedBy: 'client', recordedAt: 'yesterday-ish' } }
      : { fotos: [{ id: 'p1', eventoId: 'e1', url: 'x', tipoFiesta: 'Bodas' }], videos: [] });
    await expect(fotosDeFiestasParecidas('Boda', 100, 'Salón Norte')).resolves.toEqual([]);
    await expect(validarFotosPromocionalesAlEnviar(['p1'])).resolves.toEqual({ allowed: false, authorizedPhotoIds: [] });
  });

  it('persists a priced budget as a draft and leaves WhatsApp unsent', async () => {
    const result = await prepararBorradorProspectoAnuncio(input);
    expect(result).toMatchObject({ status: 'draft_created', presupuestoId: 'budget-1', messageDraftId: 'draft-1', photoIds: ['p1'] });
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({
      clienteContacto: input.phone,
      paqueteId: 'pkg',
    }), expect.objectContaining({ estadoInicial: 'Borrador', source: 'simulator_assistant' }));
    expect(saveDraft).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pendiente',
      sendingMode: 'manual_click',
      promotionalPhotoIds: ['p1'],
      presupuestoId: 'budget-1',
    }), expect.anything(), expect.anything());
  });

  it('requires manual review when no real applicable package is configured', async () => {
    read.mockImplementation(async (file: string) => file === 'armado-rapido-config.json'
      ? { paquetes: [] }
      : file === 'promotional-photo-consents.json' ? {} : file === 'catalogo-fotos.json' ? [] : { fotos: [], videos: [] });
    const result = await prepararBorradorProspectoAnuncio(input);
    expect(result.status).toBe('manual_review');
    expect(persist).not.toHaveBeenCalled();
    expect(saveDraft).not.toHaveBeenCalled();
  });
});
