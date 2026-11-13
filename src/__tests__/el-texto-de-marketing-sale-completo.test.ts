import { BASE_TEMPLATES, renderVariables } from '@/lib/marketing/plantillas-base';
import { SITE_URL } from '@/lib/seo/paginas-publicas';

describe('El texto de marketing sale completo', () => {
  const datosEjemplo: Record<string, string> = {
    NOMBRE: 'Sofía',
    FECHA: '15 de noviembre de 2026',
    INVITADOS: '120',
    PRECIO_LISTA: '150.000',
    PRECIO_HOY: '135.000',
    AHORRO: '15.000',
    LINK_SIMULADOR: `${SITE_URL}/simulador-de-presupuesto`,
  };

  it('el enlace del simulador empieza con https://akproducciones.uy', () => {
    expect(datosEjemplo.LINK_SIMULADOR.startsWith('https://akproducciones.uy')).toBe(true);
  });

  it('todas las plantillas de BASE_TEMPLATES renderizadas con datos de ejemplo no tienen [ mayúscula ] ni {{', () => {
    const keys = Object.keys(BASE_TEMPLATES) as Array<keyof typeof BASE_TEMPLATES>;
    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      const template = BASE_TEMPLATES[key];
      if (!template) continue;

      const canales = ['ig_corto', 'ig_largo', 'historias', 'tiktok', 'whatsapp'] as const;

      for (const canal of canales) {
        const textoOriginal = template[canal];
        expect(textoOriginal).toBeDefined();

        const textoRenderizado = renderVariables(textoOriginal, datosEjemplo);

        // No debe tener corchetes con mayúsculas [NOMBRE], [FECHA], [X], etc.
        expect(textoRenderizado).not.toMatch(/\[[A-ZÁÉÍÓÚÑ]/);

        // No debe tener llaves de variables sin reemplazar
        expect(textoRenderizado).not.toContain('{{');
        expect(textoRenderizado).not.toContain('}}');

        // Si incluye el simulador, debe apuntar a https://akproducciones.uy
        if (textoRenderizado.includes('/simulador-de-presupuesto')) {
          expect(textoRenderizado).toContain('https://akproducciones.uy/simulador-de-presupuesto');
        }
      }
    }
  });
});
