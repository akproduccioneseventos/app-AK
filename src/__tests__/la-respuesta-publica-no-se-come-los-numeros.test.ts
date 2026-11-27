import { sanitizarTextoRespuesta } from '@/lib/social-media/clasificador-comentarios';
import { sanitizarTextoPublicacion } from '@/lib/social-media/adaptar-post-por-red';

describe('La respuesta pública no se come los números', () => {
  it('elimina montos con $, U$S, USD, pesos, UYU, dólares o separador de miles sin tocar cifras como +7 años / +200', () => {
    const texto = 'Tenemos una promo de $16.900 o 500 USD con +7 años de trayectoria y +200 fiestas.';
    const res1 = sanitizarTextoRespuesta(texto);
    const res2 = sanitizarTextoPublicacion(texto);

    expect(res1).not.toContain('$16.900');
    expect(res1).not.toContain('500 USD');
    expect(res1).toContain('+7 años');
    expect(res1).toContain('+200 fiestas');

    expect(res2).not.toContain('$16.900');
    expect(res2).not.toContain('500 USD');
    expect(res2).toContain('+7 años');
    expect(res2).toContain('+200 fiestas');
  });
});
