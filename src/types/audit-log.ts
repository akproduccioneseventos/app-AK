export type ModuloSistema =
  | 'fiesta'
  | 'presupuesto'
  | 'invitados'
  | 'catering'
  | 'tareas'
  | 'personal'
  | 'costos'
  | 'documentos'
  | 'decoracion'
  | 'proveedores'
  | 'sistema'
  | 'playbook'
  | 'aprobacion';

export interface AuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  rolUsuario: string;
  modulo: ModuloSistema;
  accion: string;
  fiestaId?: string;
  descripcion: string;
  valorAntes?: string;
  valorDespues?: string;
  ipAddress?: string;
}
