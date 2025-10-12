
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2, Info, FileCode, BrainCircuit } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { analyzeCodebase, type AnalyzeCodebaseOutput } from '@/ai/flows/analyze-codebase-flow';
import { Textarea } from '@/components/ui/textarea';

const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('completo')) return <CheckCircle className="w-5 h-5 text-green-500"/>;
    if (lowerStatus.includes('mejora')) return <AlertTriangle className="w-5 h-5 text-yellow-500"/>;
    if (lowerStatus.includes('faltante')) return <Info className="w-5 h-5 text-orange-500"/>;
    if (lowerStatus.includes('bug') || lowerStatus.includes('error')) return <AlertTriangle className="w-5 h-5 text-red-500"/>;
    return <FileCode className="w-5 h-5 text-muted-foreground"/>;
}

export default function AnalisisCodebasePage() {
    const { toast } = useToast();
    const [specification, setSpecification] = useState<string>('Quiero saber si todos los módulos de la aplicación funcionan bien y están completos.');
    const [analysisResult, setAnalysisResult] = useState<AnalyzeCodebaseOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await analyzeCodebase({ specification });
            setAnalysisResult(result);
            toast({ title: "Análisis Completado", description: "La IA ha finalizado el análisis del código base." });
        } catch (err: any) {
            console.error("Error analyzing codebase:", err);
            setError(err.message || "Ocurrió un error inesperado durante el análisis.");
            toast({ title: "Error en el Análisis", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const renderAnalysisItems = (items: AnalyzeCodebaseOutput['completedModules'], title: string) => {
      if (!items || items.length === 0) {
        return null;
      }
      return (
        <Card>
            <CardHeader><CardTitle className="font-headline text-lg">{title}</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-4">
                {items.map((item, index) => (
                    <li key={`${title}-${index}`} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(item.status)}
                        <h4 className="font-semibold text-foreground">{item.module}</h4>
                        <span className="text-xs font-medium text-muted-foreground">({item.status})</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-8">{item.details}</p>
                    </li>
                ))}
                </ul>
            </CardContent>
        </Card>
      );
    }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Análisis de Aplicación con IA
          </h1>
        </div>
        <Link href="/" passHref> 
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú Principal
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <form onSubmit={handleAnalyze}>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2">Asistente de Arquitectura</CardTitle>
          <CardDescription>
            Describe tu especificación funcional o lo que necesitas de la aplicación. La IA analizará el código base actual y te dará un informe sobre qué tan alineada está la aplicación con tus requerimientos, identificando módulos completos, faltantes, errores y sugerencias.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Label htmlFor="specification">Tu especificación funcional:</Label>
            <Textarea
                id="specification"
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                rows={4}
                className="mt-1"
                placeholder="Ej: Necesito un sistema CRM para gestionar clientes, un módulo para crear presupuestos y un planificador de eventos..."
            />
        </CardContent>
        <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <BrainCircuit className="w-5 h-5 mr-2"/>}
              {isLoading ? "Analizando..." : "Analizar Aplicación"}
            </Button>
        </CardFooter>
        </form>
      </Card>

      {isLoading && (
        <div className="text-center py-10">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary"/>
            <p className="mt-4 text-muted-foreground">La IA está revisando la aplicación... Esto puede tardar un momento.</p>
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
            {renderAnalysisItems(analysisResult.completedModules, 'Módulos Completos')}
            {renderAnalysisItems(analysisResult.missingModules, 'Módulos Faltantes o Incompletos')}
            {renderAnalysisItems(analysisResult.errorsAndBugs, 'Errores y Bugs Detectados')}
            {renderAnalysisItems(analysisResult.suggestions, 'Sugerencias de Mejora')}
        </div>
      )}
    </div>
  );
}
    
