
'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileSignature, CheckCircle2, ShieldCheck, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, signContractDigitally } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function ClientContractPage({ params: paramsPromise }: { params: Promise<{ fiestaId: string }> }) {
  const params = use(paramsPromise);
  const fiestaId = params.fiestaId;
  const { toast } = useToast();
  const router = useRouter();
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFiestaById(fiestaId);
      if (!data) throw new Error("Evento no encontrado");
      setFiesta(data);
    } catch (e) {
      toast({ title: "Error al cargar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSign = async () => {
    if (!acceptedTerms || !fiesta) return;
    
    setIsSaving(true);
    try {
        const signerName = fiesta.configuracion.nombreEvento.split(' de ')[1] || 'Cliente';
        const result = await signContractDigitally(fiestaId, signerName);
        if (result.success) {
            toast({ title: "¡Contrato Firmado!", description: "Se ha registrado tu firma digital con éxito." });
            await loadData();
        } else throw new Error(result.error);
    } catch (e: any) {
        toast({ title: "Error al firmar", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (!fiesta || !fiesta.contratoServicioTexto) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
              <Card className="max-w-md text-center">
                  <CardHeader>
                      <AlertTriangle className="w-12 h-12 mx-auto text-amber-500"/>
                      <CardTitle>Documento no disponible</CardTitle>
                      <CardDescription>El contrato aún no ha sido redactado por el organizador.</CardDescription>
                  </CardHeader>
                  <CardFooter className="justify-center">
                      <Link href={`/portal?fiestaId=${fiestaId}`} passHref><Button variant="outline">Volver al Portal</Button></Link>
                  </CardFooter>
              </Card>
          </div>
      )
  }

  const firma = fiesta.contratoFirmaInfo;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white">
                        <FileSignature className="w-6 h-6"/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 font-headline uppercase">Contrato de Servicio</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revisión y Firma Digital</p>
                    </div>
                </div>
                <Link href={`/portal?fiestaId=${fiestaId}`} passHref>
                    <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5"/></Button>
                </Link>
            </header>

            {firma?.isSigned && (
                <div className="bg-green-600 text-white p-6 rounded-3xl shadow-xl flex items-center gap-4 animate-in fade-in zoom-in duration-500">
                    <div className="p-3 bg-white/20 rounded-2xl">
                        <ShieldCheck className="w-8 h-8 text-white"/>
                    </div>
                    <div>
                        <p className="font-black uppercase tracking-widest text-xs">Documento Firmado y Validado</p>
                        <p className="text-sm opacity-90">
                            {firma.method === 'digital' 
                                ? `Firmado digitalmente el ${new Date(firma.signedAt!).toLocaleString('es-ES')} desde la IP ${firma.ip}`
                                : `Contrato físico registrado el ${new Date(firma.signedAt!).toLocaleString('es-ES')}`
                            }
                        </p>
                    </div>
                </div>
            )}

            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
                    <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-800">Términos y Condiciones</CardTitle>
                    <CardDescription>Por favor, lee atentamente el contrato antes de proceder con la firma.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 md:p-12">
                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-serif whitespace-pre-wrap text-base md:text-lg">
                        {fiesta.contratoServicioTexto}
                    </div>
                </CardContent>
                
                {!firma?.isSigned && (
                    <CardFooter className="bg-slate-50 p-8 flex flex-col gap-6 border-t border-slate-100">
                        <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm w-full">
                            <Checkbox 
                                id="accept-contract" 
                                checked={acceptedTerms} 
                                onCheckedChange={(v) => setAcceptedTerms(!!v)}
                                className="mt-1"
                            />
                            <div className="space-y-1">
                                <Label htmlFor="accept-contract" className="font-bold text-slate-800 cursor-pointer">Acepto los términos y condiciones</Label>
                                <p className="text-xs text-slate-400">Al marcar esta casilla y hacer clic en firmar, declaro mi conformidad con todas las cláusulas expuestas arriba.</p>
                            </div>
                        </div>
                        <Button 
                            onClick={handleSign} 
                            disabled={!acceptedTerms || isSigning}
                            size="lg"
                            className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl shadow-primary/30"
                        >
                            {isSigning ? <Loader2 className="w-5 h-5 mr-3 animate-spin"/> : <FileSignature className="w-5 h-5 mr-3"/>}
                            {isSigning ? 'PROCESANDO FIRMA...' : 'FIRMAR CONTRATO DIGITALMENTE'}
                        </Button>
                        <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
                            Tu firma digital quedará registrada junto con tu IP y marca de tiempo.
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>
    </div>
  );
}
