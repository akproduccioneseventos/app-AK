
export interface Empleado {
  id: string;
  nombre: string;
  cedula: string;
  fechaNacimiento: string;
  telefono?: string;
  email?: string;
  rolIds?: string[];
  contractFileName?: string; // Nuevo campo para el contrato
  photoUrl?: string; // Foto de perfil del empleado
}

export interface ReciboFirmado {
  id: string;
  fiestaId: string;
  empleadoId: string;
  monto: number;
  fecha: string;
  archivoUrl?: string;
  archivoNombre?: string;
  estado: 'pendiente' | 'pagado' | 'firmado_subido';
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NuevoEmpleadoFormData {
  nombre: string;
  cedula?: string;
  fechaNacimiento?: string;
  telefono?: string;
  email?: string;
  rolIds?: string[];
  contractFileName?: string; // Nuevo campo para el contrato
  photoUrl?: string; // Foto de perfil del empleado
}
