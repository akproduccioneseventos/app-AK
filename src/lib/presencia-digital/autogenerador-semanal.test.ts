jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-service', () => ({ createDataItem: jest.fn(), readDataConDetalle: jest.fn() }));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: jest.fn() }));
jest.mock('@/lib/ia/reglas-de-la-ia', () => ({ getReglaParaTarea: jest.fn() }));
jest.mock('@/lib/ia/aprender-de-lo-aprobado', () => ({ aprenderDeLoAprobado: jest.fn(), resumirGuiaDeEstilo: jest.fn(() => 'cálido y cercano') }));
jest.mock('@/lib/asistente/comercial-borrador', () => ({
  fotosPromocionalesDeFiesta: jest.fn(),
  validarFotosPromocionalesAlEnviar: jest.fn(),
}));
jest.mock('@/lib/utils', () => ({ hoyEnUruguay: jest.fn(() => '2026-10-30') }));
jest.mock('@/lib/staff-agenda-conflicts', () => ({ getFiestaTimeRange: jest.fn(() => ({ endMs: 0 })) }));

import { createDataItem, readDataConDetalle } from '@/lib/data-service';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import { getReglaParaTarea } from '@/lib/ia/reglas-de-la-ia';
import { getFiestaTimeRange } from '@/lib/staff-agenda-conflicts';
import { aprenderDeLoAprobado } from '@/lib/ia/aprender-de-lo-aprobado';
import { fotosPromocionalesDeFiesta, validarFotosPromocionalesAlEnviar } from '@/lib/asistente/comercial-borrador';
import { autoGenerarBorradoresSemanales, generarBorradoresPosfiesta } from './autogenerador-semanal';

const create = createDataItem as jest.Mock;
const read = readDataConDetalle as jest.Mock;
const events = leerFiestasCrudas as jest.Mock;
const rule = getReglaParaTarea as jest.Mock;
const timeRange = getFiestaTimeRange as jest.Mock;
const learn = aprenderDeLoAprobado as jest.Mock;
const photos = fotosPromocionalesDeFiesta as jest.Mock;
const validate = validarFotosPromocionalesAlEnviar as jest.Mock;
const fiesta = { id: 'event-1', configuracion: { fechaEvento: '2026-10-28', nombreEvento: 'Celebración', tipoCelebracion: 'Boda' } };

describe('borradores sociales posfiesta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    create.mockResolvedValue(undefined);
    read.mockResolvedValue({ valor: [], huboFalla: false });
    events.mockResolvedValue([fiesta]);
    rule.mockResolvedValue('preguntar');
    timeRange.mockReturnValue({ endMs: 0 });
    learn.mockResolvedValue([]);
    photos.mockResolvedValue([{ id: 'photo-1', eventId: 'event-1', url: 'https://img.test/approved.jpg', tipoFiesta: 'Boda' }]);
    validate.mockResolvedValue({ allowed: true, authorizedPhotoIds: ['photo-1'] });
  });

  it('crea un post con imagen y un guion separado sin pretender que sea un video', async () => {
    const result = await generarBorradoresPosfiesta('event-1', '2026-10-28', new Date('2026-10-30T12:00:00Z'));
    expect(result.createdCount).toBe(2);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenNthCalledWith(1, 'social-posts.json', 'social_posts', 'posfiesta-event-1-2026-10-28-publicacion', expect.objectContaining({ mediaType: 'image', promotionalPhotoIds: ['photo-1'], status: 'Borrador' }));
    expect(create).toHaveBeenNthCalledWith(2, 'social-posts.json', 'social_posts', 'posfiesta-event-1-2026-10-28-video-guion', expect.objectContaining({ status: 'Borrador' }));
    expect(create.mock.calls[1][3]).not.toHaveProperty('mediaUrl');
    expect(create.mock.calls[1][3]).not.toHaveProperty('mediaType');
    expect(validate).toHaveBeenCalledWith(['photo-1']);
    expect(result.posts[1].text).toContain('No se creó ni adjuntó video');
  });

  it('usa IDs estables para que dos cron concurrentes solo creen una pareja', async () => {
    const guardados = new Map<string, any>();
    create.mockImplementation(async (_file: string, _collection: string, id: string, item: any) => {
      if (guardados.has(id)) throw new Error('already exists');
      guardados.set(id, item);
    });
    read.mockImplementation(async () => ({ valor: [...guardados.values()], huboFalla: false }));
    await Promise.all([
      generarBorradoresPosfiesta('event-1', '2026-10-28', new Date('2026-10-30T12:00:00Z')),
      generarBorradoresPosfiesta('event-1', '2026-10-28', new Date('2026-10-30T12:00:00Z')),
    ]);
    expect(guardados.size).toBe(2);
    expect(new Set([...guardados.keys()]).size).toBe(2);
  });

  it('falla cerrado ante consentimiento revocado y recupera una escritura parcial sin duplicar', async () => {
    validate.mockResolvedValue({ allowed: false, authorizedPhotoIds: [] });
    const revoked = await generarBorradoresPosfiesta('event-1', '2026-10-28', new Date('2026-10-30T12:00:00Z'));
    expect(revoked.createdCount).toBe(0);
    expect(create).not.toHaveBeenCalled();

    validate.mockResolvedValue({ allowed: true, authorizedPhotoIds: ['photo-1'] });
    create.mockRejectedValueOnce(new Error('already exists'));
    read.mockResolvedValue({ valor: [{ id: 'posfiesta-event-1-2026-10-28-publicacion' }], huboFalla: false });
    const retried = await generarBorradoresPosfiesta('event-1', '2026-10-28', new Date('2026-10-30T12:00:00Z'));
    expect(retried.createdCount).toBe(1);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('semanal usa el lector de servidor sin sesión, respeta apagada y delega en el mismo helper', async () => {
    events.mockResolvedValue([fiesta]);
    rule.mockResolvedValueOnce('apagada');
    const apagado = await autoGenerarBorradoresSemanales();
    expect(apagado.createdCount).toBe(0);
    expect(events).not.toHaveBeenCalled();

    rule.mockResolvedValue('preguntar');
    await autoGenerarBorradoresSemanales();
    expect(events).toHaveBeenCalledWith(false);
  });

  it('no cuenta los borradores recuperados como si se acabaran de crear', async () => {
    const guardados = new Map<string, any>();
    create.mockImplementation(async (_file: string, _collection: string, id: string, item: any) => {
      if (guardados.has(id)) throw new Error('already exists');
      guardados.set(id, item);
    });
    read.mockImplementation(async () => ({ valor: [...guardados.values()], huboFalla: false }));
    expect((await autoGenerarBorradoresSemanales()).createdCount).toBe(2);
    expect((await autoGenerarBorradoresSemanales()).createdCount).toBe(0);
    expect(guardados.size).toBe(2);
  });

  it('helper directo respeta apagada y no busca fotos antes de que termine la fiesta', async () => {
    rule.mockResolvedValue('apagada');
    const apagado = await generarBorradoresPosfiesta('event-1', '2026-10-28', new Date('2026-10-30T12:00:00Z'));
    expect(apagado.createdCount).toBe(0);
    expect(events).not.toHaveBeenCalled();
    expect(photos).not.toHaveBeenCalled();

    rule.mockResolvedValue('preguntar');
    timeRange.mockReturnValue({ endMs: new Date('2026-10-31T00:00:00Z').getTime() });
    const activa = await generarBorradoresPosfiesta('event-1', '2026-10-28', new Date('2026-10-30T12:00:00Z'));
    expect(activa.motivo).toMatch(/todavía no terminó/i);
    expect(photos).not.toHaveBeenCalled();
  });
});
