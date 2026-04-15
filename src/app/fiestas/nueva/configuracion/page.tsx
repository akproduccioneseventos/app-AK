
'use client';

import { useState, type FormEvent, useEffect, useCallback, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, Save, Settings2, Loader2, AlertTriangle, UserCircle, FileText, RefreshCw, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { TipoEvento } from '@/types/presupuesto';
import type { ConfigEventoDataStorage } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Salon } from '@/types/salon';
import type { Presupuesto } from '@/types/presupuesto';
import { getFiestaById, updateConfiguracionFiestaActual, syncFiestaFromBudget, updateFiestaPresupuestoId } from '@/app/actions/fiesta-actual';
import { initialFiestaActualData } from '@/lib/fiesta-defaults'; 
import { getCustomers, getCustomerById, syncCustomerFromFiestaConfig } from '@/app/actions/customers';
import { getSalones } from '@/app/actions/salones';
import { Separator } from '@/components/ui/separator';
import { useSearchParams, useRouter } from 'next/navigation';
import { getPresupuestos, getPresupuestoById } from '@/app/actions/presupuestos';
import { useAutoSave } from '@/hooks/use-auto-save';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';

interface ConfigFormState extends Omit<ConfigEventoDataStorage, 'fechaEvento' | 'clienteId'> {
  fechaEvento?: Date;
  clienteId?: string;
}

const tiposEventoDisponibles: TipoEvento[] = ['Cumpleaños', 'Boda', 'XV años', 'Cumpleaños infantil', 'Evento corporativo', 'Otro'];
const defaultEventConfigFromFiesta = initialFiestaActualData.configuracion;

function ConfiguracionEventoContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');

  const [config, setConfig] = useState<ConfigFormState | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allSalones, setAllSalones] = useState<Salon[]>([]);
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  const [allPresupuestos, setAllPresupuestos] = useState<Presupuesto[]>([]);
  const [linkedPresupuestoId, setLinkedPresupuestoId] = useState<string | undefined>(undefined);
  const [isSyncingPresupuesto, setIsSyncingPresupuesto] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  const loadInitialData = useCallback(async () => {
    if (!fiestaId) {
      toast({title: "Error", description: "No se encontró el ID de evento", variant: "destructive"});
      router.replace('/eventos');
      return;
    }
    setIsLoading(true);
    setIsLoadingCustomers(true);
    setLinkedCustomer(null);
    try {
      const [fiesta, fetchedCustomers, fetchedSalones, fetchedPresupuestos] = await Promise.all([
        getFiestaById(fiestaId),
        getCustomers(),
        getSalones(),
        getPresupuestos(),
      ]);

      if (!fiesta) throw new Error("Evento no encontrado.");
      
      setAllCustomers(fetchedCustomers);
      setAllSalones(fetchedSalones);
      setAllPresupuestos(fetchedPresupuestos);
      setLinkedPresupuestoId(fiesta.presupuestoId || undefined);

      let tempConfig: ConfigFormState = {
        ...(fiesta.configuracion || defaultEventConfigFromFiesta),
        fechaEvento: (fiesta.configuracion?.fechaEvento) ? new Date(fiesta.configuracion.fechaEvento) : (defaultEventConfigFromFiesta.fechaEvento ? new Date(defaultEventConfigFromFiesta.fechaEvento) : undefined),
        clienteId: fiesta.configuracion?.clienteId || undefined,
      };

      // Intentar sincronizar con presupuesto si existe
      if (fiesta.presupuestoId) {
          const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
          if (presupuesto) {
              tempConfig.nombreEvento = tempConfig.nombreEvento || `${presupuesto.eventoTipo} de ${presupuesto.clienteNombre}`;
              tempConfig.tipoCelebracion = tempConfig.tipoCelebracion || presupuesto.eventoTipo;
              tempConfig.fechaEvento = tempConfig.fechaEvento || new Date(presupuesto.eventoFecha);
              tempConfig.invitadosEstimados = tempConfig.invitadosEstimados || presupuesto.invitadosCantidad;
              tempConfig.presupuestoEstimado = tempConfig.presupuestoEstimado || (presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado);
              tempConfig.nombreLugar = tempConfig.nombreLugar || presupuesto.salonFiestas;
          }
      }

      if (tempConfig.clienteId) {
        const customerDetails = fetchedCustomers.find(c => c.id === tempConfig.clienteId);
        if (customerDetails) {
          setLinkedCustomer(customerDetails);
        }
      }
      setConfig(tempConfig);

    } catch (error) {
      console.error("Error loading event configuration or customers:", error);
      toast({ title: 'Error al Cargar', description: 'No se pudo obtener la configuración del evento o los clientes.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsLoadingCustomers(false);
    }
  }, [toast, router, fiestaId]);
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const { isSaving, lastSaved, saveError, saveNow } = useAutoSave({
    data: config,
    onSave: async (cfg) => {
      if (!cfg || !fiestaId) return { success: false, error: 'No hay datos de configuración para guardar' };
      const configToSave: ConfigEventoDataStorage = {
        ...cfg,
        fechaEvento: cfg.fechaEvento ? cfg.fechaEvento.toISOString() : undefined,
        clienteId: cfg.clienteId || undefined,
        invitadosEstimados: Number(cfg.invitadosEstimados) || 0,
        presupuestoEstimado: Number(cfg.presupuestoEstimado) || 0,
      };
      const result = await updateConfiguracionFiestaActual(fiestaId, configToSave);
      if (result.success && cfg.clienteId) {
        await syncCustomerFromFiestaConfig(cfg.clienteId, configToSave).catch(() => {});
      }
      return result;
    },
    debounceMs: 2000,
    enabled: !!fiestaId && !isLoading && !!config,
  });

  const handleChange = (field: keyof ConfigFormState, value: any) => {
    setConfig(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleDateChange = (date?: Date) => {
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        toast({
          title: "⚠️ Fecha en el pasado",
          description: "La fecha seleccionada ya pasó. Por favor, elige una fecha futura para el evento.",
          variant: "destructive",
        });
        return;
      }
    }
    handleChange('fechaEvento', date);
  };
  
  const handleClienteChange = async (newClienteIdValue: string) => {
    const newClienteId = newClienteIdValue === "ninguno" || newClienteIdValue === "" ? undefined : newClienteIdValue;
    
    setConfig(prevConfig => {
      if (!prevConfig) return null;
      let updatedConfig = { ...prevConfig, clienteId: newClienteId };

      if (newClienteId) {
        const customerDetails = allCustomers.find(c => c.id === newClienteId);
        setLinkedCustomer(customerDetails || null);
        if (customerDetails) {
          updatedConfig.nombreEvento = customerDetails.name || customerDetails.companyName || defaultEventConfigFromFiesta.nombreEvento;
          updatedConfig.tipoCelebracion = customerDetails.partyType || defaultEventConfigFromFiesta.tipoCelebracion;
          updatedConfig.fechaEvento = customerDetails.partyDate ? new Date(customerDetails.partyDate) : updatedConfig.fechaEvento;
          updatedConfig.invitadosEstimados = customerDetails.guestCount || updatedConfig.invitadosEstimados;
          updatedConfig.nombreLugar = customerDetails.venueName || updatedConfig.nombreLugar;
        }
      } else {
        setLinkedCustomer(null);
      }
      return updatedConfig;
    });
  };

  const handleSalonChange = (salonId: string) => {
    if (!salonId || salonId === 'ninguno') return;
    const salon = allSalones.find((s) => s.id === salonId);
    if (!salon) return;
    setConfig((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        nombreLugar: salon.nombre,
        direccionLugar: salon.direccion,
        googleMapsUrl: salon.googleMapsUrl,
      };
    });
  };

  const handlePresupuestoChange = async (newPresupuestoIdValue: string) => {
    if (!fiestaId) return;
    const newPresupuestoId = newPresupuestoIdValue === 'ninguno' || newPresupuestoIdValue === '' ? null : newPresupuestoIdValue;
    setLinkedPresupuestoId(newPresupuestoId || undefined);
    const result = await updateFiestaPresupuestoId(fiestaId, newPresupuestoId);
    if (!result.success) {
      toast({ title: 'Error', description: result.error || 'No se pudo asociar el presupuesto.', variant: 'destructive' });
    } else {
      toast({ title: '✅ Presupuesto asociado', description: newPresupuestoId ? 'El presupuesto fue asociado al evento.' : 'Presupuesto desvinculado del evento.' });
    }
  };

  const handleSyncPresupuesto = async () => {
    if (!fiestaId || !linkedPresupuestoId) return;
    setIsSyncingPresupuesto(true);
    try {
      const result = await syncFiestaFromBudget(fiestaId);
      if (result.success) {
        toast({ title: '✅ Sincronizado', description: 'El evento fue sincronizado con el presupuesto.' });
        await loadInitialData();
      } else {
        toast({ title: 'Error al sincronizar', description: result.error || 'No se pudo sincronizar.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSyncingPresupuesto(false);
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!config || !fiestaId) return;

    // Validate date is not in the past
    if (config.fechaEvento) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (config.fechaEvento < today) {
        toast({
          title: "⚠️ Fecha inválida",
          description: "No se puede guardar un evento con fecha pasada. Por favor, selecciona una fecha futura.",
          variant: "destructive",
        });
        return;
      }
    }

    saveNow();
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando configuración...</p></div>;
  }
  
  if (!config) {
    return <div className="flex flex-col items-center justify-center min-h-[400px] text-center"><AlertTriangle className="w-12 h-12 text-destructive mb-4" /><h2 className="text-xl font-semibold mb-2">Error al Cargar Configuración</h2><Button onClick={() => window.location.reload()} className="mt-4">Recargar Página</Button></div>;
  }

  const handleSelectTipoEventoChange = (value: string) => {
    if (config) {
      const newTipoEvento = value === "Otro" ? "" : value as TipoEvento;
      handleChange('tipoCelebracion', newTipoEvento);
    }
  };
  
  const eventoTipoEnSelect =
    config.tipoCelebracion && tiposEventoDisponibles.includes(config.tipoCelebracion as TipoEvento)
      ? config.tipoCelebracion
      : (config.tipoCelebracion && config.tipoCelebracion.trim() !== "" ? "Otro" : "");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Configuración General del Evento
        </h1>
        <div className="flex items-center gap-3">
          <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} saveError={saveError} />
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
            <Button variant="outline" disabled={isSaving}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Planificador
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings2 className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-xl">Detalles Clave de tu Evento</CardTitle>
                <CardDescription>Asocia un cliente y establece la información fundamental. Los datos se pueden sincronizar con el presupuesto.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="cliente-principal" className="text-base">Cliente Principal del Evento</Label>
                <div className="flex items-center gap-2">
                    <Select
                        value={config.clienteId || "ninguno"}
                        onValueChange={handleClienteChange}
                        disabled={isSaving || isLoadingCustomers}
                    >
                        <SelectTrigger id="cliente-principal" className="text-base p-3 h-auto flex-grow">
                        <SelectValue placeholder={isLoadingCustomers ? "Cargando clientes..." : "Seleccionar cliente"} />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="ninguno" className="text-base text-muted-foreground">Ninguno asignado</SelectItem>
                        {allCustomers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id} className="text-base">
                            {customer.companyName || customer.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="sm" onClick={() => loadInitialData()} title="Recargar datos">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
              </div>

            <div className="space-y-2">
                <Label htmlFor="presupuesto-vinculado" className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Presupuesto Vinculado
                </Label>
                <div className="flex items-center gap-2">
                    <Select
                        value={linkedPresupuestoId || "ninguno"}
                        onValueChange={handlePresupuestoChange}
                        disabled={isSaving || isSyncingPresupuesto}
                    >
                        <SelectTrigger id="presupuesto-vinculado" className="text-base p-3 h-auto flex-grow">
                          <SelectValue placeholder="Sin presupuesto asociado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ninguno" className="text-base text-muted-foreground">Sin presupuesto asociado</SelectItem>
                          {allPresupuestos.map(p => (
                            <SelectItem key={p.id} value={p.id} className="text-base">
                              {p.clienteNombre} — {p.eventoTipo} ({p.eventoFecha?.substring(0, 10) ?? ''})
                            </SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                    {linkedPresupuestoId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSyncPresupuesto}
                        disabled={isSaving || isSyncingPresupuesto}
                        title="Sincronizar evento desde este presupuesto"
                      >
                        {isSyncingPresupuesto ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    )}
                </div>
                {linkedPresupuestoId && (
                  <p className="text-xs text-muted-foreground">Usá el botón de sincronizar para actualizar automáticamente los datos del evento desde el presupuesto.</p>
                )}
              </div>

            <Separator />

            <div className="space-y-2">
                <Label htmlFor="nombre-evento" className="text-base">Nombre del Evento</Label>
                <Input id="nombre-evento" value={config.nombreEvento || ''} onChange={(e) => handleChange('nombreEvento', e.target.value)} placeholder="Ej: Boda Ana y Juan" className="text-base p-3" disabled={isSaving}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="tipo-celebracion" className="text-base">Tipo de Celebración</Label>
                 <Select 
                    value={eventoTipoEnSelect}
                    onValueChange={handleSelectTipoEventoChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="tipo-celebracion" className="text-base p-3 h-auto"><SelectValue placeholder="Seleccioná un tipo" /></SelectTrigger>
                    <SelectContent>{tiposEventoDisponibles.map(tipo => (<SelectItem key={tipo} value={tipo} className="text-base">{tipo}</SelectItem>))}</SelectContent>
                  </Select>
                  {eventoTipoEnSelect === "Otro" && (
                     <Input 
                        id="eventoTipoOtroInput" 
                        placeholder="Especificá el tipo de evento" 
                        value={config.tipoCelebracion}
                        onChange={(e) => handleChange('tipoCelebracion', e.target.value)}
                        className="text-base p-3 mt-2"
                        disabled={isSaving}
                    />
                  )}
              </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-1"><Label htmlFor="fecha-evento" className="text-base">Fecha del Evento</Label><DatePickerDemo selectedDate={config.fechaEvento} onDateChange={handleDateChange} /></div>
              <div className="space-y-2"><Label htmlFor="hora-inicio" className="text-base">Hora de Inicio</Label><Input id="hora-inicio" type="time" value={config.horaInicio || ''} onChange={(e) => handleChange('horaInicio', e.target.value)} className="text-base p-3" disabled={isSaving}/></div>
              <div className="space-y-2"><Label htmlFor="hora-fin" className="text-base">Hora de Fin (Opcional)</Label><Input id="hora-fin" type="time" value={config.horaFin || ''} onChange={(e) => handleChange('horaFin', e.target.value)} className="text-base p-3" disabled={isSaving}/></div>
            </div>
            <div className="space-y-2"><Label htmlFor="nombre-lugar" className="text-base">Lugar del Evento (Nombre)</Label><Input id="nombre-lugar" value={config.nombreLugar || ''} onChange={(e) => handleChange('nombreLugar', e.target.value)} placeholder="Ej: Salón Paraíso" className="text-base p-3" disabled={isSaving}/></div>
            {allSalones.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" />Seleccionar Salón Guardado</Label>
                <Select onValueChange={handleSalonChange} disabled={isSaving}>
                  <SelectTrigger className="text-base p-3 h-auto">
                    <SelectValue placeholder="Elegir salón para auto-completar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allSalones.map((salon) => (
                      <SelectItem key={salon.id} value={salon.id} className="text-base">
                        {salon.nombre}{salon.capacidad > 0 ? ` (${salon.capacidad} pers.)` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Al seleccionar un salón se completarán automáticamente el nombre, dirección y Google Maps.</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="direccion-lugar" className="text-base">Dirección del Lugar</Label><Input id="direccion-lugar" value={config.direccionLugar || ''} onChange={(e) => handleChange('direccionLugar', e.target.value)} placeholder="Ej: Av. Libertador 1234, Montevideo" className="text-base p-3" disabled={isSaving}/></div>
              <div className="space-y-2"><Label htmlFor="google-maps-url" className="text-base">Link Google Maps</Label><Input id="google-maps-url" type="url" value={config.googleMapsUrl || ''} onChange={(e) => handleChange('googleMapsUrl', e.target.value)} placeholder="https://maps.google.com/..." className="text-base p-3" disabled={isSaving}/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="invitados-estimados" className="text-base">Nº Estimado de Invitados</Label><Input id="invitados-estimados" type="number" value={config.invitadosEstimados === undefined || config.invitadosEstimados === null ? '' : String(config.invitadosEstimados)} onChange={(e) => handleChange('invitadosEstimados', e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="Ej: 100" min="0" className="text-base p-3" disabled={isSaving}/></div>
                 <div className="space-y-2"><Label htmlFor="presupuesto-estimado" className="text-base">Presupuesto Total Pactado (UYU)</Label><Input id="presupuesto-estimado" type="number" value={config.presupuestoEstimado === undefined || config.presupuestoEstimado === null ? '' : String(config.presupuestoEstimado)} onChange={(e) => handleChange('presupuestoEstimado', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Ej: 500000" min="0" step="any" className="text-base p-3" disabled={isSaving}/></div>
            </div>
            <div className="space-y-2"><Label htmlFor="notas-adicionales-config" className="text-base">Notas Adicionales</Label><Textarea id="notas-adicionales-config" value={config.notesAdicionales || ''} onChange={(e) => handleChange('notesAdicionales', e.target.value)} placeholder="Cualquier otro detalle importante." rows={3} className="text-base p-3" disabled={isSaving}/></div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoadingCustomers}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default function ConfiguracionEventoPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <ConfiguracionEventoContent />
        </Suspense>
    );
}
