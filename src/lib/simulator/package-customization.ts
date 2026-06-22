import type { ArmadoRapidoConfig, PaqueteArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

const REMOVABLE_PACKAGE_SERVICE_PATTERN = /(torta|mesa de postres|postre|video de vida|invitaci[oó]n digital|coffee break)/i;

export function isPremiumSimulatorPackage(packageName?: string): boolean {
  return /premium|completo|total/i.test(packageName || '');
}

export function getRemovablePackageServices(
  packageItem: PaqueteArmadoRapido | undefined,
  services: ServicioEmpresa[],
  config: Pick<ArmadoRapidoConfig, 'serviceDependencies'>,
): ServicioEmpresa[] {
  if (!packageItem || isPremiumSimulatorPackage(packageItem.nombre)) return [];
  const requiredIds = new Set((config.serviceDependencies || []).map(dependency => dependency.requiredServiceId));
  const serviceById = new Map(services.map(service => [service.id, service]));

  return packageItem.serviciosIncluidos
    .filter(item => !item.esRegalo && !requiredIds.has(item.id))
    .map(item => serviceById.get(item.id))
    .filter((service): service is ServicioEmpresa => Boolean(
      service && REMOVABLE_PACKAGE_SERVICE_PATTERN.test(
        `${service.nombre} ${service.categoria || ''} ${service.subcategoria || ''}`,
      ),
    ));
}
