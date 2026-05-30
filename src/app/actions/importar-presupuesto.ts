'use server';

import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { parseBudgetText } from '@/lib/parse-budget-text';
import { initialFiestaActualData, defaultModulosContratados } from '@/lib/fiesta-defaults';
import { createNotification } from './notifications';
import { savePresupuesto } from './presupuestos';
import { saveFiesta } from './fiesta/fiesta.actions';

export interface ImportarPresupuestoOptions {
  crearFiesta?: boolean;
  senaManual?: number;
  eventoFechaOverride?: string;
}

type GuestBreakdown = {
  adultos: number;
  ninos: number;
  adolescentes: number;
  warnings: string[];
};

function parseImportedGuestBreakdown(texto: string, totalInvitados: number): GuestBreakdown {
  const lower = texto.toLowerCase();
  const warnings: string[] = [];

  const readCount = (patterns: RegExp[]) => {
    for (const pattern of patterns) {
      const match = lower.match(pattern);
      if (match) return Number(match[1] || match[2] || 0) || 0;
    }
    return 0;
  };

  const adultos = readCount([/(?:adultos?|mayores?)\D{0,20}(\d+)/, /(\d+)\s+(?:adultos?|mayores?)/]);
  const ninos = readCount([/(?:niños?|ninos?|menores?|infantiles?)\D{0,20}(\d+)/, /(\d+)\s+(?:niños?|ninos?|menores?|infantiles?)/]);
  const adolescentes = readCount([/(?:adolescentes?)\D{0,20}(\d+)/, /(\d+)\s+adolescentes?/]);
  const menores = ninos + adolescentes;

  if (adultos > 0 || menores > 0) {
    const resolvedAdultos = adultos > 0 ? adultos : Math.max(0, totalInvitados - menores);
    const resolvedTotal = resolvedAdultos + menores;
    if (totalInvitados > 0 && resolvedTotal !== totalInvitados) {
      warnings.push(`La importación detectó ${resolvedTotal} invitados discriminados, distinto al total ${totalInvitados}. Revisar adultos/niños.`);
    }
    return { adultos: resolvedAdultos, ninos, adolescentes, warnings };
  }

  if (totalInvitados > 0) {
    warnings.push('No se detectó desglose de adultos/niños/adolescentes. Se mantiene el total como adultos para no inventar menores.');
  }
  return { adultos: totalInvitados, ninos: 0, adolescentes: 0, warnings };
}

export async function importarPresupuestoDesdeTexto(
  texto: string,
  options: ImportarPresupuestoOptions = {}
): Promise<{ success: boolean; presupuestoId?: string; fiestaId?: string; warnings?: string[]; error?: string }> {
  if (!texto || texto.trim().length < 20) {
    return { success: false, error: 'El texto pegado está vacío o es demasiado corto.' };
  }

  const parsed = parseBudgetText(texto);
  if (!parsed.clienteNombre && parsed.items.length === 0) {
    return {
      success: false,
      error: 'No se pudo detectar información válida en el texto. Revisá el formato.',
      warnings: parsed.warnings,
    };
  }

  const eventoFecha = options.eventoFechaOverride || parsed.eventoFecha || '';
  const total = parsed.totalDeclarado;
  const senaPct = parsed.senaCondicion;
  const sena = options.senaManual !== undefined ? options.senaManual : Math.round(total * senaPct / 100);
  const guestBreakdown = parseImportedGuestBreakdown(texto, parsed.invitadosCantidad);
  parsed.warnings.push(...guestBreakdown.warnings);

  const notas = [
    parsed.notas,
    `Total declarado: $${total.toLocaleString('es-UY')}`,
    `Seña: $${sena.toLocaleString('es-UY')} (${senaPct}%)`,
    `Saldo: $${(total - sena).toLocaleString('es-UY')}`,
  ].filter(Boolean).join(' | ');

  const budgetData: Omit<Presupuesto, 'id'> = {
    clienteNombre: parsed.clienteNombre,
    eventoTipo: parsed.eventoTipo || 'Otro',
    eventoFecha,
    invitadosCantidad: parsed.invitadosCantidad,
    invitadosAdultos: guestBreakdown.adultos,
    invitadosNinos: guestBreakdown.ninos,
    invitadosAdolescentes: guestBreakdown.adolescentes,
    salonFiestas: parsed.salonFiestas || '',
    itemsPresupuestados: parsed.items as ItemPresupuestado[],
    costoTotalEstimado: total,
    totalConDescuento: total,
    notas,
    estado: 'Borrador',
    timestamp: new Date().toISOString(),
    source: 'manual',
  };

  const presupuestoResult = await savePresupuesto(budgetData, { source: 'manual', preserveTotal: total > 0 });
  if (!presupuestoResult.success || !presupuestoResult.id) {
    return {
      success: false,
      error: presupuestoResult.error || 'Error al guardar el presupuesto.',
      warnings: parsed.warnings,
    };
  }

  const presupuestoId = presupuestoResult.id;
  let fiestaId: string | undefined;

  if (options.crearFiesta) {
    try {
      const newFiesta: FiestaEnPlanificacion = {
        ...initialFiestaActualData,
        id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        presupuestoId,
        estado: 'En Planificación',
        configuracion: {
          ...initialFiestaActualData.configuracion,
          nombreEvento: `${parsed.eventoTipo || 'Evento'} de ${parsed.clienteNombre}`,
          tipoCelebracion: parsed.eventoTipo || 'Otro',
          fechaEvento: eventoFecha,
          invitadosEstimados: parsed.invitadosCantidad,
          invitadosAdultos: guestBreakdown.adultos,
          invitadosNinos: guestBreakdown.ninos,
          invitadosAdolescentes: guestBreakdown.adolescentes,
          presupuestoEstimado: total,
          nombreLugar: parsed.salonFiestas || '',
          clienteId: presupuestoResult.leadId,
          clienteNombre: parsed.clienteNombre,
        },
        modulosContratados: { ...defaultModulosContratados },
      };

      const fiestaResult = await saveFiesta(newFiesta);
      if (fiestaResult.success && fiestaResult.fiesta) {
        fiestaId = fiestaResult.fiesta.id;
        await createNotification({
          mensaje: `Nuevo evento creado desde presupuesto importado: ${newFiesta.configuracion.nombreEvento}`,
          href: `/fiestas/nueva?fiestaId=${fiestaId}`,
          icono: 'PartyPopper',
        });
      } else {
        parsed.warnings.push(`El presupuesto se creó pero no se pudo crear la fiesta: ${fiestaResult.error}`);
      }
    } catch (e: any) {
      parsed.warnings.push(`El presupuesto se creó pero hubo un error al crear la fiesta: ${e.message}`);
    }
  }

  return {
    success: true,
    presupuestoId,
    fiestaId,
    warnings: parsed.warnings.length > 0 ? parsed.warnings : undefined,
  };
}
