export interface PresentacionLedBeneficioItem {
  emoji: string;
  texto: string;
}

export interface PresentacionLedSettings {
  portada: {
    tituloPrincipal: string;
    subtitulo: string;
    imagenFondoUrl: string;
    colorAcento: string;
  };
  porQueElegirnos: {
    beneficios: PresentacionLedBeneficioItem[];
    imagenLateralUrl: string;
  };
  salon: {
    titulo: string;
    descripcion: string;
    fotos: string[];
  };
  cierre: {
    titulo: string;
    mensaje: string;
    ctaTexto: string;
    ctaAccion: 'generar-presupuesto' | 'whatsapp' | 'contacto';
  };
  /** Map of ServicioEmpresa ID → uploaded photo URL for LED presenter */
  ledFotosServicios?: Record<string, string>;
  /** Map of MenuItem ID → uploaded photo URL for LED presenter */
  ledFotosMenuItems?: Record<string, string>;
  /** URL for the plan de pagos slide background photo */
  planPagosImagenUrl?: string;
}

export interface CatalogoSettings {
  hero: {
    titulo: string;
    subtitulo: string;
    imagenFondoUrl: string;
    color: string;
  };
  galeria: {
    url: string;
    alt: string;
  }[];
  testimonios: string[];
  textoPresentacion: string;
  textoPorQueElegirnos: string;
}

export type CatalogoSettingsMap = Record<string, CatalogoSettings>;
