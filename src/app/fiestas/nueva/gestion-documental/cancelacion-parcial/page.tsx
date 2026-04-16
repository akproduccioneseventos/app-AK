'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, Loader2, Edit, CheckCircle2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { CompanyInfo } from '@/types/settings';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getCompanyInfo } from '@/app/actions/settings';
import { uploadDocumentoFiesta } from '@/app/actions/fiesta-actual';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '$ -';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '____________';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '____________';
  }
};

const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const MAX_PREVIEW_SERVICES_COUNT = 3;
const PARTIAL_CANCELLATION_PENALTY_RATE = 0.1;

const buildCancelacionParcialText = (params: {
  companyName: string;
  clienteNombre: string;
  clienteCi?: string;
  fechaEvento?: string;
  fechaContrato?: string;
  servicios: string;
  ajusteTotal: number;
}) => `En la ciudad de Salto, a los ${today}, comparecen ${params.companyName} y el/la Sr./Sra. ${params.clienteNombre}, cédula de identidad N° ${params.clienteCi || '_______________________'}, quienes acuerdan la cancelación parcial de servicios del contrato celebrado con fecha ${formatDate(params.fechaContrato)} para el evento del día ${formatDate(params.fechaEvento)}.

SERVICIOS CANCELADOS:
${params.servicios}

AJUSTE ECONÓMICO:
Como consecuencia de la cancelación parcial, el ajuste al total del presupuesto vigente se fija en ${formatCurrency(params.ajusteTotal)}.

CONDICIONES:
1) Las partes mantienen plenamente vigente el contrato principal para los servicios no cancelados.
2) Toda devolución o saldo pendiente se liquidará conforme a las cláusulas contractuales y dentro de los plazos acordados.
3) Cualquier nueva modificación deberá documentarse por escrito.

En señal de conformidad, se firma la presente constancia en dos ejemplares del mismo tenor.`;

function CancelacionParcialContent({ fiestaId }: { fiestaId: string | null }) {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [contractText, setContractText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError('Falta el ID del evento.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, companyData] = await Promise.all([getFiestaById(fiestaId), getCompanyInfo()]);
      if (!fiestaData || !fiestaData.configuracion.clienteId || !fiestaData.presupuestoId) {
        throw new Error('El evento debe tener cliente y presupuesto asignados.');
      }
      const [clienteData, presupuestoData] = await Promise.all([
        getCustomerById(fiestaData.configuracion.clienteId),
        getPresupuestoById(fiestaData.presupuestoId),
      ]);
      const servicios = (presupuestoData?.itemsPresupuestados || [])
        .slice(0, MAX_PREVIEW_SERVICES_COUNT)
        .map((i) => `- ${i.nombreServicio}`)
        .join('\n') || '- ________________________';
      const ajuste = Math.round((presupuestoData?.totalConDescuento ?? presupuestoData?.costoTotalEstimado ?? 0) * PARTIAL_CANCELLATION_PENALTY_RATE);
      setFiesta(fiestaData);
      setCliente(clienteData);
      setPresupuesto(presupuestoData);
      setCompanyInfo(companyData);
      setContractText(buildCancelacionParcialText({
        companyName: companyData.companyName,
        clienteNombre: clienteData?.name || clienteData?.companyName || '________________________',
        clienteCi: clienteData?.taxId,
        fechaEvento: fiestaData.configuracion.fechaEvento,
        fechaContrato: presupuestoData?.timestamp,
        servicios,
        ajusteTotal: ajuste,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los datos.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => window.print();

  const handleSaveToHistory = async () => {
    if (!fiestaId) return;
    setIsSavingHistory(true);
    try {
      const file = new File([contractText], `cancelacion_parcial_${fiestaId}.txt`, { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', 'cancelacion-parcial');
      formData.append('customName', `Contrato cancelación parcial - ${today}`);
      formData.append('fiestaId', fiestaId);
      const result = await uploadDocumentoFiesta(formData);
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Documento guardado', description: 'Se guardó en el historial de documentos.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast({ title: 'Error al guardar', description: message, variant: 'destructive' });
    } finally {
      setIsSavingHistory(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Constancia de Cancelación Parcial - ${fiesta?.configuracion.nombreEvento || ''}`,
      text: 'Documento de cancelación parcial de servicios.',
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) await navigator.share(shareData);
      else throw new Error();
    } catch {
      navigator.clipboard.writeText(shareData.url);
      toast({ title: 'Enlace copiado', description: 'El enlace fue copiado al portapapeles.' });
    }
  };

  if (isLoading) return <div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;

  if (error || !fiesta || !cliente || !presupuesto || !companyInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Error al Generar Documento</h1>
        <p className="text-muted-foreground mt-2">{error || 'No se encontró información necesaria.'}</p>
        <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`}>
          <Button variant="outline" className="mt-4">Volver</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`}><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button></Link>
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'default' : 'outline'} size="sm">
              {isEditing ? <><CheckCircle2 className="w-4 h-4 mr-1.5" />Finalizar</> : <><Edit className="w-4 h-4 mr-1.5" />Editar</>}
            </Button>
            <Button onClick={handleSaveToHistory} variant="outline" size="sm" disabled={isSavingHistory}>
              {isSavingHistory ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              Guardar
            </Button>
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5" />Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-4">
          <h1 className="text-xl font-bold text-center">CONSTANCIA DE CANCELACIÓN PARCIAL DE SERVICIOS</h1>
        </header>

        {isEditing ? (
          <Textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            className="min-h-[520px] font-serif text-sm leading-relaxed p-4"
          />
        ) : (
          <div className="prose prose-sm print:prose-xs max-w-none text-justify whitespace-pre-wrap">
            {contractText}
          </div>
        )}

        <div className="mt-16 flex justify-between text-center">
          <div className="w-2/5 border-t border-gray-400 pt-2">
            <p className="font-semibold">{companyInfo.companyName}</p>
            <p className="text-xs">Firma: __________________________</p>
          </div>
          <div className="w-2/5 border-t border-gray-400 pt-2">
            <p className="font-semibold">{cliente.name || ''}</p>
            <p className="text-xs">Firma: __________________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CancelacionParcialPage() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <CancelacionParcialContent fiestaId={fiestaId} />
    </Suspense>
  );
}
