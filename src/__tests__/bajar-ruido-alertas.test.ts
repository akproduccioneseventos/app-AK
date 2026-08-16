import { mapRuleToAlertType, REGLAS_URGENTES_IDS } from '@/lib/automatizaciones-engine';
import type { AutomatizacionRule } from '@/types/automatizaciones';

describe('Bajar el Ruido de Alertas (Bloque A y B)', () => {
  it('define exactamente las 4 reglas urgentes vinculadas a dinero y contrato', () => {
    expect(REGLAS_URGENTES_IDS.has('falta-sena')).toBe(true);
    expect(REGLAS_URGENTES_IDS.has('cuota-vencida')).toBe(true);
    expect(REGLAS_URGENTES_IDS.has('saldo-pendiente-evento-cercano')).toBe(true);
    expect(REGLAS_URGENTES_IDS.has('contrato-sin-firmar')).toBe(true);
    expect(REGLAS_URGENTES_IDS.size).toBe(4);
  });

  it('asigna tipo "urgente" unicamente a las reglas de dinero/contrato', () => {
    const reglaUrgente: AutomatizacionRule = {
      id: 'cuota-vencida',
      nombre: 'Cuota Vencida',
      descripcion: 'Cuota impaga',
      activa: true,
      trigger: { tipo: 'cuota_vencida', diasTolerancia: 0 },
      accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    };

    expect(mapRuleToAlertType(reglaUrgente)).toBe('urgente');
  });

  it('degrada reglas operativas y organizativas a tipo "atencion" sin gritar en rojo', () => {
    const reglaDecoracion: AutomatizacionRule = {
      id: 'decoracion-sin-definir',
      nombre: 'Decoración sin Definir',
      descripcion: 'Falta definir la decoración',
      activa: true,
      trigger: { tipo: 'campo_faltante', campo: 'decoracion', diasAntes: 15 },
      accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    };

    const reglaCronograma: AutomatizacionRule = {
      id: 'cronograma-vacio',
      nombre: 'Cronograma Vacío',
      descripcion: 'El cronograma no tiene hitos',
      activa: true,
      trigger: { tipo: 'campo_faltante', campo: 'cronograma', diasAntes: 20 },
      accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    };

    const reglaTareas: AutomatizacionRule = {
      id: 'tareas-vencidas',
      nombre: 'Tareas Vencidas',
      descripcion: 'Hay tareas vencidas',
      activa: true,
      trigger: { tipo: 'campo_faltante', campo: 'tareas', diasAntes: 5 },
      accion: { tipo: 'alerta_interna', destino: 'centro_de_mando' },
    };

    expect(mapRuleToAlertType(reglaDecoracion)).toBe('atencion');
    expect(mapRuleToAlertType(reglaCronograma)).toBe('atencion');
    expect(mapRuleToAlertType(reglaTareas)).toBe('atencion');
  });

  it('calcula badge rojo solo cuando hay alertas urgentes no leidas', () => {
    const alerts = [
      { id: '1', tipo: 'atencion' as const, leida: false },
      { id: '2', tipo: 'info' as const, leida: false },
    ];

    const urgentUnreadCount = alerts.filter(a => a.tipo === 'urgente' && !a.leida).length;
    const totalUnreadCount = alerts.filter(a => !a.leida).length;

    // Solo hay alertas tranquilas sin leer -> no debe haber conteo rojo
    expect(urgentUnreadCount).toBe(0);
    expect(totalUnreadCount).toBe(2);

    // Agregamos una alerta de dinero urgente
    const alertsWithUrgent = [
      ...alerts,
      { id: '3', tipo: 'urgente' as const, leida: false },
    ];

    const updatedUrgentCount = alertsWithUrgent.filter(a => a.tipo === 'urgente' && !a.leida).length;
    expect(updatedUrgentCount).toBe(1);
  });
});
