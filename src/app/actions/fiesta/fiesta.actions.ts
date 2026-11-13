'use server';
import { compraGuardadaDeCadaUna } from '@/lib/fiesta/reponer-la-plata';
import { idDelIntento } from '@/lib/intento-en-servidor';
import { requirePermisoAlguno, requireAppSession } from '@/lib/auth/require-session';
import { PERMISOS, puede, perfilDe } from '@/lib/auth/perfiles';

import type {
    FiestaEnPlanificacion,
    MenuMesaData,
    NumerosMesaData,
    ModulosContratados,
    PersonalAsignadoDetalleStorage,
    CartaTragosData,
    BebidasData,
    BebidaCategoria,
    BebidaItem,
    ReposteriaData,
    ReposteriaCategoria,
    ReposteriaItem,
    DecoracionData,
    DecorationItem,
    GestionCostosData,
    CostoItem,
    ListaDeCargaOperativa,
    CargaOperativaCategoria,
    CargaOperativaItem,
    Tarea,
    ProgramaEventoItem,
    GuestPortalSettings,
    GuestExperienceSettings,
    ClienteDebeLlevarItem,
    Invitado,
    GuestExperienceStats,
} from '@/types/fiesta';
import type { ItemPresupuestado } from '@/types/presupuesto';
import {
    initialFiestaActualData,
    defaultModulosContratados,
    defaultBebidasData,
    defaultReposteriaData,
    defaultDecoracion,
    defaultGestionCostos,
} from '@/lib/fiesta-defaults';
import { deriveBudgetModulesForSync, mergeClientPortalSettingsForSync, normalizeBudgetItemsForSync } from '@/lib/fiesta-sync-utils';
import { isValidWfolioUrl, buildWfolioDelivery, type WfolioAlbumDelivery } from '@/lib/social-fiesta/wfolio-album-delivery';
import { leerFiestasCrudas, leerHistorialCrudo } from '@/lib/fiesta/leer-fiestas';
import { readData, writeData, updateDataPartial } from '@/lib/data-service';
import path from 'path';
import fs from 'fs/promises';
import { getPresupuestoById, getPresupuestos } from '../presupuestos';
import { leerRolesInterno } from '@/lib/roles/leer-roles-interno';
import { syncLaundryCosts } from './costos.actions';
import { getActivosFijos } from '../activos-fijos';
import * as logger from '@/lib/logger';
import { normalizeInvitationSlug, isValidInvitationSlug } from '@/lib/invitacion-slug';
import { buildAkDemoFiesta, type AkDemoFiestaKind } from '@/lib/experience-ak/demo-fiesta-factory';
import { preserveFiestaSecrets } from '@/lib/fiesta/get-fiesta-raw';
import { conLaConstanciaGuardada } from '@/lib/fiesta/constancia-de-firma';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { quienEsElEquipo, usuarioDelEquipo } from '@/lib/auth/equipo-de-la-fiesta';
import { CAMPOS_DEL_EQUIPO, recortarFiestaParaAfuera, recortarFiestaPorPerfil } from '@/lib/fiesta/recortar-para-afuera';
import { buscarRol, barmanPorInvitados, personalDeCocina, utilerosPorInvitados } from '@/lib/fiesta/personal-por-invitados';
import { marcarItemLectura, marcaDe, huellaDe, sacarMarcas, CLAVE_DE_LA_MARCA } from '@/lib/marca-de-lectura';

const FIESTAS_DIR = 'fiestas';
const ARCHIVE_DIR = 'archive';

function shouldUseLocalJsonOnly(): boolean {
  return process.env.AK_USE_LOCAL_JSON_ONLY === 'true';
}

async function readLocalFiestaDirectory(directory: string): Promise<FiestaEnPlanificacion[]> {
  const fileNames = new Set<string>();
  const candidates = [
    path.join(process.cwd(), 'data', directory),
    path.join(process.cwd(), 'src', 'data', directory),
  ];

  for (const candidate of candidates) {
    try {
      const entries = await fs.readdir(candidate);
      entries.filter((file) => file.endsWith('.json')).forEach((file) => fileNames.add(file));
    } catch {
      // The directory is optional in local and test environments.
    }
  }

  const fiestas = await Promise.all(
    [...fileNames].map((file) => readData<FiestaEnPlanificacion | null>(path.join(directory, file), null)),
  );
  return fiestas.filter((fiesta): fiesta is FiestaEnPlanificacion => fiesta !== null);
}

/**
 * La frontera de las fiestas (Codex, auditorÃ­a 69, orden 118, 6/10/2026). Antes alcanzaba con
 * tener sesiÃ³n: el perfil `personal`, que no tiene ningÃºn permiso, leÃ­a la fiesta entera â€”la clave
 * del portal, la credencial de cada invitado, los costosâ€” y la podÃ­a guardar. Es del equipo quien
 * tiene algÃºn permiso; el operador, sÃ³lo en las fiestas a las que estÃ¡ asignado. Ver
 * `src/lib/auth/equipo-de-la-fiesta.ts`.
 */
async function esEquipoParaFiesta(fiestaId: string): Promise<boolean> {
    const decide = await quienEsElEquipo();
    if (decide(null)) return true;
    const { getFiestaByIdRaw } = await import('@/lib/fiesta/get-fiesta-raw');
    return decide(await getFiestaByIdRaw(fiestaId));
}

/** Lo que viaja a quien no es su equipo: sin lo interno, lo del cliente ni la clave del portal. */
function paraAfuera(fiesta: FiestaEnPlanificacion, esCliente = false): FiestaEnPlanificacion {
    const sinClave = fiesta.clientPortalSettings
        ? { ...fiesta, clientPortalSettings: { ...fiesta.clientPortalSettings, accessKey: undefined as any } }
        : fiesta;
    return recortarFiestaParaAfuera(sinClave, { esCliente });
}

async function requireEquipo(): Promise<(f: FiestaEnPlanificacion) => FiestaEnPlanificacion> {
    if (!(await usuarioDelEquipo())) throw new Error('Tu usuario no tiene acceso a las fiestas.');
    const decide = await quienEsElEquipo();
    // Orden 183: al equipo tambiÃ©n se le recorta lo que su perfil no ve: costos sin GANANCIAS,
    // sueldos sin SUELDOS, pagos sin CONTABILIDAD. Al guardar se repone de lo guardado
    // (`reponerLoDelPerfil`, `reponerLaPlata`); las cuentas del servidor leen con LECTURA_COMPLETA.
    const { verifySession } = await import('@/lib/auth/session-token');
    const sesion = await verifySession();
    const usuario = sesion.success ? sesion.user : null;
    return (f) => (decide(f) ? recortarFiestaPorPerfil(f, usuario) : paraAfuera(f));
}

/**
 * LO QUE EL GUARDADO GENERAL NO CAMBIA SIN CONTABILIDAD (Codex, auditorÃ­a 71, CAMPO01/02).
 *
 * `saveFiesta` y `updateFiestaPartial` sÃ³lo cuidaban lo interno del equipo. Un operador asignado
 * marcaba cuotas cobradas por acÃ¡, y el cliente desde su portal marcaba el contrato en papel
 * firmado y la fiesta Contratada. Cada uno de estos campos tiene su camino propio, que pide su
 * permiso: cobros y plan (`payment-plans`), contrato en papel (`documentos.actions`), pagos a
 * proveedores (`pagos.actions`), presupuesto y facturas (`presupuestos`). Por el guardado general
 * sÃ³lo los cambia quien tiene contabilidad; para los demÃ¡s quedan como estaban guardados.
 */
const CAMPOS_DE_PLATA_Y_CONTRATO = [
  'estado',
  'presupuestoId',
  'invoiceIds',
  'contratoFirmaInfo',
  'planDePagos',
  'pagosProveedores',
  'clientPaymentNotifications',
  // Senia, saldo, ajuste y plan de pagos del contrato, y el texto del contrato (barrido 12/10/2026).
  'contratoDatos',
  'contratoServicioTexto',
] as const;

/** Lo de pagar en cada compra al proveedor: plata, aunque la compra sea de organizaciÃ³n. */
const PAGO_DE_LA_COMPRA = ['pagado', 'montoPagado'] as const;

async function tocaLaPlata(): Promise<boolean> {
  const { verifySession } = await import('@/lib/auth/session-token');
  const sesion = await verifySession();
  return Boolean(sesion.success && sesion.user && puede(sesion.user, PERMISOS.CONTABILIDAD));
}

const mismoValor = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Deja lo de plata como estÃ¡ guardado. Para el guardado ENTERO de quien no tiene contabilidad. */
function reponerLaPlata(nueva: FiestaEnPlanificacion, guardada: FiestaEnPlanificacion | null): FiestaEnPlanificacion {
  const copia: Record<string, unknown> = { ...nueva };
  for (const campo of CAMPOS_DE_PLATA_Y_CONTRATO) {
    if (guardada && campo in guardada) copia[campo] = (guardada as unknown as Record<string, unknown>)[campo];
    else delete copia[campo];
  }
  if (Array.isArray(copia.estadosCompra)) {
    const antes = (guardada?.estadosCompra || []) as unknown as Record<string, unknown>[];
    const nuevas = copia.estadosCompra as Record<string, unknown>[];
    const previos = compraGuardadaDeCadaUna(antes, nuevas);
    copia.estadosCompra = nuevas.map((e, i) => {
      const previo = previos[i];
      const r = { ...e };
      for (const k of PAGO_DE_LA_COMPRA) {
        if (previo && k in previo) r[k] = previo[k]; else delete r[k];
      }
      return r;
    });
  }
  return copia as unknown as FiestaEnPlanificacion;
}

/** El parcial sin lo de plata: eso queda como estÃ¡ en la fiesta de ese momento. */
function sinLaPlata(parcial: Partial<FiestaEnPlanificacion>, actual: FiestaEnPlanificacion): Partial<FiestaEnPlanificacion> {
  const copia: Record<string, unknown> = { ...parcial };
  for (const campo of CAMPOS_DE_PLATA_Y_CONTRATO) delete copia[campo];
  if (Array.isArray(copia.estadosCompra)) {
    copia.estadosCompra = reponerLaPlata({ estadosCompra: copia.estadosCompra } as FiestaEnPlanificacion, actual).estadosCompra;
  }
  return copia as Partial<FiestaEnPlanificacion>;
}

/** Para el guardado PARCIAL: si pide cambiar algo de plata sin contabilidad, se rechaza entero. */
function pideCambiarLaPlata(parcial: Partial<FiestaEnPlanificacion>, guardada: FiestaEnPlanificacion | null): boolean {
  const g = (guardada ?? {}) as Record<string, unknown>;
  const p = parcial as Record<string, unknown>;
  if (CAMPOS_DE_PLATA_Y_CONTRATO.some((campo) => campo in p && !mismoValor(p[campo], g[campo]))) return true;
  if (Array.isArray(p.estadosCompra)) {
    const antes = (guardada?.estadosCompra || []) as unknown as Record<string, unknown>[];
    const nuevas = p.estadosCompra as Record<string, unknown>[];
    const previos = compraGuardadaDeCadaUna(antes, nuevas);
    return nuevas.some((e, i) => {
      const previo = previos[i];
      // Sin la casilla (llegÃ³ recortada por el perfil, orden 183) no pide cambiarla: se conserva.
      return PAGO_DE_LA_COMPRA.some((k) => k in e && !mismoValor(e[k], previo?.[k]));
    });
  }
  return false;
}

export async function requireFiestaWriteAccess(fiestaId: string) {
    if (fiestaId && (await esEquipoParaFiesta(fiestaId))) return;
    if (fiestaId && (await verifyPortalSession(fiestaId))) return;
    throw new Error('No autorizado para modificar este evento.');
}

export async function getHistorialFiestas(): Promise<FiestaEnPlanificacion[]> {
  // Devuelve TODAS las fiestas archivadas, con el cliente, lo que pago y sus
  // invitados. Es una direccion de internet: sin esto, cualquiera pedia la lista
  // entera de clientes del negocio sin tener cuenta.
  await requireAppSession();
  const mostrar = await requireEquipo();
  return (await leerHistorialCrudo()).map(mostrar);
}

export async function getFiestas(includeArchived = true): Promise<FiestaEnPlanificacion[]> {
  // Las pantallas que abre un desconocido y que igual necesitan mirar las fiestas
  // (el simulador para ver si una fecha esta libre, el portal del cliente con su
  // clave) usan `leerFiestasCrudas`, que no es una direccion de internet.
  await requireAppSession();
  const mostrar = await requireEquipo();
  const crudas = await leerFiestasCrudas(includeArchived);
  return crudas.map((f) => marcarItemLectura(mostrar(f) as unknown as Record<string, unknown>, (f as any)._syncedAt, CAMPOS_DE_PLATA_Y_CONTRATO) as unknown as FiestaEnPlanificacion);
}

export async function getAllFiestas() {
    return getFiestas(true);
}

export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
    // PÃºblica a propÃ³sito (la pantalla de mesas), pero a quien no es su equipo le llega sin la
    // clave del portal ni las credenciales de los invitados (Codex, auditorÃ­a 69).
    const elegida = await elegirFiestaActual();
    return (await quienEsElEquipo())(elegida) ? elegida : paraAfuera(elegida);
}

async function elegirFiestaActual(): Promise<FiestaEnPlanificacion> {
    // Publica a proposito: la usa la pantalla de mesas de la fiesta en curso, que
    // se abre sin cuenta. Por eso lee por dentro y no por la puerta con sesion.
    const all = await leerFiestasCrudas(false);
    if (all.length === 0) {
        return { ...initialFiestaActualData, id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`};
    }

    const { getUruguayParts } = await import('@/lib/utils');
    const u = getUruguayParts(new Date());
    const todayStr = `${u.year}-${String(u.month).padStart(2, '0')}-${String(u.day).padStart(2, '0')}`;

    const todayEvents = all.filter(f => (f.configuracion?.fechaEvento || '') === todayStr);
    if (todayEvents.length > 0) {
        return todayEvents.sort((a, b) => (a.configuracion?.horaInicio || '').localeCompare(b.configuracion?.horaInicio || ''))[0];
    }

    const futureEvents = all.filter(f => (f.configuracion?.fechaEvento || '') > todayStr);
    if (futureEvents.length > 0) {
        return futureEvents.sort((a, b) => {
            const cmp = (a.configuracion?.fechaEvento || '').localeCompare(b.configuracion?.fechaEvento || '');
            if (cmp !== 0) return cmp;
            return (a.configuracion?.horaInicio || '').localeCompare(b.configuracion?.horaInicio || '');
        })[0];
    }

    const pastEvents = all.filter(f => (f.configuracion?.fechaEvento || '') < todayStr);
    if (pastEvents.length > 0) {
        return pastEvents.sort((a, b) => {
            const cmp = (b.configuracion?.fechaEvento || '').localeCompare(a.configuracion?.fechaEvento || '');
            if (cmp !== 0) return cmp;
            return (a.configuracion?.horaInicio || '').localeCompare(b.configuracion?.horaInicio || '');
        })[0];
    }

    return all[0];
}

function validatePersonalAssignments(personalAsignado: FiestaEnPlanificacion['personalAsignado'] | undefined): string | null {
  const counts = new Map<string, number>();
  for (const assignment of personalAsignado || []) {
    if (!assignment.empleadoId) continue;
    const count = (counts.get(assignment.empleadoId) || 0) + 1;
    if (count > 2) return 'Cada empleado puede tener como maximo 2 roles por evento.';
    counts.set(assignment.empleadoId, count);
  }
  return null;
}

export async function saveFiesta(fiestaData: FiestaEnPlanificacion): Promise<{ success: boolean; fiesta?: FiestaEnPlanificacion; error?: string }> {
  await requireFiestaWriteAccess(fiestaData.id);
  if (!(await esEquipoParaFiesta(fiestaData.id))) {
    // EntrÃ³ por el portal del cliente: lo interno del equipo (costos, personal, pagos a
    // proveedores) no lo cambia Ã©l. Se saca lo que mandÃ³ y se repone lo guardado.
    const copia: Record<string, unknown> = { ...fiestaData };
    for (const campo of CAMPOS_DEL_EQUIPO) delete copia[campo];
    fiestaData = copia as unknown as FiestaEnPlanificacion;
  }
  const assignmentError = validatePersonalAssignments(fiestaData.personalAsignado);
  if (assignmentError) return { success: false, error: assignmentError };
  const { verifySession: sesionDeQuienGuarda } = await import('@/lib/auth/session-token');
  const quienGuarda = await sesionDeQuienGuarda();
  const usuarioQueGuarda = quienGuarda.success ? quienGuarda.user : null;
  const sinPlata = !(await tocaLaPlata());
  const recortadoAlLeer = Boolean(usuarioQueGuarda)
    && (!puede(usuarioQueGuarda, PERMISOS.GANANCIAS) || !puede(usuarioQueGuarda, PERMISOS.SUELDOS));

  const { getFiestaByIdRaw } = await import('@/lib/fiesta/get-fiesta-raw');
  const guardada = await getFiestaByIdRaw(fiestaData.id);

  if (guardada) {
    const { actualizarFiesta: libActualizarFiesta } = await import('@/lib/fiesta/actualizar-fiesta');
    const { recortarFiestaPorPerfil, reponerLoDelPerfil } = await import('@/lib/fiesta/recortar-para-afuera');

    const r = await libActualizarFiesta(fiestaData.id, (actual) => {
      let resultado = { ...fiestaData };

      if (sinPlata) {
        resultado = reponerLaPlata(resultado, actual);
      } else {
        const marca = marcaDe(fiestaData);
        for (const campo of CAMPOS_DE_PLATA_Y_CONTRATO) {
          const valorPantalla = (fiestaData as unknown as Record<string, unknown>)[campo];
          const valorActual = (actual as unknown as Record<string, unknown>)[campo];
          const huellaPantalla = huellaDe(valorPantalla);
          const huellaActual = huellaDe(valorActual);

          let pantallaCambio = false;
          let baseCambio = false;

          if (marca?.plata && campo in marca.plata) {
            const huellaLeida = marca.plata[campo];
            pantallaCambio = huellaPantalla !== huellaLeida;
            baseCambio = huellaActual !== huellaLeida;
          } else if (marca) {
            pantallaCambio = !mismoValor(valorPantalla, valorActual);
          } else {
            pantallaCambio = !mismoValor(valorPantalla, valorActual);
          }

          if (pantallaCambio && baseCambio) {
            throw new Error('Alguien cambiÃ³ los pagos de esta fiesta mientras la tenÃ­as abierta. RecargÃ¡ y volvÃ© a intentar.');
          }

          if (!pantallaCambio) {
            if (valorActual !== undefined) {
              (resultado as Record<string, unknown>)[campo] = valorActual;
            } else {
              delete (resultado as Record<string, unknown>)[campo];
            }
          }
        }

        if (Array.isArray(fiestaData.estadosCompra)) {
          const comprasPantalla = fiestaData.estadosCompra;
          const comprasActual = actual.estadosCompra || [];
          const huellaComprasPantalla = huellaDe(comprasPantalla);
          const huellaComprasActual = huellaDe(comprasActual);
          let pantallaCambioCompras = false;
          let baseCambioCompras = false;

          if (marca?.plata && 'estadosCompra' in marca.plata) {
            const huellaLeida = marca.plata['estadosCompra'];
            pantallaCambioCompras = huellaComprasPantalla !== huellaLeida;
            baseCambioCompras = huellaComprasActual !== huellaLeida;
          }

          if (pantallaCambioCompras && baseCambioCompras) {
            const antes = compraGuardadaDeCadaUna(comprasActual as any, comprasPantalla as any);
            const tocoPago = comprasPantalla.some((e, i) => {
              const prev = antes[i];
              return PAGO_DE_LA_COMPRA.some((k) => k in (e as any) && !mismoValor((e as any)[k], (prev as any)?.[k]));
            });
            if (tocoPago) {
              throw new Error('Alguien cambiÃ³ los pagos de esta fiesta mientras la tenÃ­as abierta. RecargÃ¡ y volvÃ© a intentar.');
            }
          }

          if (!pantallaCambioCompras) {
            resultado.estadosCompra = actual.estadosCompra;
          }
        }
      }

      if (recortadoAlLeer) {
        resultado = reponerLoDelPerfil(resultado, actual, usuarioQueGuarda);
      }
      return conLaConstanciaGuardada(resultado, actual);
    });

    if (!r.success) return { success: false, error: r.error || 'No se pudo guardar el evento.' };
    if (!quienGuarda.success) return { success: true };
    return { success: true, fiesta: recortarFiestaPorPerfil(r.updatedFiesta ?? fiestaData, usuarioQueGuarda) };
  }

  try {
    const filePath = `${FIESTAS_DIR}/${fiestaData.id}.json`;
    await writeData(filePath, await preserveFiestaSecrets(fiestaData.id, fiestaData));
    const { verifySession } = await import('@/lib/auth/session-token');
    const sesion = await verifySession();
    if (!sesion.success) return { success: true };
    const { recortarFiestaPorPerfil } = await import('@/lib/fiesta/recortar-para-afuera');
    return { success: true, fiesta: recortarFiestaPorPerfil(fiestaData, sesion.user) };
  } catch (error: any) {
    return { success: false, error: 'No se pudo guardar el evento.' };
  }
}

export async function updateFiestaPartial(
  fiestaId: string,
  partialData: Partial<FiestaEnPlanificacion>,
  options?: { allowPortal?: boolean }
): Promise<{ success: boolean; error?: string }> {
  // La constancia de la firma digital sÃ³lo la escribe `signContractDigitally` (Codex 240, C2).
  if ('firmaDigitalConstancia' in (partialData as Record<string, unknown>)) {
    return { success: false, error: 'La constancia de la firma sÃ³lo se registra firmando desde el portal.' };
  }
  // Con la constancia puesta, el texto que firmÃ³ el cliente no se cambia por el guardado parcial.
  // Se mira antes (para no hacer trabajo de mÃ¡s) Y adentro de la escritura: una firma que llega
  // entre la lectura y el guardado dejaba la constancia de A junto al texto B (Codex 264, orden 219).
  // Lo mismo con el contrato en papel y con el plan de pagos (barrido de la pregunta 94).
  const tocaElContrato = 'contratoServicioTexto' in (partialData as Record<string, unknown>)
    || Boolean(partialData.contratoDatos && 'planPagos' in (partialData.contratoDatos as Record<string, unknown>));
  const noPisaLoFirmado = (actual: FiestaEnPlanificacion) => {
    const firmado = Boolean(actual.firmaDigitalConstancia || actual.contratoFirmaInfo?.isSigned);
    if (!firmado) return;
    if ('contratoServicioTexto' in (partialData as Record<string, unknown>) && actual.contratoServicioTexto !== partialData.contratoServicioTexto) {
      throw new Error(actual.contratoFirmaInfo?.isSigned
        ? 'No se puede modificar el contrato una vez firmado.'
        : 'El cliente ya firmÃ³ este contrato en su portal: para cambiarlo hace falta una adenda.');
    }
    const planNuevo = (partialData.contratoDatos as any)?.planPagos;
    if (planNuevo !== undefined && JSON.stringify(planNuevo) !== JSON.stringify((actual.contratoDatos as any)?.planPagos)) {
      throw new Error('El contrato ya estÃ¡ firmado: el plan de pagos no se cambia sin una adenda.');
    }
  };
  if (tocaElContrato) {
    const { getFiestaByIdRaw: leerGuardada } = await import('@/lib/fiesta/get-fiesta-raw');
    const guardada = await leerGuardada(fiestaId);
    try {
      if (guardada) noPisaLoFirmado(guardada);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
  if (options?.allowPortal) {
    await requireFiestaWriteAccess(fiestaId);
    if (!(await esEquipoParaFiesta(fiestaId))) {
      // El cliente no toca lo interno del equipo (auditorÃ­a 69).
      const tocaLoDelEquipo = CAMPOS_DEL_EQUIPO.some((campo) => campo in (partialData as Record<string, unknown>));
      if (tocaLoDelEquipo) return { success: false, error: 'Esa parte de la fiesta la maneja el equipo de AK.' };
    }
  } else {
    await requireAppSession();
    if (!(await esEquipoParaFiesta(fiestaId))) throw new Error('No autorizado para modificar este evento.');
  }
  const assignmentError = validatePersonalAssignments(partialData.personalAsignado);
  if (assignmentError) return { success: false, error: assignmentError };
  {
    // Orden 183: costos (GANANCIAS) y sueldos (SUELDOS) por el guardado parcial.
    const { verifySession } = await import('@/lib/auth/session-token');
    const sesion = await verifySession();
    const usuario = sesion.success ? sesion.user : null;
    if (usuario && 'gestionCostos' in partialData && !puede(usuario, PERMISOS.GANANCIAS)) {
      return { success: false, error: 'Los costos de la fiesta los maneja quien tiene permiso de ganancias.' };
    }
    if (usuario && Array.isArray(partialData.personalAsignado) && !puede(usuario, PERMISOS.SUELDOS)) {
      const { reponerLoDelPerfil } = await import('@/lib/fiesta/recortar-para-afuera');
      const { actualizarFiesta } = await import('@/lib/fiesta/actualizar-fiesta');
      const sinPlata = !(await tocaLaPlata());
      if (sinPlata) {
        const { getFiestaByIdRaw } = await import('@/lib/fiesta/get-fiesta-raw');
        if (pideCambiarLaPlata(partialData, await getFiestaByIdRaw(fiestaId))) {
          return { success: false, error: 'Cobros, contrato y estado de la fiesta los cambia contabilidad, desde su pantalla.' };
        }
      }
      const r = await actualizarFiesta(fiestaId, (actual) => {
        noPisaLoFirmado(actual);
        const parcial = sinPlata ? sinLaPlata(partialData, actual) : partialData;
        return reponerLoDelPerfil({ ...actual, ...parcial }, actual, usuario);
      });
      return r.success ? { success: true } : { success: false, error: r.error || 'No se pudo actualizar parcialmente el evento.' };
    }
  }
  if (!(await tocaLaPlata())) {
    const { getFiestaByIdRaw } = await import('@/lib/fiesta/get-fiesta-raw');
    if (pideCambiarLaPlata(partialData, await getFiestaByIdRaw(fiestaId))) {
      return { success: false, error: 'Cobros, contrato y estado de la fiesta los cambia contabilidad, desde su pantalla.' };
    }
    // Lo de plata que vino igual a lo leÃ­do no se escribe: se queda lo de ESE momento, adentro de
    // la operaciÃ³n (auditorÃ­a 73). Si no, un cobro anotado en el medio volvÃ­a a cero.
    const { actualizarFiesta } = await import('@/lib/fiesta/actualizar-fiesta');
    const r = await actualizarFiesta(fiestaId, (actual) => {
      noPisaLoFirmado(actual);
      return { ...actual, ...sinLaPlata(partialData, actual) };
    });
    return r.success ? { success: true } : { success: false, error: r.error || 'No se pudo actualizar parcialmente el evento.' };
  }
  if (tocaElContrato) {
    // El texto del contrato se escribe adentro de la escritura de la fiesta, donde se ve la firma.
    const { actualizarFiesta } = await import('@/lib/fiesta/actualizar-fiesta');
    const r = await actualizarFiesta(fiestaId, (actual) => {
      noPisaLoFirmado(actual);
      return { ...actual, ...partialData };
    });
    return r.success ? { success: true } : { success: false, error: r.error || 'No se pudo actualizar parcialmente el evento.' };
  }
  try {
    const filePath = `${FIESTAS_DIR}/${fiestaId}.json`;
    await updateDataPartial<FiestaEnPlanificacion>(filePath, partialData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "No se pudo actualizar parcialmente el evento." };
  }
}

export async function getFiestaById(fiestaId: string, lectura?: symbol): Promise<FiestaEnPlanificacion | null> {
    return (await leerFiestaConEstado(fiestaId, lectura)).fiesta;
}

async function leerFiestaConEstado(
    fiestaId: string,
    lectura?: symbol
): Promise<{ fiesta: FiestaEnPlanificacion | null; fallo: boolean }> {
    const activePath = `${FIESTAS_DIR}/${fiestaId}.json`;
    let fiesta: FiestaEnPlanificacion | null = null;
    let readFailed = false;
    try {
        const active = await readData<FiestaEnPlanificacion | null>(activePath, null);
        if (active && active.id === fiestaId) fiesta = active;
    } catch (e) {
        readFailed = true;
    }
    if (!fiesta) {
        try {
            const localCandidates = [
                path.join(process.cwd(), 'data', FIESTAS_DIR, `${fiestaId}.json`),
                path.join(process.cwd(), 'src', 'data', FIESTAS_DIR, `${fiestaId}.json`),
            ];
            for (const lp of localCandidates) {
                try {
                    const raw = await fs.readFile(lp, 'utf-8');
                    const parsed = JSON.parse(raw);
                    if (parsed && parsed.id === fiestaId) {
                        fiesta = parsed;
                        break;
                    }
                } catch {}
            }
        } catch {}
    }
    if (!fiesta) {
        try {
            const archivadas = await getHistorialFiestas();
            fiesta = archivadas.find(f => f.id === fiestaId) || null;
        } catch {}
    }

    const fallo = !fiesta && readFailed;

    if (fiesta) {
        if (fiesta.modulosContratados) {
            fiesta.modulosContratados = {
                ...defaultModulosContratados,
                ...fiesta.modulosContratados,
            };
        }
        if (lectura !== LECTURA_COMPLETA && !(await quienEsElEquipo())(fiesta)) {
            if (fiesta.clientPortalSettings) {
                fiesta.clientPortalSettings = { ...fiesta.clientPortalSettings, accessKey: undefined as any };
            }
            // Quien no es del equipo no se lleva la fiesta entera (ver recortar-para-afuera).
            const { verifyPortalSession } = await import('@/lib/security/portal-session');
            const esCliente = await verifyPortalSession(fiestaId).catch(() => false);
            const { recortarFiestaParaAfuera } = await import('@/lib/fiesta/recortar-para-afuera');
            fiesta = recortarFiestaParaAfuera(fiesta, { esCliente });
        } else if (lectura !== LECTURA_COMPLETA) {
            // Orden 183: al equipo tambiÃ©n se le saca lo que su perfil no ve (costos, sueldos, pagos).
            const { verifySession } = await import('@/lib/auth/session-token');
            const sesion = await verifySession();
            fiesta = recortarFiestaPorPerfil(fiesta, sesion.success ? sesion.user : null);
            if (sesion.success && perfilDe(sesion.user) === 'personal') {
                delete (fiesta as any).clientPortalSettings;
            }
        }
        fiesta = marcarItemLectura(fiesta as unknown as Record<string, unknown>, (fiesta as any)._syncedAt, CAMPOS_DE_PLATA_Y_CONTRATO) as unknown as FiestaEnPlanificacion;
    }
    return { fiesta, fallo };
}

export async function getFiestaParaPantalla(fiestaId: string): Promise<{ fiesta: FiestaEnPlanificacion | null; fallo: boolean }> {
    await requireAppSession();
    return await leerFiestaConEstado(fiestaId);
}

export async function getFiestaBySlug(slug: string): Promise<FiestaEnPlanificacion | null> {
  const normalized = normalizeInvitationSlug(slug);
  if (!normalized) return null;
  // Publica a proposito: es el enlace corto de la invitacion, que abre el invitado.
  const fiestas = await leerFiestasCrudas(true);
  const fiesta = fiestas.find(f => f.invitacionSlug === normalized) || null;
  // Al invitado le llega la invitaciÃ³n, no la clave del portal ni las credenciales (auditorÃ­a 69).
  if (!fiesta) return null;
  return (await quienEsElEquipo())(fiesta) ? fiesta : paraAfuera(fiesta);
}

export async function updateInvitacionSlug(fiestaId: string, slug: string): Promise<{ success: boolean; slug?: string; error?: string }> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

  const normalized = normalizeInvitationSlug(slug);
  if (!isValidInvitationSlug(normalized)) {
    return { success: false, error: 'El slug debe usar solo letras minÃºsculas, nÃºmeros y guiones.' };
  }

  const allFiestas = await getFiestas(true);
  const existing = allFiestas.find(f => f.id !== fiestaId && f.invitacionSlug === normalized);
  if (existing) {
    return { success: false, error: 'Ese enlace ya estÃ¡ en uso. ProbÃ¡ con otro.' };
  }

  const result = await saveFiesta({ ...fiesta, invitacionSlug: normalized });
  if (!result.success) {
    return { success: false, error: result.error || 'No se pudo guardar el enlace personalizado.' };
  }

  return { success: true, slug: normalized };
}

// --- HELPERS DE SINCRONIZACIÃ“N ---

/** Returns true if the item's service name or category contains any of the given keywords (case-insensitive). */
function itemMatchesKeywords(item: ItemPresupuestado, keywords: string[]): boolean {
    const haystack = `${item.nombreServicio} ${item.categoriaServicio || ''} ${item.subcategoria || ''}`.toLowerCase();
    return keywords.some(k => haystack.includes(k.toLowerCase()));
}

/**
 * Merges bebidas items from the budget into the fiesta's bebidas data.
 * Activates matching categories and adds new items without overwriting existing ones.
 */
function syncBebidasFromItems(existing: BebidasData, bebidaItems: ItemPresupuestado[]): BebidasData {
    if (bebidaItems.length === 0) return existing;

    const categorias: BebidaCategoria[] = existing.categorias.map(cat => ({ ...cat, items: [...(cat.items || [])] }));

    const findOrActivateCategory = (catId: string): BebidaCategoria | undefined => {
        let cat = categorias.find(c => c.id === catId);
        if (!cat) {
            const defaultCat = defaultBebidasData.categorias.find(c => c.id === catId);
            if (defaultCat) {
                cat = { ...defaultCat, activada: true, items: [] };
                categorias.push(cat);
            }
        }
        if (cat) cat.activada = true;
        return cat;
    };

    for (const item of bebidaItems) {
        const name = item.nombreServicio.toLowerCase();
        let targetCatId = 'barra_tragos'; // default

        if (name.includes('cerveza')) targetCatId = 'cervezas';
        else if (name.includes('vino') || name.includes('espumante') || name.includes('champagne')) targetCatId = 'vinos_espumantes';
        else if (name.includes('jugo')) targetCatId = 'jugos';
        else if (name.includes('gaseosa') || name.includes('refresco') || name.includes('cola')) targetCatId = 'refrescos_gaseosas';
        else if (name.includes('agua')) targetCatId = 'aguas_saborizadas';
        else if (name.includes('cafÃ©') || name.includes('cafe') || name.includes('cafeterÃ­a') || name.includes('cafeteria') || name.includes('tÃ© ') || name.includes(' tÃ©') || name.includes('infusiÃ³n')) targetCatId = 'cafeteria';
        else if (name.includes('cÃ³ctel') || name.includes('coctel') || name.includes('bienvenida')) targetCatId = 'coctel_bienvenida';

        const cat = findOrActivateCategory(targetCatId);
        if (!cat) continue;

        // Only add if not already present (identified by origenId)
        const alreadyExists = cat.items.some(i => i.origenId === item.idServicioCatalogo);
        if (!alreadyExists) {
            const newItem: BebidaItem = {
                id: `sync_beb_${item.idServicioCatalogo}`,
                nombre: item.nombreServicio,
                cantidadNecesaria: item.cantidad || 1,
                unidadCantidad: item.unidad,
                costoUnitario: item.precioUnitario,
                costoTotal: item.costoTotalItem,
                notas: item.descripcionServicio,
                origenId: item.idServicioCatalogo,
            };
            cat.items.push(newItem);
        }
    }

    return { ...existing, categorias };
}

/**
 * Merges reposterÃ­a items from the budget into the fiesta's reposterÃ­a data.
 */
function syncReposteriaFromItems(existing: ReposteriaData, reposteriaItems: ItemPresupuestado[]): ReposteriaData {
    if (reposteriaItems.length === 0) return existing;

    const categorias: ReposteriaCategoria[] = existing.categorias.map(cat => ({ ...cat, items: [...(cat.items || [])] }));

    const findOrActivateCategory = (catId: string): ReposteriaCategoria | undefined => {
        let cat = categorias.find(c => c.id === catId);
        if (!cat) {
            const defaultCat = defaultReposteriaData.categorias.find(c => c.id === catId);
            if (defaultCat) {
                cat = { ...defaultCat, activada: true, items: [] };
                categorias.push(cat);
            }
        }
        if (cat) cat.activada = true;
        return cat;
    };

    for (const item of reposteriaItems) {
        const name = item.nombreServicio.toLowerCase();
        let targetCatId = 'mesa_postres'; // default

        if (name.includes('torta') || name.includes('pastel') || name.includes('cake')) targetCatId = 'mesa_postres';
        else if (name.includes('candy') || name.includes('dulce') || name.includes('golosina')) targetCatId = 'candy_bar';
        else if (name.includes('chocolate') || name.includes('fuente')) targetCatId = 'fuente_chocolate';
        else if (name.includes('helado')) targetCatId = 'mesa_helada';

        const cat = findOrActivateCategory(targetCatId);
        if (!cat) continue;

        const alreadyExists = cat.items.some(i => i.origenId === item.idServicioCatalogo);
        if (!alreadyExists) {
            const newItem: ReposteriaItem = {
                id: `sync_rep_${item.idServicioCatalogo}`,
                nombre: item.nombreServicio,
                description: item.descripcionServicio,
                cantidad: item.cantidad,
                unidad: item.unidad,
                costoEstimado: item.costoTotalItem,
                origenId: item.idServicioCatalogo,
            };
            cat.items.push(newItem);
        }
    }

    return { ...existing, categorias };
}

/**
 * Merges decoraciÃ³n items from the budget into the fiesta's decoraciÃ³n data.
 */
function syncDecoracionFromItems(existing: DecoracionData, decorItems: ItemPresupuestado[]): DecoracionData {
    if (decorItems.length === 0) return existing;

    const currentItems: DecorationItem[] = [...(existing.items || [])];

    for (const item of decorItems) {
        const alreadyExists = currentItems.some(i => i.id === `sync_dec_${item.idServicioCatalogo}`);
        if (!alreadyExists) {
            const newItem: DecorationItem = {
                id: `sync_dec_${item.idServicioCatalogo}`,
                name: item.nombreServicio,
                category: item.subcategoria || item.categoriaServicio,
                quantity: item.cantidad || 1,
                estimatedCost: item.costoTotalItem,
                notes: item.descripcionServicio,
            };
            currentItems.push(newItem);
        }
    }

    return { ...existing, items: currentItems };
}

/**
 * Pre-populates gestionCostos with all non-gift budget line items.
 * Preserves manually-added cost items and updates existing synced items.
 */
function syncCostosFromBudget(existing: GestionCostosData, items: ItemPresupuestado[], totalConDescuento: number): GestionCostosData {
    const SYNC_PREFIX = 'sync_budget_';
    const manualItems = (existing.costosItems || []).filter(i => !i.id.startsWith(SYNC_PREFIX));
    const syncedItems: CostoItem[] = [];

    for (const item of items) {
        if (item.esRegalo) continue;
        syncedItems.push({
            id: `${SYNC_PREFIX}${item.idServicioCatalogo}`,
            nombre: item.nombreServicio,
            category: item.categoriaServicio || 'Otros servicios',
            montoEstimado: Math.round(item.costoTotalItem),
            notas: `Sincronizado desde presupuesto. ${item.descripcionServicio || ''}`.trim(),
        });
    }

    return {
        ...existing,
        ingresosTotalesEstimados: Math.round(totalConDescuento),
        costosItems: [...manualItems, ...syncedItems],
    };
}

/**
 * Pre-populates listaDeCargaOperativa from budget items using the activos fijos catalog.
 * Mirrors the logic of the "Sincronizar desde Presupuesto" button in the UI.
 */
async function syncCargaOperativaFromBudget(
    fiestaId: string,
    existing: ListaDeCargaOperativa,
    items: ItemPresupuestado[],
    totalInvitados: number,
): Promise<ListaDeCargaOperativa> {
    const activos = await getActivosFijos();

    // Map budget item categories/names to activos categories
    const targetAssetCategories = new Set<string>();
    for (const item of items) {
        const cat = (item.categoriaServicio || '').toLowerCase();
        const name = item.nombreServicio.toLowerCase();
        if (cat.includes('discoteca') || name.includes('dj')) targetAssetCategories.add('Discoteca');
        if (cat.includes('decoraciÃ³n') || cat.includes('decoracion') || name.includes('ambientaciÃ³n') || name.includes('ambientacion')) {
            targetAssetCategories.add('DecoraciÃ³n (Activo)');
            targetAssetCategories.add('Mobiliario');
        }
        if (cat.includes('catering') || name.includes('vajilla') || name.includes('mantel') || name.includes('silla') || name.includes('mesa')) {
            targetAssetCategories.add('Vajilla (Activo)');
            targetAssetCategories.add('MantelerÃ­a');
            targetAssetCategories.add('Equipamiento de Cocina');
        }
        if (cat.includes('bebida') || name.includes('barra') || name.includes('trago')) {
            targetAssetCategories.add('Barra de Tragos');
        }
    }

    if (targetAssetCategories.size === 0) return existing;

    // Keep existing categories that were added manually or have a different source
    const SYNC_CAT_PREFIX = 'sync_cat_';
    const manualCategorias: CargaOperativaCategoria[] = (existing.categorias || []).filter(c => !c.id.startsWith(SYNC_CAT_PREFIX));
    const newCategories: CargaOperativaCategoria[] = [];

    for (const catName of Array.from(targetAssetCategories)) {
        const matchingAssets = activos.filter(a => a.categoria === catName);
        if (matchingAssets.length === 0) continue;

        const itemsForCat: CargaOperativaItem[] = matchingAssets.map(asset => {
            let qty = '1';
            if (asset.categoria?.includes('Vajilla')) {
                qty = String(totalInvitados);
            } else if (asset.categoria?.includes('MantelerÃ­a') && asset.nombre.toLowerCase().includes('mantel')) {
                qty = String(Math.ceil(totalInvitados / 8));
            } else if (asset.invitadosPorUnidad) {
                qty = String(Math.ceil(totalInvitados / asset.invitadosPorUnidad));
            }

            return {
                id: `sync_asset_${asset.id}`,
                nombre: asset.nombre,
                cantidad: qty,
                unidad: asset.unidad || 'Uds.',
                cargado: false,
                origenId: asset.id,
            };
        });

        newCategories.push({
            id: `${SYNC_CAT_PREFIX}${catName.replace(/\s+/g, '_').replace(/[()]/g, '')}`,
            nombre: catName,
            items: itemsForCat,
        });
    }

    return {
        ...existing,
        categorias: [...manualCategorias, ...newCategories],
    };
}

function generateTareasFromServices(modulos: ModulosContratados, eventoTipo: string): Tarea[] {
    const tareas: Tarea[] = [];
    let idCounter = 1;
    const makeId = () => `auto_tarea_${Date.now()}_${idCounter++}`;

    // Tareas generales siempre presentes
    const tareasGenerales = [
        'Confirmar fecha y lugar del evento',
        'Enviar invitaciones a los invitados',
        'Confirmar nÃºmero final de invitados',
        'Preparar lista de invitados con necesidades especiales',
        'Hacer check de equipo y materiales el dÃ­a anterior',
    ];
    tareasGenerales.forEach(texto => tareas.push({ id: makeId(), texto, completada: false, asignadaA: 'Organizador', esPredeterminada: true }));

    if (modulos.catering) {
        ['Confirmar menÃº definitivo con el cliente', 'Calcular insumos y hacer lista de compras', 'Coordinar personal de cocina', 'Verificar restricciones alimentarias de invitados'].forEach(texto =>
            tareas.push({ id: makeId(), texto: `[Catering] ${texto}`, completada: false, asignadaA: 'Organizador', esPredeterminada: true })
        );
    }

    if (modulos.musica) {
        ['Confirmar playlist o setlist con el DJ/Banda', 'Verificar equipo de sonido e iluminaciÃ³n', 'Coordinar horarios de DJ'].forEach(texto =>
            tareas.push({ id: makeId(), texto: `[MÃºsica] ${texto}`, completada: false, asignadaA: 'Organizador', esPredeterminada: true })
        );
    }

    if (modulos.fotografia) {
        ['Confirmar horario y lugar con fotÃ³grafo/filmador', 'Preparar lista de fotos especiales requeridas', 'Coordinar acceso del fotÃ³grafo al lugar'].forEach(texto =>
            tareas.push({ id: makeId(), texto: `[Foto/Video] ${texto}`, completada: false, asignadaA: 'Organizador', esPredeterminada: true })
        );
    }

    if (modulos.decoracion) {
        ['Confirmar esquema de decoraciÃ³n con el cliente', 'Coordinar montaje y desmontaje de decoraciÃ³n', 'Verificar disponibilidad de materiales decorativos'].forEach(texto =>
            tareas.push({ id: makeId(), texto: `[DecoraciÃ³n] ${texto}`, completada: false, asignadaA: 'Organizador', esPredeterminada: true })
        );
    }

    // Tareas cliente
    tareas.push({ id: makeId(), texto: 'Confirmar asistencia al evento', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
    tareas.push({ id: makeId(), texto: 'Compartir lista de invitados VIP', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
    if (eventoTipo?.toLowerCase().includes('boda') || eventoTipo?.toLowerCase().includes('casamiento')) {
        tareas.push({ id: makeId(), texto: '[Boda] Confirmar canciÃ³n de apertura y primer baile', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
        tareas.push({ id: makeId(), texto: '[Boda] Entregar lista de testigos y padrinos', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
    }
    if (eventoTipo?.toLowerCase().includes('xv') || eventoTipo?.toLowerCase().includes('quince')) {
        tareas.push({ id: makeId(), texto: '[XV AÃ±os] Confirmar vals de honor y vals sorpresa', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
        tareas.push({ id: makeId(), texto: '[XV AÃ±os] Confirmar chambelanes/damas de honor', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
    }

    return tareas;
}

function generateItinerarioSugerido(eventoTipo: string, modulos: ModulosContratados): ProgramaEventoItem[] {
    const items: ProgramaEventoItem[] = [];
    let idCounter = 1;
    const makeId = () => `auto_prog_${Date.now()}_${idCounter++}`;

    const isBoda = eventoTipo?.toLowerCase().includes('boda') || eventoTipo?.toLowerCase().includes('casamiento');
    const isXV = eventoTipo?.toLowerCase().includes('xv') || eventoTipo?.toLowerCase().includes('quince');
    const isCorporativo = eventoTipo?.toLowerCase().includes('corpor') || eventoTipo?.toLowerCase().includes('empresa') || eventoTipo?.toLowerCase().includes('business') || eventoTipo?.toLowerCase().includes('networking');

    if (isBoda) {
        items.push({ id: makeId(), hora: '18:00', titulo: 'Llegada de invitados', descripcion: 'RecepciÃ³n y bienvenida en la entrada del salÃ³n', icono: 'ðŸ‘‹' });
        items.push({ id: makeId(), hora: '19:00', titulo: 'Ceremonia', descripcion: 'Ceremonia civil o religiosa de los novios', icono: 'ðŸ’' });
        items.push({ id: makeId(), hora: '20:00', titulo: 'CÃ³ctel', descripcion: 'Aperitivos y bienvenida formal a los invitados', icono: 'ðŸ¥‚' });
        items.push({ id: makeId(), hora: '21:00', titulo: 'Ingreso al salÃ³n', descripcion: 'Entrada de los novios y primera danza', icono: 'ðŸŽŠ' });
        items.push({ id: makeId(), hora: '21:15', titulo: 'Vals de Novios', descripcion: 'Primer baile de los reciÃ©n casados', icono: 'ðŸ’ƒ' });
        if (modulos.catering) items.push({ id: makeId(), hora: '21:30', titulo: 'Cena', descripcion: 'Servicio de cena para todos los invitados', icono: 'ðŸ½ï¸' });
        if (modulos.musica) items.push({ id: makeId(), hora: '23:00', titulo: 'Pista de baile', descripcion: 'DJ / Banda en vivo â€” fiesta abierta', icono: 'ðŸŽ¶' });
        items.push({ id: makeId(), hora: '01:00', titulo: 'Torta', descripcion: 'Corte de torta nupcial', icono: 'ðŸŽ‚' });
        items.push({ id: makeId(), hora: '04:00', titulo: 'Cierre', descripcion: 'Agradecimientos y despedida de invitados', icono: 'ðŸŒ…' });
    } else if (isXV) {
        items.push({ id: makeId(), hora: '19:00', titulo: 'Llegada de invitados', descripcion: 'RecepciÃ³n y bienvenida en la entrada del salÃ³n', icono: 'ðŸ‘‹' });
        items.push({ id: makeId(), hora: '20:00', titulo: 'Ingreso de la festejada', descripcion: 'Entrada de la quinceaÃ±era al salÃ³n', icono: 'ðŸ‘‘' });
        items.push({ id: makeId(), hora: '20:15', titulo: 'Vals de honor', descripcion: 'Primer vals de la quinceaÃ±era con su padre/padrino', icono: 'ðŸ’ƒ' });
        items.push({ id: makeId(), hora: '20:30', titulo: 'Vals sorpresa', descripcion: 'CoreografÃ­a sorpresa de chambelanes/damas de honor', icono: 'ðŸŽ­' });
        if (modulos.catering) items.push({ id: makeId(), hora: '21:00', titulo: 'Cena', descripcion: 'Servicio de cena para todos los invitados', icono: 'ðŸ½ï¸' });
        if (modulos.musica) items.push({ id: makeId(), hora: '22:30', titulo: 'Pista de baile', descripcion: 'DJ en vivo â€” fiesta abierta', icono: 'ðŸŽ¶' });
        items.push({ id: makeId(), hora: '00:30', titulo: 'Torta', descripcion: 'Corte de torta de la quinceaÃ±era', icono: 'ðŸŽ‚' });
        items.push({ id: makeId(), hora: '03:00', titulo: 'Cierre', descripcion: 'Agradecimientos y despedida de invitados', icono: 'ðŸŒ…' });
    } else if (isCorporativo) {
        items.push({ id: makeId(), hora: '09:00', titulo: 'AcreditaciÃ³n y Bienvenida', descripcion: 'RecepciÃ³n de asistentes, entrega de credenciales y cafÃ© de bienvenida', icono: 'ðŸ‘‹' });
        items.push({ id: makeId(), hora: '09:30', titulo: 'Apertura y PresentaciÃ³n', descripcion: 'Discurso de apertura por parte de directivos', icono: 'ðŸŽ¤' });
        items.push({ id: makeId(), hora: '10:30', titulo: 'Coffee Break', descripcion: 'Espacio de networking y cafeterÃ­a', icono: 'â˜•' });
        items.push({ id: makeId(), hora: '11:00', titulo: 'Paneles y Charlas', descripcion: 'Exposiciones de especialistas del sector', icono: 'ðŸ“Š' });
        if (modulos.catering) items.push({ id: makeId(), hora: '13:00', titulo: 'Almuerzo de Trabajo', descripcion: 'Catering corporativo formal para los asistentes', icono: 'ðŸ½ï¸' });
        items.push({ id: makeId(), hora: '14:30', titulo: 'Talleres / Workshops', descripcion: 'Sesiones interactivas grupales', icono: 'ðŸ’¼' });
        items.push({ id: makeId(), hora: '16:30', titulo: 'Cierre de Actividades', descripcion: 'Palabras de cierre, conclusiones y prÃ³ximos pasos', icono: 'ðŸ' });
        if (modulos.musica) items.push({ id: makeId(), hora: '17:00', titulo: 'After Office / CÃ³ctel', descripcion: 'Cierre de jornada con DJ en vivo, barra de tragos y networking informal', icono: 'ðŸ¥‚' });
    } else {
        // Fiesta general / cumpleaÃ±os
        items.push({ id: makeId(), hora: '20:00', titulo: 'Llegada de invitados', descripcion: 'RecepciÃ³n y bienvenida', icono: 'ðŸ‘‹' });
        items.push({ id: makeId(), hora: '20:30', titulo: 'Apertura oficial', descripcion: 'Palabras de bienvenida del festejado/organizador', icono: 'ðŸŽ‰' });
        if (modulos.catering) items.push({ id: makeId(), hora: '21:00', titulo: 'Cena', descripcion: 'Servicio de cena para todos los invitados', icono: 'ðŸ½ï¸' });
        if (modulos.musica) items.push({ id: makeId(), hora: '22:30', titulo: 'Pista de baile', descripcion: 'DJ en vivo â€” fiesta abierta', icono: 'ðŸŽ¶' });
        items.push({ id: makeId(), hora: '00:00', titulo: 'Torta', descripcion: 'Corte de torta y brindis', icono: 'ðŸŽ‚' });
        items.push({ id: makeId(), hora: '03:00', titulo: 'Cierre', descripcion: 'Agradecimientos y despedida de invitados', icono: 'ðŸŒ…' });
    }

    return items;
}

function generateCartaTragosSugerida(eventoTipo: string, clienteNombre: string): CartaTragosData {
    const isBoda = eventoTipo?.toLowerCase().includes('boda') || eventoTipo?.toLowerCase().includes('casamiento');
    const isCorp = eventoTipo?.toLowerCase().includes('corpor') || eventoTipo?.toLowerCase().includes('empresa') || eventoTipo?.toLowerCase().includes('business') || eventoTipo?.toLowerCase().includes('networking');

    if (isBoda) {
        return {
            titulo: 'CARTA DE TRAGOS',
            protagonistaNombre: 'Los Novios',
            numeroPrincipal: 'Nuestra Boda',
            fontFamily: 'Playfair Display',
            titleSize: 'medium',
            protagonistaFotoUrl: '',
            backgroundImageUrl: '',
            backgroundColor: '#ffffff',
            paletaColores: { primary: '#6d8b74', secondary: '#363636', accent: '#ffffff' },
            items: [
                { id: 'trago_novios_1', nombre: 'Mojito de los Novios', imageUrl: '', aiHint: 'mojito lime mint cocktail', descripcion: 'Ron blanco, menta fresca, lima y azÃºcar. El trago insignia de la noche para celebrar el amor.', ingredientes: ['Ron Blanco', 'Menta', 'Lima', 'Soda'], stockDisponible: 150 },
                { id: 'trago_1', nombre: 'Daiquiri de Durazno', imageUrl: '', aiHint: 'peach daiquiri cocktail', descripcion: 'Cremoso, frutal y muy fÃ¡cil de elegir para arrancar la noche con un sabor suave.', ingredientes: ['Ron', 'Durazno', 'Jugo de limÃ³n'], stockDisponible: 120 },
                { id: 'trago_2', nombre: 'Caipirinha', imageUrl: '', aiHint: 'caipirinha lime cocktail', descripcion: 'Un clÃ¡sico fresco y cÃ­trico, ideal para quienes quieren un trago con personalidad.', ingredientes: ['CachaÃ§a', 'Lima', 'AzÃºcar'], stockDisponible: 120 },
                { id: 'trago_5', nombre: 'Daiquiri de Frutilla', imageUrl: '', aiHint: 'strawberry daiquiri cocktail', descripcion: 'Colorido, dulce y muy pedido por quienes buscan un trago vistoso y frutal.', ingredientes: ['Ron', 'Frutilla', 'Jugo de limÃ³n'], stockDisponible: 120 },
                { id: 'trago_8', nombre: 'Fernet con Coca', imageUrl: '', aiHint: 'fernet cola drink', descripcion: 'Directo, conocido y rÃ¡pido de servir; una opciÃ³n segura para invitados clÃ¡sicos.', ingredientes: ['Fernet', 'Coca-Cola', 'Hielo'], stockDisponible: 120 },
                { id: 'trago_10', nombre: 'Destornillador', imageUrl: '', aiHint: 'screwdriver vodka orange cocktail', descripcion: 'Simple, fresco y reconocible: vodka con naranja.', ingredientes: ['Vodka', 'Jugo de naranja', 'Hielo'], stockDisponible: 120 },
            ],
            empresa: { linea1: 'AK PRODUCCIONES', linea2: 'Servicio de fiestas integral', contacto: '098 355 530' },
        };
    } else if (isCorp) {
        return {
            titulo: 'BARRA PREMIUM',
            protagonistaNombre: clienteNombre || 'Empresa',
            numeroPrincipal: 'Corporativo',
            fontFamily: 'Playfair Display',
            titleSize: 'medium',
            protagonistaFotoUrl: '',
            backgroundImageUrl: '',
            backgroundColor: '#ffffff',
            paletaColores: { primary: '#1e3a8a', secondary: '#363636', accent: '#ffffff' },
            items: [
                { id: 'trago_corp_1', nombre: 'Gin Tonic Corporativo', imageUrl: '', aiHint: 'gin tonic rosemary cocktail', descripcion: 'Gin premium con agua tÃ³nica y un toque de romero y pepino, proyectando sobriedad y Ã©xito.', ingredientes: ['Gin', 'TÃ³nica', 'Romero', 'Pepino'], stockDisponible: 150 },
                { id: 'trago_2', nombre: 'Caipirinha', imageUrl: '', aiHint: 'caipirinha lime cocktail', descripcion: 'Un clÃ¡sico fresco y cÃ­trico, ideal para distenderse en el networking.', ingredientes: ['CachaÃ§a', 'Lima', 'AzÃºcar'], stockDisponible: 120 },
                { id: 'trago_3', nombre: 'Arizona', imageUrl: '', aiHint: 'arizona iced tea cocktail', descripcion: 'Refrescante y liviano, con perfil de tÃ© helado y limÃ³n.', ingredientes: ['Vodka', 'TÃ© helado', 'LimÃ³n'], stockDisponible: 120 },
                { id: 'trago_8', nombre: 'Fernet con Coca', imageUrl: '', aiHint: 'fernet cola drink', descripcion: 'Directo, conocido y rÃ¡pido de servir; una opciÃ³n segura para invitados clÃ¡sicos.', ingredientes: ['Fernet', 'Coca-Cola', 'Hielo'], stockDisponible: 120 },
                { id: 'trago_10', nombre: 'Destornillador', imageUrl: '', aiHint: 'screwdriver vodka orange cocktail', descripcion: 'Simple, fresco y reconocible: vodka con naranja.', ingredientes: ['Vodka', 'Jugo de naranja', 'Hielo'], stockDisponible: 120 },
            ],
            empresa: { linea1: 'AK PRODUCCIONES', linea2: 'Servicio corporativo premium', contacto: '098 355 530' },
        };
    } else {
        // XV aÃ±os / General default
        return {
            titulo: 'CARTA DE TRAGOS',
            protagonistaNombre: clienteNombre || 'La Agasajada',
            numeroPrincipal: 'Mis XV',
            fontFamily: 'Playfair Display',
            titleSize: 'medium',
            protagonistaFotoUrl: '',
            backgroundImageUrl: '',
            backgroundColor: '#ffffff',
            paletaColores: { primary: '#9333ea', secondary: '#363636', accent: '#ffffff' },
            items: [
                { id: 'trago_1', nombre: 'Daiquiri de Durazno', imageUrl: '', aiHint: 'peach daiquiri cocktail', descripcion: 'Cremoso, frutal y muy fÃ¡cil de elegir para arrancar la noche con un sabor suave.', ingredientes: ['Ron', 'Durazno', 'Jugo de limÃ³n'], stockDisponible: 120 },
                { id: 'trago_2', nombre: 'Caipirinha', imageUrl: '', aiHint: 'caipirinha lime cocktail', descripcion: 'Un clÃ¡sico fresco y cÃ­trico, ideal para quienes quieren un trago con personalidad.', ingredientes: ['CachaÃ§a', 'Lima', 'AzÃºcar'], stockDisponible: 120 },
                { id: 'trago_3', nombre: 'Arizona', imageUrl: '', aiHint: 'arizona iced tea cocktail', descripcion: 'Refrescante y liviano, con perfil de tÃ© helado y limÃ³n para mantener la pista activa.', ingredientes: ['Vodka', 'TÃ© helado', 'LimÃ³n'], stockDisponible: 120 },
                { id: 'trago_4', nombre: 'Daiquiri de AnanÃ¡', imageUrl: '', aiHint: 'pineapple daiquiri cocktail', descripcion: 'Tropical, dulce y brillante; perfecto para fotos y para una barra con energÃ­a de fiesta.', ingredientes: ['Ron', 'AnanÃ¡', 'Jugo de limÃ³n'], stockDisponible: 120 },
                { id: 'trago_5', nombre: 'Daiquiri de Frutilla', imageUrl: '', aiHint: 'strawberry daiquiri cocktail', descripcion: 'Colorido, dulce y muy pedido por quienes buscan un trago vistoso y frutal.', ingredientes: ['Ron', 'Frutilla', 'Jugo de limÃ³n'], stockDisponible: 120 },
                { id: 'trago_6', nombre: 'Atomic Green', imageUrl: '', aiHint: 'green cocktail atomic', descripcion: 'Verde intenso, moderno y llamativo para pantallas, fotos y momentos de discoteca.', ingredientes: ['Licor de melÃ³n', 'Vodka', 'Sprite'], stockDisponible: 120 },
                { id: 'trago_7', nombre: 'Daiquiri Primavera', imageUrl: '', aiHint: 'spring daiquiri colorful cocktail', descripcion: 'Mix frutal alegre, pensado para una experiencia fresca y fÃ¡cil de recomendar.', ingredientes: ['Ron', 'Mix de frutas', 'Jugo de limÃ³n'], stockDisponible: 120 },
                { id: 'trago_8', nombre: 'Fernet con Coca', imageUrl: '', aiHint: 'fernet cola drink', descripcion: 'Directo, conocido y rÃ¡pido de servir; una opciÃ³n segura para invitados clÃ¡sicos.', ingredientes: ['Fernet', 'Coca-Cola', 'Hielo'], stockDisponible: 120 },
                { id: 'trago_9', nombre: 'Atardecer', imageUrl: '', aiHint: 'sunset tequila sunrise cocktail', descripcion: 'Naranja y granadina para un efecto visual tipo sunset, ideal para barra de tragos.', ingredientes: ['Tequila', 'Jugo de naranja', 'Granadina'], stockDisponible: 120 },
                { id: 'trago_10', nombre: 'Destornillador', imageUrl: '', aiHint: 'screwdriver vodka orange cocktail', descripcion: 'Simple, fresco y reconocible: vodka con naranja.', ingredientes: ['Vodka', 'Jugo de naranja', 'Hielo'], stockDisponible: 120 },
            ],
            empresa: { linea1: 'AK PRODUCCIONES', linea2: 'Servicio de fiestas integral', contacto: '098 355 530' },
        };
    }
}

/**
 * MOTOR DE SINCRONIZACIÃ“N MAESTRA
 * Dispara la configuraciÃ³n operativa de la fiesta basÃ¡ndose en el presupuesto aceptado.
 */
export async function syncFiestaFromBudget(fiestaId: string) {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta || !fiesta.presupuestoId) return { success: false, error: "Fiesta o presupuesto no encontrado" };

    const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
    if (!presupuesto) return { success: false, error: "Presupuesto no encontrado" };

    const roles = await leerRolesInterno();
    const updatedFiesta = { ...fiesta };

    const guests = presupuesto.invitadosCantidad || 100;
    const items = normalizeBudgetItemsForSync(presupuesto.itemsPresupuestados);

    // 1. ACTIVACIÃ“N DE MÃ“DULOS
    const modulos: ModulosContratados = { ...defaultModulosContratados };
    const hasItem = (term: string) => {
        const search = term.toLowerCase();
        return items.some(i => (i.nombreServicio || '').toLowerCase().includes(search));
    };

    modulos.catering = items.some(i => ['Entrada', 'Plato Principal', 'Postre', 'Servicio de catering', 'MenÃº Infantil', 'MenÃº Infantil/Adolescente'].includes(i.categoriaServicio || ''));
    modulos.musica = hasItem('discoteca') || hasItem(' dj') || items.some(i => ['Servicio de discoteca', 'Servicio de entretenimiento'].includes(i.categoriaServicio || ''));
    modulos.fotografia = hasItem('foto') || hasItem('film') || hasItem('video') || items.some(i => ['Servicio de filmaciÃ³n', 'Servicio de fotografÃ­a'].includes(i.categoriaServicio || ''));
    modulos.decoracion = items.some(i => i.categoriaServicio === 'Servicio de decoraciÃ³n') || hasItem('decorac') || hasItem('ambientac');
    modulos.regalos = true; // Siempre activo para coordinar
    Object.assign(modulos, deriveBudgetModulesForSync(items));

    updatedFiesta.modulosContratados = modulos;

    // 2. CÃLCULO DE PERSONAL AUTOMÃTICO (VACANTES)
    const personalReq: PersonalAsignadoDetalleStorage[] = [];

    const addVacantes = (roleSearch: string, qty: number, sueldo?: number) => {
        const rol = buscarRol(roles, roleSearch);
        if (rol) {
            for (let i = 0; i < qty; i++) {
                personalReq.push({
                    empleadoId: '', // Vacante
                    rolId: rol.id,
                    eventSalary: sueldo ?? rol.sueldoPorEvento
                });
            }
        }
    };

    // Regla: 1 mozo cada 25 invitados (si hay catering). Cocina, regla del dueÃ±o (21/10/2026): una
    // persona cada 25 invitados, y la primera es el chef. 100 invitados = chef + 3 ayudantes.
    if (modulos.catering) {
        addVacantes('Mozo', Math.ceil(guests / 25));
        const cocina = personalDeCocina(guests);
        addVacantes(roles.some(r => r.nombre.toLowerCase().includes('chef')) ? 'Chef' : 'Cocinero', cocina.chef);
        addVacantes('Ayudante de Cocina', cocina.ayudantes);
    }

    // Regla: 1 utilero cada 30 invitados para logÃ­stica (dueÃ±o, 21/10/2026)
    addVacantes('Utilero', utilerosPorInvitados(guests));

    // Regla: Especialistas segÃºn presupuesto
    if (modulos.musica) addVacantes('DJ', 1);
    if (hasItem('asado')) addVacantes('Asador', 1);
    if (hasItem('barra') || hasItem('trago')) {
        const barra = barmanPorInvitados(guests);
        addVacantes('Barman', barra.cantidad, barra.sueldo);
    }

    // Solo actualizar si no hay personal asignado manualmente aÃºn para no borrar trabajo
    if (!updatedFiesta.personalAsignado || updatedFiesta.personalAsignado.length === 0) {
        updatedFiesta.personalAsignado = personalReq;
    }

    // 3. ACTUALIZAR CONFIGURACIÃ“N DE PORTAL
    updatedFiesta.clientPortalSettings = mergeClientPortalSettingsForSync(updatedFiesta.clientPortalSettings);

    // 5. ACTUALIZAR CONFIG GENERAL
    updatedFiesta.configuracion = {
        ...updatedFiesta.configuracion,
        nombreEvento: `${presupuesto.eventoTipo} de ${
            presupuesto.protagonista1Nombre
                ? (presupuesto.protagonista2Nombre ? `${presupuesto.protagonista1Nombre} y ${presupuesto.protagonista2Nombre}` : presupuesto.protagonista1Nombre)
                : presupuesto.clienteNombre ? presupuesto.clienteNombre : (presupuesto.eventoTipo === 'XV aÃ±os' ? 'la QuinceaÃ±era' : (presupuesto.eventoTipo === 'Boda' ? 'los Novios' : 'el Agasajado'))
        }`,
        fechaEvento: presupuesto.eventoFecha,
        invitadosEstimados: guests,
        invitadosAdultos: presupuesto.invitadosAdultos,
        invitadosNinos: presupuesto.invitadosNinos,
        invitadosAdolescentes: presupuesto.invitadosAdolescentes,
        presupuestoEstimado: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
        nombreLugar: presupuesto.salonFiestas
    };

    // 6. SINCRONIZAR ESTADO DE LA FIESTA â€” nunca archivar automÃ¡ticamente
    // Solo el usuario puede archivar manualmente desde /eventos
    if (presupuesto.estado === 'Facturado') {
        updatedFiesta.estado = 'Facturado';
    } else if (!updatedFiesta.estado || updatedFiesta.estado === 'Archivada') {
        updatedFiesta.estado = 'En PlanificaciÃ³n';
    }

    // 7. SINCRONIZAR BEBIDAS â€” activar categorÃ­as y agregar Ã­tems del presupuesto
    const bebidaItems = items.filter(i =>
        i.categoriaServicio === 'Servicio de bebidas' ||
        itemMatchesKeywords(i, ['barra', 'trago', 'cerveza', 'vino', 'espumante', 'champagne', 'licor', 'fernet', 'whisky', 'ron', 'vodka', 'jugo', 'gaseosa', 'refresco', 'agua'])
    );
    if (bebidaItems.length > 0) {
        updatedFiesta.bebidas = syncBebidasFromItems(updatedFiesta.bebidas || defaultBebidasData, bebidaItems);
    }

    // 8. SINCRONIZAR REPOSTERÃA â€” activar categorÃ­as y agregar Ã­tems del presupuesto
    const reposteriaItems = items.filter(i =>
        i.categoriaServicio === 'Servicio de reposterÃ­a' ||
        itemMatchesKeywords(i, ['torta', 'reposterÃ­a', 'reposteria', 'dulce', 'candy', 'pastel', 'cake', 'chocolate', 'fuente', 'helado'])
    );
    if (reposteriaItems.length > 0) {
        updatedFiesta.reposteria = syncReposteriaFromItems(updatedFiesta.reposteria || defaultReposteriaData, reposteriaItems);
    }

    // 9. SINCRONIZAR DECORACIÃ“N â€” agregar Ã­tems decorativos del presupuesto
    const decorItems = items.filter(i =>
        i.categoriaServicio === 'Servicio de decoraciÃ³n' ||
        itemMatchesKeywords(i, ['decorac', 'ambientac', 'globo', 'flor', 'centro de mesa', 'backdrop'])
    );
    if (decorItems.length > 0) {
        updatedFiesta.decoracion = syncDecoracionFromItems(updatedFiesta.decoracion || defaultDecoracion, decorItems);
    }

    // 10. SINCRONIZAR COSTOS â€” pre-poblar con todos los Ã­tems del presupuesto
    updatedFiesta.gestionCostos = syncCostosFromBudget(
        updatedFiesta.gestionCostos || defaultGestionCostos,
        items,
        presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado
    );

    // 11. SINCRONIZAR CARGA OPERATIVA â€” equipamiento y activos fijos relacionados
    updatedFiesta.listaDeCargaOperativa = await syncCargaOperativaFromBudget(
        fiestaId,
        updatedFiesta.listaDeCargaOperativa || { categorias: [] },
        items,
        guests
    );

    // 12. TAREAS AUTOMÃTICAS por servicio (solo si no hay tareas previas)
    if (!updatedFiesta.tareas || updatedFiesta.tareas.length === 0) {
        updatedFiesta.tareas = generateTareasFromServices(modulos, presupuesto.eventoTipo || 'General');
    }

    // 13. ITINERARIO SUGERIDO por tipo de evento (solo si no hay itinerario previo)
    if (!updatedFiesta.programa || updatedFiesta.programa.length === 0) {
        updatedFiesta.programa = generateItinerarioSugerido(presupuesto.eventoTipo || 'General', modulos);
    }

    // 13b. CARTA DE TRAGOS SUGERIDA por tipo de evento (solo si no hay carta de tragos previa o tiene protagonistaNombre por defecto)
    if (!updatedFiesta.cartaTragos || !updatedFiesta.cartaTragos.items || updatedFiesta.cartaTragos.items.length === 0 || updatedFiesta.cartaTragos.protagonistaNombre === 'La Agasajada') {
        updatedFiesta.cartaTragos = generateCartaTragosSugerida(presupuesto.eventoTipo || 'General', presupuesto.clienteNombre || 'Festejado');
    }

    const saved = await saveFiesta(updatedFiesta);
    if (!saved.success) return saved;

    // 14. SINCRONIZAR LAVADERO despuÃ©s de guardar para evitar sobrescribir su actualizaciÃ³n de costos
    try {
        await syncLaundryCosts(fiestaId, guests, items);
    } catch (error: any) {
        logger.error('[syncFiestaFromBudget] Error al sincronizar costos de lavadero', {
            fiestaId,
            error: error?.message || String(error),
        });
        return { success: false, error: 'La fiesta se sincronizÃ³, pero fallÃ³ la actualizaciÃ³n de costos de lavadero.' };
    }

    return saved;
}

export async function deleteFiesta(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  // Borrar, archivar o cancelar una fiesta saca plata y trabajo de la cuenta: no alcanza con tener
  // sesiÃ³n (el personal y el operador tambiÃ©n la tienen). Pregunta 47, 10/10/2026.
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION);
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  try {
    if (isProduction) {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        await dbAdmin.collection(FIESTAS_DIR).doc(fiestaId).delete();
        return { success: true };
      }
    }
    // Development: filesystem fallback
    const dataDir = path.join(process.cwd(), 'src', 'data', FIESTAS_DIR);
    const files = await fs.readdir(dataDir);
    const fileToDelete = files.find(f => f === `${fiestaId}.json`);
    if (fileToDelete) {
      await fs.unlink(path.join(dataDir, fileToDelete));
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archiveFiesta(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION);
  try {
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA); // Se archiva entera, con costos y sueldos.
    if (!fiesta) throw new Error("Evento no encontrado.");
    const datePart = fiesta.configuracion.fechaEvento ? new Date(fiesta.configuracion.fechaEvento).toISOString().split('T')[0] : 'sin-fecha';
    const archiveFilename = `fiesta_archivada_${datePart}_${fiesta.id}.json`;
    await writeData(path.join(ARCHIVE_DIR, archiveFilename), fiesta);
    const delRes = await deleteFiesta(fiestaId);
    if (!delRes.success) {
      return { success: false, error: delRes.error || "No se pudo borrar el evento tras archivarlo." };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFiestaArchivada(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION);
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  try {
    if (isProduction) {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        // In Firestore the archive doc ID is fiesta_archivada_{date}_{fiestaId}
        // Query by the fiesta's 'id' field to find and delete it
        const snapshot = await dbAdmin.collection(ARCHIVE_DIR).where('id', '==', fiestaId).get();
        if (!snapshot.empty) {
          const batch = dbAdmin.batch();
          snapshot.docs.forEach((doc: { ref: any }) => batch.delete(doc.ref));
          await batch.commit();
          return { success: true };
        }
        return { success: false, error: "Archivo archivado no encontrado." };
      }
    }
    // Development: filesystem fallback
    const dataDir = path.join(process.cwd(), 'src', 'data', ARCHIVE_DIR);
    const files = await fs.readdir(dataDir);
    const fileToDelete = files.find(f => f.endsWith(`_${fiestaId}.json`));
    if (fileToDelete) {
      await fs.unlink(path.join(dataDir, fileToDelete));
      return { success: true };
    }
    return { success: false, error: "Archivo archivado no encontrado." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Resets the planificador by archiving all currently active fiestas.
 * This is a destructive admin-only operation; the UI must require explicit confirmation.
 * In production (Firestore), each active fiesta is archived; in local dev the files are moved.
 */
export async function resetAllActiveFiestas(): Promise<{ success: boolean; archivedCount?: number; errors?: string[]; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION);
  try {
    const activas = await getFiestas(false);
    const errors: string[] = [];
    let archivedCount = 0;

    for (const fiesta of activas) {
      const result = await archiveFiesta(fiesta.id);
      if (result.success) {
        archivedCount++;
      } else {
        errors.push(`${fiesta.id}: ${result.error}`);
      }
    }

    logger.info('[Planificador] Reinicio del planificador completado.', { archivedCount, errors });

    return { success: true, archivedCount, errors: errors.length ? errors : undefined };
  } catch (error: any) {
    logger.error('[Planificador] Error al reiniciar el planificador:', error);
    return { success: false, error: error.message || 'Error al reiniciar el planificador.' };
  }
}

/**
 * Permanently deletes ALL fiestas (active and archived) from Firestore.
 * This is a destructive admin-only operation; the UI must require explicit confirmation.
 */
export async function deleteAllFiestas(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  // Esta accion no comprobaba NADA: ni sesion. El comentario de arriba delegaba
  // la proteccion en la confirmacion de la pantalla, y una server action se
  // puede invocar sin pasar por la pantalla.
  const { requireAdminSession } = await import('@/lib/auth/require-session');
  const guard = await requireAdminSession();
  if (!guard.ok) return { success: false, error: guard.error };
  try {
    const activas = await getFiestas(false);
    const deletedCount = activas.length;

    const { dbAdmin } = await import('@/lib/firebase/server');
    if (dbAdmin) {
      const snapshot = await dbAdmin.collection('fiestas').get();
      const batchSize = 450;
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = dbAdmin.batch();
        docs.slice(i, i + batchSize).forEach((doc: { ref: any }) => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    logger.info('[Planificador] Todas las fiestas eliminadas permanentemente por admin.', { deletedCount });
    return { success: true, deletedCount };
  } catch (error: any) {
    logger.error('[Planificador] Error al eliminar todas las fiestas:', error);
    return { success: false, error: error.message || 'Error al eliminar todas las fiestas.' };
  }
}

export async function createFiestaVacia(
  clienteId?: string,
  clienteNombre?: string,
  opciones?: { idIntento?: string },
): Promise<{ success: boolean; newFiestaId?: string; error?: string }> {
    await requireAppSession();
    try {
        // Pregunta 58: si la respuesta se perdio y la persona reintenta, el evento ya esta con ese id.
        const idDeLaPantalla = idDelIntento('fiesta', opciones?.idIntento);
        if (idDeLaPantalla && (await getFiestaById(idDeLaPantalla))) return { success: true, newFiestaId: idDeLaPantalla };
        const newFiesta = {
            ...initialFiestaActualData,
            id: idDeLaPantalla ?? `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            estado: 'En PlanificaciÃ³n' as const,
            configuracion: {
                ...initialFiestaActualData.configuracion,
                fechaEvento: '',
                ...(clienteId ? { clienteId } : {}),
                ...(clienteNombre ? { clienteNombre } : {}),
            }
        };

        const result = await saveFiesta(newFiesta);

        if (!result.success) {
            return { success: false, error: result.error || 'No se pudo crear el evento.' };
        }

        return { success: true, newFiestaId: newFiesta.id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createDemoFiesta(
  kind: AkDemoFiestaKind
): Promise<{ success: boolean; newFiestaId?: string; error?: string }> {
  await requireAppSession();
  try {
    const demoFiesta = buildAkDemoFiesta(kind);
    const result = await saveFiesta(demoFiesta);
    if (!result.success) {
      return { success: false, error: result.error || 'No se pudo crear la demo.' };
    }
    return { success: true, newFiestaId: demoFiesta.id };
  } catch (error: any) {
    logger.error('[Planificador] Error creando demo AK:', error);
    return { success: false, error: error.message || 'No se pudo crear la demo AK.' };
  }
}

export async function updateFiestaPresupuestoId(fiestaId: string, presupuestoId: string | null): Promise<{ success: boolean; error?: string }> {
    await requirePermisoAlguno(PERMISOS.CONTABILIDAD); // revisiÃ³n de plata, 6/10/2026: no cualquier sesiÃ³n (enganchar facturas y presupuesto)
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Evento no encontrado.");
        const updatedFiesta: FiestaEnPlanificacion = { ...fiesta, presupuestoId: presupuestoId ?? undefined };
        return await saveFiesta(updatedFiesta);
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function resetFiestaActual(): Promise<{ success: boolean; error?: string }> {
    await requireAppSession();
    return { success: false, error: "FunciÃ³n deshabilitada por seguridad" };
}
export async function duplicateFiesta(fiestaId: string, opciones?: { idIntento?: string }): Promise<{ success: boolean; newFiestaId?: string; error?: string }> {
  await requireAppSession();
  try {
    // Pregunta 58: si la respuesta se perdio y la persona reintenta, la copia ya esta con ese id.
    const idDeLaPantalla = idDelIntento('fiesta_copy', opciones?.idIntento);
    if (idDeLaPantalla && (await getFiestaById(idDeLaPantalla))) return { success: true, newFiestaId: idDeLaPantalla };
    const original = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!original) throw new Error('Evento no encontrado.');
    const newFiesta: FiestaEnPlanificacion = {
      ...original,
      id: idDeLaPantalla ?? `fiesta_copy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      configuracion: { ...original.configuracion, nombreEvento: `[COPIA] ${original.configuracion.nombreEvento}` },
      presupuestoId: undefined, invoiceIds: [], pagosProveedores: [],
    };
    const result = await saveFiesta(newFiesta);
    return result.success ? { success: true, newFiestaId: newFiesta.id } : { success: false, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addInvoiceId(fiestaId: string, invoiceId: string, opciones?: { esReciboDeSena?: boolean }) {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD);
  const { actualizarFiesta: libActualizarFiesta } = await import('@/lib/fiesta/actualizar-fiesta');
  return await libActualizarFiesta(fiestaId, (f) => {
    const ids = f.invoiceIds || [];
    const limpia: FiestaEnPlanificacion = {
      ...f,
      invoiceIds: ids.includes(invoiceId) ? ids : [...ids, invoiceId],
    };
    if (opciones?.esReciboDeSena) {
      delete limpia.reciboSenaPendiente;
    }
    return limpia;
  });
}

export async function removeInvoiceId(fiestaId: string, invoiceId: string) {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD);
  const { actualizarFiesta: libActualizarFiesta } = await import('@/lib/fiesta/actualizar-fiesta');
  return await libActualizarFiesta(fiestaId, (f) => ({
    ...f,
    invoiceIds: (f.invoiceIds || []).filter(id => id !== invoiceId)
  }));
}

export async function updateMenuMesa(fiestaId: string, menuData: MenuMesaData) {
  await requireAppSession();
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, menuMesa: menuData });
}

export async function updateNumerosMesa(fiestaId: string, data: NumerosMesaData) {
  await requireAppSession();
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, numerosMesa: data });
}

export async function updateCartaTragos(fiestaId: string, data: CartaTragosData) {
  await requireAppSession();
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, cartaTragos: data });
}

/**
 * Phase 3: Update post-event data (gallery, NPS, referrals).
 */
export async function updateFiestaPostEvento(
  fiestaId: string,
  data: {
    galeriaUrl?: string;
    galeriaEntregada?: boolean;
    npsScore?: number;
    referidoPor?: string;
    referidosGenerados?: string[];
    postEventoCompletado?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false, error: 'Evento no encontrado.' };
  return await saveFiesta({ ...f, ...data });
}

/**
 * Crea un nuevo evento/fiesta vinculado a un cliente reciÃ©n creado.
 * Se usa cuando se crea un cliente directamente (no desde el CRM).
 */
export async function createNewFiestaForCustomer(customer: { id: string; name: string; partyDate?: string; partyType?: string; venueName?: string; guestCount?: number; }): Promise<{ success: boolean; fiestaId?: string; error?: string }> {
  await requireAppSession();
  try {
    const newFiesta: FiestaEnPlanificacion = {
      ...initialFiestaActualData,
      id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      estado: 'En PlanificaciÃ³n',
      configuracion: {
        ...initialFiestaActualData.configuracion,
        clienteId: customer.id,
        nombreEvento: customer.partyType ? `${customer.partyType} de ${customer.name}` : `Evento de ${customer.name}`,
        fechaEvento: customer.partyDate || '',
        nombreLugar: customer.venueName || '',
        invitadosEstimados: customer.guestCount || 0,
      },
      modulosContratados: { ...defaultModulosContratados },
    };
    const result = await saveFiesta(newFiesta);
    return result.success ? { success: true, fiestaId: newFiesta.id } : { success: false, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateGuestPortalSettings(fiestaId: string, settings: GuestPortalSettings) {
  await requireAppSession();
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false, error: 'Evento no encontrado.' };
  return await saveFiesta({ ...f, guestPortalSettings: settings });
}

export async function updateGuestExperienceSettings(fiestaId: string, settings: GuestExperienceSettings) {
  await requireAppSession();
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false, error: 'Evento no encontrado.' };
  return await saveFiesta({ ...f, guestExperienceSettings: settings });
}

export async function updateClienteDebeLlevar(fiestaId: string, items: ClienteDebeLlevarItem[]) {
  // SIN cuenta del equipo a proposito: esto lo toca EL CLIENTE desde su portal.
  // El guardado de abajo (`saveFiesta`) ya pide sesion del equipo O la clave del
  // cliente de esta fiesta. Pedir cuenta aca dejaba al cliente afuera de su propio
  // portal.
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false, error: 'Evento no encontrado.' };
  return await saveFiesta({ ...f, clienteDebeLlevar: items });
}

export async function updateGuestExperienceStats(
  fiestaId: string,
  invitadoId: string,
  stats: Partial<GuestExperienceStats>
) {
  await requireAppSession();
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false, error: 'Evento no encontrado.' };
  const invitados = (f.invitados ?? []).map((inv: Invitado) =>
    inv.id === invitadoId
      ? { ...inv, guestExperienceStats: { ...inv.guestExperienceStats, ...stats } }
      : inv
  );
  return await saveFiesta({ ...f, invitados });
}

async function recortarParaQuienPregunta(f: FiestaEnPlanificacion): Promise<FiestaEnPlanificacion> {
  const { verifySession } = await import('@/lib/auth/session-token');
  const sesion = await verifySession();
  const { recortarFiestaPorPerfil } = await import('@/lib/fiesta/recortar-para-afuera');
  return recortarFiestaPorPerfil(f, sesion.success ? sesion.user : null);
}

export async function suspenderFiestaAction(fiestaId: string, motivo: string, fecha?: string) {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION);
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false, error: 'Evento no encontrado.' };

  const { suspenderFiesta, calcularLiquidacionSuspension } = await import('@/lib/fiesta/revisar-fiestas');
  const suspendida = suspenderFiesta(f, motivo, fecha);
  // Total vigente (con ajuste anual) y lo cobrado confirmado, del estado de cuenta oficial del presupuesto.
  let totalVigente: number | undefined;
  let cobrado: number | undefined;
  if (f.presupuestoId) {
    const { getPresupuestoById } = await import('../presupuestos');
    const { calcularEstadoDeCuenta } = await import('@/lib/budget/saldo-con-ajuste');
    const presupuesto = await getPresupuestoById(f.presupuestoId);
    if (presupuesto) {
      const cuenta = calcularEstadoDeCuenta(presupuesto);
      totalVigente = cuenta.total;
      cobrado = cuenta.pagado;
    }
  }
  const liquidacion = calcularLiquidacionSuspension(suspendida, totalVigente, cobrado);
  const guardado = await saveFiesta(suspendida);

  // Orden 198: lo devuelto pasa por el perfil (la secretaria no ve costos ni sueldos ajenos).
  return { success: guardado.success, fiesta: await recortarParaQuienPregunta(suspendida), liquidacion };
}

export async function reactivarFiestaAction(fiestaId: string) {
  await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION);
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false, error: 'Evento no encontrado.' };

  const { reactivarFiesta } = await import('@/lib/fiesta/revisar-fiestas');
  const reactivada = reactivarFiesta(f);
  const guardado = await saveFiesta(reactivada);

  return { success: guardado.success, fiesta: await recortarParaQuienPregunta(reactivada) };
}

export async function obtenerFiestasParaRevisarAction() {
  await requireAppSession();
  let errorPresupuestos = false;
  let presupuestos: any[] | undefined = undefined;

  const fiestas = await leerFiestasCrudas(true);
  try {
    presupuestos = await getPresupuestos();
  } catch {
    errorPresupuestos = true;
    presupuestos = undefined;
  }

  const { obtenerFiestasParaRevisar } = await import('@/lib/fiesta/revisar-fiestas');
  const resultado = obtenerFiestasParaRevisar(fiestas, { presupuestos });
  if (errorPresupuestos) {
    (resultado as any).lecturaIncompleta = true;
  }
  return resultado;
}

export async function actualizarClienteYAgasajadoAction(
  fiestaId: string,
  clienteNombre: string,
  nombreAgasajado: string
) {
  await requireAppSession();
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false, error: 'Evento no encontrado.' };

  const actualizada: FiestaEnPlanificacion = {
    ...f,
    configuracion: {
      ...f.configuracion,
      clienteNombre: clienteNombre.trim(),
      nombreAgasajado: nombreAgasajado.trim(),
      protagonista1Nombre: nombreAgasajado.trim(),
    },
  };

  return await saveFiesta(actualizada);
}

export async function actualizarFiesta(
  fiestaId: string,
  updateFnOrPartial:
    | Partial<FiestaEnPlanificacion>
    | ((data: FiestaEnPlanificacion) => FiestaEnPlanificacion | Promise<FiestaEnPlanificacion>),
  options?: { publicRsvp?: boolean; soloEquipo?: boolean }
): Promise<{ success: boolean; updatedFiesta?: FiestaEnPlanificacion; error?: string }> {
  const usuario = await requireAppSession();
  const decide = await quienEsElEquipo();
  const { getFiestaByIdRaw } = await import('@/lib/fiesta/get-fiesta-raw');
  const guardada = await getFiestaByIdRaw(fiestaId);
  if (!guardada) {
    return { success: false, error: `Fiesta con ID ${fiestaId} no encontrada.` };
  }
  const puedeModificarFiesta = decide(guardada);
  if (!puedeModificarFiesta) {
    return { success: false, error: 'No autorizado para modificar este evento.' };
  }

  const tienePermisoPlata = perfilDe(usuario) === 'dueno' || puede(usuario, PERMISOS.CONTABILIDAD);
  if (!tienePermisoPlata && typeof updateFnOrPartial === 'object' && updateFnOrPartial !== null) {
    if (pideCambiarLaPlata(updateFnOrPartial, guardada)) {
      return { success: false, error: 'Cobros, contrato y estado de la fiesta los cambia contabilidad, desde su pantalla.' };
    }
  }

  const { actualizarFiesta: libActualizarFiesta } = await import('@/lib/fiesta/actualizar-fiesta');
  const r = await libActualizarFiesta(
    fiestaId,
    async (actual) => {
      let candidate: FiestaEnPlanificacion;
      if (typeof updateFnOrPartial === 'function') {
        candidate = await updateFnOrPartial(actual);
      } else {
        candidate = { ...actual, ...updateFnOrPartial };
      }
      if (!tienePermisoPlata && pideCambiarLaPlata(candidate, actual)) {
        throw new Error('Cobros, contrato y estado de la fiesta los cambia contabilidad, desde su pantalla.');
      }
      return candidate;
    },
    { soloEquipo: true }
  );
  if (!r.success) {
    return { success: false, error: r.error };
  }
  return { success: true, updatedFiesta: recortarFiestaParaAfuera(r.updatedFiesta ?? guardada, usuario) };
}

/**
 * Guarda la entrega del Ã¡lbum de fotos digital por Wfolio.
 * Requiere sesiÃ³n de la app y valida que el link sea un dominio oficial de Wfolio.
 */
export async function guardarAlbumWfolioAction(
  fiestaId: string,
  wfolioUrl: string
): Promise<{ success: boolean; delivery?: WfolioAlbumDelivery; error?: string }> {
  await requireAppSession();
  const urlLimpia = (wfolioUrl || '').trim();
  if (!isValidWfolioUrl(urlLimpia)) {
    return { success: false, error: 'El enlace debe pertenecer a wfolio.com o wfolio.pro.' };
  }
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false, error: 'Evento no encontrado.' };

  const eventName = f.configuracion?.nombreEvento || 'Fiesta';
  const clientName = f.configuracion?.clienteNombre;
  const delivery = buildWfolioDelivery({
    fiestaId,
    eventName,
    clientName,
    wfolioUrl: urlLimpia,
  });

  const res = await saveFiesta({
    ...f,
    galeriaUrl: urlLimpia,
    galeriaEntregada: true,
    wfolioDelivery: delivery,
  } as any);

  if (!res.success) {
    return { success: false, error: res.error || 'No se pudo guardar la entrega del Ã¡lbum.' };
  }

  return { success: true, delivery };
}

