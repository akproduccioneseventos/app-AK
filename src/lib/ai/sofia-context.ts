import type { ArmadoRapidoConfig } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu } from '@/types/catering';

export function buildPaquetesCatalog(
  config: ArmadoRapidoConfig | null,
  services: ServicioEmpresa[],
) {
  const serviceById = new Map(services.map((service) => [service.id, service]));
  return (config?.paquetes || []).map((pkg) => ({
    id: pkg.id,
    nombre: pkg.nombre,
    descripcion: pkg.descripcion,
    recommended: pkg.recommended,
    serviciosIncluidos: pkg.serviciosIncluidos.map((included) => {
      const service = serviceById.get(included.id);
      return {
        id: included.id,
        nombre: service?.nombre || 'Servicio sin nombre configurado',
        esRegalo: Boolean(included.esRegalo),
        precio: service?.precioVenta || service?.precioPorPersona || service?.precioBase || 0,
        calculationMethod: service?.calculationMethod,
      };
    }),
  }));
}

export function buildSofiaBusinessContext(
  config: ArmadoRapidoConfig | null,
  services: ServicioEmpresa[],
  menus: FullMenu[],
): string {
  const paquetesCatalog = buildPaquetesCatalog(config, services);

  return JSON.stringify({
    paquetesCatalog,
    menusCatalog: config?.menus || [],
    serviciosCompletos: services.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      categoria: s.categoria,
      precio: s.precioVenta || s.precioPorPersona || s.precioBase || 0,
      calculationMethod: s.calculationMethod,
    })),
    cateringMenus: menus.map((m) => ({
      id: m.id,
      nombre: m.name,
    })),
    reglasRespuesta: [
      'PAQUETES: Copiá exactamente la lista de servicios de cada paquete desde fichaFijaPaquetesCatalogo o paquetesCatalog. No agregues, completes ni mezcles servicios de otros paquetes.',
      'DISPONIBILIDAD: Si el cliente pregunta por un mes entero o no dio una fecha exacta verificada, respondé "lo confirmamos con la fecha exacta" y nunca afirmes que hay lugar.',
      'SIN PROMESAS FALSAS: Nunca digas que avisamos al instante si alguien consulta por una fecha.',
    ],
  });
}
