'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle, FileText as FileTextIcon, Users, MapPin, Share2, Gift, ClipboardCopy, TrendingUp, Info, CalendarDays as CalendarIcon, PartyPopper, CheckCircle2, MessageSquare, PlusCircle, Trash2, CreditCard, Receipt, Clock, FileSignature, ExternalLink, ShieldCheck, ShieldAlert, Upload, ImageIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import type { Presupuesto, ItemPresupuestado, PagoCliente, MetodoPago } from '@/types/presupuesto';
import type { AuditResult } from '@/lib/commercial-flow/budget-audit';
import { ALL_METODOS_PAGO } from '@/types/presupuesto';
import { getPresupuestoById, getPresupuestoShareToken, addPagoToPresupuesto, deletePagoFromPresupuesto, createFiestaFromPresupuesto, approvePresupuesto, addPagoClienteFromPortal } from '@/app/actions/presupuestos';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getCustomerById } from '@/app/actions/customers';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { Customer } from '@/types/customer';
import type { BudgetDisplaySettings, CompanyInfo } from '@/types/settings';
import { getBudgetDisplaySettings, getInvoiceTemplateSettings, getCompanyInfo } from '@/app/actions/settings';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';
import { auditPresupuestoTotals } from '@/lib/commercial-flow/budget-audit';
import { calculateBudgetFinancials, getBudgetPaymentSummary, isConfirmedClientPayment } from '@/lib/budget/financial-guardrails';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import BudgetDocument from '@/components/budget/BudgetDocument';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CompanyLogo } from '@/components/company-logo';
import { FloatingWhatsApp } from '@/components/ui/floating-whatsapp';
import {
  buildAnnualAdjustmentProjection,
  calculatePricePerPerson,
  DEFAULT_BOOKING_DEPOSIT_AMOUNT,
} from '@/lib/budget/formal-budget';
import { montoDeSenia } from '@/lib/budget/monto-de-senia';
import { calculateMercadoPagoCuotas } from '@/lib/payments/mercadopago-calculator';

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
const BUDGET_VALIDITY_NOTE_PDF = "El presupuesto es valido por 30 dias. Durante este mes podes reservar la fecha con una sena de $ 5.000; la contratacion final se confirma con el contrato correspondiente.";
const CONTRACT_MISSING_EVENT_DATA_ERROR = "No se puede generar el contrato sin la fecha y hora del evento";

const extractTimeFromDate = (dateString?: string) => {
  if (!dateString || !dateString.includes('T')) return '';
  const [_datePart, timePart = ''] = dateString.split('T');
  const hhmm = timePart.slice(0, 5);
  return /^\d{2}:\d{2}$/.test(hhmm) && hhmm !== '00:00' ? hhmm : '';
};

const formatDateShort = (dateString?: string) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  } catch { return '—'; }
};

function VerPresupuestoContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presupuestoId = params.id;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const budgetDocumentRef = useRef<HTMLDivElement>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatingFiesta, setIsCreatingFiesta] = useState(false);
  const [linkedFiestaId, setLinkedFiestaId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

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
  const [startingMercadoPago, setStartingMercadoPago] = useState<'deposit' | 'balance' | null>(null);
  const [mercadoPagoAvailable, setMercadoPagoAvailable] = useState(false);

  // Budget audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const publicToken = searchParams.get('token') || undefined;

  useEffect(() => {
    if (!publicToken) {
      setMercadoPagoAvailable(false);
      return;
    }
    const controller = new AbortController();
    void fetch('/api/health', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : null)
      .then((health) => {
        setMercadoPagoAvailable(Boolean(health?.integrations?.mercadoPago));
      })
      .catch(() => {
        if (!controller.signal.aborted) setMercadoPagoAvailable(false);
      });
    return () => controller.abort();
  }, [publicToken]);

  const fetchPresupuestoAndSettings = useCallback(async () => {
    if (!presupuestoId) return;
    setIsLoading(true);
    try {
      const [fetchedPresupuesto, fetchedSettings, templateSettings, socialConnections, fetchedCompanyInfo] = await Promise.all([
        getPresupuestoById(presupuestoId, publicToken),
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
  }, [presupuestoId, publicToken]);

  useEffect(() => { fetchPresupuestoAndSettings(); }, [fetchPresupuestoAndSettings]);
  useEffect(() => {
    if (searchParams.get('imprimir') === '1') {
      const printTimer = setTimeout(() => window.print(), 800);
      return () => clearTimeout(printTimer);
    }
  }, [searchParams]);

  const adjustmentPct = presupuesto?.ajusteAnualPorcentaje ?? displaySettings?.annualAdjustmentPercentage ?? 15;
  const calculatedValues = useMemo(() => {
    if (!presupuesto) return { itemsAgrupados: {}, totalVigente: 0, totalFinal: 0, subtotalBruto: 0, ahorroRegalos: 0, bonificacionPromo: 0, ajusteAnual: 0, aniosDiferencia: 0 };
    const financials = calculateBudgetFinancials(presupuesto, { preserveStoredTotal: true });
  
    const adultos = presupuesto.invitadosAdultos || 0;
    const adolescentes = presupuesto.invitadosAdolescentes || 0;
    const ninos = presupuesto.invitadosNinos || 0;

    const itemsRecalculados = presupuesto.itemsPresupuestados.map(item => ({
        ...item,
        costoTotalItem: recalcularCostoItem(item, adultos, adolescentes, ninos)
    }));

    const brutoVenta = itemsRecalculados.filter(i => !i.esRegalo).reduce((sum, i) => sum + i.costoTotalItem, 0);
    const regalosVal = itemsRecalculados.filter(i => i.esRegalo).reduce((sum, i) => {
        const itemNormal = { ...i, esRegalo: false, precioUnitarioPresupuesto: i.precioUnitario };
        return sum + recalcularCostoItem(itemNormal, adultos, adolescentes, ninos);
    }, 0);

    let bonificacion = 0;
    if (presupuesto.descuentoTipo === 'porcentaje') bonificacion = (brutoVenta * (presupuesto.descuentoValor || 0)) / 100;
    else if (presupuesto.descuentoTipo === 'fijo') bonificacion = presupuesto.descuentoValor || 0;

    const discountAmount = financials.discount || Math.round(bonificacion);
    const totalVigente = Math.max(0, brutoVenta - discountAmount);

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

    const projection = buildAnnualAdjustmentProjection({
      baseTotal: totalVigente,
      eventDate: presupuesto.eventoFecha,
      currentYear: new Date(presupuesto.timestamp).getFullYear(),
      adjustmentPct: adjustmentPct,
    });

    const isContracted = presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado';
    const applies = isContracted && presupuesto.ajusteAnualActivo && projection.applies;
    const ajusteAnualVal = applies ? projection.adjustmentAmount : 0;
    const totalFinalVal = applies ? projection.adjustedTotal : totalVigente;
    const aniosDiferenciaVal = applies ? (projection.eventYear - projection.currentYear) : 0;

    return {
      itemsAgrupados: sortedAgrupados,
      subtotalBruto: brutoVenta + regalosVal,
      ahorroRegalos: Math.round(regalosVal),
      bonificacionPromo: discountAmount,
      ajusteAnual: ajusteAnualVal,
      totalVigente: Math.round(totalVigente),
      totalFinal: Math.round(totalFinalVal),
      aniosDiferencia: aniosDiferenciaVal
    };
  }, [presupuesto, adjustmentPct]);

  const handlePrint = async () => {
    if (!presupuesto || !budgetDocumentRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      await pdf.html(budgetDocumentRef.current, {
        autoPaging: 'text',
        margin: [12, 12, 16, 12],
        width: 186,
        windowWidth: 1024,
        html2canvas: {
          backgroundColor: '#ffffff',
          scale: 0.8,
          useCORS: true,
        },
      });
      const totalPages = pdf.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        pdf.setPage(page);
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(`Página ${page} de ${totalPages}`, 198, 285, { align: 'right' });
      }
      pdf.save(`presupuesto-ak-${presupuesto.numero || presupuesto.id}.pdf`);
      toast({
        title: 'Descarga exitosa',
        description: 'El archivo PDF de tu presupuesto se ha descargado correctamente.',
      });
    } catch (error: any) {
      toast({
        title: 'No pudimos descargar el PDF',
        description: error.message || 'Intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAudit = () => {
    if (!presupuesto) return;
    setIsAuditing(true);
    try {
      const result = auditPresupuestoTotals(presupuesto);
      setAuditResult(result);
      setShowAudit(true);
    } finally {
      setIsAuditing(false);
    }
  };

  const eventStartTime = useMemo(() => {
    if (!presupuesto) return '';
    return (presupuesto.eventoHoraInicio || extractTimeFromDate(presupuesto.eventoFecha)).trim();
  }, [presupuesto]);
  const canGenerateContract = Boolean(presupuesto?.eventoFecha && eventStartTime);
  const currentYear = new Date().getFullYear();
  const clubUruguayItem = (presupuesto?.itemsPresupuestados || []).find((item) => item.idServicioCatalogo === 'serv_salon_club_uruguay');
  const clubUruguayCosto = clubUruguayItem
    ? Math.round((clubUruguayItem.precioUnitarioPresupuesto || clubUruguayItem.precioUnitario || 0) * (clubUruguayItem.cantidad || 1))
    : 0;

  const handleOpenContrato = useCallback(() => {
    if (!presupuestoId) return;
    if (!canGenerateContract) {
      toast({ title: 'Datos incompletos', description: CONTRACT_MISSING_EVENT_DATA_ERROR, variant: 'destructive' });
      return;
    }
    router.push(`/presupuestos/${presupuestoId}/recibo-contrato?doc=contrato`);
  }, [canGenerateContract, presupuestoId, router, toast]);

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

  const handleSharePublicBudget = async () => {
    if (!presupuesto || isSharing) return;
    setIsSharing(true);
    try {
      let currentToken = searchParams.get('token') || (presupuesto as any).token || '';
      if (!currentToken) {
        const tokenResult = await getPresupuestoShareToken(presupuesto.id);
        if (!tokenResult.success || !tokenResult.token) {
          throw new Error(tokenResult.error || 'No se pudo crear un acceso seguro al presupuesto.');
        }
        currentToken = tokenResult.token;
      }
      const nameParam = encodeURIComponent(presupuesto.clienteNombre.trim().replace(/\s+/g, '_'));
      const url = `${window.location.origin}/presupuestos/${presupuesto.id}/ver?cliente=1&token=${currentToken}&para=${nameParam}`;
      const text = [
      `📄 *Presupuesto de AK Producciones para ${presupuesto.clienteNombre}*`,
      `-----------------`,
      `¡Hola! Te compartimos el detalle formal de tu presupuesto.`,
      ``,
      `*Evento:* ${presupuesto.eventoTipo || 'Social'}`,
      `*Total Vigente:* ${formatCurrency(calculatedValues.totalFinal)}`,
      ``,
      `👉 *Ver presupuesto online:* ${url}`
      ].join('\n');
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } catch (error) {
      toast({
        title: 'No se pudo compartir',
        description: error instanceof Error ? error.message : 'Intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const pagosSummary = useMemo(() => {
    if (!presupuesto) return { totalPagado: 0, saldoPendiente: 0, totalCosto: 0 };
    const summary = getBudgetPaymentSummary(presupuesto, {
      includeAnnualAdjustment: true,
    });
    return { totalCosto: summary.total, totalPagado: summary.paid, saldoPendiente: summary.balance };
  }, [presupuesto]);
  const hasDepositPayment = useMemo(
    () => (presupuesto?.pagosCliente || []).some((p) => isConfirmedClientPayment(p) && p.monto > 0),
    [presupuesto]
  );
  // La senia de ESTE presupuesto, no un valor fijo. Tiene que coincidir con lo
  // que despues cobra el link de Mercado Pago: si el boton dice un numero y se
  // cobra otro, el cliente pierde la confianza en el peor momento.
  const seniaDelPresupuesto = useMemo(
    () => montoDeSenia({
      seniaAcordada: presupuesto?.senia,
      porDefecto: displaySettings?.bookingDepositAmount ?? DEFAULT_BOOKING_DEPOSIT_AMOUNT,
    }),
    [presupuesto?.senia, displaySettings?.bookingDepositAmount],
  );
  const mercadoPagoDepositTotal = useMemo(
    () => calculateMercadoPagoCuotas(
      Math.min(seniaDelPresupuesto, pagosSummary.saldoPendiente),
    ).totalWithSurcharge,
    [seniaDelPresupuesto, pagosSummary.saldoPendiente],
  );
  const mercadoPagoBalanceTotal = useMemo(
    () => calculateMercadoPagoCuotas(pagosSummary.saldoPendiente).totalWithSurcharge,
    [pagosSummary.saldoPendiente],
  );

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
      }, searchParams.get('token') || undefined);
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

  const handleMercadoPagoCheckout = async (purpose: 'deposit' | 'balance') => {
    if (!presupuesto || !publicToken || startingMercadoPago) return;
    setStartingMercadoPago(purpose);
    try {
      const response = await fetch('/api/payments/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presupuestoId: presupuesto.id,
          token: publicToken,
          purpose,
        }),
      });
      const payload = await response.json() as { checkoutUrl?: string; sessionId?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || 'No se pudo iniciar el pago.');
      }
      if (payload.sessionId) {
        sessionStorage.setItem(`ak-mp-return:${payload.sessionId}`, window.location.href);
      }
      window.location.assign(payload.checkoutUrl);
    } catch (checkoutError) {
      toast({
        title: 'Mercado Pago no disponible',
        description: checkoutError instanceof Error ? checkoutError.message : 'Intenta nuevamente.',
        variant: 'destructive',
      });
      setStartingMercadoPago(null);
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
      <Button asChild variant="outline" className="rounded-xl"><Link href="/presupuestos/nuevo"><ArrowLeft className="mr-2 h-4 w-4"/>Volver a Presupuestos</Link></Button>
    </div>
  );
  if (!displaySettings) return null;

  const totalInvitados = (presupuesto.invitadosAdultos || 0) + (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0) || presupuesto.invitadosCantidad || 0;
  const isBorrador = presupuesto.estado === 'Borrador';
  const accessMode = (searchParams.get('mode') || searchParams.get('modo') || '').toLowerCase();
  const isPublicBudgetAccess =
    searchParams.has('token') ||
    searchParams.get('public') === '1' ||
    searchParams.get('cliente') === '1' ||
    searchParams.get('guest') === '1' ||
    ['cliente', 'client', 'publico', 'public', 'invitado', 'guest'].includes(accessMode);
  const isGuestBudgetAccess = searchParams.get('guest') === '1' || ['invitado', 'guest'].includes(accessMode);
  const isOperatorBudgetAccess = !isPublicBudgetAccess;
  const shouldShowPublicBudgetActions = isPublicBudgetAccess && !isGuestBudgetAccess;
  const shouldShowClientBudgetActions = false;
  const shouldShowBudgetSignatures =
    presupuesto.estado === 'Aceptado' ||
    presupuesto.estado === 'Facturado' ||
    Boolean(presupuesto.fechaFirmaContrato);
  const isDirectPrintAccess = searchParams.get('imprimir') === '1' || searchParams.get('direct') === '1';
  const isContracted = presupuesto.estado === 'Aceptado' || presupuesto.estado === 'Facturado';
  const annualProjection = buildAnnualAdjustmentProjection({
    baseTotal: calculatedValues.totalVigente,
    eventDate: presupuesto.eventoFecha,
    adjustmentPct,
    currentYear,
  });
  const pricePerPerson = calculatePricePerPerson(calculatedValues.totalFinal, totalInvitados);

  // Pre-compute WhatsApp operator button to avoid IIFE inside JSX (SWC build compat) - clean trigger
  const whatsappOperatorButton = (cliente?.phone || whatsappNumber) ? (() => {
    const phone = (cliente?.phone?.replace(/\D/g, '') || whatsappNumber) as string;
    const text = `Hola ${presupuesto?.clienteNombre ?? ''}, te contactamos sobre el presupuesto #${presupuesto?.numero || (presupuesto?.id ?? '').substring(0, 6).toUpperCase()}.`;
    return (
      <a href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/5">
          <MessageSquare className="mr-1.5 h-3.5 w-3.5"/>WhatsApp
        </Button>
      </a>
    );
  })() : null;

  if (isDirectPrintAccess) {
    return (
      <div className="min-h-screen bg-white p-4 print:p-0">
        <BudgetDocument
          presupuesto={presupuesto}
          logoUrl={logoUrl}
          adjustmentPct={adjustmentPct}
          annualProjection={isContracted ? annualProjection : undefined}
          pricePerPerson={pricePerPerson}
          bookingDepositAmount={DEFAULT_BOOKING_DEPOSIT_AMOUNT}
          clienteNombre={cliente?.name || presupuesto.clienteNombre}
          showSignatures={false}
          clubUruguayCosto={clubUruguayCosto}
          itemsAgrupadosOverride={calculatedValues.itemsAgrupados}
          subtotalBrutoOverride={calculatedValues.subtotalBruto}
          descuentoPromoOverride={calculatedValues.bonificacionPromo}
          totalFinalOverride={calculatedValues.totalFinal}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6 print:bg-white print:py-0 print:min-h-0 font-sans">
        {/* ── QUICK ACTION BAR ────────────────────────────────── */}
        {isOperatorBudgetAccess && (
        <>
        <div className="print:hidden max-w-3xl mx-auto px-4 mb-4">
          <div className="bg-white rounded-2xl shadow-md px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest"><Link href="/presupuestos/nuevo">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5"/>Volver
                </Link></Button>
              <PresupuestoStatusBadge status={presupuesto.estado} className="text-sm px-3 py-1.5 font-bold" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest"><Link href={`/presupuestos/${presupuestoId}/edit`}>
                  <Edit className="mr-1.5 h-3.5 w-3.5"/>Editar
                </Link></Button>
              {!isBorrador && (
                <Button asChild size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest"><Link href="/pagos-rapidos">
                    <CreditCard className="mr-1.5 h-3.5 w-3.5"/>Registrar Pago
                  </Link></Button>
              )}
              {!isBorrador && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold uppercase tracking-widest"
                  disabled={!canGenerateContract}
                  onClick={handleOpenContrato}
                >
                  <FileSignature className="mr-1.5 h-3.5 w-3.5"/>Ver Contrato
                </Button>
              )}
              {!isBorrador && hasDepositPayment && (
                <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest"><Link href={`/presupuestos/${presupuestoId}/recibo-contrato?doc=recibo`}>
                    <Receipt className="mr-1.5 h-3.5 w-3.5"/>Recibo de Seña
                  </Link></Button>
              )}
              {whatsappOperatorButton}
              <Button onClick={handlePrint} disabled={isDownloading} size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest" variant="secondary">
                {isDownloading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Printer className="mr-1.5 h-3.5 w-3.5"/>}
                Descargar PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAudit}
                disabled={isAuditing}
                className="rounded-xl text-xs font-bold uppercase tracking-widest border-violet-200 text-violet-700 hover:bg-violet-50 print:hidden"
                data-testid="btn-auditar-presupuesto"
              >
                {isAuditing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <ShieldCheck className="mr-1.5 h-3.5 w-3.5"/>}
                Auditar
              </Button>
              {!isBorrador && (
                <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest"><Link href={`/presupuestos/${presupuestoId}/estado-de-cuenta`}>
                    <Receipt className="mr-1.5 h-3.5 w-3.5"/>Estado de Cuenta
                  </Link></Button>
              )}
              {!isBorrador && (linkedFiestaId ? (
                <Button asChild size="sm" variant="outline" className="rounded-xl text-xs border-violet-200 text-violet-700 hover:bg-violet-50 font-bold uppercase tracking-widest" data-testid="btn-ver-fiesta"><Link href={`/fiestas/nueva?fiestaId=${linkedFiestaId}`}>
                    <PartyPopper className="mr-1.5 h-3.5 w-3.5"/>Ver Fiesta
                  </Link></Button>
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
              ))}
            </div>
            {!isBorrador && !canGenerateContract && (
              <p className="w-full text-[11px] text-rose-600 font-semibold">
                {CONTRACT_MISSING_EVENT_DATA_ERROR}
              </p>
            )}
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

        </>
        )}

        <div className="max-w-3xl mx-auto space-y-8 px-2 sm:px-4 print:px-0">

            {/* AUDIT PANEL — shown when user clicks "Auditar presupuesto" */}
            {shouldShowPublicBudgetActions && (
              <div className="print:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Button
                    onClick={handleSharePublicBudget}
                    disabled={isSharing}
                    className="h-12 rounded-xl bg-emerald-600 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700 px-2 flex items-center justify-center gap-1.5 w-full"
                  >
                    {isSharing ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Share2 className="h-4 w-4 shrink-0" />}
                    <span className="truncate">Compartir por WhatsApp</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleWhatsAppMeetingRequest}
                    className="h-12 rounded-xl border-emerald-200 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-emerald-700 hover:bg-emerald-50 px-2 flex items-center justify-center gap-1.5 w-full"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" /> <span className="truncate">Coordinar una Reunión</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    disabled={isDownloading}
                    className="h-12 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide px-2 flex items-center justify-center gap-1.5 w-full"
                  >
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Printer className="h-4 w-4 shrink-0" />}
                    <span className="truncate">Descargar PDF</span>
                  </Button>
                </div>
              </div>
            )}

            <Dialog open={showAudit} onOpenChange={setShowAudit}>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-violet-700 uppercase font-black tracking-tight">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    Auditoría del Presupuesto
                  </DialogTitle>
                  <DialogDescription>
                    Resumen del análisis matemático y consistencia de totales del presupuesto.
                  </DialogDescription>
                </DialogHeader>

                {auditResult && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Subtotal ítems</p>
                        <p className="font-black text-slate-800">{formatCurrency(auditResult.subtotalItems)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Regalos</p>
                        <p className="font-black text-slate-800">{formatCurrency(auditResult.subtotalRegalos)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Descuento</p>
                        <p className="font-black text-slate-800">{formatCurrency(auditResult.descuentoCalculado)}</p>
                      </div>
                      <div className="bg-violet-50 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Total a pagar</p>
                        <p className="font-black text-violet-800">{formatCurrency(auditResult.totalReal)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Seña</p>
                        <p className="font-black text-slate-800">{formatCurrency(presupuesto.senia)}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Saldo pendiente</p>
                        <p className="font-black text-amber-800">{formatCurrency(Math.max(0, auditResult.saldoPendiente))}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Total pagos</p>
                        <p className="font-black text-emerald-800">{formatCurrency(auditResult.totalPagosRegistrados)}</p>
                      </div>
                      <div className={`rounded-xl p-3 col-span-2 ${auditResult.esConsistente ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: auditResult.esConsistente ? '#059669' : '#dc2626' }}>Estado</p>
                        <p className={`font-black text-sm ${auditResult.esConsistente ? 'text-emerald-800' : 'text-rose-800'}`}>
                          {auditResult.esConsistente ? '✅ Consistente' : '⚠️ Hay Inconsistencias'}
                        </p>
                      </div>
                    </div>

                    {auditResult.observaciones.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Advertencias</p>
                        {auditResult.observaciones.map((obs, i) => (
                          <div
                            key={i}
                            className={`text-xs p-3 rounded-xl border ${
                              obs.severidad === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                              obs.severidad === 'advertencia' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                              'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="font-bold">{obs.campo}: </span>{obs.mensaje}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* SANITY CHECK BANNER — shown when estado is 'Pendiente Verificación' */}
            {isOperatorBudgetAccess && presupuesto.estado === 'Pendiente Verificación' && (
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
            {shouldShowClientBudgetActions && (
            <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
                <Card className="border-none shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-6 sm:p-12 flex flex-col items-center text-center space-y-8">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <PartyPopper className="w-10 h-10 sm:w-12 sm:h-12 text-primary"/>
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
                                : isCatering
                                ? 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-de-catering'
                                : 'https://ak-producciones-fiestas-y-eventos.my.canva.site/servicio-completo-para-fiestas-en-general-sitio-web';
                              const emoji = isBoda ? '💍' : isXV ? '👑' : isCatering ? '🍽️' : '🎉';
                              const label = isBoda ? 'Ver Catálogo Bodas' : isXV ? 'Ver Catálogo XV Años' : isCatering ? 'Ver Catálogo Catering' : 'Ver Catálogo Fiestas';
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
            </>
            )}

            {mercadoPagoAvailable
              && shouldShowPublicBudgetActions
              && publicToken
              && ['Enviado', 'Aceptado', 'Facturado'].includes(presupuesto.estado)
              && pagosSummary.saldoPendiente > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="print:hidden"
              >
                <Card className="overflow-hidden rounded-lg border border-sky-200 bg-white shadow-sm">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="max-w-xl">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-[#009EE3]" />
                          <h3 className="text-lg font-black text-slate-900">Pagar con Mercado Pago</h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          Pago protegido. El total incluye el 10% de recargo financiero informado en el presupuesto.
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-2 sm:w-auto">
                        {!hasDepositPayment && pagosSummary.saldoPendiente > seniaDelPresupuesto && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleMercadoPagoCheckout('deposit')}
                            disabled={Boolean(startingMercadoPago)}
                            className="min-w-52 rounded-lg border-[#009EE3] text-[#007eb5] hover:bg-sky-50"
                          >
                            {startingMercadoPago === 'deposit'
                              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              : <CreditCard className="mr-2 h-4 w-4" />}
                            Pagar sena {formatCurrency(mercadoPagoDepositTotal)}
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={() => void handleMercadoPagoCheckout('balance')}
                          disabled={Boolean(startingMercadoPago)}
                          className="min-w-52 rounded-lg bg-[#009EE3] text-white hover:bg-[#0089c7]"
                        >
                          {startingMercadoPago === 'balance'
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <ShieldCheck className="mr-2 h-4 w-4" />}
                          Pagar saldo {formatCurrency(mercadoPagoBalanceTotal)}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

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

            <div id="budget-print-area-wrapper" ref={budgetDocumentRef}>
              <BudgetDocument
                presupuesto={presupuesto}
                logoUrl={logoUrl}
                adjustmentPct={adjustmentPct}
                annualProjection={isContracted ? annualProjection : undefined}
                pricePerPerson={pricePerPerson}
                bookingDepositAmount={DEFAULT_BOOKING_DEPOSIT_AMOUNT}
                clienteNombre={cliente?.name || presupuesto.clienteNombre}
                showSignatures={shouldShowBudgetSignatures}
                clubUruguayCosto={clubUruguayCosto}
                itemsAgrupadosOverride={calculatedValues.itemsAgrupados}
                subtotalBrutoOverride={calculatedValues.subtotalBruto}
                descuentoPromoOverride={calculatedValues.bonificacionPromo}
                totalFinalOverride={calculatedValues.totalFinal}
              />
            </div>

            {/* ── HISTORIAL DE PAGOS (admin only, hidden on print) ── */}
            {isOperatorBudgetAccess && !isBorrador && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="print:hidden">
                <Card className="border-none shadow-xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="pb-2 px-6 sm:px-10 pt-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary"/>
                                <CardTitle className="font-headline text-xl">Historial de Pagos</CardTitle>
                            </div>
                            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-widest"><Link href={`/presupuestos/${presupuestoId}/estado-de-cuenta`}>
                                    <Receipt className="w-3.5 h-3.5 mr-2"/> Ver Estado de Cuenta
                                </Link></Button>
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
                            <div className="border rounded-xl w-full overflow-x-auto block">
                                <Table className="min-w-[500px]">
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
                                                    {pago.estadoPago === 'rechazado' ? (
                                                        <Badge className="bg-red-100 text-red-700 text-[8px] font-bold"><AlertTriangle className="w-2.5 h-2.5 mr-1"/>Rechazado</Badge>
                                                    ) : pago.estadoPago === 'pendiente_confirmacion' ? (
                                                        <Badge className="bg-amber-100 text-amber-700 text-[8px] font-bold"><Clock className="w-2.5 h-2.5 mr-1"/>Pendiente</Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-100 text-emerald-700 text-[8px] font-bold"><CheckCircle2 className="w-2.5 h-2.5 mr-1"/>Confirmado</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className={`pr-4 py-3 text-right font-bold ${pago.estadoPago === 'rechazado' ? 'text-red-600 line-through' : 'text-emerald-700'}`}>{formatCurrency(pago.monto)}</TableCell>
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
            )}
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
                    background-color: #ffffff !important;
                    counter-reset: page;
                }
                .ver-budget-print-document table {
                    page-break-inside: auto;
                    border-collapse: collapse !important;
                }
                .ver-budget-print-document tr {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .ver-budget-print-document thead {
                    display: table-header-group;
                }
                .ver-budget-print-document tbody {
                    display: table-row-group;
                }
                .ver-budget-print-document img {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .ver-budget-print-document section,
                .ver-budget-print-document article,
                .ver-budget-print-document .budget-print-summary,
                .ver-budget-print-document .budget-print-notes {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .ver-budget-print-document > table > thead {
                    display: table-header-group;
                }
                .ver-budget-print-document > table > tfoot {
                    display: table-row-group;
                }
                .budget-print-thead-content {
                    border-bottom: 1px solid #ccc;
                    margin-bottom: 8px;
                }
                .budget-print-tfoot-content {
                    border-top: 1px solid #ccc;
                    margin-top: 12px;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .budget-print-page-number::after {
                    content: counter(page);
                }
                .budget-print-fixed-page-number {
                    position: fixed;
                    right: 1cm;
                    bottom: 0.35cm;
                    font-size: 7pt;
                    color: #64748b;
                    z-index: 9999;
                }
                .budget-print-fixed-page-number::after {
                    content: "Pagina " counter(page);
                }
                .shadow-xl, .shadow-2xl, .shadow-3xl { box-shadow: none !important; }
                .rounded-\\[2rem\\], .rounded-\\[2\\.5rem\\] { border-radius: 0 !important; }
            }
        `}</style>
        <FloatingWhatsApp phoneNumber={whatsappNumber} />
    </div>
  );
}

export default function VerPresupuestoPage() {
  const params = useParams<{ id: string }>();
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <VerPresupuestoContent params={params} />
    </Suspense>
  )
}
