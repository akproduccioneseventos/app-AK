import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { ReadinessReport, RiesgoItem, NivelRiesgo } from '@/types/readiness';

export function calculateReadinessScore(fiesta: FiestaEnPlanificacion): ReadinessReport {
  let score = 100;
  const riesgos: RiesgoItem[] = [];
  const accionesSugeridas: string[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let riesgoCounter = 0;
  const nextRiesgoId = (prefix: string) => `risk_${prefix}_${Date.now()}_${++riesgoCounter}`;

  // --- Tareas vencidas ---
  const tareas = fiesta.tareas ?? [];
  const tareasVencidas = tareas.filter(t => {
    if (t.completada) return false;
    if (!t.fechaLimite) return false;
    return new Date(t.fechaLimite) < today;
  });

  const deduccionTareas = Math.min(tareasVencidas.length * 5, 25);
  score -= deduccionTareas;

  if (tareasVencidas.length > 0) {
    const nivel: NivelRiesgo = tareasVencidas.length >= 5 ? 'Critico' : tareasVencidas.length >= 3 ? 'Alto' : 'Medio';
    riesgos.push({
      id: nextRiesgoId('tareas'),
      descripcion: `${tareasVencidas.length} tarea(s) vencida(s) sin completar`,
      nivelRiesgo: nivel,
      modulo: 'tareas',
      accionSugerida: 'Revisar y completar o reprogramar las tareas vencidas.',
    });
    accionesSugeridas.push('Revisar tareas vencidas y actualizar su estado.');
  }

  // --- Pagos pendientes (cuotas del plan de pagos) ---
  let pagosPendientes = 0;
  const planPago = (fiesta as any).planPago;
  if (planPago?.cuotas) {
    pagosPendientes = planPago.cuotas.filter(
      (c: any) => c.estado === 'pendiente' || c.estado === 'vencido'
    ).length;
  }

  const deduccionPagos = Math.min(pagosPendientes * 5, 20);
  score -= deduccionPagos;

  if (pagosPendientes > 0) {
    const nivel: NivelRiesgo = pagosPendientes >= 3 ? 'Alto' : 'Medio';
    riesgos.push({
      id: nextRiesgoId('pagos'),
      descripcion: `${pagosPendientes} cuota(s) de pago pendientes o vencidas`,
      nivelRiesgo: nivel,
      modulo: 'costos',
      accionSugerida: 'Gestionar pagos pendientes para evitar incumplimientos contractuales.',
    });
    accionesSugeridas.push('Gestionar pagos pendientes con los clientes.');
  }

  // --- Proveedores no confirmados ---
  const estadosCompra = fiesta.estadosCompra ?? [];
  const proveedoresNoConfirmados = estadosCompra.filter(e => !e.pagado).length;

  const deduccionProveedores = Math.min(proveedoresNoConfirmados * 5, 20);
  score -= deduccionProveedores;

  if (proveedoresNoConfirmados > 0) {
    const nivel: NivelRiesgo = proveedoresNoConfirmados >= 3 ? 'Alto' : 'Medio';
    riesgos.push({
      id: nextRiesgoId('proveedores'),
      descripcion: `${proveedoresNoConfirmados} proveedor(es) sin pago confirmado`,
      nivelRiesgo: nivel,
      modulo: 'proveedores',
      accionSugerida: 'Confirmar pagos y pedidos con todos los proveedores.',
    });
    accionesSugeridas.push('Confirmar estado de pagos con proveedores.');
  }

  // --- Catering contratado pero sin datos ---
  let cateringStatus = 'No contratado';
  const cateringContratado = fiesta.modulosContratados?.catering === true;
  const tieneDatosCatering =
    !!(fiesta as any).catering ||
    !!(fiesta.menuMesa?.categorias?.length) ||
    !!(fiesta.bebidas?.categorias?.length);

  if (cateringContratado) {
    if (tieneDatosCatering) {
      cateringStatus = 'Configurado';
    } else {
      cateringStatus = 'Pendiente de configuración';
      score -= 10;
      riesgos.push({
        id: nextRiesgoId('catering'),
        descripcion: 'Catering contratado sin menú configurado',
        nivelRiesgo: 'Alto',
        modulo: 'catering',
        accionSugerida: 'Configurar el menú y detalles del catering.',
      });
      accionesSugeridas.push('Completar la configuración del catering y menú.');
    }
  }

  // --- Documentos faltantes ---
  const docsAusentes = (fiesta.othersDocumentos ?? []).length === 0 ? 1 : 0;
  if (docsAusentes > 0) {
    score -= 5;
    riesgos.push({
      id: nextRiesgoId('docs'),
      descripcion: 'No hay documentos adjuntos al evento',
      nivelRiesgo: 'Bajo',
      modulo: 'documentos',
      accionSugerida: 'Adjuntar contratos, presupuestos y documentos relevantes.',
    });
  }

  score = Math.max(0, Math.min(100, score));

  const prioridades: string[] = riesgos
    .sort((a, b) => {
      const orden: Record<NivelRiesgo, number> = { Critico: 0, Alto: 1, Medio: 2, Bajo: 3 };
      return orden[a.nivelRiesgo] - orden[b.nivelRiesgo];
    })
    .slice(0, 3)
    .map(r => r.descripcion);

  return {
    fiestaId: fiesta.id,
    calculadoEn: new Date().toISOString(),
    porcentajeReadiness: score,
    riesgos,
    prioridades,
    accionesSugeridas,
    detalles: {
      tareasVencidas: tareasVencidas.length,
      pagosPendientes,
      docsAusentes,
      proveedoresNoConfirmados,
      cateringStatus,
    },
  };
}

export function getReadinessColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function getReadinessLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bueno';
  if (score >= 40) return 'En Riesgo';
  return 'Crítico';
}
