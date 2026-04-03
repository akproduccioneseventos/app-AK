export type SimV2Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type SimV2TipoEvento = 'Cumpleaños' | '15 años' | 'Boda' | 'Evento empresarial';

export type SimV2Paquete = 'Básico' | 'Intermedio' | 'Premium';

export interface SimV2State {
  // Step 1
  nombre: string;
  apellido: string;
  telefono: string;
  leadId?: string;
  presupuestoId?: string;

  // Step 2
  fechaEvento?: string; // ISO date string

  // Step 3
  tipoEvento?: SimV2TipoEvento;

  // Step 4
  duracion?: 'hasta4' | 'mas4';

  // Step 5
  adultos: number;
  adolescentes: number;

  // Step 6
  tieneSalon?: boolean;
  salonNombre?: string;
  incluirClubUruguay?: boolean;

  // Step 7-8 (services & package)
  paquete?: SimV2Paquete;
  serviciosActivados?: string[];

  // Step 9-10 (computed)
  mozosRecomendados?: number;
  beneficiosSeleccionados?: string[];

  // Meta
  currentStep: SimV2Step;
  savedAt?: string;
}

export interface SimV2DuplicateCheck {
  isDuplicate: boolean;
  existingLeadId?: string;
  existingPresupuestoId?: string;
  existingClientName?: string;
}

export interface SimV2DateCheck {
  isOccupied: boolean;
  suggestions?: string[]; // ISO date strings of suggested available dates
}
