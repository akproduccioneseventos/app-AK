/**
 * @jest-environment jsdom
 */
import {
  evaluarMismoNumeroEnDosLugares,
  evaluarNadaDePruebaEnLoPublico,
} from '../../tests/robot/reglas';

describe('Orden 349 Bloque 5: reglas nuevas del robot', () => {
  it('marca rojo cuando aparece un plato "PRUEBA x" en la LED pública', () => {
    const res = evaluarNadaDePruebaEnLoPublico({
      textoVisible: 'Elegí las Entradas\nPRUEBA x\n$ 450 /pers.',
    });
    expect(res.estado).toBe('rojo');
    expect(res.motivo).toContain('PRUEBA x');
  });

  it('marca rojo cuando aparece texto que empieza con "TEST" en lo público', () => {
    const res = evaluarNadaDePruebaEnLoPublico({
      textoVisible: 'Simulador de presupuesto\nTEST servicio borrador',
    });
    expect(res.estado).toBe('rojo');
  });

  it('da verde con textos públicos normales (incluyendo "Testimonios" o "a prueba de")', () => {
    const res = evaluarNadaDePruebaEnLoPublico({
      textoVisible: 'Testimonios de familias\nOrganización a prueba de imprevistos\n+200 fiestas realizadas',
    });
    expect(res.estado).toBe('verde');
  });

  it('marca rojo si la barra superior muestra un número de alertas distinto al Centro de Alertas', () => {
    const res = evaluarMismoNumeroEnDosLugares({
      contadorBarraSuperior: 1,
      contadorCentroAlertas: 0,
    });
    expect(res.estado).toBe('rojo');
  });

  it('da verde si la barra superior y el Centro de Alertas muestran la misma cantidad', () => {
    expect(
      evaluarMismoNumeroEnDosLugares({
        contadorBarraSuperior: 2,
        contadorCentroAlertas: 2,
      }).estado,
    ).toBe('verde');

    expect(
      evaluarMismoNumeroEnDosLugares({
        contadorBarraSuperior: 0,
        contadorCentroAlertas: 0,
      }).estado,
    ).toBe('verde');
  });
});
