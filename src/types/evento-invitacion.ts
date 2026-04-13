/**
 * Central configuration for event invitation pages.
 * All template-driven invitation views read from this single config.
 */

export interface DressCodeConfig {
  tipo: 'formal' | 'semi-formal' | 'casual' | 'personalizado';
  textoPersonalizado?: string;
  colorSugerido?: string;
  restricciones?: string;
}

export interface RegalosConfig {
  tipo: 'regalos' | 'dinero' | 'ambos' | 'ninguno';
  textoPersonalizado?: string;
  aliasCBU?: string;
  banco?: string;
  titular?: string;
  cuentaNumero?: string;
  instruccionesRegalos?: string;
  linkListaRegalos?: string;
}

export interface CronogramaItem {
  hora: string;
  actividad: string;
  icono?: string;
}

export type TipoEvento = '15' | '18' | 'boda' | 'cumpleanos' | 'bautismo' | 'otro';
export type EstiloEvento = 'formal' | 'semi-formal' | 'casual';

export interface EventoInvitacionConfig {
  // Identity
  nombreHomenajeada: string;
  tipoEvento: TipoEvento;
  estiloEvento: EstiloEvento;

  // Colors
  colorPrincipal: string;
  colorSecundario: string;
  colorAcento: string;
  colorSugeridoInvitados: string;

  // Venue
  nombreSalon: string;
  direccionSalon: string;
  linkMaps: string;

  // Date & time
  fechaEvento: string;
  horaEvento: string;

  // Media
  fotoPortada: string;
  galeriaFotos: string[];

  // Content
  textoBienvenida: string;

  // Dress code
  dressCode: DressCodeConfig;

  // Gifts
  regalos: RegalosConfig;

  // Template
  plantillaId: string;

  // Features
  rsvpActivo: boolean;
  whatsappNumero?: string;
  contadorActivo: boolean;
  portalSocialActivo: boolean;
  hashtagEvento?: string;

  // Cronograma
  cronograma?: CronogramaItem[];
}

/** Default empty configuration for new events */
export const defaultEventoInvitacionConfig: EventoInvitacionConfig = {
  nombreHomenajeada: '',
  tipoEvento: '15',
  estiloEvento: 'formal',
  colorPrincipal: '#D4AF37',
  colorSecundario: '#1a1a2e',
  colorAcento: '#f5f5dc',
  colorSugeridoInvitados: '',
  nombreSalon: '',
  direccionSalon: '',
  linkMaps: '',
  fechaEvento: '',
  horaEvento: '',
  fotoPortada: '',
  galeriaFotos: [],
  textoBienvenida: '',
  dressCode: {
    tipo: 'formal',
  },
  regalos: {
    tipo: 'ninguno',
  },
  plantillaId: 'elegante-dorado',
  rsvpActivo: true,
  contadorActivo: true,
  portalSocialActivo: false,
  cronograma: [],
};
