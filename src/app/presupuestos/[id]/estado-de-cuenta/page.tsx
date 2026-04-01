'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, MessageCircle, CheckCircle2, Clock, AlertCircle, Loader2, CreditCard, Banknote, Smartphone, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Presupuesto, PagoCliente } from '@/types/presupuesto';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getSocialConnections } from '@/app/actions/social-connections';
import { getInvoiceTemplateSettings, getCompanyInfo } from '@/app/actions/settings';
import Image from 'next/image';
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
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const MetodoPagoIcon = ({ metodo }: { metodo: string }) => {
  switch (metodo) {
    case 'Efectivo':
      return <Banknote className="w-3.5 h-3.5" />;
    case 'MercadoPago':
      return <Smartphone className="w-3.5 h-3.5" />;
    case 'Transferencia Bancaria':
      return <CreditCard className="w-3.5 h-3.5" />;
    default:
      return <FileCheck2 className="w-3.5 h-3.5" />;
  }
};

function EstadoDeCuentaContent({ params }: { params: { id: string } }) {
  const presupuestoId = params.id;

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('AK Producciones');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedPresupuesto, templateSettings, socialConnections, companyInfo] =
        await Promise.all([
          getPresupuestoById(presupuestoId),
          getInvoiceTemplateSettings(),
          getSocialConnections(),
          getCompanyInfo(),
        ]);

      if (!fetchedPresupuesto) {
        setError('Presupuesto no encontrado.');
        return;
      }

      setPresupuesto(fetchedPresupuesto);
      setLogoUrl(templateSettings.logoUrl || null);
      setCompanyName(companyInfo?.companyName || 'AK Producciones');

      const wp = socialConnections.find(c => c.platform === 'WhatsApp' && c.isConnected);
      if (wp?.phoneNumber) setWhatsappNumber(wp.phoneNumber);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos.');
    } finally {
      setIsLoading(false);
    }
  }, [presupuestoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { totalCosto, totalPagado, saldoPendiente, pagos } = useMemo(() => {
    if (!presupuesto) return { totalCosto: 0, totalPagado: 0, saldoPendiente: 0, pagos: [] };
    const total = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
    const pagos: PagoCliente[] = presupuesto.pagosCliente || [];
    const pagado = pagos.reduce((sum, p) => sum + p.monto, 0);
    return {
      totalCosto: total,
      totalPagado: pagado,
      saldoPendiente: total - pagado,
      pagos,
    };
  }, [presupuesto]);

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    if (!presupuesto) return;
    const url = window.location.href;
    const saldoText =
      saldoPendiente <= 0
        ? '✅ Tu cuenta está saldada. ¡Muchas gracias!'
        : `💳 Saldo pendiente: ${formatCurrency(saldoPendiente)}`;
    const texto =
      `📋 *Estado de Cuenta — ${companyName}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Cliente:* ${presupuesto.clienteNombre}\n` +
      `🎉 *Evento:* ${presupuesto.eventoTipo} — ${formatDate(presupuesto.eventoFecha)}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Total del evento:* ${formatCurrency(totalCosto)}\n` +
      `✅ *Total pagado:* ${formatCurrency(totalPagado)}\n` +
      `${saldoText}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔗 Ver detalle completo:\n${url}`;

    const target = whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(target, '_blank');
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  if (error || !presupuesto)
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 text-center p-8">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-lg font-bold">{error || 'No se encontró el presupuesto.'}</p>
        <Link href="/presupuestos/nuevo">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        </Link>
      </div>
    );

  const isPaid = saldoPendiente <= 0;

  return (
    <div className="bg-gray-50 min-h-screen py-6 print:bg-white print:py-0">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden flex justify-between items-center mb-6 max-w-2xl mx-auto px-4">
        <Link href={`/presupuestos/${presupuestoId}/ver`}>
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Presupuesto
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button onClick={handlePrint} size="sm" className="rounded-xl">
            <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
          </Button>
          <Button
            onClick={handleWhatsApp}
            size="sm"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" /> Enviar por WhatsApp
          </Button>
        </div>
      </div>

      {/* Main document */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-white shadow-xl print:shadow-none rounded-[2rem] print:rounded-none overflow-hidden"
      >
        {/* Header */}
        <div className="bg-primary px-8 py-6 print:px-6 print:py-4 flex justify-between items-center">
          <div className="text-white space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Estado de Cuenta</p>
            <h1 className="text-xl font-black uppercase tracking-tight">{companyName}</h1>
          </div>
          {logoUrl ? (
            <div className="w-14 h-14 relative shrink-0 bg-white/10 rounded-xl overflow-hidden">
              <Image src={logoUrl} alt="Logo" fill className="object-contain p-1" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-[8px] font-black uppercase text-white text-center leading-tight px-1">AK</span>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-10 print:p-6 space-y-8">
          {/* Client & event info */}
          <section className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Cliente</p>
              <p className="font-bold text-slate-900">{presupuesto.clienteNombre}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Tipo de Evento</p>
              <p className="font-bold text-slate-900">{presupuesto.eventoTipo}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Fecha del Evento</p>
              <p className="font-bold text-slate-900">{formatDate(presupuesto.eventoFecha)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Presupuesto N°</p>
              <p className="font-bold text-slate-900">#{presupuesto.numero || presupuesto.id.slice(-6)}</p>
            </div>
          </section>

          <Separator />

          {/* Balance summary */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Resumen de Cuenta
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">Costo Total del Evento</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalCosto)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Total Recibido
                </span>
                <span className="font-bold text-emerald-700">{formatCurrency(totalPagado)}</span>
              </div>
              <Separator />
              <div
                className={`flex justify-between items-center rounded-xl p-3 ${
                  isPaid
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <span
                  className={`font-black uppercase text-sm tracking-tight flex items-center gap-2 ${
                    isPaid ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isPaid ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {isPaid ? 'CUENTA SALDADA' : 'SALDO PENDIENTE'}
                </span>
                <span
                  className={`font-black text-xl ${
                    isPaid ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isPaid ? formatCurrency(0) : formatCurrency(saldoPendiente)}
                </span>
              </div>
            </div>
          </section>

          {/* Payment history */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Historial de Pagos Recibidos
            </h2>
            {pagos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
                Sin pagos registrados
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 pl-4">
                        Fecha
                      </TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">
                        Método
                      </TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest py-3">
                        Referencia
                      </TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 pr-4 text-right">
                        Monto
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago, index) => (
                      <TableRow key={pago.id} className="text-sm">
                        <TableCell className="pl-4 py-3 font-medium text-slate-700">
                          {formatDate(pago.fecha)}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 w-fit text-[9px] font-bold uppercase"
                          >
                            <MetodoPagoIcon metodo={pago.metodoPago} />
                            {pago.metodoPago}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground text-xs max-w-[120px] truncate">
                          {pago.referencia || '—'}
                        </TableCell>
                        <TableCell className="pr-4 py-3 text-right font-bold text-emerald-700">
                          {formatCurrency(pago.monto)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* Footer note */}
          <Separator />
          <p className="text-center text-[10px] text-muted-foreground">
            Documento generado por {companyName} · {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>
      </motion.div>

      <style jsx global>{`
        @media print {
          header,
          footer,
          button,
          .sidebar,
          .no-print,
          .notifications-hub,
          .sidebar-inset > header,
          aside {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .shadow-xl {
            box-shadow: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm 1cm;
          }
        }
      `}</style>
    </div>
  );
}

export default function EstadoDeCuentaPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <EstadoDeCuentaContent params={params} />
    </Suspense>
  );
}
