'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Ticket, Plus, ArrowLeft, Pencil, Trash2, Power, PowerOff,
  BarChart3, Copy, Calendar, Hash, DollarSign, Percent, Users
} from 'lucide-react';
import { getCupones, saveCupon, toggleCuponActivo, deleteCupon, getCuponStats } from '@/app/actions/cupones';
import type { Coupon, CouponUsage } from '@/types/coupon';
import Link from 'next/link';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'AK-';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

interface CuponFormState {
  id?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: string;
  fechaInicio: string;
  fechaFin: string;
  usosMaximos: string;
  activo: boolean;
  tipoEvento: string;
  montoMinimo: string;
}

const emptyForm: CuponFormState = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo: 'porcentaje',
  valor: '10',
  fechaInicio: new Date().toISOString().split('T')[0],
  fechaFin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  usosMaximos: '0',
  activo: true,
  tipoEvento: '',
  montoMinimo: '',
};

export default function CuponesPage() {
  const [cupones, setCupones] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CuponFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [statsModal, setStatsModal] = useState<{ cupon: Coupon; stats: { totalUsos: number; totalDescuento: number; usos: CouponUsage[] } } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const { toast } = useToast();

  const fetchCupones = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCupones();
      setCupones(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los cupones.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchCupones(); }, [fetchCupones]);

  const handleNewCupon = () => {
    setFormData({ ...emptyForm, codigo: generateCode() });
    setShowForm(true);
  };

  const handleEditCupon = (cupon: Coupon) => {
    setFormData({
      id: cupon.id,
      codigo: cupon.codigo,
      nombre: cupon.nombre,
      descripcion: cupon.descripcion || '',
      tipo: cupon.tipo,
      valor: cupon.valor.toString(),
      fechaInicio: cupon.fechaInicio.split('T')[0],
      fechaFin: cupon.fechaFin.split('T')[0],
      usosMaximos: cupon.usosMaximos.toString(),
      activo: cupon.activo,
      tipoEvento: cupon.tipoEvento || '',
      montoMinimo: cupon.montoMinimo?.toString() || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveCupon({
        id: formData.id,
        codigo: formData.codigo,
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor) || 0,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        usosMaximos: parseInt(formData.usosMaximos) || 0,
        activo: formData.activo,
        tipoEvento: formData.tipoEvento || undefined,
        montoMinimo: formData.montoMinimo ? parseFloat(formData.montoMinimo) : undefined,
        creadoPor: 'Admin',
      });

      if (result.success) {
        toast({ title: formData.id ? 'Cupón Actualizado' : 'Cupón Creado', description: `El cupón "${result.cupon?.codigo}" fue guardado exitosamente.` });
        setShowForm(false);
        fetchCupones();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    const result = await toggleCuponActivo(id);
    if (result.success) {
      fetchCupones();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteCupon(id);
    if (result.success) {
      toast({ title: 'Eliminado', description: 'El cupón fue eliminado.' });
      fetchCupones();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleViewStats = async (cupon: Coupon) => {
    setIsLoadingStats(true);
    try {
      const stats = await getCuponStats(cupon.id);
      setStatsModal({ cupon, stats });
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las estadísticas.', variant: 'destructive' });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const isExpired = (c: Coupon) => new Date(c.fechaFin) < new Date();
  const isNotStarted = (c: Coupon) => new Date(c.fechaInicio) > new Date();

  const getStatusBadge = (cupon: Coupon) => {
    if (!cupon.activo) return <Badge variant="secondary">Desactivado</Badge>;
    if (isExpired(cupon)) return <Badge variant="destructive">Expirado</Badge>;
    if (isNotStarted(cupon)) return <Badge className="bg-amber-500">Próximo</Badge>;
    if (cupon.usosMaximos > 0 && cupon.usosActuales >= cupon.usosMaximos) return <Badge variant="destructive">Agotado</Badge>;
    return <Badge className="bg-green-600">Activo</Badge>;
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Código copiado', description: `"${code}" copiado al portapapeles.` });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">Cupones y Descuentos</h1>
            <p className="text-muted-foreground text-sm">Crea y gestiona cupones promocionales para tus presupuestos.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/settings">
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
          </Link>
          <Button size="sm" onClick={handleNewCupon}>
            <Plus className="w-4 h-4 mr-2" />Nuevo Cupón
          </Button>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</DialogTitle>
            <DialogDescription>
              {formData.id ? 'Modifica los datos del cupón.' : 'Configura los detalles del nuevo cupón promocional.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.codigo}
                    onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="AK-VERANO25"
                    className="font-mono font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Promo Verano 2025"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descuento especial para reservas de verano"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Descuento</Label>
                <Select value={formData.tipo} onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                    <SelectItem value="monto_fijo">Monto Fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor {formData.tipo === 'porcentaje' ? '(%)' : '($)'}</Label>
                <Input
                  type="number"
                  value={formData.valor}
                  onChange={e => setFormData({ ...formData, valor: e.target.value })}
                  min="0"
                  max={formData.tipo === 'porcentaje' ? '100' : undefined}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={formData.fechaFin}
                  onChange={e => setFormData({ ...formData, fechaFin: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Usos Máximos</Label>
                <Input
                  type="number"
                  value={formData.usosMaximos}
                  onChange={e => setFormData({ ...formData, usosMaximos: e.target.value })}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">0 = ilimitado</p>
              </div>
              <div className="space-y-2">
                <Label>Monto Mínimo ($) (opcional)</Label>
                <Input
                  type="number"
                  value={formData.montoMinimo}
                  onChange={e => setFormData({ ...formData, montoMinimo: e.target.value })}
                  min="0"
                  placeholder="Sin mínimo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Evento (opcional)</Label>
              <Select value={formData.tipoEvento} onValueChange={v => setFormData({ ...formData, tipoEvento: v === '__all__' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos los tipos</SelectItem>
                  {ALL_TIPOS_EVENTO.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Deja vacío para que aplique a cualquier tipo de evento.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {formData.id ? 'Guardar Cambios' : 'Crear Cupón'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={!!statsModal} onOpenChange={() => setStatsModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Estadísticas: {statsModal?.cupon.codigo}</DialogTitle>
            <DialogDescription>{statsModal?.cupon.nombre}</DialogDescription>
          </DialogHeader>
          {statsModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold">{statsModal.stats.totalUsos}</p>
                    <p className="text-xs text-muted-foreground">Usos Totales</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-3xl font-bold text-primary">{formatCurrency(statsModal.stats.totalDescuento)}</p>
                    <p className="text-xs text-muted-foreground">Descuento Total Otorgado</p>
                  </CardContent>
                </Card>
              </div>

              {statsModal.stats.usos.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Descuento</TableHead>
                        <TableHead className="text-right">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statsModal.stats.usos.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="text-sm">{u.clienteNombre}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(u.montoDescuento)}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{formatDate(u.fechaUso)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-4">Este cupón aún no ha sido utilizado.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cupones List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" /> Cupones
            <Badge variant="secondary" className="ml-2">{cupones.length}</Badge>
          </CardTitle>
          <CardDescription>Gestiona tus cupones de descuento. Los clientes pueden aplicarlos al crear presupuestos.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
          ) : cupones.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Ticket className="w-12 h-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No hay cupones creados aún.</p>
              <Button variant="outline" size="sm" onClick={handleNewCupon}><Plus className="w-4 h-4 mr-2" />Crear primer cupón</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {cupones.map((cupon) => (
                <div key={cupon.id} className={`p-4 border rounded-lg transition-all ${!cupon.activo ? 'bg-muted/50 opacity-60' : 'bg-card hover:shadow-sm'}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => copyCode(cupon.codigo)} className="font-mono font-bold text-primary hover:underline flex items-center gap-1 text-sm" title="Copiar código">
                          {cupon.codigo} <Copy className="w-3 h-3" />
                        </button>
                        {getStatusBadge(cupon)}
                        <Badge variant="outline" className="text-xs">
                          {cupon.tipo === 'porcentaje' ? `${cupon.valor}%` : formatCurrency(cupon.valor)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{cupon.nombre}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(cupon.fechaInicio)} - {formatDate(cupon.fechaFin)}</span>
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{cupon.usosActuales}/{cupon.usosMaximos === 0 ? '∞' : cupon.usosMaximos} usos</span>
                        {cupon.tipoEvento && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cupon.tipoEvento}</span>}
                        {cupon.montoMinimo && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />Mín: {formatCurrency(cupon.montoMinimo)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewStats(cupon)} title="Ver estadísticas">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCupon(cupon)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(cupon.id)} title={cupon.activo ? 'Desactivar' : 'Activar'}>
                        {cupon.activo ? <PowerOff className="w-4 h-4 text-amber-600" /> : <Power className="w-4 h-4 text-green-600" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar cupón?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminará permanentemente el cupón &quot;{cupon.codigo}&quot;. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(cupon.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
