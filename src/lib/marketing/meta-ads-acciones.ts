import { readData, writeData } from '@/lib/data-service';
import {
  puedeComprometer,
  type CampanaConPresupuesto,
} from '@/lib/marketing/tope-de-gasto-publicidad';

const ARCHIVO_ACCIONES = 'publicidad-acciones-ejecutadas.json';

export interface AccionPublicidadEjecutada {
  id: string;
  fecha: string;
  tipo: 'pausar' | 'reactivar' | 'ajustar_presupuesto' | 'crear_campana';
  campanaId: string;
  campanaNombre: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  presupuestoAnteriorUYU?: number;
  presupuestoNuevoUYU?: number;
  motivo: string;
  ejecutadoConExito: boolean;
  resultadoDetalle?: string;
}

export async function getAccionesPublicidadEjecutadas(): Promise<AccionPublicidadEjecutada[]> {
  try {
    const acciones = await readData<AccionPublicidadEjecutada[] | null>(ARCHIVO_ACCIONES, []);
    return Array.isArray(acciones) ? acciones : [];
  } catch {
    return [];
  }
}

export async function registrarAccionPublicidad(
  datos: Omit<AccionPublicidadEjecutada, 'id' | 'fecha'>
): Promise<AccionPublicidadEjecutada> {
  const registro: AccionPublicidadEjecutada = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fecha: new Date().toISOString(),
    ...datos,
  };

  try {
    const previas = await getAccionesPublicidadEjecutadas();
    await writeData(ARCHIVO_ACCIONES, [registro, ...previas].slice(0, 100));
  } catch (error) {
    console.error('Error al persistir registro de acción de publicidad:', error);
  }

  return registro;
}

async function ejecutarLlamadaGraphApi(
  endpoint: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; data?: any; error?: string }> {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  if (!accessToken) {
    // Si no hay token de Meta en el entorno, actúa en modo simulado seguro para pruebas y desarrollo.
    return { success: true, data: { simulated: true } };
  }

  try {
    const apiVersion = process.env.META_GRAPH_API_VERSION || 'v25.0';
    const url = `https://graph.facebook.com/${apiVersion}/${endpoint}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson?.error?.message || `Error HTTP ${res.status}` };
    }

    const json = await res.json();
    return { success: true, data: json };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error de red con Meta API' };
  }
}

/**
 * Pausar una campaña. Pausar SIEMPRE está permitido porque reduce el gasto.
 */
export async function pausarCampana(
  campaignId: string,
  campaignName: string,
  motivo: string
): Promise<{ success: boolean; error?: string }> {
  const resultado = await ejecutarLlamadaGraphApi(campaignId, { status: 'PAUSED' });

  await registrarAccionPublicidad({
    tipo: 'pausar',
    campanaId: campaignId,
    campanaNombre: campaignName,
    estadoAnterior: 'ACTIVE',
    estadoNuevo: 'PAUSED',
    motivo,
    ejecutadoConExito: resultado.success,
    resultadoDetalle: resultado.success ? 'Campaña pausada correctamente.' : resultado.error,
  });

  return resultado;
}

/**
 * Reactivar una campaña pausada validando que el compromiso no exceda el tope.
 */
export async function reactivarCampana(params: {
  campaignId: string;
  campaignName: string;
  presupuestoDiarioUYU: number;
  campanas: CampanaConPresupuesto[];
  motivo: string;
}): Promise<{ success: boolean; motivoRechazo?: string }> {
  const { campaignId, campaignName, presupuestoDiarioUYU, campanas, motivo } = params;

  // Reactivar es ENCENDER, y encender lo decide el dueno: el freno lo niega siempre,
  // antes de mirar si queda tope. Sin este `tipo` la prohibicion se salteaba.
  const veredicto = await puedeComprometer({
    campanas,
    presupuestoDiarioActualUYU: 0,
    nuevoPresupuestoDiarioUYU: presupuestoDiarioUYU,
    tipo: 'encender',
  });

  if (!veredicto.permitido) {
    await registrarAccionPublicidad({
      tipo: 'reactivar',
      campanaId: campaignId,
      campanaNombre: campaignName,
      estadoAnterior: 'PAUSED',
      estadoNuevo: 'PAUSED',
      presupuestoNuevoUYU: presupuestoDiarioUYU,
      motivo: `No se pudo reactivar: ${veredicto.motivo}`,
      ejecutadoConExito: false,
      resultadoDetalle: veredicto.motivo,
    });
    return { success: false, motivoRechazo: veredicto.motivo };
  }

  const resultado = await ejecutarLlamadaGraphApi(campaignId, { status: 'ACTIVE' });

  await registrarAccionPublicidad({
    tipo: 'reactivar',
    campanaId: campaignId,
    campanaNombre: campaignName,
    estadoAnterior: 'PAUSED',
    estadoNuevo: 'ACTIVE',
    presupuestoNuevoUYU: presupuestoDiarioUYU,
    motivo,
    ejecutadoConExito: resultado.success,
    resultadoDetalle: resultado.success ? 'Campaña reactivada.' : resultado.error,
  });

  return { success: resultado.success, motivoRechazo: resultado.error };
}

/**
 * Ajustar el presupuesto diario de una campaña activa.
 */
export async function ajustarPresupuestoCampana(params: {
  campaignId: string;
  campaignName: string;
  presupuestoDiarioActualUYU: number;
  nuevoPresupuestoDiarioUYU: number;
  campanas: CampanaConPresupuesto[];
  motivo: string;
}): Promise<{ success: boolean; motivoRechazo?: string }> {
  const {
    campaignId,
    campaignName,
    presupuestoDiarioActualUYU,
    nuevoPresupuestoDiarioUYU,
    campanas,
    motivo,
  } = params;

  // Subir o bajar no son lo mismo para el freno: bajar siempre se permite, aunque no
  // quede nada de tope, porque reduce el gasto. Subir pasa por el tope.
  const veredicto = await puedeComprometer({
    campanas,
    presupuestoDiarioActualUYU,
    nuevoPresupuestoDiarioUYU,
    tipo:
      nuevoPresupuestoDiarioUYU > presupuestoDiarioActualUYU
        ? 'subir-presupuesto'
        : 'bajar-presupuesto',
  });

  if (!veredicto.permitido) {
    await registrarAccionPublicidad({
      tipo: 'ajustar_presupuesto',
      campanaId: campaignId,
      campanaNombre: campaignName,
      presupuestoAnteriorUYU: presupuestoDiarioActualUYU,
      presupuestoNuevoUYU: nuevoPresupuestoDiarioUYU,
      motivo: `Rechazado por tope de gasto: ${veredicto.motivo}`,
      ejecutadoConExito: false,
      resultadoDetalle: veredicto.motivo,
    });
    return { success: false, motivoRechazo: veredicto.motivo };
  }

  // Meta espera el presupuesto en centavos en la API
  const resultado = await ejecutarLlamadaGraphApi(campaignId, {
    daily_budget: Math.round(nuevoPresupuestoDiarioUYU * 100),
  });

  await registrarAccionPublicidad({
    tipo: 'ajustar_presupuesto',
    campanaId: campaignId,
    campanaNombre: campaignName,
    presupuestoAnteriorUYU: presupuestoDiarioActualUYU,
    presupuestoNuevoUYU: nuevoPresupuestoDiarioUYU,
    motivo,
    ejecutadoConExito: resultado.success,
    resultadoDetalle: resultado.success ? 'Presupuesto actualizado.' : resultado.error,
  });

  return { success: resultado.success, motivoRechazo: resultado.error };
}

/**
 * Crear una nueva campaña publicitaria validando el compromiso contra el tope.
 */
export async function crearCampana(params: {
  nombre: string;
  presupuestoDiarioUYU: number;
  campanas: CampanaConPresupuesto[];
  motivo: string;
}): Promise<{ success: boolean; id?: string; motivoRechazo?: string }> {
  const { nombre, presupuestoDiarioUYU, campanas, motivo } = params;

  // Crear una campana la enciende el dueno, no el agente. Negado siempre.
  const veredicto = await puedeComprometer({
    campanas,
    presupuestoDiarioActualUYU: 0,
    nuevoPresupuestoDiarioUYU: presupuestoDiarioUYU,
    tipo: 'crear',
  });

  if (!veredicto.permitido) {
    await registrarAccionPublicidad({
      tipo: 'crear_campana',
      campanaId: 'pending',
      campanaNombre: nombre,
      presupuestoNuevoUYU: presupuestoDiarioUYU,
      motivo: `No se pudo crear: ${veredicto.motivo}`,
      ejecutadoConExito: false,
      resultadoDetalle: veredicto.motivo,
    });
    return { success: false, motivoRechazo: veredicto.motivo };
  }

  const adAccountId = process.env.META_ADS_ACCOUNT_ID;
  const endpoint = adAccountId ? `act_${adAccountId}/campaigns` : 'campaigns';

  const resultado = await ejecutarLlamadaGraphApi(endpoint, {
    name: nombre,
    objective: 'OUTCOME_LEADS',
    status: 'ACTIVE',
    special_ad_categories: [],
    daily_budget: Math.round(presupuestoDiarioUYU * 100),
  });

  const campaignId = resultado.data?.id || `sim_${Date.now()}`;

  await registrarAccionPublicidad({
    tipo: 'crear_campana',
    campanaId: campaignId,
    campanaNombre: nombre,
    estadoNuevo: 'ACTIVE',
    presupuestoNuevoUYU: presupuestoDiarioUYU,
    motivo,
    ejecutadoConExito: resultado.success,
    resultadoDetalle: resultado.success ? `Campaña ${campaignId} creada.` : resultado.error,
  });

  return { success: resultado.success, id: campaignId, motivoRechazo: resultado.error };
}
