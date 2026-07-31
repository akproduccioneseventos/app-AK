import { detectBuzonMedia } from './media-upload';

function bytes(prefix: number[], size = 16) {
  const result = new Uint8Array(Math.max(size, prefix.length));
  result.set(prefix);
  return result;
}

describe('buzon media upload detection', () => {
  it('accepts real WebM recordings and keeps their declared media family', () => {
    const webm = bytes([0x1a, 0x45, 0xdf, 0xa3]);

    expect(detectBuzonMedia(webm, 'audio', 'audio/webm')).toMatchObject({
      mediaType: 'audio',
      extension: '.webm',
    });
    expect(detectBuzonMedia(webm, 'video', 'video/webm')).toMatchObject({
      mediaType: 'video',
      extension: '.webm',
    });
  });

  it('accepts MP4 containers for video and M4A containers for audio', () => {
    const isoMedia = bytes([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70]);

    expect(detectBuzonMedia(isoMedia, 'video', 'video/mp4')?.extension).toBe('.mp4');
    expect(detectBuzonMedia(isoMedia, 'audio', 'audio/mp4')?.extension).toBe('.m4a');
  });

  it('rejects MIME mismatches and disguised text files', () => {
    const webm = bytes([0x1a, 0x45, 0xdf, 0xa3]);
    const html = Uint8Array.from(
      Array.from('<html>not media</html>', (character) => character.charCodeAt(0)),
    );

    expect(detectBuzonMedia(webm, 'video', 'audio/webm')).toBeNull();
    expect(detectBuzonMedia(html, 'video', 'video/mp4')).toBeNull();
  });
});
