

'use client';

import React, { useState, type FormEvent, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Users, Mail, Phone, Edit3, Save, Loader2, AlertTriangle, NotebookTextIcon, UserMinus, UserPlus2, UserCheck, Ticket, LayoutDashboard, ArrowRight, Printer } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Invitado, RsvpStatus, NuevoInvitadoData } from '@/types/invitado';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { addInvitado, updateInvitado, deleteInvitado } from '@/app/actions/invitados.actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Suspense } from 'react';

export default function InvitadosEventoPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  const [error, setError] = useState<string |null>(null);
  


  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState('');
  const [nuevoNumAcompanantes, setNuevoNumAcompanantes] = useState<number>(0);

  const [editingInvitado, setEditingInvitado] = useState<Invitado | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const fetchInvitados = useCallback(async () => {
    if (!fiestaId) {
      setError("No se ha especificado un ID de evento. Serás redirigido...");
      setTimeout(() => router.push('/eventos'), 2500);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      
      setInvitados((fiestaData.invitados || []).sort((a,b) => a.nombre.localeCompare(b.nombre)));
      const tables = (fiestaData.decoracion?.salonElements || [])
        .filter(el => el.category?.toLowerCase().includes('mesa'))
        .map(el => el.name)
        .sort((a, b) => {
          const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
          const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return a.localeCompare(b);
        });
      setTableNames(tables);
    } catch (e: any) {
      setError("No se pudieron cargar los invitados.");
      toast({ title: "Error al cargar invitados", description: e.message, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId, router]);

  useEffect(() => {
    fetchInvitados();
  }, [fetchInvitados]);

  const handlePartySizeChangeInModal = (newSizeStr: string) => {
    setEditingInvitado(prev => {
      if (!prev) return null;
      const newSize = parseInt(newSizeStr, 10);
      const partySize = isNaN(newSize) || newSize < 1 ? 1 : newSize;
      const numberOfCompanions = partySize > 0 ? partySize - 1 : 0;
      
      const currentNames = prev.companionNames || [];
      const newCompanionNames = Array.from({ length: numberOfCompanions }, (_, i) => currentNames[i] || '');

      return { ...prev, partySize, companionNames: newCompanionNames };
    });
  };

  const handleCompanionNameChangeInModal = (index: number, value: string) => {
    setEditingInvitado(prev => {
        if (!prev) return null;
        const newCompanionNames = [...(prev.companionNames || [])];
        newCompanionNames[index] = value;
        return { ...prev, companionNames: newCompanionNames };
    });
  };

  const handleAddInvitado = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !fiestaId) {
      toast({ title: "Datos incompletos", description: "El nombre del invitado es requerido.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const nuevoInvitadoData: NuevoInvitadoData = {
      nombre: nuevoNombre.trim(),
      contacto: nuevoContacto.trim() || undefined,
      rsvp: 'Pendiente',
      partySize: 1 + (Number(nuevoNumAcompanantes) || 0),
      notes: undefined, 
      companionNames: [],
    };
    const result = await addInvitado(fiestaId, nuevoInvitadoData);
    if (result.success && result.invitado) {
      await fetchInvitados(); 
      setNuevoNombre('');
      setNuevoContacto('');
      setNuevoNumAcompanantes(0);
      toast({ title: "Invitado Añadido", description: `${result.invitado.nombre} ha sido añadido.` });
    } else {
      toast({ title: "Error al Añadir", description: result.error || "No se pudo añadir el invitado.", variant: "destructive" });
    }
    setIsSaving(false);
  };
  

  const handleFieldChange = async (invitadoId: string, field: keyof Invitado, value: any) => {
    const invitadoOriginal = invitados.find(inv => inv.id === invitadoId);
    if(!invitadoOriginal || !fiestaId) return;

    setInvitados(prev =>
      prev.map(inv => (inv.id === invitadoId ? { ...inv, [field]: value } : inv))
    );
    
    const invitadoActualizado = { ...invitadoOriginal, [field]: value };
     if (field === 'partySize') {
        invitadoActualizado[field] = value === '' ? undefined : Number(value) || 1;
     } else if (field === 'tableNumber' && value === 'sin-mesa') {
       invitadoActualizado[field] = undefined;
     }
    
    const result = await updateInvitado(fiestaId, invitadoActualizado);
    if (!result.success) {
      toast({ title: "Error al Actualizar", description: result.error || `No se pudo actualizar ${field}.`, variant: "destructive" });
      setInvitados(prev => prev.map(inv => (inv.id === invitadoId ? invitadoOriginal : inv))); 
    }
  };

  const handleDeleteInvitado = async (invitadoId: string) => {
    const invitadoAEliminar = invitados.find(inv => inv.id === invitadoId);
    if (!invitadoAEliminar || !fiestaId) return;

    const result = await deleteInvitado(fiestaId, invitadoId);
    if (result.success) {
      await fetchInvitados();
      toast({ title: "Invitado Eliminado", description: `${invitadoAEliminar.nombre} ha sido eliminado.`, variant: "destructive" });
    } else {
      toast({ title: "Error al Eliminar", description: result.error || "No se pudo eliminar el invitado.", variant: "destructive" });
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  const openEditModal = (invitado: Invitado) => {
    const partySize = invitado.partySize || 1;
    const numberOfCompanions = partySize > 0 ? partySize - 1 : 0;
    const existingNames = invitado.companionNames || [];
    const companionNames = Array.from({ length: numberOfCompanions }, (_, i) => existingNames[i] || '');
    setEditingInvitado({ ...invitado, partySize, companionNames });
    setIsEditModalOpen(true);
  };

  const handleSaveEditModal = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingInvitado || !fiestaId) return;
    if (!editingInvitado.nombre.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const dataToSave: Invitado = {
      ...editingInvitado,
      tableNumber: editingInvitado.tableNumber === 'sin-mesa' ? undefined : editingInvitado.tableNumber,
      companionNames: (editingInvitado.companionNames || []).filter(name => name && name.trim() !== '')
    };
    const result = await updateInvitado(fiestaId, dataToSave);
    if (result.success && result.invitado) {
      await fetchInvitados(); 
      setIsEditModalOpen(false);
      setEditingInvitado(null);
      toast({ title: "Invitado Actualizado", description: `${result.invitado.nombre} guardado.` });
    } else {
      toast({ title: "Error al Guardar", description: result.error || "No se pudo guardar.", variant: "destructive" });
    }
    setIsSaving(false);
  };


  const rsvpCounts = invitados.reduce((acc, inv) => {
    acc[inv.rsvp] = (acc[inv.rsvp] || 0) + (inv.partySize || 1);
    acc.TotalPersonas = (acc.TotalPersonas || 0) + (inv.partySize || 1);
    acc.TotalInvitaciones = (acc.TotalInvitaciones || 0) + 1;
    acc.checkedIn = (acc.checkedIn || 0) + (inv.checkedIn ? (inv.partySize || 1) : 0);
    return acc;
  }, {} as Record<RsvpStatus | 'TotalPersonas' | 'TotalInvitaciones' | 'checkedIn', number>);

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /> <p className="ml-2">Cargando invitados...</p></div>;
  if (error) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <div className="max-w-4xl mx-auto space-y-6" id="guest-management-page">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestión de Invitados
          </h1>
          <div className="flex flex-wrap gap-2">
              <Link href={`/fiestas/nueva/invitados/checkin-scanner?fiestaId=${fiestaId}`} passHref>
                <Button variant="secondary"><UserCheck className="w-4 h-4 mr-2"/>Escanear QR</Button>
              </Link>
              <Button variant="secondary" onClick={handlePrint}><Printer className="w-4 h-4 mr-2"/>Imprimir Lista</Button>
              <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref>
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Planificador
                </Button>
              </Link>
          </div>
        </div>
        
        <Card className="shadow-lg print:hidden">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Añadir Nuevo Invitado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddInvitado} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <Label htmlFor="nombre-invitado">Nombre del Invitado</Label>
                  <Input id="nombre-invitado" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Ej: Laura Martínez" required />
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="contacto-invitado">Teléfono (Opcional)</Label>
                  <Input id="contacto-invitado" value={nuevoContacto} onChange={(e) => setNuevoContacto(e.target.value)} placeholder="099..." />
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <Label htmlFor="num-acompanantes">Nº de Acompañantes</Label>
                  <Input id="num-acompanantes" type="number" value={nuevoNumAcompanantes} onChange={(e) => setNuevoNumAcompanantes(Number(e.target.value))} min="0" />
                  <p className="text-xs text-muted-foreground">El total de personas será {1 + nuevoNumAcompanantes}.</p>
                  </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus2 className="w-4 h-4 mr-2" />}
                Añadir Invitado
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg print:shadow-none print:border-none" id="guest-list-section">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Lista de Invitados ({rsvpCounts.TotalInvitaciones || 0} invitaciones / {rsvpCounts.TotalPersonas || 0} personas)
            </CardTitle>
            <CardDescription className="print:hidden">
              Confirmados: {rsvpCounts.Confirmado || 0}. Presentes: {rsvpCounts.checkedIn || 0}. Asigna un número de mesa a cada invitado confirmado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitados.length > 0 ? (
              <ScrollArea className="h-auto max-h-[500px] pr-1 print:max-h-none print:pr-0">
                <div className="space-y-3">
                  {invitados.map((invitado) => (
                    <Card key={invitado.id} className="p-3 hover:shadow-md transition-shadow bg-muted/30 print:border-none print:shadow-none print:p-0 print:bg-transparent print:border-b">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex-grow space-y-1">
                          <div className="font-semibold text-foreground flex items-center gap-2 print:text-sm">
                            {invitado.nombre}
                            {invitado.checkedIn && <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 text-xs print:hidden"><UserCheck className="w-3 h-3 mr-1"/>Presente</Badge>}
                          </div>
                          {invitado.companionNames && invitado.companionNames.length > 0 && (
                              <p className="text-xs text-muted-foreground pl-2 print:hidden">
                                  <span className="font-medium">Acompañantes:</span> {invitado.companionNames.join(', ')}
                              </p>
                          )}
                          {invitado.contacto && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 print:hidden">
                              {invitado.contacto.includes('@') ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                              {invitado.contacto}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">Personas: {invitado.partySize || 1}</p>
                          {invitado.notes && <p className="text-xs text-muted-foreground italic print:hidden">Notas: {invitado.notes}</p>}
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:ml-auto">
                          <div className="flex-1 sm:flex-none sm:w-[120px] print:hidden">
                              <Label htmlFor={`rsvp-${invitado.id}`} className="sr-only">RSVP</Label>
                              <Select value={invitado.rsvp} onValueChange={(value: RsvpStatus) => handleFieldChange(invitado.id, 'rsvp', value)}>
                                  <SelectTrigger id={`rsvp-${invitado.id}`} className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                  {(['Pendiente', 'Confirmado', 'Rechazado', 'Tal vez'] as RsvpStatus[]).map(status => (
                                      <SelectItem key={status} value={status} className="text-xs">{status}</SelectItem>
                                  ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="flex-1 sm:flex-none sm:w-[120px]">
                            <Label htmlFor={`table-${invitado.id}`} className="sr-only">Mesa</Label>
                              <div className="flex items-center gap-1">
                                <span className="print:inline hidden text-xs">Mesa:</span>
                                <Select value={invitado.tableNumber || 'sin-mesa'} onValueChange={(value) => handleFieldChange(invitado.id, 'tableNumber', value)} disabled={invitado.rsvp !== 'Confirmado'}>
                                    <SelectTrigger id={`table-${invitado.id}`} className="h-9 text-sm print:border-none print:p-0 print:h-auto print:text-xs print:font-semibold">
                                        <SelectValue placeholder="Mesa..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                          <SelectItem value="sin-mesa">Sin Asignar</SelectItem>
                                          {tableNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                          </div>
                          <div className="flex gap-1 print:hidden">
                              <Button variant="ghost" size="icon" onClick={() => openEditModal(invitado)} className="h-8 w-8"><Edit3 className="w-4 h-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-8 w-8"><UserMinus className="w-4 h-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>¿Eliminar Invitado?</AlertDialogTitle><AlertDialogDescription>Se eliminará a "{invitado.nombre}" de la lista.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteInvitado(invitado.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                          </div>
                          <div className="hidden print:inline-block border-2 border-gray-400 w-8 h-8 ml-4"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <NotebookTextIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aún no has añadido ningún invitado.</p>
              </div>
            )}
          </CardContent>
          {invitados.length > 0 && (
              <CardFooter className="text-xs text-muted-foreground border-t pt-3 print:hidden">
                  <Ticket className="w-4 h-4 mr-2 shrink-0"/> Asigna un número de mesa a los invitados confirmados.
              </CardFooter>
          )}
        </Card>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl">Editar Invitado</DialogTitle>
              <DialogDescription>Modifica los detalles de {editingInvitado?.nombre || 'este invitado'}.</DialogDescription>
            </DialogHeader>
            {editingInvitado && (
              <form onSubmit={handleSaveEditModal} className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-nombre">Nombre</Label>
                  <Input id="edit-nombre" value={editingInvitado.nombre} onChange={(e) => setEditingInvitado(p => p ? {...p, nombre: e.target.value} : null)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-contacto">Contacto</Label>
                  <Input id="edit-contacto" value={editingInvitado.contacto || ''} onChange={(e) => setEditingInvitado(p => p ? {...p, contacto: e.target.value} : null)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-partySize">Nº Personas (Total, incl. invitado)</Label>
                  <Input id="edit-partySize" type="number" value={editingInvitado.partySize || 1} onChange={(e) => handlePartySizeChangeInModal(e.target.value)} min="1" />
                </div>
                
                {Array.from({ length: (editingInvitado.partySize || 1) - 1 }).map((_, index) => (
                    <div key={index} className="space-y-1 pl-4 border-l-2 border-primary/50">
                        <Label htmlFor={`companion-name-edit-${index}`} className="text-sm">Nombre Acompañante {index + 1}</Label>
                        <Input
                            id={`companion-name-edit-${index}`}
                            value={editingInvitado.companionNames?.[index] || ''}
                            onChange={(e) => handleCompanionNameChangeInModal(index, e.target.value)}
                            placeholder={`Nombre del acompañante ${index + 1}`}
                            disabled={isSaving}
                        />
                    </div>
                ))}

                <div className="space-y-1">
                  <Label htmlFor="edit-rsvp">Estado RSVP</Label>
                  <Select value={editingInvitado.rsvp} onValueChange={(value: RsvpStatus) => setEditingInvitado(p => p ? {...p, rsvp: value} : null)}>
                      <SelectTrigger id="edit-rsvp"><SelectValue /></SelectTrigger>
                      <SelectContent>
                      {(['Pendiente', 'Confirmado', 'Rechazado', 'Tal vez'] as RsvpStatus[]).map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-tableNumber">Mesa Asignada</Label>
                  <Select value={editingInvitado.tableNumber || 'sin-mesa'} onValueChange={(value) => setEditingInvitado(p => p ? {...p, tableNumber: value} : null)} disabled={editingInvitado.rsvp !== 'Confirmado'}>
                      <SelectTrigger id="edit-tableNumber"><SelectValue placeholder="Asignar mesa..."/></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="sin-mesa">Sin Asignar</SelectItem>
                          {tableNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-notes">Notas</Label>
                  <Textarea id="edit-notes" value={editingInvitado.notes || ''} onChange={(e) => setEditingInvitado(p => p ? {...p, notes: e.target.value} : null)} rows={3} />
                </div>
                <DialogFooter className="pt-3">
                  <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        
        <style jsx global>{`
          @media print {
              body {
                  background-color: white;
              }
              #guest-management-page > *:not(#guest-list-section) {
                  display: none;
              }
              #guest-list-section {
                  box-shadow: none;
                  border: none;
              }
          }
        `}</style>
      </div>
    </Suspense>
  );
}
