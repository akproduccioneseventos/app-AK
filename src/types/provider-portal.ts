export type TipoProveedor = 'Fotografía' | 'DJ' | 'Catering' | 'Decoración' | 'Repostería' | 'Animación' | 'Video' | 'Sonido' | 'Otro';
export type EstadoProveedorPortal = 'Pendiente' | 'Confirmado' | 'En Camino' | 'Llegó' | 'Completó' | 'No Llegó';

export interface TareaProveedor {
  id: string;
  texto: string;
  completada: boolean;
  completadoEn?: string; // ISO string
}

export interface ProveedorPortalAccess {
  id: string;
  fiestaId: string;
  token: string; // unique access token
  nombreProveedor: string;
  tipoProveedor: TipoProveedor;
  email?: string;
  telefono?: string;
  horaLlegadaEstimada: string; // "HH:MM"
  horaPartidaEstimada?: string; // "HH:MM"
  estadoActual: EstadoProveedorPortal;
  tareas: TareaProveedor[];
  notas?: string;
  archivosSubidos?: string[]; // URLs
  llegadaConfirmadaEn?: string; // ISO string
  partidaConfirmadaEn?: string; // ISO string
  createdAt: string; // ISO string
  activo: boolean;
}
