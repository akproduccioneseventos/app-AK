import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';

export type CategoriaErrorHumano =
  | 'plata_papeles'
  | 'vendido_vs_cargado'
  | 'comida'
  | 'personal_salon'
  | 'cliente';

export type NivelUrgencia =
  | 'peligro_2_dias'
  | 'urgente_7_dias'
  | 'atencion_15_dias'
  | 'planificacion_30_dias';

export interface AlertaErrorHumano {
  id: string;
  fiestaId: string;
  fiestaNombre: string;
  fechaEvento: string;
  diasRestantes: number;
  categoria: CategoriaErrorHumano;
  urgencia: NivelUrgencia;
  titulo: string;
  descripcion: string;
  accionUrl: string;
  accionLabel: string;
}

export interface DescarteAlerta {
  alertaId: string;
  motivo: string;
  descartadaEn: string;
  descartadaPor: string;
}

function calcularDiasRestantes(fechaStr: string, ahora = new Date()): number {
  if (!fechaStr) return 999;
  const target = new Date(fechaStr.includes('T') ? fechaStr : `${fechaStr}T12:00:00`);
  if (isNaN(target.getTime())) return 999;
  const diffMs = target.getTime() - ahora.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function determinarUrgencia(dias: number): NivelUrgencia {
  if (dias <= 2) return 'peligro_2_dias';
  if (dias <= 7) return 'urgente_7_dias';
  if (dias <= 15) return 'atencion_15_dias';
  return 'planificacion_30_dias';
}

export function detectarErroresHumanos(
  fiestas: FiestaEnPlanificacion[],
  presupuestos: Presupuesto[] = [],
  descartes: DescarteAlerta[] = [],
  ahora = new Date(),
): AlertaErrorHumano[] {
  const descartadasSet = new Set(descartes.map((d) => d.alertaId));
  const alertas: AlertaErrorHumano[] = [];

  const presupuestosMap = new Map<string, Presupuesto>();
  for (const p of presupuestos) {
    if (p.id) presupuestosMap.set(p.id, p);
  }

  // Agrupamiento para detección de conflictos de personal y salón
  const personalPorFecha = new Map<string, Array<{ empleadoNombre: string; fiestaId: string; fiestaNombre: string }>>();
  const salonPorFecha = new Map<string, Array<{ salon: string; fiestaId: string; fiestaNombre: string }>>();

  for (const fiesta of fiestas) {
    const estado = (fiesta.estado || '').toLowerCase();
    if (estado.includes('cancel') || estado.includes('archiv')) continue;

    const nombre = fiesta.configuracion?.nombreEvento || fiesta.configuracion?.nombreAgasajado || 'Fiesta sin nombre';
    const fechaStr = fiesta.configuracion?.fechaEvento || '';
    if (!fechaStr) continue;

    const dias = calcularDiasRestantes(fechaStr, ahora);
    const urgencia = determinarUrgencia(dias);
    const presupuesto = fiesta.presupuestoId ? presupuestosMap.get(fiesta.presupuestoId) : undefined;

    // -------------------------------------------------------------
    // 1. PLATA Y PAPELES
    // -------------------------------------------------------------

    // A) Contrato sin firmar faltando <= 30 días
    const tieneContrato = Boolean(
      fiesta.contratoFirmaInfo?.isSigned ||
      fiesta.contratoGenerado?.fecha ||
      fiesta.contratoServicioTexto
    );
    if (!tieneContrato && dias >= 0 && dias <= 30) {
      alertas.push({
        id: `contrato_sin_firmar_${fiesta.id}`,
        fiestaId: fiesta.id,
        fiestaNombre: nombre,
        fechaEvento: fechaStr,
        diasRestantes: dias,
        categoria: 'plata_papeles',
        urgencia,
        titulo: 'Contrato sin firmar',
        descripcion: `Falta firmar el contrato de la fiesta de ${nombre} (faltan ${dias} día${dias === 1 ? '' : 's'}).`,
        accionUrl: `/fiestas/nueva/gestion-documental?fiestaId=${fiesta.id}`,
        accionLabel: 'Ver contrato',
      });
    }

    // B) Seña no cobrada faltando <= 15 días
    if (presupuesto && dias >= 0 && dias <= 15) {
      const pagosConfirmados = (presupuesto.pagosCliente || [])
        .filter((p) => p.estadoPago !== 'rechazado')
        .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
      const seniaPactada = Number(presupuesto.senia || 0) || (presupuesto.costoTotalEstimado * 0.1);
      if (pagosConfirmados < seniaPactada && seniaPactada > 0) {
        alertas.push({
          id: `sena_sin_cobrar_${fiesta.id}`,
          fiestaId: fiesta.id,
          fiestaNombre: nombre,
          fechaEvento: fechaStr,
          diasRestantes: dias,
          categoria: 'plata_papeles',
          urgencia,
          titulo: 'Seña no cobrada',
          descripcion: `La fiesta de ${nombre} no tiene la seña abonada faltando ${dias} días para la fecha.`,
          accionUrl: `/presupuestos/${presupuesto.id}/ver`,
          accionLabel: 'Ver presupuesto y cobros',
        });
      }
    }

    // C) Saldo sin cobrar con fiesta ya pasada
    if (presupuesto && dias < 0) {
      const pagos = (presupuesto.pagosCliente || [])
        .filter((p) => p.estadoPago !== 'rechazado')
        .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
      const total = Number(presupuesto.totalConDescuento || presupuesto.costoTotalEstimado || 0);
      const saldo = total - pagos;
      if (saldo > 500) {
        alertas.push({
          id: `saldo_impago_pasado_${fiesta.id}`,
          fiestaId: fiesta.id,
          fiestaNombre: nombre,
          fechaEvento: fechaStr,
          diasRestantes: dias,
          categoria: 'plata_papeles',
          urgencia: 'urgente_7_dias',
          titulo: 'Saldo pendiente de fiesta realizada',
          descripcion: `Quedan $${saldo.toLocaleString('es-UY')} sin cobrar de la fiesta de ${nombre} que ya pasó hace ${Math.abs(dias)} días.`,
          accionUrl: `/presupuestos/${presupuesto.id}/ver`,
          accionLabel: 'Registrar cobro',
        });
      }
    }

    // D) Fiesta cobrada sin factura emitida
    if (presupuesto) {
      const pagos = (presupuesto.pagosCliente || [])
        .filter((p) => p.estadoPago !== 'rechazado')
        .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
      const total = Number(presupuesto.totalConDescuento || presupuesto.costoTotalEstimado || 0);
      const estaPagado = total > 0 && pagos >= (total - 100);
      const tieneFactura = Array.isArray(fiesta.invoiceIds) && fiesta.invoiceIds.length > 0;
      if (estaPagado && !tieneFactura && dias <= 7) {
        alertas.push({
          id: `sin_factura_${fiesta.id}`,
          fiestaId: fiesta.id,
          fiestaNombre: nombre,
          fechaEvento: fechaStr,
          diasRestantes: dias,
          categoria: 'plata_papeles',
          urgencia: 'atencion_15_dias',
          titulo: 'Fiesta cobrada sin factura emitida',
          descripcion: `La fiesta de ${nombre} fue cobrada en su totalidad pero aún no tiene factura emitida.`,
          accionUrl: `/invoices`,
          accionLabel: 'Emitir factura',
        });
      }
    }

    // -------------------------------------------------------------
    // 2. LO VENDIDO CONTRA LO CARGADO
    // -------------------------------------------------------------
    if (presupuesto && dias >= 0 && dias <= 30) {
      // Discrepancia en cantidad de invitados
      const cantPresupuesto = Number(presupuesto.invitadosCantidad || 0);
      const cantFiesta = (Number(fiesta.configuracion?.invitadosAdultos || 0) + Number(fiesta.configuracion?.invitadosNinos || 0));
      if (cantPresupuesto > 0 && cantFiesta > 0 && Math.abs(cantPresupuesto - cantFiesta) > 5) {
        alertas.push({
          id: `discrepancia_invitados_${fiesta.id}`,
          fiestaId: fiesta.id,
          fiestaNombre: nombre,
          fechaEvento: fechaStr,
          diasRestantes: dias,
          categoria: 'vendido_vs_cargado',
          urgencia,
          titulo: 'Diferencia en cantidad de invitados',
          descripcion: `El presupuesto indica ${cantPresupuesto} invitados pero la fiesta tiene ${cantFiesta} cargados.`,
          accionUrl: `/fiestas/nueva/invitados?fiestaId=${fiesta.id}`,
          accionLabel: 'Ver lista de invitados',
        });
      }
    }

    // -------------------------------------------------------------
    // 3. COMIDA
    // -------------------------------------------------------------
    if (dias >= 0 && dias <= 20) {
      const tieneMenu = Boolean(
        fiesta.menuAsignadoId ||
        fiesta.menuMesa?.platoPrincipal ||
        (fiesta.menuSeleccionPortal as any)?.seleccionPrincipalId
      );
      if (!tieneMenu) {
        alertas.push({
          id: `menu_sin_definir_${fiesta.id}`,
          fiestaId: fiesta.id,
          fiestaNombre: nombre,
          fechaEvento: fechaStr,
          diasRestantes: dias,
          categoria: 'comida',
          urgencia,
          titulo: 'Menú sin definir',
          descripcion: `Menú sin elegir para la fiesta de ${nombre} (faltan ${dias} días).`,
          accionUrl: `/fiestas/nueva/catering?fiestaId=${fiesta.id}`,
          accionLabel: 'Asignar menú',
        });
      }
    }

    // Alergias registradas sin reflejar
    if (dias >= 0 && dias <= 15) {
      const hayAlergias = (fiesta.invitados || []).some(
        (i) => Boolean((i as any).alergias || (i as any).dietaEspecial || (i as any).menuEspecial)
      );
      const tieneNotasAlergias = Boolean(
        (fiesta as any).catering?.menuCeliecos ||
        (fiesta as any).catering?.menuVegetarianos ||
        (fiesta as any).catering?.observacionesAlergias ||
        (fiesta.menuMesa as any)?.observacionesEspeciales
      );
      if (hayAlergias && !tieneNotasAlergias) {
        alertas.push({
          id: `alergias_sin_menu_${fiesta.id}`,
          fiestaId: fiesta.id,
          fiestaNombre: nombre,
          fechaEvento: fechaStr,
          diasRestantes: dias,
          categoria: 'comida',
          urgencia,
          titulo: 'Alergias sin menú especial asignado',
          descripcion: `Hay invitados con alergias o dietas especiales registradas en la fiesta de ${nombre} que no figuran en el catering.`,
          accionUrl: `/fiestas/nueva/catering?fiestaId=${fiesta.id}`,
          accionLabel: 'Revisar catering y alergias',
        });
      }
    }

    // Lista de compras sin generar
    if (dias >= 0 && dias <= 7) {
      const tieneCatering = Boolean(fiesta.menuAsignadoId || fiesta.modulosContratados?.catering);
      const tieneCompras = Array.isArray(fiesta.estadosCompra) && fiesta.estadosCompra.length > 0;
      if (tieneCatering && !tieneCompras) {
        alertas.push({
          id: `compras_sin_generar_${fiesta.id}`,
          fiestaId: fiesta.id,
          fiestaNombre: nombre,
          fechaEvento: fechaStr,
          diasRestantes: dias,
          categoria: 'comida',
          urgencia: 'urgente_7_dias',
          titulo: 'Lista de compras sin generar',
          descripcion: `A ${dias} días del evento de ${nombre} no se ha generado la lista de compras de insumos.`,
          accionUrl: `/fiestas/nueva/lista-compras?fiestaId=${fiesta.id}`,
          accionLabel: 'Generar lista de compras',
        });
      }
    }

    // -------------------------------------------------------------
    // 4. GENTE Y SALÓN
    // -------------------------------------------------------------
    if (dias >= 0 && dias <= 10) {
      const tienePersonal = Array.isArray(fiesta.personalAsignado) && fiesta.personalAsignado.length > 0;
      if (!tienePersonal) {
        alertas.push({
          id: `personal_sin_asignar_${fiesta.id}`,
          fiestaId: fiesta.id,
          fiestaNombre: nombre,
          fechaEvento: fechaStr,
          diasRestantes: dias,
          categoria: 'personal_salon',
          urgencia,
          titulo: 'Personal sin asignar',
          descripcion: `Personal sin asignar para la fiesta de ${nombre} (faltan ${dias} días).`,
          accionUrl: `/fiestas/nueva/personal?fiestaId=${fiesta.id}`,
          accionLabel: 'Asignar personal',
        });
      }
    }

    // Conflictos de fecha para personal
    if (Array.isArray(fiesta.personalAsignado) && dias >= 0 && dias <= 15) {
      const lista = personalPorFecha.get(fechaStr) || [];
      for (const p of fiesta.personalAsignado) {
        const pNombre = (p as any).nombre || (p as any).empleadoNombre || (p as any).empleadoId;
        if (pNombre) {
          lista.push({ empleadoNombre: pNombre, fiestaId: fiesta.id, fiestaNombre: nombre });
        }
      }
      personalPorFecha.set(fechaStr, lista);
    }

    // Conflictos de salón
    const salon = fiesta.configuracion?.nombreLugar || (fiesta.configuracion as any)?.salon;
    if (salon && salon !== 'A coordinar' && dias >= 0 && dias <= 30) {
      const lista = salonPorFecha.get(fechaStr) || [];
      lista.push({ salon, fiestaId: fiesta.id, fiestaNombre: nombre });
      salonPorFecha.set(fechaStr, lista);
    }

    // -------------------------------------------------------------
    // 5. EL CLIENTE
    // -------------------------------------------------------------
    if (dias >= 0 && dias <= 30) {
      const tienePortal = Boolean(fiesta.clientPortalSettings?.accessKey || (fiesta.configuracion as any)?.accessKey);
      if (!tienePortal) {
        alertas.push({
          id: `portal_sin_acceso_${fiesta.id}`,
          fiestaId: fiesta.id,
          fiestaNombre: nombre,
          fechaEvento: fechaStr,
          diasRestantes: dias,
          categoria: 'cliente',
          urgencia,
          titulo: 'Portal del cliente sin acceso entregado',
          descripcion: `El cliente de la fiesta de ${nombre} no tiene llave de acceso al portal generada.`,
          accionUrl: `/fiestas/nueva?fiestaId=${fiesta.id}`,
          accionLabel: 'Configurar portal',
        });
      }
    }

    if (dias >= 0 && dias <= 15) {
      const tieneInvitados = Array.isArray(fiesta.invitados) && fiesta.invitados.length > 0;
      if (!tieneInvitados) {
        alertas.push({
          id: `invitados_sin_cargar_${fiesta.id}`,
          fiestaId: fiesta.id,
          fiestaNombre: nombre,
          fechaEvento: fechaStr,
          diasRestantes: dias,
          categoria: 'cliente',
          urgencia,
          titulo: 'Lista de invitados vacía',
          descripcion: `A ${dias} días de la fiesta de ${nombre} no se han cargado invitados en el sistema.`,
          accionUrl: `/fiestas/nueva/invitados?fiestaId=${fiesta.id}`,
          accionLabel: 'Cargar invitados',
        });
      }
    }
  }

  // Detectar conflictos de personal en la misma fecha
  for (const [fecha, lista] of personalPorFecha.entries()) {
    const conteo = new Map<string, Array<{ fiestaId: string; fiestaNombre: string }>>();
    for (const item of lista) {
      const prev = conteo.get(item.empleadoNombre) || [];
      prev.push({ fiestaId: item.fiestaId, fiestaNombre: item.fiestaNombre });
      conteo.set(item.empleadoNombre, prev);
    }

    for (const [empleado, fiestasAsignadas] of conteo.entries()) {
      if (fiestasAsignadas.length > 1) {
        const primeraFiesta = fiestasAsignadas[0];
        const nombresFiestas = fiestasAsignadas.map((f) => f.fiestaNombre).join(' y ');
        alertas.push({
          id: `conflicto_personal_${empleado}_${fecha}`,
          fiestaId: primeraFiesta.fiestaId,
          fiestaNombre: nombresFiestas,
          fechaEvento: fecha,
          diasRestantes: calcularDiasRestantes(fecha, ahora),
          categoria: 'personal_salon',
          urgencia: 'urgente_7_dias',
          titulo: 'Conflicto: Personal asignado a dos eventos',
          descripcion: `${empleado} está asignado a múltiples fiestas el mismo día (${fecha}): ${nombresFiestas}.`,
          accionUrl: `/fiestas/nueva/personal?fiestaId=${primeraFiesta.fiestaId}`,
          accionLabel: 'Resolver asignación',
        });
      }
    }
  }

  // Detectar conflictos de salón en la misma fecha
  for (const [fecha, lista] of salonPorFecha.entries()) {
    const conteo = new Map<string, Array<{ fiestaId: string; fiestaNombre: string }>>();
    for (const item of lista) {
      const prev = conteo.get(item.salon) || [];
      prev.push({ fiestaId: item.fiestaId, fiestaNombre: item.fiestaNombre });
      conteo.set(item.salon, prev);
    }

    for (const [salon, fiestasAsignadas] of conteo.entries()) {
      if (fiestasAsignadas.length > 1) {
        const primeraFiesta = fiestasAsignadas[0];
        const nombresFiestas = fiestasAsignadas.map((f) => f.fiestaNombre).join(' y ');
        alertas.push({
          id: `conflicto_salon_${salon}_${fecha}`,
          fiestaId: primeraFiesta.fiestaId,
          fiestaNombre: nombresFiestas,
          fechaEvento: fecha,
          diasRestantes: calcularDiasRestantes(fecha, ahora),
          categoria: 'personal_salon',
          urgencia: 'peligro_2_dias',
          titulo: 'Conflicto: Dos fiestas en el mismo salón',
          descripcion: `Hay dos fiestas asignadas a '${salon}' el mismo día (${fecha}): ${nombresFiestas}.`,
          accionUrl: `/fiestas/nueva?fiestaId=${primeraFiesta.fiestaId}`,
          accionLabel: 'Verificar salón',
        });
      }
    }
  }

  // Filtrar las alertas descartadas
  return alertas
    .filter((a) => !descartadasSet.has(a.id))
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}

