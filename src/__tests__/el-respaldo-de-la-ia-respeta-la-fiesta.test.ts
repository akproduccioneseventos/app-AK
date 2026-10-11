import { seleccionarItemsDeRespaldo, SIN_PENDIENTES_DE_ESTA_FIESTA } from '@/lib/multiagent/respaldo';

const item = (fiestaId: string | undefined, title: string, detail: string) => ({ fiestaId, title, detail, priority: 'alta' });

const briefing = [
  item('B', 'Cierre de B', 'Falta el testimonio de B'),
  item('B', 'Cierre de B', 'Falta el testimonio de B'),
  item('A', 'Contrato de A', 'Sin firmar'),
  item('A', 'Contrato de A', 'Sin firmar'),
  item('A', 'Personal de A', 'Falta un mozo'),
  item(undefined, 'CRM', 'Lead sin respuesta'),
];

describe('el respaldo de la IA respeta la fiesta', () => {
  it('el agente de la fiesta A no menciona B ni repite', () => {
    const r = seleccionarItemsDeRespaldo('fiesta', briefing, 'A');
    expect(r.items.map(i => i.title)).toEqual(['Contrato de A', 'Personal de A']);
    expect(JSON.stringify(r.items)).not.toContain('B');
    expect(r.sinPendientesDeLaFiesta).toBe(false);
  });

  it('el general conserva A y B (sin repetidos)', () => {
    const r = seleccionarItemsDeRespaldo('fiestas_general', briefing, undefined);
    const titulos = r.items.map(i => i.title);
    expect(titulos).toEqual(expect.arrayContaining(['Cierre de B', 'Contrato de A', 'CRM']));
    expect(new Set(titulos).size).toBe(titulos.length);
  });

  it('una fiesta sin pendientes propios no se completa con otras', () => {
    const r = seleccionarItemsDeRespaldo('fiesta', briefing, 'C');
    expect(r.items).toEqual([]);
    expect(r.sinPendientesDeLaFiesta).toBe(true);
    expect(SIN_PENDIENTES_DE_ESTA_FIESTA).toBe('No encontré pendientes de esta fiesta en el resumen automático.');
  });

  it('corta a 6 recién después de filtrar y sacar repetidos', () => {
    const muchos = [
      ...Array.from({ length: 8 }, (_, n) => item('B', `B${n}`, 'x')),
      ...Array.from({ length: 8 }, (_, n) => item('A', `A${n}`, 'x')),
    ];
    const r = seleccionarItemsDeRespaldo('fiesta', muchos, 'A');
    expect(r.items).toHaveLength(6);
    expect(r.items.every(i => i.fiestaId === 'A')).toBe(true);
  });
});
