
'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, Info, CalendarDays, Users, MapPin, ChefHat, Palette, UserCheck, Clock, Loader2, ListChecks } from 'lucide-react';
import type { FiestaEnPlanificacion, Tarea, ProgramaEventoItem, DecorationItem } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { FullMenu, MenuItem } from '@/types/catering';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getMenuById } from '@/app/actions/menus-catering';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

const companyName = "AK Producciones";

function ResumenImprimibleContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [personal, setPersonal] = useState<{ nombre: string, rol: string }[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError("Falta el ID del evento.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, templateSettings] = await Promise.all([
        getFiestaById(fiestaId),
        getInvoiceTemplateSettings()
      ]);
      
      if (!fiestaData) throw new Error("Evento no encontrado.");
      setFiesta(fiestaData);
      setLogoUrl(templateSettings.logoUrl);

      const dataPromises: Promise<any>[] = [];
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
          const empleado = empleadosData.find((e:any) => e.id === pa.empleadoId);
          if (!empleado) return null;
          // Correctly find the role using the rolId from the assignment
          const rol = rolesData.find((r:any) => r.id === pa.rolId);
          return { nombre: empleado.nombre, rol: rol?.nombre || 'Sin rol asignado' };
        }).filter(Boolean);
        setPersonal(personalDetallado as { nombre: string, rol: string }[]);
      }

    } catch (err: any) {
      setError("No se pudieron cargar todos los datos para el resumen.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
      console.error("Error loading data for PDF:", err);
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

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
      toast({ title: "Enlace Copiado", description: "El enlace ha sido copiado a tu portapapeles." });
    }
  };

  const platosAgrupados = React.useMemo(() => {
    if (!menu) return {};
    return menu.items.reduce((acc, item) => {
        const categoria = item.type || 'Otros';
        if (!acc[categoria]) acc[categoria] = [];
        acc[categoria].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [menu]);

  const itemsDecoracionAgrupados = React.useMemo(() => 
    (fiesta?.decoracion?.items || []).reduce((acc, item) => {
        const categoria = item.category || 'Otros';
        if (!acc[categoria]) acc[categoria] = [];
        acc[categoria].push(item);
        return acc;
    }, {} as Record<string, DecorationItem[]>), 
  [fiesta?.decoracion?.items]);


  if (isLoading) { return <div className="p-8 max-w-3xl mx-auto bg-white"><div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></div>; }
  if (error || !fiesta) { return <div className="p-8 max-w-3xl mx-auto text-center"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold text-lg text-destructive">{error || 'No se encontró la fiesta'}</p></div>; }
  
  const { configuracion, decoracion, tareas } = fiesta;
  const tareasPendientes = tareas?.filter(t => !t.completada) || [];

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button></Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-3 text-center border-b pb-3 print:pb-2">
           {logoUrl && (
                <div className="w-24 h-24 mx-auto mb-2 print:w-20 print:h-20">
                    <Image src={logoUrl} alt={`${companyName} Logo`} width={96} height={96} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
          <h1 className="text-xl font-bold text-primary print:text-lg">Resumen Operativo del Evento</h1>
          <p className="text-md text-gray-700 print:text-sm mt-1">{configuracion.nombreEvento}</p>
          {cliente && <p className="text-sm text-gray-600 print:text-xs">Cliente: {cliente.name || cliente.companyName}</p>}
        </header>
        
        <section className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm print:text-xs mb-4">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"><CalendarDays className="w-4 h-4 text-primary"/><span>{formatDate(configuracion.fechaEvento)}</span></div>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"><Users className="w-4 h-4 text-primary"/><span>{configuracion.invitadosEstimados} Invitados</span></div>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md col-span-2 md:col-span-1"><MapPin className="w-4 h-4 text-primary"/><span>{configuracion.nombreLugar}</span></div>
        </section>

        <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><Clock className="w-5 h-5"/>Cronograma</h2>
            {fiesta.programa && fiesta.programa.length > 0 ? (
                <ul className="space-y-1 text-sm print:text-xs">{fiesta.programa.map(p => <li key={p.id}><span className="font-bold">{p.hora}</span> - {p.titulo} {p.descripcion && `(${p.descripcion})`}</li>)}</ul>
            ) : <p className="text-sm text-muted-foreground italic">No hay cronograma definido.</p>}
        </section>

        <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><ChefHat className="w-5 h-5"/>Catering</h2>
            {menu ? (
                <div className="text-sm space-y-2">
                    <p>Menú Asignado: <span className="font-medium">{menu.name}</span></p>
                    {Object.keys(platosAgrupados).length > 0 && (
                        <div className="pl-4">
                            {Object.entries(platosAgrupados).map(([categoria, platos]) => (
                                <div key={categoria} className="mt-1">
                                    <h4 className="font-semibold text-xs uppercase text-muted-foreground">{categoria}</h4>
                                    <ul className="list-disc list-inside pl-2">
                                        {platos.map(p => <li key={p.id}>{p.name}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : <p className="text-sm text-muted-foreground italic">No hay menú asignado.</p>}
        </section>
        
        <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><Palette className="w-5 h-5"/>Decoración</h2>
            <p className="text-sm">Tema: <span className="font-medium">{decoracion?.tema || 'No definido'}</span></p>
            <div className="flex items-center gap-2 text-sm">
                Paleta de Colores:
                <div className="w-4 h-4 rounded-full border" style={{backgroundColor: decoracion?.paletaColores?.primary}}></div>
                <div className="w-4 h-4 rounded-full border" style={{backgroundColor: decoracion?.paletaColores?.secondary}}></div>
                <div className="w-4 h-4 rounded-full border" style={{backgroundColor: decoracion?.paletaColores?.accent}}></div>
            </div>
             {decoracion?.items && decoracion.items.length > 0 && (
                <div className="mt-2 text-sm">
                    <h4 className="font-semibold text-xs uppercase text-muted-foreground">Elementos Específicos:</h4>
                    <ul className="list-disc list-inside pl-2 text-xs">
                        {Object.entries(itemsDecoracionAgrupados).map(([categoria, items]) => (
                            <li key={categoria} className="font-medium">{categoria}: <span className="font-normal">{items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</span></li>
                        ))}
                    </ul>
                </div>
            )}
        </section>

         <section className="mb-4 print:mb-2 print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><UserCheck className="w-5 h-5"/>Personal Asignado</h2>
            {personal.length > 0 ? (
                <ul className="space-y-1 text-sm print:text-xs">{personal.map(p => <li key={p.nombre}>{p.nombre} ({p.rol})</li>)}</ul>
            ) : <p className="text-sm text-muted-foreground italic">No hay personal asignado.</p>}
        </section>
        
        <section className="mb-4 print:mb-2 print:break-before-page print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><ListChecks className="w-5 h-5"/>Tareas Pendientes</h2>
            {tareasPendientes.length > 0 ? (
                <ul className="space-y-1 text-sm print:text-xs list-disc list-inside">
                    {tareasPendientes.map(t => <li key={t.id}>{t.texto}{t.asignadaA && ` - (${t.asignadaA})`}</li>)}
                </ul>
            ) : <p className="text-sm text-muted-foreground italic">No hay tareas pendientes.</p>}
        </section>
        
        <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400 print:mt-5 print:pt-2 print:border-gray-300">
          <p>Documento generado por {companyName} el: {new Date().toLocaleString('es-ES')}</p>
        </footer>
      </div>
    </div>
  );
}

export default function ResumenImprimiblePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 max-w-3xl mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>}>
        <ResumenImprimibleContent />
    </Suspense>
  )
}

    