
export interface Empleado {
  id: string;
  nombre: string;
  cedula: string;
  fechaNacimiento: string; // ISO date string
  rolId?: string;
}

export interface NuevoEmpleadoFormData {
  nombre: string;
  cedula: string;
  fechaNacimiento: string; // ISO date string
}
