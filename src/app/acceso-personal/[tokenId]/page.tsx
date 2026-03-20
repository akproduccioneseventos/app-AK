'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, KeyRound, ArrowRight, Music2, Clock, PackageSearch, Palette, KanbanSquare, Cake, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAccesoById, type AccesoPersonal, type ModuloPermiso } from '@/app/actions/accesos-personal';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const MODULO_DETAILS: Record<ModuloPermiso, { label: string; href: string; icon: React.ElementType }> = {
  'musica': { label: 'Preferencias Musicales', href: '/fiestas/nueva/musica/pdf', icon: Music2 },
  'itinerario': { label: 'Itinerario del Evento', href: '/fiestas/nueva/itinerario/pdf', icon: Clock },
  'carga-operativa': { label: 'Lista de Carga Operativa', href: '/fiestas/nueva/carga-operativa/pdf', icon: PackageSearch },
  'decoracion': { label: 'Plan de Decoración', href: '/fiestas/nueva/decoracion/pdf', icon: Palette },
  'crm': { label: 'Gestión de Prospectos (CRM)', href: '/contabilidad/crm', icon: KanbanSquare },
  'reposteria': { label: 'Detalles de Repostería', href: '/fiestas/nueva/catering', icon: Cake },
  'fotografia': { label: 'Seguimiento de Material', href: '/fiestas/nueva/fotografia', icon: Camera },
};

export default function PortalPersonalPage({ params }: { params: { tokenId: string } }) {
  const { toast } = useToast();
  const [acceso, setAcceso] = useState<AccesoPersonal | null>(null);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (tokenId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAcceso = await getAccesoById(tokenId);
      if (!fetchedAcceso) {
        throw new Error("El enlace de acceso no es válido, ha expirado o ha sido revocado.");
      }
      
      // If the access is event-specific, load the event data.
      if (fetchedAcceso.fiestaId) {
        const fiestaData = await getFiestaById(fetchedAcceso.fiestaId);
        if(!fiestaData) {
            throw new Error("Este enlace de acceso es para un evento que ya no se ha encontrado.");
        }
        setFiesta(fiestaData);
      }
      setAcceso(fetchedAcceso);

    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error de Acceso", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (params.tokenId) {
      loadData(params.tokenId);
    }
  }, [params.tokenId, loadData]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  
  if (error || !acceso) {
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="max-w-lg text-center bg-destructive/10">
                <CardHeader>
                    <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
                    <CardTitle className="text-destructive font-headline text-2xl mt-4">Acceso Inválido</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{error || "No se pudo verificar el enlace de acceso."}</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  const portalTitle = fiesta ? `Portal para: ${fiesta.configuracion.nombreEvento}` : "Portal de Colaborador";

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
            <header className="text-center">
                <KeyRound className="w-12 h-12 mx-auto text-primary mb-3"/>
                <h1 className="text-3xl font-bold font-headline">{acceso.nombreAcceso}</h1>
                <p className="text-lg text-muted-foreground">{portalTitle}</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Módulos Disponibles</CardTitle>
                    <CardDescription>Haz clic en un módulo para ver los detalles relevantes para tu rol.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {acceso.permisos.map(permisoId => {
                        const modulo = MODULO_DETAILS[permisoId];
                        if (!modulo) return null;
                        const Icon = modulo.icon;
                        const isEventSpecific = ['musica', 'itinerario', 'carga-operativa', 'decoracion', 'reposteria', 'fotografia'].includes(permisoId);
                        
                        if (isEventSpecific && !fiesta) return null;

                        const linkHref = isEventSpecific ? `${modulo.href}?fiestaId=${fiesta!.id}` : modulo.href;

                        return (
                            <Link href={linkHref} key={permisoId} passHref>
                                <Button variant="outline" className="w-full h-auto justify-start p-4 text-left">
                                    <Icon className="w-6 h-6 mr-4 text-primary"/>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{modulo.label}</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto"/>
                                </Button>
                            </Link>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
