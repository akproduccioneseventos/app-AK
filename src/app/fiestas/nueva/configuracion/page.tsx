
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, Save, Settings2, Loader2, AlertTriangle, UserCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { TipoEvento } from '@/types/presupuesto';
import type { ConfigEventoDataStorage } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import { getFiestaActual, updateConfiguracionFiestaActual } from '@/app/actions/fiesta-actual';
import { initialFiestaActualData } from '@/lib/fiesta-defaults'; // Updated import
import { getCustomers, getCustomerById } from '@/app/actions/customers';
import { Separator } from '@/components/ui/separator';


interface ConfigFormState extends Omit<ConfigEventoDataStorage, 'fechaEvento' | 'clienteId'> {
  fechaEvento?: Date;
  clienteId?: string;
}

const tiposEventoDisponibles: TipoEvento[] = ['Cumpleaños', 'Boda', 'Fiesta de 15', 'Fiesta Infantil', 'Baby Shower', 'Evento Corporativo', 'Conferencia', 'Lanzamiento de Producto', 'Salón de Fiesta'];
const defaultEventConfigFromFiesta = initialFiestaActualData.configuracion;

export default function ConfiguracionEventoPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ConfigFormState | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingCustomers(true);
    setLinkedCustomer(null);
    try {
      const [fiesta, fetchedCustomers] = await Promise.all([
        getFiestaActual(),
        getCustomers()
      ]);

      setAllCustomers(fetchedCustomers);

      if (fiesta && fiesta.configuracion) {
        const currentClienteId = fiesta.configuracion.clienteId;
        let tempConfig: ConfigFormState = {
          ...fiesta.configuracion,
          fechaEvento: fiesta.configuracion.fechaEvento ? new Date(fiesta.configuracion.fechaEvento) : undefined,
          clienteId: currentClienteId,
        };
        
        if (currentClienteId) {
          const customerDetails = fetchedCustomers.find(c => c.id === currentClienteId);
          if (customerDetails) {
            setLinkedCustomer(customerDetails);
            // Populate from customer
            tempConfig.nombreEvento = customerDetails.name || customerDetails.companyName || tempConfig.nombreEvento;
            tempConfig.tipoCelebracion = customerDetails.partyType || tempConfig.tipoCelebracion;
            tempConfig.fechaEvento = customerDetails.partyDate ? new Date(customerDetails.partyDate) : tempConfig.fechaEvento;
            tempConfig.horaInicio = customerDetails.partyTime || tempConfig.horaInicio;
            tempConfig.invitadosEstimados = customerDetails.guestCount !== undefined ? Number(customerDetails.guestCount) : (typeof tempConfig.invitadosEstimados === 'string' ? parseInt(tempConfig.invitadosEstimados) : tempConfig.invitadosEstimados);
            tempConfig.nombreLugar = customerDetails.venueName || tempConfig.nombreLugar;
          }
        }
        setConfig(tempConfig);
      } else {
        toast({ title: 'Error', description: 'No se pudo cargar la configuración inicial.', variant: 'destructive' });
         setConfig({
            ...defaultEventConfigFromFiesta,
             fechaEvento: defaultEventConfigFromFiesta.fechaEvento ? new Date(defaultEventConfigFromFiesta.fechaEvento) : undefined,
            clienteId: undefined,
         });
      }
    } catch (error) {
      console.error("Error loading event configuration or customers:", error);
      toast({ title: 'Error al Cargar', description: 'No se pudo obtener la configuración del evento o los clientes.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsLoadingCustomers(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  const handleChange = (field: keyof ConfigFormState, value: any) => {
    setConfig(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleDateChange = (date?: Date) => {
    handleChange('fechaEvento', date);
  };
  
  const handleTipoEventoChange = (value: string) => {
    if (config) { 
      if (value === "Otro") {
        handleChange('tipoCelebracion', ''); 
      } else {
        handleChange('tipoCelebracion', value as TipoEvento);
      }
    }
  };
  
  const handleClienteChange = async (newClienteIdValue: string) => {
    const newClienteId = newClienteIdValue === "ninguno" || newClienteIdValue === "" ? undefined : newClienteIdValue;
    
    setConfig(prevConfig => {
      if (!prevConfig) return null;
      // Start with previous config to retain non-synced fields like horaFin, notasAdicionales, presupuestoEstimado
      let updatedConfig = { ...prevConfig, clienteId: newClienteId };

      if (newClienteId) {
        const customerDetails = allCustomers.find(c => c.id === newClienteId);
        setLinkedCustomer(customerDetails || null);
        if (customerDetails) {
          updatedConfig.nombreEvento = customerDetails.name || customerDetails.companyName || defaultEventConfigFromFiesta.nombreEvento;
          updatedConfig.tipoCelebracion = customerDetails.partyType || defaultEventConfigFromFiesta.tipoCelebracion;
          updatedConfig.fechaEvento = customerDetails.partyDate ? new Date(customerDetails.partyDate) : (defaultEventConfigFromFiesta.fechaEvento ? new Date(defaultEventConfigFromFiesta.fechaEvento) : undefined);
          updatedConfig.horaInicio = customerDetails.partyTime || defaultEventConfigFromFiesta.horaInicio;
          const guestCountFromCustomer = customerDetails.guestCount !== undefined ? Number(customerDetails.guestCount) : defaultEventConfigFromFiesta.invitadosEstimados;
          updatedConfig.invitadosEstimados = guestCountFromCustomer;
          updatedConfig.nombreLugar = customerDetails.venueName || defaultEventConfigFromFiesta.nombreLugar;
        }
      } else {
        setLinkedCustomer(null);
        // Reset synced fields to defaults from initialFiestaActualData.configuracion
        updatedConfig.nombreEvento = defaultEventConfigFromFiesta.nombreEvento;
        updatedConfig.tipoCelebracion = defaultEventConfigFromFiesta.tipoCelebracion;
        updatedConfig.fechaEvento = defaultEventConfigFromFiesta.fechaEvento ? new Date(defaultEventConfigFromFiesta.fechaEvento) : undefined;
        updatedConfig.horaInicio = defaultEventConfigFromFiesta.horaInicio;
        updatedConfig.invitadosEstimados = defaultEventConfigFromFiesta.invitadosEstimados;
        updatedConfig.nombreLugar = defaultEventConfigFromFiesta.nombreLugar;
      }
      return updatedConfig;
    });
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!config) {
      toast({ title: "Error", description: "No hay datos de configuración para guardar.", variant: "destructive" });
      return;
    }
    if (!config.nombreEvento.trim()) {
        toast({ title: "Nombre Requerido", description: "El nombre del evento no puede estar vacío.", variant: "destructive"});
        return;
    }
    if (!config.clienteId) {
        toast({ title: "Cliente Requerido", description: "Debe seleccionar un cliente para la fiesta.", variant: "destructive"});
        return;
    }
     if (!config.tipoCelebracion?.trim()) {
        toast({ title: "Tipo de Celebración Requerido", variant: "destructive" }); return;
    }
    if (!config.fechaEvento) {
        toast({ title: "Fecha del Evento Requerida", variant: "destructive" }); return;
    }
    if (!config.horaInicio?.trim()) {
        toast({ title: "Hora de Inicio Requerida", variant: "destructive" }); return;
    }
    if (!config.nombreLugar?.trim()) {
        toast({ title: "Lugar del Evento Requerido", variant: "destructive" }); return;
    }
    const invitadosEstimadosNum = Number(config.invitadosEstimados);
    if (isNaN(invitadosEstimadosNum) || invitadosEstimadosNum <= 0) {
        toast({ title: "Invitados Estimados Requerido", description:"Debe ser un número positivo.", variant: "destructive" }); return;
    }


    setIsSaving(true);
    const configToSave: ConfigEventoDataStorage = {
      ...(config as Omit<ConfigEventoDataStorage, 'fechaEvento' | 'clienteId' | 'invitadosEstimados' | 'presupuestoEstimado'> & { fechaEvento?: string, clienteId?: string}),
      fechaEvento: config.fechaEvento ? config.fechaEvento.toISOString() : undefined,
      clienteId: config.clienteId || undefined,
      invitadosEstimados: Number(config.invitadosEstimados) || 0,
      presupuestoEstimado: Number(config.presupuestoEstimado) || 0,
    };
    
    if (!configToSave.clienteId) delete configToSave.clienteId;

    try {
      const result = await updateConfiguracionFiestaActual(configToSave);
      if (result.success && result.updatedData) {
        toast({
          title: "¡Configuración Guardada!",
          description: "Los detalles generales del evento se han actualizado.",
        });
        const updatedConfigFromServer = {
            ...result.updatedData,
            fechaEvento: result.updatedData.fechaEvento ? new Date(result.updatedData.fechaEvento) : undefined,
            clienteId: result.updatedData.clienteId || undefined,
            invitadosEstimados: Number(result.updatedData.invitadosEstimados) || 0,
            presupuestoEstimado: Number(result.updatedData.presupuestoEstimado) || 0,
        };
        setConfig(updatedConfigFromServer);
        if (updatedConfigFromServer.clienteId) {
          const customerDetails = await getCustomerById(updatedConfigFromServer.clienteId);
          setLinkedCustomer(customerDetails);
        } else {
          setLinkedCustomer(null);
        }
      } else {
        throw new Error(result.error || "Error desconocido al guardar la configuración.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando configuración...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al Cargar Configuración</h2>
        <p className="text-muted-foreground">No se pudieron cargar los datos. Por favor, intentá de nuevo más tarde.</p>
         <Button onClick={() => window.location.reload()} className="mt-4">Recargar Página</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Configuración General del Evento
        </h1>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings2 className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-xl">Detalles Clave de tu Evento</CardTitle>
                <CardDescription>Asocia un cliente y establece la información fundamental. La información del cliente se usará para autocompletar los campos.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="cliente-principal" className="text-base">Cliente Principal del Evento *</Label>
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
                        <SelectItem value="ninguno" className="text-base text-muted-foreground">Ninguno asignado / Crear Nuevo</SelectItem>
                        {allCustomers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id} className="text-base">
                            {customer.companyName || customer.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <Link href="/customers/new?redirectTo=/fiestas/nueva/configuracion" passHref>
                        <Button type="button" variant="outline" size="icon" title="Crear Nuevo Cliente">
                            <UserCircle className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
                {allCustomers.length === 0 && !isLoadingCustomers && (
                    <p className="text-xs text-muted-foreground">No hay clientes creados. <Link href="/customers/new?redirectTo=/fiestas/nueva/configuracion" className="underline text-primary">Crear nuevo cliente</Link>.</p>
                 )}
                 {linkedCustomer && (
                    <div className="mt-3 p-3 border rounded-md bg-muted/10 space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Archivos del Cliente:</h4>
                        <div className="flex flex-wrap gap-2">
                            {linkedCustomer.contractFileName && (
                            <a 
                                href={`/api/contracts/${linkedCustomer.contractFileName}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <Button type="button" variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-2"/>
                                Ver/Descargar Contrato
                                </Button>
                            </a>
                            )}
                             {linkedCustomer.budgetFileName && (
                            <a 
                                href={`/api/budgets/${linkedCustomer.budgetFileName}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <Button type="button" variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-2"/>
                                Ver/Descargar Presupuesto
                                </Button>
                            </a>
                            )}
                            {!linkedCustomer.contractFileName && !linkedCustomer.budgetFileName && (
                                <p className="text-xs text-muted-foreground italic">No hay archivos PDF asociados a este cliente.</p>
                            )}
                        </div>
                    </div>
                 )}
              </div>

            <Separator />

            <div className="space-y-2">
                <Label htmlFor="nombre-evento" className="text-base">Nombre del Evento *</Label>
                <Input
                  id="nombre-evento"
                  value={config.nombreEvento || ''}
                  onChange={(e) => handleChange('nombreEvento', e.target.value)}
                  placeholder="Ej: Boda Ana y Juan, Mi Cumpleaños N°30"
                  className="text-base p-3"
                  required
                  disabled={isSaving}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="tipo-celebracion" className="text-base">Tipo de Celebración *</Label>
                 <Select 
                    value={tiposEventoDisponibles.includes(config.tipoCelebracion as TipoEvento) ? config.tipoCelebracion : "Otro"}
                    onValueChange={handleTipoEventoChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="tipo-celebracion" className="text-base p-3 h-auto">
                      <SelectValue placeholder="Seleccioná un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEventoDisponibles.map(tipo => (
                        <SelectItem key={tipo} value={tipo} className="text-base">{tipo}</SelectItem>
                      ))}
                      <SelectItem value="Otro" className="text-base">Otro (especificar)</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!tiposEventoDisponibles.includes(config.tipoCelebracion as TipoEvento) && config.tipoCelebracion !== 'Otro' && config.tipoCelebracion !== '') && (
                     <Input 
                        id="eventoTipoOtro" 
                        placeholder="Especificá el tipo de evento" 
                        value={config.tipoCelebracion !== "Otro" ? config.tipoCelebracion : ""}
                        onChange={(e) => handleChange('tipoCelebracion', e.target.value)}
                        className="text-base p-3 mt-2"
                        disabled={isSaving}
                        required
                    />
                  )}
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="fecha-evento" className="text-base">Fecha del Evento *</Label>
                <DatePickerDemo selectedDate={config.fechaEvento} onDateChange={handleDateChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora-inicio" className="text-base">Hora de Inicio *</Label>
                <Input
                  id="hora-inicio"
                  type="time"
                  value={config.horaInicio || ''}
                  onChange={(e) => handleChange('horaInicio', e.target.value)}
                  className="text-base p-3"
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora-fin" className="text-base">Hora de Fin (Opcional)</Label>
                <Input
                  id="hora-fin"
                  type="time"
                  value={config.horaFin || ''}
                  onChange={(e) => handleChange('horaFin', e.target.value)}
                  className="text-base p-3"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre-lugar" className="text-base">Lugar del Evento (Nombre) *</Label>
              <Input
                id="nombre-lugar"
                value={config.nombreLugar || ''}
                onChange={(e) => handleChange('nombreLugar', e.target.value)}
                placeholder="Ej: Salón Paraíso, Finca Los Robles"
                className="text-base p-3"
                disabled={isSaving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion-lugar" className="text-base">Dirección del Lugar</Label>
              <Textarea
                id="direccion-lugar"
                value={config.direccionLugar || ''}
                onChange={(e) => handleChange('direccionLugar', e.target.value)}
                placeholder="Ej: Calle Falsa 123, Ciudad, Provincia"
                rows={2}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="invitados-estimados" className="text-base">Nº Estimado de Invitados *</Label>
                    <Input
                    id="invitados-estimados"
                    type="number"
                    value={config.invitadosEstimados === undefined || config.invitadosEstimados === null ? '' : String(config.invitadosEstimados)}
                    onChange={(e) => handleChange('invitadosEstimados', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="Ej: 100"
                    min="1"
                    className="text-base p-3"
                    disabled={isSaving}
                    required
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="presupuesto-estimado" className="text-base">Presupuesto Total Estimado (UYU)</Label>
                    <Input
                    id="presupuesto-estimado"
                    type="number"
                    value={config.presupuestoEstimado === undefined || config.presupuestoEstimado === null ? '' : String(config.presupuestoEstimado)}
                    onChange={(e) => handleChange('presupuestoEstimado', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Ej: 500000"
                    min="0"
                    step="any"
                    className="text-base p-3"
                    disabled={isSaving}
                    />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas-adicionales-config" className="text-base">Notas Adicionales</Label>
              <Textarea
                id="notas-adicionales-config"
                value={config.notasAdicionales || ''}
                onChange={(e) => handleChange('notasAdicionales', e.target.value)}
                placeholder="Cualquier otro detalle importante para la configuración general."
                rows={3}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoadingCustomers || !config.clienteId}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
