
// Se concatena a una copia intacta del test oficial; reutiliza SOLO sus fronteras QA.
describe('Codex763: limites observables, sin proveedor real', () => {
  function prepareUnknowns(count: number) {
    db['catalogo-fotos.json'] = [{ id: 'qa763', url: '/media/qa763.jpg', titulo: 'FICTICIO QA763', categoriaServicio: 'Decoracion' }];
    (analyzeDecorationCatalog as jest.Mock).mockResolvedValue({ matches: [
      { assetId: AK_DECORATION_ELEMENTS[0].id, x: 0.2, y: 0.3, width: 0.2, height: 0.4 },
      { assetId: AK_DECORATION_ELEMENTS[1].id, x: 0.5, y: 0.3, width: 0.2, height: 0.4 },
    ], unknowns: Array.from({ length: count }, (_, i) => `Objeto ficticio qa763 ${i}`) });
  }
  test('ocho desconocidos solo piden cinco recortes en una foto', async () => {
    prepareUnknowns(8);
    (generateGeminiImage as jest.Mock).mockResolvedValue(await makeTestPngBase64(0.5));
    await processDecorationDraft();
    expect(generateGeminiImage).toHaveBeenCalledTimes(5);
    expect((await getCustomDecorationElements()).length).toBe(5);
  });
  test('con diecinueve intentos diarios queda un solo recorte disponible', async () => {
    prepareUnknowns(8);
    db['deco_catalogo_jobs/recortes.json'] = { day: new Date().toISOString().slice(0, 10), count: 19 };
    (generateGeminiImage as jest.Mock).mockResolvedValue(await makeTestPngBase64(0.5));
    await processDecorationDraft();
    expect(generateGeminiImage).toHaveBeenCalledTimes(1);
    expect((db['deco_catalogo_jobs/recortes.json'] as { count: number }).count).toBe(20);
  });
  test('un rechazo del generador tambien registra el intento consumido', async () => {
    prepareUnknowns(1);
    (generateGeminiImage as jest.Mock).mockRejectedValue(new Error('Rechazo ficticio QA763'));
    await processDecorationDraft();
    expect(registrarConsumoIA).toHaveBeenCalledWith('recorte-decoracion');
    expect(await getCustomDecorationElements()).toHaveLength(0);
  });
  test('el PNG que llega de 1024px se guarda reducido a 512px', async () => {
    prepareUnknowns(1);
    const generated = await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.5 } } }).png().toBuffer();
    (generateGeminiImage as jest.Mock).mockResolvedValue(generated.toString('base64'));
    await processDecorationDraft();
    const elements = await getCustomDecorationElements();
    expect(elements).toHaveLength(1);
    const png = Buffer.from(elements[0].imageDataUri!.split(',')[1], 'base64');
    expect((await sharp(png).metadata()).width).toBe(512);
    expect(png.length).toBeLessThanOrEqual(600 * 1024);
  });
});
