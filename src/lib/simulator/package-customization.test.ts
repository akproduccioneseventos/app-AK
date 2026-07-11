import { getRemovablePackageServices, isPremiumSimulatorPackage } from './package-customization';
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
});
