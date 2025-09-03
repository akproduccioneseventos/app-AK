

'use client';

import { useState, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, PartyPopper, Wand2, ClipboardList, AlertTriangle, CheckCircle, Loader2, Info } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { analyzeEventPlan, type AnalyzeEventPlanOutput } from '@/ai/flows/analyze-event-plan-flow';
import { Separator } from '@/components/ui/separator';

const getStatusIcon = (status: 'Completo' | 'Parcial' | 'Faltante' | 'Atención Requerida') => {
    switch (status) {
        case 'Completo': return <CheckCircle className="w-5 h-5 text-green-500"/>;
        case 'Parcial': return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin"/>;
        case 'Atención Requerida': return <AlertTriangle className="w-5 h-5 text-orange-500"/>;
        case 'Faltante':
        default: return <Info className="w-5 h-5 text-red-500"/>;
    }
}

export default function AnalisisFiestaPage() {
    const { toast } = useToast();
    const [analysisResult, setAnalysisResult] = useState<AnalyzeEventPlanOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const planData = await getFiestaActual();
            const result = await analyzeEventPlan({ planData });
            setAnalysisResult(result);
            toast({ title: "Análisis Completado", description: "La IA ha finalizado el análisis del plan de evento." });
        } catch (err: any) {
            console.error("Error analyzing event plan:", err);
            setError(err.message || "Ocurrió un error inesperado durante el análisis.");
            toast({ title: "Error en el Análisis", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const renderAnalysisItems = (items: AnalyzeEventPlanOutput['analysisItems']) => {
      if (!items || items.length === 0) {
        return <p className="text-sm text-muted-foreground">No se encontraron elementos de análisis.</p>;
      }
      return (
        <ul className="space-y-4">
          {items.map((item, index) => (
            <li key={`${item.module}-${index}`} className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(item.status)}
                <h4 className="font-semibold text-foreground">{item.module}</h4>
                <span className="text-xs font-medium text-muted-foreground">({item.status})</span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">{item.details}</p>
              {item.suggestion && (
                <div className="mt-2 pl-8 flex items-start gap-2 text-sm text-blue-600">
                    <Wand2 className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                    <p><strong>Sugerencia:</strong> {item.suggestion}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      );
    }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PartyPopper className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Análisis de Plan de Evento con IA
          </h1>
        </div>
        <Link href="/settings" passHref> 
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <form onSubmit={handleAnalyze}>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2">Asistente de Planificación</CardTitle>
          <CardDescription>
            Haz clic en el botón para que la IA analice el estado de tu evento actual, identifique áreas incompletas y te dé sugerencias para mejorar.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">La IA revisará la configuración, invitados, decoración, menús y más, para darte un informe completo del estado de la planificación.</p>
        </CardContent>
        <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Wand2 className="w-5 h-5 mr-2"/>}
              {isLoading ? "Analizando Fiesta..." : "Analizar Fiesta Actual"}
            </Button>
        </CardFooter>
        </form>
      </Card>

      {isLoading && (
        <div className="text-center py-10">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary"/>
            <p className="mt-4 text-muted-foreground">La IA está revisando tu plan... Esto puede tardar un momento.</p>
        </div>
      )}

      {error && (
        <Card className="border-destructive">
            <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/>Error en el Análisis</CardTitle></CardHeader>
            <CardContent><p>{error}</p></CardContent>
        </Card>
      )}

      {analysisResult && (
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader><CardTitle className="font-headline text-xl">Resumen General de la IA</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">{analysisResult.overallSummary}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="font-headline">Análisis Detallado por Módulo</CardTitle></CardHeader>
                <CardContent>{renderAnalysisItems(analysisResult.analysisItems)}</CardContent>
            </Card>
            
            <Card className="mt-8 bg-amber-50 dark:bg-amber-900/30 border-amber-500/50">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-amber-700 dark:text-amber-300"/>
                        Próximos Pasos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Usa este informe para decidir las próximas acciones. Puedes pedirme en el chat que complete las tareas:</p>
                    <ul className="list-disc pl-5 space-y-1 font-mono text-xs bg-muted p-3 rounded-md">
                       <li>"Asigna un menú de catering a la fiesta."</li>
                       <li>"Sugiere una paleta de colores para una boda rústica y aplícala."</li>
                       <li>"Crea 3 tareas nuevas en el planificador."</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
