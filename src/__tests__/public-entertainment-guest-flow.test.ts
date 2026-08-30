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
    // El muro dejo de ser el camino principal: ahora la cabina imprime siempre
    // y publicar es el extra, que solo aparece si el muro esta contratado.
    expect(source).toContain('Publicar en el muro');
    expect(source).toContain('hayMuro');
    expect(source).toContain('Repetir foto');
    expect(source).toContain('captura web');
  });

  it('runs the photo booth as a three-shot round that prints on its own', () => {
    const source = readRoute('fotocabina');

    // La tanda de tres y la impresion automatica son el mecanismo copiado de
    // las cabinas del rubro. Si alguien las saca, esta prueba lo frena.
    expect(source).toContain('FOTOS_POR_TANDA');
    expect(source).toContain('SEGUNDOS_PRIMERA_FOTO');
    expect(source).toContain('componerTiraDeFotos');
    expect(source).toContain('Foto {fotoEnCurso} de {FOTOS_POR_TANDA}');
    expect(source).toContain('handleImprimir(true)');
    expect(source).toContain('Quiero otra copia');
  });

  it('lets the magic mirror print the memory, signature included', () => {
    const mirror = readRoute('espejo-magico');

    expect(mirror).toContain('imprimirRecuerdo');
    expect(mirror).toContain('Imprimir mi foto');
  });

  it('labels 360 and Bogue output as web-camera capture instead of hardware control', () => {
    const platform = readRoute('plataforma-360');
    const bogue = readRoute('bogue');

    expect(platform).toContain('camara web');
    expect(platform).toContain('El brazo 360 se opera fuera de esta aplicacion.');
    expect(platform).toContain('Grabar otro video');
    expect(bogue).toContain('camara web');
    expect(bogue).toContain('No controla hardware externo.');
    expect(bogue).toContain('Grabar otra vez');
  });

  it('requires visible consent before an AI mirror or Touchpix capture', () => {
    const mirror = readRoute('espejo-magico');
    const touchpix = readRoute('touchpix');

    /**
     * Esta prueba tenia clavado el comportamiento viejo, y el viejo estaba mal:
     * el permiso se pedia SOLO en el modo con IA, y el ajuste de la fiesta se
     * descartaba antes de llegar. Ahora manda la fiesta, y el modo con IA lo pide
     * igual porque ahi la foto sale de la app.
     */
    expect(mirror).toContain("(mode === 'ia' || hayQuePedirPermiso) && !consentAccepted");
    expect(mirror).toContain("disabled={(mode === 'ia' || hayQuePedirPermiso) && !consentAccepted}");
    expect(mirror).toContain('Acepto el procesamiento temporal de mi foto para generar la transformación con IA.');
    expect(mirror.match(/Acepto el procesamiento temporal/g)).toHaveLength(1);
    // Y el permiso que pide la fiesta se explica con sus palabras, no con las de la IA.
    expect(mirror).toContain('Acepto que mi foto se muestre en la pantalla de la fiesta.');
    expect(touchpix).toMatch(/activeTab !== 'foto'\s*&&\s*!consentAccepted/);
    expect(touchpix).toContain('Acepto que mi foto se procese temporalmente con IA para crear este recuerdo.');
    expect(touchpix).not.toContain('activeTab !== \'foto\' && fiesta?.station.consentRequired');
  });

  it('hides device controls on invalid events and names every icon control', () => {
    const photoBooth = readRoute('fotocabina');
    const platform = readRoute('plataforma-360');
    const mirror = readRoute('espejo-magico');
    const touchpix = readRoute('touchpix');

    expect(photoBooth).toContain("!errorMsg && fiesta");
    expect(mirror).toContain("!errorMsg && fiesta");
    expect(touchpix).toContain("!errorMsg && fiesta");
    expect(platform).toContain('isEventLoading || !fiesta');

    for (const source of [photoBooth, platform, mirror, touchpix]) {
      expect(source).toContain('PublicEntertainmentEventStatus');
      expect(source).toContain('waitForInitialPublicLoad(loadTask)');
      expect(source).toContain('aria-label="Volver"');
      expect(source).toContain('aria-label="Cambiar camara"');
      expect(source).toContain('h-11 w-11');
    }
  });
});
