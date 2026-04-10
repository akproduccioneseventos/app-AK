export type TipoCambio =
  | 'presupuesto'
  | 'menu'
  | 'invitados'
  | 'proveedor'
  | 'horario'
  | 'servicio'
  | 'otro';

export type EstadoAprobacion = 'Pendiente' | 'Aprobado' | 'Rechazado';

export interface AprobacionRequest {
  id: string;
  fiestaId: string;
  tipoCambio: TipoCambio;
  descripcion: string;
  valorAntes: string;
  valorDespues: string;
  impactoEconomico: number;
  impactoOperativo: string;
  solicitadoPor: string;
  solicitadoEn: string;
  estadoAprobacion: EstadoAprobacion;
  aprobadoPor?: string;
  aprobadoEn?: string;
  motivoRechazo?: string;
  version: number;
}
