'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Plus, Pencil, Trash2, Power, PowerOff, Gift, Megaphone, Eye, ArrowLeft
} from 'lucide-react';
import { getPromos, savePromo, togglePromo, deletePromo } from '@/app/actions/promos';
import { getCupones } from '@/app/actions/cupones';
import type { PromoActiva } from '@/types/promo';
import type { Coupon } from '@/types/coupon';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const emptyForm = (): Omit<PromoActiva, 'id' | 'creadoEn' | 'actualizadoEn'> => ({
  activa: true,
  titulo: '',
  subtitulo: '',
  descripcion: '',
  regalo: '',
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFin: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  codigoCupon: '',
  imagenUrl: '',
  colorFondo: '',
  whatsappMensaje: '¡Hola AK Producciones! Vi la promo y me interesa saber más.',
  ctaTexto: '¡QUIERO MI PROMO!',
  ctaUrl: '',
  mostrarCountdown: true,
  mostrarEnLanding: true,
  mostrarEnSimulador: false,
  posicion: 'floating-bottom',
});

export default function PromosAdminPage() {
  const { toast } = useToast();
  const [promos, setPromos] = useState<PromoActiva[]>([]);
  const [cupones, setCupones] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, c] = await Promise.all([getPromos(), getCupones()]);
    setPromos(p);
    setCupones(c);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (promo: PromoActiva) => {
    setEditingId(promo.id);
    setForm({
      activa: promo.activa,
      titulo: promo.titulo,
      subtitulo: promo.subtitulo,
      descripcion: promo.descripcion,
      regalo: promo.regalo,
      fechaInicio: promo.fechaInicio?.slice(0, 10) ?? '',
      fechaFin: promo.fechaFin?.slice(0, 10) ?? '',
      codigoCupon: promo.codigoCupon ?? '',
      imagenUrl: promo.imagenUrl ?? '',
      colorFondo: promo.colorFondo ?? '',
      whatsappMensaje: promo.whatsappMensaje,
      ctaTexto: promo.ctaTexto,
      ctaUrl: promo.ctaUrl ?? '',
      mostrarCountdown: promo.mostrarCountdown,
      mostrarEnLanding: promo.mostrarEnLanding,
      mostrarEnSimulador: promo.mostrarEnSimulador,
      posicion: promo.posicion,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast({ title: 'Error', description: 'El título es obligatorio.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = editingId ? { ...form, id: editingId } : form;
    const res = await savePromo(payload as any);
    setSaving(false);
    if (res.success) {
      toast({ title: editingId ? 'Promo actualizada' : 'Promo creada' });
      setDialogOpen(false);
      loadData();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  const handleToggle = async (id: string) => {
    const res = await togglePromo(id);
    if (res.success) loadData();
    else toast({ title: 'Error', description: res.error, variant: 'destructive' });
  };

  const handleDelete = async (id: string) => {
    const res = await deletePromo(id);
    if (res.success) { toast({ title: 'Promo eliminada' }); loadData(); }
    else toast({ title: 'Error', description: res.error, variant: 'destructive' });
  };

  const posicionLabel: Record<PromoActiva['posicion'], string> = {
    'banner-top': 'Banner Superior',
    'popup-center': 'Popup Central',
    'floating-bottom': 'Barra Flotante',
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-purple-600" />
            Gestión de Promos
          </h1>
          <p className="text-sm text-slate-500">Crea y gestiona widgets de promo en la landing page</p>
        </div>
        <div className="ml-auto">
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />Nueva Promo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : promos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Sin promos creadas</p>
              <p className="text-sm text-slate-500">Crea tu primera promo para mostrarla en la landing</p>
            </div>
            <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Crear primera promo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {promos.map((promo) => (
            <Card key={promo.id} className={`border-l-4 ${promo.activa ? 'border-l-green-500' : 'border-l-slate-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-slate-900 truncate">{promo.titulo}</h3>
                      <Badge variant={promo.activa ? 'default' : 'secondary'} className="shrink-0">
                        {promo.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {posicionLabel[promo.posicion]}
                      </Badge>
                    </div>
                    {promo.subtitulo && <p className="text-sm text-slate-500">{promo.subtitulo}</p>}
                    {promo.regalo && (
                      <p className="text-sm text-purple-600 font-semibold mt-1">🎁 {promo.regalo}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {promo.fechaInicio} → {promo.fechaFin}
                      {promo.codigoCupon && ` · Cupón: ${promo.codigoCupon}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href="/landing" target="_blank">
                      <Button variant="ghost" size="icon" title="Ver en landing">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(promo)} title="Editar">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(promo.id)}
                      title={promo.activa ? 'Desactivar' : 'Activar'}
                    >
                      {promo.activa
                        ? <PowerOff className="w-4 h-4 text-orange-500" />
                        : <Power className="w-4 h-4 text-green-600" />
                      }
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Eliminar">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar promo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(promo.id)} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Promo' : 'Nueva Promo'}</DialogTitle>
            <DialogDescription>Configura el widget de promo para la landing page</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Activación */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <Label className="font-semibold">Estado</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">{form.activa ? 'Activa' : 'Inactiva'}</span>
                <Switch checked={form.activa} onCheckedChange={(v) => setForm({ ...form, activa: v })} />
              </div>
            </div>

            {/* Posición */}
            <div className="space-y-1">
              <Label>Posición del widget</Label>
              <Select
                value={form.posicion}
                onValueChange={(v) => setForm({ ...form, posicion: v as PromoActiva['posicion'] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner-top">Banner Superior</SelectItem>
                  <SelectItem value="popup-center">Popup Central</SelectItem>
                  <SelectItem value="floating-bottom">Barra Flotante (abajo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Título y subtítulo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Título *</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="¡Promo de Temporada!"
                />
              </div>
              <div className="space-y-1">
                <Label>Subtítulo</Label>
                <Input
                  value={form.subtitulo}
                  onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                  placeholder="Solo por tiempo limitado"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Contratá tu evento y recibí..."
                rows={2}
              />
            </div>

            {/* Regalo */}
            <div className="space-y-1">
              <Label>🎁 Regalo / Beneficio</Label>
              <Input
                value={form.regalo}
                onChange={(e) => setForm({ ...form, regalo: e.target.value })}
                placeholder="DJ GRATIS + Mesa de Dulces"
              />
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Fecha fin (para countdown)</Label>
                <Input
                  type="date"
                  value={form.fechaFin}
                  onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                />
              </div>
            </div>

            {/* Cupón */}
            <div className="space-y-1">
              <Label>Cupón vinculado (opcional)</Label>
              <Select
                value={form.codigoCupon || '__none__'}
                onValueChange={(v) => setForm({ ...form, codigoCupon: v === '__none__' ? '' : v })}
              >
                <SelectTrigger><SelectValue placeholder="Sin cupón" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin cupón</SelectItem>
                  {cupones.map((c) => (
                    <SelectItem key={c.id} value={c.codigo}>{c.codigo} — {c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mensaje WhatsApp */}
            <div className="space-y-1">
              <Label>Mensaje de WhatsApp pre-armado</Label>
              <Textarea
                value={form.whatsappMensaje}
                onChange={(e) => setForm({ ...form, whatsappMensaje: e.target.value })}
                rows={2}
              />
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Texto del CTA</Label>
                <Input
                  value={form.ctaTexto}
                  onChange={(e) => setForm({ ...form, ctaTexto: e.target.value })}
                  placeholder="¡QUIERO MI PROMO!"
                />
              </div>
              <div className="space-y-1">
                <Label>URL destino (opcional)</Label>
                <Input
                  value={form.ctaUrl}
                  onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                  placeholder="https://wa.me/... o /landing/bodas"
                />
              </div>
            </div>

            {/* Color */}
            <div className="space-y-1">
              <Label>Color de fondo (CSS gradient, opcional)</Label>
              <Input
                value={form.colorFondo}
                onChange={(e) => setForm({ ...form, colorFondo: e.target.value })}
                placeholder="linear-gradient(135deg, #7c3aed, #db2777)"
              />
            </div>

            {/* Switches */}
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'mostrarCountdown', label: 'Mostrar countdown' },
                { key: 'mostrarEnLanding', label: 'Mostrar en landing' },
                { key: 'mostrarEnSimulador', label: 'Mostrar en simulador' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <Label className="text-xs font-semibold">{label}</Label>
                  <Switch
                    checked={form[key]}
                    onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Guardar cambios' : 'Crear promo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
