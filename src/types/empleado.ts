
export interface Empleado {
  id: string;
  nombre: string;
  cedula: string;
  fechaNacimiento: string;
  rolIds?: string[]; // Changed from rolId: string
}

export interface NuevoEmpleadoFormData {
  nombre: string;
  cedula?: string;
  fechaNacimiento?: string;
  rolIds?: string[]; // Changed from rolId: string
}
