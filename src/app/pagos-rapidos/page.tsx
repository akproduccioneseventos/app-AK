'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Loader2, CreditCard, Banknote, Smartphone, FileCheck2,
  CheckCircle2, Clock, XCircle, MessageCircle, ChevronDown, ChevronUp,
  Receipt, Search, AlertTriangle, ImageIcon, Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Presupuesto, PagoCliente, MetodoPago } from '@/types/presupuesto';
import { ALL_METODOS_PAGO } from '@/types/presupuesto';
import {
  getPresupuestos,
  addPagoToPresupuesto,
  confirmPagoCliente,
  rejectPagoCliente,
  getPresupuestosWithPendingPayments,
} from '@/app/actions/presupuestos';
import { getSocialConnections } from '@/app/actions/social-connections';
import { getCompanyInfo, getInvoiceTemplateSettings } from '@/app/actions/settings';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import Image from 'next/image';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return '$ 0';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const MetodoPagoIcon = ({ metodo }: { metodo: string }) => {
  switch (metodo) {
    case 'Efectivo': return <Banknote className="w-4 h-4" />;
    case 'MercadoPago': return <Smartphone className="w-4 h-4" />;
    case 'Transferencia Bancaria': return <CreditCard className="w-4 h-4" />;
    default: return <FileCheck2 className="w-4 h-4" />;
  }
};

// ── Receipt Component ───────────────────────────────────────────────
function ReciboView({
  pago,
  presupuesto,
  companyName,
  companyTaxId,
  companyAddress,
  companyContact,
  logoUrl,
  whatsappNumber,
  onClose,
}: {
  pago: PagoCliente;
  presupuesto: Presupuesto;
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyContact: string;
  logoUrl: string | null;
  whatsappNumber: string;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const totalCosto = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
  const totalPagado = (presupuesto.pagosCliente || [])
    .filter(p => p.estadoPago !== 'pendiente_confirmacion' || p.id === pago.id)
    .reduce((sum, p) => sum + p.monto, 0);
  const saldoAnterior = totalCosto - totalPagado + pago.monto;
  const saldoRestante = totalCosto - totalPagado;
  const receiptNumber = pago.id.slice(-10).toUpperCase();

  const exportReceiptAsImage = async () => {
    if (!receiptRef.current) return null;
    const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  const handleDownloadRecibo = async () => {
    try {
      const blob = await exportReceiptAsImage();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${presupuesto.numero || presupuesto.id.slice(-6)}-${receiptNumber}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('No se pudo descargar el recibo:', error);
    }
  };

  const handleShareRecibo = async () => {
    try {
      const blob = await exportReceiptAsImage();
      if (!blob) return;
      const file = new File([blob], `recibo-${presupuesto.numero || presupuesto.id.slice(-6)}-${receiptNumber}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Recibo oficial ${companyName}`,
          text: `Recibo de pago de ${presupuesto.clienteNombre}`,
          files: [file],
        });
        return;
      }
      await handleDownloadRecibo();
    } catch (error) {
      console.error('No se pudo compartir el recibo:', error);
    }
  };

  const handleWhatsAppRecibo = () => {
    const texto =
      `🧾 *Recibo de Pago — ${companyName}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Cliente:* ${presupuesto.clienteNombre}\n` +
      `🎉 *Evento:* ${presupuesto.eventoTipo}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Monto pagado:* ${formatCurrency(pago.monto)}\n` +
      `📅 *Fecha:* ${formatDate(pago.fecha)}\n` +
      `💳 *Método:* ${pago.metodoPago}\n` +
      (pago.referencia ? `📝 *Referencia:* ${pago.referencia}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 *Saldo anterior:* ${formatCurrency(saldoAnterior)}\n` +
      `✅ *Saldo restante:* ${formatCurrency(saldoRestante)}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `¡Gracias por tu pago! 🙌`;

    const clienteContacto = presupuesto.clienteContacto || '';
    const phoneNumber = clienteContacto.replace(/\D/g, '') || whatsappNumber;
    const target = phoneNumber
      ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(target, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full overflow-hidden">
        <div ref={receiptRef} className="bg-white">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="w-12 h-12 relative rounded-md overflow-hidden border border-slate-200">
                    <Image src={logoUrl} alt="Logo empresa" fill className="object-contain p-1" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-md border border-slate-200 flex items-center justify-center text-xs font-black text-slate-700">
                    AK
                  </div>
                )}
                <div>
                  <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight">{companyName}</h3>
                  <p className="text-xs text-slate-500">Recibo Oficial de Pago</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Recibo N°</p>
                <p className="font-black text-slate-900">{receiptNumber}</p>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1">
              <p>{companyAddress || 'Salto, Uruguay'}</p>
              <p className="sm:text-right">{companyContact || 'akproduccionessalto@gmail.com'}</p>
              <p>RUT: {companyTaxId || 'No informado'}</p>
              <p className="sm:text-right">Fecha emisión: {formatDate(pago.fecha)}</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Cliente</p>
                <p className="font-bold text-slate-900">{presupuesto.clienteNombre}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Evento</p>
                <p className="font-bold text-slate-900">{presupuesto.eventoTipo}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Monto pagado</span>
                <span className="font-black text-slate-900 text-lg">{formatCurrency(pago.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Método</span>
                <Badge variant="secondary" className="flex items-center gap-1 text-[10px] font-bold uppercase">
                  <MetodoPagoIcon metodo={pago.metodoPago} /> {pago.metodoPago}
                </Badge>
              </div>
              {pago.referencia && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Referencia</span>
                  <span className="font-medium text-xs">{pago.referencia}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo anterior</span>
                <span className="font-bold">{formatCurrency(saldoAnterior)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo restante</span>
                <span className="font-black">{formatCurrency(saldoRestante)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">
            Cerrar
          </Button>
          <Button
            onClick={handleWhatsAppRecibo}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
          <Button onClick={handleShareRecibo} variant="outline" className="flex-1 rounded-xl">
            <Send className="w-4 h-4 mr-2" /> Compartir
          </Button>
          <Button onClick={handleDownloadRecibo} variant="outline" className="flex-1 rounded-xl">
            <ImageIcon className="w-4 h-4 mr-2" /> Descargar imagen
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
function PagosRapidosContent() {
  const { toast } = useToast();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [pendingPresupuestos, setPendingPresupuestos] = useState<Presupuesto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [companyName, setCompanyName] = useState('AK Producciones');
  const [companyTaxId, setCompanyTaxId] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registrar' | 'pendientes'>('registrar');

  // Payment form state
  const [newPagoMonto, setNewPagoMonto] = useState('');
  const [newPagoMetodo, setNewPagoMetodo] = useState<MetodoPago>('Efectivo');
  const [newPagoReferencia, setNewPagoReferencia] = useState('');
  const [newPagoComprobante, setNewPagoComprobante] = useState<string | undefined>(undefined);
  const [newPagoComprobanteName, setNewPagoComprobanteName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showRecibo, setShowRecibo] = useState<{ pago: PagoCliente; presupuesto: Presupuesto } | null>(null);

  // Pending payments state
  const [processingPagoId, setProcessingPagoId] = useState<string | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allPresupuestos, socialConnections, companyInfo, pendientes, templateSettings] = await Promise.all([
        getPresupuestos(),
        getSocialConnections(),
        getCompanyInfo(),
        getPresupuestosWithPendingPayments(),
        getInvoiceTemplateSettings(),
      ]);

      const activeStates = ['Aceptado', 'Facturado'];
      setPresupuestos(
        allPresupuestos
          .filter(p => activeStates.includes(p.estado))
          .sort((a, b) => a.clienteNombre.localeCompare(b.clienteNombre))
      );
      setPendingPresupuestos(pendientes);

      const wp = socialConnections.find(c => c.platform === 'WhatsApp' && c.isConnected);
      if (wp?.phoneNumber) setWhatsappNumber(wp.phoneNumber);
      setCompanyName(companyInfo?.companyName || 'AK Producciones');
      setCompanyTaxId(companyInfo?.companyTaxId || '');
      setCompanyAddress(companyInfo?.companyAddress || '');
      setCompanyContact(companyInfo?.companyContact || '');
      setLogoUrl(templateSettings.logoUrl || null);
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredPresupuestos = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return presupuestos.filter(p =>
      p.clienteNombre.toLowerCase().includes(lower) ||
      (p.eventoTipo || '').toLowerCase().includes(lower) ||
      (p.numero?.toString() || '').includes(lower)
    );
  }, [presupuestos, searchTerm]);

  const pendingPaymentsCount = useMemo(() => {
    return pendingPresupuestos.reduce((count, p) =>
      count + (p.pagosCliente || []).filter(pago => pago.estadoPago === 'pendiente_confirmacion').length
    , 0);
  }, [pendingPresupuestos]);

  const getPresupuestoSummary = (p: Presupuesto) => {
    const totalCosto = p.totalConDescuento ?? p.costoTotalEstimado;
    const confirmedPagos = (p.pagosCliente || []).filter(pago => pago.estadoPago !== 'pendiente_confirmacion');
    const totalPagado = confirmedPagos.reduce((sum, pago) => sum + pago.monto, 0);
    return { totalCosto, totalPagado, saldoPendiente: totalCosto - totalPagado };
  };

  const handleRegistrarPago = async (presupuestoId: string) => {
    const monto = parseFloat(newPagoMonto);
    if (isNaN(monto) || monto <= 0) {
      toast({ title: 'Error', description: 'Ingresá un monto válido mayor a 0.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const result = await addPagoToPresupuesto(presupuestoId, {
        fecha: new Date().toISOString(),
        monto,
        metodoPago: newPagoMetodo,
        referencia: newPagoReferencia.trim() || undefined,
        estadoPago: 'confirmado',
        comprobanteUrl: newPagoComprobante,
      });
      if (!result.success) throw new Error(result.error);

      const newPago = result.presupuesto!.pagosCliente!.at(-1)!;
      setShowRecibo({ pago: newPago, presupuesto: result.presupuesto! });
      setNewPagoMonto('');
      setNewPagoReferencia('');
      setNewPagoMetodo('Efectivo');
      setNewPagoComprobante(undefined);
      setNewPagoComprobanteName('');

      // Update local state
      setPresupuestos(prev => prev.map(p => p.id === presupuestoId ? result.presupuesto! : p));
      toast({ title: '✅ Pago registrado', description: `${formatCurrency(monto)} guardado correctamente.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleComprobanteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!acceptedTypes.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Subí una imagen (PNG/JPG/WEBP) o PDF.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Archivo muy grande', description: 'El comprobante no debe superar 5MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewPagoComprobante(reader.result as string);
      setNewPagoComprobanteName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPago = async (presupuestoId: string, pagoId: string) => {
    setProcessingPagoId(pagoId);
    try {
      const result = await confirmPagoCliente(presupuestoId, pagoId);
      if (!result.success) throw new Error(result.error);
      toast({ title: '✅ Pago confirmado' });
      await fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setProcessingPagoId(null);
    }
  };

  const handleRejectPago = async (presupuestoId: string, pagoId: string) => {
    if (!rejectMotivo.trim()) {
      toast({ title: 'Error', description: 'Ingresá un motivo de rechazo.', variant: 'destructive' });
      return;
    }
    setProcessingPagoId(pagoId);
    try {
      const result = await rejectPagoCliente(presupuestoId, pagoId, rejectMotivo.trim());
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Pago rechazado', description: 'El pago fue rechazado y eliminado.' });
      setShowRejectInput(null);
      setRejectMotivo('');
      await fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setProcessingPagoId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm" className="rounded-xl h-10 px-3">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Pagos Rápidos</h1>
            <p className="text-xs text-slate-500 font-medium">Registrar y confirmar pagos desde el celular</p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('registrar')}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
              activeTab === 'registrar'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Registrar
          </button>
          <button
            onClick={() => setActiveTab('pendientes')}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative',
              activeTab === 'pendientes'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Pendientes
            {pendingPaymentsCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0 min-w-[20px]">
                {pendingPaymentsCount}
              </Badge>
            )}
          </button>
        </div>
      </header>

      {/* ── Tab: Registrar Pago ──────────────────────────────────── */}
      {activeTab === 'registrar' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar cliente o evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-xl text-sm border-slate-200"
            />
          </div>

          {/* Client list */}
          {filteredPresupuestos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">No hay presupuestos activos</p>
              <p className="text-xs mt-1">Los presupuestos con estado Aceptado o Facturado aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPresupuestos.map(p => {
                const summary = getPresupuestoSummary(p);
                const isExpanded = expandedId === p.id;

                return (
                  <Card key={p.id} className="border-slate-100 shadow-md rounded-2xl overflow-hidden">
                    {/* Collapsed header */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="w-full text-left p-4 sm:p-5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-slate-800 text-sm truncate">{p.clienteNombre}</h3>
                          <Badge variant="outline" className="text-[9px] font-bold shrink-0">#{p.numero}</Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter truncate">
                          {p.eventoTipo} · {formatDate(p.eventoFecha)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          'text-sm font-black',
                          summary.saldoPendiente <= 0 ? 'text-emerald-600' : 'text-amber-600'
                        )}>
                          {summary.saldoPendiente <= 0 ? '✅ Saldado' : formatCurrency(summary.saldoPendiente)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {summary.saldoPendiente > 0 ? 'pendiente' : ''}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-300 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-300 shrink-0" />}
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 pb-5 space-y-4">
                            <Separator />

                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-slate-50 rounded-xl p-3 text-center">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total</p>
                                <p className="font-black text-slate-800 text-sm">{formatCurrency(summary.totalCosto)}</p>
                              </div>
                              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                <p className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Pagado</p>
                                <p className="font-black text-emerald-700 text-sm">{formatCurrency(summary.totalPagado)}</p>
                              </div>
                              <div className={cn(
                                'rounded-xl p-3 text-center',
                                summary.saldoPendiente <= 0 ? 'bg-emerald-50' : 'bg-amber-50'
                              )}>
                                <p className={cn(
                                  'text-[9px] font-black uppercase tracking-widest',
                                  summary.saldoPendiente <= 0 ? 'text-emerald-500' : 'text-amber-500'
                                )}>Saldo</p>
                                <p className={cn(
                                  'font-black text-sm',
                                  summary.saldoPendiente <= 0 ? 'text-emerald-700' : 'text-amber-700'
                                )}>{formatCurrency(Math.max(0, summary.saldoPendiente))}</p>
                              </div>
                            </div>

                            {/* Previous payments */}
                            {(p.pagosCliente || []).length > 0 && (
                              <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Pagos anteriores</p>
                                <div className="space-y-1.5">
                                  {(p.pagosCliente || []).map(pago => (
                                    <div key={pago.id} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg p-2.5">
                                      <MetodoPagoIcon metodo={pago.metodoPago} />
                                      <span className="flex-1 text-slate-600">{formatDate(pago.fecha)}</span>
                                      <span className="font-bold text-emerald-700">{formatCurrency(pago.monto)}</span>
                                      {pago.estadoPago === 'pendiente_confirmacion' && (
                                        <Badge className="bg-amber-100 text-amber-700 text-[8px]">Pendiente</Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Payment form */}
                            {summary.saldoPendiente > 0 && (
                              <div className="space-y-3 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                                <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Registrar nuevo pago</p>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Monto</Label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={newPagoMonto}
                                      onChange={(e) => setNewPagoMonto(e.target.value)}
                                      className="h-12 rounded-xl text-lg font-black text-center"
                                      min="0"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Método</Label>
                                    <Select value={newPagoMetodo} onValueChange={(v) => setNewPagoMetodo(v as MetodoPago)}>
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
                                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Referencia (opcional)</Label>
                                  <Input
                                    placeholder="N° de transferencia, nota..."
                                    value={newPagoReferencia}
                                    onChange={(e) => setNewPagoReferencia(e.target.value)}
                                    className="h-10 rounded-xl text-sm"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Comprobante (imagen o PDF)</Label>
                                  <Input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                                    onChange={handleComprobanteUpload}
                                    className="h-10 rounded-xl text-xs"
                                  />
                                  {newPagoComprobanteName && (
                                    <p className="text-[10px] text-slate-500">Archivo: {newPagoComprobanteName}</p>
                                  )}
                                </div>

                                <Button
                                  onClick={() => handleRegistrarPago(p.id)}
                                  disabled={isSaving || !newPagoMonto}
                                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs"
                                >
                                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                  Registrar Pago
                                </Button>
                              </div>
                            )}

                            {/* Quick links */}
                            <div className="flex gap-2">
                              <Link href={`/presupuestos/${p.id}/estado-de-cuenta`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">
                                  <Receipt className="w-3.5 h-3.5 mr-1.5" /> Estado de Cuenta
                                </Button>
                              </Link>
                              <Link href={`/presupuestos/${p.id}/ver`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">
                                  <FileCheck2 className="w-3.5 h-3.5 mr-1.5" /> Ver Presupuesto
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Pagos Pendientes de Confirmación ────────────────── */}
      {activeTab === 'pendientes' && (
        <div className="space-y-4">
          {pendingPaymentsCount === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
              <p className="text-sm font-bold">No hay pagos pendientes</p>
              <p className="text-xs mt-1">Todos los pagos están confirmados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPresupuestos.map(p => {
                const pendingPagos = (p.pagosCliente || []).filter(pago => pago.estadoPago === 'pendiente_confirmacion');
                if (pendingPagos.length === 0) return null;

                return (
                  <Card key={p.id} className="border-amber-100 shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-amber-50/50 p-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-black text-slate-800">{p.clienteNombre}</CardTitle>
                          <CardDescription className="text-[10px] font-medium uppercase tracking-tighter">
                            {p.eventoTipo} · Presupuesto #{p.numero}
                          </CardDescription>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] font-bold">
                          {pendingPagos.length} pendiente{pendingPagos.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      {pendingPagos.map(pago => (
                        <div key={pago.id} className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-black text-lg text-slate-800">{formatCurrency(pago.monto)}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <MetodoPagoIcon metodo={pago.metodoPago} />
                                <span>{pago.metodoPago}</span>
                                <span>·</span>
                                <span>{formatDate(pago.fecha)}</span>
                              </div>
                            </div>
                            <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] font-bold uppercase tracking-wider">
                              <Clock className="w-3 h-3 mr-1" /> Pendiente
                            </Badge>
                          </div>

                          {pago.referencia && (
                            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                              📝 {pago.referencia}
                            </p>
                          )}

                          {pago.comprobanteUrl && (
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Comprobante adjunto</p>
                              {pago.comprobanteUrl.startsWith('data:application/pdf') ? (
                                <a
                                  href={pago.comprobanteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:underline"
                                >
                                  <FileCheck2 className="w-4 h-4" />
                                  Ver comprobante PDF
                                </a>
                              ) : (
                                <div className="relative w-full h-40 bg-slate-100 rounded-xl overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={pago.comprobanteUrl}
                                    alt="Comprobante de pago"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          {showRejectInput === pago.id ? (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Motivo del rechazo..."
                                value={rejectMotivo}
                                onChange={(e) => setRejectMotivo(e.target.value)}
                                className="rounded-xl text-sm min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => { setShowRejectInput(null); setRejectMotivo(''); }}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 rounded-xl"
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={() => handleRejectPago(p.id, pago.id)}
                                  disabled={processingPagoId === pago.id}
                                  size="sm"
                                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                                >
                                  {processingPagoId === pago.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar Rechazo'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleConfirmPago(p.id, pago.id)}
                                disabled={processingPagoId === pago.id}
                                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest"
                              >
                                {processingPagoId === pago.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirmar</>
                                )}
                              </Button>
                              <Button
                                onClick={() => setShowRejectInput(pago.id)}
                                disabled={processingPagoId === pago.id}
                                variant="outline"
                                className="flex-1 h-11 rounded-xl text-red-600 border-red-200 hover:bg-red-50 font-black text-xs uppercase tracking-widest"
                              >
                                <XCircle className="w-4 h-4 mr-1.5" /> Rechazar
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Receipt modal */}
      {showRecibo && (
        <ReciboView
          pago={showRecibo.pago}
          presupuesto={showRecibo.presupuesto}
          companyName={companyName}
          companyTaxId={companyTaxId}
          companyAddress={companyAddress}
          companyContact={companyContact}
          logoUrl={logoUrl}
          whatsappNumber={whatsappNumber}
          onClose={() => setShowRecibo(null)}
        />
      )}
    </div>
  );
}

export default function PagosRapidosPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <PagosRapidosContent />
    </Suspense>
  );
}
