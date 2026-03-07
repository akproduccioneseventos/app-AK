'use client';

import React, { useState, type FormEvent, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Users, Mail, Phone, Edit3, Save, Loader2, AlertTriangle, NotebookTextIcon, UserMinus, UserPlus2, UserCheck, Ticket, LayoutDashboard, ArrowRight, Printer, QrCode, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Invitado, RsvpStatus, NuevoInvitadoData, CategoriaInvitado } from '@/types/invitado';
import { getFiestaById, addInvitadoFiestaActual, updateInvitadoFiestaActual, deleteInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import QRCodeStylized from 'qrcode.react';
import { Switch } from '@/components/ui/switch';

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
import { RsvpStatusBadge } from '@/components/presupuestos/rsvp-status-badge';

function InvitadosEventoContent() {
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
  const [nuevaCategoria, setNewCategoria] = useState<CategoriaInvitado>('Adulto');
  const [nuevoNumAcompanantes, setNuevoNumAcompanantes] = useState<number>(0);
  const [nuevoCeliaco, setNuevoCeliaco] = useState(false);
  const [nuevoTag, setNuevoTag] = useState('');

  const [editingInvitado, setEditingInvitado] = useState<Invitado | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedGuestForQr, setSelectedGuestForQr] = useState<Invitado | null>(null);
  
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
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
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

  const handleAddInvitado = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !fiestaId) {
      toast({ title: "Datos incompletos", description: "El nombre del invitado es requerido.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const nuevoInvitadoData: NuevoInvitadoData = {
      nombre: nuevoNombre.trim(),
      categoria: nuevaCategoria,
      contacto: nuevoContacto.trim() || undefined,
      rsvp: 'Pendiente',
      partySize: 1 + (Number(nuevoNumAcompanantes) || 0),
      notes: undefined, 
      companionNames: [],
      isCeliac: nuevoCeliaco,
      tag: nuevoTag.trim() || undefined
    };
    const result = await addInvitadoFiestaActual(fiestaId, nuevoInvitadoData);
    if (result.success && result.invitado) {
      await fetchInvitados(); 
      setNuevoNombre('');
      setNuevoContacto('');
      setNuevoNumAcompanantes(0);
      setNuevoCeliaco(false);
      setNuevoTag('');
      toast({ title: "Invitado Añadido" });
    } else {
      toast({ title: "Error al Añadir", description: result.error, variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleFieldChange = async (invitadoId: string, field: keyof Invitado, value: any) => {
    const invitadoOriginal = invitados.find(inv => inv.id === invitadoId);
    if(!invitadoOriginal || !fiestaId) return;

    setInvitados(prev =>
      prev.map(inv => (inv.id === invitadoId ? { ...inv, [field]: value } : inv))
    );
    
    const result = await updateInvitadoFiestaActual(fiestaId, { ...invitadoOriginal, [field]: value });
    if (!result.success) {
      toast({ title: "Error al Actualizar", variant: "destructive" });
      setInvitados(prev => prev.map(inv => (inv.id === invitadoId ? invitadoOriginal : inv))); 
    }
  };

  const handleDeleteInvitado = async (invitadoId: string) => {
    if (!fiestaId) return;
    const result = await deleteInvitadoFiestaActual(fiestaId, invitadoId);
    if (result.success) {
      await fetchInvitados();
      toast({ title: "Invitado Eliminado", variant: "destructive" });
    } else {
      toast({ title: "Error al Eliminar", variant: "destructive" });
    }
  };

  const handleSaveEditModal = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingInvitado || !fiestaId) return;
    setIsSaving(true);
    const result = await updateInvitadoFiestaActual(fiestaId, editingInvitado);
    if (result.success) {
      await fetchInvitados(); 
      setIsEditModalOpen(false);
      toast({ title: "Invitado Actualizado" });
    } else {
      toast({ title: "Error al Guardar", variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleOpenQrModal = (invitado: Invitado) => {
      setSelectedGuestForQr(invitado);
      setIsQrModalOpen(true);
  }

  const rsvpCounts = useMemo(() => invitados.reduce((acc, inv) => {
    acc[inv.rsvp] = (acc[inv.rsvp] || 0) + (inv.partySize || 1);
    acc.TotalPersonas = (acc.TotalPersonas || 0) + (inv.partySize || 1);
    acc.TotalInvitaciones = (acc.TotalInvitaciones || 0) + 1;
    acc.checkedIn = (acc.checkedIn || 0) + (inv.checkedIn ? (inv.partySize || 1) : 0);
    acc.celiacs = (acc.celiacs || 0) + (inv.isCeliac ? (inv.partySize || 1) : 0);
    return acc;
  }, {} as Record<RsvpStatus | 'TotalPersonas' | 'TotalInvitaciones' | 'checkedIn' | 'celiacs', number>), [invitados]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código QR para: {selectedGuestForQr?.nombre}</DialogTitle>
          </DialogHeader>
          {selectedGuestForQr && (
            <div className="flex flex-col items-center py-4">
              <div className="p-4 bg-white rounded-lg border">
                <QRCodeStylized id="guest-qr-code" value={`${window.location.origin}/evento/actual/checkin?fiestaId=${fiestaId}&guestId=${selectedGuestForQr.id}`} size={200} level="H" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Invitados</h1>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/fiestas/nueva/invitados/checkin-scanner?fiestaId=${fiestaId}`}><Button variant="secondary">Escanear QR</Button></Link>
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2"/>Imprimir</Button>
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline">Volver</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4"/> Alertas Alimentarias
                  </CardTitle>
              </CardHeader>
              <CardContent className="py-0 px-4 pb-3">
                  <p className="text-2xl font-black text-amber-600">{rsvpCounts.celiacs}</p>
                  <p className="text-xs text-amber-700">Celíacos confirmados</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-bold">Total Personas</CardTitle></CardHeader>
              <CardContent className="py-0 px-4 pb-3"><p className="text-2xl font-black">{rsvpCounts.TotalPersonas}</p></CardContent>
          </Card>
          <Card>
              <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-bold">Confirmados</CardTitle></CardHeader>
              <CardContent className="py-0 px-4 pb-3"><p className="text-2xl font-black text-green-600">{rsvpCounts.Confirmado || 0}</p></CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Añadir Invitado Manualmente</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAddInvitado} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="space-y-1 md:col-span-2"><Label>Nombre</Label><Input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required /></div>
            <div className="space-y-1"><Label>Categoría</Label>
              <Select value={nuevaCategoria} onValueChange={v => setNewCategoria(v as CategoriaInvitado)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Adulto">Adulto</SelectItem><SelectItem value="Niño/Adolescente">Niño/Adol.</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Grupo/Relación</Label><Input value={nuevoTag} onChange={e => setNuevoTag(e.target.value)} placeholder="Ej: Familia, Amigos" /></div>
            <div className="flex items-center space-x-2 pb-2">
                <Switch id="new-celiac" checked={nuevoCeliaco} onCheckedChange={setNuevoCeliaco} />
                <Label htmlFor="new-celiac" className="text-xs font-bold text-amber-600">Celíaco</Label>
            </div>
            <Button type="submit" disabled={isSaving}><Plus className="w-4 h-4 mr-2"/>Añadir</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista Completa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>RSVP</TableHead>
                    <TableHead>Alertas</TableHead>
                    <TableHead>Mesa</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {invitados.map(guest => (
                    <TableRow key={guest.id} className={guest.isCeliac ? "bg-amber-50/20" : ""}>
                    <TableCell className="font-medium">{guest.nombre}</TableCell>
                    <TableCell>
                        {guest.tag ? <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase">{guest.tag}</Badge> : '-'}
                    </TableCell>
                    <TableCell><RsvpStatusBadge status={guest.rsvp} /></TableCell>
                    <TableCell>
                        {guest.isCeliac && <Badge className="bg-amber-500 text-white border-none font-bold text-[10px]">CELIACO</Badge>}
                    </TableCell>
                    <TableCell>{guest.tableNumber || '-'}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenQrModal(guest)}><QrCode className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingInvitado(guest); setIsEditModalOpen(true); }}><Edit3 className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteInvitado(guest.id)}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Invitado</DialogTitle></DialogHeader>
          {editingInvitado && (
            <form onSubmit={handleSaveEditModal} className="space-y-4 py-2">
              <div className="space-y-1"><Label>Nombre</Label><Input value={editingInvitado.nombre} onChange={e => setEditingInvitado({...editingInvitado, nombre: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Categoría</Label>
                    <Select value={editingInvitado.categoria || 'Adulto'} onValueChange={v => setEditingInvitado({...editingInvitado, categoria: v as CategoriaInvitado})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Adulto">Adulto</SelectItem><SelectItem value="Niño/Adolescente">Niño/Adol.</SelectItem></SelectContent>
                    </Select>
                </div>
                <div className="space-y-1"><Label>Grupo/Relación</Label><Input value={editingInvitado.tag || ''} onChange={e => setEditingInvitado({...editingInvitado, tag: e.target.value})} placeholder="Ej: Familia, Trabajo" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Mesa</Label>
                    <Select value={editingInvitado.tableNumber || 'sin-mesa'} onValueChange={v => setEditingInvitado({...editingInvitado, tableNumber: v === 'sin-mesa' ? undefined : v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="sin-mesa">Sin Mesa</SelectItem>{tableNames.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                    <Switch id="edit-celiac" checked={editingInvitado.isCeliac || false} onCheckedChange={(val) => setEditingInvitado({...editingInvitado, isCeliac: val})} />
                    <Label htmlFor="edit-celiac" className="text-sm font-bold text-amber-900">Soy Celíaco</Label>
                </div>
              </div>
              <DialogFooter><Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : 'Guardar Cambios'}</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InvitadosEventoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <InvitadosEventoContent/>
        </Suspense>
    )
}
