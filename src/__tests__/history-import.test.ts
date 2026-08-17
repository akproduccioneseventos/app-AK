import { parseHistoricalSocialArchive } from '@/lib/social-media/history-import';

describe('parseHistoricalSocialArchive', () => {
  it('parses Facebook official export JSON with attachments and metrics', async () => {
    const facebookExport = [
      {
        timestamp: 1704067200,
        post: 'Increíble fiesta de 15 años en Salto con AK Producciones!',
        attachments: [
          {
            data: [
              {
                media: {
                  uri: 'posts/media/your_posts/photo1.jpg',
                  creation_timestamp: 1704067200,
                  title: 'Increíble fiesta de 15 años en Salto',
                },
              },
            ],
          },
        ],
      },
    ];

    const file = new File([JSON.stringify(facebookExport)], 'your_posts_1.json', {
      type: 'application/json',
    });

    const result = await parseHistoricalSocialArchive(file, 'Facebook');

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].platform).toBe('Facebook');
    expect(result.posts[0].text).toContain('Increíble fiesta de 15 años en Salto');
    expect(result.posts[0].publishDate).toBe('2024-01-01T00:00:00.000Z');
    expect(result.posts[0].status).toBe('Importado historial');
  });

  it('parses Instagram official export JSON with media array', async () => {
    const instagramExport = [
      {
        media: [
          {
            uri: 'media/posts/202401/quince_dance.mp4',
            creation_timestamp: 1704153600,
            title: 'Vals inolvidable en Club Uruguay #15años #salto',
          },
        ],
        title: 'Vals inolvidable en Club Uruguay #15años #salto',
        creation_timestamp: 1704153600,
      },
    ];

    const file = new File([JSON.stringify(instagramExport)], 'posts_1.json', {
      type: 'application/json',
    });

    const result = await parseHistoricalSocialArchive(file, 'Instagram');

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].platform).toBe('Instagram');
    expect(result.posts[0].text).toContain('Vals inolvidable');
    expect(result.posts[0].mediaType).toBe('video');
    expect(result.posts[0].publishDate).toBe('2024-01-02T00:00:00.000Z');
  });

  it('parses X (Twitter) official export JS with window.YTD prefix', async () => {
    const tweetRecord = {
      tweet: {
        id: '987654321',
        created_at: 'Mon Jan 01 12:00:00 +0000 2024',
        full_text: 'Preparando la mejor noche en Salto con sonido e iluminación de primer nivel.',
        favorite_count: 24,
        retweet_count: 5,
      },
    };

    const jsPayload = `window.YTD.tweets.part0 = ${JSON.stringify([tweetRecord, tweetRecord])};`;

    const file = new File([jsPayload], 'tweets.js', {
      type: 'text/javascript',
    });

    const result = await parseHistoricalSocialArchive(file, 'X');

    // Debe deduplicar registros idénticos
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].platform).toBe('X');
    expect(result.posts[0].sourceId).toBe('987654321');
    expect(result.posts[0].text).toContain('Preparando la mejor noche en Salto');
    expect(result.posts[0].performance?.likes).toBe(24);
    expect(result.posts[0].performance?.shares).toBe(5);
  });

  it('rejects invalid non-social files with a clear Spanish error message', async () => {
    const invalidFile = new File(['archivo no valido random text'], 'lista.txt', {
      type: 'text/plain',
    });

    await expect(parseHistoricalSocialArchive(invalidFile, 'Instagram')).rejects.toThrow(
      /ZIP, JSON o JS/
    );
  });
});
