/**
 * Auditoría "cierre de la ronda", 18/11/2026: R18-01 (celíaco fuera del reporte), R18-05 (Adultos/Niños importados como
 * conceptos cobrables) y R18-06 (TOTAL: $2.500 leído como $0).
 */
import { parseBudgetText } from '@/lib/parse-budget-text';
import { condicionesDelInvitado, tieneCondicionAlimentaria } from '@/lib/catering/condiciones-del-invitado';

const texto = (total: string) => [
  'Cliente: PRUEBA AUD18 IMPORTACION',
  'Fecha del evento: 29/11/2026',
  'Invitados: 50',
  'Adultos: 40',
  'Niños: 10',
  'Salón: PRUEBA locación propia',
  'DETALLE DE ARTÍCULOS',
  'Discoteca',
  'Cantidad: 1',
  'Precio unitario: $2.500',
  'Importe: $2.500',
  total,
].join('\n');

describe('el importador de presupuestos', () => {
  it('Adultos y Niños son personas, no conceptos: queda sólo Discoteca por $2.500', () => {
    const p = parseBudgetText(texto('TOTAL: $2.500'));
    expect(p.items.map(i => i.nombreServicio)).toEqual(['Discoteca']);
    expect(p.invitadosCantidad).toBe(50);
    expect(p.invitadosAdultos).toBe(40);
    expect(p.invitadosNinos).toBe(10);
  });

  it.each(['TOTAL: $2.500', 'TOTAL:2500', 'TOTAL: 2500', 'TOTAL: $ 2.500'])('"%s" se lee como $2.500', (linea) => {
    expect(parseBudgetText(texto(linea)).totalDeclarado).toBe(2500);
  });

  it('un total que no coincide con los artículos avisa', () => {
    const p = parseBudgetText(texto('TOTAL: $2.000'));
    expect(p.warnings.join(' ')).toMatch(/no coincide/);
  });
});

describe('las condiciones alimentarias de un invitado', () => {
  it('celíaco marcado aparte cuenta como restricción', () => {
    expect(tieneCondicionAlimentaria({ dietaryRestriction: 'Ninguna', isCeliac: true })).toBe(true);
    expect(condicionesDelInvitado({ dietaryRestriction: 'Ninguna', isCeliac: true })).toEqual(['Celiaco']);
  });
  it('vegano y celíaco: las dos', () => {
    expect(condicionesDelInvitado({ dietaryRestriction: 'Vegano', isCeliac: true })).toEqual(['Vegano', 'Celiaco']);
  });
  it('sin nada, ninguna', () => {
    expect(tieneCondicionAlimentaria({ dietaryRestriction: 'Ninguna', isCeliac: false })).toBe(false);
  });
});
