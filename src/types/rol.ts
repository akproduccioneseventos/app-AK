
import type { CategoriaServicio } from './empresa';

export interface Rol {
  id: string;
  nombre: string;
  categoriaServicio?: CategoriaServicio;
  
  // El sueldo total que se paga al empleado por el evento.
  // Incluye sueldo base, vacacional y aguinaldo.
  sueldoPorEvento: number; 
  
  // Porcentajes para el desglose del sueldo. Se calculan sobre el sueldo base.
  porcentajeSalarioVacacional: number; // ej: 8.33
  porcentajeAguinaldo: number; // ej: 8.33

  // Porcentaje para el cálculo de aportes que paga la empresa. Se calcula sobre el sueldo total.
  porcentajeAportesPatronales: number; // ej: 20
  
  // Costo de aportes pre-calculado para referencia.
  costoAportesCalculado?: number; 
}

export type NuevoRolFormData = Omit<Rol, 'id' | 'costoAportesCalculado'>;
