
export interface Proveedor {
  id: string;
  nombre: string;
  nombreEmpresa?: string;
  servicioPrincipal: string; // e.g., 'Catering', 'Fotografía', 'DJ'
  personaContacto?: string;
  telefono?: string;
  email?: string;
  notas?: string;
}

// For the creation form, before an ID is assigned
export type NuevoProveedorFormData = Omit<Proveedor, 'id'>;
