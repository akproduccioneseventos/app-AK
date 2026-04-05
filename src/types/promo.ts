
export interface PromoActiva {
  id: string;
  activa: boolean;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  regalo: string;
  fechaInicio: string;
  fechaFin: string;
  codigoCupon?: string;
  imagenUrl?: string;
  colorFondo?: string;
  whatsappMensaje: string;
  ctaTexto: string;
  ctaUrl?: string;
  mostrarCountdown: boolean;
  mostrarEnLanding: boolean;
  mostrarEnSimulador: boolean;
  posicion: 'banner-top' | 'popup-center' | 'floating-bottom';
  creadoEn?: string;
  actualizadoEn?: string;
}
