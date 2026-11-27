import { insumosDeLaBarra } from '@/lib/barra/cierre-de-barra';

describe('Cierre de barra cuenta lo sin alcohol', () => {
  it('incluye insumos exclusivos de recetaIngredientesSinAlcohol', () => {
    const tragos: any = [
      {
        id: 'trago1',
        nombre: 'Virgin Mojito',
        recetaIngredientes: [{ insumoId: 'limon', cantidad: 1 }],
        recetaIngredientesSinAlcohol: [{ insumoId: 'soda', cantidad: 2 }],
      },
    ];

    const insumos = insumosDeLaBarra(tragos);
    expect(insumos).toContain('limon');
    expect(insumos).toContain('soda');
    expect(insumos.length).toBe(2);
  });
});
