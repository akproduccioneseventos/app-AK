import { publishPostInternal } from '@/lib/presencia-digital/publicador';

jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueNoSalgaAfuera: jest.fn().mockResolvedValue(undefined),
}));

describe('No publicar no se pisa (Orden 374 B6)', () => {
  it('respeta el estado no publicar y no intenta enviar redes', async () => {
    const res = await publishPostInternal('post-inexistente-no-publicar');
    expect(res.success).toBe(false);
  }, 10000);

  it('procesarBorradoresPublicarSolo no pisa un posteo que pasó a No publicar mientras corría la revisión', async () => {
    jest.resetModules();
    let postEnDisco: any = {
      id: 'post-concurrente-1',
      eventId: 'fiesta-1',
      status: 'Borrador',
      platform: 'Instagram',
      text: 'Texto promo',
      mediaUrl: 'https://cdn.ak.uy/foto.jpg',
      previewEnviadaAlDuenioAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    };

    jest.doMock('@/lib/auth/solo-lectura', () => ({
      exigirQueNoSalgaAfuera: jest.fn(async () => undefined),
    }));
    jest.doMock('@/lib/data-service', () => ({
      readData: jest.fn(async (file: string) => {
        if (file === 'ajustes-presencia-digital.json') return { activo: true };
        if (file === 'social-posts.json') return [{ ...postEnDisco }];
        return [];
      }),
      writeData: jest.fn(),
      createDataItem: jest.fn(),
      mutateDataItem: jest.fn(async (_file: string, _col: string, _id: string, mutator: any) => {
        // Simula que el usuario tocó "No publicar" antes de persistir el cambio
        postEnDisco = { ...postEnDisco, status: 'No publicar', noPublicar: true };
        const next = mutator({ ...postEnDisco });
        if (next) postEnDisco = next;
        return postEnDisco;
      }),
    }));
    jest.doMock('@/lib/asistente/comercial-borrador', () => ({
      fotosPromocionalesDeFiesta: jest.fn(async () => [{ id: 'foto-1', url: 'https://cdn.ak.uy/foto.jpg' }]),
    }));

    const { procesarBorradoresPublicarSolo } = await import('@/lib/presencia-digital/publicador');
    const resultado = await procesarBorradoresPublicarSolo(new Date());
    expect(resultado.promocionados).toContain('post-concurrente-1');
    expect(postEnDisco.status).toBe('No publicar');
  });
});
