import { generarEscenaAutomatica } from '@/lib/decoracion/generar-layout-automatico';
import { contarMesas } from '@/lib/mesas/contar-mesas';
import type { FiestaEnPlanificacion, LayoutElement } from '@/types/fiesta';

describe('Orden 75: El salón se arma solo con lo contratado', () => {
  const fiestaBase: FiestaEnPlanificacion = {
    id: 'fiesta_test_auto_armado',
    nombre: 'Boda de Prueba 3D',
    fecha: '2026-11-20',
    configuracion: {
      tipoCelebracion: 'Boda',
      invitadosEstimados: 60,
    },
    invitados: [
      { id: 'inv_1', nombre: 'Familia Perez', rsvp: 'confirmado', partySize: 5 },
      { id: 'inv_2', nombre: 'Familia Gomez', rsvp: 'confirmado', partySize: 5 },
      { id: 'inv_3', nombre: 'Familia Lopez', rsvp: 'confirmado', partySize: 10 },
      { id: 'inv_4', nombre: 'Pendiente', rsvp: 'pendiente', partySize: 4 },
    ],
    decoracion: {
      salonWidth: 20,
      salonHeight: 15,
      pixelsPerMeter: 40,
      salonElements: [],
    },
  };

  const presupuestoContratado = {
    id: 'pres_test_1',
    itemsPresupuestados: [
      { idServicioCatalogo: 'srv_1', nombreServicio: 'Pista de Baile LED y Sonido DJ' },
      { idServicioCatalogo: 'srv_2', nombreServicio: 'Escenario para Banda en Vivo' },
      { idServicioCatalogo: 'srv_3', nombreServicio: 'Barra de Tragos Premium' },
      { idServicioCatalogo: 'srv_4', nombreServicio: 'Sector de Sillones y Living Lounge' },
      { idServicioCatalogo: 'srv_5', nombreServicio: 'Mesa de la Torta y Postres' },
      { idServicioCatalogo: 'srv_6', nombreServicio: 'Photo-opportunity con Fotocabina' },
      { idServicioCatalogo: 'srv_7', nombreServicio: 'Pantalla LED Gigante' },
    ],
  } as any;

  it('calcula las mesas con contarMesas según confirmados (20 confirmados = 2 mesas de invitados)', () => {
    const res = generarEscenaAutomatica({
      fiesta: fiestaBase,
      presupuesto: presupuestoContratado,
    });

    expect(res.aplicado).toBe(true);
    expect(res.elementosGenerados).toBeGreaterThan(0);

    const elementos = res.decoracion.salonElements || [];
    const mesasInvitados = elementos.filter((e) => e.category === 'Mesa Redonda');
    expect(mesasInvitados.length).toBe(2);

    // contarMesas cuenta las 2 mesas de invitados + 1 mesa de la torta contratada = 3
    const cantidadMesasTotal = contarMesas(elementos);
    expect(cantidadMesasTotal).toBe(3);
  });

  it('genera pista, escenario, barra, living, torta, photo-opportunity y pantalla LED según lo contratado', () => {
    const res = generarEscenaAutomatica({
      fiesta: fiestaBase,
      presupuesto: presupuestoContratado,
    });

    const elementos = res.decoracion.salonElements || [];
    const categorias = elementos.map((e) => e.category);

    expect(categorias).toContain('Pista de Baile');
    expect(categorias).toContain('Escenario');
    expect(categorias).toContain('Barra');
    expect(categorias).toContain('Living');
    expect(categorias).toContain('Mesa de la Torta');
    expect(categorias).toContain('Photo-opportunity');
    expect(categorias).toContain('Pantalla LED');
  });

  it('no pisa un plano que ya tenga elementos a menos que se fuerce', () => {
    const elementoPrevio: LayoutElement = {
      id: 'm_existente',
      name: 'Mesa Existente',
      type: 'element',
      category: 'Mesa Redonda',
      x: 10,
      y: 10,
    };

    const fiestaConPlano: FiestaEnPlanificacion = {
      ...fiestaBase,
      decoracion: {
        ...fiestaBase.decoracion,
        salonElements: [elementoPrevio],
      },
    };

    // Sin forzar
    const resSinForzar = generarEscenaAutomatica({
      fiesta: fiestaConPlano,
      presupuesto: presupuestoContratado,
    });

    expect(resSinForzar.aplicado).toBe(false);
    expect(resSinForzar.motivo).toBe('ya_tiene_plano');
    expect(resSinForzar.decoracion.salonElements).toHaveLength(1);

    // Con forzar
    const resForzado = generarEscenaAutomatica({
      fiesta: fiestaConPlano,
      presupuesto: presupuestoContratado,
      forzar: true,
    });

    expect(resForzado.aplicado).toBe(true);
    expect(resForzado.elementosGenerados).toBeGreaterThan(1);
  });
});
