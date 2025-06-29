
export interface Rol {
  id: string;
  nombre: string;
  tipoSalario: 'Por evento';
  montoSalario?: number;
  porcentajeAportes?: number;
  aportesCalculados?: number;
}

export type NuevoRolFormData = Omit<Rol, 'id'>;
