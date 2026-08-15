import { unidadesQueNoSePuedenConvertir, avisosDeUnidadesDelMenu } from '@/lib/catering/unidades';
import type { ServicioEmpresa } from '@/types/empresa';

/**
 * Defecto real: el calculo del costo de un plato solo sabe convertir de gramos y
 * mililitros a kilos y litros. Si la receta pide "2 tazas" y el insumo esta
 * cargado en gramos, multiplica como si fueran la misma unidad y el costo del
 * plato sale mal, sin avisar. Ese costo entra en todos los presupuestos.
 *
 * No se inventa una conversion —nadie sabe cuantos gramos pesa una taza de ese
 * ingrediente— sino que se avisa para que alguien lo revise.
 */

const catalogo = [
  { id: 'ins_1', unidad: 'Gramos' },
  { id: 'ins_2', unidad: 'Kg' },
] as unknown as ServicioEmpresa[];

describe('unidades de receta contra catalogo', () => {
  it('gramos contra kilos se convierte sin avisar', () => {
    expect(unidadesQueNoSePuedenConvertir({ unit: 'g', origenId: 'ins_2' }, catalogo)).toBeNull();
  });

  it('la misma unidad no avisa', () => {
    expect(unidadesQueNoSePuedenConvertir({ unit: 'Gramos', origenId: 'ins_1' }, catalogo)).toBeNull();
  });

  it('tazas contra gramos avisa, con el nombre del ingrediente', () => {
    const aviso = unidadesQueNoSePuedenConvertir(
      { unit: 'Tazas', origenId: 'ins_1', name: 'Harina' },
      catalogo,
    );
    expect(aviso).toContain('Harina');
    expect(aviso).toContain('Tazas');
    expect(aviso).toContain('Gramos');
  });

  it('sin unidad cargada no molesta', () => {
    expect(unidadesQueNoSePuedenConvertir({ unit: '', origenId: 'ins_1' }, catalogo)).toBeNull();
    expect(unidadesQueNoSePuedenConvertir({ unit: 'no definido', origenId: 'ins_1' }, catalogo)).toBeNull();
  });

  it('un ingrediente suelto, sin insumo del catalogo, no avisa', () => {
    expect(unidadesQueNoSePuedenConvertir({ unit: 'Tazas', name: 'Sal' }, catalogo)).toBeNull();
  });

  it('junta los avisos del menu sin repetir', () => {
    const avisos = avisosDeUnidadesDelMenu(
      [
        { unit: 'Tazas', origenId: 'ins_1', name: 'Harina' },
        { unit: 'Tazas', origenId: 'ins_1', name: 'Harina' },
        { unit: 'g', origenId: 'ins_2', name: 'Azucar' },
      ],
      catalogo,
    );
    expect(avisos).toHaveLength(1);
  });
});
