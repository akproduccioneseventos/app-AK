import {
  COSTO_ESTIMADO_UYU,
  calcularConsumo,
  claveDelMes,
  resumirGasto,
} from '@/lib/ai/consumo';

/**
 * El tope de gasto tiene que hacer dos cosas y ninguna más: avisar antes de que se
 * dispare la factura, y frenar los efectos **sin cortarle la foto al invitado**.
 */

function consumo(touchpix = 0, espejo = 0) {
  return calcularConsumo('2026-08', { touchpix, 'espejo-magico': espejo });
}

describe('gasto del mes en inteligencia artificial', () => {
  it('cuenta las generaciones y las convierte en pesos', () => {
    const resultado = consumo(10, 5);

    expect(resultado.generaciones).toBe(15);
    expect(resultado.gastadoUYU).toBe(
      10 * COSTO_ESTIMADO_UYU.touchpix + 5 * COSTO_ESTIMADO_UYU['espejo-magico'],
    );
  });

  it('ignora números rotos en vez de romper la pantalla', () => {
    const resultado = calcularConsumo('2026-08', {
      touchpix: Number.NaN as unknown as number,
      'espejo-magico': -3,
    });

    expect(resultado.generaciones).toBe(0);
    expect(resultado.gastadoUYU).toBe(0);
  });

  it('sin tope puesto nunca frena', () => {
    const resumen = resumirGasto(consumo(1000), 0);

    expect(resumen.estado).toBe('sin-tope');
    expect(resumen.frenado).toBe(false);
  });

  it('avisa al llegar al 80% del tope, sin frenar todavía', () => {
    const resumen = resumirGasto(consumo(80), 600);

    expect(resumen.estado).toBe('cerca-del-tope');
    expect(resumen.frenado).toBe(false);
    expect(resumen.porcentaje).toBe(80);
  });

  it('frena recién cuando se llega al tope', () => {
    const justoAbajo = resumirGasto(consumo(99), 600);
    const justo = resumirGasto(consumo(100), 600);

    expect(justoAbajo.frenado).toBe(false);
    expect(justo.estado).toBe('pasado');
    expect(justo.frenado).toBe(true);
  });

  it('cuando frena, el aviso aclara que la foto igual sale', () => {
    const resumen = resumirGasto(consumo(200), 600);

    expect(resumen.mensaje).toContain('siguen andando');
    expect(resumen.mensaje).toContain('sin el efecto');
  });

  it('un tope negativo o roto se trata como si no hubiera tope', () => {
    expect(resumirGasto(consumo(500), -100).estado).toBe('sin-tope');
    expect(resumirGasto(consumo(500), Number.NaN).frenado).toBe(false);
  });

  it('el mes se arma con dos dígitos', () => {
    expect(claveDelMes(new Date(2026, 0, 5))).toBe('2026-01');
    expect(claveDelMes(new Date(2026, 11, 31))).toBe('2026-12');
  });
});
