
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, Loader2, AlertTriangle, ClipboardCheck, Printer, ChefHat, 
    Music2, Palette, Clock, GlassWater, CakeSlice, Users, MapPin, 
    CalendarDays, Edit3, Camera, UserCheck, FileText, CheckCircle2, 
    Info, Package, Sparkles, Archive, Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, DecorationItem } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getMenuById } from '@/app/actions/menus-catering';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import type { FullMenu, MenuItem } from '@/types/catering';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const [fiestaData, emps, rolesData] = await Promise.all([
        getFiestaById(fiestaId),
        getEmpleados(),
        getRoles()
      ]);
      
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      setFiesta(fiestaData);
      setEmpleados(emps);
      setRoles(rolesData);

      // Cargar datos vinculados
      const promises = [];
      if (fiestaData.menuAsignadoId) promises.push(getMenuById(fiestaData.menuAsignadoId));
      else promises.push(Promise.resolve(null));

      if (fiestaData.presupuestoId) promises.push(getPresupuestoById(fiestaData.presupuestoId));
      else promises.push(Promise.resolve(null));

      const [menuData, presData] = await Promise.all(promises);
      setMenu(menuData);
      setPresupuesto(presData);

    } catch (e: any) {
      setError(e.message);
      toast({ title: "Error al cargar consolidado", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => window.print();

  if (isLoading) return <div className="flex flex-col items-center justify-center h-screen space-y-4"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="font-bold uppercase tracking-widest text-slate-400">Generando Consolidado...</p></div>;
  if (error || !fiesta) return <div className="text-center p-8 text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-4" />{error}</div>;

  const totalInvitados = (presupuesto?.invitadosAdultos || 0) + (presupuesto?.invitadosNinos || 0) + (presupuesto?.invitadosAdolescentes || 0) || Number(fiesta.configuracion.invitadosEstimados) || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20"><ClipboardCheck className="w-6 h-6" /></div>
          <h1 className="text-3xl font-black tracking-tighter font-headline text-primary uppercase">Consolidado del Evento</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="secondary" className="rounded-xl font-bold"><Printer className="w-4 h-4 mr-2"/>Imprimir / PDF</Button>
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline" className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      {/* 1. CABECERA MAESTRA (SINCRO CONFIG + PRESUPUESTO) */}
      <Card className="shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
        <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-6">
                    <div>
                        <Badge className="bg-primary text-white border-none font-black text-[10px] tracking-widest uppercase mb-3 px-4 py-1 rounded-full">
                            {fiesta.configuracion.tipoCelebracion || 'Evento Social'}
                        </Badge>
                        <h2 className="text-4xl md:text-6xl font-black font-headline uppercase leading-none">{fiesta.configuracion.nombreEvento}</h2>
                        <p className="text-slate-400 font-bold flex items-center gap-2 mt-3 uppercase tracking-widest text-sm"><MapPin className="w-4 h-4 text-primary"/> {fiesta.configuracion.nombreLugar}</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fecha</span>
                            <span className="text-lg font-bold">{formatDate(fiesta.configuracion.fechaEvento)}</span>
                        </div>
                        <div className="w-px bg-white/10 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Horario</span>
                            <span className="text-lg font-bold">{fiesta.configuracion.horaInicio} - {fiesta.configuracion.horaFin || 'Fin'}</span>
                        </div>
                        <div className="w-px bg-white/10 hidden sm:block"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Capacidad</span>
                            <span className="text-lg font-bold">{totalInvitados} Personas</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-center items-center md:items-end gap-4">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl text-center md:text-right min-w-[200px]">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Inversión Pactada</p>
                        <p className="text-4xl font-black text-primary">{formatCurrency(Number(fiesta.configuracion.presupuestoEstimado))}</p>
                        {presupuesto?.ajusteAnualActivo && <p className="text-[9px] font-bold text-amber-500 mt-2">INCLUYE AJUSTE ANUAL 15%</p>}
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMNA IZQUIERDA: OPERATIVA Y GESTIÓN */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* 2. SERVICIOS DEL PRESUPUESTO (LO QUE SE VENDIÓ) */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary"/> Servicios Contratados (Presupuesto)
                        </CardTitle>
                        {presupuesto && <Badge variant="outline" className="font-bold border-primary/20 text-primary">Nº {presupuesto.numero}</Badge>}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-slate-100">
                                <TableHead className="pl-8 text-[10px] font-black uppercase text-slate-400">Servicio / Artículo</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase text-slate-400">Cant.</TableHead>
                                <TableHead className="text-right pr-8 text-[10px] font-black uppercase text-slate-400">Categoría</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {presupuesto ? presupuesto.itemsPresupuestados.map((item, idx) => (
                                <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/50">
                                    <TableCell className="pl-8 py-4 font-bold text-slate-700">
                                        <div className="flex items-center gap-2">
                                            {item.esRegalo && <Gift className="w-3.5 h-3.5 text-rose-500"/>}
                                            {item.nombreServicio}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-mono font-bold text-slate-500">{item.cantidad}</TableCell>
                                    <TableCell className="text-right pr-8">
                                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 border-none">
                                            {item.categoriaServicio}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={3} className="py-10 text-center text-slate-400 italic text-sm">No hay un presupuesto vinculado a este evento.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* 3. GASTRONOMÍA DETALLADA */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-primary/5 border-b border-primary/10 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <ChefHat className="w-5 h-5"/> Plan Gastronómico
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {menu ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {['Entrada', 'Plato Principal', 'Postre', 'Menú Infantil/Adolescente'].map(tipo => {
                                const items = menu.items.filter(i => i.type === tipo);
                                if (items.length === 0) return null;
                                return (
                                    <div key={tipo} className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> {tipo}
                                        </h4>
                                        <div className="space-y-2">
                                            {items.map(i => (
                                                <div key={i.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-sm text-slate-700">
                                                    {i.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-[2rem] bg-slate-50">
                            <Info className="w-10 h-10 mx-auto text-slate-200 mb-2"/>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin menú del catálogo seleccionado</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 flex items-center gap-2">
                                <CakeSlice className="w-4 h-4"/> Repostería Activa
                            </h4>
                            <div className="space-y-2">
                                {fiesta.reposteria?.categorias.filter(c => c.activada).map(cat => (
                                    <div key={cat.id} className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                                        <p className="font-black text-xs text-orange-800 uppercase tracking-tight mb-1">{cat.nombreDisplay}</p>
                                        <p className="text-xs text-orange-600/80 font-medium">{cat.items.map(i => i.nombre).join(', ')}</p>
                                    </div>
                                ))}
                                {fiesta.reposteria?.categorias.filter(c => c.activada).length === 0 && <p className="text-xs text-slate-400 italic">No hay repostería configurada.</p>}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                <GlassWater className="w-4 h-4"/> Bebidas y Barra
                            </h4>
                            <div className="space-y-2">
                                {fiesta.bebidas?.categorias.filter(c => c.activada).map(cat => (
                                    <div key={cat.id} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                        <p className="font-black text-xs text-blue-800 uppercase tracking-tight">{cat.nombreDisplay}</p>
                                        <CheckCircle2 className="w-4 h-4 text-blue-500"/>
                                    </div>
                                ))}
                                {fiesta.bebidas?.categorias.filter(c => c.activada).length === 0 && <p className="text-xs text-slate-400 italic">No hay bebidas configuradas.</p>}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* COLUMNA DERECHA: LOGÍSTICA, PERSONAL Y FOTO */}
        <div className="lg:col-span-4 space-y-8">
            
            {/* 4. PERSONAL ASIGNADO */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-primary"/> Staff Confirmado
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        {fiesta.personalAsignado && fiesta.personalAsignado.length > 0 ? (
                            fiesta.personalAsignado.map((pa, idx) => {
                                const emp = empleados.find(e => e.id === pa.empleadoId);
                                const rol = roles.find(r => r.id === pa.rolId);
                                return (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-slate-800 truncate">{emp?.nombre || 'N/A'}</p>
                                            <p className="text-[9px] font-black text-primary uppercase tracking-tighter">{rol?.nombre}</p>
                                        </div>
                                        <Badge className="bg-emerald-500 text-white border-none h-5 text-[8px] font-black">OK</Badge>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-center py-6 text-xs text-slate-400 italic font-medium">No se ha asignado personal aún.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 5. SEGUIMIENTO FOTO/VIDEO */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-purple-50/50 border-b border-purple-100 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-purple-800 flex items-center gap-2">
                        <Camera className="w-5 h-5"/> Seguimiento de Material
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        {fiesta.fotografiaYFilmacion?.servicios && fiesta.fotografiaYFilmacion.servicios.length > 0 ? (
                            fiesta.fotografiaYFilmacion.servicios.map(s => (
                                <div key={s.id} className="p-3 border rounded-2xl space-y-1">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-bold text-slate-800">{s.nombre}</p>
                                        <Badge variant="outline" className="text-[8px] h-4 font-black uppercase border-purple-200 text-purple-600">{s.estado}</Badge>
                                    </div>
                                    {s.fechaEntregaEstimada && (
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                            Entrega: {new Date(s.fechaEntregaEstimada).toLocaleDateString('es-UY')}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-6 text-xs text-slate-400 italic font-medium">Sin seguimiento activo.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 6. HITOS DEL ITINERARIO */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-slate-900 text-white">
                <CardHeader className="p-6 border-b border-white/5">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary"/> Hitos Principales
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-64">
                        <div className="divide-y divide-white/5">
                            {(fiesta.programa || []).map(item => (
                                <div key={item.id} className="p-4 flex items-start gap-4">
                                    <span className="text-primary font-black font-mono text-xs pt-0.5">{item.hora}</span>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm leading-tight">{item.titulo}</p>
                                        <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{item.descripcion}</p>
                                    </div>
                                </div>
                            ))}
                            {(fiesta.programa || []).length === 0 && (
                                <p className="p-8 text-center text-xs text-slate-500 font-bold uppercase tracking-widest">Cronograma no definido</p>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* 7. GESTIÓN DOCUMENTAL */}
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                        <Archive className="w-5 h-5 text-primary"/> Documentación
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-xs font-bold text-slate-600 uppercase">Contrato</span>
                        {fiesta.contratoFirmaInfo?.isSigned ? <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black">FIRMADO</Badge> : <Badge variant="outline" className="text-[8px] font-black uppercase">PENDIENTE</Badge>}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-xs font-bold text-slate-600 uppercase">Facturas</span>
                        <span className="text-xs font-black text-primary">{fiesta.invoiceIds?.length || 0} vinculadas</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Separator className="my-10 opacity-30"/>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ESTILO Y DECORACIÓN */}
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-pink-50/50 border-b border-pink-100 p-6">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-pink-800 flex items-center gap-2">
                      <Palette className="w-5 h-5"/> Concepto Estético
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-8">
                      <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paleta Maestro</p>
                          <div className="flex gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="w-8 h-8 rounded-xl shadow-lg border-2 border-white" style={{ backgroundColor: fiesta.decoracion?.paletaColores?.primary }}></div>
                              <div className="w-8 h-8 rounded-xl shadow-lg border-2 border-white" style={{ backgroundColor: fiesta.decoracion?.paletaColores?.secondary }}></div>
                              <div className="w-8 h-8 rounded-xl shadow-lg border-2 border-white" style={{ backgroundColor: fiesta.decoracion?.paletaColores?.accent }}></div>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tema</p>
                          <p className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{fiesta.decoracion?.tema || 'A DEFINIR'}</p>
                      </div>
                  </div>
                  <Separator/>
                  <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zonas Especiales Activas</p>
                      <div className="flex flex-wrap gap-2">
                          {fiesta.decoracion?.zonasContratadas?.filter(z => z.activada).map(z => (
                              <Badge key={z.id} className="bg-pink-100 text-pink-700 border-none font-black text-[9px] uppercase px-3 py-1 rounded-full">
                                  <Sparkles className="w-3 h-3 mr-1.5"/> {z.nombreDisplay}
                              </Badge>
                          ))}
                          {fiesta.decoracion?.zonasContratadas?.filter(z => z.activada).length === 0 && <p className="text-xs text-slate-400 italic">Sin zonas específicas.</p>}
                      </div>
                  </div>
              </CardContent>
          </Card>

          {/* OBSERVACIONES FINALES */}
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-amber-50">
              <CardHeader className="bg-amber-100/50 border-b border-amber-200 p-6">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-800 flex items-center gap-2">
                      <Info className="w-5 h-5"/> Notas Operativas Generales
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                  <p className="text-sm text-amber-900 font-medium leading-relaxed whitespace-pre-line">
                      {fiesta.configuracion.notasAdicionales || 'Sin observaciones adicionales registradas.'}
                  </p>
              </CardContent>
          </Card>
      </div>

      <footer className="text-center py-12 border-t border-slate-100 space-y-2">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Planificación Consolidada por AK Producciones</p>
          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Generado el {new Date().toLocaleDateString('es-ES')}</p>
      </footer>
    </div>
  );
}

export default function ResumenPlanificacionPage() {
  return (
    <Suspense fallback={null}>
        <ResumenPlanificacionContent />
    </Suspense>
  )
}
