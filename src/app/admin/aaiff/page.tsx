
'use client';

import { useState, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BrainCircuit, FileText, Code2, Bug, Wand2, Puzzle, DatabaseZap, ClipboardList, TerminalSquare, Settings2, RefreshCcw, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { analyzeCodebase, type AnalyzeCodebaseOutput } from '@/ai/flows/analyze-codebase-flow';
import { Separator } from '@/components/ui/separator';

const defaultSpecification = `# Especificación Funcional de la Aplicación de Gestión de Eventos

## 1. Objetivo Principal
La aplicación es un sistema integral (ERP) para una empresa de planificación de eventos, llamada AK Producciones. Debe permitir gestionar todo el ciclo de vida de un evento, desde la captación del cliente hasta la finalización.

## 2. Módulos Requeridos

### 2.1. Gestión Comercial (CRM & Ventas)
- **CRM de Prospectos:** Un tablero Kanban para seguir a los clientes potenciales desde la consulta inicial hasta la firma del contrato.
- **Presupuestos:** Herramienta para crear presupuestos detallados y dinámicos. Debe permitir seleccionar servicios de un catálogo, aplicar descuentos y generar un PDF para el cliente.
- **Facturación:** Generación de facturas a partir de presupuestos aceptados. Seguimiento de pagos parciales y totales.

### 2.2. Gestión de Clientes
- Un listado de todos los clientes que han firmado contrato.
- Ficha de cliente con sus datos de contacto, fiscales y un historial de los eventos contratados.

### 2.3. Planificador de Fiestas
Este es el módulo central para un evento activo.
- **Configuración General:** Detalles básicos del evento (fecha, lugar, invitados).
- **Lista de Tareas:** Checklist para seguir el progreso.
- **Gestión de Invitados:** Lista de invitados con estado de confirmación (RSVP).
- **Decoración:** Planificación de la temática, paleta de colores y elementos decorativos.
- **Catering:** Creación de menús, cálculo de costos de ingredientes.
- **Gestión de Personal:** Asignación de empleados a un evento.

### 2.4. Gestión Interna de la Empresa
- **Empleados y Roles:** Gestión del personal de la empresa y sus roles/sueldos.
- **Proveedores:** Base de datos de proveedores de insumos y servicios subcontratados.
- **Inventario General:** Un catálogo maestro de todos los activos, insumos y servicios que ofrece la empresa, con su costo y precio de venta.

### 2.5. Módulos Adicionales
- **Página Pública del Evento:** Una página web para invitados con información, galería y RSVP.
- **Portal del Cliente:** Un área privada para que el cliente vea el progreso, documentos, etc.
`;

export default function AAOIFFPage() {
    const { toast } = useToast();
    const [specification, setSpecification] = useState(defaultSpecification);
    const [analysisResult, setAnalysisResult] = useState<AnalyzeCodebaseOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        if (!specification.trim()) {
            toast({ title: "Especificación requerida", description: "Por favor, introduce la especificación funcional de la aplicación.", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        try {
            const result = await analyzeCodebase({ specification });
            setAnalysisResult(result);
            toast({ title: "Análisis Completado", description: "La IA ha finalizado el análisis de tu código." });
        } catch (err: any) {
            console.error("Error analyzing codebase:", err);
            setError(err.message || "Ocurrió un error inesperado durante el análisis.");
            toast({ title: "Error en el Análisis", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const renderAnalysisItems = (items: AnalyzeCodebaseOutput['completedModules'], category: string) => {
      if (!items || items.length === 0) {
        return <p className="text-sm text-muted-foreground">No se encontraron elementos en esta categoría.</p>;
      }
      return (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={`${category}-${index}`} className="p-3 border rounded-md bg-muted/30">
              <p className="font-semibold text-foreground">{item.module}</p>
              <p className="text-sm text-primary">{item.status}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
            </li>
          ))}
        </ul>
      );
    }


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Análisis y Optimización por IA
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
          <CardTitle className="font-headline text-xl flex items-center gap-2"><FileText className="w-5 h-5 text-primary/80"/>Especificación Funcional del Sistema</CardTitle>
          <CardDescription>
            Pega aquí el "Prompt Maestro" o la descripción detallada de lo que tu aplicación debe hacer. La IA comparará esto con el código existente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Textarea 
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                placeholder="Describe los módulos y funcionalidades que esperas en tu aplicación..."
                className="min-h-[250px] font-mono text-sm"
                disabled={isLoading}
            />
        </CardContent>
        <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <BrainCircuit className="w-5 h-5 mr-2"/>}
              {isLoading ? "Analizando..." : "Iniciar Análisis Completo"}
            </Button>
        </CardFooter>
        </form>
      </Card>

      {isLoading && (
        <div className="text-center py-10">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary"/>
            <p className="mt-4 text-muted-foreground">La IA está leyendo y analizando el código... Esto puede tardar un momento.</p>
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
                <CardHeader><CardTitle className="font-headline text-xl">Resumen General del Análisis</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">{analysisResult.overallSummary}</p></CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-green-600"><CheckCircle className="w-5 h-5"/>Módulos Completados</CardTitle></CardHeader>
                    <CardContent>{renderAnalysisItems(analysisResult.completedModules, 'completed')}</CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-orange-600"><Puzzle className="w-5 h-5"/>Módulos Faltantes o Incompletos</CardTitle></CardHeader>
                    <CardContent>{renderAnalysisItems(analysisResult.missingModules, 'missing')}</CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-red-600"><Bug className="w-5 h-5"/>Errores y Bugs Potenciales</CardTitle></CardHeader>
                    <CardContent>{renderAnalysisItems(analysisResult.errorsAndBugs, 'bugs')}</CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-blue-600"><Wand2 className="w-5 h-5"/>Sugerencias de Mejora</CardTitle></CardHeader>
                    <CardContent>{renderAnalysisItems(analysisResult.suggestions, 'suggestions')}</CardContent>
                </Card>
            </div>
            
            <Card className="mt-8 bg-amber-50 dark:bg-amber-900/30 border-amber-500/50">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-amber-700 dark:text-amber-300"/>
                        ¿Y ahora qué? ¡Pasemos a la acción!
                    </CardTitle>
                    <CardDescription>
                        Usa estos resultados como una guía para mejorar tu aplicación.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Puedes pedirme directamente en el chat que implemente los cambios sugeridos. Por ejemplo:</p>
                    <ul className="list-disc pl-5 space-y-1 font-mono text-xs bg-muted p-3 rounded-md">
                       <li>"Crea el módulo de Portal del Cliente que falta."</li>
                       <li>"Arregla el bug de precios negativos en las facturas."</li>
                       <li>"Implementa la sugerencia para optimizar la carga de datos de clientes."</li>
                    </ul>
                    <p className="pt-2">Simplemente describe lo que necesitas y yo me encargaré del código.</p>
                </CardContent>
            </Card>
        </div>
      )}

    </div>
  );
}
