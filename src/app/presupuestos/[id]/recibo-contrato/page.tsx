'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  FileCheck2,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Presupuesto, PagoCliente } from '@/types/presupuesto';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getInvoiceTemplateSettings, getCompanyInfo, getContractSettings } from '@/app/actions/settings';
import Image from 'next/image';
import { fillContractTemplate, buildContractFromSettings } from '@/lib/contract-template';
import type { ContractSettings } from '@/types/settings';

/* ── Helpers ─────────────────────────────────────────────────────────── */

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

/** Convert a number to its Spanish words (simplified for common UY amounts). */
function numberToSpanishWords(amount: number): string {
  const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
    'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (amount === 0) return 'cero';
  if (amount < 20) return ones[amount];
  if (amount < 100) {
    const t = Math.floor(amount / 10);
    const o = amount % 10;
    return o === 0 ? tens[t] : `${tens[t]} y ${ones[o]}`;
  }
  if (amount < 1000) {
    const h = Math.floor(amount / 100);
    const rest = amount % 100;
    const hundredWord = h === 1 && rest > 0 ? 'ciento' : hundreds[h];
    return rest === 0 ? hundredWord : `${hundredWord} ${numberToSpanishWords(rest)}`;
  }
  if (amount < 1000000) {
    const t = Math.floor(amount / 1000);
    const rest = amount % 1000;
    const thousandWord = t === 1 ? 'mil' : `${numberToSpanishWords(t)} mil`;
    return rest === 0 ? thousandWord : `${thousandWord} ${numberToSpanishWords(rest)}`;
  }
  return amount.toString();
}

const MetodoPagoIcon = ({ metodo }: { metodo: string }) => {
  switch (metodo) {
    case 'Efectivo': return <Banknote className="w-3.5 h-3.5" />;
    case 'MercadoPago': return <Smartphone className="w-3.5 h-3.5" />;
    case 'Transferencia Bancaria': return <CreditCard className="w-3.5 h-3.5" />;
    default: return <FileCheck2 className="w-3.5 h-3.5" />;
  }
};

/* ── Main component ──────────────────────────────────────────────────── */

function ReciboContratoContent({ params }: { params: { id: string } }) {
  const presupuestoId = params.id;

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('AK Producciones Eventos');
  const [companyAddress, setCompanyAddress] = useState('Gaboto 3390, Salto, Uruguay');
  const [companyContact, setCompanyContact] = useState('akproduccionessalto@gmail.com');
  const [contractSettings, setContractSettings] = useState<ContractSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedPresupuesto, templateSettings, companyInfo, contractSettingsData] = await Promise.all([
        getPresupuestoById(presupuestoId),
        getInvoiceTemplateSettings(),
        getCompanyInfo(),
        getContractSettings(),
      ]);

      if (!fetchedPresupuesto) {
        setError('Presupuesto no encontrado.');
        return;
      }

      setPresupuesto(fetchedPresupuesto);
      setLogoUrl(templateSettings.logoUrl || null);
      setCompanyName(companyInfo?.companyName || 'AK Producciones Eventos');
      setCompanyAddress(companyInfo?.companyAddress || 'Gaboto 3390, Salto, Uruguay');
      setCompanyContact(companyInfo?.companyContact || 'akproduccionessalto@gmail.com');
      setContractSettings(contractSettingsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos.');
    } finally {
      setIsLoading(false);
    }
  }, [presupuestoId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { totalCosto, totalPagado, saldoPendiente, pagos } = useMemo(() => {
    if (!presupuesto) return { totalCosto: 0, totalPagado: 0, saldoPendiente: 0, pagos: [] as PagoCliente[] };
    const total = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
    const pagosList: PagoCliente[] = presupuesto.pagosCliente || [];
    const pagado = pagosList.reduce((sum, p) => sum + p.monto, 0);
    return { totalCosto: total, totalPagado: pagado, saldoPendiente: total - pagado, pagos: pagosList };
  }, [presupuesto]);

  /** Build the first seña amount from the first recorded payment, or default to 0. */
  const primerPago = pagos[0]?.monto ?? 0;

  const contractText = useMemo(() => {
    if (!presupuesto) return '';
    const today = new Date();
    const ciudadFecha = `Salto, a los ${today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

    const montoSenaNum = primerPago;
    const montoSenaWords = numberToSpanishWords(montoSenaNum);
    const montoSenaStr = `$ ${montoSenaNum.toLocaleString('es-UY')} (pesos uruguayos ${montoSenaWords})`;

    return fillContractTemplate({
      ciudadFecha,
      clienteNombre: presupuesto.clienteNombre,
      clienteDomicilio: '___________________',
      clienteCi: '___________________',
      clienteTelefono: presupuesto.clienteContacto || '___________________',
      fechaEvento: presupuesto.eventoFecha
        ? new Date(presupuesto.eventoFecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '___________________',
      salon: presupuesto.salonFiestas || '___________________',
      montoSena: montoSenaStr,
    });
  }, [presupuesto, primerPago]);

  const { contractIntro, contractClauses } = useMemo(() => {
    if (!presupuesto || !contractSettings) return { contractIntro: '', contractClauses: [] as { title: string; content: string }[] };
    const today = new Date();
    const ciudadFecha = `Salto, a los ${today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

    const montoSenaNum = primerPago;
    const montoSenaWords = numberToSpanishWords(montoSenaNum);
    const montoSenaStr = `$ ${montoSenaNum.toLocaleString('es-UY')} (pesos uruguayos ${montoSenaWords})`;

    const result = buildContractFromSettings(contractSettings, {
      ciudadFecha,
      clienteNombre: presupuesto.clienteNombre,
      // Check both field names for backward compatibility with different data sources
      clienteDomicilio: (presupuesto as any).clienteDomicilio || (presupuesto as any).clienteAddress || '___________________',
      clienteCi: (presupuesto as any).clienteCi || '___________________',
      clienteTelefono: presupuesto.clienteContacto || '___________________',
      fechaEvento: presupuesto.eventoFecha
        ? new Date(presupuesto.eventoFecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '___________________',
      salon: presupuesto.salonFiestas || '___________________',
      montoSena: montoSenaStr,
    });

    return {
      contractIntro: result.intro,
      contractClauses: result.clauses,
    };
  }, [presupuesto, contractSettings, primerPago]);

  const handlePrint = () => window.print();

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
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button>
        </Link>
      </div>
    );

  const isPaid = saldoPendiente <= 0;

  return (
    <div className="bg-slate-100 min-h-screen print:bg-white print:min-h-0">

      {/* ── Web-only toolbar ─────────────────────────────────────────── */}
      <div className="print:hidden sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex justify-between items-center gap-3 shadow-sm">
        <Link href={`/presupuestos/${presupuestoId}/ver`}>
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Presupuesto
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            El PDF incluirá el recibo (pág. 1) y el contrato (págs. 2–3)
          </span>
          <Button onClick={handlePrint} size="sm" className="rounded-xl bg-primary hover:bg-primary/90 text-white">
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PAGE 1 — PREMIUM RECEIPT
      ══════════════════════════════════════════════════════════════ */}
      <div className="print:break-after-page">
        <div className="max-w-2xl mx-auto py-8 px-4 print:p-0 print:py-0">
          <div className="bg-white rounded-3xl print:rounded-none shadow-2xl print:shadow-none overflow-hidden">

            {/* Header bar */}
            <div className="bg-primary px-8 py-7 print:px-6 print:py-5 flex justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="w-14 h-14 relative shrink-0 bg-white/10 rounded-xl overflow-hidden">
                    <Image src={logoUrl} alt="Logo" fill className="object-contain p-1" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-sm font-black uppercase text-white text-center leading-tight px-1">AK</span>
                  </div>
                )}
                <div className="text-white space-y-0.5">
                  <h1 className="text-xl font-black uppercase tracking-tight">{companyName}</h1>
                  <p className="text-[10px] opacity-75 font-medium">RUT: 220372680019</p>
                  {companyAddress && <p className="text-[10px] opacity-70 font-medium">{companyAddress}</p>}
                  {companyContact && <p className="text-[10px] opacity-70 font-medium">{companyContact}</p>}
                </div>
              </div>
              <div className="text-white text-right shrink-0">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Documento</p>
                <p className="text-base font-black uppercase tracking-tight">Recibo de Pago</p>
                <p className="text-[10px] opacity-60 mt-0.5">
                  {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="px-8 py-8 print:px-6 print:py-6 space-y-7">

              {/* Client & event grid */}
              <section className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Cliente</p>
                  <p className="font-bold text-slate-900">{presupuesto.clienteNombre}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Tipo de Evento</p>
                  <p className="font-bold text-slate-900">{presupuesto.eventoTipo}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Fecha del Evento</p>
                  <p className="font-bold text-slate-900">{formatDate(presupuesto.eventoFecha)}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Salón</p>
                  <p className="font-bold text-slate-900">{presupuesto.salonFiestas || '—'}</p>
                </div>
                {presupuesto.clienteContacto && (
                  <div className="space-y-0.5 col-span-2">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Contacto</p>
                    <p className="font-medium text-slate-700">{presupuesto.clienteContacto}</p>
                  </div>
                )}
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">N° de Presupuesto</p>
                  <p className="font-bold text-slate-900">#{presupuesto.numero || presupuesto.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Invitados</p>
                  <p className="font-bold text-slate-900">{presupuesto.invitadosCantidad}</p>
                </div>
              </section>

              <Separator />

              {/* Financial summary — 3 prominent cards */}
              <section className="space-y-3">
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resumen Financiero</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl print:rounded-lg p-4 text-center space-y-1">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Presupuesto Total</p>
                    <p className="text-lg font-black text-slate-900 leading-tight">{formatCurrency(totalCosto)}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl print:rounded-lg p-4 text-center space-y-1">
                    <p className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Total Abonado</p>
                    <p className="text-lg font-black text-emerald-700 leading-tight">{formatCurrency(totalPagado)}</p>
                  </div>
                  <div className={`rounded-2xl print:rounded-lg p-4 text-center space-y-1 border ${isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {isPaid ? 'Cuenta Saldada' : 'Saldo Pendiente'}
                    </p>
                    <p className={`text-lg font-black leading-tight ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isPaid ? formatCurrency(0) : formatCurrency(saldoPendiente)}
                    </p>
                  </div>
                </div>

                {/* Balance row */}
                <div className={`flex justify-between items-center rounded-xl px-4 py-3 ${isPaid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <span className={`font-black uppercase text-sm tracking-tight flex items-center gap-2 ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {isPaid ? 'EVENTO 100% CANCELADO' : 'SALDO PENDIENTE DE PAGO'}
                  </span>
                  <span className={`font-black text-2xl ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isPaid ? '✓' : formatCurrency(saldoPendiente)}
                  </span>
                </div>
              </section>

              <Separator />

              {/* Payment history table */}
              <section className="space-y-3">
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Historial de Pagos Recibidos
                </h2>
                {pagos.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                    Sin pagos registrados aún
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 pl-4 text-slate-500">#</TableHead>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 text-slate-500">Fecha</TableHead>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 text-slate-500">Método</TableHead>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 text-slate-500">Referencia</TableHead>
                          <TableHead className="text-[9px] font-black uppercase tracking-widest py-3 pr-4 text-right text-slate-500">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagos.map((pago, idx) => (
                          <TableRow key={pago.id} className="text-sm border-t border-slate-100">
                            <TableCell className="pl-4 py-3 text-slate-400 text-xs font-bold">{idx + 1}</TableCell>
                            <TableCell className="py-3 font-medium text-slate-700">{formatDate(pago.fecha)}</TableCell>
                            <TableCell className="py-3">
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit text-[9px] font-bold uppercase">
                                <MetodoPagoIcon metodo={pago.metodoPago} />
                                {pago.metodoPago}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-slate-400 text-xs max-w-[100px] truncate">{pago.referencia || '—'}</TableCell>
                            <TableCell className="pr-4 py-3 text-right font-black text-emerald-700">{formatCurrency(pago.monto)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50 border-t-2 border-slate-200">
                          <TableCell colSpan={4} className="pl-4 py-3 text-xs font-black uppercase text-slate-500 tracking-wide">Total Abonado</TableCell>
                          <TableCell className="pr-4 py-3 text-right font-black text-emerald-700 text-base">{formatCurrency(totalPagado)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              <Separator />

              {/* Footer note */}
              <div className="text-center space-y-1 pb-2">
                <p className="text-[10px] text-slate-400 font-medium">
                  Documento generado por <strong>{companyName}</strong> · {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-[9px] text-slate-300">
                  Presupuesto #{presupuesto.numero || presupuesto.id.slice(-6).toUpperCase()} · Este documento tiene validez como comprobante de pago.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PAGES 2–3 — LEGAL CONTRACT
      ══════════════════════════════════════════════════════════════ */}
      <div className="print:break-before-page">
        <div className="max-w-2xl mx-auto py-8 px-4 print:p-0 print:py-0 print:max-w-none">
          <div className="bg-white rounded-3xl print:rounded-none shadow-2xl print:shadow-none overflow-hidden">

            {/* Contract header bar */}
            <div className="bg-slate-800 px-8 py-5 print:px-6 print:py-4 flex justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="w-10 h-10 relative shrink-0 bg-white/10 rounded-lg overflow-hidden">
                    <Image src={logoUrl} alt="Logo" fill className="object-contain p-1" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs font-black uppercase text-white">AK</span>
                  </div>
                )}
                <div className="text-white">
                  <p className="font-black uppercase tracking-tight text-sm">{companyName}</p>
                  <p className="text-[9px] opacity-60">RUT: 220372680019</p>
                </div>
              </div>
              <div className="text-right text-white">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Anexo Legal</p>
                <p className="text-sm font-black uppercase tracking-tight">Contrato de Servicios</p>
                <p className="text-[9px] opacity-50 mt-0.5">Cliente: {presupuesto.clienteNombre}</p>
              </div>
            </div>

            {/* Contract body */}
            <div className="px-8 py-6 print:px-8 print:py-4">
              {/* Title */}
              <h2 className="text-center text-sm font-black uppercase tracking-wide text-slate-900 mb-4 pb-3 border-b-2 border-slate-200">
                CONTRATO DE PRESTACIÓN DE SERVICIOS PARA EVENTOS
              </h2>

              {/* Intro paragraph */}
              <p className="text-[10px] print:text-[9pt] leading-relaxed text-slate-600 mb-3 text-justify">
                {contractIntro}
              </p>

              {/* Clauses */}
              <div className="space-y-0">
                {contractClauses.map((clause, idx) => (
                  <div key={idx} className={`py-2 ${idx < contractClauses.length - 1 ? 'border-b border-slate-200' : ''}`}>
                    <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-wider mb-0.5">
                      {clause.title}
                    </h3>
                    <p className="text-[10px] print:text-[9pt] leading-relaxed text-slate-600 text-justify">
                      {clause.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Signature block — always shown at bottom of contract */}
              <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8">
                <div>
                  <div className="border-b border-slate-400 h-12" />
                  <p className="text-[9px] font-black uppercase text-slate-500 mt-1 text-center tracking-wider">
                    {contractSettings?.companySignerRole || 'POR AK PRODUCCIONES EVENTOS'}
                  </p>
                  <p className="text-[9px] text-slate-400 text-center">{contractSettings?.companySignerName || 'Tec. Alexander Knuth'}</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-12" />
                  <p className="text-[9px] font-black uppercase text-slate-500 mt-1 text-center tracking-wider">
                    EL CLIENTE
                  </p>
                  <p className="text-[9px] text-slate-400 text-center">{presupuesto.clienteNombre}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Print styles ─────────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          header, footer, button, .sidebar, .no-print,
          .notifications-hub, .sidebar-inset > header, aside, nav {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 10pt;
            color: #1e293b;
          }
          .shadow-xl, .shadow-2xl, .shadow-lg, .shadow-md {
            box-shadow: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .max-w-2xl {
            max-width: 100% !important;
            margin: 0 !important;
          }
          section { page-break-inside: avoid; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e2e8f0; }
          @page {
            size: A4 portrait;
            margin: 1.2cm 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}

export default function ReciboContratoPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <ReciboContratoContent params={params} />
    </Suspense>
  );
}
