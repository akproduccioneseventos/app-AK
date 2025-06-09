
export type RsvpStatus = 'Pendiente' | 'Confirmado' | 'Rechazado' | 'Quizás';

export interface Invitado {
  id: string;
  nombre: string;
  contacto?: string; // Email o teléfono
  rsvp: RsvpStatus;
  partySize?: number; // Cuántas personas vienen con esta invitación (ej. +1)
  tableNumber?: string; // Número de mesa asignado
  notes?: string; // Notas adicionales (alergias, comentarios)
}

// Para el formulario de añadir nuevo invitado, antes de tener ID
export type NuevoInvitadoData = Omit<Invitado, 'id'>;
