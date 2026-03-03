
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, Save, Loader2, Edit, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { CompanyInfo } from '@/types/settings';
import { getFiestaById, updateContratoFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getCompanyInfo, getInvoiceTemplateSettings, getContractTemplate } from '@/app/actions/settings';
import { WatermarkedImage } from '@/components/watermarked-image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

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
  const [error, setError] = useState<string | null>(null);

  const missingFields = React.useMemo(() => {
    const missing: string[] = [];
    if (!companyInfo?.companyTaxId || companyInfo.companyTaxId.includes('Ejemplo')) missing.push("RUT de la Empresa");
    if (!companyInfo?.companyAddress || companyInfo.companyAddress.includes('Salto')) missing.push("Dirección de la Empresa");
    if (!cliente?.address) missing.push("Domicilio del Cliente");
    if (!cliente?.taxId) missing.push("Cédula/RUT del Cliente");
    if (!fiesta?.configuracion.fechaEvento) missing.push("Fecha del Evento");
    if (!fiesta?.configuracion.nombreLugar) missing.push("Salón del Evento");
    return missing;
  }, [companyInfo, cliente, fiesta]);

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
      setLogoUrl(settingsData.logoUrl);

      if (fiestaData.configuracion.clienteId && fiestaData.presupuestoId) {
          const [clienteData, presupuestoData] = await Promise.all([
            getCustomerById(fiestaData.configuracion.clienteId),
            getPresupuestoById(fiestaData.presupuestoId)
          ]);
          setCliente(clienteData);
          setPresupuesto(presupuestoData);

          // Priority: 1. Text saved in event, 2. Processed Master Template
          if (fiestaData.contratoServicioTexto) {
              setContractText(fiestaData.contratoServicioTexto);
          } else {
              // Fill placeholders from master template
              let text = masterTemplate;
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
                  '{{PRESUPUESTO_TOTAL}}': formatCurrency(presupuestoData?.totalConDescuento ?? presupuestoData?.costoTotalEstimado)
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
              toast({ title: "¡Contrato Guardado!", description: "Los cambios se mantendrán solo para este evento." });
              setIsEditing(false);
          } else throw new Error(result.error);
      } catch (e: any) {
          toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
      } finally {
          setIsSaving(false);
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
             <Link href={`/fiestas/nueva/configuracion?fiestaId=${fiestaId}`} passHref>
                <Button variant="secondary" className="mt-4">Ir a Configuración</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button></Link>
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "default" : "secondary"} size="sm" disabled={isSaving}>
                {isEditing ? <><CheckCircle2 className="w-4 h-4 mr-2"/> Finalizar Edición</> : <><Edit className="w-4 h-4 mr-2"/> Editar Texto</>}
            </Button>
            {isEditing && (
                <Button onClick={handleSaveForEvent} variant="default" size="sm" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    Guardar en este Evento
                </Button>
            )}
            <Button onClick={handlePrint} size="sm" disabled={missingFields.length > 0 || isEditing || isSaving}>
                <PrinterIcon className="w-4 h-4 mr-1.5" /> Imprimir / PDF
            </Button>
          </div>
        </div>

        {missingFields.length > 0 && !isEditing && (
            <Alert variant="destructive" className="print:hidden">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Faltan datos en el sistema</AlertTitle>
                <AlertDescription>
                    Para un contrato válido, te sugerimos completar: <strong>{missingFields.join(', ')}</strong>.
                    Puedes editarlos en la ficha del cliente o en configuración del evento.
                </AlertDescription>
            </Alert>
        )}

        <div className="bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2 min-h-[1000px]">
            <header className="mb-6 print:mb-4">
                {logoUrl && (
                    <div className="w-full h-24 print:h-20 mb-4 relative">
                        <WatermarkedImage src={logoUrl} alt="Marca de agua" containerClassName='w-full h-full'/>
                    </div>
                )}
            </header>
            
            {isEditing ? (
                <div className="space-y-4 print:hidden">
                    <Label className="text-lg font-bold">Editor Personalizado del Evento</Label>
                    <Textarea 
                        value={contractText} 
                        onChange={(e) => setContractText(e.target.value)} 
                        className="min-h-[800px] font-serif text-base leading-relaxed"
                    />
                </div>
            ) : (
                <div className="prose prose-sm print:prose-xs max-w-none text-justify whitespace-pre-wrap font-serif text-gray-900 print:text-black leading-relaxed">
                    {contractText}
                </div>
            )}

            {!isEditing && (
                <div className="mt-16 flex justify-between text-center print:mt-12">
                    <div className="w-2/5 border-t border-gray-400 pt-2">
                        <p className="font-semibold text-sm">Tec. Alexander Knuth</p>
                        <p className="text-xs">Por la Empresa</p>
                    </div>
                    <div className="w-2/5 border-t border-gray-400 pt-2">
                        <p className="font-semibold text-sm">{cliente?.name || ''}</p>
                        {cliente?.taxId && <p className="text-xs">C.I.: {cliente.taxId}</p>}
                        <p className="text-xs text-muted-foreground mt-1">Por el Cliente</p>
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
            <ContratoServicioContent />
        </Suspense>
    );
}
