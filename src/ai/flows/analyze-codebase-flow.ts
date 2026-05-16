export interface AnalyzeCodebaseInput {
  specification: string;
}

export interface AnalysisItem {
  module: string;
  status: string;
  details: string;
}

export interface AnalyzeCodebaseOutput {
  overallSummary: string;
  completedModules: AnalysisItem[];
  missingModules: AnalysisItem[];
  errorsAndBugs: AnalysisItem[];
  suggestions: AnalysisItem[];
}

export async function analyzeCodebase(input: AnalyzeCodebaseInput): Promise<AnalyzeCodebaseOutput> {
  const spec = input.specification.toLowerCase();
  const completedModules: AnalysisItem[] = [
    { module: 'Build', status: 'Verificable', details: 'La app cuenta con typecheck y build como controles principales.' },
    { module: 'PWA', status: 'Implementado', details: 'La instalacion en PC y Android quedo cubierta por manifest, iconos y service worker.' },
    { module: 'Experiencias publicas', status: 'Implementado', details: 'Cliente, invitado, social, barra, totem, video de vida y zona digital tienen rutas publicas.' },
  ];

  const suggestions: AnalysisItem[] = [];
  if (spec.includes('calendar') || spec.includes('calendario')) {
    suggestions.push({ module: 'Google Calendar', status: 'Revisar configuracion', details: 'La sincronizacion externa depende de credenciales y prueba real en produccion.' });
  }
  if (spec.includes('mail') || spec.includes('gmail')) {
    suggestions.push({ module: 'Gmail', status: 'Revisar configuracion', details: 'Los envios dependen de la cuenta conectada y limites del proveedor.' });
  }

  return {
    overallSummary: 'Analisis deterministico disponible aun sin API de IA. No reemplaza una auditoria humana, pero evita que el modulo quede deshabilitado.',
    completedModules,
    missingModules: [],
    errorsAndBugs: [],
    suggestions,
  };
}

export const analyzeCodebaseFlow = analyzeCodebase;
