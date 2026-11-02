import { generarAnuncioCompleto } from '@/lib/marketing/creador-anuncios-ia';
import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';
import sitemap from '@/app/sitemap';

describe('Orden 245 - Bloque 2 y 4: Creador de Anuncios y Sitemap', () => {
  test('el texto del generador de anuncios no contiene "congel" ni "cuotas fijas"', () => {
    const tipos = ['15_anos', 'bodas', 'cumpleanos', 'empresarial', 'promocion_temporada'] as const;

    for (const tipo of tipos) {
      const anuncio = generarAnuncioCompleto({
        tipoEvento: tipo,
        objetivo: 'simulador',
        tono: 'emocional_familiar',
      });

      const textoCompleto = JSON.stringify(anuncio).toLowerCase();
      expect(textoCompleto).not.toContain('congel');
      expect(textoCompleto).not.toContain('cuotas fijas');
      expect(textoCompleto).not.toContain('presupuesto cerrado');
    }
  });

  test('el sitemap y paginas para google incluyen /public/corporativos', async () => {
    expect(PAGINAS_PARA_GOOGLE).toContain('/public/corporativos');
    expect(PAGINAS_PARA_GOOGLE).toContain('/public/cumpleanos');
    expect(PAGINAS_PARA_GOOGLE).toContain('/public/aniversarios');

    const sm = await sitemap();
    const urls = sm.map((item) => item.url);
    const tieneCorporativos = urls.some((u) => u.includes('/public/corporativos'));
    expect(tieneCorporativos).toBe(true);
  });
});
