'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import {
  ArrowLeft,
  AlertTriangle,
  Download,
  GlassWater,
  Loader2,
  PlusCircle,
  Printer,
  Save,
  Trash2,
  Upload,
  WandSparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { CartaTragosData, FiestaEnPlanificacion, Trago, TragoRecetaIngrediente } from '@/types/fiesta';
import type { ServicioEmpresa } from '@/types/empresa';
import { CartaTragosMenu } from '@/components/invitacion/templates/CartaTragosMenu';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';
import { getCartaTragosMaster, saveCartaTragosMaster } from '@/app/actions/carta-tragos-master.actions';
import { getInsumos, saveInsumo } from '@/app/actions/insumos';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { getServiciosEmpresa, saveServicioEmpresa } from '@/app/actions/servicios-empresa';

const formatCurrency = (amount?: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(Number(amount || 0));

const emptyPreviewFiesta = {} as FiestaEnPlanificacion;

const fonts = ['Playfair Display', 'Inter', 'Belleza', 'Dancing Script'];

const isBebidaInsumo = (insumo: ServicioEmpresa) =>
  insumo.tipoItem === 'Bebida (Insumo)' || insumo.categoria === 'Bebida (Insumo)' || insumo.categoria === 'Insumos varios';

const getRecipe = (item: Trago): TragoRecetaIngrediente[] => item.recetaIngredientes || [];

export default function TragosMasterPage() {
  const { toast } = useToast();

  const [items, setItems] = useState<Trago[]>([]);
  const [insumos, setInsumos] = useState<ServicioEmpresa[]>([]);
  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [stockDrafts, setStockDrafts] = useState<Record<string, number>>({});
  const [lowStockLimit, setLowStockLimit] = useState(5);

  const [cartaPreview, setCartaPreview] = useState<CartaTragosData>(defaultCartaTragosData);
  const previewRef = useRef<HTMLDivElement>(null);

  const [eventPeople, setEventPeople] = useState(100);
  const [selectedInsumoId, setSelectedInsumoId] = useState('');
  const [consumedUnits, setConsumedUnits] = useState(1);
  const [unitSizeLiters, setUnitSizeLiters] = useState(0.75);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [master, allInsumos, allServicios] = await Promise.all([
        getCartaTragosMaster(),
        getInsumos(),
        getServiciosEmpresa(),
      ]);
      setItems(master);
      setInsumos(allInsumos);
      setServicios(allServicios);

      setCartaPreview((prev) => ({
        ...prev,
        titulo: prev.titulo || 'CARTA DE TRAGOS',
        items: master.slice(0, 10),
      }));

      const draftMap: Record<string, number> = {};
      allInsumos.forEach((insumo) => {
        draftMap[insumo.id] = insumo.cantidadDisponible ?? 0;
      });
      setStockDrafts(draftMap);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCartaPreview((prev) => ({ ...prev, items: items.slice(0, 10) }));
  }, [items]);

  const bebidaInsumos = useMemo(() => insumos.filter(isBebidaInsumo), [insumos]);

  const updateItem = (id: string, patch: Partial<Trago>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    const id = `trago_master_${Date.now()}`;
    setItems((prev) => [
      ...prev,
      { id, nombre: 'Nuevo Trago', imageUrl: '', aiHint: '', ingredientes: [], recetaIngredientes: [], stockDisponible: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addRecipeIngredient = (tragoId: string) => {
    const defaultInsumo = bebidaInsumos[0];
    if (!defaultInsumo) {
      toast({ title: 'Sin insumos', description: 'Agrega insumos de bebida primero.', variant: 'destructive' });
      return;
    }
    const newIngredient: TragoRecetaIngrediente = {
      insumoId: defaultInsumo.id,
      nombre: defaultInsumo.nombre,
      cantidad: 0.05,
      unidad: defaultInsumo.unidad || 'Litro',
    };
    setItems((prev) =>
      prev.map((item) =>
        item.id === tragoId ? { ...item, recetaIngredientes: [...getRecipe(item), newIngredient] } : item
      )
    );
  };

  const updateRecipeIngredient = (
    tragoId: string,
    index: number,
    patch: Partial<TragoRecetaIngrediente>
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== tragoId) return item;
        const recipe = [...getRecipe(item)];
        recipe[index] = { ...recipe[index], ...patch };
        return { ...item, recetaIngredientes: recipe };
      })
    );
  };

  const removeRecipeIngredient = (tragoId: string, index: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== tragoId) return item;
        return { ...item, recetaIngredientes: getRecipe(item).filter((_, idx) => idx !== index) };
      })
    );
  };

  const handleUploadImage = async (tragoId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(tragoId);
    try {
      const formData = new FormData();
      formData.append('folder', 'empresa-barra-tragos-master');
      formData.append('file', file);
      const result = await uploadPublicPageAsset(formData);
      if (!result.success || !result.url) {
        throw new Error(result.error || 'No se pudo subir la imagen.');
      }
      updateItem(tragoId, { imageUrl: result.url });
      toast({ title: 'Imagen subida' });
    } catch (e: any) {
      toast({ title: 'Error al subir imagen', description: e.message, variant: 'destructive' });
    } finally {
      setIsUploading(null);
      event.target.value = '';
    }
  };

  const handleSaveMaster = async () => {
    setIsSaving(true);
    try {
      const normalized = items.map((item) => ({
        ...item,
        ingredientes: getRecipe(item).length
          ? getRecipe(item).map((ing) => `${ing.cantidad} ${ing.unidad} ${ing.nombre}`.trim())
          : item.ingredientes || [],
      }));

      const result = await saveCartaTragosMaster(normalized);
      if (!result.success) throw new Error(result.error || 'No se pudo guardar');
      setItems(result.data || normalized);
      toast({ title: 'Catálogo maestro guardado' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPng = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = 'carta-tragos-master.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      toast({ title: 'Error', description: 'No se pudo exportar la carta.', variant: 'destructive' });
    }
  };

  const handlePrint = () => window.print();

  const saveStockQuick = async (insumo: ServicioEmpresa) => {
    const cantidadDisponible = Number(stockDrafts[insumo.id] ?? 0);
    const result = await saveInsumo({ ...insumo, cantidadDisponible });
    if (result.success) {
      toast({ title: 'Stock actualizado', description: `${insumo.nombre}: ${cantidadDisponible}` });
      await loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const totalStockValue = useMemo(
    () => bebidaInsumos.reduce((sum, insumo) => sum + (insumo.valorUnitarioEstimado || 0) * (insumo.cantidadDisponible || 0), 0),
    [bebidaInsumos]
  );

  const selectedInsumo = bebidaInsumos.find((i) => i.id === selectedInsumoId) || bebidaInsumos[0];

  useEffect(() => {
    if (!selectedInsumoId && bebidaInsumos[0]) {
      setSelectedInsumoId(bebidaInsumos[0].id);
    }
  }, [selectedInsumoId, bebidaInsumos]);

  const theoreticalPerPerson = useMemo(() => {
    if (!selectedInsumo) return 0;
    return items.reduce((sum, trago) => {
      const itemTotal = getRecipe(trago)
        .filter((ing) => ing.insumoId === selectedInsumo.id)
        .reduce((recipeSum, ing) => recipeSum + (Number(ing.cantidad) || 0), 0);
      return sum + itemTotal;
    }, 0);
  }, [items, selectedInsumo]);

  const realPerPerson = eventPeople > 0 ? (consumedUnits * unitSizeLiters) / eventPeople : 0;
  const unitCost = selectedInsumo?.valorUnitarioEstimado || 0;
  const realCostPerPerson = realPerPerson * unitCost;
  const theoreticalCostPerPerson = theoreticalPerPerson * unitCost;
  const deltaCostPerPerson = realCostPerPerson - theoreticalCostPerPerson;

  const barraService = useMemo(
    () =>
      servicios.find(
        (serv) =>
          serv.id.toLowerCase().includes('barra_tragos') ||
          serv.nombre.toLowerCase().includes('barra de tragos') ||
          serv.nombre.toLowerCase().includes('barra tragos')
      ),
    [servicios]
  );

  const currentBarraCost = barraService?.valorUnitarioEstimado || 0;
  const suggestedBarraCost = Math.max(0, currentBarraCost + deltaCostPerPerson);

  const applySuggestedCost = async () => {
    if (!barraService) return;
    const result = await saveServicioEmpresa({
      ...barraService,
      valorUnitarioEstimado: suggestedBarraCost,
      precioPorPersona: barraService.precioPorPersona ?? suggestedBarraCost,
      calculationMethod: barraService.calculationMethod || 'porPersona',
    });
    if (result.success) {
      toast({ title: 'Costo base actualizado', description: `Nuevo costo sugerido: ${formatCurrency(suggestedBarraCost)}` });
      await loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GlassWater className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-black">Barra de Tragos (Master)</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Módulo maestro independiente y sincronizado</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={addItem} variant="outline">
            <PlusCircle className="w-4 h-4 mr-2" /> Agregar Trago
          </Button>
          <Button onClick={handleSaveMaster} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Catálogo
          </Button>
          <Link href="/empresa/menus">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="catalogo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="catalogo">🍹 Catálogo + Recetas</TabsTrigger>
          <TabsTrigger value="diseno">🖨️ Diseño Carta</TabsTrigger>
          <TabsTrigger value="stock">📦 Stonk</TabsTrigger>
          <TabsTrigger value="afinador">🧮 Afinador</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{item.nombre}</CardTitle>
                <CardDescription>Configura nombre, imagen, descripción y receta de ingredientes por trago.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label>Nombre</Label>
                    <Input value={item.nombre} onChange={(e) => updateItem(item.id, { nombre: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Descripción / aiHint</Label>
                    <Textarea value={item.aiHint || ''} onChange={(e) => updateItem(item.id, { aiHint: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-1">
                    <Label>Imagen (Firebase Storage)</Label>
                    <div className="flex gap-2">
                      <Input value={item.imageUrl || ''} onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })} placeholder="https://..." />
                      <label htmlFor={`upload-${item.id}`}>
                        <Button type="button" variant="outline" className="pointer-events-none" asChild>
                          <span>{isUploading === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</span>
                        </Button>
                      </label>
                      <input
                        id={`upload-${item.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleUploadImage(item.id, event)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Acciones</Label>
                    <Button variant="destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Receta</Label>
                    <Button variant="outline" size="sm" onClick={() => addRecipeIngredient(item.id)}>
                      <PlusCircle className="w-3.5 h-3.5 mr-1" /> Ingrediente
                    </Button>
                  </div>
                  {getRecipe(item).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin ingredientes aún.</p>
                  ) : (
                    <div className="space-y-2">
                      {getRecipe(item).map((ingredient, index) => (
                        <div key={`${item.id}-${index}`} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-6">
                            <Select
                              value={ingredient.insumoId}
                              onValueChange={(value) => {
                                const insumo = bebidaInsumos.find((i) => i.id === value);
                                if (!insumo) return;
                                updateRecipeIngredient(item.id, index, {
                                  insumoId: insumo.id,
                                  nombre: insumo.nombre,
                                  unidad: insumo.unidad || ingredient.unidad || 'Litro',
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un insumo" />
                              </SelectTrigger>
                              <SelectContent>
                                {bebidaInsumos.map((insumo) => (
                                  <SelectItem key={insumo.id} value={insumo.id}>
                                    {insumo.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={ingredient.cantidad}
                              onChange={(e) =>
                                updateRecipeIngredient(item.id, index, { cantidad: Number(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={ingredient.unidad}
                              onChange={(e) => updateRecipeIngredient(item.id, index, { unidad: e.target.value })}
                            />
                          </div>
                          <div className="col-span-2">
                            <Button variant="ghost" onClick={() => removeRecipeIngredient(item.id, index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="diseno" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diseño de la Carta de Tragos</CardTitle>
              <CardDescription>Edita título, colores y tipografías con previsualización en vivo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-5 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <Label>Título general</Label>
                  <Input value={cartaPreview.titulo || ''} onChange={(e) => setCartaPreview((prev) => ({ ...prev, titulo: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Tipografía</Label>
                  <Select value={cartaPreview.fontFamily || fonts[0]} onValueChange={(value) => setCartaPreview((prev) => ({ ...prev, fontFamily: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {fonts.map((font) => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Color primario</Label>
                  <Input type="color" value={cartaPreview.paletaColores?.primary || '#9333ea'} onChange={(e) => setCartaPreview((prev) => ({ ...prev, paletaColores: { ...(prev.paletaColores || { primary: '#9333ea', secondary: '#363636', accent: '#ffffff' }), primary: e.target.value } }))} />
                </div>
                <div className="space-y-1">
                  <Label>Color texto</Label>
                  <Input type="color" value={cartaPreview.paletaColores?.secondary || '#363636'} onChange={(e) => setCartaPreview((prev) => ({ ...prev, paletaColores: { ...(prev.paletaColores || { primary: '#9333ea', secondary: '#363636', accent: '#ffffff' }), secondary: e.target.value } }))} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportPng}><Download className="w-4 h-4 mr-2" /> Exportar PNG</Button>
                <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Imprimir</Button>
              </div>

              <div className="overflow-auto border rounded-lg p-4 bg-muted/30">
                <div ref={previewRef} className="w-[15cm] h-[10cm] bg-white mx-auto">
                  <CartaTragosMenu fiesta={emptyPreviewFiesta} carta={cartaPreview} isPreview={false} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Control de Stock e Inventario</CardTitle>
              <CardDescription>Inventario de bebidas, refrescos y frutas de barra con actualización rápida.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <Label>Alerta de stock bajo (&lt; X)</Label>
                  <Input type="number" min={0} value={lowStockLimit} onChange={(e) => setLowStockLimit(Number(e.target.value) || 0)} className="w-28" />
                </div>
                <Badge variant="secondary">Valor total: {formatCurrency(totalStockValue)}</Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Costo Unitario</TableHead>
                    <TableHead>Cantidad Disponible</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bebidaInsumos.map((insumo) => {
                    const cantidad = Number(stockDrafts[insumo.id] ?? insumo.cantidadDisponible ?? 0);
                    const isLow = cantidad < lowStockLimit;
                    return (
                      <TableRow key={insumo.id}>
                        <TableCell className="font-medium">{insumo.nombre}</TableCell>
                        <TableCell>{formatCurrency(insumo.valorUnitarioEstimado)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={cantidad}
                            onChange={(e) =>
                              setStockDrafts((prev) => ({ ...prev, [insumo.id]: Number(e.target.value) || 0 }))
                            }
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency((insumo.valorUnitarioEstimado || 0) * cantidad)}</TableCell>
                        <TableCell>
                          {isLow ? (
                            <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Bajo</Badge>
                          ) : (
                            <Badge variant="outline">OK</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => saveStockQuick(insumo)}>Actualizar</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="afinador" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><WandSparkles className="w-5 h-5 text-primary" /> Calculadora de Consumo y Afinador</CardTitle>
              <CardDescription>Compara consumo real por persona contra consumo teórico de recetas y sugiere nuevo costo base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Personas del evento</Label>
                  <Input type="number" min={1} value={eventPeople} onChange={(e) => setEventPeople(Number(e.target.value) || 1)} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Insumo consumido</Label>
                  <Select value={selectedInsumo?.id || ''} onValueChange={setSelectedInsumoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {bebidaInsumos.map((insumo) => (
                        <SelectItem key={insumo.id} value={insumo.id}>{insumo.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Botellas consumidas</Label>
                  <Input type="number" min={0} step="0.1" value={consumedUnits} onChange={(e) => setConsumedUnits(Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-1">
                  <Label>Litros por botella</Label>
                  <Input type="number" min={0} step="0.01" value={unitSizeLiters} onChange={(e) => setUnitSizeLiters(Number(e.target.value) || 0)} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Consumo real p/persona</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{realPerPerson.toFixed(4)} L</p>
                    <p className="text-xs text-muted-foreground">Costo: {formatCurrency(realCostPerPerson)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Consumo teórico recetas</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{theoreticalPerPerson.toFixed(4)} L</p>
                    <p className="text-xs text-muted-foreground">Costo: {formatCurrency(theoreticalCostPerPerson)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Ajuste sugerido p/persona</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{formatCurrency(suggestedBarraCost)}</p>
                    <p className="text-xs text-muted-foreground">Delta consumo: {formatCurrency(deltaCostPerPerson)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border p-3 text-sm">
                {barraService ? (
                  <>
                    <p>Servicio detectado: <strong>{barraService.nombre}</strong></p>
                    <p>Costo base actual: <strong>{formatCurrency(currentBarraCost)}</strong></p>
                    <Button className="mt-3" onClick={applySuggestedCost}>Aplicar costo sugerido</Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">No se encontró un servicio “Barra de Tragos” en el catálogo de servicios.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
