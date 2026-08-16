import {
  validarCambioDeInvitados,
  TOPE_DE_REDUCCION,
  TOPE_DE_AUMENTO,
  DIAS_PARA_LISTA_FINAL,
} from '@/lib/budget/cambio-de-invitados';

/**
 * La regla sale del contrato, en `src/lib/contract-template.ts`:
 *
 *   "Podrá reducirse hasta 10% de los invitados, ajustando solo servicios por
 *   persona, y aumentarse hasta 30%, sujeto a disponibilidad y pago previo."
 *
 * Estaba escrita en el contrato y en ningún lado del sistema: se podía bajar la
 * cantidad un 40% sin que nada avisara, y despues no habia con que respaldar el
 * cobro.
 */

const HOY = new Date(2026, 7, 9); // 9 de agosto de 2026

describe('cambio de invitados contra lo contratado', () => {
  it('los topes son los que dice el contrato', () => {
    expect(TOPE_DE_REDUCCION).toBe(0.10);
    expect(TOPE_DE_AUMENTO).toBe(0.30);
    expect(DIAS_PARA_LISTA_FINAL).toBe(7);
  });

  it('con 100 contratados se puede mover entre 90 y 130', () => {
    const veredicto = validarCambioDeInvitados({ contratados: 100, nuevos: 100, hoy: HOY });
    expect(veredicto.minimoPermitido).toBe(90);
    expect(veredicto.maximoPermitido).toBe(130);
    expect(veredicto.nivel).toBe('ok');
  });

  it('bajar hasta el 10% esta dentro del contrato', () => {
    expect(validarCambioDeInvitados({ contratados: 100, nuevos: 90, hoy: HOY }).nivel).toBe('ok');
  });

  it('bajar mas del 10% queda fuera del contrato', () => {
    const veredicto = validarCambioDeInvitados({ contratados: 100, nuevos: 89, hoy: HOY });
    expect(veredicto.nivel).toBe('fuera-de-contrato');
    expect(veredicto.mensaje).toContain('90');
  });

  it('subir dentro del 30% avisa que va con pago previo', () => {
    const veredicto = validarCambioDeInvitados({ contratados: 100, nuevos: 120, hoy: HOY });
    expect(veredicto.nivel).toBe('atencion');
    expect(veredicto.mensaje).toContain('pago previo');
  });

  it('subir mas del 30% queda fuera del contrato', () => {
    const veredicto = validarCambioDeInvitados({ contratados: 100, nuevos: 131, hoy: HOY });
    expect(veredicto.nivel).toBe('fuera-de-contrato');
    expect(veredicto.mensaje).toContain('disponibilidad');
  });

  it('avisa cuando ya paso el plazo de la lista final', () => {
    // Faltan 3 dias: la lista final vencia a los 7.
    const veredicto = validarCambioDeInvitados({
      contratados: 100,
      nuevos: 95,
      fechaDelEvento: '2026-08-12',
      hoy: HOY,
    });
    expect(veredicto.listaFinalVencida).toBe(true);
    expect(veredicto.nivel).toBe('atencion');
  });

  it('con la lista final todavia abierta no molesta', () => {
    const veredicto = validarCambioDeInvitados({
      contratados: 100,
      nuevos: 95,
      fechaDelEvento: '2026-09-20',
      hoy: HOY,
    });
    expect(veredicto.listaFinalVencida).toBe(false);
    expect(veredicto.nivel).toBe('ok');
  });

  it('el redondeo va a favor del cliente', () => {
    // 55 contratados: el 10% es 5,5. Se le permite bajar a 49, no a 50.
    const veredicto = validarCambioDeInvitados({ contratados: 55, nuevos: 49, hoy: HOY });
    expect(veredicto.minimoPermitido).toBe(49);
    expect(veredicto.nivel).toBe('ok');
  });

  it('no se rompe sin cantidad contratada', () => {
    const veredicto = validarCambioDeInvitados({ contratados: 0, nuevos: 80, hoy: HOY });
    expect(veredicto.nivel).toBe('ok');
  });
});
