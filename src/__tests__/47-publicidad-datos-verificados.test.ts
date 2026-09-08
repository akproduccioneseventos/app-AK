import {
  calcularComprometido,
  getEstadoDelTope,
  elAgentePuedeHacerloSolo,
  puedeComprometer,
  diasQueQuedanDelMes,
  type CampanaConPresupuesto,
} from '@/lib/marketing/tope-de-gasto-publicidad';

/**
 * Orden 47: Marketing y redes - Datos publicitarios y presupuestos verificados.
 *
 * Verifica que no se inventen estimaciones de presupuesto a partir de gasto histórico,
 * que las campañas pausadas no gasten, que se señale cuando los datos no están
 * verificados y que el agente tenga prohibido crear o encender campañas solo.
 */

describe('Orden 47: Publicidad y datos de gasto verificados', () => {
  const fechaFija = new Date(2026, 8, 15); // 15 de septiembre de 2026 (mes de 30 días, quedan 16 días)

  test('Campaña pausada con gasto histórico previo NO suma compromiso futuro', () => {
    const campanas: CampanaConPresupuesto[] = [
      {
        nombre: 'Campaña Quinceañeras Pausada',
        presupuestoDiarioUYU: 800,
        activa: false, // Pausada
        verificado: true,
      },
    ];

    const comprometido = calcularComprometido(campanas, fechaFija);
    expect(comprometido).toBe(0);
  });

  test('Campaña activa con presupuesto diario verificado suma exactamente días restantes x diario', () => {
    const diasRestantes = diasQueQuedanDelMes(fechaFija);
    expect(diasRestantes).toBe(16);

    const campanas: CampanaConPresupuesto[] = [
      {
        nombre: 'Campaña Bodas Activa',
        presupuestoDiarioUYU: 250,
        activa: true,
        verificado: true,
      },
    ];

    const comprometido = calcularComprometido(campanas, fechaFija);
    expect(comprometido).toBe(250 * 16);
  });

  test('Campaña activa sin presupuesto diario verificado no inventa 500 y señala compromiso no verificado', async () => {
    const campanas: CampanaConPresupuesto[] = [
      {
        nombre: 'Campaña Sin Configuración en Meta',
        presupuestoDiarioUYU: 0,
        activa: true,
        verificado: false,
      },
    ];

    const estado = await getEstadoDelTope(campanas, fechaFija);
    expect(estado.comprometidoUYU).toBe(0);
    expect(estado.compromisoVerificado).toBe(false);
  });

  test('Campañas múltiples combinando activas y pausadas solo computan las activas verificadas', () => {
    const diasRestantes = diasQueQuedanDelMes(fechaFija);
    const campanas: CampanaConPresupuesto[] = [
      { nombre: 'Activa 1', presupuestoDiarioUYU: 100, activa: true, verificado: true },
      { nombre: 'Pausada 2', presupuestoDiarioUYU: 900, activa: false, verificado: true },
      { nombre: 'Activa 2', presupuestoDiarioUYU: 200, activa: true, verificado: true },
    ];

    const comprometido = calcularComprometido(campanas, fechaFija);
    expect(comprometido).toBe((100 + 200) * diasRestantes);
  });

  test('elAgentePuedeHacerloSolo prohíbe terminantemente crear o encender campañas', () => {
    // 1. Crear campaña prohibido
    const veredictoCrear = elAgentePuedeHacerloSolo('crear');
    expect(veredictoCrear).not.toBeNull();
    expect(veredictoCrear?.permitido).toBe(false);
    expect(veredictoCrear && 'motivo' in veredictoCrear ? veredictoCrear.motivo : '').toContain('no crea campanas');

    // 2. Encender campaña pausada prohibido
    const veredictoEncender = elAgentePuedeHacerloSolo('encender');
    expect(veredictoEncender).not.toBeNull();
    expect(veredictoEncender?.permitido).toBe(false);
    expect(veredictoEncender && 'motivo' in veredictoEncender ? veredictoEncender.motivo : '').toContain('no reactiva campanas');

    // 3. Pausar y bajar presupuesto se delegan (retornan null)
    expect(elAgentePuedeHacerloSolo('pausar')).toBeNull();
    expect(elAgentePuedeHacerloSolo('bajar-presupuesto')).toBeNull();
  });

  test('puedeComprometer permite bajar presupuesto o pausar aun sin tope disponible', async () => {
    const veredicto = await puedeComprometer({
      campanas: [],
      presupuestoDiarioActualUYU: 500,
      nuevoPresupuestoDiarioUYU: 300, // Disminución de gasto
      ahora: fechaFija,
    });

    expect(veredicto.permitido).toBe(true);
  });
});
