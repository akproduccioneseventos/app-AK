
export interface Empleado {
  id: string;
  nombre: string;
  cedula: string;
  fechaNacimiento: string;
  telefono?: string;
  rolIds?: string[];
  contractFileName?: string; // Nuevo campo para el contrato
  photoUrl?: string; // Foto de perfil del empleado
}

export interface NuevoEmpleadoFormData {
  nombre: string;
  cedula?: string;
  fechaNacimiento?: string;
  telefono?: string;
  rolIds?: string[];
  contractFileName?: string; // Nuevo campo para el contrato
  photoUrl?: string; // Foto de perfil del empleado
}
