export type RsvpStatus = 'Pendiente' | 'Confirmado' | 'Rechazado' | 'Tal vez';
export type CategoriaInvitado = 'Adulto' | 'Niño/Adolescente';
export type DietaryRestriction = 'Ninguna' | 'Celiaco' | 'Vegetariano' | 'Vegano' | 'Otro';

export interface Invitado {
  id: string;
  nombre: string;
  categoria?: CategoriaInvitado;
  contacto?: string; // Email o teléfono
  rsvp: RsvpStatus;
  partySize?: number; // Cuántas personas vienen con esta invitación (incluyendo el principal)
  tableNumber?: string; // Número de mesa asignado
  notes?: string; // Notas adicionales (alergias, comentarios)
  companionNames?: string[]; // Nombres de los acompañantes
  checkedIn?: boolean; // Has this guest been checked in?
  checkInTimestamp?: string; // ISO date string of when they were checked in
  isCeliac?: boolean; // Módulo 2: Seguridad alimentaria
  tag?: string; // Punto 6: Etiqueta de relación (Familia, Amigos, etc.)
  dietaryRestriction?: DietaryRestriction; // Restricción dietaria detallada
  cancionesDJ?: string[]; // Sugerencias de canciones para el DJ
}

// Para el formulario de añadir nuevo invitado, antes de tener ID
export type NuevoInvitadoData = Omit<Invitado, 'id' | 'checkedIn' | 'checkInTimestamp'>;
