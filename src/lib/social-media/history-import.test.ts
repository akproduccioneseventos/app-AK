import { parseHistoricalSocialArchive } from './history-import';

describe('parseHistoricalSocialArchive', () => {
  it('preserva texto, fecha, enlace y metricas de un JSON historico', async () => {
    const payload = JSON.stringify([
      {
        id: 'post-123',
        timestamp: 1704067200,
        text: 'XV años de prueba en Salto',
        permalink: 'https://example.com/post-123',
        like_count: 14,
        comment_count: 3,
      },
    ]);
    const file = new File([payload], 'posts.json', { type: 'application/json' });

    const result = await parseHistoricalSocialArchive(file, 'Facebook');

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toEqual(expect.objectContaining({
      platform: 'Facebook',
      sourceId: 'post-123',
      sourceUrl: 'https://example.com/post-123',
      text: 'XV años de prueba en Salto',
      publishDate: '2024-01-01T00:00:00.000Z',
      status: 'Importado historial',
    }));
    expect(result.posts[0].performance).toEqual(expect.objectContaining({ likes: 14, comments: 3 }));
    expect(result.posts[0].contentHash).toBeTruthy();
    expect(result.posts[0].crossPlatformGroupId).toBeTruthy();
  });

  it('lee archivos JS de X y evita registros repetidos del mismo origen', async () => {
    const tweet = {
      tweet: {
        id: '456',
        created_at: 'Mon Jan 01 12:00:00 +0000 2024',
        full_text: 'Publicación histórica en X',
      },
    };
    const file = new File([
      `window.YTD.tweets.part0 = ${JSON.stringify([tweet, tweet])};`,
    ], 'tweets.js', { type: 'text/javascript' });

    const result = await parseHistoricalSocialArchive(file, 'X');

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].sourceId).toBe('456');
    expect(result.posts[0].text).toBe('Publicación histórica en X');
  });

  it('rechaza archivos que no son exportaciones estructuradas permitidas', async () => {
    const file = new File(['hola'], 'historial.txt', { type: 'text/plain' });
    await expect(parseHistoricalSocialArchive(file, 'Instagram')).rejects.toThrow(/ZIP, JSON o JS/);
  });
});
