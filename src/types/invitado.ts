
export type RsvpStatus = 'Pendiente' | 'Confirmado' | 'Rechazado';

export interface Invitado {
  id: string;
  nombre: string;
  contacto?: string; // Email o teléfono
  rsvp: RsvpStatus;
  partySize?: number; // Cuántas personas vienen con esta invitación (incluyendo el principal)
  tableNumber?: string; // Número de mesa asignado
  notes?: string; // Notas adicionales (alergias, comentarios)
  companionNames?: string[]; // Nombres de los acompañantes
}

// Para el formulario de añadir nuevo invitado, antes de tener ID
export type NuevoInvitadoData = Omit<Invitado, 'id'>;
