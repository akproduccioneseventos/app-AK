export interface AssignGuestsInput {
  fiestaId: string;
  invitados: Array<{ id: string; nombre: string; categoria?: string }>;
  mesas: Array<{ id: string; numero: string; capacidad: number }>;
}

export interface AssignGuestsOutput {
  asignaciones: Array<{ invitadoId: string; mesaId: string }>;
  sinMesa: Array<{ invitadoId: string; motivo: string }>;
  resumen: string;
}
