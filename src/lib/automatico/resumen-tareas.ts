import type { OrigenDisparo } from '@/lib/automatico/control-concurrencia';

export interface TareaAutomatica {
  /** El nombre de la carpeta en `src/app/api/cron/`. */
  id: string;
  /** Como se llama para el dueno, sin jerga. */
  nombre: string;
  /** Que deja de pasar si no corre. En criollo, y concreto. */
  siNoCorre: string;
  /** Cada cuantas horas deberia correr. Sirve para saber si esta atrasada. */
  cadaHoras: number;
}

export type EstadoTarea = 'nunca' | 'atrasada' | 'al-dia' | 'no-disponible';

export interface EstadoDeTarea extends TareaAutomatica {
  ultimaCorrida: string | null;
  ultimoIntento: string | null;
  ultimoFallo?: { fecha: string; error: string } | null;
  faltaConexion?: string | null;
  falloPosteriorAlExito?: boolean;
  disparadoPor?: OrigenDisparo | null;
  /** `nunca` es la que importa: quiere decir que esta escrita y no se ejecuta. */
  estado: EstadoTarea;
  horasDesdeLaUltima: number | null;
}

export interface EstadoDespertador {
  ultimoToque: string | null;
  estado: 'activo' | 'nunca' | 'atrasado';
  minutosDesdeUltimoToque: number | null;
  mensaje: string;
}

export interface ResumenTareasAutomaticas {
  total: number;
  alDia: number;
  atrasadas: number;
  nunca: number;
  noDisponibles: number;
  conFalloReciente: EstadoDeTarea[];
}

export function tieneFalloPosteriorAlExito(
  tarea: Pick<EstadoDeTarea, 'ultimaCorrida' | 'ultimoFallo'>,
): boolean {
  if (!tarea.ultimoFallo?.fecha) return false;
  if (!tarea.ultimaCorrida) return true;
  const fechaFallo = new Date(tarea.ultimoFallo.fecha).getTime();
  const fechaExito = new Date(tarea.ultimaCorrida).getTime();
  if (!Number.isFinite(fechaFallo)) return false;
  if (!Number.isFinite(fechaExito)) return true;
  return fechaFallo > fechaExito;
}

export function resumirTareasAutomaticas(tareas: EstadoDeTarea[]): ResumenTareasAutomaticas {
  let alDia = 0;
  let atrasadas = 0;
  let nunca = 0;
  let noDisponibles = 0;
  const conFalloReciente: EstadoDeTarea[] = [];

  for (const t of tareas) {
    if (t.estado === 'no-disponible' || Boolean(t.faltaConexion)) {
      noDisponibles += 1;
    } else if (t.estado === 'al-dia') {
      alDia += 1;
    } else if (t.estado === 'atrasada') {
      atrasadas += 1;
    } else {
      nunca += 1;
    }

    if (tieneFalloPosteriorAlExito(t)) {
      conFalloReciente.push(t);
    }
  }

  return {
    total: tareas.length,
    alDia,
    atrasadas,
    nunca,
    noDisponibles,
    conFalloReciente,
  };
}
