import type { ArmadoRapidoConfig, PaqueteArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

const REMOVABLE_PACKAGE_SERVICE_PATTERN = /(torta|mesa de postres|postre|video de vida|invitaci[oó]n digital|coffee break)/i;

const NON_COMMERCIAL_UPSELL_PATTERN = /\b(manteleria|vajilla|mobiliario|silla|mozo|personal|cocina|cubierto|servicio basico|mesa (?:redonda|rectangular|plegable|de comedor))\b/i;

function normalizeServiceName(value?: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function packageServiceIds(packageItem?: PaqueteArmadoRapido): Set<string> {
  return new Set(packageItem?.serviciosIncluidos.map((service) => service.id) || []);
}

export type PackageChangeInput = {
  currentPackage?: PaqueteArmadoRapido;
  nextPackage?: PaqueteArmadoRapido;
  selectedServiceIds: Iterable<string>;
};

export type PackageChangeResult = {
  selectedServiceIds: string[];
  excludedPackageServiceIds: string[];
};

/**
 * A package owns its included services. When it changes, stale services from
 * the previous package disappear and manually selected extras already covered
 * by the new package are removed to keep the budget free of duplicates.
 */
export function getPackageChangeResult({
  currentPackage,
  nextPackage,
  selectedServiceIds,
}: PackageChangeInput): PackageChangeResult {
  const currentPackageIds = packageServiceIds(currentPackage);
  const nextPackageIds = packageServiceIds(nextPackage);
  const uniqueIds = new Set(selectedServiceIds);

  return {
    selectedServiceIds: Array.from(uniqueIds).filter(
      (serviceId) => !currentPackageIds.has(serviceId) && !nextPackageIds.has(serviceId),
    ),
    // Exclusions are meaningful only for the package that created them.
    excludedPackageServiceIds: [],
  };
}

export type PackageRecommendationInput = {
  currentPackage?: PaqueteArmadoRapido;
  otherPackages?: PaqueteArmadoRapido[];
  services: ServicioEmpresa[];
  selectedServiceIds?: Iterable<string>;
  visibleServiceIds?: Iterable<string> | null;
  limit?: number;
};

/**
 * Finds real, available upgrades only. It deliberately excludes operational
 * basics and anything already selected or included by the active package.
 */
export function getPackageRecommendations({
  currentPackage,
  otherPackages = [],
  services,
  selectedServiceIds = [],
  visibleServiceIds = null,
  limit = 3,
}: PackageRecommendationInput): ServicioEmpresa[] {
  const includedIds = packageServiceIds(currentPackage);
  const selectedIds = new Set(selectedServiceIds);
  const visibleIds = visibleServiceIds ? new Set(visibleServiceIds) : null;
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const occupiedNames = new Set<string>();
  const upgradeIds = new Set<string>();

  [...includedIds, ...selectedIds].forEach((serviceId) => {
    const name = normalizeServiceName(serviceById.get(serviceId)?.nombre);
    if (name) occupiedNames.add(name);
  });

  otherPackages.forEach((packageItem) => {
    packageItem.serviciosIncluidos.forEach((service) => {
      if (!includedIds.has(service.id)) upgradeIds.add(service.id);
    });
  });

  const seenNames = new Set<string>();
  return services
    .filter((service) => {
      const name = normalizeServiceName(service.nombre);
      const isAvailable = service.cantidadDisponible === undefined || service.cantidadDisponible > 0;
      return Boolean(
        service.id &&
        name &&
        isAvailable &&
        !includedIds.has(service.id) &&
        !selectedIds.has(service.id) &&
        !occupiedNames.has(name) &&
        !seenNames.has(name) &&
        !NON_COMMERCIAL_UPSELL_PATTERN.test(name) &&
        (!visibleIds || visibleIds.has(service.id)),
      );
    })
    .sort((a, b) => {
      const aScore = (a.isFeatured ? 4 : 0) + (upgradeIds.has(a.id) ? 2 : 0);
      const bScore = (b.isFeatured ? 4 : 0) + (upgradeIds.has(b.id) ? 2 : 0);
      return bScore - aScore || a.nombre.localeCompare(b.nombre);
    })
    .filter((service) => {
      const name = normalizeServiceName(service.nombre);
      if (seenNames.has(name)) return false;
      seenNames.add(name);
      return true;
    })
    .slice(0, Math.max(0, limit));
}

export function isPremiumSimulatorPackage(packageName?: string): boolean {
  return /premium|completo|total/i.test(packageName || '');
}

export function getRemovablePackageServices(
  packageItem: PaqueteArmadoRapido | undefined,
  services: ServicioEmpresa[],
  config: Pick<ArmadoRapidoConfig, 'serviceDependencies'>,
): ServicioEmpresa[] {
  if (!packageItem) return [];
  const requiredIds = new Set((config.serviceDependencies || []).map(dependency => dependency.requiredServiceId));
  const serviceById = new Map(services.map(service => [service.id, service]));

  return packageItem.serviciosIncluidos
    .filter(item => !item.esRegalo && !requiredIds.has(item.id))
    .map(item => serviceById.get(item.id))
    .filter((service): service is ServicioEmpresa => Boolean(service));
}
