'use client';

import React, { useState, type FormEvent, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Users, Edit3, Save, Loader2, AlertTriangle, QrCode, Printer, Tag, Search, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Invitado, RsvpStatus, NuevoInvitadoData, CategoriaInvitado } from '@/types/invitado';
import { getFiestaById, addInvitadoFiestaActual, updateInvitadoFiestaActual, deleteInvitadoFiestaActual, type FiestaEnPlanificacion } from '@/app/actions/fiesta-actual';
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
  const [error, setError] = useState<string |null>(null);
  
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCategoria, setNewCategoria] = useState<CategoriaInvitado>('Adulto');
  const [nuevoCeliaco, setNuevoCeliaco] = useState(false);
  const [nuevoTag, setNuevoTag] = useState('');

  const [editingInvitado, setEditingInvitado] = useState<Invitado | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedGuestForQr, setSelectedGuestForQr] = useState<Invitado | null>(null);
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
    } catch (e: any) {
      toast({ title: "Error al cargar", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => { fetchInvitados(); }, [fetchInvitados]);

  const stats = useMemo(() => {
    const adultsConfirmed = invitados.reduce((sum, i) => sum + (i.rsvp === 'Confirmado' && i.categoria === 'Adulto' ? (i.partySize || 1) : 0), 0);
    const kidsConfirmed = invitados.reduce((sum, i) => sum + (i.rsvp === 'Confirmado' && i.categoria === 'Niño/Adolescente' ? (i.partySize || 1) : 0), 0);
    const celiacs = invitados.filter(i => i.isCeliac && i.rsvp === 'Confirmado').length;
    
    return {
        adults: { confirmed: adultsConfirmed, contracted: Number(fiesta?.configuracion.invitadosAdultos) || 0 },
        kids: { confirmed: kidsConfirmed, contracted: Number(fiesta?.configuracion.invitadosNinos) || 0 },
        celiacs
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
      tag: nuevoTag || undefined
    });
    if (result.success) {
      setNuevoNombre(''); setNuevoTag(''); setNuevoCeliaco(false);
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

  if (isLoading || !fiesta) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Gestión de Invitados</h1>
        <div className="flex gap-2">
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="p-4"><CardTitle className="text-xs font-black uppercase text-blue-800">Adultos</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-end mb-2"><span className="text-2xl font-black">{stats.adults.confirmed}</span><span className="text-xs text-muted-foreground">de {stats.adults.contracted}</span></div>
                  <Progress value={(stats.adults.confirmed / stats.adults.contracted) * 100} className="h-1.5" />
              </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader className="p-4"><CardTitle className="text-xs font-black uppercase text-purple-800">Niños/Adol.</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-end mb-2"><span className="text-2xl font-black">{stats.kids.confirmed}</span><span className="text-xs text-muted-foreground">de {stats.kids.contracted}</span></div>
                  <Progress value={(stats.kids.confirmed / stats.kids.contracted) * 100} className="h-1.5" />
              </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="p-4"><CardTitle className="text-xs font-black uppercase text-amber-800">Celíacos</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><span className="text-2xl font-black text-amber-600">{stats.celiacs}</span></CardContent>
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

      <Card>
        <CardHeader><CardTitle>Nuevo Invitado</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAddInvitado} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2 space-y-1.5"><Label>Nombre</Label><Input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>Categoría</Label>
              <Select value={nuevaCategoria} onValueChange={v => setNewCategoria(v as CategoriaInvitado)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Adulto">Adulto</SelectItem><SelectItem value="Niño/Adolescente">Niño/Adol.</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pb-3">
                <Switch checked={nuevoCeliaco} onCheckedChange={setNuevoCeliaco} />
                <Label className="text-xs font-bold text-amber-600">Celíaco</Label>
            </div>
            <Button type="submit" disabled={isSaving}><Plus className="w-4 h-4 mr-2"/>Añadir</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lista de Invitados</CardTitle></CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Categoría</TableHead><TableHead>Estado</TableHead><TableHead>Mesa</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                    {invitados.map(inv => (
                        <TableRow key={inv.id} className={inv.isCeliac ? "bg-amber-50/20" : ""}>
                            <TableCell className="font-bold">
                                {inv.nombre}
                                {inv.isCeliac && <Badge className="ml-2 bg-amber-500 text-white text-[8px] h-4">CELIACO</Badge>}
                            </TableCell>
                            <TableCell><span className="text-[10px] font-black uppercase text-slate-400">{inv.categoria}</span></TableCell>
                            <TableCell><RsvpStatusBadge status={inv.rsvp}/></TableCell>
                            <TableCell>{inv.tableNumber || '-'}</TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteInvitado(inv.id)}><Trash2 className="w-4 h-4"/></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

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
