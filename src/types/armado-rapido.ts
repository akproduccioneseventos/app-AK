import type { ServicioEmpresa } from './empresa';

export interface ServicioIncluidoArmadoRapido {
  id: string;
  esRegalo?: boolean;
}

export interface PaqueteArmadoRapido {
  id: string;
  nombre: string;
  descripcion?: string;
  serviciosIncluidos: ServicioIncluidoArmadoRapido[];
  recommended?: boolean;
  tiposDeEventoAplicables?: string[];
}

export interface MenuArmadoRapido {
  id: string;
  nombre: string;
  descripcion?: string;
  serviciosIncluidos: ServicioIncluidoArmadoRapido[];
}

export interface PlatoVisible {
  id: string;
  visible: boolean;
  recommended?: boolean;
}

export interface ServiceDependency {
  id: string;
  triggerServiceId: string;
  requiredServiceId: string;
}

export interface ClubUruguayConfig {
  activo: boolean;
  precio: number;
  prestaciones: string[];
}

export const defaultClubUruguayConfig: ClubUruguayConfig = {
  activo: true,
  precio: 20000,
  prestaciones: [
    'Capacidad 50-200 personas',
    'Ubicación céntrica en Salto',
    'Estacionamiento disponible',
  ],
};

export interface ArmadoRapidoConfig {
  menus: MenuArmadoRapido[];
  paquetes: PaqueteArmadoRapido[];
  descuentoGeneral?: number;
  mostrarPrecios?: boolean;
  platosVisibles?: PlatoVisible[];
  serviceDependencies?: ServiceDependency[];
  recommendedDishIds?: string[];
  clubUruguayConfig?: ClubUruguayConfig;
}

export interface LeadFromQuickBudget {
  submissionId?: string;
  clienteNombre: string;
  clienteContacto?: string;
  eventoFecha?: string;
  eventoHoraInicio?: string;
  adultos: number;
  adolescentes?: number;
  ninos: number;
  subtotal: number;
  costoEstimado: number;
  descuentoGeneral?: number;
  ajusteAnualActivo?: boolean;
  ajusteAnualPorcentaje?: number;
  serviciosIncluidos: string[];
  selectedServiceIds?: string[];
  excludedPackageServiceIds?: string[];
  paqueteId?: string;
  paqueteNombre?: string;
  includeClubUruguay?: boolean;
}

function normalizeEventType(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isPackageApplicableToEventType(
  paquete: Pick<PaqueteArmadoRapido, 'tiposDeEventoAplicables'>,
  tipoEvento: string | null | undefined
): boolean {
  const tipos = (paquete.tiposDeEventoAplicables || []).map((t) => t.trim()).filter(Boolean);
  if (tipos.length === 0) return true; // Si no tiene restricciones, aplica a todos

  const selected = normalizeEventType(tipoEvento || '');
  if (!selected) return true;

  return tipos.some((tipo) => {
    const normalized = normalizeEventType(tipo);
    if (normalized === selected) return true;

    // Check if the normalized string is a distinct word boundary match inside selected
    try {
      const regex1 = new RegExp(`\\b${normalized}\\b`);
      if (regex1.test(selected)) return true;

      const regex2 = new RegExp(`\\b${selected}\\b`);
      if (regex2.test(normalized)) return true;
    } catch {
      // Fallback a includes normal si la regex falla por caracteres extraños
      if (normalized.includes(selected) || selected.includes(normalized)) return true;
    }

    // Hardcoded logic for "15 años" and "quince"
    if ((normalized.includes('15') || normalized.includes('quince') || normalized.includes('xv')) &&
        (selected.includes('15') || selected.includes('quince') || selected.includes('xv'))) {
      // Avoid matching "2015"
      const selectedWords = selected.split(' ');
      if (selectedWords.some(w => w === '15' || w === 'quince' || w === 'xv' || w === '15anos' || w === '15a')) {
        return true;
      }
    }

    return false;
  });
}
