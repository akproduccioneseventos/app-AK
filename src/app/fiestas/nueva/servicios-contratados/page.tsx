
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, ClipboardList, ChefHat, Palette, Camera, Music2, Shield, Printer } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { FullMenu } from '@/types/catering';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getMenuById } from '@/app/actions/menus-catering';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { Badge } from '@/components/ui/badge';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

interface SubServicioItem {
  id: string;
  nombre: string;
  proveedor?: string;
  modalidad?: string;
  estado?: 'Confirmado' | 'Pendiente' | 'En ejecución';
  comentarios?: string;
}

export default function ServiciosContratadosPage() {
  const { toast } = useToast();
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [personalConRol, setPersonalConRol] = useState<{ empleado: Empleado, rol?: Rol }[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiesta = await getFiestaActual();
      setFiestaActual(fiesta);

      if (fiesta.configuracion.clienteId) {
        const clienteData = await getCustomerById(fiesta.configuracion.clienteId);
        setClienteNombre(clienteData?.name || clienteData?.companyName || 'Cliente no especificado');
      } else {
        setClienteNombre(fiesta.configuracion.nombreEvento || 'Evento sin cliente asignado');
      }

      if (fiesta.presupuestoId) {
        const presData = await getPresupuestoById(fiesta.presupuestoId);
        setPresupuesto(presData);
      }

      if (fiesta.menuAsignadoId) {
        const menuData = await getMenuById(fiesta.menuAsignadoId);
        setMenu(menuData);
      }

      if (fiesta.personalAsignado && fiesta.personalAsignado.length > 0) {
        const [empleadosData, rolesData] = await Promise.all([getEmpleados(), getRoles()]);
        const personalDetallado = fiesta.personalAsignado.map(pa => {
          const empleado = empleadosData.find(e => e.id === pa.empleadoId);
          const rol = empleado?.rolId ? rolesData.find(r => r.id === empleado.rolId) : undefined;
          return { empleado: empleado!, rol }; // Aseguramos que empleado exista o filtramos antes
        }).filter(p => p.empleado);
        setPersonalConRol(personalDetallado);
      }

    } catch (err: any) {
      console.error("Error loading data for Servicios Contratados:", err);
      setError("No se pudieron cargar los detalles de los servicios contratados.");
      toast({ title: "Error de Carga", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderSubServicios = (items: SubServicioItem[]) => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-muted-foreground italic px-4 py-2">No hay subservicios detallados para esta categoría.</p>;
    }
    return (
      <ul className="space-y-2 pt-2">
        {items.map(item => (
          <li key={item.id} className="p-3 border rounded-md bg-muted/20 hover:bg-muted/40">
            <div className="flex justify-between items-start">
              <p className="font-medium text-sm">{item.nombre}</p>
              <Badge variant={item.estado === 'Confirmado' ? 'default' : item.estado === 'Pendiente' ? 'outline' : 'secondary'} className="text-xs whitespace-nowrap">{item.estado || 'Pendiente'}</Badge>
            </div>
            {item.proveedor && <p className="text-xs text-muted-foreground">Proveedor: {item.proveedor}</p>}
            {item.modalidad && <p className="text-xs text-muted-foreground">Modalidad: {item.modalidad}</p>}
            {item.comentarios && <p className="text-xs text-muted-foreground mt-1"><i>Notas: {item.comentarios}</i></p>}
          </li>
        ))}
      </ul>
    );
  };

  const allItems = useMemo(() => {
      const allServices: Record<string, SubServicioItem[]> = {
          catering: [],
          decoracion: [],
          fotografia: [],
          musica: [],
          seguridad: []
      };

      if (menu) {
        menu.items.forEach(plato => allServices.catering.push({
          id: `plato-${plato.id}`,
          nombre: `${plato.type}: ${plato.name}`,
          estado: 'Confirmado',
          modalidad: 'Incluido en menú'
        }));
      }
      personalConRol.forEach(p => {
        const item: SubServicioItem = {
          id: `personal-${p.empleado.id}`,
          nombre: `Personal: ${p.empleado.nombre} (${p.rol?.nombre || 'Sin rol'})`,
          estado: 'Confirmado',
          modalidad: 'Por evento'
        };
        // Asignar a una categoría más específica si es posible
        if (p.rol?.categoriaServicio?.toLowerCase().includes('catering') || p.rol?.categoriaServicio?.toLowerCase().includes('personal')) {
          allServices.catering.push(item);
        } else if (p.rol?.categoriaServicio?.toLowerCase().includes('discoteca')) {
          allServices.musica.push(item);
        } else if (p.rol?.categoriaServicio?.toLowerCase().includes('seguridad')) {
          allServices.seguridad.push(item);
        } else if (p.rol?.categoriaServicio?.toLowerCase().includes('foto') || p.rol?.categoriaServicio?.toLowerCase().includes('video')) {
          allServices.fotografia.push(item);
        } else {
            allServices.catering.push(item); // Fallback to catering
        }
      });
      presupuesto?.itemsPresupuestados?.forEach(s => {
        const item: SubServicioItem = { id: `sa-${s.idServicioCatalogo}`, nombre: s.nombreServicio, estado: 'Confirmado', modalidad: 'Según presupuesto' };
        if (s.categoriaServicio?.toLowerCase().includes('catering') || s.categoriaServicio?.toLowerCase().includes('vajilla') || s.categoriaServicio?.toLowerCase().includes('mantelería') || s.categoriaServicio?.toLowerCase().includes('mobiliario')) {
          allServices.catering.push(item);
        } else if (s.categoriaServicio?.toLowerCase().includes('decoraci')) {
          allServices.decoracion.push(item);
        } else if (s.categoriaServicio?.toLowerCase().includes('foto') || s.categoriaServicio?.toLowerCase().includes('video')) {
          allServices.fotografia.push(item);
        } else if (s.categoriaServicio?.toLowerCase().includes('dj') || s.categoriaServicio?.toLowerCase().includes('música') || s.categoriaServicio?.toLowerCase().includes('discoteca')) {
          allServices.musica.push(item);
        } else if (s.categoriaServicio?.toLowerCase().includes('seguridad') || s.categoriaServicio?.toLowerCase().includes('portero')) {
          allServices.seguridad.push(item);
        }
      });

      if (fiestaActual?.decoracion) {
        if (fiestaActual.decoracion.tema) {
          allServices.decoracion.push({ id: 'deco-tema', nombre: `Tema: ${fiestaActual.decoracion.tema}`, estado: 'Confirmado' });
        }
        fiestaActual.decoracion.zonasContratadas?.filter(z => z.activada).forEach(zona => {
          allServices.decoracion.push({ id: `zona-${zona.id}`, nombre: `Zona: ${zona.nombreDisplay}`, comentarios: zona.descripcion, estado: 'Confirmado' });
        });
        if (fiestaActual.decoracion.colorGlobos) {
          allServices.decoracion.push({ id: 'deco-globos', nombre: `Globos: ${fiestaActual.decoracion.colorGlobos}`, estado: 'Confirmado' });
        }
      }

      return allServices;
  }, [menu, personalConRol, presupuesto, fiestaActual]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando servicios contratados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />
        <p className="font-semibold text-lg text-destructive">Error al Cargar</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={loadData} className="mt-4" variant="outline">Reintentar</Button>
      </div>
    );
  }
  
  if (!fiestaActual) {
     return <div className="text-center py-10"><p className="text-muted-foreground">No hay datos de fiesta actual.</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Servicios Contratados</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaActual.id}`}>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Planificador</Button>
        </Link>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader className="bg-muted/30 p-4">
          <CardTitle className="font-headline text-lg">{fiestaActual.configuracion.nombreEvento}</CardTitle>
          <CardDescription>
            Fecha: {formatDate(fiestaActual.configuracion.fechaEvento)} | Cliente: {clienteNombre}
          </CardDescription>
        </CardHeader>
      </Card>

      <Accordion type="multiple" defaultValue={['catering', 'decoracion']} className="w-full space-y-3">
        <AccordionItem value="catering" className="border rounded-lg shadow-sm">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
            <div className="flex items-center gap-2"><ChefHat className="w-5 h-5"/>Catering</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 border-t">
            {renderSubServicios(allItems.catering)}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="decoracion" className="border rounded-lg shadow-sm">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
            <div className="flex items-center gap-2"><Palette className="w-5 h-5"/>Decoración</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 border-t">
            {renderSubServicios(allItems.decoracion)}
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="fotografia" className="border rounded-lg shadow-sm">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
            <div className="flex items-center gap-2"><Camera className="w-5 h-5"/>Fotografía y Video</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 border-t">
            {renderSubServicios(allItems.fotografia)}
             {allItems.fotografia.length === 0 && <p className="text-sm text-muted-foreground italic px-4 py-2">No hay servicios de fotografía/video en el presupuesto.</p>}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="musica" className="border rounded-lg shadow-sm">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
            <div className="flex items-center gap-2"><Music2 className="w-5 h-5"/>Música y DJ</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 border-t">
            {renderSubServicios(allItems.musica)}
             {allItems.musica.length === 0 && <p className="text-sm text-muted-foreground italic px-4 py-2">No hay servicios de música/DJ en el presupuesto.</p>}
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="seguridad" className="border rounded-lg shadow-sm">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-lg font-medium text-primary hover:bg-muted/50 rounded-t-lg">
            <div className="flex items-center gap-2"><Shield className="w-5 h-5"/>Seguridad</div>
          </AccordionTrigger>
          <AccordionContent className="p-4 border-t">
            {renderSubServicios(allItems.seguridad)}
             {allItems.seguridad.length === 0 && <p className="text-sm text-muted-foreground italic px-4 py-2">No hay servicios de seguridad en el presupuesto.</p>}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="pt-6 text-center print:hidden">
        <Button variant="outline" disabled>
            <Printer className="w-4 h-4 mr-2"/>Exportar Resumen PDF (Próximamente)
        </Button>
      </div>
    </div>
  );
}


    