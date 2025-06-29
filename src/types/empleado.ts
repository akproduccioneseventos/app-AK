
export interface Empleado {
  id: string;
  nombre: string;
  cedula: string; // Will be saved as empty string if not provided on creation
  fechaNacimiento: string; // Will be saved as empty string if not provided on creation
  rolId?: string;
}

export interface NuevoEmpleadoFormData {
  nombre: string;
  cedula?: string;
  fechaNacimiento?: string; // ISO date string
  rolId?: string;
}
