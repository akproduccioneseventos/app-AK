/**
 * BudgetDocument — Unified formal budget document component for AK Producciones.
 * Resolves duplicate templates across step 4 summary, Client Portal `/ver`, and PDF exports.
 */

import React from 'react';
import Image from 'next/image';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import type { AnnualAdjustmentProjection } from '@/lib/budget/formal-budget';
import { Gift, CheckCircle2 } from 'lucide-react';
import { DEFAULT_BOOKING_DEPOSIT_AMOUNT } from '@/lib/budget/formal-budget';

// ── Company constants ─────────────────────────────────────────────────────────
const COMPANY_NAME = 'AK PRODUCCIONES';
const COMPANY_CONTACT_PERSON = 'SR. Alexander Knuth';
const COMPANY_ADDRESS_LINE1 = 'Salto';
const COMPANY_ADDRESS_LINE2 = '50000 Salto';
const COMPANY_EMAIL = 'akproduccionessalto@gmail.com';
const COMPANY_WEBSITE = 'www.akproduccioneseventos.com';
const BUDGET_VALIDITY_DAYS = 30;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(amount?: number): string {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  const formatted = new Intl.NumberFormat('es-UY', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `$ ${formatted}`;
}

function formatDateShort(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    const day = dateString.includes('T') ? d.getUTCDate() : d.getDate();
    const month = dateString.includes('T') ? d.getUTCMonth() + 1 : d.getMonth() + 1;
    const year = dateString.includes('T') ? d.getUTCFullYear() : d.getFullYear();
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  } catch {
    return '—';
  }
}

function formatDateLong(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    const day = dateString.includes('T') ? d.getUTCDate() : d.getDate();
    const month = dateString.includes('T') ? d.getUTCMonth() : d.getMonth();
    const year = dateString.includes('T') ? d.getUTCFullYear() : d.getFullYear();
    return new Date(year, month, day).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function getItemUnitLabel(item: ItemPresupuestado): string {
  if (item.unidad) return item.unidad;
  if (item.calculationMethod === 'porPersona') return 'persona';
  return 'serv.';
}

export interface BudgetDocumentProps {
  presupuesto: Presupuesto;
  logoUrl?: string | null;
  adjustmentPct?: number;
  annualAdjustmentAmount?: number;
  showPriceBreakdown?: boolean;
  annualProjection?: AnnualAdjustmentProjection;
  pricePerPerson?: number;
  bookingDepositAmount?: number;
  clienteNombre?: string;
  showSignatures?: boolean;
  clubUruguayCosto?: number;
  itemsAgrupadosOverride?: Record<string, ItemPresupuestado[]>;
  subtotalBrutoOverride?: number;
  descuentoPromoOverride?: number;
  totalFinalOverride?: number;
}

export default function BudgetDocument({
  presupuesto,
  logoUrl,
  adjustmentPct = 15,
  annualAdjustmentAmount = 0,
  showPriceBreakdown = true,
  annualProjection,
  pricePerPerson = 0,
  bookingDepositAmount = DEFAULT_BOOKING_DEPOSIT_AMOUNT,
  clienteNombre,
  showSignatures = false,
  clubUruguayCosto = 0,
  itemsAgrupadosOverride,
  subtotalBrutoOverride,
  descuentoPromoOverride,
  totalFinalOverride,
}: BudgetDocumentProps) {
  const budgetNumber =
    presupuesto.numero ||
    (presupuesto.id.split('_').pop() || presupuesto.id).substring(0, 6).toUpperCase();

  const clientName = clienteNombre || presupuesto.clienteNombre;

  const validUntil = new Date(presupuesto.timestamp);
  validUntil.setDate(validUntil.getDate() + BUDGET_VALIDITY_DAYS);

  // Group items by category if no override is provided
  const itemsAgrupados = React.useMemo(() => {
    if (itemsAgrupadosOverride) return itemsAgrupadosOverride;

    const itemsRegulares = presupuesto.itemsPresupuestados.filter((i) => !i.esRegalo);
    const itemsRegalo = presupuesto.itemsPresupuestados.filter((i) => i.esRegalo);

    const agrupados: Record<string, ItemPresupuestado[]> = itemsRegulares.reduce(
      (acc, item) => {
        const cat = item.categoriaServicio || 'Otros Servicios';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      },
      {} as Record<string, ItemPresupuestado[]>,
    );

    const sortedKeys = Object.keys(agrupados).sort((a, b) => a.localeCompare(b));
    const sortedAgrupados: Record<string, ItemPresupuestado[]> = {};
    sortedKeys.forEach((key) => {
      sortedAgrupados[key] = agrupados[key];
    });

    if (itemsRegalo.length > 0) sortedAgrupados['Regalos Incluidos'] = itemsRegalo;

    return sortedAgrupados;
  }, [presupuesto, itemsAgrupadosOverride]);

  const subtotalBruto = subtotalBrutoOverride ?? presupuesto.costoTotalEstimado;
  const totalFinal = totalFinalOverride ?? presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
  const descuentoPromo = descuentoPromoOverride ?? Math.max(0, subtotalBruto - totalFinal);

  const projectionRows = annualProjection?.rows?.length
    ? annualProjection.rows
    : annualAdjustmentAmount > 0
      ? [{
          year: new Date(presupuesto.eventoFecha || presupuesto.timestamp).getFullYear(),
          total: totalFinal + annualAdjustmentAmount,
          adjustmentAmount: annualAdjustmentAmount,
        }]
      : [];

  const totalGuests =
    (presupuesto.invitadosAdultos || 0) +
    (presupuesto.invitadosNinos || 0) +
    (presupuesto.invitadosAdolescentes || 0) ||
    presupuesto.invitadosCantidad ||
    0;

  const clubUruguayItem = presupuesto.itemsPresupuestados.find(
    (item) => item.idServicioCatalogo === 'serv_salon_club_uruguay'
  );
  const clubUruguayCostoCalculated = clubUruguayCosto > 0
    ? clubUruguayCosto
    : clubUruguayItem
      ? Math.round((clubUruguayItem.precioUnitarioPresupuesto || clubUruguayItem.precioUnitario || 0) * (clubUruguayItem.cantidad || 1))
      : 0;

  return (
    <>
      <div className="budget-formal-print-template bg-white text-slate-800 p-4 sm:p-10 border border-slate-200 rounded-2xl shadow-sm print:border-none print:p-0 print:shadow-none" id="budget-print-area">
        {/* HEADER */}
        <h1
          className="text-center text-base sm:text-lg font-extrabold uppercase tracking-wide text-gray-900 print:text-[12pt] mb-4 pb-1"
          style={{ borderBottom: '2px solid #0f172a' }}
        >
          Presupuesto para fiestas o eventos — {COMPANY_NAME}
        </h1>

        <div className="flex justify-between items-start gap-4 mb-4">
          {/* Company info — left column */}
          <div className="space-y-0.5 text-xs print:text-[8pt] text-slate-600 print:text-slate-700">
            <p className="font-bold text-gray-800">{COMPANY_CONTACT_PERSON}</p>
            <p>{COMPANY_ADDRESS_LINE1}</p>
            <p>{COMPANY_ADDRESS_LINE2}</p>
            <p>{COMPANY_EMAIL}</p>
            <p>{COMPANY_WEBSITE}</p>
          </div>

          {/* Logo — right column */}
          <div className="flex-shrink-0">
            {logoUrl ? (
              <div className="w-20 h-20 print:w-[65px] print:h-[65px] relative">
                <Image
                  src={logoUrl}
                  alt={`${COMPANY_NAME} Logo`}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            ) : (
              <svg
                width="72"
                height="72"
                viewBox="0 0 72 72"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="AK Producciones logo"
              >
                <circle cx="36" cy="36" r="36" fill="#c0392b" />
                <text
                  x="36"
                  y="42"
                  textAnchor="middle"
                  fill="white"
                  fontSize="26"
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                >
                  AK
                </text>
                <text
                  x="36"
                  y="56"
                  textAnchor="middle"
                  fill="white"
                  fontSize="7"
                  fontFamily="Arial, sans-serif"
                  letterSpacing="1"
                >
                  PRODUCCIONES
                </text>
              </svg>
            )}
          </div>
        </div>

        {/* Centered label */}
        <p
          className="text-center font-bold text-xs uppercase tracking-widest text-slate-700 mb-4 print:text-[9pt]"
          style={{ backgroundColor: '#f1f5f9', padding: '6px 0', borderRadius: '4px' }}
        >
          Detalle del Presupuesto
        </p>

        {/* Document data table */}
        <section className="mb-4">
          <table className="w-full text-xs print:text-[8pt] border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th className="border border-slate-300 px-2 py-1.5 text-left font-semibold text-slate-700">
                  Número de cliente
                </th>
                <th className="border border-slate-300 px-2 py-1.5 text-left font-semibold text-slate-700">
                  Número de Documento
                </th>
                <th className="border border-slate-300 px-2 py-1.5 text-center font-semibold text-slate-700">
                  Página
                </th>
                <th className="border border-slate-300 px-2 py-1.5 text-left font-semibold text-slate-700">
                  Fecha
                </th>
                <th className="border border-slate-300 px-2 py-1.5 text-left font-semibold text-slate-700">
                  Válido hasta
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#ffffff' }}>
                <td className="border border-slate-200 px-2 py-1.5 font-mono text-slate-600">
                  {clientName.substring(0, 3).toUpperCase()}-
                  {presupuesto.id.substring(0, 4).toUpperCase()}
                </td>
                <td className="border border-slate-200 px-2 py-1.5 font-mono font-semibold text-slate-800">
                  #{budgetNumber}
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-600">1/1</td>
                <td className="border border-slate-200 px-2 py-1.5 text-slate-600">
                  {formatDateShort(presupuesto.timestamp)}
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-slate-600">
                  {formatDateShort(validUntil.toISOString())}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Client + event info */}
        <section className="mb-4 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs print:text-[8pt]">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Cliente
              </p>
              <p className="font-bold text-slate-700">{clientName}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Fecha del evento
              </p>
              <p className="font-bold text-slate-700">{formatDateLong(presupuesto.eventoFecha)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Tipo de evento
              </p>
              <p className="font-bold text-slate-700">{presupuesto.eventoTipo}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Invitados
              </p>
              <p className="font-bold text-slate-700">{totalGuests || presupuesto.invitadosCantidad || 0}</p>
            </div>
            {presupuesto.salonFiestas && (
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Salón
                </p>
                <p className="font-bold text-slate-700">{presupuesto.salonFiestas}</p>
              </div>
            )}
            {presupuesto.clienteContacto && (
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Contacto
                </p>
                <p className="font-bold text-slate-700">{presupuesto.clienteContacto}</p>
              </div>
            )}
          </div>
        </section>

        {/* Items table */}
        {showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0 && (
          <section className="mb-4">
            <table className="w-full text-xs print:text-[8pt] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th
                    className="border border-slate-800 px-3 py-2 text-left font-semibold"
                    style={{ width: '38%' }}
                  >
                    Artículo
                  </th>
                  <th className="border border-slate-800 px-3 py-2 text-center font-semibold">
                    Cantidad
                  </th>
                  <th className="border border-slate-800 px-3 py-2 text-center font-semibold">
                    Unidad
                  </th>
                  <th className="border border-slate-800 px-3 py-2 text-right font-semibold">
                    Precio
                  </th>
                  <th className="border border-slate-800 px-3 py-2 text-center font-semibold">
                    Desc.%
                  </th>
                  <th className="border border-slate-800 px-3 py-2 text-right font-semibold">
                    Importe total
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(itemsAgrupados).map(([categoria, items], catIdx) => {
                  const sortedItems = (() => {
                    if (categoria.toLowerCase().includes('catering')) {
                      return [...items].sort((a, b) => {
                        const getScore = (x: typeof a) => {
                          const name = (x.nombreServicio || '').toLowerCase();
                          const subcat = (x.subcategoria || '').toLowerCase();
                          if (name.includes('vajilla') || name.includes('manteler') || name.includes('mobiliario') || name.includes('moviliario')) {
                            return 1;
                          }
                          if (name.includes('entrada') || subcat.includes('entrada')) {
                            return 2;
                          }
                          if (name.includes('principal') || name.includes('plato') || subcat.includes('principal')) {
                            return 3;
                          }
                          if (name.includes('niño') || name.includes('nino') || name.includes('adolescente') || name.includes('infantil')) {
                            return 4;
                          }
                          return 5;
                        };
                        return getScore(a) - getScore(b);
                      });
                    }
                    return items;
                  })();

                  return (
                    <React.Fragment key={categoria}>
                      <tr className="bg-slate-100/80">
                        <td
                          colSpan={6}
                          className="border border-slate-300 px-3 py-1 font-bold text-slate-700 uppercase tracking-wide text-[10px] print:text-[7.5pt]"
                        >
                          {categoria}
                        </td>
                      </tr>
                      {sortedItems.map((item, itemIdx) => {
                        const displayName = (() => {
                          const name = item.nombreServicio;
                          if (categoria.toLowerCase().includes('catering')) {
                            const lowerName = name.toLowerCase();
                            const subcat = (item.subcategoria || '').toLowerCase();
                            if ((lowerName.includes('entrada') || subcat.includes('entrada')) && !lowerName.startsWith('entrada')) {
                              return `entradas: ${name}`;
                            }
                            if ((lowerName.includes('principal') || lowerName.includes('plato') || subcat.includes('principal')) && !lowerName.includes('plato principal')) {
                              return `plato principal: ${name}`;
                            }
                            if ((lowerName.includes('niño') || lowerName.includes('nino') || lowerName.includes('adolescente') || lowerName.includes('infantil')) && !lowerName.includes('niño')) {
                              return `menu niño y adolescente: ${name}`;
                            }
                          }
                          return name;
                        })();

                        return (
                          <tr
                            key={`${catIdx}-${itemIdx}`}
                            className="bg-white border-b border-slate-200"
                          >
                            <td 
                              className="border border-slate-200 px-3 py-2 align-top"
                              style={{ color: item.esRegalo ? '#dc2626' : '#334155' }}
                            >
                              {item.esRegalo ? (
                                <div className="flex items-center gap-1">
                                  <Gift className="w-3.5 h-3.5 text-rose-600 shrink-0 print:hidden" />
                                  <div>
                                    <span className="italic font-bold text-rose-600">{displayName}</span>
                                    <span className="text-[10px] text-slate-400 italic block print:text-[7pt]">Regalo incluido</span>
                                  </div>
                                </div>
                              ) : (
                                displayName
                              )}
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-center align-top" style={{ color: item.esRegalo ? '#dc2626' : undefined }}>
                              {item.cantidad}
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-center align-top" style={{ color: item.esRegalo ? '#dc2626' : undefined }}>
                              {getItemUnitLabel(item)}
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right align-top font-mono" style={{ color: item.esRegalo ? '#dc2626' : undefined }}>
                              {formatCurrency(item.precioUnitarioPresupuesto ?? item.precioUnitario)}
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-center align-top" style={{ color: item.esRegalo ? '#dc2626' : undefined }}>
                              {item.esRegalo ? '100%' : '—'}
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right align-top font-semibold font-mono" style={{ color: item.esRegalo ? '#dc2626' : undefined }}>
                              {item.esRegalo ? '$ 0,00' : formatCurrency(item.costoTotalItem)}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

                {descuentoPromo > 0 && (
                  <tr className="bg-slate-50">
                    <td
                      colSpan={5}
                      className="border border-slate-200 px-3 py-2 text-right font-semibold text-slate-700"
                    >
                      {presupuesto.nombrePromocion
                        ? `Descuento (${presupuesto.nombrePromocion}):`
                        : 'Descuento promocional:'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-semibold text-rose-600 font-mono">
                      −{formatCurrency(descuentoPromo)}
                    </td>
                  </tr>
                )}

                {/* Total row */}
                <tr className="bg-slate-900 text-white font-bold">
                  <td
                    colSpan={5}
                    className="border border-slate-900 px-3 py-2.5 text-right text-sm print:text-[10pt]"
                  >
                    Importe total
                  </td>
                  <td className="border border-slate-900 px-3 py-2.5 text-right text-sm print:text-[10pt] font-mono">
                    {formatCurrency(totalFinal)}
                  </td>
                </tr>
                {pricePerPerson > 0 && (
                  <tr className="bg-white">
                    <td
                      colSpan={5}
                      className="border border-slate-200 px-3 py-1.5 text-right font-semibold text-slate-500"
                    >
                      Valor aproximado por persona
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-semibold font-mono text-slate-700">
                      {formatCurrency(pricePerPerson)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {clubUruguayCostoCalculated > 0 && (
          <section className="mb-4 border border-emerald-200 rounded-xl px-4 py-3 bg-emerald-50/50 print:border-emerald-300">
            <p className="text-sm font-black text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Salón seleccionado: Club Uruguay
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              Costo: {formatCurrency(clubUruguayCostoCalculated)} — Este monto se coordinará y formará parte del presupuesto final.
            </p>
          </section>
        )}

        {projectionRows.length > 0 && (
          <section className="mb-4 budget-print-avoid-break">
            <h3
              className="text-xs font-bold text-slate-800 mb-2 print:text-[9pt] text-center uppercase"
              style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
            >
              Proyección de Precios por Año (ajuste del {adjustmentPct}% anual al 1° de enero)
            </h3>
            <table className="w-full text-xs print:text-[8pt] border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="border border-slate-700 px-3 py-1.5 text-left font-semibold">Año</th>
                  <th className="border border-slate-700 px-3 py-1.5 text-right font-semibold">Precio Base</th>
                  <th className="border border-slate-700 px-3 py-1.5 text-right font-semibold">Ajuste {adjustmentPct}%</th>
                  <th className="border border-slate-700 px-3 py-1.5 text-right font-semibold">Total Ajustado</th>
                </tr>
              </thead>
              <tbody>
                {projectionRows.map((row) => (
                  <tr key={row.year} className="bg-white border-b border-slate-200">
                    <td className="border border-slate-200 px-3 py-1.5 font-semibold text-slate-700">
                      {row.year} {new Date(presupuesto.timestamp).getFullYear() === row.year ? '(actual)' : `(1° de enero)`}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-mono text-slate-600">{formatCurrency(row.total - (row.adjustmentAmount || 0))}</td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-mono text-slate-600">
                      {row.adjustmentAmount === 0 ? '—' : `+${formatCurrency(row.adjustmentAmount)}`}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-bold font-mono text-slate-850">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[10px] text-slate-500 print:text-[7pt] leading-relaxed">
              El importe total del presupuesto corresponde al precio vigente. Esta proyección muestra cómo quedaría el total si el evento pertenece a un año posterior.
            </p>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-6 pt-4 border-t border-slate-300 text-xs print:text-[8pt] text-slate-500 space-y-3">
          <p className="font-semibold text-slate-700 print:text-black">
            {FORMAL_BOOKING_NOTE.replace('$ 5.000', formatCurrency(bookingDepositAmount))}
          </p>

          {showSignatures ? (
            <div className="mt-8 pt-4 flex justify-between gap-10 print:mt-6">
              <div
                className="text-center flex-1"
                style={{ borderTop: '1px solid #94a3b8', paddingTop: '8px' }}
              >
                <p className="font-semibold text-slate-750 print:text-[8pt]">
                  Firma del Cliente
                </p>
                <p className="text-slate-500 print:text-[7pt] font-mono mt-0.5">{clientName}</p>
              </div>
              <div
                className="text-center flex-1"
                style={{ borderTop: '1px solid #94a3b8', paddingTop: '8px' }}
              >
                <p className="font-semibold text-slate-750 print:text-[8pt]">
                  Firma y sello de la empresa
                </p>
                <p className="text-slate-500 print:text-[7pt] font-mono mt-0.5">{COMPANY_NAME}</p>
              </div>
            </div>
          ) : (
            <p className="border-t border-slate-200 pt-3 text-center text-[10px] font-semibold leading-snug text-slate-400 print:text-[7pt]">
              Documento de presupuesto. La reserva, confirmación final y firmas corresponden al contrato confirmado.
            </p>
          )}
        </footer>
      </div>

      {/* Global print CSS */}
      <div className="budget-print-page-number" />

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.5cm 1cm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(#__next),
          header,
          nav,
          aside,
          .print\\:hidden {
            display: none !important;
          }
          .budget-formal-print-template {
            background-color: #ffffff !important;
            display: block !important;
            border: none !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .budget-formal-print-template section,
          .budget-print-avoid-break,
          .budget-formal-print-template tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .budget-formal-print-template thead {
            display: table-header-group;
          }
          .budget-print-page-number {
            display: block;
            position: fixed;
            right: 1cm;
            bottom: 0.5cm;
            color: #475569;
            font-size: 7pt;
            font-weight: 600;
          }
          .budget-print-page-number::after {
            content: "Página " counter(page);
          }
        }
        @media screen {
          .budget-print-page-number {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
