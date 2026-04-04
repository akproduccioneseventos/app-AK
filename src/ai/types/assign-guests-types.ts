// Temporarily disabled — types stub for stable build.

export interface AssignGuestsInput {
  fiestaId: string;
  invitados: Array<{ id: string; nombre: string; categoria?: string }>;
  mesas: Array<{ id: string; numero: string; capacidad: number }>;
}

export interface AssignGuestsOutput {
  asignaciones: Array<{ invitadoId: string; mesaId: string }>;
}
