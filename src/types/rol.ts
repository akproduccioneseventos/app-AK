
export interface Rol {
  id: string;
  nombre: string; // Ej: Mozo, DJ, Coordinador, Decorador
  tipoSalario: 'Mensual' | 'Por evento'; 
  montoSalario?: number; // Sueldo base si es fijo mensual
  aportesCalculados?: number; // Calculado: montoSalario * (0.30) si es mensual
  notas?: string; // Descripción o detalles adicionales del rol
}

// Para el formulario, antes de tener un ID
export type NuevoRolFormData = Omit<Rol, 'id'>;
