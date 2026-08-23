export type TipoEventoAnuncio =
  | '15_anos'
  | 'bodas'
  | 'cumpleanos'
  | 'empresarial'
  | 'promocion_temporada';

export type ObjetivoAnuncio = 'whatsapp' | 'simulador' | 'reunion' | 'seguidores';

export type TonoAnuncio =
  | 'emocional_familiar'
  | 'divertido_fiesta'
  | 'elegante_premium'
  | 'urgencia_oferta';

export interface EscenaGuion {
  segundo: string;
  visual: string;
  textoPantalla: string;
  audioLocucion: string;
}

export interface GuionReelsTikTok {
  duracionSegundos: number;
  musicaSugerida: string;
  escenas: EscenaGuion[];
}

export interface SugerenciaVisual {
  tipoImagen: string;
  elementosRecomendados: string[];
  textoSuperpuesto: string;
}

export interface PublicoObjetivoSugerido {
  edad: string;
  intereses: string[];
  ubicacion: string;
  consejoSegmentacion: string;
}

export interface AnuncioGenerado {
  id: string;
  tipoEvento: TipoEventoAnuncio;
  objetivo: ObjetivoAnuncio;
  tono: TonoAnuncio;
  tituloGancho: string;
  textoPrincipal: string;
  llamadoAccion: string;
  enlaceDestino: string;
  guionReelsTikTok: GuionReelsTikTok;
  sugerenciaVisual: SugerenciaVisual;
  publicoObjetivoSugerido: PublicoObjetivoSugerido;
  creadoEn: string;
}

export interface EvaluacionSeccion {
  puntaje: number;
  observaciones: string;
}

export interface AuditoriaAnuncio {
  id: string;
  puntajeGlobal: number; // 1 al 10
  diagnosticoResumen: string;
  evaluacionGancho: EvaluacionSeccion & { ganchoMejorado: string };
  evaluacionNeuroventas: EvaluacionSeccion & { palabrasClaveEmocionales: string[] };
  evaluacionOfertaFriccion: EvaluacionSeccion & { ctaRecomendado: string };
  fallasCriticas: string[];
  consejosOptimizacionSinGastarMas: string[];
  anuncioReescritoOptimizado: {
    tituloGancho: string;
    copyCompleto: string;
    llamadoAccion: string;
    porQueEstaVersionConvierteMejor: string;
  };
  analizadoEn: string;
}

