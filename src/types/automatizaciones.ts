// ─────────────────────────────────────────────────────────────────────────────
// Types for the automations system
// ─────────────────────────────────────────────────────────────────────────────

export interface AutomatizacionRule {
  id: string;
  nombre: string;
  descripcion: string;
  trigger: AutoTrigger;
  accion: AutoAccion;
  activa: boolean;
}

export type AutoTrigger =
  | { tipo: 'dias_antes_evento'; dias: number; condicion: string }
  | { tipo: 'dias_despues_creacion'; dias: number; condicion: string }
  | { tipo: 'cuota_vencida'; diasTolerancia: number }
  | { tipo: 'campo_faltante'; campo: string; diasAntes: number }
  | { tipo: 'cambio_en_portal'; campo: string };

export type AutoAccion =
  | { tipo: 'alerta_interna'; destino: 'dashboard' | 'centro_de_mando' }
  | { tipo: 'recordatorio_cliente'; canal: 'portal' | 'notificacion' }
  | { tipo: 'notificacion_organizador'; mensaje: string };

export interface AlertaAutomatica {
  id: string;
  fiestaId: string;
  fiestaName: string;
  tipo: 'urgente' | 'atencion' | 'info' | 'recordatorio';
  mensaje: string;
  area: string;
  fechaGenerada: string; // ISO
  leida: boolean;
  accionUrl?: string;
  accionLabel?: string;
}
