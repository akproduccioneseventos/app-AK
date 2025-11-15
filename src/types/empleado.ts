
export interface Empleado {
  id: string;
  nombre: string;
  cedula: string;
  fechaNacimiento: string;
  rolIds?: string[];
  contractFileName?: string; // Nuevo campo para el contrato
}

export interface NuevoEmpleadoFormData {
  nombre: string;
  cedula?: string;
  fechaNacimiento?: string;
  rolIds?: string[];
  contractFileName?: string; // Nuevo campo para el contrato
}
