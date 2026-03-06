
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, ClipboardCheck, Printer, ChefHat, Music2, Palette, Clock, GlassWater, CakeSlice, Users, MapPin, CalendarDays, Edit3, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, DecorationItem } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getMenuById } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem } from '@/types/catering';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "No definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Inválida"; }
};

function ResumenPlanificacionContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      setFiesta(fiestaData);

      if (fiestaData.menuAsignadoId) {
        const menuData = await getMenuById(fiestaData.menuAsignadoId);
        setMenu(menuData);
      }
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error al cargar", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => window.print();

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (error || !fiesta) return <div className="text-center p-8 text-destructive"><AlertTriangle className="mx-auto mb-4" />{error}</div>;

  const totalInvitados = Number(fiesta.configuracion.invitadosEstimados) || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Consolidado de Planificación</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="secondary"><Printer className="w-4 h-4 mr-2"/>Imprimir / PDF</Button>
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      {/* CABECERA RESUMEN */}
      <Card className="shadow-lg border-primary/20 bg-primary/5">
        <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-3xl font-black text-primary font-headline uppercase">{fiesta.configuracion.nombreEvento}</h2>
                        <p className="text-muted-foreground font-medium flex items-center gap-2"><MapPin className="w-4 h-4"/> {fiesta.configuracion.nombreLugar}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm font-semibold">
                        <Badge variant="outline" className="bg-white py-1 px-3 border-primary/30 text-primary">
                            <CalendarDays className="w-4 h-4 mr-2"/> {formatDate(fiesta.configuracion.fechaEvento)}
                        </Badge>
                        <Badge variant="outline" className="bg-white py-1 px-3 border-primary/30 text-primary">
                            <Clock className="w-4 h-4 mr-2"/> {fiesta.configuracion.horaInicio} a {fiesta.configuracion.horaFin}
                        </Badge>
                        <Badge variant="outline" className="bg-white py-1 px-3 border-primary/30 text-primary">
                            <Users className="w-4 h-4 mr-2"/> {totalInvitados} Invitados
                        </Badge>
                    </div>
                </div>
                <div className="text-right flex flex-col justify-between items-end">
                    <div className="p-3 bg-white rounded-lg border border-primary/20 shadow-sm">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Presupuesto Estimado</p>
                        <p className="text-2xl font-black text-primary">{formatCurrency(Number(fiesta.configuracion.presupuestoEstimado))}</p>
                    </div>
                    <Link href={`/fiestas/nueva/configuracion?fiestaId=${fiestaId}`} className="print:hidden">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80"><Edit3 className="w-4 h-4 mr-2"/> Editar Datos</Button>
                    </Link>
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GASTRONOMÍA */}
        <Card className="shadow-md">
            <CardHeader className="bg-muted/30 border-b py-3">
                <CardTitle className="text-lg flex items-center gap-2"><ChefHat className="w-5 h-5 text-primary"/> Gastronomía y Menú</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {menu ? (
                    <div className="space-y-3">
                        <p className="font-bold text-primary">{menu.name}</p>
                        <div className="space-y-2">
                            {['Entrada', 'Plato Principal', 'Postre', 'Menú Infantil/Adolescente'].map(tipo => {
                                const items = menu.items.filter(i => i.type === tipo);
                                if (items.length === 0) return null;
                                return (
                                    <div key={tipo}>
                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">{tipo}</p>
                                        <ul className="text-sm list-disc list-inside">
                                            {items.map(i => <li key={i.id}>{i.name}</li>)}
                                        </ul>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : <p className="text-sm text-muted-foreground italic">No se ha seleccionado un menú del catálogo.</p>}
                
                <Separator />
                
                <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2"><CakeSlice className="w-4 h-4"/> Repostería</p>
                    <div className="space-y-2">
                        {fiesta.reposteria?.categorias.filter(c => c.activada).map(cat => (
                            <div key={cat.id} className="text-sm bg-muted/40 p-2 rounded">
                                <p className="font-semibold text-primary">{cat.nombreDisplay}</p>
                                <p className="text-xs text-muted-foreground">{cat.items.map(i => i.nombre).join(', ')}</p>
                            </div>
                        ))}
                        {fiesta.reposteria?.categorias.filter(c => c.activada).length === 0 && <p className="text-sm text-muted-foreground italic">Sin opciones de repostería activas.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* BEBIDAS Y MÚSICA */}
        <div className="space-y-6">
            <Card className="shadow-md">
                <CardHeader className="bg-muted/30 border-b py-3">
                    <CardTitle className="text-lg flex items-center gap-2"><GlassWater className="w-5 h-5 text-primary"/> Bebidas y Barra</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 gap-2">
                        {fiesta.bebidas?.categorias.filter(c => c.activada).map(cat => (
                            <Badge key={cat.id} variant="secondary" className="justify-start py-1.5 h-auto text-sm">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600"/> {cat.nombreDisplay}
                            </Badge>
                        ))}
                        {fiesta.bebidas?.categorias.filter(c => c.activada).length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">No hay servicios de bebida activados.</p>}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardHeader className="bg-muted/30 border-b py-3">
                    <CardTitle className="text-lg flex items-center gap-2"><Music2 className="w-5 h-5 text-primary"/> Preferencias Musicales</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-sm">
                    {fiesta.musica?.cancionEntrada && (
                        <div><p className="text-[10px] uppercase font-bold text-muted-foreground">Entrada</p><p className="font-medium">{fiesta.musica.cancionEntrada}</p></div>
                    )}
                    {fiesta.musica?.cancionVals && (
                        <div><p className="text-[10px] uppercase font-bold text-muted-foreground">Vals / Momento Especial</p><p className="font-medium">{fiesta.musica.cancionVals}</p></div>
                    )}
                    {(!fiesta.musica?.cancionEntrada && !fiesta.musica?.cancionVals) && <p className="text-muted-foreground italic">No hay canciones principales definidas.</p>}
                </CardContent>
            </Card>
        </div>

        {/* DECORACIÓN */}
        <Card className="shadow-md">
            <CardHeader className="bg-muted/30 border-b py-3">
                <CardTitle className="text-lg flex items-center gap-2"><Palette className="w-5 h-5 text-primary"/> Estilo y Decoración</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><span className="text-xs font-bold text-muted-foreground">Paleta:</span>
                        <div className="flex gap-1.5">
                            <div className="w-5 h-5 rounded-full border shadow-sm" style={{backgroundColor: fiesta.decoracion?.paletaColores?.primary}}></div>
                            <div className="w-5 h-5 rounded-full border shadow-sm" style={{backgroundColor: fiesta.decoracion?.paletaColores?.secondary}}></div>
                            <div className="w-5 h-5 rounded-full border shadow-sm" style={{backgroundColor: fiesta.decoracion?.paletaColores?.accent}}></div>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-muted"></div>
                    <div className="text-sm"><span className="font-bold text-muted-foreground">Tema:</span> {fiesta.decoracion?.tema || 'No definido'}</div>
                </div>
                
                <Separator />
                
                <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Zonas Especiales Contratadas</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {fiesta.decoracion?.zonasContratadas?.filter(z => z.activada).map(z => (
                            <div key={z.id} className="text-xs bg-muted/50 p-2 rounded flex items-center gap-2 border border-dashed border-primary/20">
                                <Sparkles className="w-3.5 h-3.5 text-primary"/> {z.nombreDisplay}
                            </div>
                        ))}
                        {fiesta.decoracion?.zonasContratadas?.filter(z => z.activada).length === 0 && <p className="text-xs text-muted-foreground italic">Sin zonas específicas activas.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* ITINERARIO */}
        <Card className="shadow-md">
            <CardHeader className="bg-muted/30 border-b py-3">
                <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Cronograma del Evento</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <ScrollArea className="h-64 pr-4">
                    <div className="space-y-6 relative pl-10">
                        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-primary/10"></div>
                        {(fiesta.programa || []).map(item => (
                            <div key={item.id} className="relative flex items-start gap-4">
                                <div className="absolute left-[-25px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white z-10"></div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-primary leading-none mb-1.5">{item.hora}</p>
                                    <p className="text-sm font-bold leading-tight">{item.titulo}</p>
                                    {item.descripcion && <p className="text-[10px] text-muted-foreground italic mt-0.5">{item.descripcion}</p>}
                                </div>
                            </div>
                        ))}
                        {(fiesta.programa || []).length === 0 && <p className="text-sm text-muted-foreground italic text-center py-10">Cronograma no definido aún.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>

      {/* NOTAS FINALES */}
      {fiesta.configuracion.notasAdicionales && (
          <Card className="shadow-md bg-yellow-50/30 border-yellow-200">
              <CardHeader className="py-3"><CardTitle className="text-sm font-bold uppercase tracking-widest text-yellow-800">Observaciones Generales</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-sm text-yellow-900 whitespace-pre-line">{fiesta.configuracion.notasAdicionales}</p>
              </CardContent>
          </Card>
      )}

      <footer className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em] border-t pt-8">
          Planificación Generada por AK Producciones - {new Date().toLocaleDateString('es-ES')}
      </footer>
    </div>
  );
}

export default function ResumenPlanificacionPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
        <ResumenPlanificacionContent />
    </Suspense>
  )
}
