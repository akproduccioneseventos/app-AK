/**
 * Las recetas de la barra son las del dueño (27/10/2026): las proporciones de la carta de la barra.
 * Botella = 750 ml (así lo cuenta la prueba "descuentan de verdad"), litro = 1000 ml, 1 oz = 30 ml.
 * Vaso de 300 ml; las jarras se descuentan por vaso (1 L = 0,3; 600 cc = 0,5).
 * "Completar" = vaso de 300 ml menos los demás líquidos. Supuestos editables del dueño: medida = 1 oz = 30 ml, medida grande = 1,5 oz = 45 ml (jigger estándar).
 * Lo que sigue sin definir (rolo de hielo, cucharada, mitades, rodajas, vaso de jugo) NO se carga.
 */
import fs from 'fs';
import path from 'path';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';

const insumos: Array<{ id: string; nombre: string; unidad: string; valorUnitarioEstimado?: number }> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src/data/insumos.json'), 'utf8'),
);
const ML_POR_UNIDAD: Record<string, number> = { Botella: 750, Litro: 1000 };

function mlDe(tragoId: string): Record<string, number> {
  const t = defaultCartaTragosData.items.find((x) => x.id === tragoId);
  expect(t).toBeDefined();
  const out: Record<string, number> = {};
  for (const i of t!.recetaIngredientes || []) out[i.insumoId] = Math.round(i.cantidad * ML_POR_UNIDAD[i.unidad] * 10) / 10;
  return out;
}

const ESPERADO: Record<string, Record<string, number>> = {
  'daiquiri-durazno': { 'ing-ron': 13.5, 'ing-naranja': 45 },
  'daiquiri-frutilla': { 'ing-ron': 13.5, 'ing-licor-frutilla': 13.5 },
  'daiquiri-anana': { 'ing-ron': 120, 'ing-pina-colada': 30 },
  'daiquiri-primavera': { 'ing-ron': 54, 'ing-naranja': 45 },
  'martini-refresh': { 'ing-martini': 120, 'ing-vodka': 30, 'ing-sprite': 150 },
  'pantera-rosa': { 'ing-vodka': 45, 'ing-pina-colada': 90, 'ing-granadina': 75 },
  'electric-lemonade': { 'ing-vodka': 45, 'ing-jugo-limon': 150, 'ing-blue-curacao': 30, 'ing-sprite': 75 },
  'sex-on-the-beach': { 'ing-vodka': 60, 'ing-licor-durazno': 30, 'ing-naranja': 195, 'ing-granadina': 15 },
  orgasmo: { 'ing-vodka': 45, 'ing-licor-durazno': 30, 'ing-pina-colada': 60, 'ing-granadina': 15 },
  'atomic-green': { 'ing-vodka': 45, 'ing-blue-curacao': 30, 'ing-naranja': 225 },
};

describe('Las recetas de la barra son las del dueño', () => {
  for (const [id, esperado] of Object.entries(ESPERADO)) {
    it(`${id} descuenta los mililitros correctos`, () => {
      expect(mlDe(id)).toEqual(esperado);
    });
  }

  it('el Orgasmo: vodka 45 ml, licor de durazno 30, piña colada 60, granadina 15', () => {
    expect(mlDe('orgasmo')).toEqual({ 'ing-vodka': 45, 'ing-licor-durazno': 30, 'ing-pina-colada': 60, 'ing-granadina': 15 });
  });

  it('los insumos nuevos existen, sin precio inventado', () => {
    for (const id of ['ing-pina-colada', 'ing-blue-curacao', 'ing-martini', 'ing-licor-frutilla']) {
      const i = insumos.find((x) => x.id === id);
      expect(i).toBeDefined();
      expect(i!.unidad).toBe('Botella');
      expect(i!.valorUnitarioEstimado).toBe(0);
    }
  });
});
