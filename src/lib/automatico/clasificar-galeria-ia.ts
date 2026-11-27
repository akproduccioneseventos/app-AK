import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import { mutarDocumento } from '@/lib/generic-json-store';
import { getResumenDeGasto, hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';
import { getServiciosEmpresaPublicos } from '@/app/actions/servicios-empresa';
import { clasificarFotoDeGaleria } from '@/lib/galeria/clasificar-foto';
import { hoyEnUruguay } from '@/lib/utils';
import type { GaleriaData, GaleriaFoto } from '@/types/galeria';

const GALERIA_FILE = 'galeria-publica.json';
const ESTADO_CLASIFICACION_FILE = 'clasificar-galeria-ia-estado.json';
const MAX_FOTOS_POR_CORRIDA = 20;

interface EstadoClasificacionDiaria {
  fecha: string;
  clasificadasHoy: number;
}

export interface ResultadoClasificarGaleriaIA {
  procesadas: number;
  clasificadas: number;
  omitidasPorTope: boolean;
}

/**
 * Clasifica hasta 20 fotos pendientes de la galería por corrida, respetando el tope
 * diario y mensual del cerebro. Nunca pisa fotos clasificadas manualmente por una persona.
 */
export async function clasificarPendientesGaleriaIA(opciones?: {
  limite?: number;
  ahora?: Date;
}): Promise<ResultadoClasificarGaleriaIA> {
  const ahora = opciones?.ahora ?? new Date();
  const hoyUY = hoyEnUruguay(ahora);
  const limiteCorrida = Math.max(1, Math.min(MAX_FOTOS_POR_CORRIDA, opciones?.limite ?? MAX_FOTOS_POR_CORRIDA));

  const hayPresupuesto = await hayPresupuestoParaIA(ahora).catch(() => false);
  if (!hayPresupuesto) {
    return { procesadas: 0, clasificadas: 0, omitidasPorTope: true };
  }

  const resumen = await getResumenDeGasto(ahora).catch(() => null);
  const topeDiario = resumen?.topeDiarioProfundo ?? 40;
  const estadoDiario = await readData<EstadoClasificacionDiaria>(
    ESTADO_CLASIFICACION_FILE,
    { fecha: hoyUY, clasificadasHoy: 0 },
  ).catch(() => ({ fecha: hoyUY, clasificadasHoy: 0 }));

  const usadasHoy = estadoDiario.fecha === hoyUY ? Math.max(0, estadoDiario.clasificadasHoy || 0) : 0;
  const cupoRestanteHoy = Math.max(0, topeDiario - usadasHoy);
  if (topeDiario > 0 && cupoRestanteHoy === 0) {
    return { procesadas: 0, clasificadas: 0, omitidasPorTope: true };
  }

  const galeria = await readData<GaleriaData>(GALERIA_FILE, { fotos: [], videos: [] });
  const pendientes = (galeria?.fotos || [])
    .filter((f) => !f.servicioId && !f.tipoFiesta && f.clasificadaPor !== 'persona')
    .slice(0, topeDiario > 0 ? Math.min(limiteCorrida, cupoRestanteHoy) : limiteCorrida);

  if (pendientes.length === 0) {
    return { procesadas: 0, clasificadas: 0, omitidasPorTope: false };
  }

  const servicios = await getServiciosEmpresaPublicos().catch(() => []);
  const actualizaciones = new Map<string, Partial<GaleriaFoto>>();
  let procesadas = 0;
  let omitidasPorTope = false;

  for (const foto of pendientes) {
    const sigueConPresupuesto = await hayPresupuestoParaIA(ahora).catch(() => false);
    if (!sigueConPresupuesto) {
      omitidasPorTope = true;
      break;
    }

    procesadas += 1;
    const res = await clasificarFotoDeGaleria(foto, {
      servicios,
      verificarPresupuesto: false,
    }).catch(() => null);

    if (res?.motivo === 'sin-presupuesto') {
      omitidasPorTope = true;
      break;
    }

    if (res?.actualizada && Object.keys(res.cambios).length > 0) {
      actualizaciones.set(foto.id, res.cambios);
    }
  }

  if (actualizaciones.size > 0) {
    await mutarDocumento<GaleriaData>(
      GALERIA_FILE,
      { fotos: [], videos: [] },
      (actual) => {
        const fotos = (actual?.fotos || []).map((f) => {
          if (f.clasificadaPor === 'persona') return f;
          const cambios = actualizaciones.get(f.id);
          if (!cambios) return f;
          return { ...f, ...cambios };
        });
        return {
          fotos,
          videos: actual?.videos || [],
        };
      },
    );
  }

  if (procesadas > 0) {
    await writeData(
      ESTADO_CLASIFICACION_FILE,
      { fecha: hoyUY, clasificadasHoy: usadasHoy + procesadas },
      undefined,
      { skipAutoBackup: true },
    ).catch(() => undefined);
  }

  return {
    procesadas,
    clasificadas: actualizaciones.size,
    omitidasPorTope,
  };
}
