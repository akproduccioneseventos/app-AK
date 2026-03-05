
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Users, Trash2, Edit3, PlusCircle, ArrowLeft, Info, CheckCircle2, UserPlus2, UserMinus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';
import type { CategoriaInvitado } from '@/types/invitado';
import { getFiestaById, updateInvitadoFiestaActual, deleteInvitadoFiestaActual, addInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

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

  // Form states
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<CategoriaInvitado>('Adulto');
  
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
  
  const totalContracted = Number(fiesta?.configuracion.invitadosEstimados) || 0;
  const currentTotal = fiesta?.invitados?.reduce((sum, inv) => sum + (inv.partySize || 1), 0) || 0;
  const isLimitReached = currentTotal >= totalContracted;

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiestaId || !newName.trim()) return;
    
    if (isLimitReached) {
        toast({
            title: "Límite alcanzado",
            description: "Has alcanzado el máximo de invitados contratados. Contacta al organizador para ampliar el cupo.",
            variant: "destructive"
        });
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
        });

        if (result.success) {
            setNewName('');
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

  const filteredInvitados = useMemo(() => {
    if (!fiesta?.invitados) return [];
    const lower = searchTerm.toLowerCase();
    return fiesta.invitados
        .filter(inv => inv.nombre.toLowerCase().includes(lower))
        .sort((a,b) => a.nombre.localeCompare(b.nombre));
  }, [fiesta?.invitados, searchTerm]);

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

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen p-4">
            <Card className="max-w-md text-center bg-destructive/10">
                <CardHeader>
                    <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
                    <CardTitle className="text-destructive">Error</CardTitle>
                </CardHeader>
                <CardContent><p>{error}</p></CardContent>
            </Card>
        </div>
    );
  }

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

            {/* Cupos Card */}
            <Card className="shadow-md border-primary/20">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center mb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary"/>
                            Control de Cupos Contratados
                        </CardTitle>
                        <Badge variant={isLimitReached ? "destructive" : "secondary"} className="font-bold">
                            {currentTotal} / {totalContracted} invitados
                        </Badge>
                    </div>
                    <Progress value={(currentTotal / totalContracted) * 100} className="h-3" />
                </CardHeader>
                <CardContent>
                    {isLimitReached ? (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-3 text-sm font-medium">
                            <AlertTriangle className="w-5 h-5"/>
                            Has alcanzado el límite de invitados contratados. Para añadir más, contacta con el equipo de AK Producciones.
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5"/>
                            Te quedan {totalContracted - currentTotal} cupos disponibles para agregar.
                        </p>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Col */}
                <Card className="lg:col-span-4 h-fit sticky top-20">
                    <CardHeader>
                        <CardTitle className="text-lg">Añadir Invitado</CardTitle>
                        <CardDescription>Carga cada persona de forma individual.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddGuest} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="guest-name">Nombre Completo</Label>
                                <Input 
                                    id="guest-name" 
                                    placeholder="Ej: Juan Pérez" 
                                    value={newName} 
                                    onChange={e => setNewName(e.target.value)}
                                    disabled={isSaving || isLimitReached}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="guest-cat">Categoría (para Menú)</Label>
                                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as CategoriaInvitado)} disabled={isSaving || isLimitReached}>
                                    <SelectTrigger id="guest-cat"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Adulto">Adulto</SelectItem>
                                        <SelectItem value="Niño/Adolescente">Niño / Adolescente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSaving || isLimitReached || !newName.trim()}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UserPlus2 className="w-4 h-4 mr-2"/>}
                                Añadir a la Lista
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List Col */}
                <Card className="lg:col-span-8">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Listado de Invitados</CardTitle>
                            <CardDescription>Revisa y asigna mesas a tus invitados.</CardDescription>
                        </div>
                        <div className="relative w-48">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar..." 
                                className="pl-8 h-9 text-xs" 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Mesa</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvitados.map(guest => (
                                        <TableRow key={guest.id}>
                                            <TableCell className="font-medium text-sm">{guest.nombre}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                                                    {guest.categoria || 'Adulto'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Select 
                                                    value={guest.tableNumber || 'sin-mesa'} 
                                                    onValueChange={(val) => handleUpdateGuest({...guest, tableNumber: val === 'sin-mesa' ? undefined : val})}
                                                    disabled={isSaving}
                                                >
                                                    <SelectTrigger className="h-8 text-xs w-[120px]">
                                                        <SelectValue placeholder="Mesa..."/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="sin-mesa" className="text-destructive font-semibold">Sin Mesa</SelectItem>
                                                        <Separator className="my-1"/>
                                                        {availableTables.map(t => (
                                                            <SelectItem key={t.name} value={t.name}>
                                                                {t.name} ({t.occupied}/{t.seats})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingGuest(guest); setIsEditModalOpen(true); }}>
                                                        <Edit3 className="w-4 h-4"/>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteGuest(guest.id)}>
                                                        <Trash2 className="w-4 h-4"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredInvitados.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                                                No hay invitados en la lista.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Invitado</DialogTitle>
                    <DialogDescription>Actualiza el nombre o la categoría de este invitado.</DialogDescription>
                </DialogHeader>
                {editingGuest && (
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name">Nombre Completo</Label>
                            <Input id="edit-name" value={editingGuest.nombre} onChange={e => setEditingGuest({...editingGuest, nombre: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-cat">Categoría</Label>
                            <Select value={editingGuest.categoria || 'Adulto'} onValueChange={(v) => setEditingGuest({...editingGuest, categoria: v as CategoriaInvitado})}>
                                <SelectTrigger id="edit-cat"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Adulto">Adulto</SelectItem>
                                    <SelectItem value="Niño/Adolescente">Niño / Adolescente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={() => editingGuest && handleUpdateGuest(editingGuest)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'secondary' | 'destructive' | 'outline', className?: string }) => (
    <span className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variant === 'default' ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/80" : 
        variant === 'secondary' ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80" :
        variant === 'destructive' ? "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80" :
        "text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        className
    )}>
        {children}
    </span>
);

export default function MesaPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <AsignacionMesasContent />
        </Suspense>
    );
}
