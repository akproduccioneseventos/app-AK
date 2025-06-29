
export type TipoRegistroProveedor = 'Proveedor' | 'Servicio Subcontratado';

export interface Proveedor {
  id: string;
  tipo: TipoRegistroProveedor;
  nombre: string; // Nombre del Contacto o Responsable
  nombreEmpresa?: string; // Nombre de la Empresa o del Servicio
  servicioPrincipal: string; // Categoría/Tipo de servicio
  telefono?: string;
  email?: string;
  notas?: string;
}

// For the creation form, before an ID is assigned
export type NuevoProveedorFormData = Omit<Proveedor, 'id'>;
