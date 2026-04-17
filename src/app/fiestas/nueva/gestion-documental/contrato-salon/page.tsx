'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Printer as PrinterIcon, Edit, CheckCircle2, Save, Loader2, Info, Building2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { CompanyInfo } from '@/types/settings';
import { getFiestaById, updateContratoFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getCompanyInfo, getInvoiceTemplateSettings } from '@/app/actions/settings';
import { WatermarkedImage } from '@/components/watermarked-image';
import { useSearchParams } from 'next/navigation';

const CLUB_URUGUAY_KEYWORDS = ['club uruguay', 'cluburuguay', 'club_uruguay', 'club-uruguay'];

function isClubUruguay(salon?: string): boolean {
  if (!salon) return false;
  const normalized = salon.toLowerCase().trim().replace(/\s+/g, ' ');
  return CLUB_URUGUAY_KEYWORDS.some(kw => normalized.includes(kw));
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '____________';
  try {
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return 'Fecha inválida'; }
};

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return '____________';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
};

const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

function buildSalonContractDraft(data: {
  clienteNombre: string;
  clienteCi: string;
  clienteDomicilio: string;
  clienteTelefono: string;
  fechaEvento: string;
  salon: string;
  tipoEvento: string;
  invitados: number;
  ciudadFecha: string;
}): string {
  return `CONTRATO DE ARRENDAMIENTO DE SALÓN

En la ciudad de ${data.ciudadFecha}, entre Club Uruguay (en adelante "EL SALÓN") y ${data.clienteNombre || '________________________'}, con domicilio en ${data.clienteDomicilio || '________________________'}, cédula de identidad N° ${data.clienteCi || '_______________________'}, número de contacto ${data.clienteTelefono || '_______________________'} (en adelante "EL CLIENTE"), se celebra el presente contrato de arrendamiento de salón para eventos, sujeto a los términos y condiciones siguientes:

PRIMERA: OBJETO
EL SALÓN arrienda a EL CLIENTE el uso del salón ubicado en las instalaciones del Club Uruguay, para la realización de ${data.tipoEvento || '________________________'}, en la fecha ${data.fechaEvento || '____________'}, con una capacidad estimada de ${data.invitados || '____'} invitados.

SEGUNDA: PRECIO Y FORMA DE PAGO
El precio del arrendamiento del salón será el acordado entre las partes y especificado en el presupuesto adjunto. EL CLIENTE abonará una seña al momento de la firma del presente contrato, y el saldo restante deberá abonarse en su totalidad como mínimo treinta (30) días antes de la fecha del evento.

TERCERA: CONDICIONES DE USO
EL CLIENTE se compromete a utilizar el salón exclusivamente para el fin estipulado en la cláusula primera, respetando las normas internas del Club Uruguay, la capacidad máxima habilitada del local y la reglamentación vigente. Queda expresamente prohibido el uso del salón para fines distintos a los acordados sin previa autorización por escrito de EL SALÓN.

CUARTA: HORARIO
El evento comenzará y finalizará en los horarios acordados. Cualquier extensión deberá ser previamente autorizada por EL SALÓN y podrá implicar un costo adicional.

QUINTA: CANCELACIÓN Y CAMBIO DE FECHA
En caso de cancelación por parte de EL CLIENTE, la seña no será reintegrada. Ante solicitud de cambio de fecha, EL CLIENTE deberá notificarlo con al menos 30 días de anticipación, quedando sujeto a disponibilidad del salón y al pago de una multa equivalente al 10% del valor total del arrendamiento.

SEXTA: RESPONSABILIDAD POR DAÑOS
EL CLIENTE será responsable de todo daño o deterioro que se produzca en las instalaciones, mobiliario o equipamiento del salón durante la realización del evento, debiendo reparar o reponer los mismos a su costo.

SÉPTIMA: DISPOSICIONES FINALES
Ambas partes declaran haber leído y aceptado las cláusulas del presente contrato, firmando en señal de conformidad dos (2) ejemplares de idéntico tenor.`;
}

function ContratoSalonContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [contractText, setContractText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClubU, setIsClubU] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError('Falta el ID del evento.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, companyData, settingsData] = await Promise.all([
        getFiestaById(fiestaId),
        getCompanyInfo(),
        getInvoiceTemplateSettings(),
      ]);

      if (!fiestaData) throw new Error('Evento no encontrado.');
      setFiesta(fiestaData);
      setCompanyInfo(companyData);
      setLogoUrl(settingsData.logoUrl || null);

      const salon = fiestaData.configuracion.nombreLugar || '';
      setIsClubU(isClubUruguay(salon));

      if (fiestaData.configuracion.clienteId) {
        const [clienteData, presupuestoData] = await Promise.all([
          getCustomerById(fiestaData.configuracion.clienteId),
          fiestaData.presupuestoId ? getPresupuestoById(fiestaData.presupuestoId) : Promise.resolve(null),
        ]);
        setCliente(clienteData);
        setPresupuesto(presupuestoData);

        const ciudadFecha = `Salto, a los ${today}`;
        const draft = buildSalonContractDraft({
          clienteNombre: clienteData?.name || clienteData?.companyName || '',
          clienteCi: clienteData?.taxId || '',
          clienteDomicilio: clienteData?.address || '',
          clienteTelefono: clienteData?.phone || '',
          fechaEvento: formatDate(fiestaData.configuracion.fechaEvento),
          salon,
          tipoEvento: fiestaData.configuracion.nombreEvento || presupuestoData?.eventoTipo || '',
          invitados: fiestaData.configuracion.invitadosEstimados || presupuestoData?.invitadosCantidad || 0,
          ciudadFecha,
        });
        setContractText(draft);
        setOriginalText(draft);
        await updateContratoFiestaActual(fiestaId, draft, 'salon', 'default-salon');
      } else {
        setError('El evento debe tener un cliente asignado para generar este documento.');
      }
    } catch (err: any) {
      setError('No se pudieron cargar los datos para generar el contrato del salón.');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => window.print();

  const handleToggleEdit = () => {
    if (isEditing && contractText !== originalText) {
      const confirmed = window.confirm('¿Descartar los cambios realizados y salir del modo edición?');
      if (!confirmed) return;
      setContractText(originalText);
    }
    if (!isEditing) {
      setOriginalText(contractText);
    }
    setIsEditing(prev => !prev);
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

  return (
    <div className="bg-gray-100 min-h-screen pb-20 print:bg-white print:pb-0 font-serif">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-white shadow-sm print:hidden sticky top-0 z-50 rounded-b-xl border-x border-b">
          <div className="flex items-center gap-3">
            <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`}>
              <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-lg font-black font-headline tracking-tighter">Borrador: Contrato del Salón</h1>
              <Badge variant="outline" className="text-[9px] font-black tracking-widest">
                {isClubU ? 'CLUB URUGUAY' : (fiesta?.configuracion.nombreLugar || 'SALÓN')}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleToggleEdit} variant={isEditing ? 'default' : 'outline'} size="sm">
              {isEditing ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Finalizar</> : <><Edit className="w-4 h-4 mr-2" /> Editar</>}
            </Button>
            <Button onClick={handlePrint} size="sm" variant="outline">
              <PrinterIcon className="w-4 h-4 mr-1.5" /> PDF
            </Button>
          </div>
        </div>

        {!isClubU && (
          <Alert className="bg-amber-50 border-amber-200 print:hidden">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-bold">Salón no reconocido como Club Uruguay</AlertTitle>
            <AlertDescription className="text-amber-700 text-xs">
              El salón registrado es <strong>{fiesta?.configuracion.nombreLugar || '(sin nombre)'}</strong>. Este borrador usa una plantilla genérica. Si el salón es Club Uruguay, asegurate de que el nombre esté escrito correctamente en la configuración del evento.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white shadow-2xl print:shadow-none p-10 md:p-16 print:p-2 min-h-[1000px] rounded-[2.5rem] border border-slate-100">
          <header className="mb-12 print:mb-8 text-center">
            {logoUrl && (
              <div className="w-full h-24 print:h-20 mb-6 relative">
                <WatermarkedImage src={logoUrl} alt="Marca de agua" containerClassName="w-full h-full" />
              </div>
            )}
            <div className="flex justify-center mb-3">
              <Building2 className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">
              Contrato de Salón
            </h1>
            <p className="text-xs text-slate-400 font-sans tracking-widest uppercase mt-2">Borrador — Documento para revisión</p>
          </header>

          {isEditing ? (
            <div className="space-y-4 print:hidden">
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 font-bold">Modo Edición</AlertTitle>
                <AlertDescription className="text-amber-700 text-xs">
                  Estás editando el borrador del contrato del salón. Podés ajustar cláusulas, montos y condiciones antes de imprimir.
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
              <div className="border-t border-slate-200 pt-4">
                <p className="font-black text-sm uppercase tracking-tighter text-slate-900">Club Uruguay</p>
                <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest">Por el Salón</p>
              </div>
              <div className="border-t border-slate-200 pt-4">
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

export default function ContratoSalonPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <ContratoSalonContent />
    </Suspense>
  );
}
