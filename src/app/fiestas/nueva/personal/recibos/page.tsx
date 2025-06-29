
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha Inválida"; }
};

interface FullStaffDetail {
  empleado: Empleado;
  rol?: Rol;
  eventSalary: number; // Pago total para el empleado para este evento específico
  employerContribution: number;
}

interface SalaryBreakdown {
  base: number;
  vacacional: number;
  aguinaldo: number;
}

// Función para calcular el desglose del salario
const calculateSalaryBreakdown = (totalPayment: number, rol?: Rol): SalaryBreakdown => {
  const vacacionalPct = (rol?.porcentajeSalarioVacacional ?? 0) / 100;
  const aguinaldoPct = (rol?.porcentajeAguinaldo ?? 0) / 100;

  // T = S * (1 + V_pct + A_pct) => S = T / (1 + V_pct + A_pct)
  const sueldoBase = totalPayment / (1 + vacacionalPct + aguinaldoPct);
  const salarioVacacional = sueldoBase * vacacionalPct;
  const aguinaldo = sueldoBase * aguinaldoPct;
  
  return {
    base: sueldoBase,
    vacacional: salarioVacacional,
    aguinaldo: aguinaldo,
  };
};

export default function RecibosDePagoPage() {
  const { toast } = useToast();
  const [assignedStaffDetails, setAssignedStaffDetails] = useState<FullStaffDetail[]>([]);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, empleadosData, rolesData] = await Promise.all([
        getFiestaActual(),
        getEmpleados(),
        getRoles()
      ]);
      setFiesta(fiestaData);
      
      const details = fiestaData.personalAsignado.map(assigned => {
        const empleado = empleadosData.find(e => e.id === assigned.empleadoId);
        if (!empleado) return null;
        const rol = empleado.rolId ? rolesData.find(r => r.id === empleado.rolId) : undefined;
        const contribution = (assigned.eventSalary * (rol?.porcentajeAportesPatronales ?? 0)) / 100;
        return {
          empleado,
          rol,
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
  
  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-white">
          <Skeleton className="h-10 w-40 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
          </div>
      </div>
    );
  }

  if (error || !fiesta) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-white text-center">
        <div className="flex justify-between items-center mb-6 print:hidden">
             <Link href="/fiestas/nueva/personal" passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Asignar</Button></Link>
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
            <Link href="/fiestas/nueva/personal" passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Asignar</Button></Link>
            <Button onClick={handlePrint} size="sm"><Printer className="w-4 h-4 mr-1.5" />Imprimir Recibos</Button>
        </div>
        
        <header className="mb-6 print:mb-4 text-center border-b pb-3 print:pb-2">
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
                    <Image src="https://placehold.co/80x80.png?text=Logo" alt="Logo Empresa" width={50} height={50} className="print:w-12 print:h-12"/>
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
                                <td className="py-1.5">MONTO TOTAL RECIBIDO</td>
                                <td className="py-1.5 text-right text-base print:text-sm">{formatCurrency(detail.eventSalary)}</td>
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
