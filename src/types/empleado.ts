
export interface Empleado {
  id: string;
  nombre: string;
  cedula: string; // Nuevo campo obligatorio
  fechaNacimiento: string; // Nuevo campo obligatorio (ISO date string)
  rolId?: string; // ID del rol asignado desde el nuevo sistema de roles
}

// Para el formulario de alta inicial, solo datos básicos
export interface NuevoEmpleadoFormData {
  nombre: string;
  cedula: string;
  fechaNacimiento: string; // ISO date string
}
