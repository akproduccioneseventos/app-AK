/**
 * @fileOverview Pruebas para la Orden 105: El Asistente cuida la plata y las 3 puertas.
 */

import {
  nivelDeRiesgo,
  puedeConfirmarPorWhatsApp,
  ACCIONES_NUNCA,
} from '@/lib/asistente/que-puede-hacer-solo';

describe('105 — El asistente cuida la plata', () => {
  test('cada acción de nunca devuelve nunca', () => {
    for (const accion of ACCIONES_NUNCA) {
      expect(nivelDeRiesgo(accion)).toBe('nunca');
    }
    expect(nivelDeRiesgo('marcar_pagado')).toBe('nunca');
    expect(nivelDeRiesgo('cobrar')).toBe('nunca');
    expect(nivelDeRiesgo('emitir_factura')).toBe('nunca');
    expect(nivelDeRiesgo('cerrar_presupuesto')).toBe('nunca');
    expect(nivelDeRiesgo('borrar_fiesta')).toBe('nunca');
    expect(nivelDeRiesgo('borrar_cliente')).toBe('nunca');
    expect(nivelDeRiesgo('cambiar_permisos')).toBe('nunca');
  });

  test('cargar un gasto y cambiar invitados dan pregunta', () => {
    expect(nivelDeRiesgo('cargar_gasto')).toBe('pregunta');
    expect(nivelDeRiesgo('cambiar_invitados')).toBe('pregunta');
    expect(nivelDeRiesgo('agregar_invitados')).toBe('pregunta');
    expect(nivelDeRiesgo('cambiar_precio')).toBe('pregunta');
    expect(nivelDeRiesgo('reprogramar_evento')).toBe('pregunta');
  });

  test('una acción inventada o desconocida da pregunta (lista blanca estricta)', () => {
    expect(nivelDeRiesgo('accion_inventada_xyz')).toBe('pregunta');
    expect(nivelDeRiesgo('transferir_fondos')).toBe('pregunta');
    expect(nivelDeRiesgo('algo_raro')).toBe('pregunta');
  });

  test('acciones de nivel solo devuelven solo', () => {
    expect(nivelDeRiesgo('anotar_tarea')).toBe('solo');
    expect(nivelDeRiesgo('anotar_nota')).toBe('solo');
    expect(nivelDeRiesgo('anotar_recordatorio')).toBe('solo');
    expect(nivelDeRiesgo('cuanto_me_deben')).toBe('solo');
    expect(nivelDeRiesgo('ver_mi_semana')).toBe('solo');
    expect(nivelDeRiesgo('preparar_borrador')).toBe('solo');
  });

  test('por WhatsApp un "sí" NO confirma una propuesta de plata ni de fechas', () => {
    const resGasto = puedeConfirmarPorWhatsApp('cargar_gasto');
    expect(resGasto.permitido).toBe(false);
    expect(resGasto.mensaje).toContain('no confirma la acción');
    expect(resGasto.urlApp).toContain('/asistente');

    const resInvitados = puedeConfirmarPorWhatsApp('cambiar_invitados');
    expect(resInvitados.permitido).toBe(false);

    const resCobrar = puedeConfirmarPorWhatsApp('marcar_pagado');
    expect(resCobrar.permitido).toBe(false);
    expect(resCobrar.mensaje).toContain('Eso lo tenés que hacer vos desde la app');

    // Una tarea propia sí se puede confirmar o hacer directa
    const resTarea = puedeConfirmarPorWhatsApp('anotar_tarea');
    expect(resTarea.permitido).toBe(true);
  });

  test('se pondría en rojo si alguien pasa marcar_pagado a solo', () => {
    expect(nivelDeRiesgo('marcar_pagado')).not.toBe('solo');
    expect(nivelDeRiesgo('marcar_pagado')).toBe('nunca');
  });
});
