export type NivelRiesgo = 'Critico' | 'Alto' | 'Medio' | 'Bajo';

export interface RiesgoItem {
  id: string;
  descripcion: string;
  nivelRiesgo: NivelRiesgo;
  modulo: string;
  accionSugerida: string;
}

export interface ReadinessReport {
  fiestaId: string;
  calculadoEn: string;
  porcentajeReadiness: number;
  riesgos: RiesgoItem[];
  prioridades: string[];
  accionesSugeridas: string[];
  detalles: {
    tareasVencidas: number;
    pagosPendientes: number;
    docsAusentes: number;
    proveedoresNoConfirmados: number;
    cateringStatus: string;
  };
}
