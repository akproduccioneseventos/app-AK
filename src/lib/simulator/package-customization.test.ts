import {
  getPackageChangeResult,
  getPackageRecommendations,
  getRemovablePackageServices,
  isPremiumSimulatorPackage,
} from './package-customization';
import type { PaqueteArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

const services: ServicioEmpresa[] = [
  { id: 'torta', nombre: 'Torta de 15 años', tipoItem: 'Servicio', precioVenta: 5000 },
  { id: 'mozos', nombre: 'Personal de mozos', tipoItem: 'Servicio', precioVenta: 10000 },
  { id: 'postres', nombre: 'Mesa de postres', tipoItem: 'Servicio', precioVenta: 8000 },
];

const packageItem: PaqueteArmadoRapido = {
  id: 'intermedio',
  nombre: 'Intermedio',
  serviciosIncluidos: [
    { id: 'torta' },
    { id: 'mozos' },
    { id: 'postres' },
  ],
};

const essentialPackage: PaqueteArmadoRapido = {
  id: 'essential',
  nombre: 'Esencial',
  serviciosIncluidos: [{ id: 'torta' }],
};

const completePackage: PaqueteArmadoRapido = {
  id: 'complete',
  nombre: 'Completo',
  serviciosIncluidos: [{ id: 'torta' }, { id: 'postres' }, { id: 'mozos' }],
};

describe('simulator package customization', () => {
  it('allows all non-required package services to be removed', () => {
    expect(getRemovablePackageServices(packageItem, services, {
      serviceDependencies: [{ id: 'dep', triggerServiceId: 'torta', requiredServiceId: 'postres' }],
    }).map(service => service.id)).toEqual(['torta', 'mozos']);
  });

  it('allows removing services even for premium packages', () => {
    expect(isPremiumSimulatorPackage('Premium total')).toBe(true);
    expect(getRemovablePackageServices({ ...packageItem, nombre: 'Premium' }, services, {
      serviceDependencies: [],
    })).toEqual([services[0], services[1], services[2]]);
  });

  it('cleans stale package services and extras that the next package already includes', () => {
    expect(getPackageChangeResult({
      currentPackage: essentialPackage,
      nextPackage: completePackage,
      selectedServiceIds: ['torta', 'postres', 'servicio-extra'],
    })).toEqual({
      selectedServiceIds: ['servicio-extra'],
      excludedPackageServiceIds: [],
    });
  });

  it('recommends only available commercial upgrades outside the selected package', () => {
    const recommendations = getPackageRecommendations({
      currentPackage: essentialPackage,
      otherPackages: [completePackage],
      selectedServiceIds: ['servicio-ya-elegido'],
      visibleServiceIds: ['postres', 'barra', 'mesa', 'agotado', 'duplicado'],
      services: [
        ...services,
        { id: 'barra', nombre: 'Barra de tragos', tipoItem: 'Servicio', precioVenta: 12000, isFeatured: true },
        { id: 'mesa', nombre: 'Manteleria basica', tipoItem: 'Servicio', precioVenta: 1000 },
        { id: 'agotado', nombre: 'Plataforma 360', tipoItem: 'Servicio', precioVenta: 9000, cantidadDisponible: 0 },
        { id: 'duplicado', nombre: 'Barra de tragos', tipoItem: 'Servicio', precioVenta: 11000 },
        { id: 'servicio-ya-elegido', nombre: 'Cabina de fotos', tipoItem: 'Servicio', precioVenta: 8000 },
      ],
    });

    expect(recommendations.map((service) => service.id)).toEqual(['barra', 'postres']);
  });
});
