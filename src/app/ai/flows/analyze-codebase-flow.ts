'use server';

import { ai, ejecutarPromptConFallback, geminiModel } from '@/ai/genkit';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { z } from 'genkit';

const AnalyzeCodebaseInputSchema = z.object({
  specification: z.string().describe('Especificación funcional a revisar.'),
});
export type AnalyzeCodebaseInput = z.infer<typeof AnalyzeCodebaseInputSchema>;

const AnalysisItemSchema = z.object({
  module: z.string(),
  status: z.string(),
  details: z.string(),
});

const AnalyzeCodebaseOutputSchema = z.object({
  overallSummary: z.string(),
  completedModules: z.array(AnalysisItemSchema),
  missingModules: z.array(AnalysisItemSchema),
  errorsAndBugs: z.array(AnalysisItemSchema),
  suggestions: z.array(AnalysisItemSchema),
});
export type AnalyzeCodebaseOutput = z.infer<typeof AnalyzeCodebaseOutputSchema>;

export async function analyzeCodebase(input: AnalyzeCodebaseInput): Promise<AnalyzeCodebaseOutput> {
  await requirePermisoAlguno(PERMISOS.ADMINISTRACION);
  const { hayPresupuestoParaIA } = await import('@/lib/ai/consumo-servidor');
  if (!(await hayPresupuestoParaIA().catch(() => false))) {
    return fallbackAnalysis('Se alcanzó el tope mensual de IA.');
  }
  return analyzeCodebaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCodebasePrompt',
  input: { schema: AnalyzeCodebaseInputSchema },
  output: { schema: AnalyzeCodebaseOutputSchema },
  prompt: `Sos auditor técnico de AK Producciones.

Reglas obligatorias:
- No declares la app 100% funcional si no hay prueba real.
- No digas que un módulo está completo solo porque existe un archivo.
- No inventes que se probaron botones, flujos o Firebase.
- No sugieras tocar seguridad ni cambiar el modelo de login.
- No propongas módulos nuevos grandes.
- Detectá problemas concretos, con foco en funcionamiento real, UX, botones, flujos, datos, dashboard, multiagente y módulos que prometen más de lo que hacen.
- Respondé siempre en español.

Especificación del usuario:
{{{specification}}}`,
});

const fallbackAnalysis = (reason: string): AnalyzeCodebaseOutput => ({
  overallSummary: 'Auditoría prudente: no se pudo completar una auditoría automática profunda. No se declara la aplicación como terminada sin pruebas reales.',
  completedModules: [],
  missingModules: [],
  errorsAndBugs: [
    {
      module: 'Auditoría automática',
      status: 'Revisión limitada',
      details: reason,
    },
  ],
  suggestions: [
    {
      module: 'Prueba real de app',
      status: 'Pendiente',
      details: 'Probar flujo completo: lead → presupuesto → evento → pago → dashboard → cliente → multiagente.',
    },
  ],
});

const analyzeCodebaseFlow = ai.defineFlow(
  {
    name: 'analyzeCodebaseFlow',
    inputSchema: AnalyzeCodebaseInputSchema,
    outputSchema: AnalyzeCodebaseOutputSchema,
  },
  async input => {
    try {
      const { registrarConsumoIA } = await import('@/lib/ai/consumo-servidor');
      const { output } = await ejecutarPromptConFallback(prompt, input, geminiModel);
      if (!output) {
        return fallbackAnalysis('La IA no devolvió un diagnóstico válido. Se evita mostrar un falso “todo completo”.');
      }
      await registrarConsumoIA('analisis-codigo').catch(() => undefined);
      return output;
    } catch (error) {
      return fallbackAnalysis(error instanceof Error ? error.message : 'Error desconocido en el análisis automático.');
    }
  }
);
