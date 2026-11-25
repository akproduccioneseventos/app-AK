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
  precioRevision?: string;
  prestaciones: string[];
}

export const defaultClubUruguayConfig: ClubUruguayConfig = {
  activo: true,
  precio: 16900,
  precioRevision: '2026-10-31',
  prestaciones: [
    'Capacidad 50-200 personas',
    'Ubicación céntrica en Salto',
    'Estacionamiento disponible',
  ],
};

export function normalizeClubUruguayConfig(config?: Partial<ClubUruguayConfig>): ClubUruguayConfig {
  const merged = { ...defaultClubUruguayConfig, ...config };
  // Decision expresa del dueno del31/10. Las ediciones futuras guardan revision y se respetan.
  if (!config?.precioRevision && Number(config?.precio) === 20000) merged.precio = 16900;
  return { ...merged, precioRevision: merged.precioRevision || defaultClubUruguayConfig.precioRevision };
}

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

const EVENT_TYPE_ALIASES: Record<string, string> = {
  '15 anos': '15 anos',
  xv: '15 anos',
  'xv anos': '15 anos',
  quince: '15 anos',
  'quince anos': '15 anos',
  'evento empresarial': 'evento empresarial',
  'evento corporativo': 'evento empresarial',
  corporativo: 'evento empresarial',
  empresarial: 'evento empresarial',
  boda: 'boda',
  bodas: 'boda',
  casamiento: 'boda',
  matrimonio: 'boda',
  'cumpleanos infantil': 'cumpleanos infantil',
  infantil: 'cumpleanos infantil',
  'cumple infantil': 'cumpleanos infantil',
  cumpleanos: 'cumpleanos',
  otro: 'otro',
};

export function normalizeEventType(value: string | null | undefined): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function canonicalizeEventType(value: string | null | undefined): string {
  const normalized = normalizeEventType(value);
  if (!normalized) return '';
  return EVENT_TYPE_ALIASES[normalized] || normalized;
}

export function mismoTipoDeEvento(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const canonicalA = canonicalizeEventType(a);
  const canonicalB = canonicalizeEventType(b);
  if (!canonicalA || !canonicalB) return false;
  return canonicalA === canonicalB;
}

export function isPackageApplicableToEventType(
  paquete: Pick<PaqueteArmadoRapido, 'tiposDeEventoAplicables'>,
  tipoEvento: string | null | undefined
): boolean {
  const tipos = (paquete.tiposDeEventoAplicables || []).map((t) => t.trim()).filter(Boolean);
  if (tipos.length === 0) return true;
  const selected = normalizeEventType(tipoEvento);
  if (!selected) return true;

  return tipos.some((tipo) => mismoTipoDeEvento(tipo, selected));
}
