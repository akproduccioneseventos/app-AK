
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Users, Trash2, Edit3, PlusCircle, ArrowLeft, Info, CheckCircle2, UserPlus2, UserMinus, Search, Save, Tag, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';
import type { CategoriaInvitado } from '@/types/invitado';
import { getFiestaById, updateInvitadoFiestaActual, deleteInvitadoFiestaActual, addInvitadoFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

function AsignacionMesasContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();
  const router = useRouter();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('all');

  // Form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<CategoriaInvitado>('Adulto');
  const [newTag, setNewTag] = useState('');
  
  const [editingGuest, setEditingGuest] = useState<Invitado | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError("No se proporcionó ID de evento.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if(!fiestaData) throw new Error("Evento no encontrado.");
      setFiesta(fiestaData);
    } catch (err: any) {
      setError("Error al cargar la información del evento.");
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSeatingModeChange = async (mode: 'numerada' | 'mixta' | 'libre') => {
    if (!fiestaId || !fiesta?.decoracion) return;
    
    const updatedDecoracion = { ...fiesta.decoracion, seatingMode: mode };
    
    // Optimistic UI update
    setFiesta({ ...fiesta, decoracion: updatedDecoracion });

    try {
        const result = await updateDecoracionFiestaActual(fiestaId, updatedDecoracion);
        if (result.success) {
            toast({ title: "Modo de asignación actualizado" });
        } else throw new Error(result.error);
    } catch (e: any) {
        toast({ title: "Error al guardar modo", description: e.message, variant: "destructive" });
        loadData(); // Revert on error
    }
  };

  const totalContractedAdults = fiesta ? Number(fiesta.configuracion.invitadosAdultos) || 0 : 0;
  const totalContractedKids = fiesta ? Number(fiesta.configuracion.invitadosNinos) || 0 : 0;
  
  const currentTotalAdults = fiesta?.invitados?.reduce((sum, inv) => sum + (inv.categoria === 'Adulto' ? (inv.partySize || 1) : 0), 0) || 0;
  const currentTotalKids = fiesta?.invitados?.reduce((sum, inv) => sum + (inv.categoria === 'Niño/Adolescente' ? (inv.partySize || 1) : 0), 0) || 0;

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiestaId || !newName.trim()) return;
    
    // Validar cupos según categoría
    if (newCategory === 'Adulto' && currentTotalAdults >= totalContractedAdults) {
        toast({ title: "Límite de Adultos alcanzado", variant: "destructive" });
        return;
    }
    if (newCategory === 'Niño/Adolescente' && currentTotalKids >= totalContractedKids) {
        toast({ title: "Límite de Niños alcanzado", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
        const result = await addInvitadoFiestaActual(fiestaId, {
            nombre: newName.trim(),
            categoria: newCategory,
            rsvp: 'Confirmado',
            partySize: 1,
            companionNames: [],
            tag: newTag || undefined
        });

        if (result.success) {
            setNewName('');
            setNewTag('');
            toast({ title: "Invitado añadido" });
            await loadData();
        } else throw new Error(result.error);
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
        const result = await deleteInvitadoFiestaActual(fiestaId, guestId);
        if (result.success) {
            toast({ title: "Invitado eliminado" });
            await loadData();
        } else throw new Error(result.error);
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleUpdateGuest = async (guest: Invitado) => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
        const result = await updateInvitadoFiestaActual(fiestaId, guest);
        if (result.success) {
            toast({ title: "Invitado actualizado" });
            setIsEditModalOpen(false);
            await loadData();
        } else throw new Error(result.error);
    } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const allTags = useMemo(() => {
      const tags = new Set<string>();
      fiesta?.invitados?.forEach(inv => { if(inv.tag) tags.add(inv.tag); });
      return Array.from(tags).sort();
  }, [fiesta?.invitados]);

  const filteredInvitados = useMemo(() => {
    if (!fiesta?.invitados) return [];
    const lower = searchTerm.toLowerCase();
    return fiesta.invitados
        .filter(inv => {
            const matchesSearch = inv.nombre.toLowerCase().includes(lower);
            const matchesTag = tagFilter === 'all' || inv.tag === tagFilter;
            return matchesSearch && matchesTag;
        })
        .sort((a,b) => a.nombre.localeCompare(b.nombre));
  }, [fiesta?.invitados, searchTerm, tagFilter]);

  const availableTables = useMemo(() => {
    return (fiesta?.decoracion?.salonElements || [])
        .filter(el => el.category?.includes("Mesa"))
        .map(el => {
            const assigned = (fiesta?.invitados || []).filter(inv => inv.tableNumber === el.name);
            const occupiedSeats = assigned.reduce((sum, g) => sum + (g.partySize || 1), 0);
            return {
                name: el.name,
                seats: el.seats || 0,
                occupied: occupiedSeats,
                remaining: (el.seats || 0) - occupiedSeats
            };
        });
  }, [fiesta]);

  if (isLoading || !fiesta) {
    return <div className="flex flex-col items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary mb-4" /><p>Cargando lista de invitados...</p></div>;
  }

  const relationshipOptions = fiesta.configuracion.tipoCelebracion === 'Boda' 
    ? ["Familia Novio", "Familia Novia", "Amigos Novio", "Amigos Novia", "Trabajo", "Otros"]
    : ["Familia", "Amigos", "Trabajo", "Otros"];

  const seatingMode = fiesta.decoracion?.seatingMode || 'mixta';

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary">{fiesta.configuracion.nombreEvento}</h1>
                    <p className="text-muted-foreground italic">Gestión de Lista de Invitados y Mesas</p>
                </div>
                <Link href={`/portal?fiestaId=${fiestaId}`} passHref>
                    <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Portal</Button>
                </Link>
            </header>

            {/* Modo de Asignación Card */}
            <Card className="shadow-lg border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary"/> Modo de Organización del Salón
                    </CardTitle>
                    <CardDescription>Define si tus invitados tendrán asientos asignados o ubicación libre.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup 
                        value={seatingMode} 
                        onValueChange={(v) => handleSeatingModeChange(v as any)}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <div className={cn(
                            "flex items-start space-x-3 p-4 border-2 rounded-2xl bg-white transition-all cursor-pointer",
                            seatingMode === 'numerada' ? "border-primary shadow-md" : "border-slate-100 hover:border-primary/30"
                        )}>
                            <RadioGroupItem value="numerada" id="mode-numerada" className="mt-1" />
                            <Label htmlFor="mode-numerada" className="cursor-pointer">
                                <p className="font-bold text-sm">Mesas Numeradas</p>
                                <p className="text-[10px] text-muted-foreground uppercase leading-tight mt-1">Todos los invitados tienen un lugar asignado.</p>
                            </Label>
                        </div>
                        <div className={cn(
                            "flex items-start space-x-3 p-4 border-2 rounded-2xl bg-white transition-all cursor-pointer",
                            seatingMode === 'mixta' ? "border-primary shadow-md" : "border-slate-100 hover:border-primary/30"
                        )}>
                            <RadioGroupItem value="mixta" id="mode-mixta" className="mt-1" />
                            <Label htmlFor="mode-mixta" className="cursor-pointer">
                                <p className="font-bold text-sm">Distribución Mixta</p>
                                <p className="text-[10px] text-muted-foreground uppercase leading-tight mt-1">Mesas reservadas y zonas de ubicación libre.</p>
                            </Label>
                        </div>
                        <div className={cn(
                            "flex items-start space-x-3 p-4 border-2 rounded-2xl bg-white transition-all cursor-pointer",
                            seatingMode === 'libre' ? "border-primary shadow-md" : "border-slate-100 hover:border-primary/30"
                        )}>
                            <RadioGroupItem value="libre" id="mode-libre" className="mt-1" />
                            <Label htmlFor="mode-libre" className="cursor-pointer">
                                <p className="font-bold text-sm">Ubicación Libre</p>
                                <p className="text-[10px] text-muted-foreground uppercase leading-tight mt-1">Sin asignación. Los invitados eligen dónde sentarse.</p>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* Cupos Categorizados Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-md border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center justify-between uppercase text-blue-800">
                            <span>Adultos</span>
                            <span className="font-black">{currentTotalAdults} / {totalContractedAdults}</span>
                        </CardTitle>
                        <Progress value={(currentTotalAdults / totalContractedAdults) * 100} className="h-2 bg-blue-100" />
                    </CardHeader>
                </Card>
                <Card className="shadow-md border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center justify-between uppercase text-purple-800">
                            <span>Niños y Adolescentes</span>
                            <span className="font-black">{currentTotalKids} / {totalContractedKids}</span>
                        </CardTitle>
                        <Progress value={(currentTotalKids / totalContractedKids) * 100} className="h-2 bg-purple-100" />
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-4 h-fit">
                    <CardHeader><CardTitle className="text-lg">Añadir Invitado</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddGuest} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Nombre Completo</Label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)} disabled={isSaving} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Categoría</Label>
                                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as CategoriaInvitado)} disabled={isSaving}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Adulto">Adulto</SelectItem>
                                        <SelectItem value="Niño/Adolescente">Niño / Adolescente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Relación</Label>
                                <Select value={newTag} onValueChange={setNewTag} disabled={isSaving}>
                                    <SelectTrigger><SelectValue placeholder="Elegir..."/></SelectTrigger>
                                    <SelectContent>{relationshipOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSaving || !newName.trim()}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UserPlus2 className="w-4 h-4 mr-2"/>}
                                Añadir
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-8">
                    <CardHeader className="p-6 bg-slate-50/50 border-b">
                        <div className="flex justify-between items-center">
                            <CardTitle>Listado</CardTitle>
                            <div className="flex gap-2">
                                <Input placeholder="Buscar..." className="h-9 w-40 text-xs" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                                <Select value={tagFilter} onValueChange={setTagFilter}>
                                    <SelectTrigger className="h-9 w-28 text-xs"><SelectValue placeholder="Grupo"/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader><TableRow className="bg-slate-50"><TableHead className="pl-6">Nombre</TableHead><TableHead>Mesa</TableHead><TableHead className="text-right pr-6">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredInvitados.map(guest => (
                                        <TableRow key={guest.id}>
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm">{guest.nombre}</p>
                                                    {seatingMode === 'numerada' && !guest.tableNumber && (
                                                        <AlertTriangle className="w-3 h-3 text-rose-500" title="Falta asignar mesa" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground uppercase">{guest.categoria}</p>
                                            </TableCell>
                                            <TableCell>
                                                {seatingMode === 'libre' ? (
                                                    <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase bg-slate-50">Libre</Badge>
                                                ) : (
                                                    <Select value={guest.tableNumber || 'sin-mesa'} onValueChange={(val) => handleUpdateGuest({...guest, tableNumber: val === 'sin-mesa' ? undefined : val})}>
                                                        <SelectTrigger className={cn(
                                                            "h-8 text-xs w-[110px]",
                                                            !guest.tableNumber && seatingMode === 'numerada' ? "border-rose-300 text-rose-600" : ""
                                                        )}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="sin-mesa">Sin Mesa</SelectItem>
                                                            {availableTables.map(t => <SelectItem key={t.name} value={t.name}>{t.name} ({t.occupied}/{t.seats})</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteGuest(guest.id)}><Trash2 className="w-4 h-4"/></Button></TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredInvitados.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-10 text-center text-muted-foreground italic">No se encontraron invitados.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

export default function MesaPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <AsignacionMesasContent />
        </Suspense>
    );
}
