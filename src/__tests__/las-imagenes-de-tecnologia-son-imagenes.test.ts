/**
 * Las imágenes y la voz son lo que dicen ser (orden 110, 2/10/2026).
 * La 1249 traía 11 "imágenes" que eran texto, y el Parte de la mañana sonaba como un tono
 * presentado como voz.
 */
import fs from 'fs';
import path from 'path';

function esImagen(buf: Buffer): boolean {
  const webp = buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP'
    && ['VP8 ', 'VP8L', 'VP8X'].includes(buf.subarray(12, 16).toString('latin1'));
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const jpg = buf[0] === 0xff && buf[1] === 0xd8;
  return (webp || png || jpg) && buf.length > 2048;
}

describe('Las imágenes y la voz son lo que dicen ser', () => {
  it('el control reconoce una imagen falsa (se prueba rompiéndolo)', () => {
    expect(esImagen(Buffer.from('RIFF....WEBPVP8 ... fotocabina fotocabina'))).toBe(false);
  });

  it('todo lo que hay en public/tecnologia es una imagen de verdad', () => {
    const dir = path.join(process.cwd(), 'public/tecnologia');
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      expect({ f, imagen: esImagen(fs.readFileSync(path.join(dir, f))) }).toEqual({ f, imagen: true });
    }
  });

  it('el Parte de la mañana habla con una voz, no con un tono', () => {
    const player = fs.readFileSync(path.join(process.cwd(), 'src/components/mi-dia/ParteDeLaMananaPlayer.tsx'), 'utf8');
    expect(player).toContain('SpeechSynthesisUtterance(parte.textoHablado)');
    expect(fs.existsSync(path.join(process.cwd(), 'src/lib/asistente/voz-parte.ts'))).toBe(false);
  });
});
