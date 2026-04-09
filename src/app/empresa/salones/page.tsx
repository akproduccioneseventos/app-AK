
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Building2, Edit, ExternalLink, Loader2, MapPin, PlusCircle, Save, Trash2, Users, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Salon } from '@/types/salon';
import { getSalones, saveSalon, deleteSalon } from '@/app/actions/salones';

const emptySalon: Omit<Salon, 'id'> = {
  nombre: '',
  direccion: '',
  googleMapsUrl: '',
  capacidad: 0,
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

export default function SalonesPage() {
  const { toast } = useToast();
  const [salones, setSalones] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
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
    setForm({ nombre: salon.nombre, direccion: salon.direccion, googleMapsUrl: salon.googleMapsUrl, capacidad: salon.capacidad });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptySalon);
  };

  const handleChange = (field: keyof Omit<Salon, 'id'>, value: string | number) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestor de Salones</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenCreate} disabled={showForm}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Agregar Salón
          </Button>
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
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="font-headline text-lg">
              {editing ? `Editar: ${editing.nombre}` : 'Nuevo Salón'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salon-nombre">Nombre del Salón *</Label>
                  <Input
                    id="salon-nombre"
                    value={form.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
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
                    onChange={(e) => handleChange('capacidad', e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
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
                  onChange={(e) => handleChange('direccion', e.target.value)}
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
                  onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  disabled={isSaving}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Salones List */}
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
              <p className="text-sm text-muted-foreground mt-1">Usá el botón "Agregar Salón" para comenzar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salones.map((salon) => (
                <Card key={salon.id} className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-sm font-black text-slate-800 flex-grow">{salon.nombre}</CardTitle>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary"
                          onClick={() => handleOpenEdit(salon)}
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
                                onClick={() => handleDelete(salon.id, salon.nombre)}
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
                  <CardContent className="px-4 pb-4 pt-1 space-y-1.5 text-sm text-muted-foreground">
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
                    {(() => {
                      const safeUrl = salon.googleMapsUrl ? isSafeUrl(salon.googleMapsUrl) : null;
                      if (!safeUrl) return null;
                      return (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver en Google Maps
                        </a>
                      );
                    })()}
                    {!salon.direccion && !salon.googleMapsUrl && salon.capacidad === 0 && (
                      <p className="text-xs text-muted-foreground/50 italic">Sin datos adicionales</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
