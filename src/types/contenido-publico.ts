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
