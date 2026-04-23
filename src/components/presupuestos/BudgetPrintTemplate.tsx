/**
 * BudgetPrintTemplate — Shared formal budget print layout for AK Producciones.
 *
 * Used by:
 *   - src/components/presupuestos/paso-4-resumen.tsx
 *   - src/app/presupuestos/[id]/ver/page.tsx
 *
 * Renders a formal A4 invoice-style budget document. Only visible when printing.
 * On screen the parent component continues rendering its own interactive UI.
 */

import React from 'react';
import Image from 'next/image';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';

// ── Company constants ─────────────────────────────────────────────────────────
const COMPANY_NAME = 'AK PRODUCCIONES';
const COMPANY_CONTACT_PERSON = 'SR. Alexander Knuth';
const COMPANY_ADDRESS_LINE1 = 'Salto';
const COMPANY_ADDRESS_LINE2 = '50000 Salto';
const COMPANY_EMAIL = 'akproduccionessalto@gmail.com';
const COMPANY_WEBSITE = 'www.akproduccioneseventos.com';
const BUDGET_VALIDITY_NOTE =
  'El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.';
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

// ── Props ─────────────────────────────────────────────────────────────────────
export interface BudgetPrintTemplateProps {
  presupuesto: Presupuesto;
  /** URL to the company logo. Falls back to inline SVG if null. */
  logoUrl?: string | null;
  /** Optional override for annual adjustment % */
  adjustmentPct?: number;
  /** Pre-computed annual adjustment amount */
  annualAdjustmentAmount?: number;
  /** Whether to show the price breakdown table */
  showPriceBreakdown?: boolean;
  /** Name to use in the client signature line (falls back to presupuesto.clienteNombre) */
  clienteNombre?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BudgetPrintTemplate({
  presupuesto,
  logoUrl,
  adjustmentPct = 15,
  annualAdjustmentAmount = 0,
  showPriceBreakdown = true,
  clienteNombre,
}: BudgetPrintTemplateProps) {
  const budgetNumber =
    presupuesto.numero ||
    (presupuesto.id.split('_').pop() || presupuesto.id).substring(0, 6).toUpperCase();

  const clientName = clienteNombre || presupuesto.clienteNombre;

  const validUntil = new Date(presupuesto.timestamp);
  validUntil.setDate(validUntil.getDate() + BUDGET_VALIDITY_DAYS);

  // Group items by category
  const itemsRegulares = presupuesto.itemsPresupuestados.filter((i) => !i.esRegalo);
  const itemsRegalo = presupuesto.itemsPresupuestados.filter((i) => i.esRegalo);

  const itemsAgrupados: Record<string, ItemPresupuestado[]> = itemsRegulares.reduce(
    (acc, item) => {
      const cat = item.categoriaServicio || 'Otros Servicios';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, ItemPresupuestado[]>,
  );

  if (itemsRegalo.length > 0) itemsAgrupados['Regalos Incluidos'] = itemsRegalo;

  const subtotalBruto = presupuesto.costoTotalEstimado;
  const totalFinal = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
  const descuentoPromo = Math.max(0, subtotalBruto - totalFinal);
  const grandTotal = totalFinal + annualAdjustmentAmount;

  return (
    <>
      {/* ── The actual print content ────────────────────────────────────── */}
      <div className="budget-formal-print-template bg-white" id="budget-print-area">
        {/* HEADER */}
        <h1
          className="text-center text-base font-extrabold uppercase tracking-wide text-gray-900 print:text-[12pt] mb-3 pb-1"
          style={{ borderBottom: '2px solid #0f172a' }}
        >
          Presupuesto para fiestas o eventos — {COMPANY_NAME}
        </h1>

        <div className="flex justify-between items-start gap-4 mb-3">
          {/* Company info — left column */}
          <div className="space-y-0.5 text-xs print:text-[8pt]">
            <p className="font-bold text-gray-800">{COMPANY_CONTACT_PERSON}</p>
            <p className="text-gray-600">{COMPANY_ADDRESS_LINE1}</p>
            <p className="text-gray-600">{COMPANY_ADDRESS_LINE2}</p>
            <p className="text-gray-600">{COMPANY_EMAIL}</p>
            <p className="text-gray-600">{COMPANY_WEBSITE}</p>
          </div>

          {/* Logo — right column */}
          <div className="flex-shrink-0">
            {logoUrl ? (
              <div className="w-20 h-20 print:w-[65px] print:h-[65px]">
                <Image
                  src={logoUrl}
                  alt={`${COMPANY_NAME} Logo`}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            ) : (
              /* Inline SVG fallback: red circle with AK */
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

        {/* Event date + client name row */}
        <p className="text-sm font-semibold text-gray-700 mb-3 print:text-[9pt]">
          {formatDateShort(presupuesto.eventoFecha)} &nbsp;{clientName}
        </p>

        {/* Document data table */}
        <section className="mb-3">
          <table className="w-full text-xs print:text-[8pt] border-collapse">
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">
                  Número de cliente
                </th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">
                  Número de Documento
                </th>
                <th className="border border-gray-400 px-2 py-1.5 text-center font-semibold">
                  Página
                </th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">
                  Fecha
                </th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">
                  Válido hasta
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#ffffff' }}>
                <td className="border border-gray-300 px-2 py-1.5 font-mono">
                  {clientName.substring(0, 3).toUpperCase()}-
                  {presupuesto.id.substring(0, 4).toUpperCase()}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 font-mono font-semibold">
                  #{budgetNumber}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">1/1</td>
                <td className="border border-gray-300 px-2 py-1.5">
                  {formatDateShort(presupuesto.timestamp)}
                </td>
                <td className="border border-gray-300 px-2 py-1.5">
                  {formatDateShort(validUntil.toISOString())}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Client + event info */}
        <section className="mb-3 border border-gray-300 rounded px-3 py-2 print:border-gray-400 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs print:text-[8pt]">
            <div>
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
                Cliente
              </p>
              <p className="font-bold">{clientName}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
                Fecha del evento
              </p>
              <p className="font-bold">{formatDateLong(presupuesto.eventoFecha)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
                Tipo de evento
              </p>
              <p className="font-bold">{presupuesto.eventoTipo}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
                Invitados
              </p>
              <p className="font-bold">{presupuesto.invitadosCantidad}</p>
            </div>
            {presupuesto.salonFiestas && (
              <div>
                <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
                  Salón
                </p>
                <p className="font-bold">{presupuesto.salonFiestas}</p>
              </div>
            )}
          </div>
        </section>

        {/* Items table */}
        {showPriceBreakdown && presupuesto.itemsPresupuestados.length > 0 && (
          <section className="mb-3">
            <table className="w-full text-xs print:text-[8pt] border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                  <th
                    className="border border-gray-600 px-2 py-1.5 text-left font-semibold"
                    style={{ width: '38%' }}
                  >
                    Artículo
                  </th>
                  <th className="border border-gray-600 px-2 py-1.5 text-center font-semibold">
                    Cantidad
                  </th>
                  <th className="border border-gray-600 px-2 py-1.5 text-center font-semibold">
                    Unidad
                  </th>
                  <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">
                    Precio
                  </th>
                  <th className="border border-gray-600 px-2 py-1.5 text-center font-semibold">
                    Desc.%
                  </th>
                  <th className="border border-gray-600 px-2 py-1.5 text-right font-semibold">
                    Importe total
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(itemsAgrupados).map(([categoria, items], catIdx) => (
                  <React.Fragment key={categoria}>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <td
                        colSpan={6}
                        className="border border-gray-400 px-2 py-1 font-bold text-gray-700 uppercase tracking-wide"
                      >
                        {categoria}
                      </td>
                    </tr>
                    {items.map((item, itemIdx) => (
                      <tr
                        key={`${catIdx}-${itemIdx}`}
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        <td className="border border-gray-300 px-2 py-1.5 align-top">
                          {item.esRegalo ? (
                            <span className="italic text-gray-600">{item.nombreServicio} (Regalo)</span>
                          ) : (
                            item.nombreServicio
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center align-top">
                          {item.cantidad}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center align-top">
                          $
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right align-top">
                          {formatCurrency(item.precioUnitarioPresupuesto ?? item.precioUnitario)}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center align-top">
                          {item.esRegalo ? '100%' : '—'}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right align-top font-semibold">
                          {item.esRegalo ? '$ 0,00' : formatCurrency(item.costoTotalItem)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {descuentoPromo > 0 && (
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td
                      colSpan={5}
                      className="border border-gray-300 px-2 py-1.5 text-right font-semibold"
                    >
                      {presupuesto.nombrePromocion
                        ? `Descuento (${presupuesto.nombrePromocion}):`
                        : 'Descuento promocional:'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold text-rose-600">
                      −{formatCurrency(descuentoPromo)}
                    </td>
                  </tr>
                )}

                {annualAdjustmentAmount > 0 && (
                  <tr style={{ backgroundColor: '#fffde7' }}>
                    <td
                      colSpan={5}
                      className="border border-gray-300 px-2 py-1.5 text-right font-semibold"
                    >
                      Ajuste anual ({adjustmentPct}%):
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold text-amber-700">
                      +{formatCurrency(annualAdjustmentAmount)}
                    </td>
                  </tr>
                )}

                {/* Total row */}
                <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                  <td
                    colSpan={5}
                    className="border border-gray-600 px-2 py-2 text-right font-bold text-sm print:text-[10pt]"
                  >
                    Importe total
                  </td>
                  <td className="border border-gray-600 px-2 py-2 text-right font-bold text-sm print:text-[10pt]">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-4 pt-3 border-t border-gray-300 text-xs print:text-[8pt] text-gray-600 space-y-2">
          <p className="font-semibold text-gray-800">{BUDGET_VALIDITY_NOTE}</p>

          {/* Signature lines */}
          <div className="mt-8 pt-4 flex justify-between gap-10 print:mt-6">
            <div
              className="text-center flex-1"
              style={{ borderTop: '1px solid #555', paddingTop: '6px' }}
            >
              <p className="font-semibold text-gray-700 print:text-[8pt]">
                Firma del Cliente
              </p>
              <p className="text-gray-500 print:text-[7pt]">{clientName}</p>
            </div>
            <div
              className="text-center flex-1"
              style={{ borderTop: '1px solid #555', paddingTop: '6px' }}
            >
              <p className="font-semibold text-gray-700 print:text-[8pt]">
                Firma y sello de la empresa
              </p>
              <p className="text-gray-500 print:text-[7pt]">{COMPANY_NAME}</p>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Global print CSS ─────────────────────────────────────────────── */}
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
          /* Hide everything except the print area */
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
          }
        }
      `}</style>
    </>
  );
}
