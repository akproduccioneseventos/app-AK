'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileSignature, CheckCircle2, ShieldCheck, Info, AlertTriangle, User, Building2, Calendar, DollarSign, Star, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, signContractDigitally, getContractSigningSummary } from '@/app/actions/fiesta-actual';
import { getCompanyInfo } from '@/app/actions/settings';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { CompanyInfo } from '@/types/settings';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ClientContractPage({ params }: { params: { fiestaId: string } }) {
  const fiestaId = params.fiestaId;
  const { toast } = useToast();
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPlanPagos, setAcceptedPlanPagos] = useState(false);
  const [summary, setSummary] = useState<{
    nombreEvento: string;
    clienteNombre: string;
    salon: string;
    fechaEvento: string;
    totalEstimado: number;
    senia: number;
    saldo: number;
  } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, companyData, summaryData] = await Promise.all([
          getFiestaById(fiestaId),
          getCompanyInfo(),
          getContractSigningSummary(fiestaId),
      ]);
      if (!data) throw new Error("Evento no encontrado");
      setFiesta(data);
      setCompanyInfo(companyData);
      if (summaryData.success && summaryData.summary) {
        setSummary(summaryData.summary);
      }
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
    const planPagos = fiesta.contratoDatos?.planPagos;
    if (planPagos?.activo && !acceptedPlanPagos) return;
    
    setIsSaving(true);
    try {
        const signerName = fiesta.configuracion.nombreEvento.split(' de ')[1] || 'Cliente';
        const result = await signContractDigitally(fiestaId, signerName, acceptedPlanPagos);
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
                      <Link href={`/portal?fiestaId=${fiestaId}`}><Button variant="outline">Volver al Portal</Button></Link>
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
                <Link href={`/portal?fiestaId=${fiestaId}`}>
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

            {/* ── Resumen pre-firma ──────────────────────────── */}
            {!firma?.isSigned && summary && (
              <Card className="border-blue-100 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-black text-blue-800">
                    <Info className="w-5 h-5 text-blue-600" /> Resumen del Contrato
                  </CardTitle>
                  <CardDescription className="text-blue-600 text-xs">Revisá los detalles antes de firmar.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2 p-3 bg-white rounded-xl border border-blue-100">
                      <User className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Evento</p>
                        <p className="font-semibold text-slate-800">{summary.nombreEvento}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-white rounded-xl border border-blue-100">
                      <Building2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Salón</p>
                        <p className="font-semibold text-slate-800">{summary.salon}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-white rounded-xl border border-blue-100">
                      <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Fecha del Evento</p>
                        <p className="font-semibold text-slate-800">{formatDate(summary.fechaEvento)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-white rounded-xl border border-blue-100">
                      <DollarSign className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Monto Total</p>
                        <p className="font-semibold text-slate-800">{summary.totalEstimado > 0 ? formatCurrency(summary.totalEstimado) : 'A definir'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <DollarSign className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Seña al Firmar</p>
                        <p className="font-black text-amber-700">{formatCurrency(summary.senia)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-white rounded-xl border border-blue-100">
                      <DollarSign className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Saldo Restante</p>
                        <p className="font-semibold text-slate-800">{summary.saldo > 0 ? formatCurrency(summary.saldo) : '—'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

                    <div className="mt-20 grid grid-cols-2 gap-10 sm:gap-20 text-center">
                        <div className="border-t border-slate-200 pt-4 relative">
                            {companyInfo?.signatureUrl && (
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-16">
                                    <NextImage src={companyInfo.signatureUrl} alt="Firma Empresa" layout="fill" objectFit="contain" />
                                </div>
                            )}
                            <p className="font-black text-sm uppercase tracking-tighter text-slate-900">Tec. Alexander Knuth</p>
                            <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest">Por la Empresa</p>
                        </div>
                        <div className="border-t border-slate-200 pt-4 relative">
                            {firma?.method === 'digital' && (
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-primary rotate-[-5deg]">
                                    <p className="font-dancing text-3xl font-bold opacity-80">{firma.signedBy}</p>
                                    <p className="text-[8px] font-sans font-black uppercase tracking-tighter -mt-1">Firmado Digitalmente</p>
                                </div>
                            )}
                            <p className="font-black text-sm uppercase tracking-tighter text-slate-900">EL CLIENTE</p>
                            <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest">Firma del Titular</p>
                        </div>
                    </div>
                </CardContent>
                
                {!firma?.isSigned && (
                    <CardFooter className="bg-slate-50 p-8 flex flex-col gap-6 border-t border-slate-100">

                        {/* ── Plan de Pagos ── */}
                        {fiesta.contratoDatos?.planPagos?.activo && (() => {
                          const plan = fiesta.contratoDatos!.planPagos!;
                          const formatMoney = (n: number) =>
                            new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(n);
                          const formatFecha = (iso: string) =>
                            new Date(iso).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' });
                          return (
                            <div className="w-full space-y-4">
                              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-blue-100 rounded-xl">
                                    <Star className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-black text-sm text-blue-800">Plan de Pagos del Contrato</p>
                                    <p className="text-[11px] text-blue-600">Al firmar, te comprometés a cumplir con este plan.</p>
                                  </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                                  <div className="bg-white rounded-xl p-3 border border-blue-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pago mínimo cada 3 meses</p>
                                    <p className="font-bold text-slate-800 mt-0.5">{formatMoney(plan.pagoMinimoTrimestral)}</p>
                                  </div>
                                  <div className="bg-white rounded-xl p-3 border border-amber-100 bg-amber-50">
                                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Antes del {formatFecha(plan.fechaLimite30Porciento)}</p>
                                    <p className="font-black text-amber-700 mt-0.5">{formatMoney(plan.montoObjetivo30Porciento)} ({plan.porcentajeMinimoAntesFecha}% del total)</p>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Cuotas programadas</p>
                                  {plan.cuotas.map(cuota => (
                                    <div
                                      key={cuota.id}
                                      className={cn(
                                        'flex items-center justify-between text-xs p-2.5 rounded-xl border',
                                        cuota.esCuotaClave ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100',
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        {cuota.esCuotaClave
                                          ? <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                          : <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        }
                                        <span className={cn('font-semibold', cuota.esCuotaClave ? 'text-amber-800' : 'text-slate-700')}>
                                          {cuota.descripcion}
                                        </span>
                                      </div>
                                      <div className="text-right shrink-0 ml-2">
                                        <p className={cn('font-bold text-[11px]', cuota.esCuotaClave ? 'text-amber-700' : 'text-slate-600')}>
                                          {cuota.esCuotaClave
                                            ? formatMoney(cuota.montoObjetivo ?? plan.montoObjetivo30Porciento)
                                            : `mín. ${formatMoney(cuota.montoMinimo)}`
                                          }
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                          {formatFecha(cuota.fechaVencimiento)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                                  <p className="font-bold">⚠️ Importante:</p>
                                  <p className="mt-0.5">El {plan.porcentajeMinimoAntesFecha}% acumulado funciona como caución: si cancelás el evento antes de completarlo, ese monto queda retenido como penalidad.</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 leading-relaxed">
                                  ℹ️ Los montos de las cuotas están fijados al precio vigente a la fecha de firma. El saldo final puede estar sujeto al ajuste anual del 15% pactado en la Cláusula 2 del contrato.
                                </div>
                              </div>
                              <div className="flex items-start space-x-3 p-4 bg-white rounded-2xl border border-blue-200 shadow-sm w-full">
                                <Checkbox
                                  id="accept-plan-pagos"
                                  checked={acceptedPlanPagos}
                                  onCheckedChange={(v) => setAcceptedPlanPagos(!!v)}
                                  className="mt-1"
                                />
                                <div className="space-y-1">
                                  <Label htmlFor="accept-plan-pagos" className="font-bold text-blue-800 cursor-pointer">Entiendo y acepto el plan de pagos</Label>
                                  <p className="text-xs text-slate-400">Al marcar esta casilla confirmo que leí y acepto el plan de pagos detallado arriba, incluyendo las fechas límite y montos mínimos.</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

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
                            disabled={!acceptedTerms || isSigning || (!!fiesta.contratoDatos?.planPagos?.activo && !acceptedPlanPagos)}
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
