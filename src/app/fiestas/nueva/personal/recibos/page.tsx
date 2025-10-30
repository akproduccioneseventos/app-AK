
'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Share2, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual, updatePersonalFiestaActual } from '@/app/actions/fiesta-actual';
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

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "____________";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, empleadosData, rolesData, settings] = await Promise.all([
        getFiestaActual(),
        getEmpleados(),
        getRoles(),
        getInvoiceTemplateSettings()
      ]);
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl);
      
      const details = (fiestaData.personalAsignado || []).map(assigned => {
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
      }).filter((item): item is FullStaffDetail => item !== null);
      
      setAssignedStaffDetails(details);

    } catch (err: any) {
      setError("No se pudieron cargar los datos para generar los recibos.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
  
  if (isLoading) {
    return <div className="p-8 max-w-4xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }

  if (error || !fiesta) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-white text-center">
         <div className="flex justify-between items-center mb-6 print:hidden">
             <Link href={`/fiestas/nueva/personal?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Asignar</Button></Link>
        </div>
        <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />
        <p className="font-semibold text-lg text-destructive">Error al Cargar</p>
        <p className="text-sm text-muted-foreground">{error || "No se pudieron cargar los datos necesarios."}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
            <Link href={`/fiestas/nueva/personal?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Asignar</Button></Link>
            <div className="flex gap-2">
              <Button onClick={handleSaveChanges} size="sm" variant="secondary" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
              </Button>
              <Button onClick={handleShareWhatsApp} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
              <Button onClick={handlePrint} size="sm"><Printer className="w-4 h-4 mr-1.5" />Imprimir</Button>
            </div>
        </div>
        
        <header className="mb-6 print:mb-4 text-center border-b pb-3 print:pb-2">
            <div className="w-full h-24 print:h-20 mb-4 relative">
                <WatermarkedImage src={logoUrl} alt="Marca de agua" />
            </div>
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
              <div key={detail.empleado.id} className="p-4 border rounded-lg bg-white print:border-gray-400 print:shadow-none print:break-inside-avoid">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 print:text-base">Recibo de Pago</h2>
                        <p className="text-sm text-gray-500 print:text-xs">AK Producciones</p>
                    </div>
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
                            <tr><td className="py-1">Salario Vacacional ({detail.rol?.porcentajeSalarioVacacional || 0}%)</td><td className="py-1 text-right">{formatCurrency(breakdown.vacacional)}</td></tr>
                            <tr><td className="py-1">Aguinaldo ({detail.rol?.porcentajeAguinaldo || 0}%)</td><td className="py-1 text-right">{formatCurrency(breakdown.aguinaldo)}</td></tr>
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

                 <div className="mt-4 text-xs text-gray-500 print:text-[8pt] border-t pt-2">
                    <h4 className="font-semibold">Aportes Patronales (Uso Interno)</h4>
                    <p>Monto: {formatCurrency(detail.employerContribution)} ({detail.rol?.porcentajeAportesPatronales || 0}%)</p>
                 </div>
                 
                 <div className="mt-8 print:mt-10 flex justify-between items-end">
                    <div className="w-2/5 border-t text-center pt-1"><p className="text-xs print:text-[8pt]">Firma del Empleado</p></div>
                    <div className="w-2/5 border-t text-center pt-1"><p className="text-xs print:text-[8pt]">Firma del Empleador</p></div>
                 </div>
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
