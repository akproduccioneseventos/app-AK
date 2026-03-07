
'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Zap, Loader2, AlertTriangle, Clock, CheckCircle2, Truck, Users, 
    Smartphone, Phone, MapPin, PartyPopper, Bell, RefreshCw, 
    ArrowLeft, ClipboardList, Info, CircleAlert, Check, X, ShieldAlert
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateProgramaFiestaActual } from '@/app/actions/fiesta-actual';
import { 
    toggleArrival, setStaffCheckIn, confirmProtagonistArrival, 
    resetArrivalRadar, addIncidente, resolveIncidente 
} from '@/app/actions/fiesta/live.actions';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import type { FiestaEnPlanificacion, Empleado, Rol, ProgramaEventoItem } from '@/types/fiesta';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

function LiveEventDashboardContent() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [incidenteInput, setIncidenteInput] = useState('');

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
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [fiestaId, toast]);

    useEffect(() => {
        loadData();
        const interval = setInterval(() => loadData(false), 5000); // Polling every 5s for live updates
        return () => clearInterval(interval);
    }, [loadData]);

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
        const updatedPrograma = (fiesta.programa || []).map(p => 
            p.id === itemId ? { ...p, completado: !p.completado } : p
        );
        const res = await updateProgramaFiestaActual(fiestaId, updatedPrograma);
        if (res.success) await loadData(false);
    };

    const handleAddIncidente = async () => {
        if (!fiestaId || !incidenteInput.trim()) return;
        const res = await addIncidente(fiestaId, incidenteInput);
        if (res.success) {
            setIncidenteInput('');
            await loadData(false);
        }
    };

    const celiacosConfirmados = useMemo(() => 
        (fiesta?.invitados || []).filter(i => i.isCeliac && i.rsvp === 'Confirmado'), 
    [fiesta?.invitados]);

    const asistentesPresentes = useMemo(() => 
        (fiesta?.invitados || []).filter(i => i.checkedIn).reduce((s, g) => s + (g.partySize || 1), 0),
    [fiesta?.invitados]);

    const totalConfirmados = useMemo(() => 
        (fiesta?.invitados || []).filter(i => i.rsvp === 'Confirmado').reduce((s, g) => s + (g.partySize || 1), 0),
    [fiesta?.invitados]);

    if (isLoading || !fiesta) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="font-black uppercase tracking-[0.3em] text-slate-500">Iniciando Centro de Mando...</p>
            </div>
        );
    }

    const radar = fiesta.liveState?.llegadaProtagonistas;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 selection:bg-primary selection:text-white">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* HEADER DE COMANDO */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary rounded-2xl shadow-2xl shadow-primary/40 text-white animate-pulse">
                            <Zap className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase font-headline">EVENTO EN VIVO</h1>
                            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary"/> {fiesta.configuracion.nombreEvento}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button variant="ghost" onClick={() => loadData(true)} className="rounded-xl h-12 bg-white/5 hover:bg-white/10 text-white">
                            <RefreshCw className="w-4 h-4 mr-2"/> Sincronizar
                        </Button>
                        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref className="flex-1 md:flex-none">
                            <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 text-white hover:bg-white/5">
                                <ArrowLeft className="w-4 h-4 mr-2"/> Salir del Modo Vivo
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* RADAR DE LLEGADA - ALERTA CRÍTICA */}
                <AnimatePresence>
                    {radar?.enCamino && (
                        <Card className="bg-rose-600 border-none shadow-[0_0_50px_rgba(225,29,72,0.5)] rounded-[2.5rem] overflow-hidden animate-pulse">
                            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                                <div className="flex items-center gap-6 text-center md:text-left">
                                    <div className="p-5 bg-white rounded-3xl text-rose-600 shadow-xl">
                                        <Bell className="w-10 h-10 animate-bounce" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">¡VIENEN EN CAMINO!</h2>
                                        <p className="text-lg font-bold opacity-80 mt-2">Aviso recibido el {new Date(radar.timestampAviso!).toLocaleTimeString('es-UY')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <Button onClick={() => confirmProtagonistArrival(fiestaId!)} className="h-16 px-10 rounded-2xl bg-white text-rose-600 hover:bg-slate-100 font-black text-lg shadow-2xl">LLEGARON</Button>
                                    <Button onClick={() => resetArrivalRadar(fiestaId!)} variant="ghost" className="h-16 px-6 rounded-2xl text-white hover:bg-black/20"><X className="w-6 h-6"/></Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* COLUMNA IZQUIERDA: LOGÍSTICA Y PERSONAL */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* ENTREGAS DE PROVEEDORES */}
                        <Card className="bg-slate-900/80 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                        <Truck className="w-5 h-5 text-primary"/> Recepción de Proveedores e Insumos
                                    </CardTitle>
                                    <Badge className="bg-primary/20 text-primary border-none">{fiesta.liveState?.entregas.filter(e=>e.llego).length || 0} / {fiesta.liveState?.entregas.length || 3}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(fiesta.liveState?.entregas || initialLiveState.entregas).map(entrega => (
                                        <button 
                                            key={entrega.id}
                                            onClick={() => handleToggleDelivery(entrega.id)}
                                            className={cn(
                                                "p-5 rounded-3xl border-2 transition-all text-left flex flex-col gap-2 relative overflow-hidden group",
                                                entrega.llego 
                                                    ? "bg-emerald-500/10 border-emerald-500/50" 
                                                    : "bg-slate-800/50 border-white/5 hover:border-primary/30"
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className={cn("p-2 rounded-xl", entrega.llego ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400")}>
                                                    {entrega.llego ? <CheckCircle2 className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}
                                                </div>
                                                <span className="text-[10px] font-black uppercase opacity-40">{entrega.horaEstimada} HS</span>
                                            </div>
                                            <p className="font-bold text-lg mt-2">{entrega.nombre}</p>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{entrega.proveedor}</p>
                                            {entrega.timestampLlegada && (
                                                <p className="text-[9px] font-bold text-emerald-500 mt-2">RECIBIDO: {new Date(entrega.timestampLlegada).toLocaleTimeString('es-UY')}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* STAFF TRACKING */}
                        <Card className="bg-slate-900/80 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                    <Users className="w-5 h-5 text-primary"/> Checklist de Personal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/5">
                                            <TableHead className="text-[10px] uppercase font-black text-slate-500 pl-8">Empleado / Rol</TableHead>
                                            <TableHead className="text-center text-[10px] uppercase font-black text-slate-500">Asistencia</TableHead>
                                            <TableHead className="text-right text-[10px] uppercase font-black text-slate-500 pr-8">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fiesta.personalAsignado?.map(pa => {
                                            const emp = empleados.find(e => e.id === pa.empleadoId);
                                            const rol = roles.find(r => r.id === pa.rolId);
                                            const status = fiesta.liveState?.staffCheckIn?.[pa.empleadoId] || { llego: false };
                                            return (
                                                <TableRow key={pa.empleadoId} className="border-white/5 hover:bg-white/5 transition-colors">
                                                    <TableCell className="pl-8 py-4">
                                                        <p className="font-bold text-white">{emp?.nombre || 'Sin nombre'}</p>
                                                        <p className="text-[10px] uppercase font-black text-primary/60 tracking-widest">{rol?.nombre}</p>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <button 
                                                            onClick={() => handleStaffCheckIn(pa.empleadoId, status.llego)}
                                                            className={cn(
                                                                "h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                                status.llego ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-800 text-slate-500 hover:text-white"
                                                            )}
                                                        >
                                                            {status.llego ? `Llegó ${status.hora ? new Date(status.hora).toLocaleTimeString('es-UY', {hour:'2-digit', minute:'2-digit'}) : ''}` : 'Pendiente'}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-8">
                                                        {emp?.phone && (
                                                            <Button size="sm" variant="ghost" asChild className="rounded-xl h-10 w-10 text-primary hover:bg-primary/10">
                                                                <a href={`tel:${emp.phone}`}><Phone className="w-4 h-4"/></a>
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* COLUMNA DERECHA: CRONOGRAMA, INVITADOS E INCIDENTES */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* ASISTENCIA EN VIVO */}
                        <Card className="bg-primary shadow-3xl shadow-primary/20 border-none rounded-[2.5rem] overflow-hidden text-white">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-widest">Estado de Recepción</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="text-5xl font-black tracking-tighter">{asistentesPresentes}</div>
                                    <div className="text-xl font-bold opacity-60">de {totalConfirmados}</div>
                                </div>
                                <Progress value={(asistentesPresentes/totalConfirmados)*100} className="h-3 bg-black/20" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/10 p-3 rounded-2xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Mesas Activas</p>
                                        <p className="text-xl font-bold">{fiesta.decoracion?.salonElements?.filter(e=>e.category?.includes('Mesa')).length || 0}</p>
                                    </div>
                                    <div className="bg-black/10 p-3 rounded-2xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Faltantes</p>
                                        <p className="text-xl font-bold">{totalConfirmados - asistentesPresentes}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ALERTAS DE SALUD */}
                        <Card className="bg-amber-500 border-none shadow-xl shadow-amber-500/20 rounded-[2.5rem] overflow-hidden text-slate-900">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5"/> Seguridad Alimentaria
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {celiacosConfirmados.length > 0 ? celiacosConfirmados.map(c => (
                                    <div key={c.id} className="bg-white/20 backdrop-blur-md p-3 rounded-2xl flex justify-between items-center border border-white/10">
                                        <span className="font-bold text-sm">{c.nombre}</span>
                                        <Badge className="bg-slate-900 text-white border-none font-black text-[9px] tracking-widest uppercase">
                                            {c.tableNumber ? `MESA ${c.tableNumber}` : 'LIBRE'}
                                        </Badge>
                                    </div>
                                )) : (
                                    <p className="text-sm font-bold opacity-60 italic text-center py-4">Sin alertas para hoy.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* CRONOGRAMA INTERACTIVO */}
                        <Card className="bg-slate-900/80 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                    <PartyPopper className="w-5 h-5 text-primary"/> Seguimiento de Itinerario
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-80">
                                    <div className="p-6 space-y-6">
                                        {(fiesta.programa || []).map(item => (
                                            <div key={item.id} className="flex gap-4 group">
                                                <button 
                                                    onClick={() => handleToggleItineraryItem(item.id)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all",
                                                        item.completado ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/10 text-slate-600 hover:border-primary/50"
                                                    )}
                                                >
                                                    {item.completado ? <Check className="w-5 h-5"/> : <div className="w-2 h-2 rounded-full bg-slate-700"/>}
                                                </button>
                                                <div className="space-y-0.5">
                                                    <p className={cn("text-xs font-black uppercase tracking-widest", item.completado ? "text-emerald-500" : "text-slate-500")}>{item.hora} HS</p>
                                                    <p className={cn("font-bold text-sm", item.completado && "line-through text-slate-600")}>{item.titulo}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* BITÁCORA DE INCIDENTES */}
                        <Card className="bg-slate-900/80 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-6">
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                    <CircleAlert className="w-5 h-5 text-rose-500"/> Registro de Novedades
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 space-y-4">
                                <div className="flex gap-2">
                                    <Input 
                                        value={incidenteInput} 
                                        onChange={e => setIncidenteInput(e.target.value)} 
                                        placeholder="Ej: Rotura cristal mesa 4"
                                        className="h-12 rounded-xl bg-white/5 border-white/10 text-white"
                                    />
                                    <Button onClick={handleAddIncidente} size="icon" className="h-12 w-12 rounded-xl shrink-0"><PlusCircle/></Button>
                                </div>
                                <div className="space-y-2">
                                    {(fiesta.liveState?.incidentes || []).map(inc => (
                                        <div key={inc.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-slate-500">{new Date(inc.hora).toLocaleTimeString('es-UY')}</p>
                                                <p className="text-xs font-bold truncate">{inc.descripcion}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => resolveIncidente(fiestaId!, inc.id)} className={cn("h-8 w-8 rounded-full", inc.resuelto ? "text-emerald-500" : "text-slate-600 hover:bg-emerald-500/10")}><Check className="w-4 h-4"/></Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
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
