'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Save, Loader2, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { updatePersonalFiestaActual } from '@/app/actions/fiesta-actual';
import { getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import type { FiestaEnPlanificacion, PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { WatermarkedImage } from '@/components/watermarked-image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RECIBOS_CONFIG_KEY = 'ak-recibos-config';

interface RecibosConfig {
  showVacacional: boolean;
  showAguinaldo: boolean;
  showAportesPatronales: boolean;
  showFirmas: boolean;
  showLogo: boolean;
}

const defaultRecibosConfig: RecibosConfig = {
  showVacacional: true,
  showAguinaldo: true,
  showAportesPatronales: true,
  showFirmas: true,
  showLogo: true,
};

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "____________";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return "Fecha inválida";
  }
};

const today = new Date().toLocaleDateString('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

interface FullStaffDetail {
  empleado: Empleado;
  rol?: Rol;
  rolId: string;
  eventSalary: number;
  employerContribution: number;
}

interface SalaryBreakdown {
  base: number;
  vacacional: number;
  aguinaldo: number;
}

interface ReceiptEntry {
  fiesta: FiestaEnPlanificacion;
  detail: FullStaffDetail;
}

const calculateSalaryBreakdown = (totalPayment: number, rol?: Rol): SalaryBreakdown => {
  const vacacionalPct = (rol?.porcentajeSalarioVacacional ?? 0) / 100;
  const aguinaldoPct = (rol?.porcentajeAguinaldo ?? 0) / 100;
  const divisor = 1 + vacacionalPct + aguinaldoPct;
  const sueldoBase = divisor > 0 ? totalPayment / divisor : totalPayment;
  const salarioVacacional = sueldoBase * vacacionalPct;
  const aguinaldo = sueldoBase * aguinaldoPct;
  return { base: sueldoBase, vacacional: salarioVacacional, aguinaldo: aguinaldo };
};

function RecibosDePagoContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [assignedStaffDetails, setAssignedStaffDetails] = useState<FullStaffDetail[]>([]);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [allFiestas, setAllFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [allEmpleados, setAllEmpleados] = useState<Empleado[]>([]);
  const [allRoles, setAllRoles] = useState<Rol[]>([]);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [recibosConfig, setRecibosConfig] = useState<RecibosConfig>(defaultRecibosConfig);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECIBOS_CONFIG_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<RecibosConfig>;
      setRecibosConfig(prev => ({ ...prev, ...parsed }));
    } catch {
      // Se usa configuración por defecto
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(RECIBOS_CONFIG_KEY, JSON.stringify(recibosConfig));
  }, [recibosConfig]);

  const buildStaffDetails = useCallback(
    (fiestaData: FiestaEnPlanificacion, empleadosData: Empleado[], rolesData: Rol[]) => {
      return (fiestaData.personalAsignado || []).map(assigned => {
        const empleado = empleadosData.find(e => e.id === assigned.empleadoId);
        if (!empleado) return null;
        const rol = rolesData.find(r => r.id === assigned.rolId);
        const contribution = (assigned.eventSalary * (rol?.porcentajeAportesPatronales ?? 0)) / 100;
        return {
          empleado,
          rol,
          rolId: assigned.rolId,
          eventSalary: assigned.eventSalary,
          employerContribution: contribution
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null) as FullStaffDetail[];
    },
    []
  );

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError("Falta el ID del evento.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestasData, empleadosData, rolesData, settings] = await Promise.all([
        getAllFiestas(),
        getEmpleados(),
        getRoles(),
        getInvoiceTemplateSettings()
      ]);

      const currentFiesta = fiestasData.find(f => f.id === fiestaId);
      if (!currentFiesta) {
        throw new Error("No se encontró la fiesta seleccionada.");
      }

      setFiesta(currentFiesta);
      setAllFiestas(fiestasData);
      setAllEmpleados(empleadosData);
      setAllRoles(rolesData);
      setLogoUrl(settings.logoUrl ?? null);
      setAssignedStaffDetails(buildStaffDetails(currentFiesta, empleadosData, rolesData));

      const empleadosUnicos = Array.from(
        new Set(
          fiestasData.flatMap(f => (f.personalAsignado || []).map(p => p.empleadoId))
        )
      );
      setSelectedEmpleadoId(empleadosUnicos.length === 1 ? empleadosUnicos[0] : 'all');
    } catch (err: any) {
      setError("No se pudieron cargar los datos para generar los recibos.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId, buildStaffDetails]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const message = `Te comparto los recibos de pago para el personal del evento.`;
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(message + '\n' + url)}`, '_blank');
  };

  const buildReceiptEntries = (fiestas: FiestaEnPlanificacion[], empleadoIdFilter?: string): ReceiptEntry[] => {
    return fiestas.flatMap(fiestaItem =>
      (fiestaItem.personalAsignado || [])
        .filter(assigned => !empleadoIdFilter || assigned.empleadoId === empleadoIdFilter)
        .map(assigned => {
          const empleado = allEmpleados.find(e => e.id === assigned.empleadoId);
          if (!empleado) return null;
          const rol = allRoles.find(r => r.id === assigned.rolId);
          const contribution = (assigned.eventSalary * (rol?.porcentajeAportesPatronales ?? 0)) / 100;
          return {
            fiesta: fiestaItem,
            detail: {
              empleado,
              rol,
              rolId: assigned.rolId,
              eventSalary: assigned.eventSalary,
              employerContribution: contribution,
            },
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    );
  };

  const handlePrintAllFiestas = () => {
    const empleadoIdFilter = selectedEmpleadoId === 'all' ? undefined : selectedEmpleadoId;
    const fiestasConPersonal = allFiestas.filter(f =>
      (f.personalAsignado || []).some(p => !empleadoIdFilter || p.empleadoId === empleadoIdFilter)
    );

    const entries = buildReceiptEntries(fiestasConPersonal, empleadoIdFilter);
    if (entries.length === 0) {
      toast({ title: "Sin datos", description: "No hay recibos para imprimir con ese filtro.", variant: "destructive" });
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      toast({ title: "No se pudo abrir la ventana de impresión", variant: "destructive" });
      return;
    }

    const pagesHtml = entries.map((entry, index) => {
      const breakdown = calculateSalaryBreakdown(entry.detail.eventSalary, entry.detail.rol);
      const concepts = [
        `<tr><td>Sueldo Base Evento</td><td style="text-align:right;">${formatCurrency(breakdown.base)}</td></tr>`,
        recibosConfig.showVacacional
          ? `<tr><td>Salario Vacacional (${entry.detail.rol?.porcentajeSalarioVacacional || 0}%)</td><td style="text-align:right;">${formatCurrency(breakdown.vacacional)}</td></tr>`
          : '',
        recibosConfig.showAguinaldo
          ? `<tr><td>Aguinaldo (${entry.detail.rol?.porcentajeAguinaldo || 0}%)</td><td style="text-align:right;">${formatCurrency(breakdown.aguinaldo)}</td></tr>`
          : '',
      ].join('');

      const logoBlock = recibosConfig.showLogo && logoUrl
        ? `<div style="width:100%;height:70px;margin-bottom:10px;"><img src="${logoUrl}" alt="AK Producciones" style="max-height:70px; max-width:220px; object-fit:contain;" /></div>`
        : '';

      return `
        <section class="receipt-page ${index < entries.length - 1 ? 'page-break' : ''}">
          ${logoBlock}
          <h2>Recibo de Pago</h2>
          <p><strong>AK Producciones</strong></p>
          <hr />
          <div class="grid">
            <div>
              <p><strong>Empleado:</strong> ${escapeHtml(entry.detail.empleado.nombre)}</p>
              <p><strong>C.I.:</strong> ${escapeHtml(entry.detail.empleado.cedula || '—')}</p>
              <p><strong>Rol:</strong> ${escapeHtml(entry.detail.rol?.nombre || 'No especificado')}</p>
            </div>
            <div style="text-align:right;">
              <p><strong>Evento:</strong> ${escapeHtml(entry.fiesta.configuracion.nombreEvento || 'Evento sin nombre')}</p>
              <p>${escapeHtml(formatDate(entry.fiesta.configuracion.fechaEvento))}</p>
              <p><strong>Lugar:</strong> ${escapeHtml(entry.fiesta.configuracion.nombreLugar || 'Lugar a confirmar')}</p>
            </div>
          </div>
          <hr />
          <table>
            <thead><tr><th>Concepto</th><th>Importe</th></tr></thead>
            <tbody>${concepts}</tbody>
            <tfoot>
              <tr>
                <td>PAGO TOTAL</td>
                <td style="text-align:right;">${formatCurrency(entry.detail.eventSalary)}</td>
              </tr>
            </tfoot>
          </table>
          ${recibosConfig.showAportesPatronales ? `
            <div class="internal">
              <p><strong>Aportes Patronales (Uso Interno)</strong></p>
              <p>Monto: ${formatCurrency(entry.detail.employerContribution)} (${entry.detail.rol?.porcentajeAportesPatronales || 0}%)</p>
            </div>
          ` : ''}
          ${recibosConfig.showFirmas ? `
            <div class="signatures">
              <div class="line">Firma del Empleado</div>
              <div class="line">Firma del Empleador</div>
            </div>
          ` : ''}
        </section>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibos de todas las fiestas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 18px; color: #111827; }
            .receipt-page { border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
            .page-break { page-break-after: always; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e5e7eb; padding: 6px; font-size: 12px; }
            th { text-align: left; background: #f9fafb; }
            tfoot td { font-weight: 700; border-top: 2px solid #111827; }
            .internal { margin-top: 12px; font-size: 11px; color: #374151; border-top: 1px solid #e5e7eb; padding-top: 6px; }
            .signatures { margin-top: 24px; display: flex; justify-content: space-between; gap: 16px; }
            .line { width: 45%; border-top: 1px solid #111827; padding-top: 4px; text-align: center; font-size: 11px; }
            @media print {
              body { padding: 0; }
              .receipt-page { border-color: #9ca3af; margin-bottom: 0; border-radius: 0; }
            }
          </style>
        </head>
        <body>${pagesHtml}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
  };
  
  const handleSalaryChange = (empleadoId: string, newSalary: string) => {
    const salaryNum = parseFloat(newSalary) || 0;
    setAssignedStaffDetails(prev => 
      prev.map(detail => {
        if (detail.empleado.id === empleadoId) {
          const newContribution = (salaryNum * (detail.rol?.porcentajeAportesPatronales ?? 0)) / 100;
          return { ...detail, eventSalary: salaryNum, employerContribution: newContribution };
        }
        return detail;
      })
    );
  };
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    if (!fiestaId) {
      toast({ title: "Error", description: "No se encontró el ID de la fiesta", variant: "destructive" });
      setIsSaving(false);
      return;
    }
    const personalToSave: PersonalAsignadoDetalleStorage[] = assignedStaffDetails.map(item => ({
      empleadoId: item.empleado.id,
      rolId: item.rolId,
      eventSalary: item.eventSalary
    }));
    try {
      const result = await updatePersonalFiestaActual(fiestaId, personalToSave);
      if (result.success) {
        toast({ title: "¡Cambios Guardados!", description: `Se guardaron los nuevos montos de pago.` });
        await loadData();
      } else {
        throw new Error(result.error || "No se pudieron guardar los cambios.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const empleadosConRecibos = useMemo(() => {
    const ids = new Set(allFiestas.flatMap(f => (f.personalAsignado || []).map(p => p.empleadoId)));
    return allEmpleados.filter(e => ids.has(e.id));
  }, [allFiestas, allEmpleados]);
  
  if (isLoading) {
    return <div className="p-8 max-w-4xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }
  
  if (error || !fiesta) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Error al Generar Reporte</h1>
          <p className="text-muted-foreground mt-2">{error || "No se encontró información del evento."}</p>
          <Link href={`/fiestas/nueva/personal?fiestaId=${fiestaId}`}>
            <Button variant="outline" className="mt-4">Volver</Button>
          </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href={`/fiestas/nueva/personal?fiestaId=${fiestaId}`}><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Asignar</Button></Link>
          <div className="flex gap-2 flex-wrap justify-end">
             <Button onClick={handleSaveChanges} size="sm" variant="secondary" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
              </Button>
            <Button onClick={handleShareWhatsApp} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><Download className="w-4 h-4 mr-1.5" />Descargar Todo (PDF)</Button>
          </div>
        </div>

        <Accordion type="single" collapsible defaultValue="config" className="mb-6 print:hidden">
          <AccordionItem value="config">
            <AccordionTrigger>Configuración de desglose del recibo</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox id="show-vacacional" checked={recibosConfig.showVacacional} onCheckedChange={checked => setRecibosConfig(prev => ({ ...prev, showVacacional: checked === true }))} />
                <Label htmlFor="show-vacacional">Mostrar Salario Vacacional</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="show-aguinaldo" checked={recibosConfig.showAguinaldo} onCheckedChange={checked => setRecibosConfig(prev => ({ ...prev, showAguinaldo: checked === true }))} />
                <Label htmlFor="show-aguinaldo">Mostrar Aguinaldo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="show-aportes" checked={recibosConfig.showAportesPatronales} onCheckedChange={checked => setRecibosConfig(prev => ({ ...prev, showAportesPatronales: checked === true }))} />
                <Label htmlFor="show-aportes">Mostrar Aportes Patronales (Uso Interno)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="show-firmas" checked={recibosConfig.showFirmas} onCheckedChange={checked => setRecibosConfig(prev => ({ ...prev, showFirmas: checked === true }))} />
                <Label htmlFor="show-firmas">Mostrar firma del empleado / empleador</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="show-logo" checked={recibosConfig.showLogo} onCheckedChange={checked => setRecibosConfig(prev => ({ ...prev, showLogo: checked === true }))} />
                <Label htmlFor="show-logo">Mostrar logo de la empresa</Label>
              </div>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label>Empleado para impresión multi-fiesta</Label>
                  <Select value={selectedEmpleadoId} onValueChange={setSelectedEmpleadoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná empleado o todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los empleados</SelectItem>
                      {empleadosConRecibos.map(empleado => (
                        <SelectItem key={empleado.id} value={empleado.id}>{empleado.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={handlePrintAllFiestas}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir recibos de todas las fiestas
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <header className="mb-6 print:mb-4 text-center border-b pb-3 print:pb-2">
            {recibosConfig.showLogo && (
              <div className="w-full h-24 print:h-20 mb-4 relative">
                  <WatermarkedImage src={logoUrl} alt="Marca de agua" />
              </div>
            )}
            <h1 className="text-xl font-bold text-primary print:text-lg">Recibos de Pago de Personal</h1>
            <p className="text-md text-gray-700 print:text-sm mt-1">{fiesta.configuracion.nombreEvento}</p>
            <p className="text-xs text-gray-500 print:text-[8pt]">{formatDate(fiesta.configuracion.fechaEvento)}</p>
        </header>

        {assignedStaffDetails.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No hay personal asignado a este evento para generar recibos.
          </div>
        ) : (
          <div className="space-y-8 print:space-y-4">
            {assignedStaffDetails.map(detail => {
              const breakdown = calculateSalaryBreakdown(detail.eventSalary, detail.rol);
              return (
              <div key={detail.empleado.id} className="p-4 border rounded-lg bg-white print:border-gray-400 print:shadow-none print:break-inside-avoid print:mb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 print:text-base">Recibo de Pago</h2>
                        <p className="text-sm text-gray-500 print:text-xs">AK Producciones</p>
                    </div>
                    <p className="text-xs text-muted-foreground print:text-[8pt]">Emitido: {today}</p>
                </div>

                <Separator className="my-3 print:my-1.5"/>

                <div className="grid grid-cols-2 gap-4 text-sm print:text-xs">
                    <div>
                        <h3 className="font-semibold text-gray-600 print:text-black">Empleado</h3>
                        <p>{detail.empleado.nombre}</p>
                        <p>C.I.: {detail.empleado.cedula}</p>
                        <p>Rol: {detail.rol?.nombre || 'No especificado'}</p>
                    </div>
                     <div className="text-right">
                        <h3 className="font-semibold text-gray-600 print:text-black">Evento</h3>
                        <p>{fiesta.configuracion.nombreEvento}</p>
                        <p>{formatDate(fiesta.configuracion.fechaEvento)}</p>
                        <p>Lugar: {fiesta.configuracion.nombreLugar}</p>
                    </div>
                </div>

                <Separator className="my-3 print:my-1.5"/>

                <div>
                    <table className="w-full text-left text-sm print:text-xs">
                        <thead>
                            <tr className="border-b">
                                <th className="py-1 font-medium">Concepto</th>
                                <th className="py-1 font-medium text-right">Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="py-1">Sueldo Base Evento</td><td className="py-1 text-right">{formatCurrency(breakdown.base)}</td></tr>
                            {recibosConfig.showVacacional && <tr><td className="py-1">Salario Vacacional ({detail.rol?.porcentajeSalarioVacacional || 0}%)</td><td className="py-1 text-right">{formatCurrency(breakdown.vacacional)}</td></tr>}
                            {recibosConfig.showAguinaldo && <tr><td className="py-1">Aguinaldo ({detail.rol?.porcentajeAguinaldo || 0}%)</td><td className="py-1 text-right">{formatCurrency(breakdown.aguinaldo)}</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 font-bold">
                                <td className="py-1.5">PAGO TOTAL</td>
                                <td className="py-1.5 text-right text-base print:text-sm">
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="print:hidden">$</span>
                                        <Input
                                            type="number"
                                            value={detail.eventSalary ?? ''}
                                            onChange={(e) => handleSalaryChange(detail.empleado.id, e.target.value)}
                                            className="text-right h-8 w-28 font-bold print:hidden"
                                        />
                                        <span className="hidden print:inline">{formatCurrency(detail.eventSalary)}</span>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                 {recibosConfig.showAportesPatronales && (
                  <div className="mt-4 text-xs text-gray-500 print:text-[8pt] border-t pt-2">
                    <h4 className="font-semibold">Aportes Patronales (Uso Interno)</h4>
                    <p>Monto: {formatCurrency(detail.employerContribution)} ({detail.rol?.porcentajeAportesPatronales || 0}%)</p>
                  </div>
                 )}
                  
                 {recibosConfig.showFirmas && (
                  <div className="mt-8 print:mt-10 flex justify-between items-end">
                    <div className="w-2/5 border-t text-center pt-1"><p className="text-xs print:text-[8pt]">Firma del Empleado</p></div>
                    <div className="w-2/5 border-t text-center pt-1"><p className="text-xs print:text-[8pt]">Firma del Empleador</p></div>
                  </div>
                 )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecibosPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-4xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>}>
      <RecibosDePagoContent />
    </Suspense>
  )
}
