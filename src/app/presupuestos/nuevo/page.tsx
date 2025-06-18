
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import Paso1DatosEvento from '@/components/presupuestos/paso-1-datos-evento';
import Paso2Servicios from '@/components/presupuestos/paso-2-servicios';
import Paso4Resumen from '@/components/presupuestos/paso-4-resumen'; // Paso3 is integrated into Paso4

import type { PresupuestoFormData, ItemPresupuestado, Presupuesto, TipoEvento } from '@/types/presupuesto';
import { savePresupuesto } from '@/app/actions/presupuestos';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';
import type { ServicioEmpresa } from '@/types/empresa';

const TOTAL_PASOS = 3; // Step 1, Step 2, Step 3 (Resumen/Descuentos/Notas)

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);

  const [formData, setFormData] = useState<PresupuestoFormData>({
    pasoActual: 1,
    clienteNombre: '',
    eventoTipo: '',
    eventoFecha: undefined,
    invitadosCantidad: null,
    salonFiestas: '',
    nombreEmpresa: '',
    protagonista1Nombre: '',
    protagonista2Nombre: '',
    serviciosSeleccionados: new Map(),
    nombrePromocion: '',
    descuentoTipo: undefined,
    descuentoValor: '',
    vigenciaPromocion: '',
    notas: '',
  });

  useEffect(() => {
    async function cargarDatosIniciales() {
      setIsLoadingInitialData(true);
      try {
        const { getServiciosEmpresa } = await import('@/app/actions/servicios-empresa');
        const [fetchedServiciosCatalogo, fiestaActualData] = await Promise.all([
          getServiciosEmpresa(),
          getFiestaActual()
        ]);
        setServiciosCatalogo(fetchedServiciosCatalogo);

        setFormData(prev => {
          let newClienteNombre = prev.clienteNombre;
          let newEventoTipo = prev.eventoTipo;
          let newEventoFecha = prev.eventoFecha;
          let newInvitadosCantidad = prev.invitadosCantidad;
          let newSalonFiestas = prev.salonFiestas;
          let newProtagonista1 = prev.protagonista1Nombre;
          let newProtagonista2 = prev.protagonista2Nombre;
          let newNombreEmpresa = prev.nombreEmpresa;

          if (fiestaActualData && fiestaActualData.configuracion) {
            const config = fiestaActualData.configuracion;
            if (!prev.clienteNombre && config.clienteId && config.nombreEvento && config.nombreEvento !== "Mi Próximo Evento Increíble") {
                newClienteNombre = config.nombreEvento; // Default to event name if client is linked
            }
             if (config.tipoCelebracion) {
              if (ALL_TIPOS_EVENTO.includes(config.tipoCelebracion as TipoEvento)) {
                newEventoTipo = config.tipoCelebracion as TipoEvento;
              } else {
                newEventoTipo = config.tipoCelebracion; // If it's a custom string
              }
              // Clear conditional fields when event type is sourced from fiestaActual
              newProtagonista1 = ''; newProtagonista2 = ''; newNombreEmpresa = '';
              if (newEventoTipo === 'Evento corporativo' && config.nombreEvento) {
                 newNombreEmpresa = config.nombreEvento;
              }
            }
            if (!prev.eventoFecha && config.fechaEvento) {
              try { newEventoFecha = new Date(config.fechaEvento); } catch (e) { /* ignore invalid date */ }
            }
            const invitadosEst = typeof config.invitadosEstimados === 'string' ? parseInt(config.invitadosEstimados, 10) : config.invitadosEstimados;
            if (prev.invitadosCantidad === null && typeof invitadosEst === 'number' && invitadosEst > 0) {
              newInvitadosCantidad = invitadosEst;
            }
            if (!prev.salonFiestas && config.nombreLugar) {
                newSalonFiestas = config.nombreLugar;
            }
          }
          return {
            ...prev,
            clienteNombre: newClienteNombre,
            eventoTipo: newEventoTipo,
            eventoFecha: newEventoFecha,
            invitadosCantidad: newInvitadosCantidad,
            salonFiestas: newSalonFiestas,
            nombreEmpresa: newNombreEmpresa,
            protagonista1Nombre: newProtagonista1,
            protagonista2Nombre: newProtagonista2,
          };
        });
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        toast({ title: "Error", description: "No se pudieron cargar los datos iniciales para el presupuesto.", variant: "destructive" });
      } finally {
        setIsLoadingInitialData(false);
      }
    }
    cargarDatosIniciales();
  }, [toast]);

  const handleNext = () => {
    if (formData.pasoActual === 1) {
      if (!formData.clienteNombre.trim()) {
        toast({ title: "Dato Requerido", description: "Por favor, ingresa el nombre del cliente.", variant: "destructive" }); return;
      }
      if (!formData.eventoTipo.trim()) {
        toast({ title: "Dato Requerido", description: "Por favor, selecciona o especifica el tipo de evento.", variant: "destructive" }); return;
      }
       if (!formData.salonFiestas.trim()) {
        toast({ title: "Dato Requerido", description: "Por favor, ingresa el salón de fiestas.", variant: "destructive" }); return;
      }
      if (!formData.eventoFecha) {
        toast({ title: "Dato Requerido", description: "Por favor, selecciona la fecha del evento.", variant: "destructive" }); return;
      }
      if (formData.invitadosCantidad === null || formData.invitadosCantidad <= 0) {
        toast({ title: "Dato Requerido", description: "La cantidad de invitados debe ser mayor a cero.", variant: "destructive" }); return;
      }
    }
    // Add validation for Step 2 if needed before proceeding to Step 3
    if (formData.pasoActual === 2 && formData.serviciosSeleccionados.size === 0) {
        // Optionally allow empty services or show a warning
        // toast({ title: "Sin Servicios", description: "No has seleccionado ningún servicio. Puedes continuar si es un presupuesto base.", variant: "info" });
    }
    if (formData.pasoActual < TOTAL_PASOS) {
      setFormData(prev => ({ ...prev, pasoActual: prev.pasoActual + 1 }));
    }
  };

  const handlePrev = () => {
    if (formData.pasoActual > 1) {
      setFormData(prev => ({ ...prev, pasoActual: prev.pasoActual - 1 }));
    }
  };
  
  // This function will be called directly when needed (for Resumen display and for saving)
  const calcularPresupuestoActual = (currentFormData: PresupuestoFormData): Presupuesto | null => {
    const clienteNombreFinal = currentFormData.clienteNombre.trim() || "Cliente sin especificar";
    const tipoEventoFinal = currentFormData.eventoTipo.trim() || "Evento General";
    const fechaEventoFinal = currentFormData.eventoFecha ? currentFormData.eventoFecha.toISOString() : new Date().toISOString();
    const invitadosFinal = currentFormData.invitadosCantidad || 1;
    const salonFiestasFinal = currentFormData.salonFiestas.trim() || "(Salón pendiente)";

    const itemsPresupuestadosFinales: ItemPresupuestado[] = [];
    let costoTotalSinDescuento = 0;

    currentFormData.serviciosSeleccionados.forEach((servicioInfo, servicioId) => {
      const costoTotalItem = servicioInfo.cantidad * servicioInfo.precioUnitarioPresupuesto;
      itemsPresupuestadosFinales.push({
        idServicioCatalogo: servicioId,
        nombreServicio: servicioInfo.nombreServicio,
        descripcionServicio: undefined, 
        cantidad: servicioInfo.cantidad,
        unidad: servicioInfo.unidad,
        precioUnitario: servicioInfo.precioUnitarioPresupuesto,
        costoTotalItem: costoTotalItem,
        categoriaServicio: servicioInfo.categoriaServicio,
      });
      costoTotalSinDescuento += costoTotalItem;
    });

    let costoTotalEstimadoConDescuento = costoTotalSinDescuento;
    let descuentoAplicado = 0;
    const descuentoValorNum = parseFloat(currentFormData.descuentoValor || '0');

    if (currentFormData.descuentoTipo && descuentoValorNum > 0) {
      if (currentFormData.descuentoTipo === 'porcentaje') {
        descuentoAplicado = (costoTotalSinDescuento * descuentoValorNum) / 100;
      } else {
        descuentoAplicado = descuentoValorNum;
      }
      costoTotalEstimadoConDescuento = costoTotalSinDescuento - descuentoAplicado;
    }
    
    let notasCombinadas = currentFormData.notas || '';
    notasCombinadas += `\nSalón: ${salonFiestasFinal}`;
    let protagonistasTexto = '';
    if (tipoEventoFinal === 'Boda') {
      if (currentFormData.protagonista1Nombre && currentFormData.protagonista2Nombre) protagonistasTexto = `Boda de ${currentFormData.protagonista1Nombre} y ${currentFormData.protagonista2Nombre}.`;
      else if (currentFormData.protagonista1Nombre) protagonistasTexto = `Boda de ${currentFormData.protagonista1Nombre}.`;
    } else if (tipoEventoFinal === 'Evento corporativo') {
        protagonistasTexto = `Evento para empresa: ${currentFormData.nombreEmpresa || currentFormData.protagonista1Nombre || 'No especificada'}.`;
    } else if (currentFormData.protagonista1Nombre) {
      protagonistasTexto = `Evento para ${currentFormData.protagonista1Nombre}.`;
    }
    if(protagonistasTexto) notasCombinadas += `\n${protagonistasTexto}`;


    return {
      id: `temp_${Date.now()}`,
      clienteNombre: clienteNombreFinal,
      eventoTipo: tipoEventoFinal,
      eventoFecha: fechaEventoFinal,
      invitadosCantidad: invitadosFinal,
      salonFiestas: salonFiestasFinal,
      protagonista1Nombre: currentFormData.protagonista1Nombre?.trim() || undefined,
      protagonista2Nombre: currentFormData.protagonista2Nombre?.trim() || undefined,
      nombreEmpresa: currentFormData.nombreEmpresa?.trim() || undefined,
      itemsPresupuestados: itemsPresupuestadosFinales,
      costoTotalEstimado: costoTotalSinDescuento,
      nombrePromocion: currentFormData.nombrePromocion?.trim() || undefined,
      descuentoTipo: currentFormData.descuentoTipo,
      descuentoValor: descuentoValorNum > 0 ? descuentoValorNum : undefined,
      totalConDescuento: descuentoAplicado > 0 ? costoTotalEstimadoConDescuento : undefined,
      vigenciaPromocion: currentFormData.vigenciaPromocion?.trim() || undefined,
      timestamp: new Date().toISOString(),
      notas: notasCombinadas.trim(),
      estado: 'Borrador',
    };
  };


  const handleSave = async () => {
    const presupuestoParaGuardar = calcularPresupuestoActual(formData);
    if (!presupuestoParaGuardar) {
      toast({ title: "Error", description: "No se pudo generar el resumen. Revisa los datos.", variant: "destructive" });
      return;
    }
     if (!presupuestoParaGuardar.clienteNombre.trim() || presupuestoParaGuardar.clienteNombre === "Cliente sin especificar") {
        toast({ title: "Dato Requerido", description: "El nombre del cliente es necesario.", variant: "destructive" }); return;
    }
    if (!presupuestoParaGuardar.eventoTipo.trim() || presupuestoParaGuardar.eventoTipo === "Evento General") {
        toast({ title: "Dato Requerido", description: "El tipo de evento es necesario.", variant: "destructive" }); return;
    }
     if (!presupuestoParaGuardar.salonFiestas.trim() || presupuestoParaGuardar.salonFiestas === "(Salón pendiente)") {
      toast({ title: "Dato Requerido", description: "El salón de fiestas es necesario.", variant: "destructive" }); return;
    }
    if (presupuestoParaGuardar.invitadosCantidad <= 0) {
        toast({ title: "Dato Requerido", description: "La cantidad de invitados debe ser mayor a cero.", variant: "destructive" }); return;
    }
    if (presupuestoParaGuardar.itemsPresupuestados.length === 0) {
        toast({ title: "Sin Servicios", description: "Debes seleccionar al menos un servicio para el presupuesto.", variant: "destructive" }); return;
    }


    setIsSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {id, ...presupuestoSinId} = presupuestoParaGuardar;
      const result = await savePresupuesto(presupuestoSinId as Omit<Presupuesto, 'id' | 'estado' | 'invoiceId'>);
      if (result.success && result.id) {
        toast({ title: "¡Presupuesto Guardado!", description: `El presupuesto para ${presupuestoParaGuardar.clienteNombre} ha sido guardado.` });
        router.push('/presupuestos');
      } else {
        throw new Error(result.error || "Error desconocido al guardar.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message || "No se pudo guardar.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const progreso = (formData.pasoActual / TOTAL_PASOS) * 100;

  const titulosPasos = [
    "Datos Generales del Evento",
    "Selección de Servicios",
    "Resumen, Descuentos y Notas"
  ];
  const descripcionesPasos = [
    "Completá la información básica de tu evento.",
    "Elegí los servicios del catálogo de la empresa para este evento.",
    "Revisá los detalles, aplicá descuentos y añadí notas finales."
  ];

  const renderPaso = () => {
    if (isLoadingInitialData) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Cargando datos iniciales...</p>
        </div>
      );
    }
    switch (formData.pasoActual) {
      case 1:
        return <Paso1DatosEvento formData={formData} setFormData={setFormData} />;
      case 2:
        return <Paso2Servicios formData={formData} setFormData={setFormData} serviciosCatalogo={serviciosCatalogo} />;
      case 3:
        // Calcular el presupuesto actual para pasar al resumen
        const presupuestoCalculado = calcularPresupuestoActual(formData);
        return <Paso4Resumen presupuesto={presupuestoCalculado ?? undefined} formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-0">
      <Card className="shadow-xl overflow-hidden border-primary/20">
        <CardHeader className="bg-primary/10 p-6">
          <Progress value={progreso} className="w-full h-2 mb-4" />
          <CardTitle className="font-headline text-3xl text-primary">
            {titulosPasos[formData.pasoActual - 1]}
          </CardTitle>
          <CardDescription className="text-lg">
            {descripcionesPasos[formData.pasoActual - 1]} (Paso {formData.pasoActual} de {TOTAL_PASOS})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 min-h-[400px]">
          {renderPaso()}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-muted/50 border-t">
          <Button variant="outline" onClick={handlePrev} disabled={formData.pasoActual === 1 || isSaving || isLoadingInitialData} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
          </Button>
          {formData.pasoActual < TOTAL_PASOS ? (
            <Button onClick={handleNext} disabled={isSaving || isLoadingInitialData} className="w-full sm:w-auto">
              Siguiente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isSaving || isLoadingInitialData || !calcularPresupuestoActual(formData)} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Presupuesto'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
