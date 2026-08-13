/**
 * Accesos que se le dan a gente de afuera (fotógrafo, DJ, catering) para que
 * entren a su pantalla sin tener cuenta en el sistema.
 *
 * El tipo vive acá y no en la acción de servidor porque lo necesitan también el
 * control de vigencia y las pruebas, y un archivo `'use server'` sólo puede
 * exportar funciones asíncronas.
 */
export type ModuloPermiso =
  | 'musica' | 'itinerario' | 'carga-operativa' | 'decoracion' | 'crm' | 'reposteria' | 'fotografia'
  | 'presupuestos' | 'facturas' | 'clientes' | 'empleados' | 'proveedores' | 'empresa' | 'contabilidad' | 'calendario';

export interface AccesoPersonal {
  id: string; // Token único y secreto
  nombreAcceso: string;
  /** Sin fiesta asignada el acceso es global a propósito: el DJ de siempre. */
  fiestaId?: string;
  /**
   * Con qué persona del equipo se corresponde este acceso, si es alguien de la
   * lista de empleados. Es lo que permite mostrarle su rol en el plan de la
   * noche. Va opcional porque muchos accesos son para gente de afuera que no
   * está en la lista (el fotógrafo contratado, el catering).
   */
  empleadoId?: string;
  permisos: ModuloPermiso[];
  fechaCreacion: string; // ISO Date String
  /**
   * Hasta cuándo sirve el enlace. Si no viene, se usa la ventana por defecto
   * contada desde `fechaCreacion`.
   */
  fechaVencimiento?: string;
}
