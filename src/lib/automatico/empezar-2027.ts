import 'server-only';

import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { FiestaHistorica } from '@/types/fiesta-historica';
import type { Invoice } from '@/types/invoice';
import type { Customer } from '@/types/customer';
import type { CompanyInfo, ContractTemplateItem } from '@/types/settings';
import { defaultCompanyInfo } from '@/types/settings';
import { CONTRACT_TEMPLATE } from '@/lib/contract-template';
import { initialFiestaActualData, defaultModulosContratados } from '@/lib/fiesta-defaults';
import { codigoDeFiesta } from '@/lib/fiesta/codigo-fiesta';
import { perfilDe } from '@/lib/auth/perfiles';
import { verifySession } from '@/lib/auth/session-token';
import { esSesionDeAuditor, esSesionDeSoloLectura } from '@/lib/auth/solo-lectura';
import { normalizePresupuestoFinancials } from '@/lib/budget/financial-guardrails';
import {
  buildSalonContractDraft,
  esSalonClubUruguay,
  formatFechaContrato,
  generarTextoContratoServicios,
  hoyContratoTexto,
} from '@/lib/contratos/generar-textos-contrato';

const MIGRACION_COLLECTION = 'migraciones';
const MIGRACION_DOC_ID = 'empezar-2027';
const FECHA_CORTE_2027 = '2027-01-01';

export interface OpcionesEmpezar2027 {
  readDataFn?: <T>(filePath: string, defaultValue: T) => Promise<T>;
  writeDataFn?: <T>(
    filePath: string,
    data: T,
    sortFn?: (a: any, b: any) => number,
    options?: { skipAutoBackup?: boolean; esRestauracion?: boolean },
  ) => Promise<void>;
  crearRespaldoFn?: () => Promise<{ success: boolean; error?: string; point?: unknown }>;
  getDbFn?: () => Promise<any>;
  crearNotificacionFn?: (data: {
    titulo?: string;
    mensaje: string;
    tipo?: 'info' | 'aviso' | 'urgente' | 'exito' | 'alerta';
    href?: string;
    link?: string;
    modulo?: string;
    icono?: string;
    rolDestino?: string;
  }) => Promise<unknown>;
  currentUid?: string;
  currentRole?: string;
  currentPerfil?: string;
  isSoloLectura?: boolean;
  ahora?: Date;
}

export interface ResultadoEmpezar2027 {
  success?: boolean;
  omitido?: 'solo_dueno';
  yaCorrio?: boolean;
  fallo?: 'respaldo' | 'migracion';
  error?: string;
  presupuestosBorrados?: number;
  fiestasBorradas?: number;
  presupuestos2027?: number;
  fiestasCreadas?: number;
  contratosGenerados?: number;
  contratosSalonGenerados?: number;
  protegidos?: number;
  advertencias?: string[];
  erroresParciales?: string[];
}

function parseIsoDateKey(fecha?: string | null): string | null {
  if (!fecha || typeof fecha !== 'string') return null;
  const trimmed = fecha.trim();
  if (!trimmed) return null;
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (
      d.getUTCFullYear() === year &&
      d.getUTCMonth() === month - 1 &&
      d.getUTCDate() === day
    ) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    return null;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function esFechaDesde2027(fecha?: string | null): boolean {
  const key = parseIsoDateKey(fecha);
  return Boolean(key && key >= FECHA_CORTE_2027);
}

function getFiestaSubjectName(input: {
  protagonista1Nombre?: string;
  protagonista2Nombre?: string;
  clienteNombre?: string;
  eventoTipo?: string;
}) {
  const protagonista1 = input.protagonista1Nombre?.trim();
  const protagonista2 = input.protagonista2Nombre?.trim();
  const cliente = input.clienteNombre?.trim();
  if (protagonista1 && protagonista2) return `${protagonista1} y ${protagonista2}`;
  if (protagonista1) return protagonista1;
  if (cliente) return cliente;
  if (input.eventoTipo === 'XV años') return 'la Quinceañera';
  if (input.eventoTipo === 'Boda') return 'los Novios';
  return 'el Agasajado';
}

function buildFiestaNameFromBudget(input: {
  protagonista1Nombre?: string;
  protagonista2Nombre?: string;
  clienteNombre?: string;
  eventoTipo?: string;
}) {
  const tipo = input.eventoTipo?.trim() || 'Evento';
  return `${tipo} de ${getFiestaSubjectName(input)}`;
}

export function buildFiestaFromPresupuesto(presupuesto: Presupuesto): FiestaEnPlanificacion {
  const id = `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return {
    ...initialFiestaActualData,
    id,
    presupuestoId: presupuesto.id,
    codigoFiesta: codigoDeFiesta({ id }),
    estado: 'En Planificación',
    configuracion: {
      ...initialFiestaActualData.configuracion,
      nombreEvento: buildFiestaNameFromBudget(presupuesto),
      tipoCelebracion: presupuesto.eventoTipo,
      fechaEvento: presupuesto.eventoFecha || '',
      invitadosEstimados: presupuesto.invitadosCantidad,
      invitadosAdultos: presupuesto.invitadosAdultos,
      invitadosNinos: presupuesto.invitadosNinos,
      invitadosAdolescentes: presupuesto.invitadosAdolescentes,
      presupuestoEstimado: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
      nombreLugar: presupuesto.salonFiestas || '',
      clienteId: presupuesto.leadId,
      clienteNombre: presupuesto.clienteNombre,
    },
    modulosContratados: { ...defaultModulosContratados },
  };
}

async function validarPerfilDueno(opciones: OpcionesEmpezar2027): Promise<boolean> {
  if (opciones.isSoloLectura) return false;

  const tieneRolInyectado =
    opciones.currentRole !== undefined ||
    opciones.currentPerfil !== undefined ||
    opciones.currentUid !== undefined;

  if (tieneRolInyectado) {
    const rawRole = String(opciones.currentRole || '').toLowerCase().trim();
    const rawPerfil = String(opciones.currentPerfil || '').toLowerCase().trim();
    if (
      rawRole === 'auditor' ||
      rawPerfil === 'auditor' ||
      rawRole === 'solo_lectura' ||
      rawPerfil === 'solo_lectura' ||
      rawRole === 'solo-lectura' ||
      rawPerfil === 'solo-lectura'
    ) {
      return false;
    }
    const normalizedRole = rawRole === 'dueño' ? 'dueno' : rawRole;
    const normalizedPerfil = rawPerfil === 'dueño' ? 'dueno' : rawPerfil;
    if (!normalizedRole && !normalizedPerfil) return false;
    return perfilDe({
      perfil: normalizedPerfil || undefined,
      role: normalizedRole || undefined,
    }) === 'dueno';
  }

  if (await esSesionDeSoloLectura()) return false;
  if (await esSesionDeAuditor()) return false;

  const session = await verifySession().catch(() => ({ success: false as const }));
  if (!session.success || !(session as any).user) return false;
  const user = (session as any).user;
  if (user.perfil === 'auditor' || user.role === 'auditor') return false;
  return perfilDe(user) === 'dueno';
}

function resolveServiciosTemplate(
  savedTemplates: ContractTemplateItem[],
  legacyTemplate: string,
): { templateText: string; plantillaId: string } {
  const byId = savedTemplates.find((t) => t.id === 'default-servicios');
  const byType = savedTemplates.find((t) => t.type === 'servicios' && t.isDefault !== false)
    || savedTemplates.find((t) => t.type === 'servicios');
  const stored = byId || byType;

  if (!stored) {
    return {
      templateText: legacyTemplate || CONTRACT_TEMPLATE,
      plantillaId: 'default-servicios',
    };
  }

  const isOldDefault =
    stored.template.includes('$5.000 cada') ||
    stored.template.includes('un total de $5.000 (pesos uruguayos cinco mil)') ||
    stored.template.includes('aumentar hasta un 30%') ||
    stored.template.includes('aumentarse hasta 30%');

  return {
    templateText: isOldDefault ? CONTRACT_TEMPLATE : (stored.template || CONTRACT_TEMPLATE),
    plantillaId: stored.id || 'default-servicios',
  };
}

function toPlainData(valor: unknown): unknown {
  if (valor === null || typeof valor !== 'object') return valor;
  const v = valor as { toDate?: () => Date };
  if (typeof v.toDate === 'function') {
    const d = v.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
  }
  if (valor instanceof Date) return valor.toISOString();
  if (Array.isArray(valor)) return valor.map(toPlainData);
  const out: Record<string, unknown> = {};
  for (const [k, item] of Object.entries(valor as Record<string, unknown>)) {
    out[k] = toPlainData(item);
  }
  return out;
}

async function leerFiestasParaMigracion(
  db: any,
  readDataFn: NonNullable<OpcionesEmpezar2027['readDataFn']>,
  usaReadInyectado: boolean,
): Promise<FiestaEnPlanificacion[]> {
  if (!usaReadInyectado && db && process.env.AK_USE_LOCAL_JSON_ONLY !== 'true') {
    const snap = await db.collection('fiestas').get();
    return snap.docs.map((doc: any) => {
      const data = toPlainData(doc.data()) as Record<string, unknown>;
      delete data._syncedAt;
      if (!data.id) data.id = doc.id;
      return data as unknown as FiestaEnPlanificacion;
    });
  }
  const list = await readDataFn<FiestaEnPlanificacion[]>('fiestas.json', []);
  return Array.isArray(list) ? list : [];
}

async function unlinkLocalFiesta(fiestaId: string): Promise<void> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  for (const root of [
    path.join(process.cwd(), 'data', 'fiestas'),
    path.join(process.cwd(), 'src', 'data', 'fiestas'),
  ]) {
    try {
      await fs.unlink(path.join(root, `${fiestaId}.json`));
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        throw err;
      }
    }
  }
}

export async function correrMigracionEmpezar2027(
  opciones: OpcionesEmpezar2027 = {},
): Promise<ResultadoEmpezar2027> {
  const esDueno = await validarPerfilDueno(opciones);
  if (!esDueno) {
    return { omitido: 'solo_dueno' };
  }

  const readDataFn =
    opciones.readDataFn ||
    (async <T>(filePath: string, defaultValue: T) => {
      const { readData } = await import('@/lib/data-service');
      return readData<T>(filePath, defaultValue);
    });

  const writeDataFn =
    opciones.writeDataFn ||
    (async <T>(
      filePath: string,
      data: T,
      sortFn?: (a: any, b: any) => number,
      options?: { skipAutoBackup?: boolean; esRestauracion?: boolean },
    ) => {
      const { writeData } = await import('@/lib/data-service');
      return writeData<T>(filePath, data, sortFn, options);
    });

  const crearRespaldoFn =
    opciones.crearRespaldoFn ||
    (async () => {
      const { createRestorePoint } = await import('@/app/actions/backup');
      return createRestorePoint();
    });

  const getDbFn =
    opciones.getDbFn ||
    (async () => {
      const { dbAdmin } = await import('@/lib/firebase/server');
      return dbAdmin;
    });

  const crearNotificacionFn =
    opciones.crearNotificacionFn ||
    (async (data: any) => {
      const { createNotification } = await import('@/lib/notifications/create-notification');
      return createNotification(data);
    });

  const db = await getDbFn();
  if (!db) {
    return {
      success: false,
      fallo: 'migracion',
      error: 'Firestore no está disponible para ejecutar la migración Empezar 2027.',
    };
  }

  const ahora = opciones.ahora || new Date();
  const ahoraIso = ahora.toISOString();
  const todayText = hoyContratoTexto(ahora);
  const migracionRef = db.collection(MIGRACION_COLLECTION).doc(MIGRACION_DOC_ID);

  let yaCorrio = false;
  await db.runTransaction(async (tx: any) => {
    yaCorrio = false;
    const snap = await tx.get(migracionRef);
    if (snap.exists) {
      const data = (typeof snap.data === 'function' ? snap.data() : snap.data) || {};
      if (
        data.estado === 'en_progreso' ||
        data.estado === 'completada' ||
        data.estado === 'con_observaciones'
      ) {
        yaCorrio = true;
        return;
      }
    }
    tx.set(migracionRef, {
      estado: 'en_progreso',
      iniciadaEn: ahoraIso,
      iniciadaPor: opciones.currentUid || 'dueno',
    });
  });

  if (yaCorrio) {
    return { yaCorrio: true };
  }

  let backupRes: { success: boolean; error?: string; point?: unknown };
  try {
    backupRes = await crearRespaldoFn();
  } catch (err: any) {
    backupRes = { success: false, error: err?.message || String(err) };
  }

  if (!backupRes || !backupRes.success) {
    const errorMsg = backupRes?.error || 'No se pudo completar el respaldo previo.';
    await migracionRef
      .set(
        {
          estado: 'fallo',
          iniciadaEn: ahoraIso,
          falloEn: new Date().toISOString(),
          error: errorMsg,
        },
        { merge: true },
      )
      .catch(() => null);

    await crearNotificacionFn({
      titulo: 'Migración Empezar 2027 detenida: falló el respaldo',
      mensaje: `No se borró ni modificó ningún presupuesto ni fiesta porque falló el respaldo previo: ${errorMsg}`,
      tipo: 'urgente',
      rolDestino: 'admin',
      href: '/settings',
      icono: 'AlertTriangle',
    }).catch(() => null);

    return {
      success: false,
      yaCorrio: false,
      fallo: 'respaldo',
      error: errorMsg,
    };
  }

  try {
    const usaReadInyectado = Boolean(opciones.readDataFn);
    const usaWriteInyectado = Boolean(opciones.writeDataFn);

    const [
      presupuestosRaw,
      fiestasRaw,
      historicasRaw,
      invoicesRaw,
      customersRaw,
      companyRaw,
      templatesRaw,
      legacyTemplateRaw,
    ] = await Promise.all([
      readDataFn<Presupuesto[]>('presupuestos.json', []),
      leerFiestasParaMigracion(db, readDataFn, usaReadInyectado),
      readDataFn<FiestaHistorica[]>('fiestas-historicas.json', []),
      readDataFn<Invoice[]>('invoices.json', []),
      readDataFn<Customer[]>('customers.json', []),
      readDataFn<Partial<CompanyInfo>>('company-info.json', {}),
      readDataFn<ContractTemplateItem[]>('contract-templates.json', []),
      readDataFn<string>('contract-template.json', CONTRACT_TEMPLATE),
    ]);

    const presupuestos = Array.isArray(presupuestosRaw) ? presupuestosRaw : [];
    const fiestas = Array.isArray(fiestasRaw) ? fiestasRaw : [];
    const fiestasHistoricas = Array.isArray(historicasRaw) ? historicasRaw : [];
    const invoices = Array.isArray(invoicesRaw) ? invoicesRaw : [];
    const customers = Array.isArray(customersRaw) ? customersRaw : [];
    const companyInfo: CompanyInfo = { ...defaultCompanyInfo, ...(companyRaw || {}) };
    const { templateText: serviciosTemplateText, plantillaId: serviciosPlantillaId } =
      resolveServiciosTemplate(
        Array.isArray(templatesRaw) ? templatesRaw : [],
        typeof legacyTemplateRaw === 'string' ? legacyTemplateRaw : CONTRACT_TEMPLATE,
      );

    const historicasIds = new Set(fiestasHistoricas.map((h) => h.id).filter(Boolean));
    const historicasPresupuestoIds = new Set(
      fiestasHistoricas.map((h) => (h as any).presupuestoId).filter(Boolean),
    );
    const customersById = new Map(customers.map((c) => [c.id, c]));

    const fiestasByPresupuestoId = new Map<string, FiestaEnPlanificacion[]>();
    for (const fiesta of fiestas) {
      if (fiesta.presupuestoId) {
        const list = fiestasByPresupuestoId.get(fiesta.presupuestoId) || [];
        list.push(fiesta);
        fiestasByPresupuestoId.set(fiesta.presupuestoId, list);
      }
    }

    const invoicesById = new Map<string, Invoice>();
    const invoicesByPresupuestoId = new Map<string, Invoice[]>();
    const invoicesByFiestaId = new Map<string, Invoice[]>();
    for (const inv of invoices) {
      if (inv.id) invoicesById.set(inv.id, inv);
      if (inv.sourcePresupuestoId) {
        const list = invoicesByPresupuestoId.get(inv.sourcePresupuestoId) || [];
        list.push(inv);
        invoicesByPresupuestoId.set(inv.sourcePresupuestoId, list);
      }
      const invFiestaId = (inv as any).fiestaId || (inv as any).eventId;
      if (invFiestaId) {
        const list = invoicesByFiestaId.get(invFiestaId) || [];
        list.push(inv);
        invoicesByFiestaId.set(invFiestaId, list);
      }
    }

    const presupuestosRestantes: Presupuesto[] = [];
    const presupuestosABorrar: Presupuesto[] = [];
    const fiestasABorrar: FiestaEnPlanificacion[] = [];
    const fiestas2027Actualizadas: FiestaEnPlanificacion[] = [];
    const fiestasIdBorrado = new Set<string>();
    const advertencias: string[] = [];
    const erroresParciales: string[] = [];

    let presupuestos2027Count = 0;
    let fiestasCreadasCount = 0;
    let contratosGeneradosCount = 0;
    let contratosSalonGeneradosCount = 0;
    let protegidosCount = 0;
    const nombres2027ConContrato: string[] = [];

    for (const p of presupuestos) {
      const linkedFiestas = fiestasByPresupuestoId.get(p.id) || [];

      const invMap = new Map<string, Invoice>();
      for (const inv of invoicesByPresupuestoId.get(p.id) || []) invMap.set(inv.id, inv);
      if (p.invoiceId && invoicesById.has(p.invoiceId)) {
        invMap.set(p.invoiceId, invoicesById.get(p.invoiceId)!);
      }
      for (const f of linkedFiestas) {
        for (const invId of f.invoiceIds || []) {
          if (invoicesById.has(invId)) invMap.set(invId, invoicesById.get(invId)!);
        }
        for (const inv of invoicesByFiestaId.get(f.id) || []) invMap.set(inv.id, inv);
      }
      const relatedInvoices = Array.from(invMap.values());

      const es2027 = esFechaDesde2027(p.eventoFecha);
      const fiestaEs2027 = linkedFiestas.some((f) => esFechaDesde2027(f.configuracion?.fechaEvento));
      const esHistorica =
        historicasIds.has(p.id) ||
        historicasPresupuestoIds.has(p.id) ||
        Boolean((p as any).esHistorica) ||
        linkedFiestas.some((f) => historicasIds.has(f.id) || Boolean((f as any).esHistorica));
      const esMuestra =
        Boolean((p as any).esMuestra) ||
        linkedFiestas.some((f) => f.id === 'fiesta_muestra_auditor' || f.esMuestra === true);
      const tieneCobro =
        (p.pagosCliente || []).length > 0 ||
        relatedInvoices.some((inv) => (inv.payments || []).length > 0);
      const tieneFactura =
        Boolean(p.invoiceId) ||
        linkedFiestas.some((f) => (f.invoiceIds?.length || 0) > 0) ||
        relatedInvoices.length > 0;
      const tieneContratoFirmado =
        Boolean(p.fechaFirmaContrato) ||
        Boolean(p.contractSignatureInfo?.isSigned) ||
        linkedFiestas.some(
          (f) =>
            f.contratoFirmaInfo?.isSigned === true ||
            Boolean(f.firmaDigitalConstancia) ||
            Boolean(f.contratoDatos?.fechaFirmaContrato),
        );

      if (es2027) {
        const esInactivo =
          Boolean(p.archived) ||
          p.estado === 'Rechazado' ||
          ['Vencido', 'Cancelado'].includes(String(p.estado));
        if (esInactivo) {
          protegidosCount += 1;
          presupuestosRestantes.push(p);
          advertencias.push(
            `Conservado ${p.id} (2027+) en estado ${p.archived ? 'archivado' : p.estado} sin activar ni generar contratos.`,
          );
          continue;
        }

        presupuestos2027Count += 1;
        const actualizado: Presupuesto & { tipoAjusteAnual?: 'acumulativo' | 'simple' } =
          normalizePresupuestoFinancials(
            {
              ...p,
              estado: p.estado === 'Facturado' ? 'Facturado' : 'Aceptado',
              tipoAjusteAnual: tieneContratoFirmado ? (p as any).tipoAjusteAnual : undefined,
            },
            { preserveStoredTotal: Boolean((p as any).preserveTotal || p.estado === 'Facturado') },
          );
        presupuestosRestantes.push(actualizado);

        const fiestasObjetivo =
          linkedFiestas.length > 0 ? linkedFiestas : [buildFiestaFromPresupuesto(actualizado)];
        if (linkedFiestas.length === 0) {
          fiestasCreadasCount += 1;
        }

        const pagoFactura = relatedInvoices.flatMap((inv) => inv.payments || []).find((pay) => pay.amount > 0);
        const pagoPresupuesto = (actualizado.pagosCliente || []).find((pay) => pay.monto > 0);
        const seniaReal = pagoFactura?.amount ?? pagoPresupuesto?.monto;

        for (const fiestaBase of fiestasObjetivo) {
          const clienteId = fiestaBase.configuracion?.clienteId || actualizado.leadId || '';
          const cliente = clienteId ? customersById.get(clienteId) || null : null;
          const lugar = fiestaBase.configuracion?.nombreLugar || actualizado.salonFiestas || '';
          const yaFirmado = Boolean(
            fiestaBase.contratoFirmaInfo?.isSigned || fiestaBase.firmaDigitalConstancia,
          );

          const fiestaActualizada: FiestaEnPlanificacion = {
            ...fiestaBase,
            presupuestoId: actualizado.id,
            estado: fiestaBase.estado && fiestaBase.estado !== 'Archivada' ? fiestaBase.estado : 'En Planificación',
            configuracion: {
              ...fiestaBase.configuracion,
              fechaEvento: fiestaBase.configuracion?.fechaEvento || actualizado.eventoFecha || '',
              nombreLugar: lugar,
              clienteNombre: fiestaBase.configuracion?.clienteNombre || actualizado.clienteNombre,
              presupuestoEstimado:
                fiestaBase.configuracion?.presupuestoEstimado ??
                (actualizado.totalConDescuento ?? actualizado.costoTotalEstimado),
            },
          };

          if (!yaFirmado) {
            const servicioTexto = generarTextoContratoServicios({
              fiesta: fiestaActualizada,
              cliente,
              presupuesto: actualizado,
              companyInfo,
              templateText: serviciosTemplateText,
              seniaMonto: seniaReal,
              todayText,
            });
            fiestaActualizada.contratoServicioTexto = servicioTexto;
            fiestaActualizada.contratoGenerado = {
              tipo: 'servicios',
              fecha: ahoraIso,
              plantillaId: serviciosPlantillaId,
            };
            contratosGeneradosCount += 1;

            if (esSalonClubUruguay(lugar)) {
              const salonTexto = buildSalonContractDraft({
                clienteNombre:
                  cliente?.name || cliente?.companyName || actualizado.clienteNombre || '',
                clienteCi:
                  cliente?.ci ||
                  cliente?.taxId ||
                  (actualizado as any)?.clienteCi ||
                  (actualizado as any)?.ci ||
                  '',
                clienteDomicilio:
                  cliente?.address ||
                  (cliente as any)?.domicilio ||
                  (actualizado as any)?.clienteDomicilio ||
                  '',
                clienteTelefono:
                  cliente?.phone ||
                  (cliente as any)?.telefono ||
                  actualizado.clienteContacto ||
                  '',
                fechaEvento: formatFechaContrato(fiestaActualizada.configuracion.fechaEvento),
                salon: lugar,
                tipoEvento:
                  fiestaActualizada.configuracion.nombreEvento || actualizado.eventoTipo || '',
                invitados:
                  fiestaActualizada.configuracion.invitadosEstimados ||
                  actualizado.invitadosCantidad ||
                  0,
                ciudadFecha: `Salto, a los ${todayText}`,
              });
              fiestaActualizada.contratoSalonTexto = salonTexto;
              contratosSalonGeneradosCount += 1;
            }

            nombres2027ConContrato.push(
              `${actualizado.clienteNombre || actualizado.id} (${parseIsoDateKey(actualizado.eventoFecha) || ''}${esSalonClubUruguay(lugar) ? ' + salón' : ''})`,
            );
          } else {
            advertencias.push(
              `Fiesta ${fiestaActualizada.id} (2027+) ya tenía contrato firmado: se mantuvo su texto sin sobreescribir.`,
            );
          }

          fiestas2027Actualizadas.push(fiestaActualizada);
        }
        continue;
      }

      // Presupuesto anterior a 2027 o sin fecha válida
      if (
        fiestaEs2027 ||
        esHistorica ||
        esMuestra ||
        tieneCobro ||
        tieneFactura ||
        tieneContratoFirmado
      ) {
        protegidosCount += 1;
        presupuestosRestantes.push(p);
        const motivos: string[] = [];
        if (tieneCobro) motivos.push('cobro');
        if (tieneFactura) motivos.push('factura');
        if (tieneContratoFirmado) motivos.push('contrato firmado');
        if (esHistorica) motivos.push('fiesta histórica');
        if (esMuestra) motivos.push('muestra del auditor');
        if (fiestaEs2027) motivos.push('fiesta vinculada 2027+');
        advertencias.push(
          `Protegido ${p.id} (${p.clienteNombre || 'Sin nombre'}, ${p.eventoFecha || 'sin fecha'}) por tener ${motivos.join(', ')}.`,
        );
      } else {
        presupuestosABorrar.push(p);
        for (const f of linkedFiestas) {
          if (!fiestasIdBorrado.has(f.id)) {
            fiestasIdBorrado.add(f.id);
            fiestasABorrar.push(f);
          }
        }
      }
    }

    // Persistir presupuestos restantes y borrar los eliminados
    await writeDataFn('presupuestos.json', presupuestosRestantes, undefined, {
      skipAutoBackup: true,
    });

    if (!usaWriteInyectado && process.env.AK_USE_LOCAL_JSON_ONLY !== 'true') {
      for (const p of presupuestosABorrar) {
        try {
          await db.collection('presupuestos').doc(p.id).delete();
        } catch (err: any) {
          erroresParciales.push(`No se pudo borrar presupuesto ${p.id}: ${err?.message || err}`);
        }
      }
    }

    // Persistir fiestas 2027 actualizadas/creadas y borrar fiestas vinculadas a < 2027
    if (usaWriteInyectado) {
      const fiestasActualizadasById = new Map(fiestas2027Actualizadas.map((f) => [f.id, f]));
      const fiestasFinales: FiestaEnPlanificacion[] = [];
      for (const f of fiestas) {
        if (fiestasIdBorrado.has(f.id)) continue;
        fiestasFinales.push(fiestasActualizadasById.get(f.id) || f);
        fiestasActualizadasById.delete(f.id);
      }
      for (const nueva of fiestasActualizadasById.values()) {
        fiestasFinales.push(nueva);
      }
      await writeDataFn('fiestas.json', fiestasFinales, undefined, { skipAutoBackup: true });
    } else {
      for (const f of fiestas2027Actualizadas) {
        try {
          await writeDataFn(`fiestas/${f.id}.json`, f, undefined, { skipAutoBackup: true });
        } catch (err: any) {
          erroresParciales.push(`No se pudo guardar fiesta ${f.id}: ${err?.message || err}`);
        }
      }
      if (process.env.AK_USE_LOCAL_JSON_ONLY !== 'true') {
        for (const f of fiestasABorrar) {
          try {
            await db.collection('fiestas').doc(f.id).delete();
            await unlinkLocalFiesta(f.id);
          } catch (err: any) {
            erroresParciales.push(`No se pudo borrar fiesta ${f.id}: ${err?.message || err}`);
          }
        }
      }
    }

    const estadoFinal = erroresParciales.length > 0 ? 'con_observaciones' : 'completada';
    const resumenMensaje = [
      `Se borraron ${presupuestosABorrar.length} presupuesto(s) y ${fiestasABorrar.length} fiesta(s) anteriores a 2027.`,
      `Quedaron ${presupuestos2027Count} presupuesto(s) 2027+ (${fiestasCreadasCount} fiesta(s) nuevas, ${contratosGeneradosCount} contrato(s) de servicios y ${contratosSalonGeneradosCount} de salón Club Uruguay).`,
      protegidosCount > 0
        ? `Se dejaron intactos ${protegidosCount} presupuesto(s) anteriores a 2027 protegidos (${advertencias.join(' | ')}).`
        : null,
      nombres2027ConContrato.length > 0
        ? `Contratos generados: ${nombres2027ConContrato.join(', ')}.`
        : null,
      erroresParciales.length > 0
        ? `Errores parciales: ${erroresParciales.join(' | ')}`
        : null,
    ]
      .filter(Boolean)
      .join(' ');

    await migracionRef.set(
      {
        estado: estadoFinal,
        iniciadaEn: ahoraIso,
        completadaEn: new Date().toISOString(),
        presupuestosBorrados: presupuestosABorrar.length,
        fiestasBorradas: fiestasABorrar.length,
        presupuestos2027: presupuestos2027Count,
        fiestasCreadas: fiestasCreadasCount,
        contratosGenerados: contratosGeneradosCount,
        contratosSalonGenerados: contratosSalonGeneradosCount,
        protegidos: protegidosCount,
        advertencias,
        erroresParciales,
      },
      { merge: true },
    );

    await crearNotificacionFn({
      titulo:
        erroresParciales.length > 0
          ? 'Migración Empezar 2027 completada con observaciones'
          : 'Migración Empezar 2027 completada',
      mensaje: resumenMensaje,
      tipo: erroresParciales.length > 0 || advertencias.length > 0 ? 'aviso' : 'exito',
      rolDestino: 'admin',
      href: '/presupuestos',
      icono: 'FileCheck',
    }).catch(() => null);

    return {
      success: erroresParciales.length === 0,
      yaCorrio: false,
      presupuestosBorrados: presupuestosABorrar.length,
      fiestasBorradas: fiestasABorrar.length,
      presupuestos2027: presupuestos2027Count,
      fiestasCreadas: fiestasCreadasCount,
      contratosGenerados: contratosGeneradosCount,
      contratosSalonGenerados: contratosSalonGeneradosCount,
      protegidos: protegidosCount,
      advertencias,
      erroresParciales,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    await migracionRef
      .set(
        {
          estado: 'fallo',
          iniciadaEn: ahoraIso,
          falloEn: new Date().toISOString(),
          error: errorMsg,
        },
        { merge: true },
      )
      .catch(() => null);

    await crearNotificacionFn({
      titulo: 'Migración Empezar 2027 falló',
      mensaje: `La migración automática Empezar 2027 se interrumpió con error: ${errorMsg}`,
      tipo: 'urgente',
      rolDestino: 'admin',
      href: '/settings',
      icono: 'AlertTriangle',
    }).catch(() => null);

    return {
      success: false,
      yaCorrio: false,
      fallo: 'migracion',
      error: errorMsg,
    };
  }
}
