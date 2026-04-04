// This flow is temporarily disabled to ensure a stable build.
// Re-enable by implementing the full Genkit flow when needed.

export interface AssignGuestsInput {
  fiestaId: string;
  invitados: Array<{ id: string; nombre: string; categoria?: string }>;
  mesas: Array<{ id: string; numero: string; capacidad: number }>;
}

export interface AssignGuestsOutput {
  asignaciones: Array<{ invitadoId: string; mesaId: string }>;
}

export async function assignGuestsFlow(
  _input: AssignGuestsInput
): Promise<AssignGuestsOutput> {
  throw new Error('El módulo de asignación de invitados está temporalmente deshabilitado.');
}
