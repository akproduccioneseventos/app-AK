import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import { AsyncMutex } from '@/lib/mutex';
import { exigirQueSePuedaGuardar, esSesionDeAuditor } from '@/lib/auth/solo-lectura';
import { aFechaHoraLocal } from '@/lib/fechas/fecha-local';
import {
  calcularConsumo,
  claveDelMes,
  resumirGasto,
  COSTO_ESTIMADO_UYU,
  type ConteoPorFuncion,
  type FuncionConCosto,
  type ResumenDeGasto,
} from '@/lib/ai/consumo';

/**
 * Guardado del consumo de inteligencia artificial.
 *
 * Se anota una línea por mes con cuántas veces se usó cada función, no un registro
 * por foto: alcanza para ver el gasto y no llena la base con miles de renglones
 * en una sola fiesta.
 *
 * **Anotar nunca puede romper la fiesta.** Si falla el guardado, la foto del
 * invitado sale igual: se pierde un número del contador, que es mucho menos grave
 * que una pantalla colgada en medio del evento.
 */

const CONSUMO_FILE = 'ai-consumo.json';
const GENERIC_JSON_COLLECTION = 'json_documents';
const consumoLocalMutex = new AsyncMutex();

export interface ConsumoDia {
  profundo?: number;
}

export interface FalloIAInfo {
  cantidad: number;
  ultimoMotivo: string;
  ultimaVez: string;
  avisoEnviado?: boolean;
}

export interface ConsumoGuardado {
  meses?: Record<string, ConteoPorFuncion>;
  dias?: Record<string, ConsumoDia>;
  fallos?: Record<string, Record<string, FalloIAInfo>>;
  topeMensualUYU?: number;
  topeDiarioProfundo?: number;
}

const VACIO: ConsumoGuardado = { meses: {}, dias: {}, fallos: {}, topeMensualUYU: 0, topeDiarioProfundo: 40 };

function normalizarConsumo(datos: any): ConsumoGuardado {
  const contenido = datos?._data ?? datos?._value ?? datos ?? VACIO;
  const topeDiario = contenido?.topeDiarioProfundo !== undefined && Number.isFinite(Number(contenido.topeDiarioProfundo))
    ? Math.max(0, Math.round(Number(contenido.topeDiarioProfundo)))
    : 40;
  return {
    meses: contenido?.meses ?? {},
    dias: contenido?.dias ?? {},
    fallos: contenido?.fallos ?? {},
    topeMensualUYU: Number(contenido?.topeMensualUYU) > 0 ? Number(contenido.topeMensualUYU) : 0,
    topeDiarioProfundo: topeDiario,
  };
}

async function leer(): Promise<ConsumoGuardado> {
  const datos = await readData<ConsumoGuardado>(CONSUMO_FILE, VACIO);
  return normalizarConsumo(datos);
}

async function cambiarConsumo<T>(
  cambiar: (datos: ConsumoGuardado) => { siguiente: ConsumoGuardado | null; resultado: T },
): Promise<T> {
  if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true' ||
      (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST)) {
    return consumoLocalMutex.runExclusive(async () => {
      const { siguiente, resultado } = cambiar(await leer());
      if (siguiente) {
        await writeData(CONSUMO_FILE, siguiente, undefined, { skipAutoBackup: true });
      }
      return resultado;
    });
  }

  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('No está disponible el guardado seguro del consumo de IA.');
  const ref = dbAdmin.collection(GENERIC_JSON_COLLECTION).doc(encodeURIComponent(CONSUMO_FILE));

  return dbAdmin.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const { siguiente, resultado } = cambiar(normalizarConsumo(snapshot.exists ? snapshot.data() : null));
    if (siguiente) {
      transaction.set(ref, {
        _filePath: CONSUMO_FILE,
        _data: siguiente,
        _syncedAt: new Date().toISOString(),
      });
    }
    return resultado;
  });
}

/** Suma una generación al contador del mes. Nunca lanza, salvo para el candado de auditor. Con auditor no guarda ni lanza. */
export async function registrarConsumoIA(
  funcion: FuncionConCosto,
  cantidad = 1,
  ahora: Date = new Date(),
): Promise<void> {
  if (await esSesionDeAuditor()) {
    return;
  }
  await exigirQueSePuedaGuardar();
  try {
    const incremento = Number.isFinite(cantidad) ? Math.max(0, Math.floor(cantidad)) : 0;
    if (!incremento) return;
    await cambiarConsumo((datos) => {
      const mes = claveDelMes(ahora);
      const delMes = { ...(datos.meses?.[mes] ?? {}) };
      delMes[funcion] = (delMes[funcion] ?? 0) + incremento;
      return { siguiente: { ...datos, meses: { ...datos.meses, [mes]: delMes } }, resultado: undefined };
    });
  } catch {
    // A propósito en silencio: ver el gasto no vale una fiesta cortada.
  }
}

export interface ReservaConsumoIA {
  /** Libera una reserva solo cuando el proveedor confirma que rechazó el pedido sin procesarlo. */
  liberar(): Promise<void>;
}

/** Reserva el costo estimado dentro de la misma transacción que lee el tope mensual. */
export async function reservarConsumoIA(
  funcion: FuncionConCosto,
  cantidad = 1,
  ahora: Date = new Date(),
): Promise<ReservaConsumoIA | null> {
  if (await esSesionDeAuditor()) {
    return {
      async liberar() {},
    };
  }
  await exigirQueSePuedaGuardar();
  const incremento = Number.isFinite(cantidad) ? Math.max(0, Math.floor(cantidad)) : 0;
  if (!incremento) return null;

  const mes = claveDelMes(ahora);
  const reservada = await cambiarConsumo((datos) => {
    const delMes = { ...(datos.meses?.[mes] ?? {}) };
    const consumoActual = calcularConsumo(mes, delMes).gastadoUYU;
    const costoReserva = (COSTO_ESTIMADO_UYU[funcion] ?? 0) * incremento;
    const tope = datos.topeMensualUYU ?? 0;
    if (tope > 0 && consumoActual + costoReserva > tope) {
      return { siguiente: null, resultado: false };
    }
    delMes[funcion] = (delMes[funcion] ?? 0) + incremento;
    return {
      siguiente: { ...datos, meses: { ...datos.meses, [mes]: delMes } },
      resultado: true,
    };
  });
  if (!reservada) return null;

  let liberarPromise: Promise<void> | null = null;
  return {
    liberar() {
      liberarPromise ??= cambiarConsumo((datos) => {
        const delMes = { ...(datos.meses?.[mes] ?? {}) };
        const restante = Math.max(0, (delMes[funcion] ?? 0) - incremento);
        if (restante) delMes[funcion] = restante;
        else delete delMes[funcion];
        return {
          siguiente: { ...datos, meses: { ...datos.meses, [mes]: delMes } },
          resultado: undefined,
        };
      });
      return liberarPromise;
    },
  };
}

export async function reservarRespuestaProfunda(ahora?: Date | string): Promise<boolean> {
  if (await esSesionDeAuditor()) {
    return true;
  }
  await exigirQueSePuedaGuardar();
  const fechaUY = aFechaHoraLocal(ahora).slice(0, 10);
  if (!fechaUY) return false;
  const mesUY = fechaUY.slice(0, 7);

  return cambiarConsumo((datos) => {
    const dias = { ...(datos.dias ?? {}) };
    const diaActual = { ...(dias[fechaUY] ?? {}) };
    const actualProfundo = diaActual.profundo ?? 0;
    const tope = typeof datos.topeDiarioProfundo === 'number' && datos.topeDiarioProfundo >= 0
      ? datos.topeDiarioProfundo
      : 40;

    if (actualProfundo + 1 > tope) {
      return { siguiente: null, resultado: false };
    }

    diaActual.profundo = actualProfundo + 1;
    dias[fechaUY] = diaActual;

    const delMes = { ...(datos.meses?.[mesUY] ?? {}) };
    delMes['respuesta-profunda'] = (delMes['respuesta-profunda'] ?? 0) + 1;

    return {
      siguiente: {
        ...datos,
        meses: { ...datos.meses, [mesUY]: delMes },
        dias,
      },
      resultado: true,
    };
  });
}

export async function getResumenDeGasto(ahora: Date | string = new Date()): Promise<ResumenDeGasto> {
  const datos = await leer();
  const fechaUY = aFechaHoraLocal(ahora).slice(0, 10);
  const mes = fechaUY ? fechaUY.slice(0, 7) : claveDelMes(typeof ahora === 'string' ? new Date(ahora) : ahora);
  const resumen = resumirGasto(calcularConsumo(mes, datos.meses?.[mes] ?? {}), datos.topeMensualUYU ?? 0);
  const respuestasProfundasHoy = fechaUY ? (datos.dias?.[fechaUY]?.profundo ?? 0) : 0;
  const topeDiarioProfundo = typeof datos.topeDiarioProfundo === 'number' && datos.topeDiarioProfundo >= 0
    ? datos.topeDiarioProfundo
    : 40;
  return {
    ...resumen,
    respuestasProfundasHoy,
    topeDiarioProfundo,
  };
}

export async function setTopeMensual(topeUYU: number, ahora?: Date | string): Promise<ResumenDeGasto> {
  await exigirQueSePuedaGuardar();
  const tope = Number.isFinite(topeUYU) && topeUYU > 0 ? Math.round(topeUYU) : 0;
  return cambiarConsumo((datos) => {
    const siguiente: ConsumoGuardado = { ...datos, topeMensualUYU: tope };
    const fechaUY = aFechaHoraLocal(ahora).slice(0, 10);
    const mes = fechaUY ? fechaUY.slice(0, 7) : claveDelMes();
    const resumen = resumirGasto(
      calcularConsumo(mes, datos.meses?.[mes] ?? {}),
      tope,
    );
    const respuestasProfundasHoy = fechaUY ? (datos.dias?.[fechaUY]?.profundo ?? 0) : 0;
    const topeDiarioProfundo = typeof datos.topeDiarioProfundo === 'number' && datos.topeDiarioProfundo >= 0
      ? datos.topeDiarioProfundo
      : 40;
    return {
      siguiente,
      resultado: {
        ...resumen,
        respuestasProfundasHoy,
        topeDiarioProfundo,
      },
    };
  });
}

export async function setTopeDiarioProfundo(tope: number, ahora?: Date | string): Promise<ResumenDeGasto> {
  await exigirQueSePuedaGuardar();
  const valor = Number.isFinite(tope) && tope >= 0 ? Math.round(tope) : 40;
  return cambiarConsumo((datos) => {
    const siguiente: ConsumoGuardado = { ...datos, topeDiarioProfundo: valor };
    const fechaUY = aFechaHoraLocal(ahora).slice(0, 10);
    const mes = fechaUY ? fechaUY.slice(0, 7) : claveDelMes();
    const resumen = resumirGasto(
      calcularConsumo(mes, datos.meses?.[mes] ?? {}),
      datos.topeMensualUYU ?? 0,
    );
    const respuestasProfundasHoy = fechaUY ? (datos.dias?.[fechaUY]?.profundo ?? 0) : 0;
    return {
      siguiente,
      resultado: {
        ...resumen,
        respuestasProfundasHoy,
        topeDiarioProfundo: valor,
      },
    };
  });
}

/**
 * ¿Se puede seguir gastando en efectos de fotos?
 *
 * Si el mes se pasó del tope, devuelve `false` y quien llama tiene que caer al
 * mismo camino que cuando no hay servicio configurado: **la foto sale igual, sin
 * el efecto**. Nunca se le corta la foto al invitado.
 *
 * Ante cualquier duda devuelve `true`: quedarse sin efectos por un error de
 * lectura, en medio de una fiesta, es peor que gastar de más una noche.
 */
export async function hayPresupuestoParaIA(ahora: Date | string = new Date()): Promise<boolean> {
  try {
    return !(await getResumenDeGasto(ahora)).frenado;
  } catch {
    return true;
  }
}

/**
 * Registra un fallo de IA (cuando cae a respuesta de respaldo).
 * No escribe si la sesión es de auditor.
 * Si hoy hubo más de 5 fallos de una misma función, dispara aviso al dueño (una vez por día).
 */
export async function anotarFalloIA(
  funcion: string,
  motivo: string,
  ahora: Date | string = new Date(),
): Promise<void> {
  if (await esSesionDeAuditor()) {
    return;
  }

  const fechaUY = aFechaHoraLocal(ahora).slice(0, 10);
  if (!fechaUY) return;

  type InfoAviso = { debeAvisar: boolean; datosAviso: { funcion: string; cantidad: number; motivo: string } | null };

  let avisoInfo: InfoAviso | undefined;

  try {
    avisoInfo = await cambiarConsumo<InfoAviso>((datos) => {
      const fallos = { ...(datos.fallos ?? {}) };
      const delDia = { ...(fallos[fechaUY] ?? {}) };
      const anterior = delDia[funcion] ?? { cantidad: 0, ultimoMotivo: '', ultimaVez: '' };
      const nuevaCantidad = anterior.cantidad + 1;
      const yaAvisado = Boolean(anterior.avisoEnviado);
      let debeAvisar = false;
      let datosAviso: { funcion: string; cantidad: number; motivo: string } | null = null;

      if (nuevaCantidad > 5 && !yaAvisado) {
        debeAvisar = true;
        datosAviso = { funcion, cantidad: nuevaCantidad, motivo };
      }

      delDia[funcion] = {
        cantidad: nuevaCantidad,
        ultimoMotivo: motivo,
        ultimaVez: typeof ahora === 'string' ? ahora : ahora.toISOString(),
        avisoEnviado: yaAvisado || debeAvisar,
      };
      fallos[fechaUY] = delDia;

      return {
        siguiente: { ...datos, fallos },
        resultado: { debeAvisar, datosAviso },
      };
    });
  } catch (err) {
    // Nunca romper ante fallos de registro
    console.warn('[anotarFalloIA] No se pudo guardar el fallo de IA:', err);
  }

  if (avisoInfo?.debeAvisar && avisoInfo.datosAviso) {
    try {
      const fechaAviso = typeof ahora === 'string' ? new Date(ahora) : ahora;
      const { avisarAlDuenio } = await import('@/lib/asistente/avisar-al-duenio');
      await avisarAlDuenio([{
        clave: `fallo-ia-${fechaUY}-${funcion}`,
        area: 'asistente',
        titulo: `Respuestas de respaldo reiteradas en: ${funcion}`,
        quePasa: `La función "${funcion}" falló ${avisoInfo.datosAviso.cantidad} veces hoy y cayó al respaldo. Último motivo: ${avisoInfo.datosAviso.motivo}`,
        porQueImporta: 'Los usuarios pueden estar recibiendo respuestas fijas o de respaldo.',
        esImportante: true,
      }], fechaAviso);
    } catch {
      // Ignorar si avisarAlDuenio falla
    }
  }
}

export async function getFallosIAHoy(ahora: Date | string = new Date()): Promise<Record<string, FalloIAInfo>> {
  const datos = await leer();
  const fechaUY = aFechaHoraLocal(ahora).slice(0, 10);
  return datos.fallos?.[fechaUY] ?? {};
}
