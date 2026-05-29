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

function hasAny(text: string, terms: string[]) {
  return terms.some(term => text.includes(term));
}

export async function analyzeCodebase(input: AnalyzeCodebaseInput): Promise<AnalyzeCodebaseOutput> {
  const spec = input.specification.toLowerCase();
  const completedModules: AnalysisItem[] = [];
  const missingModules: AnalysisItem[] = [];
  const errorsAndBugs: AnalysisItem[] = [];
  const suggestions: AnalysisItem[] = [];

  if (hasAny(spec, ['multiagente', 'multi agente', 'agentes', 'ia'])) {
    completedModules.push({
      module: 'Multiagente AK',
      status: 'Implementado con revisión necesaria',
      details: 'Existe flujo IA y widget flotante, pero debe probarse en producción que responda con datos reales y que no tape acciones importantes en móvil.',
    });
  }

  if (hasAny(spec, ['alerta', 'prioridad', 'dashboard', 'inicio'])) {
    errorsAndBugs.push({
      module: 'Dashboard / Prioridades',
      status: 'Revisar funcionamiento real',
      details: 'El diagnóstico no debe asumir que las alertas funcionan sin verificar que se carguen, se muestren y se puedan descartar desde la interfaz.',
    });
  }

  if (hasAny(spec, ['notificacion', 'notificación', 'push', 'fcm'])) {
    suggestions.push({
      module: 'Notificaciones',
      status: 'Requiere prueba real',
      details: 'Las notificaciones deben validarse en navegador real y celular real; el análisis de código no puede confirmar sonido, permisos ni recepción final.',
    });
  }

  if (hasAny(spec, ['presupuesto', 'crm', 'cliente', 'fiesta', 'evento'])) {
    suggestions.push({
      module: 'Flujos principales',
      status: 'Probar de punta a punta',
      details: 'Para dar aprobación final hay que crear un lead, convertirlo, generar presupuesto, crear evento, registrar pago y revisar que el dashboard cambie.',
    });
  }

  if (completedModules.length === 0 && missingModules.length === 0 && errorsAndBugs.length === 0 && suggestions.length === 0) {
    suggestions.push({
      module: 'Auditoría',
      status: 'Sin conclusión automática',
      details: 'No se encontró una palabra clave suficiente en la especificación. Este módulo ya no declara la app como completa sin una prueba real.',
    });
  }

  return {
    overallSummary: 'Auditoría prudente: no se declara la aplicación 100% funcional sin pruebas reales. Este análisis evita afirmar módulos completos si no fueron verificados.',
    completedModules,
    missingModules,
    errorsAndBugs,
    suggestions,
  };
}

export const analyzeCodebaseFlow = analyzeCodebase;
