

'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Users, Mail, Phone, Edit3, Save, Loader2, AlertTriangle, NotebookTextIcon, UserMinus, UserPlus2, QrCode, UserCheck, Ticket, LayoutDashboard, ArrowRight, Printer } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Invitado, RsvpStatus, NuevoInvitadoData } from '@/types/invitado';
import { getInvitadosFiestaActual, addInvitadoFiestaActual, updateInvitadoFiestaActual, deleteInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
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
import { Badge } from '@/components/ui/badge';
import QRCodeStylized from 'qrcode.react';


export default function InvitadosEventoPage() {
  const { toast } = useToast();
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  const [error, setError] = useState<string |null>(null);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState('');
  const [nuevoPartySize, setNuevoPartySize] = useState<number>(1);

  const [editingInvitado, setEditingInvitado] = useState<Invitado | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [qrCodeData, setQrCodeData] = useState<{ id: string, name: string } | null>(null);

  const fetchInvitados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvitadosFiestaActual();
      setInvitados(data.sort((a,b) => a.nombre.localeCompare(b.nombre)));
    } catch (e: any) {
      setError("No se pudieron cargar los invitados.");
      toast({ title: "Error al cargar invitados", description: e.message, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
    if (!nuevoNombre.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del invitado.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const nuevoInvitadoData: NuevoInvitadoData = {
      nombre: nuevoNombre.trim(),
      contacto: nuevoContacto.trim() || undefined,
      rsvp: 'Pendiente',
      partySize: Number(nuevoPartySize) || 1,
      notes: undefined, 
      companionNames: [],
    };
    const result = await addInvitadoFiestaActual(nuevoInvitadoData);
    if (result.success && result.invitado) {
      await fetchInvitados(); 
      setNuevoNombre('');
      setNuevoContacto('');
      setNuevoPartySize(1);
      toast({ title: "Invitado Añadido", description: `${result.invitado.nombre} ha sido añadido.` });
    } else {
      toast({ title: "Error al Añadir", description: result.error || "No se pudo añadir el invitado.", variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleFieldChange = async (invitadoId: string, field: keyof Invitado, value: any) => {
    const invitadoOriginal = invitados.find(inv => inv.id === invitadoId);
    if(!invitadoOriginal) return;

    setInvitados(prev =>
      prev.map(inv => (inv.id === invitadoId ? { ...inv, [field]: value } : inv))
    );
    
    const invitadoActualizado = { ...invitadoOriginal, [field]: value };
     if (field === 'partySize' || field === 'tableNumber') {
        invitadoActualizado[field] = value === '' ? undefined : Number(value) || (field === 'partySize' ? 1 : undefined);
     }
    
    const result = await updateInvitadoFiestaActual(invitadoActualizado);
    if (!result.success) {
      toast({ title: "Error al Actualizar", description: result.error || `No se pudo actualizar ${field}.`, variant: "destructive" });
      setInvitados(prev => prev.map(inv => (inv.id === invitadoId ? invitadoOriginal : inv))); 
    }
  };

  const handleDeleteInvitado = async (invitadoId: string) => {
    const invitadoAEliminar = invitados.find(inv => inv.id === invitadoId);
    if (!invitadoAEliminar) return;

    const result = await deleteInvitadoFiestaActual(invitadoId);
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
    if (!editingInvitado) return;
    if (!editingInvitado.nombre.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const dataToSave = {
      ...editingInvitado,
      companionNames: (editingInvitado.companionNames || []).filter(name => name.trim() !== '')
    };
    const result = await updateInvitadoFiestaActual(dataToSave);
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
    <div className="max-w-4xl mx-auto space-y-6" id="guest-management-page">
      <Dialog open={!!qrCodeData} onOpenChange={(open) => !open && setQrCodeData(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Código QR para {qrCodeData?.name}</DialogTitle>
                <DialogDescription>Este es el QR personal para el check-in. El invitado puede mostrar esto al ingresar.</DialogDescription>
            </DialogHeader>
            {qrCodeData && (
                <div className="flex flex-col items-center justify-center p-4">
                    <QRCodeStylized value={`${window.location.origin}/evento/actual/checkin?guestId=${qrCodeData.id}`} size={256} />
                    <p className="text-sm mt-4 text-muted-foreground">ID: {qrCodeData.id}</p>
                </div>
            )}
        </DialogContent>
      </Dialog>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Invitados
        </h1>
        <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handlePrint}><Printer className="w-4 h-4 mr-2"/>Imprimir Lista</Button>
            <Link href="/fiestas/nueva" passHref>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Planificador
              </Button>
            </Link>
        </div>
      </div>

       <Card className="shadow-md bg-primary/5 border-primary/20 print:hidden">
        <CardHeader className="flex-row items-center gap-4 space-y-0 pb-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <LayoutDashboard className="w-7 h-7 text-primary" />
          </div>
          <div>
            <CardTitle className="font-headline text-xl">Diseño del Salón y Mesas</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Organiza visualmente las mesas y asigna a tus invitados.
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="pt-0">
          <Link href="/fiestas/nueva/invitados/layout" passHref className="w-full">
            <Button variant="default" className="w-full">
              Ir al Diseñador de Salón <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <Card className="shadow-lg print:hidden">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Nuevo Invitado</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddInvitado} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="nombre-invitado">Nombre Completo</Label>
                <Input id="nombre-invitado" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Ej: Laura Martínez" required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="contacto-invitado">Teléfono (Opcional)</Label>
                <Input id="contacto-invitado" value={nuevoContacto} onChange={(e) => setNuevoContacto(e.target.value)} placeholder="099..." />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="partysize-invitado">Nº Personas (Total, incl. invitado)</Label>
                <Input id="partysize-invitado" type="number" value={nuevoPartySize} onChange={(e) => setNuevoPartySize(Number(e.target.value))} min="1" />
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
            Confirmados: {rsvpCounts.Confirmado || 0}. Presentes: {rsvpCounts.checkedIn || 0}. Asigna una mesa a cada invitado confirmado.
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
                        <p className="font-semibold text-foreground flex items-center gap-2 print:text-sm">
                           {invitado.nombre}
                           {invitado.checkedIn && <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 text-xs print:hidden"><UserCheck className="w-3 h-3 mr-1"/>Presente</Badge>}
                        </p>
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
                           <Label htmlFor={`table-${invitado.id}`} className="sr-only">Número de Mesa</Label>
                           <div className="flex items-center gap-1">
                                <span className="print:inline hidden text-xs">Mesa:</span>
                                <Input
                                  id={`table-${invitado.id}`}
                                  placeholder="Nº Mesa"
                                  title="Número de Mesa"
                                  value={invitado.tableNumber || ''}
                                  onChange={(e) => handleFieldChange(invitado.id, 'tableNumber', e.target.value)}
                                  className="h-9 text-sm print:border-none print:p-0 print:h-auto print:text-xs print:font-semibold"
                                  disabled={invitado.rsvp !== 'Confirmado'}
                                />
                           </div>
                        </div>
                        <div className="flex gap-1 print:hidden">
                            <Button variant="ghost" size="icon" onClick={() => setQrCodeData({ id: invitado.id, name: invitado.nombre })} className="h-8 w-8 text-primary" title="Mostrar QR"><QrCode className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(invitado)} className="h-8 w-8"><Edit3 className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteInvitado(invitado.id)} className="text-destructive hover:text-destructive/80 h-8 w-8"><UserMinus className="w-4 h-4" /></Button>
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
                <Ticket className="w-4 h-4 mr-2 shrink-0"/> Asigna un número de mesa a los invitados confirmados. Este número se mostrará cuando el invitado escanee su código QR.
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
                          placeholder={`Nombre completo del acompañante ${index + 1}`}
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
                <Label htmlFor="edit-tableNumber">Nº Mesa</Label>
                <Input id="edit-tableNumber" value={editingInvitado.tableNumber || ''} onChange={(e) => setEditingInvitado(p => p ? {...p, tableNumber: e.target.value} : null)} disabled={editingInvitado.rsvp !== 'Confirmado'}/>
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
  );
}

