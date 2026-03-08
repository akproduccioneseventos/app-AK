
'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Zap, Loader2, CircleCheckBig, Truck, Users, 
    PartyPopper, Bell, RefreshCw, 
    ArrowLeft, ClipboardList, Info, Check, X, ShieldAlert, 
    PackageSearch, RotateCcw, Share2, Wallet, PlusCircle, Clock, TriangleAlert
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateProgramaFiestaActual } from '@/app/actions/fiesta-actual';
import { 
    toggleArrival, setStaffCheckIn, confirmProtagonistArrival, 
    resetArrivalRadar, addIncidente, resolveIncidente, toggleReturnItem 
} from '@/app/actions/fiesta/live.actions';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { getInvoiceById } from '@/app/actions/invoices';
import type { FiestaEnPlanificacion, Empleado, Rol, ProgramaEventoItem } from '@/types/fiesta';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

function LiveEventDashboardContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [saldoPendiente, setSaldoPendiente] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [incidenteInput, setIncidenteInput] = useState('');
    const [eventDuration, setEventDuration] = useState('00:00:00');

    const loadData = useCallback(async (showLoading = true) => {
        if (!fiestaId) return;
        if (showLoading) setIsLoading(true);
        try {
            const [fiestaData, empData, rolesData] = await Promise.all([
                getFiestaById(fiestaId),
                getEmpleados(),
                getRoles()
            ]);
            if (!fiestaData) throw new Error("Fiesta no encontrada");
            setFiesta(fiestaData);
            setEmpleados(empData);
            setRoles(rolesData);

            if (fiestaData.invoiceIds && fiestaData.invoiceIds.length > 0) {
                let totalPagado = 0;
                for (const id of fiestaData.invoiceIds) {
                    const inv = await getInvoiceById(id);
                    if (inv) {
                        totalPagado += inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                    }
                }
                const totalAcordado = fiestaData.configuracion.presupuestoEstimado || 0;
                setSaldoPendiente(totalAcordado - totalPagado);
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [fiestaId, toast]);

    useEffect(() => {
        loadData();
        const interval = setInterval(() => loadData(false), 10000); 
        return () => clearInterval(interval);
    }, [loadData]);

    useEffect(() => {
        if (!fiesta?.configuracion.fechaEvento) return;
        const timer = setInterval(() => {
            const start = new Date(fiesta.configuracion.fechaEvento!);
            if (fiesta.configuracion.horaInicio) {
                const [h, m] = fiesta.configuracion.horaInicio.split(':').map(Number);
                start.setHours(h, m, 0, 0);
            }
            const now = new Date();
            const diff = now.getTime() - start.getTime();
            if (diff > 0) {
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setEventDuration(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [fiesta?.configuracion]);

    const handleToggleDelivery = async (id: string) => {
        if (!fiestaId) return;
        setIsActionLoading(id);
        const res = await toggleArrival(fiestaId, id);
        if (res.success) await loadData(false);
        setIsActionLoading(null);
    };

    const handleStaffCheckIn = async (empId: string, current: boolean) => {
        if (!fiestaId) return;
        setIsActionLoading(empId);
        const res = await setStaffCheckIn(fiestaId, empId, !current);
        if (res.success) await loadData(false);
        setIsActionLoading(null);
    };

    const handleToggleItineraryItem = async (itemId: string) => {
        if (!fiesta || !fiestaId) return;
        const updatedPrograma = (fiesta.programa || []).map(p => p.id === itemId ? { ...p, completado: !p.completado } : p);
        const res = await updateProgramaFiestaActual(fiestaId, updatedPrograma);
        if (res.success) await loadData(false);
    };

    const handleAddIncidente = async () => {
        if (!fiestaId || !incidenteInput.trim()) return;
        const res = await addIncidente(fiestaId, incidenteInput);
        if (res.success) { setIncidenteInput(''); await loadData(false); }
    };

    const handleToggleReturn = async (catId: string, itemId: string) => {
        if (!fiestaId) return;
        setIsActionLoading(itemId);
        const res = await toggleReturnItem(fiestaId, catId, itemId);
        if (res.success) await loadData(false);
        setIsActionLoading(null);
    };

    const asistentesPresentes = useMemo(() => (fiesta?.invitados || []).filter(i => i.checkedIn).reduce((s, g) => s + (g.partySize || 1), 0), [fiesta?.invitados]);
    const totalCeliacosPresentes = useMemo(() => (fiesta?.invitados || []).filter(i => i.checkedIn && i.isCeliac).length, [fiesta?.invitados]);
    const totalConfirmados = useMemo(() => (fiesta?.invitados || []).filter(i => i.rsvp === 'Confirmado').reduce((s, g) => s + (g.partySize || 1), 0), [fiesta?.invitados]);

    const handleShareUtilsLink = () => {
        const url = `${window.location.origin}/fiestas/nueva/carga-operativa/retorno?fiestaId=${fiestaId}`;
        window.open(`https://wa.me/?text=${encodeURIComponent('Hola, aquí tienes el enlace para el control de retorno al camión: ' + url)}`, '_blank');
    };

    if (isLoading || !fiesta) return <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white"><Loader2 className="w-12 h-12 animate-spin text-primary mb-4" /><p className="font-black uppercase tracking-widest text-slate-500">Iniciando Centro de Mando...</p></div>;

    const radar = fiesta.liveState?.llegadaProtagonistas;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary rounded-2xl shadow-2xl shadow-primary/40 text-white"><Zap className="w-8 h-8" /></div>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase font-headline">CENTRO DE OPERACIONES</h1>
                            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary"/> JORNADA: <span className="text-white font-mono">{eventDuration}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => loadData(true)} className="rounded-xl h-12 bg-white/5 hover:bg-white/10 text-white">
                            <RefreshCw className="w-4 h-4 mr-2"/> Sincronizar
                        </Button>
                        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref>
                            <Button variant="outline" className="h-12 rounded-xl border-white/10 text-white hover:bg-white/5">
                                <ArrowLeft className="w-4 h-4 mr-2"/> Salir
                            </Button>
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {saldoPendiente > 0 && (
                        <Card className="bg-amber-600 border-none rounded-3xl shadow-xl animate-in fade-in slide-in-from-left-4">
                            <CardContent className="p-6 flex items-center gap-4 text-white">
                                <div className="p-3 bg-white/20 rounded-2xl"><Wallet className="w-8 h-8"/></div>
                                <div><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Saldo por Cobrar Hoy</p><p className="text-2xl font-black">{new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(saldoPendiente)}</p></div>
                            </CardContent>
                        </Card>
                    )}
                    {totalCeliacosPresentes > 0 && (
                        <Card className="bg-blue-600 border-none rounded-3xl shadow-xl animate-in fade-in slide-in-from-right-4">
                            <CardContent className="p-6 flex items-center gap-4 text-white">
                                <div className="p-3 bg-white/20 rounded-2xl"><ShieldAlert className="w-8 h-8"/></div>
                                <div><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Seguridad Alimentaria</p><p className="text-2xl font-black">{totalCeliacosPresentes} Celíacos en Salón</p></div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <AnimatePresence>
                    {radar?.enCamino && (
                        <Card className="bg-rose-600 border-none shadow-[0_0_50px_rgba(225,29,72,0.5)] rounded-[2.5rem] overflow-hidden animate-pulse">
                            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                                <div className="flex items-center gap-6"><div className="p-5 bg-white rounded-3xl text-rose-600 shadow-xl"><Bell className="w-10 h-10 animate-bounce" /></div><div><h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">¡ESTÁN LLEGANDO!</h2><p className="text-lg font-bold opacity-80 mt-2">Aviso recibido a las {new Date(radar.timestampAviso!).toLocaleTimeString('es-ES')}</p></div></div>
                                <div className="flex gap-3"><Button onClick={() => confirmProtagonistArrival(fiestaId!)} className="h-16 px-10 rounded-2xl bg-white text-rose-600 hover:bg-slate-100 font-black text-lg shadow-2xl">CONFIRMAR LLEGADA</Button><Button onClick={() => resetArrivalRadar(fiestaId!)} variant="ghost" className="h-16 px-6 rounded-2xl text-white hover:bg-black/20"><X className="w-6 h-6"/></Button></div>
                            </CardContent>
                        </Card>
                    )}
                </AnimatePresence>

                <Tabs defaultValue="operaciones" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-900 h-16 p-1 rounded-2xl border border-white/5 mb-8">
                        <TabsTrigger value="operaciones" className="rounded-xl font-black uppercase text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Panel de Comando</TabsTrigger>
                        <TabsTrigger value="retorno" className="rounded-xl font-black uppercase text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Logística Inversa</TabsTrigger>
                    </TabsList>

                    <TabsContent value="operaciones" className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8 space-y-8">
                                <Card className="bg-slate-900/80 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="bg-white/5 border-b border-white/5 p-6 flex flex-row items-center justify-between">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Truck className="w-5 h-5 text-primary"/> Recepción Crítica</CardTitle>
                                        <Button variant="ghost" size="sm" onClick={() => confirmProtagonistArrival(fiestaId!)} className="text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 border border-primary/20 rounded-full h-7 px-4">Aviso Manual Llegada</Button>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {fiesta.liveState?.entregas.map(entrega => (
                                                <button key={entrega.id} onClick={() => handleToggleDelivery(entrega.id)} className={cn("p-5 rounded-3xl border-2 transition-all text-left flex flex-col gap-2", entrega.llego ? "bg-emerald-500/10 border-emerald-500/50" : "bg-slate-800/50 border-white/5")}>
                                                    <div className="flex justify-between items-start"><div className={cn("p-2 rounded-xl", entrega.llego ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400")}>{entrega.llego ? <CircleCheckBig className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}</div><span className="text-[10px] font-black uppercase opacity-40">{entrega.horaEstimada} HS</span></div>
                                                    <p className="font-bold text-lg mt-2">{entrega.nombre}</p><p className="text-[10px] uppercase font-black text-slate-500">{entrega.proveedor}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-900/80 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="bg-white/5 border-b border-white/5 p-6"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Users className="w-5 h-5 text-primary"/> Checklist de Personal</CardTitle></CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-white/5"><TableRow className="border-white/5"><TableHead className="text-[10px] uppercase font-black text-slate-500 pl-8">Empleado</TableHead><TableHead className="text-center text-[10px] uppercase font-black text-slate-500">Estado</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {fiesta.personalAsignado?.map(pa => {
                                                    const emp = empleados.find(e => e.id === pa.empleadoId);
                                                    const status = fiesta.liveState?.staffCheckIn?.[pa.empleadoId] || { llego: false };
                                                    return (
                                                        <TableRow key={pa.empleadoId} className="border-white/5 hover:bg-white/5">
                                                            <TableCell className="pl-8 py-4"><p className="font-bold text-white">{emp?.nombre || 'N/A'}</p><p className="text-[10px] uppercase font-black text-primary/60">{roles.find(r=>r.id===pa.rolId)?.nombre}</p></TableCell>
                                                            <TableCell className="text-center"><button onClick={() => handleStaffCheckIn(pa.empleadoId, status.llego)} className={cn("h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest", status.llego ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-800 text-slate-500")}>{status.llego ? 'Presente' : 'Pendiente'}</button></TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-4 space-y-8">
                                <Card className="bg-primary shadow-3xl shadow-primary/20 border-none rounded-[2.5rem] overflow-hidden text-white">
                                    <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Recepción</CardTitle></CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex justify-between items-end"><div className="text-5xl font-black">{asistentesPresentes}</div><div className="text-xl font-bold opacity-60">de {totalConfirmados}</div></div>
                                        <Progress value={(asistentesPresentes/Math.max(1, totalConfirmados))*100} className="h-3 bg-black/20" />
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-900/80 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="bg-white/5 border-b border-white/5 p-6"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><PartyPopper className="w-5 h-5 text-primary"/> Hitos del Itinerario</CardTitle></CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {fiesta.programa?.map(item => (
                                                <button key={item.id} onClick={() => handleToggleItineraryItem(item.id)} className={cn("w-full p-4 rounded-2xl flex items-center justify-between transition-all", item.completado ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-slate-400 hover:bg-white/10")}>
                                                    <span className="font-bold text-sm">{item.titulo}</span><span className="text-xs font-black">{item.hora}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-900/80 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="p-6 flex flex-row items-center justify-between"><CardTitle className="text-sm font-black uppercase tracking-widest text-rose-500">Bitácora de Incidentes</CardTitle></CardHeader>
                                    <CardContent className="p-6 pt-0 space-y-4">
                                        <div className="flex gap-2">
                                            <Input value={incidenteInput} onChange={e => setIncidenteInput(e.target.value)} placeholder="Ej: Rotura cristal mesa 4" className="h-12 rounded-xl bg-white/5 border-white/10" />
                                            <Button onClick={handleAddIncidente} size="icon" className="h-12 w-12 rounded-xl shrink-0"><PlusCircle/></Button>
                                        </div>
                                        <ScrollArea className="h-40">
                                            <div className="space-y-2">
                                                {fiesta.liveState?.incidentes.map(inc => (
                                                    <div key={inc.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center group">
                                                        <span className={cn("text-xs font-bold", inc.resuelto && "line-through opacity-40")}>{inc.descripcion}</span>
                                                        <Button variant="ghost" size="icon" onClick={() => resolveIncidente(fiestaId!, inc.id)} className={cn("h-8 w-8 rounded-full", inc.resuelto ? "text-emerald-500" : "text-slate-600")}><Check className="w-4 h-4"/></Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="retorno" className="space-y-8">
                        <Card className="bg-slate-900/80 border-white/5 shadow-3xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-primary/10 border-b border-white/5 p-8 text-center relative">
                                <div className="p-4 bg-primary/20 rounded-3xl w-fit mx-auto mb-4"><PackageSearch className="w-10 h-10 text-primary" /></div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tighter text-white">Logística de Retorno</CardTitle>
                                <div className="absolute top-8 right-8">
                                    <Button onClick={handleShareUtilsLink} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 h-12 px-6 font-black uppercase tracking-widest shadow-xl">
                                        <Share2 className="w-4 h-4 mr-2"/> Enlace Utileros
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                {(!fiesta.listaDeCargaOperativa?.categorias || fiesta.listaDeCargaOperativa.categorias.length === 0) ? (
                                    <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/10"><p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No hay una lista de carga base.</p></div>
                                ) : (
                                    <div className="space-y-10">
                                        {fiesta.listaDeCargaOperativa.categorias.map(cat => (
                                            <div key={cat.id} className="space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3"><div className="w-1 h-4 bg-primary rounded-full"></div>{cat.nombre}</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {cat.items.map(item => (
                                                        <button key={item.id} onClick={() => handleToggleReturn(cat.id, item.id)} className={cn("p-5 rounded-3xl border-2 transition-all text-left flex items-center justify-between group", item.retornado ? "bg-emerald-500/10 border-emerald-500/50" : "bg-slate-800/50 border-white/5 hover:border-primary/30")}>
                                                            <div className="flex flex-col"><span className={cn("font-bold text-lg", item.retornado ? "text-emerald-500 line-through opacity-60" : "text-white")}>{item.nombre}</span><span className="text-[10px] font-black uppercase tracking-widest opacity-40">CANT: {item.cantidad}</span></div>
                                                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all", item.retornado ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-500")}>{item.retornado ? <Check className="w-6 h-6"/> : <RotateCcw className="w-5 h-5"/>}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default function LiveEventPage() {
    return (
        <Suspense fallback={null}>
            <LiveEventDashboardContent />
        </Suspense>
    );
}
