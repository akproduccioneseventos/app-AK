'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, KeyRound, ArrowRight, Music2, Clock, PackageSearch, Palette, KanbanSquare, Cake, Camera, FileText, Users, Receipt, UserCog, Truck, Building, Calculator, CalendarCheck, MapPin, Phone, User, Calendar, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type AccesoPersonal, type ModuloPermiso } from '@/app/actions/accesos-personal';
import { getAccesoPersonalPortalView } from '@/app/actions/accesos-personal-view';
import { andaPorEnlace } from '@/lib/auth/permisos-por-enlace';
import { CompanyLogo } from '@/components/company-logo';
import { PublicFooter } from '@/components/public-footer';

const MODULO_DETAILS: Record<ModuloPermiso, { label: string; href: string; icon: React.ElementType }> = {
  'musica': { label: 'Preferencias Musicales', href: '/fiestas/nueva/musica/pdf', icon: Music2 },
  'itinerario': { label: 'Itinerario del Evento', href: '/fiestas/nueva/itinerario/pdf', icon: Clock },
  'carga-operativa': { label: 'Lista de Carga Operativa', href: '/fiestas/nueva/carga-operativa/pdf', icon: PackageSearch },
  'decoracion': { label: 'Plan de Decoración', href: '/fiestas/nueva/decoracion/pdf', icon: Palette },
  'crm': { label: 'Gestión de Prospectos (CRM)', href: '/contabilidad/crm', icon: KanbanSquare },
  'reposteria': { label: 'Detalles de Repostería', href: '/fiestas/nueva/catering', icon: Cake },
  'fotografia': { label: 'Seguimiento de Material', href: '/fiestas/nueva/fotografia', icon: Camera },
  'presupuestos': { label: 'Presupuestos', href: '/presupuestos', icon: FileText },
  'clientes': { label: 'Base de Clientes', href: '/customers', icon: Users },
  'facturas': { label: 'Facturación', href: '/invoices', icon: Receipt },
  'empleados': { label: 'Gestión de Personal', href: '/empleados', icon: UserCog },
  'proveedores': { label: 'Proveedores', href: '/proveedores', icon: Truck },
  'empresa': { label: 'Módulo Empresa', href: '/empresa', icon: Building },
  'contabilidad': { label: 'Contabilidad y Finanzas', href: '/empresa/contabilidad', icon: Calculator },
  'calendario': { label: 'Calendario de Eventos', href: '/calendario', icon: CalendarCheck },
};

export default function PortalPersonalPage() {
  const params = useParams<{ tokenId: string }>();
  const { toast } = useToast();
  const [acceso, setAcceso] = useState<AccesoPersonal | null>(null);
  const [fiesta, setFiesta] = useState<NonNullable<Awaited<ReturnType<typeof getAccesoPersonalPortalView>>>['fiesta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (tokenId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const portalView = await getAccesoPersonalPortalView(tokenId);
      if (!portalView) {
        throw new Error("El enlace de acceso no es válido, ha expirado o ha sido revocado.");
      }
      setFiesta(portalView.fiesta || null);
      setAcceso(portalView.acceso);

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

  const portalTitle = fiesta ? `Portal para: ${fiesta.nombreEvento}` : "Portal de Colaborador";

  // Solo se muestran los modulos que este enlace puede abrir de verdad. Los
  // nueve generales -contabilidad, clientes, facturas y demas- se ofrecian y
  // llevaban a la pantalla de ingreso, porque son internas y el enlace no da
  // sesion. Ya no se pueden dar, pero un acceso viejo puede tenerlos guardados:
  // por eso se filtran aca tambien, y no solo en la pantalla que los crea.
  const modulosQueAndan = acceso.permisos.filter(andaPorEnlace);

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      <div className="flex-grow p-4 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
            <header className="text-center">
                <div className="mb-4 opacity-40">
                  <CompanyLogo size="sm" className="mx-auto" />
                </div>
                <KeyRound className="w-12 h-12 mx-auto text-primary mb-3"/>
                <h1 className="text-3xl font-bold font-headline">{acceso.nombreAcceso}</h1>
                <p className="text-lg text-muted-foreground">{portalTitle}</p>
            </header>

            {/* Night Plan Card */}
            {fiesta ? (
              <Card className="border-l-4 border-l-primary shadow-md">
                <CardHeader className="bg-slate-50 border-b rounded-t-lg pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Tu Plan de la Noche
                  </CardTitle>
                  <CardDescription>
                    Detalles de tu asignación para "{fiesta.nombreEvento}"
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Tu Rol</p>
                        <p className="text-sm text-slate-700">{fiesta.rolAsignado}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Hora de Inicio</p>
                        <p className="text-sm text-slate-700">{fiesta.horaInicio || 'A confirmar'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Ubicación</p>
                        <p className="text-sm text-slate-700">{fiesta.lugar || 'A confirmar'}</p>
                        {fiesta.direccion && <p className="text-xs text-slate-500">{fiesta.direccion}</p>}
                      </div>
                    </div>
                    {fiesta.telefonoEncargado && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">Encargado / Asistencia</p>
                          <a href={`tel:${fiesta.telefonoEncargado}`} className="text-sm text-blue-600 hover:underline">Llamar: {fiesta.telefonoEncargado}</a>
                        </div>
                      </div>
                    )}
                  </div>

                  {fiesta.programa && fiesta.programa.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="text-sm font-bold text-slate-800 mb-3">Momentos Clave de la Noche</h4>
                      <div className="space-y-3">
                        {fiesta.programa.map(item => (
                          <div key={item.id} className="flex gap-3 text-sm">
                            <div className="w-12 flex-shrink-0 text-slate-500 font-medium">{item.hora}</div>
                            <div className="flex-grow">
                              <p className="font-semibold text-slate-800">{item.titulo}</p>
                              {item.descripcion && <p className="text-xs text-slate-500">{item.descripcion}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 pb-6 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <h3 className="text-lg font-bold text-green-800">Todo libre por ahora</h3>
                  <p className="text-sm text-green-700 mt-1">No tenés ningún evento próximo asignado. ¡Que disfrutes tu descanso!</p>
                </CardContent>
              </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Módulos Disponibles</CardTitle>
                    <CardDescription>Haz clic en un módulo para ver los detalles relevantes para tu rol.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {modulosQueAndan.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Este enlace todavía no tiene nada para ver. Pedile a AK Producciones que le
                        agregue los módulos de la fiesta.
                      </p>
                    )}
                    {modulosQueAndan.map(permisoId => {
                        const modulo = MODULO_DETAILS[permisoId];
                        if (!modulo) return null;
                        const Icon = modulo.icon;

                        if (!fiesta) return null;

                        // Todos los que quedan son del evento y llevan la llave:
                        // el servidor la comprueba contra esta fiesta.
                        const linkHref = `${modulo.href}?fiestaId=${fiesta.id}&token=${encodeURIComponent(acceso.id)}&operatorName=${encodeURIComponent(acceso.nombreAcceso)}`;

                        return (
                            <Button key={permisoId} asChild variant="outline" className="w-full h-auto justify-start p-4 text-left">
                              <Link href={linkHref}>
                                    <Icon className="w-6 h-6 mr-4 text-primary"/>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{modulo.label}</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto"/>
                               </Link>
                            </Button>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
