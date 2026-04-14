'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle, FileText as FileTextIcon, CalendarDays, Users, MapPin, Share2, Gift, ClipboardCopy, TrendingUp, Info, CalendarDays as CalendarIcon, PartyPopper, CheckCircle2, MessageSquare, PlusCircle, Trash2, CreditCard, Receipt, Clock, FileSignature, ExternalLink, ShieldCheck, ShieldAlert, Upload, ImageIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import type { Presupuesto, ItemPresupuestado, PagoCliente, MetodoPago } from '@/types/presupuesto';
import { ALL_METODOS_PAGO } from '@/types/presupuesto';
import { getPresupuestoById, addPagoToPresupuesto, deletePagoFromPresupuesto, createFiestaFromPresupuesto, approvePresupuesto, addPagoClienteFromPortal } from '@/app/actions/presupuestos';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getCustomerById } from '@/app/actions/customers';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { Customer } from '@/types/customer';
import type { BudgetDisplaySettings, CompanyInfo } from '@/types/settings';
import { getBudgetDisplaySettings, getInvoiceTemplateSettings, getCompanyInfo } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch (e) { return 'Inválida'; }
};

const COMPANY_MAIN_TITLE = "Presupuesto para fiestas o eventos - AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_ADDRESS_LINE2_PDF = "50000 Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE_PDF = "www.akproduccioneseventos.com";
const BUDGET_VALIDITY_DAYS_PDF = 30;
const BUDGET_VALIDITY_NOTE_PDF = "El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.";

const formatDateShort = (dateString?: string) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  } catch { return '—'; }
};

/** Generate annual price projection rows */
function generateProjectionRows(totalBase: number, adjustmentPct: number, currentYear: number, eventYear: number): { year: number; base: number; adjustment: number; total: number }[] {
  const rows: { year: number; base: number; adjustment: number; total: number }[] = [];
  const maxYears = 4;
  const yearsToShow = Math.min(Math.max(0, eventYear - currentYear), maxYears);

  if (yearsToShow <= 0) return rows;

  rows.push({ year: currentYear, base: totalBase, adjustment: 0, total: totalBase });

  let prevTotal = totalBase;
  for (let i = 1; i <= yearsToShow; i++) {
    const adj = Math.round(prevTotal * (adjustmentPct / 100));
    const newTotal = prevTotal + adj;
    rows.push({ year: currentYear + i, base: Math.round(prevTotal), adjustment: adj, total: newTotal });
    prevTotal = newTotal;
  }

  return rows;
}

function VerPresupuestoContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const presupuestoId = params.id;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatingFiesta, setIsCreatingFiesta] = useState(false);
  const [linkedFiestaId, setLinkedFiestaId] = useState<string | null>(null);

  // Sanity Check / Verification state
  const [isApprovingPresupuesto, setIsApprovingPresupuesto] = useState(false);

  // Payment management state
  const [isAddingPago, setIsAddingPago] = useState(false);
  const [isSavingPago, setIsSavingPago] = useState(false);
  const [isDeletingPagoId, setIsDeletingPagoId] = useState<string | null>(null);
  const [newPagoFecha, setNewPagoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [newPagoMonto, setNewPagoMonto] = useState('');
  const [newPagoMetodo, setNewPagoMetodo] = useState<MetodoPago>('Efectivo');
  const [newPagoReferencia, setNewPagoReferencia] = useState('');

  // Client payment notification state
  const [isInformingPago, setIsInformingPago] = useState(false);
  const [isSavingClientPago, setIsSavingClientPago] = useState(false);
  const [clientPagoMonto, setClientPagoMonto] = useState('');
  const [clientPagoMetodo, setClientPagoMetodo] = useState<MetodoPago>('Transferencia Bancaria');
  const [clientPagoReferencia, setClientPagoReferencia] = useState('');
  const [clientPagoComprobante, setClientPagoComprobante] = useState<string | undefined>(undefined);

  const fetchPresupuestoAndSettings = useCallback(async () => {
    if (!presupuestoId) return;
    setIsLoading(true);
    try {
      const [fetchedPresupuesto, fetchedSettings, templateSettings, socialConnections, fetchedCompanyInfo] = await Promise.all([
        getPresupuestoById(presupuestoId),
        getBudgetDisplaySettings(),
        getInvoiceTemplateSettings(),
        getSocialConnections(),
        getCompanyInfo()
      ]);
      setDisplaySettings(fetchedSettings);
      setCompanyInfo(fetchedCompanyInfo);
      setLogoUrl(templateSettings.logoUrl || null);
      
      const whatsappConnection = socialConnections.find(c => c.platform === 'WhatsApp' && c.isConnected);
      if (whatsappConnection?.phoneNumber) {
          setWhatsappNumber(whatsappConnection.phoneNumber);
      }

      if (fetchedPresupuesto) {
        setPresupuesto(fetchedPresupuesto);
        if ((fetchedPresupuesto as any).clienteId) {
            const clienteData = await getCustomerById((fetchedPresupuesto as any).clienteId);
            setCliente(clienteData);
        }
        // Check if a fiesta already exists for this budget
        try {
          const fiestas = await getFiestas(false);
          const linked = fiestas.find(f => f.presupuestoId === fetchedPresupuesto.id);
          if (linked) setLinkedFiestaId(linked.id);
        } catch (_) { /* non-critical */ }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [presupuestoId, toast]);

  useEffect(() => { fetchPresupuestoAndSettings(); }, [fetchPresupuestoAndSettings]);

  const calculatedValues = useMemo(() => {
    if (!presupuesto) return { itemsAgrupados: {}, totalFinal: 0, subtotalBruto: 0, ahorroRegalos: 0, bonificacionPromo: 0, ajusteAnual: 0, aniosDiferencia: 0 };
  
    const adultos = presupuesto.invitadosAdultos || 0;
    const ninos = (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0);

    const itemsRecalculados = presupuesto.itemsPresupuestados.map(item => ({
        ...item,
        costoTotalItem: recalcularCostoItem(item, adultos, 0, ninos)
    }));

    const brutoVenta = itemsRecalculados.filter(i => !i.esRegalo).reduce((sum, i) => sum + i.costoTotalItem, 0);
    const regalosVal = itemsRecalculados.filter(i => i.esRegalo).reduce((sum, i) => {
        const itemNormal = { ...i, esRegalo: false, precioUnitarioPresupuesto: i.precioUnitario };
        return sum + recalcularCostoItem(itemNormal, adultos, 0, ninos);
    }, 0);

    let bonificacion = 0;
    if (presupuesto.descuentoTipo === 'porcentaje') bonificacion = (brutoVenta * (presupuesto.descuentoValor || 0)) / 100;
    else if (presupuesto.descuentoTipo === 'fijo') bonificacion = presupuesto.descuentoValor || 0;

    const totalSinAjuste = brutoVenta - bonificacion;
    
    let ajuste = 0;
    let anios = 0;
    if (presupuesto.eventoFecha) {
        const anioCreacion = new Date(presupuesto.timestamp).getFullYear();
        const anioEvento = new Date(presupuesto.eventoFecha).getFullYear();
        anios = Math.max(0, anioEvento - anioCreacion);
        if (anios > 0) ajuste = totalSinAjuste * (Math.pow(1.15, anios) - 1);
    }

    const agrupados = itemsRecalculados.reduce((acc, item) => {
      const cat = item.esRegalo ? 'Regalos Incluidos' : (item.categoriaServicio || 'Otros');
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const sortedCategories = Object.keys(agrupados).sort((a, b) => {
        if (a === 'Regalos Incluidos') return 1;
        if (b === 'Regalos Incluidos') return -1;
        return a.localeCompare(b);
    });

    const sortedAgrupados: Record<string, any[]> = {};
    sortedCategories.forEach(key => sortedAgrupados[key] = agrupados[key]);

    return {
      itemsAgrupados: sortedAgrupados,
      subtotalBruto: brutoVenta + regalosVal,
      ahorroRegalos: Math.round(regalosVal),
      bonificacionPromo: Math.round(bonificacion),
      ajusteAnual: Math.round(ajuste),
      totalFinal: Math.round(totalSinAjuste + ajuste),
      aniosDiferencia: anios
    };
  }, [presupuesto]);

  const handlePrint = () => window.print();

  const handleWhatsAppMeetingRequest = () => {
    if (!whatsappNumber || !presupuesto || !displaySettings) return;
    const template = displaySettings.whatsappMessageTemplate || "Hola, ya revisé el presupuesto y me gustaría coordinar una reunión.";
    let texto = `*Solicitud de Reunión - Presupuesto #${presupuesto.numero || 'Generado'}*\n`;
    texto += `-----------------\n`;
    texto += `${template}\n\n`;
    texto += `*Presupuesto Estimado:* ${formatCurrency(calculatedValues.totalFinal)}\n`;
    texto += `*Link:* ${window.location.href}`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const handleWhatsAppDirectContact = () => {
    if (!whatsappNumber || !presupuesto) return;
    const text = `¡Hola! Estoy revisando el presupuesto #${presupuesto.numero || ''} y tengo una consulta.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const pagosSummary = useMemo(() => {
    if (!presupuesto) return { totalPagado: 0, saldoPendiente: 0, totalCosto: 0 };
    const totalCosto = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
    const confirmedPagos = (presupuesto.pagosCliente || []).filter(p => p.estadoPago !== 'pendiente_confirmacion');
    const totalPagado = confirmedPagos.reduce((sum, p) => sum + p.monto, 0);
    return { totalCosto, totalPagado, saldoPendiente: totalCosto - totalPagado };
  }, [presupuesto]);

  const handleAddPago = async () => {
    const monto = parseFloat(newPagoMonto);
    if (!presupuesto || isNaN(monto) || monto <= 0) {
      toast({ title: 'Error', description: 'Ingresá un monto válido mayor a 0.', variant: 'destructive' });
      return;
    }
    setIsSavingPago(true);
    try {
      const result = await addPagoToPresupuesto(presupuesto.id, {
        fecha: `${newPagoFecha}T12:00:00.000Z`,
        monto,
        metodoPago: newPagoMetodo,
        referencia: newPagoReferencia.trim() || undefined,
      });
      if (!result.success) throw new Error(result.error);
      setPresupuesto(result.presupuesto!);
      setNewPagoMonto('');
      setNewPagoReferencia('');
      setNewPagoFecha(new Date().toISOString().split('T')[0]);
      setIsAddingPago(false);
      toast({ title: 'Pago registrado', description: `${formatCurrency(monto)} guardado correctamente.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSavingPago(false);
    }
  };

  const handleDeletePago = async (pagoId: string) => {
    if (!presupuesto) return;
    setIsDeletingPagoId(pagoId);
    try {
      const result = await deletePagoFromPresupuesto(presupuesto.id, pagoId);
      if (!result.success) throw new Error(result.error);
      setPresupuesto(result.presupuesto!);
      toast({ title: 'Pago eliminado' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeletingPagoId(null);
    }
  };

  const handleClientPagoSubmit = async () => {
    const monto = parseFloat(clientPagoMonto);
    if (!presupuesto || isNaN(monto) || monto <= 0) {
      toast({ title: 'Error', description: 'Ingresá un monto válido mayor a 0.', variant: 'destructive' });
      return;
    }
    setIsSavingClientPago(true);
    try {
      const result = await addPagoClienteFromPortal(presupuesto.id, {
        fecha: new Date().toISOString(),
        monto,
        metodoPago: clientPagoMetodo,
        referencia: clientPagoReferencia.trim() || undefined,
        comprobanteUrl: clientPagoComprobante,
      });
      if (!result.success) throw new Error(result.error);
      setPresupuesto(result.presupuesto!);
      setClientPagoMonto('');
      setClientPagoReferencia('');
      setClientPagoComprobante(undefined);
      setIsInformingPago(false);
      toast({ title: '✅ Pago informado', description: 'Tu pago fue enviado para confirmación. Te notificaremos cuando sea aprobado.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSavingClientPago(false);
    }
  };

  const handleComprobanteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Archivo muy grande', description: 'El comprobante no debe pesar más de 2MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setClientPagoComprobante(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCrearFiesta = async () => {
    if (!presupuesto) return;
    setIsCreatingFiesta(true);
    try {
      const result = await createFiestaFromPresupuesto(presupuesto.id);
      if (!result.success) throw new Error(result.error);
      setLinkedFiestaId(result.fiestaId || null);
      toast({ title: '¡Fiesta/Evento creado!', description: 'Podés planificarlo ahora.' });
      if (result.fiestaId) router.push(`/fiestas/nueva?fiestaId=${result.fiestaId}`);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsCreatingFiesta(false);
    }
  };

  const handleApprovePresupuesto = async () => {
    if (!presupuesto) return;
    setIsApprovingPresupuesto(true);
    try {
      const result = await approvePresupuesto(presupuesto.id);
      if (!result.success) throw new Error(result.error);
      setPresupuesto(prev => prev ? { ...prev, estado: 'Enviado' } : prev);
      toast({ title: '✅ Presupuesto verificado', description: 'El presupuesto ya está disponible para compartir con el cliente.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsApprovingPresupuesto(false);
    }
  };

  const getEffectiveQty = (item: any): number => {
    if (!presupuesto) return item.cantidad || 1;
    const adults = presupuesto.invitadosAdultos || 0;
    const kids = (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0);
    const targetGuests = getGuestCountForItem(item, adults, 0, kids);
    
    if (item.calculationMethod === 'ratio' && item.invitadosPorUnidad) {
        return Math.ceil(targetGuests / item.invitadosPorUnidad);
    }
    if (item.calculationMethod === 'porPersona') {
        return targetGuests;
    }
    if (item.calculationMethod === 'tramos') {
        return 1;
    }
    return item.cantidad || 1;
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (!presupuesto) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
      <p className="text-4xl">🗂️</p>
      <h2 className="text-2xl font-bold">Presupuesto no encontrado</h2>
      <p className="text-muted-foreground max-w-sm">
        Este presupuesto fue eliminado o archivado. Si lo archivaste, podés encontrarlo en el listado con el filtro de archivados.
      </p>
      <Link href="/presupuestos/nuevo"><Button variant="outline" className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4"/>Volver a Presupuestos</Button></Link>
    </div>
  );
  if (!displaySettings) return null;

  const totalInvitados = (presupuesto.invitadosAdultos || 0) + (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0) || presupuesto.invitadosCantidad || 0;

  return (
    <div className="bg-gray-100 min-h-screen py-6 print:bg-white print:py-0 font-sans">
        {/* ── QUICK ACTION BAR ────────────────────────────────── */}
        <div className="print:hidden max-w-3xl mx-auto px-4 mb-4">
          <div className="bg-white rounded-2xl shadow-md px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link href="/presupuestos/nuevo">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5"/>Volver
                </Button>
              </Link>
              <PresupuestoStatusBadge status={presupuesto.estado} className="text-sm px-3 py-1.5 font-bold" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/presupuestos/${presupuestoId}/edit`}>
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest">
                  <Edit className="mr-1.5 h-3.5 w-3.5"/>Editar
                </Button>
              </Link>
              <Link href="/pagos-rapidos">
                <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest">
                  <CreditCard className="mr-1.5 h-3.5 w-3.5"/>Registrar Pago
                </Button>
              </Link>
              <Link href={`/presupuestos/${presupuestoId}/recibo-contrato`}>
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest">
                  <FileSignature className="mr-1.5 h-3.5 w-3.5"/>Ver Contrato
                </Button>
              </Link>
              {(cliente?.phone || whatsappNumber) && (() => {
                const phone = cliente?.phone?.replace(/\D/g, '') || whatsappNumber;
                const text = `Hola ${presupuesto.clienteNombre}, te contactamos sobre el presupuesto #${presupuesto.numero || presupuesto.id.substring(0, 6).toUpperCase()}.`;
                return (
                  <a href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/5">
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5"/>WhatsApp
                    </Button>
                  </a>
                );
              })()}
              <Button onClick={handlePrint} size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest" variant="secondary">
                <Printer className="mr-1.5 h-3.5 w-3.5"/>Imprimir
              </Button>
              <Link href={`/presupuestos/${presupuestoId}/estado-de-cuenta`}>
                <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest">
                  <Receipt className="mr-1.5 h-3.5 w-3.5"/>Estado de Cuenta
                </Button>
              </Link>
              {linkedFiestaId ? (
                <Link href={`/fiestas/nueva?fiestaId=${linkedFiestaId}`}>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs border-violet-200 text-violet-700 hover:bg-violet-50 font-bold uppercase tracking-widest" data-testid="btn-ver-fiesta">
                    <PartyPopper className="mr-1.5 h-3.5 w-3.5"/>Ver Fiesta
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={handleCrearFiesta}
                  disabled={isCreatingFiesta}
                  className="rounded-xl text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold uppercase tracking-widest"
                  data-testid="btn-crear-fiesta-from-budget"
                >
                  {isCreatingFiesta ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <PartyPopper className="mr-1.5 h-3.5 w-3.5"/>}
                  Crear Fiesta
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── FINANCIAL KPI SUMMARY ──────────────────────────── */}
        <div className="print:hidden max-w-3xl mx-auto px-4 mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex flex-col items-center text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total presupuesto</p>
              <p className="text-lg font-black text-slate-900">{formatCurrency(pagosSummary.totalCosto)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex flex-col items-center text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1">Monto pagado</p>
              <p className="text-lg font-black text-emerald-700">{formatCurrency(pagosSummary.totalPagado)}</p>
            </div>
            <div className={`rounded-2xl shadow-sm px-4 py-3 flex flex-col items-center text-center ${pagosSummary.saldoPendiente > 0 ? 'bg-amber-50' : 'bg-white'}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${pagosSummary.saldoPendiente > 0 ? 'text-amber-500' : 'text-slate-400'}`}>Saldo pendiente</p>
              <p className={`text-lg font-black ${pagosSummary.saldoPendiente > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                {formatCurrency(Math.max(0, pagosSummary.saldoPendiente))}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-8 px-2 sm:px-4 print:px-0">

            {/* SANITY CHECK BANNER — shown when estado is 'Pendiente Verificación' */}
            {presupuesto.estado === 'Pendiente Verificación' && (
              <div className="print:hidden bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg text-white">
                <div className="flex items-center gap-3 flex-1">
                  <ShieldAlert className="w-8 h-8 shrink-0 text-white" />
                  <div>
                    <p className="font-black text-base">⏳ Verificación Pendiente</p>
                    <p className="text-sm text-white/80">
                      Este presupuesto fue generado por el simulador y requiere tu aprobación antes de ser compartido con el cliente.
                    </p>
                    <div className="mt-2 space-y-0.5 text-xs text-white/70">
                      <p>✔ Total: <strong className="text-white">{new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado)}</strong></p>
                      <p>✔ Items: <strong className="text-white">{presupuesto.itemsPresupuestados.length} servicio(s)</strong></p>
                      {presupuesto.descuentoValor && presupuesto.descuentoValor > 0 && (
                        <p>✔ Descuento: <strong className="text-white">{presupuesto.descuentoTipo === 'porcentaje' ? `${presupuesto.descuentoValor}%` : new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(presupuesto.descuentoValor)}</strong></p>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleApprovePresupuesto}
                  disabled={isApprovingPresupuesto}
                  className="shrink-0 bg-white text-orange-600 hover:bg-white/90 font-black rounded-xl h-12 px-6 shadow-md"
                >
                  {isApprovingPresupuesto ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 mr-2" />
                  )}
                  Aprobar y Habilitar
                </Button>
              </div>
            )}
            
            {/* SECCIÓN VENTA PRO */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
                <Card className="border-none shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-6 sm:p-12 flex flex-col items-center text-center space-y-8">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <PartyPopper className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-bounce"/>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl sm:text-4xl font-black font-headline tracking-tighter text-slate-900 uppercase">
                                ¡Tu presupuesto está listo!
                            </h2>
                            <p className="text-sm sm:text-lg text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                                {displaySettings.successMessage}
                            </p>
                        </div>
                        
                        <div className="w-full flex flex-col items-center gap-4 sm:gap-6">
                            <div className="w-full flex flex-col gap-3 items-center">
                                <Button 
                                    onClick={handleWhatsAppMeetingRequest}
                                    size="lg" 
                                    className="w-full max-w-md h-16 sm:h-20 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-2xl shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-95 px-4"
                                >
                                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 shrink-0"/> 
                                    <span className="text-[10px] xs:text-sm sm:text-lg uppercase leading-tight">AGENDAR REUNIÓN CON UN ASESOR</span>
                                </Button>

                                <Button 
                                    variant="outline"
                                    onClick={handleWhatsAppDirectContact}
                                    className="w-full max-w-sm h-12 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs uppercase tracking-widest shadow-sm"
                                >
                                    <MessageSquare className="w-4 h-4 mr-2"/> Consultar por WhatsApp
                                </Button>
                            </div>

                            {(displaySettings.valuePropositions?.length || 0) > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                                    {displaySettings.valuePropositions?.map((prop, i) => (
                                        <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>
                                            <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600">{prop}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="flex flex-wrap justify-center gap-2">
                                <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({title: "Enlace Copiado"}); }} className="h-10 rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                    <Share2 className="w-3.5 h-3.5 mr-2"/> Compartir Presupuesto
                                </Button>
                                <Button variant="ghost" onClick={() => window.print()} className="h-10 rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                    <Printer className="w-3.5 h-3.5 mr-2"/> Guardar PDF
                                </Button>
                            </div>
                            {/* Canva catalog contextual link */}
                            {presupuesto && (() => {
                              const tipo = (presupuesto.eventoTipo || '').toLowerCase();
                              const isBoda = tipo.includes('boda') || tipo.includes('casamiento');
                              const isXV = tipo.includes('xv') || tipo.includes('quince');
                              const isCatering = tipo.includes('catering');
                              const canvaUrl = isBoda
                                ? 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-bodas'
                                : isXV
                                ? 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-xv-a-os-sitio-web'
                                : 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web';
                              const emoji = isBoda ? '💍' : isXV ? '👑' : '🎉';
                              const label = isBoda ? 'Ver Catálogo Bodas' : isXV ? 'Ver Catálogo XV Años' : 'Ver Catálogo Fiestas';
                              return (
                                <a href={canvaUrl} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-primary border-primary/20 hover:bg-primary/5 text-[11px] font-bold uppercase tracking-widest">
                                    <ExternalLink className="w-3.5 h-3.5" />{emoji} {label}
                                  </Button>
                                </a>
                              );
                            })()}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── INFORMAR PAGO — Client-facing payment notification ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="print:hidden">
                <Card className="border-none shadow-xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-6 sm:p-10">
                        {!isInformingPago ? (
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-3 bg-emerald-50 rounded-full">
                                    <Upload className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">¿Ya realizaste un pago?</h3>
                                    <p className="text-xs text-slate-500 font-medium">Informalo para que quede registrado y te enviemos el recibo.</p>
                                </div>
                                <Button
                                    onClick={() => setIsInformingPago(true)}
                                    className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/20"
                                >
                                    <Upload className="w-5 h-5 mr-2" /> Informar Pago / Subir Comprobante
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Upload className="w-5 h-5 text-emerald-600" />
                                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Informar Pago</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Monto pagado *</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={clientPagoMonto}
                                            onChange={(e) => setClientPagoMonto(e.target.value)}
                                            className="h-12 rounded-xl text-lg font-black text-center"
                                            min="0"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Método de pago *</Label>
                                        <Select value={clientPagoMetodo} onValueChange={(v) => setClientPagoMetodo(v as MetodoPago)}>
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_METODOS_PAGO.map(m => (
                                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Referencia / Nota (opcional)</Label>
                                    <Input
                                        placeholder="N° de transferencia, nota..."
                                        value={clientPagoReferencia}
                                        onChange={(e) => setClientPagoReferencia(e.target.value)}
                                        className="h-10 rounded-xl text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Comprobante (opcional)</Label>
                                    <div className="flex items-center gap-3">
                                        <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-emerald-300 transition-all">
                                            <ImageIcon className="w-5 h-5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                {clientPagoComprobante ? '✅ Imagen cargada' : 'Subir foto del comprobante'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleComprobanteUpload}
                                            />
                                        </label>
                                        {clientPagoComprobante && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setClientPagoComprobante(undefined)}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                            >
                                                Quitar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-xl"
                                        onClick={() => { setIsInformingPago(false); setClientPagoMonto(''); setClientPagoReferencia(''); setClientPagoComprobante(undefined); }}
                                        disabled={isSavingClientPago}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleClientPagoSubmit}
                                        disabled={isSavingClientPago || !clientPagoMonto}
                                        className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs"
                                    >
                                        {isSavingClientPago ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                        Enviar Pago
                                    </Button>
                                </div>
                                <p className="text-[10px] text-center text-slate-400">
                                    Tu pago quedará pendiente de confirmación por el administrador.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* ═══ PRINTABLE DOCUMENT — Classic Invoice Format ═══ */}
            <div className="ver-budget-print-document bg-white print:bg-[#e8f5e9]">
              {/* Wrapping table for repeating thead/tfoot on each print page */}
              <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
                <thead>
                  <tr><td className="p-0">
                    <div className="budget-print-thead-content" style={{ padding: '0 0 4px 0' }}>
                      <p className="text-[8px] text-gray-500 text-center print:text-[7pt]">
                        {presupuesto.clienteNombre} — Presupuesto #{presupuesto.numero || presupuesto.id.substring(0, 6).toUpperCase()} — {formatDateShort(presupuesto.timestamp)}
                      </p>
                    </div>
                  </td></tr>
                </thead>
                <tfoot>
                  <tr><td className="p-0">
                    <div className="budget-print-tfoot-content" style={{ paddingTop: '20px' }}>
                      <div className="flex justify-between" style={{ gap: '40px' }}>
                        <div className="text-center flex-1" style={{ borderTop: '1px solid #666', paddingTop: '6px' }}>
                          <p className="text-[9px] text-gray-700 font-semibold print:text-[7pt]">Firma del Cliente</p>
                          <p className="text-[8px] text-gray-500 print:text-[6pt]">{cliente?.name || presupuesto.clienteNombre}</p>
                        </div>
                        <div className="text-center flex-1" style={{ borderTop: '1px solid #666', paddingTop: '6px' }}>
                          <p className="text-[9px] text-gray-700 font-semibold print:text-[7pt]">Firma y sello de la empresa</p>
                          <p className="text-[8px] text-gray-500 print:text-[6pt]">AK PRODUCCIONES</p>
                        </div>
                      </div>
                    </div>
                  </td></tr>
                </tfoot>
                <tbody>
                  <tr><td className="p-0">

              <div className="shadow-xl print:shadow-none p-6 sm:p-16 print:p-2 rounded-[2rem] sm:rounded-[2.5rem] print:rounded-none">

                {/* HEADER — Title + company info + logo */}
                <h1 className="text-center text-base sm:text-lg font-extrabold uppercase tracking-wide text-gray-900 print:text-[12pt] mb-3 print:mb-2"
                    style={{ borderBottom: '2px solid #2e7d32', paddingBottom: '4px' }}>
                  {COMPANY_MAIN_TITLE}
                </h1>

                <header className="mb-4 print:mb-3 flex justify-between items-start gap-4">
                    <div className="space-y-0.5 text-xs print:text-[8pt]">
                        <p className="font-bold text-gray-800">{COMPANY_CONTACT_PERSON}</p>
                        <p className="text-gray-600">{COMPANY_ADDRESS_LINE1_PDF}, {COMPANY_ADDRESS_LINE2_PDF}</p>
                        <p className="text-gray-600">{COMPANY_CONTACT_EMAIL_PDF}</p>
                        <p className="text-gray-600">{COMPANY_WEBSITE_PDF}</p>
                    </div>
                    {logoUrl ? (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 relative shrink-0">
                            <Image src={logoUrl} alt="Logo" layout="fill" className="object-contain" />
                        </div>
                    ) : (
                        <span className="text-lg font-extrabold tracking-widest text-gray-800 uppercase print:text-[14pt] shrink-0">
                          AK PRODUCCIONES
                        </span>
                    )}
                </header>

                {/* Centered "Presupuesto" label */}
                <p className="text-center font-bold text-sm uppercase tracking-widest text-gray-700 mb-4 print:text-[10pt]"
                   style={{ backgroundColor: '#c8e6c9', padding: '4px 0', borderRadius: '2px' }}>
                  Presupuesto
                </p>

                {/* Note at top */}
                <p className="text-[10px] text-center text-gray-600 italic print:text-[7pt] border border-gray-300 rounded px-2 py-1 mb-4 print:border-gray-400"
                   style={{ backgroundColor: '#f1f8e9' }}>
                  {BUDGET_VALIDITY_NOTE_PDF}
                </p>

                {/* Document data table */}
                {(() => {
                  const fechaValidoHasta = new Date(presupuesto.timestamp);
                  fechaValidoHasta.setDate(fechaValidoHasta.getDate() + BUDGET_VALIDITY_DAYS_PDF);
                  const budgetNumber = presupuesto.numero || presupuesto.id.substring(0, 6).toUpperCase();
                  return (
                    <section className="mb-4 print:mb-3">
                      <table className="w-full text-xs print:text-[8pt] border-collapse">
                        <thead>
                          <tr style={{ backgroundColor: '#a5d6a7' }}>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Nº de cliente</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Nº de Documento</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">Página</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Fecha</th>
                            <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Válido hasta</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ backgroundColor: '#e8f5e9' }}>
                            <td className="border border-gray-300 px-2 py-1.5 font-mono">{presupuesto.clienteNombre.substring(0, 3).toUpperCase()}-{presupuesto.id.substring(0, 4).toUpperCase()}</td>
                            <td className="border border-gray-300 px-2 py-1.5 font-mono font-semibold">#{budgetNumber}</td>
                            <td className="border border-gray-300 px-2 py-1.5 text-center">1/1</td>
                            <td className="border border-gray-300 px-2 py-1.5">{formatDateShort(presupuesto.timestamp)}</td>
                            <td className="border border-gray-300 px-2 py-1.5">{formatDateShort(fechaValidoHasta.toISOString())}</td>
                          </tr>
                        </tbody>
                      </table>
                    </section>
                  );
                })()}

                {/* Client + event info */}
                <section className="mb-4 print:mb-3 border border-gray-300 rounded px-3 py-2 print:border-gray-400"
                         style={{ backgroundColor: '#f1f8e9' }}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-[11px] sm:text-sm">
                        <div className="space-y-1"><p className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest">Cliente</p><p className="font-bold truncate">{presupuesto.clienteNombre}</p></div>
                        <div className="space-y-1"><p className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest">Fecha Evento</p><p className="font-bold">{formatDate(presupuesto.eventoFecha)}</p></div>
                        <div className="space-y-1"><p className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest">Invitados</p><p className="font-bold">{totalInvitados}</p></div>
                        <div className="space-y-1"><p className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest">Tipo Evento</p><p className="font-bold">{presupuesto.eventoTipo}</p></div>
                        <div className="space-y-1"><p className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest">Salón</p><p className="font-bold truncate">{presupuesto.salonFiestas || '—'}</p></div>
                        {presupuesto.clienteContacto && (
                          <div className="space-y-1"><p className="text-[9px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest">Contacto</p><p className="font-bold truncate">{presupuesto.clienteContacto}</p></div>
                        )}
                    </div>
                </section>

                {/* Services/items table */}
                <section className="mb-4 print:mb-3">
                    <table className="w-full text-xs print:text-[8pt] border-collapse">
                      <thead>
                        <tr style={{ backgroundColor: '#2e7d32', color: 'white' }}>
                          <th className="border border-gray-600 px-2 py-1.5 text-left font-semibold" style={{ width: '35%' }}>Artículo</th>
                          <th className="border border-gray-600 px-2 py-1.5 text-center font-semibold">Cantidad</th>
                          <th className="border border-gray-600 px-2 py-1.5 text-center font-semibold">Unidad</th>
                          <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Precio</th>
                          <th className="border border-gray-600 px-2 py-1.5 text-center font-semibold">Desc.%</th>
                          <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Importe total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(calculatedValues.itemsAgrupados).map(([categoria, items]) => (
                            <React.Fragment key={categoria}>
                                <tr style={{ backgroundColor: '#c8e6c9' }}>
                                  <td colSpan={6} className="border border-gray-400 px-2 py-1 font-bold text-gray-700 text-xs print:text-[7.5pt] uppercase tracking-wide">
                                    {categoria}
                                  </td>
                                </tr>
                                {items.map((item: ItemPresupuestado) => {
                                    const effectiveQty = getEffectiveQty(item);
                                    return (
                                        <tr key={item.idServicioCatalogo} style={{ backgroundColor: '#e8f5e9' }}>
                                            <td className="border border-gray-300 px-2 py-1.5 align-top text-[11px] sm:text-xs">
                                                {item.esRegalo ? (
                                                  <div>
                                                    <span className="text-emerald-700 font-semibold flex items-center gap-1 print:text-green-800">
                                                      <Gift className="w-3 h-3 print:hidden"/> {item.nombreServicio}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-600 italic block print:text-[7pt]">Regalo exclusivo</span>
                                                  </div>
                                                ) : item.nombreServicio}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-center align-top">{effectiveQty}</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-center align-top">Serv.</td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right align-top">
                                                {formatCurrency(item.precioUnitarioPresupuesto || item.precioUnitario)}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-center align-top">
                                                {item.esRegalo ? '100%' : '—'}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1.5 text-right align-top font-semibold">
                                                {item.esRegalo
                                                  ? <span className="text-emerald-700 print:text-green-800 font-bold">$ 0,00</span>
                                                  : formatCurrency(item.costoTotalItem)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                        {/* Total row */}
                        <tr style={{ backgroundColor: '#2e7d32', color: 'white' }}>
                          <td colSpan={5} className="border border-gray-600 px-2 py-2 text-right font-bold text-sm print:text-[10pt]">
                            Importe total
                          </td>
                          <td className="border border-gray-600 px-2 py-2 text-right font-bold text-sm print:text-[10pt]">
                            {formatCurrency(calculatedValues.totalFinal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                </section>
                    
                {/* Totals breakdown */}
                <section className="flex justify-end mb-4 print:mb-3">
                    <div className="w-full max-w-sm space-y-2 py-4 px-6 border border-gray-300 rounded print:border-gray-400"
                         style={{ backgroundColor: '#f1f8e9' }}>
                        <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-gray-500 tracking-widest">
                            <span>Valor Real Servicios:</span>
                            <span>{formatCurrency(calculatedValues.subtotalBruto)}</span>
                        </div>
                        {calculatedValues.ahorroRegalos > 0 && (
                            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black text-green-600 tracking-widest">
                                <span>Ahorro Regalos:</span>
                                <span>-{formatCurrency(calculatedValues.ahorroRegalos)}</span>
                            </div>
                        )}
                        {calculatedValues.bonificacionPromo > 0 && (
                            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-rose-500 tracking-widest">
                                <span>Bonificación Promo:</span>
                                <span>-{formatCurrency(calculatedValues.bonificacionPromo)}</span>
                            </div>
                        )}
                        {calculatedValues.ajusteAnual > 0 && (
                            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-amber-600 tracking-widest">
                                <span>Ajuste Anual ({calculatedValues.aniosDiferencia} añ. {presupuesto.ajusteAnualPorcentaje ?? displaySettings.annualAdjustmentPercentage ?? 15}%):</span>
                                <span>+{formatCurrency(calculatedValues.ajusteAnual)}</span>
                            </div>
                        )}
                        {(() => {
                            const markupPct = presupuesto.marketingMarkupPercent || 0;
                            const precioLista = markupPct > 0 ? Math.round(calculatedValues.totalFinal * (1 + markupPct / 100)) : 0;
                            const ahorroMkt = precioLista > 0 ? precioLista - calculatedValues.totalFinal : 0;
                            if (precioLista <= 0) return null;
                            return (
                                <>
                                    <Separator className="bg-gray-300" />
                                    <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest line-through">
                                        <span>Precio de Lista (+{markupPct}%):</span>
                                        <span>{formatCurrency(precioLista)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-violet-600 tracking-widest">
                                        <span>Ahorro Cliente:</span>
                                        <span>{formatCurrency(ahorroMkt)}</span>
                                    </div>
                                </>
                            );
                        })()}
                        <div className="border-t-2 border-gray-700 pt-2" />
                        <div className="flex justify-between items-center text-xl sm:text-2xl font-black text-gray-900 pt-1">
                            <span className="tracking-tighter">TOTAL FINAL:</span>
                            <span>{formatCurrency(calculatedValues.totalFinal)}</span>
                        </div>

                        {/* Total with annual projection inline */}
                        {(() => {
                          const adjustmentPct = presupuesto.ajusteAnualPorcentaje ?? displaySettings.annualAdjustmentPercentage ?? 15;
                          const eventYear = presupuesto.eventoFecha ? new Date(presupuesto.eventoFecha).getFullYear() : 0;
                          const currentYear = new Date().getFullYear();
                          const totalSinAjuste = calculatedValues.totalFinal - calculatedValues.ajusteAnual;
                          const projRows = adjustmentPct > 0 && eventYear > currentYear
                            ? generateProjectionRows(totalSinAjuste, adjustmentPct, currentYear, eventYear)
                            : [];
                          if (projRows.length === 0) return null;
                          return (
                            <div className="mt-2 pt-2 border-t border-gray-300 space-y-0.5 text-[10px] print:text-[7pt]">
                              <p className="font-semibold text-gray-700">Precio con ajuste anual ({adjustmentPct}%):</p>
                              {projRows.map((row) => (
                                <div key={row.year} className="flex justify-between text-gray-600">
                                  <span>{row.year === currentYear ? `Precio hoy` : `Precio al 1/1/${row.year}`}:</span>
                                  <span className="font-semibold">{formatCurrency(row.total)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                    </div>
                </section>

                {/* Annual Projection Table */}
                {(() => {
                  const adjustmentPct = presupuesto.ajusteAnualPorcentaje ?? displaySettings.annualAdjustmentPercentage ?? 15;
                  const eventYear = presupuesto.eventoFecha ? new Date(presupuesto.eventoFecha).getFullYear() : 0;
                  const currentYear = new Date().getFullYear();
                  const totalSinAjuste = calculatedValues.totalFinal - calculatedValues.ajusteAnual;
                  const projRows = adjustmentPct > 0 && eventYear > currentYear
                    ? generateProjectionRows(totalSinAjuste, adjustmentPct, currentYear, eventYear)
                    : [];
                  if (projRows.length === 0) return null;
                  return (
                    <section className="mb-4 print:mb-3">
                      <h3 className="text-xs font-bold text-gray-800 mb-2 print:text-[9pt] text-center uppercase"
                          style={{ backgroundColor: '#c8e6c9', padding: '4px', borderRadius: '2px' }}>
                        Proyección de Precios por Año (ajuste del {adjustmentPct}% anual al 1° de enero)
                      </h3>
                      <table className="w-full text-xs print:text-[8pt] border-collapse">
                        <thead>
                          <tr style={{ backgroundColor: '#2e7d32', color: 'white' }}>
                            <th className="border border-gray-600 px-2 py-1.5 text-left font-semibold">Año</th>
                            <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Precio Base</th>
                            <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Ajuste {adjustmentPct}%</th>
                            <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">Total Ajustado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projRows.map((row) => (
                            <tr key={row.year} style={{ backgroundColor: '#e8f5e9' }}>
                              <td className="border border-gray-300 px-2 py-1.5 font-semibold">
                                {row.year} {row.year === currentYear ? '(actual)' : `(1° de enero)`}
                              </td>
                              <td className="border border-gray-300 px-2 py-1.5 text-right">{formatCurrency(row.base)}</td>
                              <td className="border border-gray-300 px-2 py-1.5 text-right">
                                {row.adjustment === 0 ? '—' : `+${formatCurrency(row.adjustment)}`}
                              </td>
                              <td className="border border-gray-300 px-2 py-1.5 text-right font-bold">{formatCurrency(row.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  );
                })()}
                    
                {/* Footer — booking terms + notes */}
                <footer className="space-y-4 mt-6">
                    <div className="border border-gray-300 rounded px-4 py-3 print:border-gray-400" style={{ backgroundColor: '#f1f8e9' }}>
                        <h4 className="text-[10px] font-black uppercase text-gray-700 tracking-widest mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Condiciones de Reserva</h4>
                        <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed font-medium">{displaySettings.bookingTerms}</p>
                    </div>
                    {presupuesto.notas && (
                        <div className="border border-gray-300 rounded px-4 py-3 print:border-gray-400" style={{ backgroundColor: '#f1f8e9' }}>
                            <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Notas y Observaciones</h4>
                            <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{presupuesto.notas}</p>
                        </div>
                    )}

                    {/* Note at bottom */}
                    <p className="text-[10px] text-center text-gray-600 italic print:text-[7pt] font-semibold">
                      {BUDGET_VALIDITY_NOTE_PDF}
                    </p>

                    {/* Signature area — visible on screen */}
                    <div className="mt-12 grid grid-cols-2 gap-8 sm:gap-20 text-center print:hidden">
                        <div className="border-t-2 border-gray-400 pt-4 relative mt-16">
                            {companyInfo?.signatureUrl ? (
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-14 pointer-events-none">
                                    <Image src={companyInfo.signatureUrl} alt="Firma Empresa" layout="fill" objectFit="contain" />
                                </div>
                            ) : (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-36 pointer-events-none">
                                    <div className="border-b border-dashed border-gray-300 h-6 w-full"></div>
                                </div>
                            )}
                            <p className="font-black text-sm uppercase tracking-tighter text-gray-900">Tec. Alexander Knuth</p>
                            <p className="text-[10px] text-gray-400 font-sans uppercase tracking-widest">Por la Empresa</p>
                        </div>
                        <div className="border-t-2 border-gray-400 pt-4 relative mt-16">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-36 pointer-events-none">
                                <div className="border-b border-dashed border-gray-300 h-6 w-full"></div>
                            </div>
                            <p className="font-black text-sm uppercase tracking-tighter text-gray-900 truncate">{cliente?.name || presupuesto.clienteNombre}</p>
                            <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase font-bold">Firma del Cliente</p>
                        </div>
                    </div>
                </footer>
              </div>

                  </td></tr>
                </tbody>
              </table>
            </div>

            {/* ── HISTORIAL DE PAGOS (admin only, hidden on print) ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="print:hidden">
                <Card className="border-none shadow-xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="pb-2 px-6 sm:px-10 pt-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary"/>
                                <CardTitle className="font-headline text-xl">Historial de Pagos</CardTitle>
                            </div>
                            <Link href={`/presupuestos/${presupuestoId}/estado-de-cuenta`}>
                                <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest">
                                    <Receipt className="w-3.5 h-3.5 mr-2"/> Ver Estado de Cuenta
                                </Button>
                            </Link>
                        </div>
                        {/* Balance summary pills */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600">
                                <span>Total: {formatCurrency(pagosSummary.totalCosto)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                <CheckCircle2 className="w-3 h-3"/> Pagado: {formatCurrency(pagosSummary.totalPagado)}
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${pagosSummary.saldoPendiente <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                <Clock className="w-3 h-3"/> Pendiente: {formatCurrency(Math.max(0, pagosSummary.saldoPendiente))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 sm:px-10 pb-8 space-y-4">
                        {/* Payment history table */}
                        {(presupuesto.pagosCliente || []).length === 0 && !isAddingPago ? (
                            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-xl">
                                Sin pagos registrados aún.
                            </div>
                        ) : (presupuesto.pagosCliente || []).length > 0 && (
                            <div className="border rounded-xl overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 pl-4">Fecha</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">Método</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">Referencia</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">Estado</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 text-right pr-4">Monto</TableHead>
                                            <TableHead className="w-10"/>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(presupuesto.pagosCliente || []).map((pago) => (
                                            <TableRow key={pago.id} className="text-sm">
                                                <TableCell className="pl-4 py-3 font-medium text-slate-700">
                                                    {new Date(pago.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Badge variant="secondary" className="text-[9px] font-bold uppercase">{pago.metodoPago}</Badge>
                                                </TableCell>
                                                <TableCell className="py-3 text-muted-foreground text-xs max-w-[150px] truncate">{pago.referencia || '—'}</TableCell>
                                                <TableCell className="py-3">
                                                    {pago.estadoPago === 'pendiente_confirmacion' ? (
                                                        <Badge className="bg-amber-100 text-amber-700 text-[8px] font-bold"><Clock className="w-2.5 h-2.5 mr-1"/>Pendiente</Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-100 text-emerald-700 text-[8px] font-bold"><CheckCircle2 className="w-2.5 h-2.5 mr-1"/>Confirmado</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="pr-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(pago.monto)}</TableCell>
                                                <TableCell className="py-3 text-right pr-2">
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDeletePago(pago.id)}
                                                        disabled={isDeletingPagoId === pago.id}
                                                    >
                                                        {isDeletingPagoId === pago.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Add payment form */}
                        {isAddingPago ? (
                            <div className="border border-primary/20 rounded-xl p-4 space-y-3 bg-primary/5">
                                <p className="text-[10px] font-black uppercase text-primary tracking-widest">Nuevo Pago</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monto *</Label>
                                        <Input
                                            type="number" min="1" placeholder="0"
                                            value={newPagoMonto}
                                            onChange={e => setNewPagoMonto(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fecha *</Label>
                                        <Input
                                            type="date"
                                            value={newPagoFecha}
                                            onChange={e => setNewPagoFecha(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Método *</Label>
                                        <Select value={newPagoMetodo} onValueChange={(v) => setNewPagoMetodo(v as MetodoPago)}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_METODOS_PAGO.map(m => (
                                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Referencia</Label>
                                        <Input
                                            placeholder="Ej: Nº transf. 12345"
                                            value={newPagoReferencia}
                                            onChange={e => setNewPagoReferencia(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                    <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setIsAddingPago(false)} disabled={isSavingPago}>
                                        Cancelar
                                    </Button>
                                    <Button size="sm" className="rounded-xl" onClick={handleAddPago} disabled={isSavingPago}>
                                        {isSavingPago ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CheckCircle2 className="w-4 h-4 mr-2"/>}
                                        Guardar Pago
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button variant="outline" className="w-full rounded-xl font-bold uppercase tracking-widest text-xs" onClick={() => setIsAddingPago(true)}>
                                <PlusCircle className="w-4 h-4 mr-2"/> Registrar Nuevo Pago
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        <style jsx global>{`
            @media print {
                @page {
                    size: A4 portrait;
                    margin: 1.5cm 1cm;
                }
                header, footer, button, .sidebar, .no-print, .notifications-hub, .sidebar-inset > header, aside { display: none !important; }
                body {
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .ver-budget-print-document {
                    background-color: #e8f5e9 !important;
                }
                .budget-print-thead-content {
                    border-bottom: 1px solid #ccc;
                    margin-bottom: 8px;
                }
                .budget-print-tfoot-content {
                    border-top: 1px solid #ccc;
                    margin-top: 8px;
                }
                .shadow-xl, .shadow-2xl, .shadow-3xl { box-shadow: none !important; }
                .rounded-\\[2rem\\], .rounded-\\[2\\.5rem\\] { border-radius: 0 !important; }
            }
        `}</style>
    </div>
  );
}

export default function VerPresupuestoPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <VerPresupuestoContent params={params} />
    </Suspense>
  )
}
