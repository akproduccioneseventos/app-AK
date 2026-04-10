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
import { ArrowLeft, Plus, Trash2, Edit3, Save, Loader2, QrCode, Printer, Download, Crown, Users, User, Accessibility } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invitado, RsvpStatus, CategoriaInvitado, PerfilInvitado, DietaryRestriction } from '@/types/invitado';
import { getFiestaById, addInvitadoFiestaActual, updateInvitadoFiestaActual, deleteInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import QRCodeStylized from 'qrcode.react';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DIETARY_OPTIONS: DietaryRestriction[] = [
  'Ninguna', 'Celiaco', 'Vegetariano', 'Vegano', 'Sin Gluten', 'Sin Lactosa', 'Alergia Mariscos', 'Alergia Frutos Secos', 'Otro'
];

const PERFIL_OPTIONS: { value: PerfilInvitado; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'General', label: 'General', icon: User, color: 'text-slate-500' },
  { value: 'VIP', label: 'VIP', icon: Crown, color: 'text-amber-600' },
  { value: 'Familia', label: 'Familia', icon: Users, color: 'text-blue-600' },
  { value: 'Necesidades Especiales', label: 'Accesibilidad', icon: Accessibility, color: 'text-green-600' },
];

function InvitadosEventoContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  
  // New guest form state
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCategoria, setNewCategoria] = useState<CategoriaInvitado>('Adulto');
  const [nuevoCeliaco, setNuevoCeliaco] = useState(false);
  const [nuevoTag, setNuevoTag] = useState('');
  const [nuevoPerfil, setNuevoPerfil] = useState<PerfilInvitado>('General');

  // Edit modal state
  const [editingInvitado, setEditingInvitado] = useState<Invitado | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // QR modal state
  const [isMesaQrOpen, setIsMesaQrOpen] = useState(false);
  
  const fetchInvitados = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      
      setFiesta(fiestaData);
      setInvitados((fiestaData.invitados || []).sort((a,b) => a.nombre.localeCompare(b.nombre)));
      const tables = (fiestaData.decoracion?.salonElements || [])
        .filter(el => el.category?.toLowerCase().includes('mesa'))
        .map(el => el.name);
      setTableNames(tables);
    } catch {
      toast({ title: "Error al cargar", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => { fetchInvitados(); }, [fetchInvitados]);

  const stats = useMemo(() => {
    const adultsConfirmed = invitados.reduce((sum, i) => sum + (i.rsvp === 'Confirmado' && i.categoria === 'Adulto' ? (i.partySize || 1) : 0), 0);
    const kidsConfirmed = invitados.reduce((sum, i) => sum + (i.rsvp === 'Confirmado' && i.categoria === 'Niño/Adolescente' ? (i.partySize || 1) : 0), 0);
    const celiacs = invitados.filter(i => (i.isCeliac || i.dietaryRestriction === 'Celiaco') && i.rsvp === 'Confirmado').length;
    const vips = invitados.filter(i => i.perfil === 'VIP').length;
    
    return {
        adults: { confirmed: adultsConfirmed, contracted: Number(fiesta?.configuracion.invitadosAdultos) || 0 },
        kids: { confirmed: kidsConfirmed, contracted: Number(fiesta?.configuracion.invitadosNinos) || 0 },
        celiacs,
        vips,
    };
  }, [invitados, fiesta]);

  const handleAddInvitado = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !fiestaId) return;
    setIsSaving(true);
    const result = await addInvitadoFiestaActual(fiestaId, {
      nombre: nuevoNombre.trim(),
      categoria: nuevaCategoria,
      rsvp: 'Confirmado',
      partySize: 1,
      isCeliac: nuevoCeliaco,
      tag: nuevoTag || undefined,
      perfil: nuevoPerfil,
    });
    if (result.success) {
      setNuevoNombre(''); setNuevoTag(''); setNuevoCeliaco(false); setNuevoPerfil('General');
      await fetchInvitados();
      toast({ title: "Invitado Añadido" });
    }
    setIsSaving(false);
  };

  const handleDeleteInvitado = async (invitadoId: string) => {
    if (!fiestaId) return;
    const result = await deleteInvitadoFiestaActual(fiestaId, invitadoId);
    if (result.success) {
      await fetchInvitados();
      toast({ title: "Eliminado", variant: "destructive" });
    }
  };

  const openEditModal = (inv: Invitado) => {
    setEditingInvitado({ ...inv });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!fiestaId || !editingInvitado) return;
    setIsSavingEdit(true);
    const result = await updateInvitadoFiestaActual(fiestaId, editingInvitado);
    if (result.success) {
      await fetchInvitados();
      setIsEditModalOpen(false);
      toast({ title: "✅ Invitado actualizado" });
    } else {
      toast({ title: "Error", description: result.error ?? "No se pudo guardar.", variant: "destructive" });
    }
    setIsSavingEdit(false);
  };

  if (isLoading || !fiesta) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Gestión de Invitados</h1>
        <div className="flex gap-2">
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="p-4"><CardTitle className="text-xs font-black uppercase text-blue-800">Adultos</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-end mb-2"><span className="text-2xl font-black">{stats.adults.confirmed}</span><span className="text-xs text-muted-foreground">de {stats.adults.contracted}</span></div>
                  <Progress value={stats.adults.contracted > 0 ? (stats.adults.confirmed / stats.adults.contracted) * 100 : 0} className="h-1.5" />
              </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader className="p-4"><CardTitle className="text-xs font-black uppercase text-purple-800">Niños/Adol.</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-end mb-2"><span className="text-2xl font-black">{stats.kids.confirmed}</span><span className="text-xs text-muted-foreground">de {stats.kids.contracted}</span></div>
                  <Progress value={stats.kids.contracted > 0 ? (stats.kids.confirmed / stats.kids.contracted) * 100 : 0} className="h-1.5" />
              </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="p-4"><CardTitle className="text-xs font-black uppercase text-amber-800">Celíacos</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><span className="text-2xl font-black text-amber-600">{stats.celiacs}</span></CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/30">
              <CardHeader className="p-4"><CardTitle className="text-xs font-black uppercase text-yellow-800">VIPs</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><span className="text-2xl font-black text-yellow-600">{stats.vips}</span></CardContent>
          </Card>
      </div>

      {/* QR Buscador de Mesas */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black flex items-center gap-2">
            <QrCode className="w-4 h-4 text-purple-600" /> QR Buscador de Mesas
          </CardTitle>
          <CardDescription className="text-xs">Imprimí un QR para el banner de entrada.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" onClick={() => setIsMesaQrOpen(true)} className="w-full bg-purple-700 hover:bg-purple-800">
            <Printer className="w-4 h-4 mr-2" /> Generar QR
          </Button>
        </CardContent>
      </Card>

      {/* Add Guest Form */}
      <Card>
        <CardHeader><CardTitle>Nuevo Invitado</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAddInvitado} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required placeholder="Nombre completo" />
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={nuevaCategoria} onValueChange={v => setNewCategoria(v as CategoriaInvitado)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Adulto">Adulto</SelectItem>
                    <SelectItem value="Niño/Adolescente">Niño/Adol.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Perfil</Label>
                <Select value={nuevoPerfil} onValueChange={v => setNuevoPerfil(v as PerfilInvitado)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERFIL_OPTIONS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch checked={nuevoCeliaco} onCheckedChange={setNuevoCeliaco} />
                <Label className="text-xs font-bold text-amber-600">Celíaco</Label>
              </div>
              <Button type="submit" disabled={isSaving}>
                <Plus className="w-4 h-4 mr-2"/>Añadir Invitado
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Guest List */}
      <Card>
        <CardHeader><CardTitle>Lista de Invitados ({invitados.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Mesa</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {invitados.map(inv => (
                        <TableRow key={inv.id} className={inv.isCeliac || inv.dietaryRestriction === 'Celiaco' ? "bg-amber-50/20" : ""}>
                            <TableCell className="font-bold">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span>{inv.nombre}</span>
                                  {(inv.isCeliac || inv.dietaryRestriction === 'Celiaco') && <Badge className="bg-amber-500 text-white text-[8px] h-4">CELIACO</Badge>}
                                  {inv.perfil === 'VIP' && <Badge className="bg-yellow-500 text-white text-[8px] h-4">VIP</Badge>}
                                  {inv.perfil === 'Familia' && <Badge className="bg-blue-500 text-white text-[8px] h-4">FAMILIA</Badge>}
                                  {(inv.perfil === 'Necesidades Especiales' || inv.requiereAccesibilidad) && <Badge className="bg-green-500 text-white text-[8px] h-4">ACCESIB.</Badge>}
                                </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-[10px] font-black uppercase text-slate-400">{inv.perfil ?? 'General'}</span>
                            </TableCell>
                            <TableCell><RsvpStatusBadge status={inv.rsvp}/></TableCell>
                            <TableCell>{inv.tableNumber || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditModal(inv)}>
                                  <Edit3 className="w-4 h-4 text-slate-500"/>
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive">
                                      <Trash2 className="w-4 h-4"/>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar invitado?</AlertDialogTitle>
                                      <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará a {inv.nombre} de la lista.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteInvitado(inv.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {invitados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400 py-8">No hay invitados aún. ¡Añadí el primero!</TableCell>
                      </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Edit Guest Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Invitado</DialogTitle>
            <DialogDescription>Actualizá los datos del invitado, incluyendo su perfil y restricciones alimentarias.</DialogDescription>
          </DialogHeader>
          {editingInvitado && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nombre</Label>
                  <Input value={editingInvitado.nombre} onChange={e => setEditingInvitado(prev => prev ? { ...prev, nombre: e.target.value } : null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contacto (email/tel)</Label>
                  <Input value={editingInvitado.contacto ?? ''} onChange={e => setEditingInvitado(prev => prev ? { ...prev, contacto: e.target.value } : null)} placeholder="+598 99..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select value={editingInvitado.categoria ?? 'Adulto'} onValueChange={v => setEditingInvitado(prev => prev ? { ...prev, categoria: v as CategoriaInvitado } : null)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Adulto">Adulto</SelectItem>
                      <SelectItem value="Niño/Adolescente">Niño/Adolescente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Estado RSVP</Label>
                  <Select value={editingInvitado.rsvp} onValueChange={v => setEditingInvitado(prev => prev ? { ...prev, rsvp: v as RsvpStatus } : null)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Confirmado">Confirmado</SelectItem>
                      <SelectItem value="Rechazado">Rechazado</SelectItem>
                      <SelectItem value="Tal vez">Tal vez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Perfil (Fase 3)</Label>
                  <Select value={editingInvitado.perfil ?? 'General'} onValueChange={v => setEditingInvitado(prev => prev ? { ...prev, perfil: v as PerfilInvitado } : null)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PERFIL_OPTIONS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Mesa asignada</Label>
                  {tableNames.length > 0 ? (
                    <Select value={editingInvitado.tableNumber ?? ''} onValueChange={v => setEditingInvitado(prev => prev ? { ...prev, tableNumber: v || undefined } : null)}>
                      <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
                        {tableNames.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={editingInvitado.tableNumber ?? ''} onChange={e => setEditingInvitado(prev => prev ? { ...prev, tableNumber: e.target.value || undefined } : null)} placeholder="Ej: Mesa 1" />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Restricción alimentaria</Label>
                <Select value={editingInvitado.dietaryRestriction ?? 'Ninguna'} onValueChange={v => setEditingInvitado(prev => prev ? { ...prev, dietaryRestriction: v as DietaryRestriction } : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIETARY_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {editingInvitado.dietaryRestriction && editingInvitado.dietaryRestriction !== 'Ninguna' && (
                <div className="space-y-1.5">
                  <Label>Detalle de alergias (opcional)</Label>
                  <Input value={editingInvitado.alergiasEspecificas ?? ''} onChange={e => setEditingInvitado(prev => prev ? { ...prev, alergiasEspecificas: e.target.value } : null)} placeholder="Ej: alergia a maní..." />
                </div>
              )}
              {editingInvitado.perfil === 'VIP' && (
                <div className="space-y-1.5">
                  <Label>Mensaje personalizado para VIP</Label>
                  <Textarea value={editingInvitado.mensajePersonalizado ?? ''} onChange={e => setEditingInvitado(prev => prev ? { ...prev, mensajePersonalizado: e.target.value } : null)} placeholder="Mensaje especial que verá este invitado en su portal..." rows={3} />
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Switch checked={editingInvitado.isCeliac ?? false} onCheckedChange={v => setEditingInvitado(prev => prev ? { ...prev, isCeliac: v } : null)} />
                  <Label className="text-xs font-bold text-amber-600">Celíaco</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={editingInvitado.requiereAccesibilidad ?? false} onCheckedChange={v => setEditingInvitado(prev => prev ? { ...prev, requiereAccesibilidad: v } : null)} />
                  <Label className="text-xs font-bold text-green-600">Requiere Accesibilidad</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="bg-indigo-600 hover:bg-indigo-700">
              {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mesa QR Dialog */}
      <Dialog open={isMesaQrOpen} onOpenChange={setIsMesaQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>🪑 QR Buscador de Mesas</DialogTitle>
            <DialogDescription>
              Imprimí este QR en un banner para la entrada. Los invitados escanean y encuentran su mesa.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <QRCodeStylized
                id="qr-buscador-mesas"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/evento/mi-mesa/${fiestaId}`}
                size={200}
              />
            </div>
            <p className="text-xs text-slate-500 text-center">
              Apunta a: <span className="font-mono text-purple-700 break-all">/evento/mi-mesa/{fiestaId}</span>
            </p>
            <Button
              onClick={() => {
                const canvas = document.getElementById('qr-buscador-mesas') as HTMLCanvasElement;
                if (canvas) {
                  const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
                  const link = document.createElement('a');
                  link.href = pngUrl;
                  link.download = `QR-Buscador-Mesas-${fiestaId}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" /> Descargar QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InvitadosEventoPage() {
    return (
        <Suspense fallback={null}><InvitadosEventoContent/></Suspense>
    )
}
