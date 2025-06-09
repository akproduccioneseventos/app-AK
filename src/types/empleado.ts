
export interface Empleado {
  id: string;
  nombre: string;
  rol: string;
  sueldoBase: number;
}

// Para el formulario, antes de tener un ID
export type NuevoEmpleadoFormData = Omit<Empleado, 'id'>;
