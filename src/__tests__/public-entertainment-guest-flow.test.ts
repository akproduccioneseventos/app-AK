import fs from 'fs';
import path from 'path';

const sourceRoot = path.resolve(__dirname, '..');

function readRoute(moduleName: string) {
  return fs.readFileSync(
    path.join(sourceRoot, 'app', 'evento', moduleName, '[fiestaId]', 'page.tsx'),
    'utf8',
  );
}

describe('public entertainment guest flows', () => {
  it('keeps photo booth preparation, countdown, review, retake and publishing clear', () => {
    const source = readRoute('fotocabina');

    expect(source).toContain("localStatus === 'countdown'");
    expect(source).toContain('Preparar foto');
    expect(source).toContain('Publicar y obtener enlace');
    expect(source).toContain('Repetir foto');
    expect(source).toContain('captura web');
  });

  it('labels 360 and Bogue output as web-camera capture instead of hardware control', () => {
    const platform = readRoute('plataforma-360');
    const bogue = readRoute('bogue');

    expect(platform).toContain('camara web');
    expect(platform).toContain('El brazo 360 se opera fuera de esta aplicacion.');
    expect(platform).toContain('Grabar otro video');
    expect(bogue).toContain('camara web');
    expect(bogue).toContain('No controla hardware externo.');
    expect(bogue).toContain('Grabar otro loop');
  });

  it('requires visible consent before an AI mirror or Touchpix capture', () => {
    const mirror = readRoute('espejo-magico');
    const touchpix = readRoute('touchpix');

    expect(mirror).toContain("mode === 'ia' && !consentAccepted");
    expect(mirror).toContain("disabled={mode === 'ia' && !consentAccepted}");
    expect(mirror).toContain('Acepto el procesamiento temporal de esta foto para generar el retrato con IA.');
    expect(mirror).toContain('Acepto el procesamiento temporal de mi foto con IA para generar este recuerdo.');
    expect(mirror).not.toContain("mode === 'ia' && fiesta?.station.consentRequired");
    expect(touchpix).toContain("activeTab !== 'foto' &&\n      !consentAccepted");
    expect(touchpix).toContain('Acepto que mi foto se procese temporalmente con IA para crear este recuerdo.');
    expect(touchpix).not.toContain('activeTab !== \'foto\' && fiesta?.station.consentRequired');
  });
});
