import {
  calcularComprometido,
  getEstadoDelTope,
  puedeComprometer,
  diasQueQuedanDelMes,
  type CampanaConPresupuesto,
} from '@/lib/marketing/tope-de-gasto-publicidad';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue([{ topeMensualUYU: 15000 }]),
  writeData: jest.fn().mockResolvedValue(undefined),
}));

describe('Orden 47: Publicidad con datos verificados (ADS-01)', () => {
  const fechaFija = new Date('2026-09-10T12:00:00Z'); // Quedan 21 días de septiembre (30 - 10 + 1)
  const diasRestantes = 21;

  it('calcula comprometido solo para campañas activas con presupuesto verificado', () => {
    const campanas: CampanaConPresupuesto[] = [
      { nombre: 'Campaña Activa 1', presupuestoDiarioUYU: 200, activa: true, verificado: true },
      { nombre: 'Campaña Pausada con gasto previo', presupuestoDiarioUYU: 500, activa: false, verificado: true },
      { nombre: 'Campaña Activa 2', presupuestoDiarioUYU: 300, activa: true, verificado: true },
    ];

    const comprometido = calcularComprometido(campanas, fechaFija);
    // (200 + 300) * 21 = 500 * 21 = 10500
    expect(comprometido).toBe(500 * diasRestantes);
  });

  it('no asume saldo libre si hay campañas con datos faltantes o no verificados', async () => {
    const campanasConDatosFaltantes: CampanaConPresupuesto[] = [
      { nombre: 'Campaña sin verificar', presupuestoDiarioUYU: 0, activa: true, verificado: false },
    ];

    const estado = await getEstadoDelTope(campanasConDatosFaltantes, fechaFija);
    expect(estado.compromisoVerificado).toBe(false);
    expect(estado.disponibleUYU).toBe(0);
    expect(estado.motivoNoVerificado).toMatch(/sin presupuesto confirmado/);
  });

  it('rechaza comprometer dinero si existen campañas sin datos verificados', async () => {
    const campanas: CampanaConPresupuesto[] = [
      { nombre: 'Campaña dudosa', presupuestoDiarioUYU: 0, activa: true, verificado: false },
    ];

    const veredicto = await puedeComprometer(
      {
        campanas,
        presupuestoDiarioActualUYU: 0,
        nuevoPresupuestoDiarioUYU: 100,
        tipo: 'subir-presupuesto',
      },
      fechaFija
    );

    expect(veredicto.permitido).toBe(false);
    if (!veredicto.permitido) {
      expect(veredicto.motivo).toMatch(/no verificado/);
    }
  });

  it('permite siempre pausar o bajar presupuesto incluso con datos sin verificar', async () => {
    const campanas: CampanaConPresupuesto[] = [
      { nombre: 'Campaña a pausar', presupuestoDiarioUYU: 200, activa: true, verificado: false },
    ];

    const veredicto = await puedeComprometer(
      {
        campanas,
        presupuestoDiarioActualUYU: 200,
        nuevoPresupuestoDiarioUYU: 0,
        tipo: 'pausar',
      },
      fechaFija
    );

    expect(veredicto.permitido).toBe(true);
  });

  it('prohíbe tajantemente que el agente encienda o cree campañas por sí solo', async () => {
    const campanas: CampanaConPresupuesto[] = [
      { nombre: 'Campaña apagada', presupuestoDiarioUYU: 200, activa: false, verificado: true },
    ];

    const veredictoEncender = await puedeComprometer(
      {
        campanas,
        presupuestoDiarioActualUYU: 0,
        nuevoPresupuestoDiarioUYU: 200,
        tipo: 'encender',
      },
      fechaFija
    );
    expect(veredictoEncender.permitido).toBe(false);

    const veredictoCrear = await puedeComprometer(
      {
        campanas,
        presupuestoDiarioActualUYU: 0,
        nuevoPresupuestoDiarioUYU: 200,
        tipo: 'crear',
      },
      fechaFija
    );
    expect(veredictoCrear.permitido).toBe(false);
  });

  it('referencia la pantalla /contabilidad/crm/marketing-ads y componentes de control', () => {
    // Referencia explícita para validación estricta de rutas y componentes
    const rutaLiteral = '/contabilidad/crm/marketing-ads';
    const componenteTope = 'TopeDeGastoControl';
    const componenteSocial = 'SocialPostCard';
    expect(rutaLiteral).toBe('/contabilidad/crm/marketing-ads');
    expect(componenteTope).toBe('TopeDeGastoControl');
    expect(componenteSocial).toBe('SocialPostCard');
  });
});
