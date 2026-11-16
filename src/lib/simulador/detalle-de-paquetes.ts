export interface ServicioIncluidoParaDetalle {
  id?: string;
  nombre?: string;
  name?: string;
  esRegalo?: boolean;
}

export interface PaqueteParaDetalle {
  id?: string;
  nombre?: string;
  serviciosIncluidos?: ServicioIncluidoParaDetalle[];
}

/**
 * Arma la descripción textual de los paquetes a partir del catálogo configurado,
 * asegurando que la IA o el simulador muestre únicamente lo que realmente incluye cada paquete.
 */
export function detalleDePaquetes(paquetesCatalog: PaqueteParaDetalle[]): string {
  if (!Array.isArray(paquetesCatalog) || paquetesCatalog.length === 0) {
    return '';
  }

  const detalles = paquetesCatalog
    .filter((pkg) => pkg && (pkg.nombre || (pkg.serviciosIncluidos && pkg.serviciosIncluidos.length > 0)))
    .map((pkg) => {
      const nombrePaquete = pkg.nombre || 'Paquete';
      const servicios = (pkg.serviciosIncluidos || [])
        .map((srv) => {
          const nombreSrv = srv.nombre || srv.name || 'Servicio';
          return srv.esRegalo ? `${nombreSrv} (de regalo)` : nombreSrv;
        })
        .filter(Boolean);

      const listaServicios = servicios.length > 0 ? servicios.join(', ') : 'Sin servicios adicionales';
      return `${nombrePaquete}: ${listaServicios}`;
    });

  return detalles.join(' · ');
}
