
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, Save, Loader2, AlertTriangle, Edit3, Tag, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Presupuesto, TipoEvento, ItemPresupuestado } from '@/types/presupuesto';
import { getPresupuestoById, updatePresupuesto } from '@/app/actions/presupuestos';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';

export default function EditarPresupuestoPage({ params: paramsProp }: { params: { id: string } }) {
  const params = React.use(paramsProp);
  const router = useRouter();
  const presupuestoId = params.id as string;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [clienteNombre, setClienteNombre] = useState('');
  const [eventoTipo, setEventoTipo] = useState<TipoEvento | string>('');
  const [eventoFecha, setEventoFecha] = useState<Date | undefined>(undefined);
  const [invitadosCantidad, setInvitadosCantidad] = useState<number | null>(null);
  const [salonFiestas, setSalonFiestas] = useState('');
  const [protagonista1Nombre, setProtagonista1Nombre] = useState('');
  const [protagonista2Nombre, setProtagonista2Nombre] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [notas, setNotas] = useState('');
  const [estado, setEstado] = useState<Presupuesto['estado']>('Borrador');
  
  // Discount fields
  const [nombrePromocion, setNombrePromocion] = useState('');
  const [descuentoTipo, setDescuentoTipo] = useState<Presupuesto['descuentoTipo']>(undefined);
  const [descuentoValor, setDescuentoValor] = useState<string>(''); // Store as string for input
  const [vigenciaPromocion, setVigenciaPromocion] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadPresupuesto = useCallback(async () => {
    if (!presupuestoId) { setNotFound(true); setIsLoading(false); return; }
    setIsLoading(true); setNotFound(false);
    try {
      const loadedPresupuesto = await getPresupuestoById(presupuestoId);
      if (loadedPresupuesto) {
        setPresupuesto(loadedPresupuesto);
        setClienteNombre(loadedPresupuesto.clienteNombre);
        setEventoTipo(loadedPresupuesto.eventoTipo);
        setEventoFecha(loadedPresupuesto.eventoFecha ? new Date(loadedPresupuesto.eventoFecha) : undefined);
        setInvitadosCantidad(loadedPresupuesto.invitadosCantidad);
        setSalonFiestas(loadedPresupuesto.salonFiestas || '');
        setProtagonista1Nombre(loadedPresupuesto.protagonista1Nombre || '');
        setProtagonista2Nombre(loadedPresupuesto.protagonista2Nombre || '');
        setNombreEmpresa(loadedPresupuesto.nombreEmpresa || '');
        setNotas(loadedPresupuesto.notas || '');
        setEstado(loadedPresupuesto.estado);
        setNombrePromocion(loadedPresupuesto.nombrePromocion || '');
        setDescuentoTipo(loadedPresupuesto.descuentoTipo);
        setDescuentoValor(loadedPresupuesto.descuentoValor?.toString() || '');
        setVigenciaPromocion(loadedPresupuesto.vigenciaPromocion || '');
      } else {
        setNotFound(true);
        toast({ title: 'Error', description: `Presupuesto no encontrado.`, variant: 'destructive' });
      }
    } catch (error) {
      setNotFound(true);
      toast({ title: 'Error al Cargar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [presupuestoId, toast]);

  useEffect(() => { loadPresupuesto(); }, [loadPresupuesto]);

  const eventoTipoEnSelect =
    eventoTipo && ALL_TIPOS_EVENTO.includes(eventoTipo as TipoEvento)
      ? eventoTipo
      : (eventoTipo && eventoTipo.trim() !== "" ? "Otro" : "");

  const handleSelectTipoEventoChange = (value: string) => {
    const newTipoEvento = value === "Otro" ? "" : value as TipoEvento;
    setEventoTipo(newTipoEvento);
    // Clear conditional fields
    if (newTipoEvento !== 'Evento corporativo') setNombreEmpresa('');
    if (newTipoEvento !== 'Boda') setProtagonista2Nombre('');
    if (newTipoEvento === 'Evento corporativo' || newTipoEvento === 'Boda') setProtagonista1Nombre('');
  };
  
  const handleCustomTipoEventoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventoTipo(e.target.value);
  };
  const finalEventType = eventoTipo.trim();
  const showCustomTipoInput = eventoTipoEnSelect === "Otro" || (finalEventType && !ALL_TIPOS_EVENTO.includes(finalEventType as TipoEvento));


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!presupuesto) return;
    if (!clienteNombre.trim() || !finalEventType.trim() || !eventoFecha || !invitadosCantidad || invitadosCantidad <= 0 || !salonFiestas.trim()) {
      toast({ title: "Campos incompletos", description: "Cliente, tipo, fecha, invitados y salón son requeridos.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const descuentoValorNum = parseFloat(descuentoValor) || 0;

    const updatedData: Presupuesto = {
      ...presupuesto, // This includes itemsPresupuestados and other unchanged fields
      clienteNombre: clienteNombre.trim(),
      eventoTipo: finalEventType,
      eventoFecha: eventoFecha.toISOString(),
      invitadosCantidad: Number(invitadosCantidad),
      salonFiestas: salonFiestas.trim(),
      protagonista1Nombre: protagonista1Nombre.trim() || undefined,
      protagonista2Nombre: finalEventType === 'Boda' ? (protagonista2Nombre.trim() || undefined) : undefined,
      nombreEmpresa: finalEventType === 'Evento corporativo' ? (nombreEmpresa.trim() || undefined) : undefined,
      notas: notas.trim(),
      estado,
      nombrePromocion: nombrePromocion.trim() || undefined,
      descuentoTipo: descuentoTipo,
      descuentoValor: descuentoValorNum > 0 ? descuentoValorNum : undefined,
      // totalConDescuento will be recalculated in the server action
      vigenciaPromocion: vigenciaPromocion.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      const result = await updatePresupuesto(updatedData);
      if (result.success && result.presupuesto) {
        toast({ title: "¡Presupuesto Actualizado!", description: `El presupuesto para "${result.presupuesto.clienteNombre}" ha sido actualizado.` });
        setPresupuesto(result.presupuesto);
        // Optionally, re-set form fields from result.presupuesto to ensure consistency if server modifies data
        setDescuentoValor(result.presupuesto.descuentoValor?.toString() || '');
      } else {
        throw new Error(result.error || "Error desconocido al actualizar.");
      }
    } catch (error: any) {
      toast({ title: "Error al Actualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="ml-4 text-xl">Cargando...</p></div>;
  if (notFound) return <div className="flex flex-col items-center justify-center h-screen text-center"><AlertTriangle className="w-16 h-16 text-destructive mb-4" /><h1 className="text-2xl font-bold">Presupuesto No Encontrado</h1><Link href="/presupuestos"><Button variant="outline" className="mt-4"><ArrowLeft />Volver</Button></Link></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Edit3 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Editar Presupuesto #{presupuesto?.id.split('_').pop()?.substring(0,5)}</h1></div>
        <Link href="/presupuestos" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft />Volver</Button></Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="font-headline">Información Principal</CardTitle><CardDescription>Modifica los detalles generales. La edición de servicios se realiza en el Paso 2 del creador de presupuestos.</CardDescription></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Step 1 equivalent fields */}
            <div className="space-y-2"><Label htmlFor="clienteNombre">Nombre Cliente*</Label><Input id="clienteNombre" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} disabled={isSaving} required/></div>
            <div className="space-y-2"><Label htmlFor="salonFiestas">Salón de Fiestas*</Label><Input id="salonFiestas" value={salonFiestas} onChange={(e) => setSalonFiestas(e.target.value)} disabled={isSaving} required/></div>
            <div className="space-y-2"><Label htmlFor="eventoTipo">Tipo Evento*</Label>
              <Select value={eventoTipoEnSelect} onValueChange={handleSelectTipoEventoChange} disabled={isSaving} required>
                  <SelectTrigger id="eventoTipo"><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                  <SelectContent>{ALL_TIPOS_EVENTO.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
              </Select>
              {showCustomTipoInput && <Input value={finalEventType !== "Otro" ? finalEventType : ""} onChange={handleCustomTipoEventoInputChange} placeholder="Especificar tipo" className="mt-2" disabled={isSaving} required={showCustomTipoInput}/>}
            </div>
            {finalEventType === 'Boda' && (<div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="protagonista1">Novio/a 1</Label><Input id="protagonista1" value={protagonista1Nombre} onChange={e => setProtagonista1Nombre(e.target.value)} disabled={isSaving}/></div><div className="space-y-2"><Label htmlFor="protagonista2">Novio/a 2</Label><Input id="protagonista2" value={protagonista2Nombre} onChange={e => setProtagonista2Nombre(e.target.value)} disabled={isSaving}/></div></div>)}
            {finalEventType === 'Evento corporativo' && (<div className="space-y-2"><Label htmlFor="nombreEmpresa">Empresa</Label><Input id="nombreEmpresa" value={nombreEmpresa} onChange={e => setNombreEmpresa(e.target.value)} disabled={isSaving}/></div>)}
            {finalEventType && finalEventType !== 'Boda' && finalEventType !== 'Evento corporativo' && (<div className="space-y-2"><Label htmlFor="protagonistaUnico">Agasajado</Label><Input id="protagonistaUnico" value={protagonista1Nombre} onChange={e => setProtagonista1Nombre(e.target.value)} disabled={isSaving}/></div>)}
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="eventoFecha">Fecha Evento*</Label><DatePickerDemo selectedDate={eventoFecha} onDateChange={setEventoFecha} className={isSaving ? "opacity-70":""}/></div><div className="space-y-2"><Label htmlFor="invitadosCantidad">Nº Invitados*</Label><Input id="invitadosCantidad" type="number" value={invitadosCantidad ?? ''} onChange={(e) => setInvitadosCantidad(e.target.value ? parseInt(e.target.value) : null)} min="1" disabled={isSaving} required/></div></div>
            
            {/* Discount fields - Step 3 equivalent fields */}
            <div className="pt-4 border-t mt-4 space-y-4">
              <h3 className="text-md font-medium flex items-center gap-2"><Tag className="w-5 h-5 text-primary"/>Promoción / Descuento (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="promo-nombre-edit">Nombre Promoción</Label><Input id="promo-nombre-edit" value={nombrePromocion} onChange={e => setNombrePromocion(e.target.value)} disabled={isSaving} placeholder="Ej: Descuento Amigos"/></div>
                <div className="space-y-1"><Label htmlFor="promo-vigencia-edit">Vigencia</Label><Input id="promo-vigencia-edit" value={vigenciaPromocion} onChange={e => setVigenciaPromocion(e.target.value)} disabled={isSaving} placeholder="Ej: Hasta 31/12"/></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="descuento-tipo-edit">Tipo Descuento</Label>
                  <Select value={descuentoTipo || ''} onValueChange={val => setDescuentoTipo(val as Presupuesto['descuentoTipo'])} disabled={isSaving}>
                    <SelectTrigger id="descuento-tipo-edit"><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                      <SelectItem value="fijo">Monto Fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="descuento-valor-edit" className="flex items-center gap-1">
                    {descuentoTipo === 'porcentaje' ? <Percent className="w-4 h-4 text-muted-foreground"/> : <span className="text-muted-foreground font-bold text-sm">$</span>}
                    Valor Descuento
                  </Label>
                  <Input id="descuento-valor-edit" type="number" value={descuentoValor} onChange={e => setDescuentoValor(e.target.value)} min="0" step="any" disabled={isSaving || !descuentoTipo} placeholder="Ej: 10 o 5000"/>
                </div>
              </div>
            </div>

            <div className="space-y-2"><Label htmlFor="estado-presupuesto">Estado</Label><Select value={estado} onValueChange={(value) => setEstado(value as Presupuesto['estado'])} disabled={isSaving}><SelectTrigger id="estado-presupuesto"><SelectValue /></SelectTrigger><SelectContent>{(['Borrador', 'Enviado', 'Aceptado', 'Rechazado', 'Facturado'] as Presupuesto['estado'][]).map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="notas">Notas Adicionales</Label><Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={4} disabled={isSaving}/></div>
            <p className="text-sm text-muted-foreground">Los servicios seleccionados se mantienen. Para modificarlos, crea un nuevo presupuesto o espera a futuras funcionalidades de edición detallada de ítems.</p>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
