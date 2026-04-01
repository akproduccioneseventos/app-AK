
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, Save, Loader2, Edit, CheckCircle2, FileSignature, UploadCloud, FileText, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { CompanyInfo } from '@/types/settings';
import { getFiestaById, updateContratoFiestaActual, uploadPhysicalContract } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getCompanyInfo, getInvoiceTemplateSettings, getContractTemplate } from '@/app/actions/settings';
import { getInvoiceById } from '@/app/actions/invoices';
import { WatermarkedImage } from '@/components/watermarked-image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return '____________';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "____________";
  try {
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

function ContratoServicioContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [contractText, setContractText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
        setError("Falta el ID del evento.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, companyData, settingsData, masterTemplate] = await Promise.all([
        getFiestaById(fiestaId),
        getCompanyInfo(),
        getInvoiceTemplateSettings(),
        getContractTemplate()
      ]);
      
      if (!fiestaData) throw new Error("Evento no encontrado.");
      setFiesta(fiestaData);
      setCompanyInfo(companyData);
      setLogoUrl(settingsData.logoUrl || null);

      if (fiestaData.configuracion.clienteId && fiestaData.presupuestoId) {
          const [clienteData, presupuestoData] = await Promise.all([
            getCustomerById(fiestaData.configuracion.clienteId),
            getPresupuestoById(fiestaData.presupuestoId)
          ]);
          setCliente(clienteData);
          setPresupuesto(presupuestoData);

          if (fiestaData.contratoServicioTexto) {
              setContractText(fiestaData.contratoServicioTexto);
          } else {
              let text = masterTemplate;

              // Resolve seña: use first recorded payment on the linked invoice if available
              let seniaValue = '__________________________';
              if (fiestaData.invoiceIds?.length) {
                try {
                  const invoice = await getInvoiceById(fiestaData.invoiceIds[0]);
                  const firstPayment = invoice?.payments?.[0];
                  if (firstPayment?.amount) {
                    seniaValue = formatCurrency(firstPayment.amount);
                  }
                } catch (err) {
                  console.error('Could not resolve seña from invoice payments:', err);
                  /* seña stays blank */
                }
              }

              const replacements: Record<string, string> = {
                  '{{FECHA_HOY}}': today,
                  '{{EMPRESA_NOMBRE}}': companyData.companyName,
                  '{{EMPRESA_RUT}}': companyData.companyTaxId,
                  '{{EMPRESA_DIRECCION}}': companyData.companyAddress,
                  '{{EMPRESA_EMAIL}}': companyData.companyContact,
                  '{{CLIENTE_NOMBRE}}': clienteData?.name || clienteData?.companyName || '________________________',
                  '{{CLIENTE_DIRECCION}}': clienteData?.address || '________________________',
                  '{{CLIENTE_CI}}': clienteData?.taxId || '_______________________',
                  '{{CLIENTE_TELEFONO}}': clienteData?.phone || '_______________________',
                  '{{EVENTO_FECHA}}': formatDate(fiestaData.configuracion.fechaEvento),
                  '{{EVENTO_SALON}}': fiestaData.configuracion.nombreLugar || '____________',
                  '{{PRESUPUESTO_TOTAL}}': formatCurrency(presupuestoData?.totalConDescuento ?? presupuestoData?.costoTotalEstimado),
                  '{{SENIA}}': seniaValue,
              };

              Object.entries(replacements).forEach(([key, val]) => {
                  text = text.replaceAll(key, val);
              });
              setContractText(text);
          }
      } else {
          setError("El evento debe tener un cliente y un presupuesto asignados para generar este documento.");
      }

    } catch (err: any) {
      setError("No se pudieron cargar todos los datos para generar el contrato.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePrint = () => window.print();

  const handleSaveForEvent = async () => {
      if (!fiestaId) return;
      setIsSaving(true);
      try {
          const result = await updateContratoFiestaActual(fiestaId, contractText);
          if (result.success) {
              toast({ title: "¡Borrador Guardado!", description: "El texto base ha sido actualizado para este evento." });
              setIsEditing(false);
          } else throw new Error(result.error);
      } catch (e: any) {
          toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
      } finally {
          setIsSaving(false);
      }
  };

  const handlePhysicalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !fiestaId) return;
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fiestaId', fiestaId);
      try {
          const result = await uploadPhysicalContract(formData);
          if (result.success) {
              toast({ title: "¡Contrato Físico Cargado!", description: "Se ha registrado la firma física." });
              await loadData();
          } else throw new Error(result.error);
      } catch (e: any) {
          toast({ title: "Error al subir", description: e.message, variant: "destructive" });
      } finally {
          setIsUploading(false);
      }
  };

  if (isLoading) {
    return <div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }
  
  if (error) {
    return (
        <div className="max-w-xl mx-auto mt-10 text-center p-6 border-l-4 border-destructive bg-destructive/10">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />
            <h2 className="font-semibold text-lg text-destructive">Datos Incompletos</h2>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
             <Link href={`/fiestas/nueva/configuracion?fiestaId=${fiestaId}`}>
                <Button variant="secondary" className="mt-4">Ir a Configuración</Button>
            </Link>
        </div>
    );
  }

  const firma = fiesta?.contratoFirmaInfo;

  return (
    <div className="bg-gray-100 min-h-screen pb-20 print:bg-white print:pb-0 font-serif">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* BARRA DE HERRAMIENTAS ADM */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-white shadow-sm print:hidden sticky top-0 z-50 rounded-b-xl border-x border-b">
          <div className="flex items-center gap-3">
            <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`}>
                <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
                <h1 className="text-lg font-black font-headline tracking-tighter">Módulo 4: Firma de Contrato</h1>
                {firma?.isSigned ? (
                    <Badge className={cn("text-[9px] uppercase font-black tracking-widest", 
                        firma.method === 'digital' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    )}>
                        {firma.method === 'digital' ? 'FIRMADO DIGITALMENTE' : 'FIRMADO FÍSICO'}
                    </Badge>
                ) : <Badge variant="outline" className="text-[9px] font-black tracking-widest">PENDIENTE DE FIRMA</Badge>}
            </div>
          </div>

          <div className="flex gap-2">
            {!firma?.isSigned && (
                <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "default" : "outline"} size="sm" disabled={isSaving}>
                    {isEditing ? <><CheckCircle2 className="w-4 h-4 mr-2"/> Finalizar</> : <><Edit className="w-4 h-4 mr-2"/> Editar Legal</>}
                </Button>
            )}
            
            {isEditing && (
                <Button onClick={handleSaveForEvent} variant="default" size="sm" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    Guardar
                </Button>
            )}

            {!isEditing && (
                <div className="flex gap-2">
                    <Label htmlFor="upload-signed" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild disabled={isUploading}>
                            <span>
                                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UploadCloud className="w-4 h-4 mr-2"/>}
                                Cargar Escaneado
                            </span>
                        </Button>
                        <input id="upload-signed" type="file" accept="application/pdf,image/*" className="hidden" onChange={handlePhysicalUpload}/>
                    </Label>
                    <Button onClick={handlePrint} size="sm" variant="outline">
                        <PrinterIcon className="w-4 h-4 mr-1.5" /> PDF
                    </Button>
                </div>
            )}
          </div>
        </div>

        {/* ALERTA DE FIRMA DIGITAL */}
        {firma?.isSigned && (
            <Alert className={cn("border-none shadow-lg rounded-2xl", 
                firma.method === 'digital' ? "bg-green-600 text-white" : "bg-blue-600 text-white"
            )}>
                {firma.method === 'digital' ? <FileSignature className="h-5 w-5 text-white" /> : <CheckCircle2 className="h-5 w-5 text-white" />}
                <AlertTitle className="font-black uppercase tracking-widest text-xs">Contrato Validado</AlertTitle>
                <AlertDescription className="text-sm opacity-90">
                    {firma.method === 'digital' ? (
                        <>Firmado por <strong>{firma.signedBy}</strong> el {new Date(firma.signedAt!).toLocaleString('es-ES')}. <br/>
                        <span className="text-[10px] font-mono opacity-70">Huella Digital (IP): {firma.ip}</span></>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span>Validado mediante carga de documento físico el {new Date(firma.signedAt!).toLocaleString('es-ES')}.</span>
                            {firma.physicalContractUrl && (
                                <Button variant="secondary" size="sm" asChild className="h-7 text-[10px] font-bold">
                                    <a href={firma.physicalContractUrl} target="_blank">VER ESCANEADO</a>
                                </Button>
                            )}
                        </div>
                    )}
                </AlertDescription>
            </Alert>
        )}

        <div className="bg-white shadow-2xl print:shadow-none p-10 md:p-16 print:p-2 min-h-[1000px] rounded-[2.5rem] border border-slate-100">
            <header className="mb-12 print:mb-8 text-center">
                {logoUrl && (
                    <div className="w-full h-24 print:h-20 mb-6 relative">
                        <WatermarkedImage src={logoUrl} alt="Marca de agua" containerClassName='w-full h-full'/>
                    </div>
                )}
                <h1 className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">Contrato de Prestación de Servicios</h1>
                <p className="text-xs text-slate-400 font-sans tracking-widest uppercase mt-2">Documento de Validez Legal</p>
            </header>
            
            {isEditing ? (
                <div className="space-y-4 print:hidden">
                    <Alert className="bg-amber-50 border-amber-200">
                        <Info className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800 font-bold">Modo Edición</AlertTitle>
                        <AlertDescription className="text-amber-700 text-xs">
                            Estás personalizando las cláusulas para este evento. Una vez firmado, no podrás editar este texto.
                        </AlertDescription>
                    </Alert>
                    <Textarea 
                        value={contractText} 
                        onChange={(e) => setContractText(e.target.value)} 
                        className="min-h-[800px] font-serif text-base leading-relaxed p-6 bg-slate-50 border-none rounded-2xl shadow-inner"
                    />
                </div>
            ) : (
                <div className="prose prose-sm print:prose-xs max-w-none text-justify whitespace-pre-wrap font-serif text-slate-800 print:text-black leading-loose text-base md:text-lg">
                    {contractText}
                </div>
            )}

            {!isEditing && (
                <div className="mt-24 grid grid-cols-2 gap-20 text-center print:mt-12">
                    <div className="border-t border-slate-200 pt-4 relative">
                        {companyInfo?.signatureUrl && (
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-16 pointer-events-none">
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
                        <p className="font-black text-sm uppercase tracking-tighter text-slate-900">{cliente?.name || '_________________'}</p>
                        {cliente?.taxId && <p className="text-xs text-slate-500 font-sans">C.I.: {cliente.taxId}</p>}
                        <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest">Por el Cliente</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function ContratoServicioPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}>
            <ContratoServicioPageContent />
        </Suspense>
    );
}

function ContratoServicioPageContent() {
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');
    return <ContratoServicioContent fiestaId={fiestaId} />;
}
