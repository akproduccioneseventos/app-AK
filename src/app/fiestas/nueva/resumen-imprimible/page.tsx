
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, Info, CalendarDays, Users, MapPin, ChefHat, Palette, UserCheck, Clock, Loader2 } from 'lucide-react';
import type { FiestaEnPlanificacion, Tarea, ProgramaEventoItem } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { FullMenu } from '@/types/catering';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { getMenuById } from '@/app/actions/menus-catering';
import { getRoles } from '@/app/actions/roles';
import { getEmpleados } from '@/app/actions/empleados';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try { return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch (e) { return "Fecha inválida"; }
};

export default function ResumenImprimiblePage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [personal, setPersonal] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);

      const dataPromises = [];
      if (fiestaData.configuracion.clienteId) {
        dataPromises.push(getCustomerById(fiestaData.configuracion.clienteId));
      } else { dataPromises.push(Promise.resolve(null)); }

      if (fiestaData.menuAsignadoId) {
        dataPromises.push(getMenuById(fiestaData.menuAsignadoId));
      } else { dataPromises.push(Promise.resolve(null)); }
      
      if (fiestaData.personalAsignado && fiestaData.personalAsignado.length > 0) {
        dataPromises.push(getEmpleados());
        dataPromises.push(getRoles());
      } else {
        dataPromises.push(Promise.resolve([]));
        dataPromises.push(Promise.resolve([]));
      }
      
      const [clienteData, menuData, empleadosData, rolesData] = await Promise.all(dataPromises);

      setCliente(clienteData);
      setMenu(menuData);

      if (empleadosData.length > 0) {
        const personalDetallado = fiestaData.personalAsignado.map(pa => {
          const empleado = empleadosData.find(e => e.id === pa.empleadoId);
          if (!empleado) return null;
          const rol = empleado.rolId ? rolesData.find(r => r.id === empleado.rolId) : undefined;
          return { nombre: empleado.nombre, rol: rol?.nombre || 'Sin rol', pago: pa.eventSalary };
        }).filter(Boolean);
        setPersonal(personalDetallado);
      }

    } catch (err: any) {
      setError("No se pudieron cargar todos los datos para el resumen.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePrint = () => window.print();
  const handleShare = async () => {
    const shareData = {
      title: `Resumen - ${fiesta?.configuracion.nombreEvento}`,
      text: `Resumen operativo para el evento.`,
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) { await navigator.share(shareData); } 
      else { throw new Error(); }
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      toast({ title: "Enlace Copiado", description: "El enlace a esta página ha sido copiado a tu portapapeles." });
    }
  };

  if (isLoading) return <div className="p-8 max-w-3xl mx-auto bg-white"><div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></div>;
  if (error || !fiesta) return <div className="p-8 max-w-3xl mx-auto bg-white text-center"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold text-lg text-destructive">{error || 'No se encontró la fiesta'}</p></div>;

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/fiestas/nueva" passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button></Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / Guardar PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-3 text-center border-b pb-3 print:pb-2">
          <h1 className="text-xl font-bold text-primary print:text-lg">Resumen Operativo del Evento</h1>
          <p className="text-md text-gray-700 print:text-sm mt-1">{fiesta.configuracion.nombreEvento}</p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm print:text-xs mb-4">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"><CalendarDays className="w-4 h-4 text-primary"/><span>{formatDate(fiesta.configuracion.fechaEvento)}</span></div>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"><Users className="w-4 h-4 text-primary"/><span>{fiesta.configuracion.invitadosEstimados} Invitados</span></div>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md col-span-2 md:col-span-1"><MapPin className="w-4 h-4 text-primary"/><span>{fiesta.configuracion.nombreLugar}</span></div>
        </section>

        <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><Clock className="w-5 h-5"/>Itinerario</h2>
            {fiesta.programa && fiesta.programa.length > 0 ? (
                <ul className="space-y-1 text-sm print:text-xs">{fiesta.programa.map(p => <li key={p.id}><span className="font-bold">{p.hora}</span> - {p.titulo} {p.descripcion && `(${p.descripcion})`}</li>)}</ul>
            ) : <p className="text-sm text-muted-foreground italic">No hay itinerario definido.</p>}
        </section>

        <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><ChefHat className="w-5 h-5"/>Catering</h2>
            {menu ? <p className="text-sm">Menú Asignado: <span className="font-medium">{menu.name}</span></p> : <p className="text-sm text-muted-foreground italic">No hay menú asignado.</p>}
        </section>
        
        <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><Palette className="w-5 h-5"/>Decoración</h2>
            <p className="text-sm">Tema: <span className="font-medium">{fiesta.decoracion?.tema || 'No definido'}</span></p>
            <div className="flex items-center gap-2 text-sm">
                Paleta de Colores:
                <div className="w-4 h-4 rounded-full border" style={{backgroundColor: fiesta.decoracion?.paletaColores?.primary}}></div>
                <div className="w-4 h-4 rounded-full border" style={{backgroundColor: fiesta.decoracion?.paletaColores?.secondary}}></div>
                <div className="w-4 h-4 rounded-full border" style={{backgroundColor: fiesta.decoracion?.paletaColores?.accent}}></div>
            </div>
        </section>

         <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><UserCheck className="w-5 h-5"/>Personal Asignado</h2>
            {personal.length > 0 ? (
                <ul className="space-y-1 text-sm print:text-xs">{personal.map(p => <li key={p.nombre}>{p.nombre} ({p.rol})</li>)}</ul>
            ) : <p className="text-sm text-muted-foreground italic">No hay personal asignado.</p>}
        </section>
        
        <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400 print:mt-5 print:pt-2 print:border-gray-300">
          <p>Documento generado el: {new Date().toLocaleString('es-ES')}</p>
        </footer>
      </div>
    </div>
  );
}
