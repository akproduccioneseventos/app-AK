'use client';

import React, { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UploadCloud, Loader2, FileArchive, Sparkles, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { processHistoricRecord } from '@/app/actions/historicos';
import { extractContractData } from '@/ai/flows/extract-contract-data';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function CargaHistoricosPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [clienteNombre, setClienteNombre] = useState('');
    const [eventoFecha, setEventoFecha] = useState<Date | undefined>(undefined);
    const [montoTotal, setMontoTotal] = useState('');
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [analysisDone, setAnalysisDone] = useState(false);
    const [analysisError, setAnalysisDoneError] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setContractFile(file);
        setAnalysisDone(false);
        setAnalysisDoneError(false);
        setIsAnalyzing(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                try {
                    const data = await extractContractData({ fileDataUri: base64data });
                    if (data) {
                        setClienteNombre(data.clienteNombre || '');
                        if (data.eventoFecha) {
                            const parsedDate = new Date(data.eventoFecha);
                            if (!isNaN(parsedDate.getTime())) {
                                setEventoFecha(parsedDate);
                            }
                        }
                        setMontoTotal(data.montoTotal ? String(data.montoTotal) : '');
                        setAnalysisDone(true);
                        toast({ title: "Documento Analizado", description: "Hemos extraído los datos. Por favor, verifícalos." });
                    }
                } catch (err) {
                    console.error("AI Analysis failed:", err);
                    setAnalysisDoneError(true);
                    toast({ title: "Análisis limitado", description: "No pudimos extraer los datos automáticamente. Completa el formulario manualmente.", variant: "default" });
                } finally {
                    setIsAnalyzing(false);
                }
            };
        } catch (error) {
            setIsAnalyzing(false);
            setAnalysisDoneError(true);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!clienteNombre || !eventoFecha || !montoTotal || !contractFile) {
            toast({ title: "Datos Incompletos", description: "Todos los campos con (*) son obligatorios.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('clienteNombre', clienteNombre);
        formData.append('eventoFecha', eventoFecha.toISOString());
        formData.append('montoTotal', montoTotal);
        formData.append('contractFile', contractFile);

        try {
            const result = await processHistoricRecord(formData);
            if (result.success) {
                toast({ title: "Registro Histórico Completo", description: `Se ha creado toda la estructura para ${clienteNombre}.` });
                router.push('/contabilidad/fiestas-historicas');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error al Procesar", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileArchive className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Carga Automática de Históricos</h1>
                </div>
                <Link href="/contabilidad/fiestas-historicas" passHref>
                    <Button variant="outline" disabled={isSubmitting || isAnalyzing}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                </Link>
            </div>
            
            <Card className="shadow-lg border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Subir Contrato o Presupuesto
                    </CardTitle>
                    <CardDescription>
                        Sube un PDF o imagen. La IA extraerá los datos automáticamente para ahorrarte trabajo.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="p-6 border-2 border-dashed rounded-lg bg-muted/30 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="p-3 bg-primary/10 rounded-full">
                                {isAnalyzing ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <UploadCloud className="w-8 h-8 text-primary" />}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="contractFile" className="text-base font-semibold cursor-pointer hover:text-primary transition-colors">
                                    {contractFile ? contractFile.name : "Selecciona el archivo (PDF o Imagen)"}
                                </Label>
                                <p className="text-xs text-muted-foreground">Límite 10MB</p>
                            </div>
                            <Input 
                                id="contractFile" 
                                type="file" 
                                accept="application/pdf,image/*" 
                                onChange={handleFileChange} 
                                className="hidden" 
                                required 
                                disabled={isSubmitting || isAnalyzing}
                            />
                            <Button type="button" variant="outline" onClick={() => document.getElementById('contractFile')?.click()} disabled={isSubmitting || isAnalyzing}>
                                {contractFile ? 'Cambiar Archivo' : 'Elegir Archivo'}
                            </Button>
                        </div>

                        {isAnalyzing && (
                            <div className="flex items-center gap-2 text-sm text-primary animate-pulse justify-center">
                                <Sparkles className="w-4 h-4" />
                                Analizando documento con IA...
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Verificar Datos
                            </h3>
                            
                            <div className="space-y-2">
                                <Label htmlFor="clienteNombre">Nombre del Cliente / Empresa*</Label>
                                <Input 
                                    id="clienteNombre" 
                                    value={clienteNombre} 
                                    onChange={(e) => setClienteNombre(e.target.value)} 
                                    placeholder="Nombre del cliente..." 
                                    required 
                                    disabled={isSubmitting || isAnalyzing}
                                    className={cn(analysisDone && "border-green-500/50 bg-green-50/10")}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="eventoFecha">Fecha del Evento*</Label>
                                    <DatePickerDemo 
                                        selectedDate={eventoFecha} 
                                        onDateChange={setEventoFecha} 
                                        className={cn(analysisDone && "border-green-500/50")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="montoTotal">Monto Total Final (UYU)*</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                                        <Input 
                                            id="montoTotal" 
                                            type="number" 
                                            value={montoTotal} 
                                            onChange={(e) => setMontoTotal(e.target.value)} 
                                            placeholder="0.00" 
                                            min="0" 
                                            step="any" 
                                            required 
                                            disabled={isSubmitting || isAnalyzing}
                                            className={cn("pl-7", analysisDone && "border-green-500/50 bg-green-50/10")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {analysisDone && (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Análisis Exitoso</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    Verifica que la información extraída sea correcta antes de confirmar.
                                </AlertDescription>
                            </Alert>
                        )}

                        {analysisError && (
                            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Análisis Manual Requerido</AlertTitle>
                                <AlertDescription>
                                    No pudimos extraer todos los datos. Por favor, rellena el formulario manualmente.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting || isAnalyzing || !contractFile}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Generando Sistema Histórico...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Confirmar y Crear Todo
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}