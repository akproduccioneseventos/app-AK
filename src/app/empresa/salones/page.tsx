
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowLeft,
  Building2,
  Edit,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  MapPin,
  PlusCircle,
  Save,
  Star,
  Trash2,
  Upload,
  Users,
  X,
  ImageIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Salon } from '@/types/salon';
import { getSalones, saveSalon, deleteSalon, uploadSalonFoto, deleteSalonFoto } from '@/app/actions/salones';
import { isClubUruguay } from '@/lib/club-uruguay';
import NextImage from 'next/image';

const emptySalon: Omit<Salon, 'id'> = {
  nombre: '',
  direccion: '',
  googleMapsUrl: '',
  capacidad: 0,
  descripcion: '',
  fotos: [],
  esClubUruguay: false,
};

function isSafeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    // Invalid URL
  }
  return null;
}

// ─────────────────── Salon Form ───────────────────

interface SalonFormProps {
  editing: Salon | null;
  form: Omit<Salon, 'id'>;
  isSaving: boolean;
  isUploadingFoto: boolean;
  onChange: (field: keyof Omit<Salon, 'id'>, value: any) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  onUploadFoto: (file: File) => Promise<void>;
  onDeleteFoto: (url: string) => Promise<void>;
}

function SalonForm({
  editing,
  form,
  isSaving,
  isUploadingFoto,
  onChange,
  onSubmit,
  onCancel,
  onUploadFoto,
  onDeleteFoto,
}: SalonFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUploadFoto(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="font-headline text-lg">
          {editing ? `Editar: ${editing.nombre}` : 'Nuevo Salón'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salon-nombre">Nombre del Salón *</Label>
              <Input
                id="salon-nombre"
                value={form.nombre}
                onChange={(e) => onChange('nombre', e.target.value)}
                placeholder="Ej: Salón El Paraíso"
                required
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salon-capacidad">Capacidad (personas)</Label>
              <Input
                id="salon-capacidad"
                type="number"
                value={form.capacidad === 0 ? '' : String(form.capacidad)}
                onChange={(e) =>
                  onChange('capacidad', e.target.value === '' ? 0 : parseInt(e.target.value, 10))
                }
                placeholder="Ej: 200"
                min="0"
                disabled={isSaving}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salon-direccion">Dirección</Label>
            <Input
              id="salon-direccion"
              value={form.direccion}
              onChange={(e) => onChange('direccion', e.target.value)}
              placeholder="Ej: Av. Libertador 1234, Montevideo"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salon-maps">Link de Google Maps</Label>
            <Input
              id="salon-maps"
              type="url"
              value={form.googleMapsUrl}
              onChange={(e) => onChange('googleMapsUrl', e.target.value)}
              placeholder="https://maps.google.com/..."
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salon-descripcion">Descripción</Label>
            <Textarea
              id="salon-descripcion"
              value={form.descripcion || ''}
              onChange={(e) => onChange('descripcion', e.target.value)}
              placeholder="Servicios, características, observaciones del salón..."
              rows={3}
              disabled={isSaving}
            />
          </div>

          {/* Es Club Uruguay checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="salon-esClubUruguay"
              checked={!!form.esClubUruguay}
              onCheckedChange={(checked) => onChange('esClubUruguay', !!checked)}
              disabled={isSaving}
            />
            <Label htmlFor="salon-esClubUruguay" className="cursor-pointer">
              Este salón es el <span className="font-bold text-amber-600">Club Uruguay</span>
            </Label>
          </div>

          {/* Photo upload — only available when editing an existing salon */}
          {editing && (
            <div className="space-y-2">
              <Label>Fotos del Salón</Label>
              <div className="flex flex-wrap gap-2">
                {(form.fotos || []).map((url, i) => (
                  <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                    <NextImage src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => onDeleteFoto(url)}
                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFoto || isSaving}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary transition-colors"
                >
                  {isUploadingFoto ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Subir</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {!(form.fotos?.length) && (
                <p className="text-xs text-muted-foreground">Guardá el salón primero, luego podrás subir fotos.</p>
              )}
            </div>
          )}
          {!editing && (
            <p className="text-xs text-muted-foreground">
              Podrás subir fotos después de crear el salón.
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─────────────────── Salon Card ───────────────────

interface SalonCardProps {
  salon: Salon;
  deletingId: string | null;
  onEdit: (salon: Salon) => void;
  onDelete: (id: string, nombre: string) => void;
}

function SalonCard({ salon, deletingId, onEdit, onDelete }: SalonCardProps) {
  const coverPhoto = salon.fotos?.[0];
  const clubUruguay = salon.esClubUruguay || isClubUruguay(salon.nombre);
  const safeUrl = salon.googleMapsUrl ? isSafeUrl(salon.googleMapsUrl) : null;

  return (
    <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Cover photo */}
      {coverPhoto ? (
        <div className="relative w-full h-36 bg-slate-100">
          <NextImage src={coverPhoto} alt={salon.nombre} fill className="object-cover" />
          {clubUruguay && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 shadow">
                <Star className="w-2.5 h-2.5 mr-1 fill-white" />
                Club Uruguay
              </Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-24 bg-slate-100 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-slate-300" />
          {clubUruguay && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 shadow">
                <Star className="w-2.5 h-2.5 mr-1 fill-white" />
                Club Uruguay
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader className="pb-1 pt-3 px-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-sm font-black text-slate-800 flex-grow">{salon.nombre}</CardTitle>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary"
              onClick={() => onEdit(salon)}
              disabled={!!deletingId}
              title="Editar"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-red-50 text-destructive"
                  disabled={!!deletingId}
                  title="Eliminar"
                >
                  {deletingId === salon.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar salón?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará &quot;{salon.nombre}&quot; del catálogo. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(salon.id, salon.nombre)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-1 space-y-1.5 text-sm text-muted-foreground flex-grow">
        {salon.descripcion && (
          <p className="text-xs text-slate-600 line-clamp-2">{salon.descripcion}</p>
        )}
        {salon.direccion && (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
            <span className="line-clamp-2">{salon.direccion}</span>
          </div>
        )}
        {salon.capacidad > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{salon.capacidad} personas</span>
          </div>
        )}
        {safeUrl && (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver en Google Maps
          </a>
        )}
        {salon.fotos && salon.fotos.length > 1 && (
          <p className="text-xs text-slate-400">{salon.fotos.length} fotos</p>
        )}
        {!salon.direccion && !salon.googleMapsUrl && salon.capacidad === 0 && !salon.descripcion && (
          <p className="text-xs text-muted-foreground/50 italic">Sin datos adicionales</p>
        )}
      </CardContent>

      <div className="px-4 pb-4 space-y-2">
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <Link href={`/empresa/salones/${salon.id}/croquis`}>
            <Button variant="outline" size="sm" className="w-full text-xs h-8">
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
              Ver/Editar Croquis del Salón
            </Button>
          </Link>
          {clubUruguay && (
            <Link href="/empresa/salones/club-uruguay">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Star className="w-3.5 h-3.5 mr-1.5" />
                Ver sección Club Uruguay
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────── Main Page ───────────────────

export default function SalonesPage() {
  const { toast } = useToast();
  const [salones, setSalones] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editing, setEditing] = useState<Salon | null>(null);
  const [form, setForm] = useState<Omit<Salon, 'id'>>(emptySalon);
  const [showForm, setShowForm] = useState(false);

  const fetchSalones = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSalones();
      setSalones(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los salones.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSalones();
  }, [fetchSalones]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptySalon);
    setShowForm(true);
  };

  const handleOpenEdit = (salon: Salon) => {
    setEditing(salon);
    setForm({
      nombre: salon.nombre,
      direccion: salon.direccion,
      googleMapsUrl: salon.googleMapsUrl,
      capacidad: salon.capacidad,
      descripcion: salon.descripcion || '',
      fotos: salon.fotos || [],
      salonLayout: salon.salonLayout,
      esClubUruguay: salon.esClubUruguay || false,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptySalon);
  };

  const handleChange = (field: keyof Omit<Salon, 'id'>, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast({ title: 'Error', description: 'El nombre del salón es obligatorio.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = editing ? { ...form, id: editing.id } : form;
      const result = await saveSalon(payload);
      if (result.success) {
        toast({ title: editing ? 'Salón actualizado' : 'Salón creado', description: `"${form.nombre}" fue guardado correctamente.` });
        handleCancel();
        fetchSalones();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    setDeletingId(id);
    try {
      const result = await deleteSalon(id);
      if (result.success) {
        toast({ title: 'Salón eliminado', description: `"${nombre}" fue eliminado.` });
        fetchSalones();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadFoto = async (file: File) => {
    if (!editing) return;
    setIsUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('salonId', editing.id);
      const result = await uploadSalonFoto(fd);
      if (result.success && result.url) {
        setForm((prev) => ({ ...prev, fotos: [...(prev.fotos || []), result.url!] }));
        toast({ title: 'Foto subida', description: 'La foto fue agregada al salón.' });
        fetchSalones();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: 'Error al subir foto', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploadingFoto(false);
    }
  };

  const handleDeleteFoto = async (url: string) => {
    if (!editing) return;
    try {
      const result = await deleteSalonFoto(editing.id, url);
      if (result.success) {
        setForm((prev) => ({ ...prev, fotos: (prev.fotos || []).filter((u) => u !== url) }));
        toast({ title: 'Foto eliminada' });
        fetchSalones();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: 'Error al eliminar foto', description: err.message, variant: 'destructive' });
    }
  };

  const clubUruguaySalones = salones.filter((s) => s.esClubUruguay || isClubUruguay(s.nombre));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestor de Salones</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleOpenCreate} disabled={showForm}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Agregar Salón
          </Button>
          <Link href="/empresa/salones/club-uruguay">
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <Star className="w-4 h-4 mr-2" />
              Club Uruguay
            </Button>
          </Link>
          <Link href="/empresa">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>
      <CardDescription className="text-base">
        Gestioná los salones con los que trabajás. Al crear un evento podés seleccionar un salón y sus datos se sincronizarán automáticamente.
      </CardDescription>

      {/* Form */}
      {showForm && (
        <SalonForm
          editing={editing}
          form={form}
          isSaving={isSaving}
          isUploadingFoto={isUploadingFoto}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onUploadFoto={handleUploadFoto}
          onDeleteFoto={handleDeleteFoto}
        />
      )}

      {/* Tabs: All salones / Club Uruguay */}
      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos los Salones ({salones.length})</TabsTrigger>
          {clubUruguaySalones.length > 0 && (
            <TabsTrigger value="club-uruguay" className="text-amber-700">
              <Star className="w-3.5 h-3.5 mr-1.5" />
              Club Uruguay ({clubUruguaySalones.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="todos">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Salones Guardados ({salones.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
                </div>
              ) : salones.length === 0 ? (
                <div className="py-16 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No hay salones cargados todavía.</p>
                  <p className="text-sm text-muted-foreground mt-1">Usá el botón &quot;Agregar Salón&quot; para comenzar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {salones.map((salon) => (
                    <SalonCard
                      key={salon.id}
                      salon={salon}
                      deletingId={deletingId}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {clubUruguaySalones.length > 0 && (
          <TabsContent value="club-uruguay">
            <Card className="shadow-lg border-amber-200">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2 text-amber-700">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  Salones Club Uruguay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clubUruguaySalones.map((salon) => (
                    <SalonCard
                      key={salon.id}
                      salon={salon}
                      deletingId={deletingId}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-amber-100">
                  <Link href="/empresa/salones/club-uruguay">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                      <Star className="w-4 h-4 mr-2" />
                      Abrir Dashboard Club Uruguay
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

