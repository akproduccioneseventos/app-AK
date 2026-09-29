
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit3, Save, Loader2, AlertTriangle, Trash2, PlusCircle, Upload, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getActivoFijoById, saveActivoFijo, deleteActivoFijo } from '@/app/actions/activos-fijos';
import { saveGastoGeneral } from '@/app/actions/gastos';
import type { ServicioEmpresa, AnyCategoria, UnidadServicio, TramoDePrecio } from '@/types/empresa';
import { ALL_CATEGORIAS_ACTIVO, ALL_UNIDADES_SERVICIO } from '@/types/empresa';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Separator } from '@/components/ui/separator';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';

export default function EditarActivoFijoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [item, setItem] = useState<ServicioEmpresa | null>(null);
  const [formData, setFormData] = useState<Partial<ServicioEmpresa>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [notFound, setNotFound] = useState(false);
  const [dialogMantenimientoAbierto, setDialogMantenimientoAbierto] = useState(false);
  const [mantenimientoFecha, setMantenimientoFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [mantenimientoNota, setMantenimientoNota] = useState('');
  const [mantenimientoCosto, setMantenimientoCosto] = useState<number | ''>('');

  const itemIdFromParams = params.id;

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const loadedItem = await getActivoFijoById(itemIdFromParams);

      if (loadedItem) {
        setItem(loadedItem);
        setFormData({
          ...loadedItem,
          calculationMethod: loadedItem.calculationMethod || 'fijo',
          valorUnitarioEstimado: loadedItem.valorUnitarioEstimado || 0,
        });
      } else {
        setNotFound(true);
        toast({ title: 'Error', description: `No se encontró el ítem con ID ${itemIdFromParams}.`, variant: 'destructive' });
      }
    } catch (error) {
      setNotFound(true);
      toast({ title: 'Error al Cargar', description: 'No se pudo obtener la información del ítem.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [itemIdFromParams, toast]);

  useEffect(() => {
    if (itemIdFromParams) {
      loadItem();
    }
  }, [itemIdFromParams, loadItem]);

  const handleFormChange = (field: keyof ServicioEmpresa, value: any) => {
    const isNumericField = ['cantidadDisponible', 'valorUnitarioEstimado', 'invitadosPorUnidad'].includes(field as string);

    if (isNumericField && typeof value === 'string') {
      const numValue = value === '' ? undefined : Number(value);
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleTramoChange = (index: number, field: keyof TramoDePrecio, value: string) => {
    setFormData(prev => {
        const nuevosTramos = [...(prev.tramosDePrecio || [])];
        nuevosTramos[index] = {...nuevosTramos[index], [field]: Number(value) || 0 };
        return {...prev, tramosDePrecio: nuevosTramos};
    });
  };

  const addTramo = () => {
    setFormData(prev => ({...prev, tramosDePrecio: [...(prev.tramosDePrecio || []), {id: `tramo_${Date.now()}`, desde: 0, hasta: 0, precio: 0}]}));
  };

  const removeTramo = (index: number) => {
    setFormData(prev => ({...prev, tramosDePrecio: (prev.tramosDePrecio || []).filter((_, i) => i !== index)}));
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('fiestaId', 'activos-fijos');
      formData.append('file', file);
      const result = await uploadPublicPageAsset(formData);
      if (!result.success || !result.url) throw new Error(result.error || 'Error al subir');
      handleFormChange('imageUrl', result.url);
      toast({ title: '✅ Imagen subida', description: 'La foto del activo fue cargada correctamente.' });
    } catch (err: any) {
      toast({ title: 'Error al subir imagen', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAnotarMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mantenimientoNota.trim()) {
      toast({ title: 'Nota requerida', description: 'Por favor ingresá el detalle del mantenimiento.', variant: 'destructive' });
      return;
    }
    const costoNum = typeof mantenimientoCosto === 'number' && mantenimientoCosto > 0 ? mantenimientoCosto : undefined;
    if (costoNum) {
      try {
        const resGasto = await saveGastoGeneral({
          concepto: `Mantenimiento: ${formData.nombre || item?.nombre || 'Equipo'} - ${mantenimientoNota.trim()}`,
          fecha: mantenimientoFecha,
          categoria: 'Reparaciones y Mantenimiento',
          monto: costoNum,
          notas: `Registrado automáticamente desde Activos Fijos (${item?.id || ''})`,
        });
        if (resGasto?.success) {
          toast({ title: 'Gasto registrado', description: 'Se añadió el gasto en Reparaciones y Mantenimiento.' });
        } else {
          toast({ title: 'Aviso de gasto', description: resGasto?.error || 'No se pudo guardar el gasto general.', variant: 'destructive' });
        }
      } catch (err: any) {
        console.error('Error al registrar gasto de mantenimiento:', err);
      }
    }
    const nuevoRegistro = {
      fecha: mantenimientoFecha,
      nota: mantenimientoNota.trim(),
      ...(costoNum ? { costo: costoNum } : {}),
    };
    setFormData(prev => ({
      ...prev,
      mantenimiento: {
        ...prev.mantenimiento,
        ultimoAt: mantenimientoFecha,
        historial: [nuevoRegistro, ...(prev.mantenimiento?.historial || [])],
      },
    }));
    setMantenimientoNota('');
    setMantenimientoCosto('');
    setDialogMantenimientoAbierto(false);
    toast({ title: 'Mantenimiento registrado', description: 'El mantenimiento se anotó correctamente en la ficha del equipo.' });
  };

  const backUrl = '/empresa/activos-fijos';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!formData.nombre?.trim() || !formData.categoria) {
      toast({ title: "Campos Requeridos", description: "Nombre y Categoría son obligatorios.", variant: "destructive" });
      return;
    }

    if (!formData.unidad) {
        toast({ title: "Campo Requerido", description: "La unidad es obligatoria para Activos Fijos.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const itemDataToSave: ServicioEmpresa = {
        ...(item as ServicioEmpresa),
        ...formData,
        nombre: formData.nombre.trim(),
    };

    try {
      const result = await saveActivoFijo(itemDataToSave);
      if (result.success && result.servicio) {
        toast({ title: "¡Activo Actualizado!", description: `El activo "${result.servicio.nombre}" ha sido actualizado.` });
        router.push(backUrl);
      } else {
        throw new Error(result.error || "Error desconocido al actualizar el activo.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
      const result = await deleteActivoFijo(item.id);
      if (result.success) {
        toast({ title: "Activo Eliminado", variant: "destructive" });
        router.push(backUrl);
      } else {
        throw new Error(result.error || "No se pudo eliminar el activo.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (notFound) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>Activo no encontrado. <Link href={backUrl} className="underline">Volver al catálogo</Link>.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Edit3 className="w-8 h-8 text-primary"/>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editando: <span className="text-primary">{item?.nombre}</span>
          </h1>
        </div>
        <Button asChild variant="outline" disabled={isSaving}><Link href={backUrl}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Link></Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Activo Fijo</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="item-nombre" className="text-base">Nombre del Ítem *</Label>
              <Input id="item-nombre" value={formData.nombre || ''} onChange={(e) => handleFormChange('nombre', e.target.value)} required disabled={isSaving}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-image-url" className="text-base">Foto del Activo (URL o subir archivo)</Label>
              <div className="flex gap-2">
                <Input
                  id="item-image-url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => handleFormChange('imageUrl', e.target.value)}
                  placeholder="https://..."
                  disabled={isSaving || isUploadingImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving || isUploadingImage}
                  onClick={() => imageInputRef.current?.click()}
                >
                  {isUploadingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Subir desde dispositivo
                </Button>
                <input ref={imageInputRef} id="item-image-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={isSaving || isUploadingImage} aria-label="Subir imagen del activo" />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item-categoria" className="text-base">Categoría *</Label>
                <Select value={formData.categoria || ''} onValueChange={(value) => handleFormChange('categoria', value as AnyCategoria)} required disabled={isSaving}>
                  <SelectTrigger id="item-categoria"><SelectValue placeholder="Seleccionar categoría..."/></SelectTrigger>
                  <SelectContent className="max-h-60">{ALL_CATEGORIAS_ACTIVO.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
               <div className="space-y-2"><Label htmlFor="item-unidad" className="text-base">Unidad *</Label><Select value={formData.unidad || ''} onValueChange={(value) => handleFormChange('unidad', value as UnidadServicio)} disabled={isSaving} required><SelectTrigger id="item-unidad"><SelectValue /></SelectTrigger><SelectContent>{ALL_UNIDADES_SERVICIO.map(u => (<SelectItem key={u} value={u}>{u}</SelectItem>))}</SelectContent></Select></div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="item-cantidad">Cantidad Disponible (Stock)</Label><Input id="item-cantidad" type="number" value={formData.cantidadDisponible ?? ''} onChange={(e) => handleFormChange('cantidadDisponible', e.target.value)} disabled={isSaving}/></div>
                <div className="space-y-2"><Label htmlFor="item-costo">Costo Interno (UYU)</Label><Input id="item-costo" type="number" value={formData.valorUnitarioEstimado ?? ''} onChange={(e) => handleFormChange('valorUnitarioEstimado', e.target.value)} disabled={isSaving}/></div>
             </div>

             <Separator/>

             <div className="space-y-3">
                 <Label className="text-base font-medium">Método de Cálculo de Cantidad (para Lista de Carga)</Label>
                 <Select value={formData.calculationMethod} onValueChange={(v) => handleFormChange('calculationMethod', v)} disabled={isSaving}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fijo">Cantidad Fija</SelectItem>
                        <SelectItem value="porPersona">Por Persona</SelectItem>
                        <SelectItem value="ratio">Por Ratio de Invitados</SelectItem>
                        <SelectItem value="tramos">Por Tramos de Invitados</SelectItem>
                    </SelectContent>
                 </Select>
             </div>

            {formData.calculationMethod === 'fijo' && (
                <div className="space-y-2"><Label htmlFor="cantidad-fija">Cantidad a Cargar</Label><Input id="cantidad-fija" type="number" value={formData.precioVenta ?? 1} onChange={(e) => handleFormChange('precioVenta', e.target.value)} disabled={isSaving} min="1"/><p className="text-xs text-muted-foreground">Cantidad fija a cargar siempre.</p></div>
            )}
            {formData.calculationMethod === 'porPersona' && (
                 <p className="text-sm text-muted-foreground italic bg-blue-50 p-3 rounded-md">La cantidad se calculará como 1 por cada invitado.</p>
            )}
            {formData.calculationMethod === 'ratio' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="ratio-base">Cantidad por Ratio</Label><Input id="ratio-base" type="number" value={formData.precioBase ?? 1} onChange={(e) => handleFormChange('precioBase', e.target.value)} disabled={isSaving} min="1"/></div>
                    <div className="space-y-2"><Label htmlFor="ratio-invitados">Invitados por Unidad</Label><Input id="ratio-invitados" type="number" value={formData.invitadosPorUnidad ?? ''} onChange={(e) => handleFormChange('invitadosPorUnidad', e.target.value)} disabled={isSaving} min="1"/></div>
                </div>
            )}
            {formData.calculationMethod === 'tramos' && (
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Define la cantidad a cargar para cada rango de invitados.</p>
                    {formData.tramosDePrecio?.map((tramo, index) => (
                        <div key={tramo.id} className="flex items-end gap-2 p-2 border rounded-md">
                            <div className="space-y-1"><Label htmlFor={`tramo-desde-${index}`}>Desde</Label><Input id={`tramo-desde-${index}`} type="number" value={tramo.desde} onChange={e => handleTramoChange(index, 'desde', e.target.value)} className="w-20"/></div>
                            <div className="space-y-1"><Label htmlFor={`tramo-hasta-${index}`}>Hasta</Label><Input id={`tramo-hasta-${index}`} type="number" value={tramo.hasta} onChange={e => handleTramoChange(index, 'hasta', e.target.value)} className="w-20"/></div>
                            <div className="space-y-1 flex-grow"><Label htmlFor={`tramo-cantidad-${index}`}>Cantidad</Label><Input id={`tramo-cantidad-${index}`} type="number" value={tramo.precio} onChange={e => handleTramoChange(index, 'precio', e.target.value)}/></div>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeTramo(index)} disabled={(formData.tramosDePrecio?.length || 0) <= 1}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addTramo}>Añadir Tramo</Button>
                </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-base font-medium">Mantenimiento Preventivo (Opcional)</h3>
                    <p className="text-xs text-muted-foreground">Configurá revisiones y services para recibir avisos antes de las fiestas.</p>
                  </div>
                </div>
                <Dialog open={dialogMantenimientoAbierto} onOpenChange={setDialogMantenimientoAbierto}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Wrench className="w-4 h-4 mr-2" />
                      Anotar un mantenimiento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Anotar un mantenimiento</DialogTitle>
                      <DialogDescription>
                        Registrá una revisión, arreglo o service. Si indicás costo, se anota automáticamente como gasto en contabilidad.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="maint-fecha">Fecha del mantenimiento</Label>
                        <Input
                          id="maint-fecha"
                          type="date"
                          value={mantenimientoFecha}
                          onChange={(e) => setMantenimientoFecha(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maint-nota">Detalle / Trabajo realizado *</Label>
                        <Input
                          id="maint-nota"
                          placeholder="Ej. Cambio de lámpara, lubricación, ajuste..."
                          value={mantenimientoNota}
                          onChange={(e) => setMantenimientoNota(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maint-costo">Costo en UYU (Opcional)</Label>
                        <Input
                          id="maint-costo"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={mantenimientoCosto}
                          onChange={(e) => setMantenimientoCosto(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">Si tiene costo, se guarda en "Reparaciones y Mantenimiento".</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogMantenimientoAbierto(false)}>
                        Cancelar
                      </Button>
                      <Button type="button" onClick={handleAnotarMantenimiento}>
                        Anotar mantenimiento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-mantenimiento-cadadias">Frecuencia recomendada (en días)</Label>
                  <Input
                    id="item-mantenimiento-cadadias"
                    type="number"
                    min="1"
                    placeholder="Ej. 90 (cada 3 meses)"
                    value={formData.mantenimiento?.cadaDias ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        mantenimiento: {
                          ...prev.mantenimiento,
                          cadaDias: val,
                        },
                      }));
                    }}
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">Si vence y el equipo está asignado en una fiesta dentro de 7 días, salta un aviso.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-mantenimiento-ultimo">Último mantenimiento realizado</Label>
                  <Input
                    id="item-mantenimiento-ultimo"
                    type="date"
                    value={formData.mantenimiento?.ultimoAt || ''}
                    onChange={(e) => {
                      const val = e.target.value || undefined;
                      setFormData(prev => ({
                        ...prev,
                        mantenimiento: {
                          ...prev.mantenimiento,
                          ultimoAt: val,
                        },
                      }));
                    }}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {formData.mantenimiento?.historial && formData.mantenimiento.historial.length > 0 && (
                <div className="space-y-2 mt-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historial de mantenimientos</Label>
                  <div className="max-h-36 overflow-y-auto space-y-2 border rounded-md p-2 bg-muted/20">
                    {formData.mantenimiento.historial.map((reg, idx) => (
                      <div key={idx} className="text-sm flex justify-between items-center border-b pb-1 last:border-b-0">
                        <div>
                          <span className="font-medium text-xs text-muted-foreground mr-2">{reg.fecha}</span>
                          <span>{reg.nota}</span>
                        </div>
                        {reg.costo ? <span className="text-xs font-medium text-destructive">${reg.costo}</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-between items-center">
            <Button type="submit" className="w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Guardar Cambios
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" className="w-auto" disabled={isSaving || isDeleting}>
                  {isDeleting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                  Eliminar Activo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El activo "{item?.nombre}" será eliminado permanentemente del catálogo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
