
export interface Rol {
  id: string;
  nombre: string; // Ej: Mozo, DJ, Coordinador, Decorador
  tipoSalario: 'fijo' | 'variable'; // Si el salario es un monto fijo o se define por evento
  montoSalario?: number; // Solo aplica si tipoSalario es 'fijo'
  aportesCalculados?: number; // Calculado como 30% del montoSalario si es fijo
  notas?: string; // Descripción o detalles adicionales del rol
}

// Para el formulario, antes de tener un ID
export type NuevoRolFormData = Omit<Rol, 'id'>;
