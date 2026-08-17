export type RsvpStatus = 'Pendiente' | 'Confirmado' | 'Rechazado' | 'Tal vez';
export type CategoriaInvitado = 'Adulto' | 'Niño' | 'Adolescente';
export type DietaryRestriction = 'Ninguna' | 'Celiaco' | 'Vegetariano' | 'Vegano' | 'Sin Gluten' | 'Sin Lactosa' | 'Alergia Mariscos' | 'Alergia Frutos Secos' | 'Otro';

// Phase 3.9: Personalized Guest Experience - Guest profile segments
export type PerfilInvitado = 'General' | 'VIP' | 'Familia' | 'Necesidades Especiales';
/** Alias for PerfilInvitado — used in segmentation views and reports */
export type SegmentoInvitado = PerfilInvitado;

export interface Invitado {
  id: string;
  nombre: string;
  categoria?: CategoriaInvitado;
  contacto?: string; // Email o teléfono
  rsvp: RsvpStatus;
  partySize?: number; // Cuántas personas vienen con esta invitación (incluyendo el principal)
  /**
   * Cuántas de esas personas son niños o adolescentes. El menú y el costo por
   * cubierto no son iguales para un chico que para un adulto, y `categoria`
   * guarda una sola etiqueta para todo el grupo: sin este dato, una familia de
   * dos grandes y tres chicos se cocinaba como cinco adultos.
   */
  kidsCount?: number;
  tableNumber?: string; // Número de mesa asignado
  notes?: string; // Notas adicionales (alergias, comentarios)
  companionNames?: string[]; // Nombres de los acompañantes
  checkedIn?: boolean; // Has this guest been checked in?
  checkInTimestamp?: string; // ISO date string of when they were checked in
  isCeliac?: boolean; // Módulo 2: Seguridad alimentaria
  tag?: string; // Punto 6: Etiqueta de relación (Familia, Amigos, etc.)
  dietaryRestriction?: DietaryRestriction; // Restricción dietaria detallada
  alergiasEspecificas?: string; // Texto libre para detallar alergias específicas
  cancionesDJ?: string[]; // Sugerencias de canciones para el DJ
  // Phase 3.9: VIP/Segmentation fields
  perfil?: PerfilInvitado; // Segmento del invitado (VIP, Familia, General, Necesidades Especiales)
  mensajePersonalizado?: string; // Mensaje personalizado para mostrar al invitado
  mensaje?: string; // Mensaje enviado por el invitado a los festejados
  fotosSubidas?: string[];
  requiereAccesibilidad?: boolean; // Requiere acceso adaptado para movilidad reducida
  readinessScore?: number;
  /** Lead generation for teens: When they turn 15 */
  cumple15?: 'ya_festejado' | 'este_anio' | 'proximo_anio' | 'no_interesa';
}

// Para el formulario de añadir nuevo invitado, antes de tener ID
export type NuevoInvitadoData = Omit<Invitado, 'id' | 'checkedIn' | 'checkInTimestamp'>;
