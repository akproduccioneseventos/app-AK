import fallbackConfigJson from '@/data/armado-rapido-config.json';
import {
  mismoTipoDeEvento,
  normalizeEventType,
  type ArmadoRapidoConfig,
  type PaqueteArmadoRapido,
  type ServicioIncluidoArmadoRapido,
} from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

export const TIPOS_FIESTA_PAQUETES_SUGERIDOS = [
  'Cumpleaños',
  'Cumpleaños infantil',
  '15 años',
  'Boda',
  'Evento empresarial',
] as const;

export type TipoFiestaPaqueteSugerido = (typeof TIPOS_FIESTA_PAQUETES_SUGERIDOS)[number];
export type NivelPaqueteSugerido = 'Básico' | 'Intermedio' | 'Premium';

const NIVELES_PAQUETES: readonly NivelPaqueteSugerido[] = ['Básico', 'Intermedio', 'Premium'];
const AVISO_GENERALES_OTRO = "Los tres paquetes generales quedan para 'Otro'";

const DEFAULT_FALLBACK_PAQUETES: PaqueteArmadoRapido[] =
  (fallbackConfigJson as unknown as ArmadoRapidoConfig).paquetes || [];

export interface GenerarPaquetesSugeridosParams {
  configActual: ArmadoRapidoConfig;
  serviciosCatalogo: ServicioEmpresa[];
  fallbackPaquetes?: PaqueteArmadoRapido[];
}

export interface GenerarPaquetesSugeridosResult {
  config: ArmadoRapidoConfig;
  agregados: number;
  serviciosSaltados: string[];
  avisoGeneralesOtro: string;
}

function slugifyIdPart(value: string): string {
  return normalizeEventType(value).replace(/\s+/g, '_');
}

function isGeneralPackage(pkg: PaqueteArmadoRapido): boolean {
  const tipos = (pkg.tiposDeEventoAplicables || []).map((t) => t.trim()).filter(Boolean);
  if (tipos.length === 0) return true;
  return tipos.every((tipo) => mismoTipoDeEvento(tipo, 'Otro'));
}

function matchesPackageLevel(nombre: string, nivel: NivelPaqueteSugerido): boolean {
  const normalized = normalizeEventType(nombre);
  if (nivel === 'Básico') return normalized.includes('basico');
  if (nivel === 'Intermedio') return normalized.includes('intermedio');
  return normalized.includes('premium');
}

function resolveBasePackages(
  existingPackages: PaqueteArmadoRapido[],
  fallbackPackages: PaqueteArmadoRapido[]
): Record<NivelPaqueteSugerido, PaqueteArmadoRapido | undefined> {
  const generalExisting = existingPackages.filter(isGeneralPackage);
  const findForLevel = (nivel: NivelPaqueteSugerido): PaqueteArmadoRapido | undefined =>
    generalExisting.find((pkg) => matchesPackageLevel(pkg.nombre, nivel)) ||
    fallbackPackages.find((pkg) => matchesPackageLevel(pkg.nombre, nivel));

  return {
    Básico: findForLevel('Básico'),
    Intermedio: findForLevel('Intermedio'),
    Premium: findForLevel('Premium'),
  };
}

function getRulesForTypeAndLevel(
  tipo: TipoFiestaPaqueteSugerido,
  nivel: NivelPaqueteSugerido,
  fuegos4DisparosIds: string[]
): { quitar: string[]; sumar: string[] } {
  const quitar: string[] = [];
  const sumar: string[] = [];

  if (tipo === 'Boda') {
    if (nivel === 'Intermedio' || nivel === 'Premium') {
      sumar.push('serv_foto_civil');
    }
    if (nivel === 'Premium') {
      sumar.push('serv_filmacion_civil', 'serv_foto_iglesia', 'serv_filmacion_iglesia');
    }
  } else if (tipo === '15 años') {
    if (nivel === 'Intermedio' || nivel === 'Premium') {
      sumar.push('serv_foto_pintada');
    }
    if (nivel === 'Premium') {
      sumar.push('serv_filmacion_pintada');
    }
  } else if (tipo === 'Cumpleaños') {
    quitar.push('serv_cuadro_firmas');
  } else if (tipo === 'Cumpleaños infantil') {
    quitar.push(
      'serv_cuadro_firmas',
      'serv_barra_tragos',
      'serv_fuegos_frios',
      'serv_1773235482408_86b6rp7',
      ...fuegos4DisparosIds
    );
    if (nivel === 'Intermedio') {
      sumar.push('serv_candy_bar_tematico');
    }
  } else if (tipo === 'Evento empresarial') {
    quitar.push(
      'serv_cuadro_firmas',
      'serv_torta_principal',
      'serv_video_vida_regalo',
      'serv_candy_bar_tematico',
      'serv_lluvia_burbujas'
    );
    if (nivel === 'Intermedio' || nivel === 'Premium') {
      sumar.push('serv_banner');
    }
  }

  return { quitar, sumar };
}

/**
 * Genera los paquetes pre-armados por tipo de fiesta a partir de los 3 paquetes
 * generales (Básico, Intermedio y Premium), marcando los generales sin tipo para 'Otro'
 * y evitando duplicados o servicios inexistentes en el catálogo.
 */
export function generarPaquetesSugeridosPorTipo({
  configActual,
  serviciosCatalogo,
  fallbackPaquetes = DEFAULT_FALLBACK_PAQUETES,
}: GenerarPaquetesSugeridosParams): GenerarPaquetesSugeridosResult {
  const existentes = (configActual.paquetes || []).map((pkg) => {
    const tipos = (pkg.tiposDeEventoAplicables || []).map((t) => t.trim()).filter(Boolean);
    const clonedServices = (pkg.serviciosIncluidos || []).map((s) => ({ ...s }));
    if (tipos.length === 0) {
      return {
        ...pkg,
        serviciosIncluidos: clonedServices,
        tiposDeEventoAplicables: ['Otro'],
      };
    }
    return {
      ...pkg,
      serviciosIncluidos: clonedServices,
    };
  });

  const bases = resolveBasePackages(existentes, fallbackPaquetes);
  const catalogIds = new Set(serviciosCatalogo.map((s) => s.id));
  const fuegos4DisparosIds = serviciosCatalogo
    .filter((s) => {
      const n = normalizeEventType(s.nombre || '');
      return n.includes('fuegos frios') && n.includes('4 disparos');
    })
    .map((s) => s.id);

  const paquetesResultantes: PaqueteArmadoRapido[] = [...existentes];
  const serviciosSaltadosSet = new Set<string>();
  let agregados = 0;

  for (const tipo of TIPOS_FIESTA_PAQUETES_SUGERIDOS) {
    for (const nivel of NIVELES_PAQUETES) {
      const nombreNuevo = `${nivel} — ${tipo}`;
      const nombreNormalizado = normalizeEventType(nombreNuevo);

      const yaExiste = paquetesResultantes.some((pkg) => {
        const mismoNombre = normalizeEventType(pkg.nombre) === nombreNormalizado;
        const mismoTipo = (pkg.tiposDeEventoAplicables || []).some((t) =>
          mismoTipoDeEvento(t, tipo)
        );
        return mismoNombre && mismoTipo;
      });

      if (yaExiste) continue;

      const basePkg = bases[nivel];
      const { quitar, sumar } = getRulesForTypeAndLevel(tipo, nivel, fuegos4DisparosIds);
      const removeIds = new Set(quitar);

      const serviciosIncluidos: ServicioIncluidoArmadoRapido[] = (
        basePkg?.serviciosIncluidos || []
      )
        .filter((item) => !removeIds.has(item.id))
        .map((item) => ({ id: item.id, esRegalo: Boolean(item.esRegalo) }));

      for (const serviceId of sumar) {
        if (serviciosIncluidos.some((s) => s.id === serviceId)) continue;
        if (!catalogIds.has(serviceId)) {
          serviciosSaltadosSet.add(serviceId);
          continue;
        }
        serviciosIncluidos.push({ id: serviceId, esRegalo: false });
      }

      paquetesResultantes.push({
        id: `pkg_sug_${slugifyIdPart(nivel)}_${slugifyIdPart(tipo)}`,
        nombre: nombreNuevo,
        descripcion: basePkg?.descripcion,
        serviciosIncluidos,
        recommended: nivel === 'Intermedio',
        tiposDeEventoAplicables: [tipo],
      });
      agregados += 1;
    }
  }

  return {
    config: {
      ...configActual,
      paquetes: paquetesResultantes,
    },
    agregados,
    serviciosSaltados: Array.from(serviciosSaltadosSet),
    avisoGeneralesOtro: AVISO_GENERALES_OTRO,
  };
}
