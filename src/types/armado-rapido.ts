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

/** Ultima decision del dueno sobre el precio del Club Uruguay (25/11/2026). */
export const PRECIO_CLUB_URUGUAY_REVISION = '2026-11-25';

/** El servicio del catalogo que es el salon del Club Uruguay: su precio de venta sale de esta configuracion. */
export const SERVICIO_SALON_CLUB_URUGUAY_ID = 'serv_salon_club_uruguay';

export interface ClubUruguayConfig {
  activo: boolean;
  precio: number;
  precioRevision?: string;
  prestaciones: string[];
}

export const defaultClubUruguayConfig: ClubUruguayConfig = {
  activo: true,
  precio: 19990,
  precioRevision: '2026-11-25',
  prestaciones: [
    'Capacidad 50-200 personas',
    'Ubicación céntrica en Salto',
    'Estacionamiento disponible',
  ],
};

export function normalizeClubUruguayConfig(config?: Partial<ClubUruguayConfig>): ClubUruguayConfig {
  const merged = { ...defaultClubUruguayConfig, ...config };
  // Decision expresa del dueno del 25/11/2026: desde 2027 el Club Uruguay vale $19.990 (antes $16.900, decision del 31/10).
  // Un precio guardado con una revision anterior se lleva al nuevo; las ediciones posteriores guardan su revision y se respetan.
  if (!config?.precioRevision || config.precioRevision < PRECIO_CLUB_URUGUAY_REVISION) {
    merged.precio = defaultClubUruguayConfig.precio;
    merged.precioRevision = PRECIO_CLUB_URUGUAY_REVISION;
  }
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
