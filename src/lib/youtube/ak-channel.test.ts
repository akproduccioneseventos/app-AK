import { AK_YOUTUBE_CHANNEL_ID, getCuratedAkYoutubeVideos, parseAkYoutubeFeed } from './ak-channel';

describe('AK YouTube channel', () => {
  it('uses the verified fiestas channel and keeps real fallback videos', () => {
    expect(AK_YOUTUBE_CHANNEL_ID).toBe('UClq6YnypA9PFuBgunzk306A');
    expect(getCuratedAkYoutubeVideos()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ youtubeId: 'f0o5FIRS_wo', categoria: 'Testimonios reales' }),
        expect.objectContaining({ youtubeId: 'hL0Mb5dejIw', categoria: 'XV Anos' }),
      ])
    );
  });

  it('parses YouTube Atom entries into gallery videos', () => {
    const videos = parseAkYoutubeFeed(`
      <feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
        <entry>
          <yt:videoId>video123</yt:videoId>
          <title>Fiesta real AK</title>
          <published>2026-06-01T12:00:00Z</published>
        </entry>
      </feed>
    `);

    expect(videos).toEqual([
      expect.objectContaining({
        youtubeId: 'video123',
        titulo: 'Fiesta real AK',
        thumbnailUrl: 'https://img.youtube.com/vi/video123/hqdefault.jpg',
      }),
    ]);
  });
});
