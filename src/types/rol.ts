
export interface Rol {
  id: string;
  nombre: string; // Ej: Mozo, DJ, Coordinador, Decorador
  tipoSalario: 'Mensual' | 'Por evento'; // Cambiado
  montoSalario?: number; // Sueldo base
  porcentajeAportes?: number; // Porcentaje definido por el usuario, ej: 30 para 30%
  aportesCalculados?: number; // Calculado: montoSalario * (porcentajeAportes / 100)
  notas?: string; // Descripción o detalles adicionales del rol
}

// Para el formulario, antes de tener un ID
export type NuevoRolFormData = Omit<Rol, 'id'>;

