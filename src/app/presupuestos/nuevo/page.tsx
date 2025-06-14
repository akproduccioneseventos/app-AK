
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, ClipboardCopy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import Paso1DatosEvento from '@/components/presupuestos/paso-1-datos-evento';
// Paso2Menu ya no se importa
import Paso3Servicios from '@/components/presupuestos/paso-3-servicios';
import Paso4Resumen from '@/components/presupuestos/paso-4-resumen';

import type { PresupuestoFormData, PlatoPresupuesto, ServicioAdicional, Presupuesto } from '@/types/presupuesto';
import { getPlatos, savePresupuesto } from '@/app/actions/presupuestos'; 
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import type { ConfigEventoDataStorage } from '@/types/fiesta';

const TOTAL_PASOS = 3; 

const serviciosDisponiblesMock: ServicioAdicional[] = [];


export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [formData, setFormData] = useState<PresupuestoFormData>({
    pasoActual: 1,
    clienteNombre: '',
    eventoTipo: 'Cumpleaños', // Default
    eventoFecha: undefined,
    invitadosCantidad: null,
    salonFiestas: '', 
    nombreHomenajeado1: '', 
    nombreHomenajeado2: '', 
    nombreEmpresa: '', 
    platosDisponibles: [], 
    platosSeleccionadosIds: new Set(), 
    serviciosDisponibles: serviciosDisponiblesMock.map(s => ({...s, seleccionado: false })),
    serviciosSeleccionadosIds: new Set(),
    notas: '',
  });

  useEffect(() => {
    async function cargarDatosIniciales() {
      setIsLoadingInitialData(true);
      try {
        // getPlatos sigue siendo llamado por si en el futuro se re-habilita el paso de menú
        const [platos, fiestaActualData] = await Promise.all([
          getPlatos(),
          getFiestaActual()
        ]);

        setFormData(prev => {
          let newClienteNombre = prev.clienteNombre;
          let newEventoTipo = prev.eventoTipo;
          let newEventoFecha = prev.eventoFecha;
          let newInvitadosCantidad = prev.invitadosCantidad;
          let newSalonFiestas = prev.salonFiestas;
          let newNombreHomenajeado1 = prev.nombreHomenajeado1;
          // nombreHomenajeado2 y nombreEmpresa no se prellenan desde fiestaActual por ahora.

          if (fiestaActualData && fiestaActualData.configuracion) {
            const config = fiestaActualData.configuracion;
            if (!prev.clienteNombre && config.clienteId && config.nombreEvento) {
                newClienteNombre = config.nombreEvento; 
            } else if (!prev.clienteNombre && config.nombreEvento && config.nombreEvento !== "Mi Próximo Evento Increíble") {
                newClienteNombre = config.nombreEvento;
            }
            
            if (config.tipoCelebracion) { 
              newEventoTipo = config.tipoCelebracion;
              // Pre-fill homenajeado/empresa based on pre-filled tipoCelebracion
              if (config.tipoCelebracion !== 'Boda' && config.tipoCelebracion !== 'Evento corporativo' && config.nombreEvento && config.nombreEvento !== "Mi Próximo Evento Increíble") {
                  newNombreHomenajeado1 = config.nombreEvento;
              }
            }

            if (!prev.eventoFecha && config.fechaEvento) {
              try {
                newEventoFecha = new Date(config.fechaEvento);
              } catch (e) { console.error("Fecha de evento inválida en config:", config.fechaEvento); }
            }
            if (prev.invitadosCantidad === null && typeof config.invitadosEstimados === 'number' && config.invitadosEstimados > 0) {
              newInvitadosCantidad = config.invitadosEstimados;
            } else if (prev.invitadosCantidad === null && typeof config.invitadosEstimados === 'string' && parseInt(config.invitadosEstimados, 10) > 0) {
              newInvitadosCantidad = parseInt(config.invitadosEstimados, 10);
            }
            if (!prev.salonFiestas && config.nombreLugar) { 
                newSalonFiestas = config.nombreLugar;
            }
          }
          
          return { 
            ...prev, 
            platosDisponibles: platos.map(p => ({...p, seleccionado: false})),
            clienteNombre: newClienteNombre,
            eventoTipo: newEventoTipo,
            eventoFecha: newEventoFecha,
            invitadosCantidad: newInvitadosCantidad,
            salonFiestas: newSalonFiestas,
            nombreHomenajeado1: newNombreHomenajeado1,
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
    if (formData.pasoActual < TOTAL_PASOS) {
      if (formData.pasoActual === 1) {
        if (!formData.clienteNombre.trim()) { toast({ title: "Dato Requerido", description: "El nombre del cliente es obligatorio.", variant: "destructive" }); return;}
        if (!formData.eventoTipo.trim()) { toast({ title: "Dato Requerido", description: "El tipo de evento es obligatorio.", variant: "destructive" }); return;}
        if (!formData.eventoFecha) { toast({ title: "Dato Requerido", description: "La fecha del evento es obligatoria.", variant: "destructive" }); return;}
        if (!formData.invitadosCantidad || formData.invitadosCantidad <= 0) { toast({ title: "Dato Requerido", description: "La cantidad de invitados debe ser un número positivo.", variant: "destructive" }); return;}
        if (!formData.salonFiestas.trim()) { toast({ title: "Dato Requerido", description: "El salón de fiestas es obligatorio.", variant: "destructive" }); return;}

        if (formData.eventoTipo === 'Boda' && (!formData.nombreHomenajeado1?.trim() || !formData.nombreHomenajeado2?.trim())) {
            toast({ title: "Nombres Requeridos", description: "Para bodas, por favor ingresa el nombre de ambos novios.", variant: "destructive" });
            return;
        } else if (formData.eventoTipo === 'Evento corporativo' && !formData.nombreEmpresa?.trim()) {
            toast({ title: "Nombre de Empresa Requerido", description: "Para eventos corporativos, por favor ingresa el nombre de la empresa.", variant: "destructive" });
            return;
        } else if (formData.eventoTipo !== 'Boda' && formData.eventoTipo !== 'Evento corporativo' && !formData.nombreHomenajeado1?.trim()) {
             toast({ title: "Nombre del Homenajeado Requerido", description: "Por favor, ingresa el nombre del homenajeado/a.", variant: "destructive" });
            return;
        }
      }
      setFormData(prev => ({ ...prev, pasoActual: prev.pasoActual + 1 }));
    }
  };

  const handlePrev = () => {
    if (formData.pasoActual > 1) {
      setFormData(prev => ({ ...prev, pasoActual: prev.pasoActual - 1 }));
    }
  };
  
  const calcularResumen = useCallback((): Presupuesto | null => {
    if (!formData.clienteNombre || !formData.eventoTipo || !formData.eventoFecha || !formData.invitadosCantidad || !formData.salonFiestas) {
      return null;
    }

    const costoSubtotalPlatos = 0; 
    const platosFinales: Presupuesto['platosSeleccionados'] = []; 

    let costoSubtotalServicios = 0;
    const serviciosFinales = formData.serviciosDisponibles
      .filter(s => formData.serviciosSeleccionadosIds.has(s.id))
      .map(s => {
        costoSubtotalServicios += s.costo;
        return {
          idServicio: s.id,
          nombreServicio: s.nombre,
          costoServicio: s.costo,
        };
      });
    
    const costoTotalEstimado = costoSubtotalPlatos + costoSubtotalServicios;

    let notasCombinadas = formData.notas;
    if(formData.salonFiestas) notasCombinadas += `\nSalón: ${formData.salonFiestas}`;
    if(formData.eventoTipo === 'Boda' && formData.nombreHomenajeado1 && formData.nombreHomenajeado2) notasCombinadas += `\nNovios: ${formData.nombreHomenajeado1} y ${formData.nombreHomenajeado2}`;
    else if (formData.eventoTipo !== 'Boda' && formData.eventoTipo !== 'Evento corporativo' && formData.nombreHomenajeado1) notasCombinadas += `\nHomenajeado: ${formData.nombreHomenajeado1}`;
    if(formData.eventoTipo === 'Evento corporativo' && formData.nombreEmpresa) notasCombinadas += `\nEmpresa: ${formData.nombreEmpresa}`;


    return {
      id: `temp_${Date.now()}`, 
      clienteNombre: formData.clienteNombre,
      eventoTipo: formData.eventoTipo,
      eventoFecha: formData.eventoFecha.toISOString(),
      invitadosCantidad: formData.invitadosCantidad,
      platosSeleccionados: platosFinales,
      serviciosAdicionales: serviciosFinales,
      costoSubtotalPlatos,
      costoSubtotalServicios,
      costoTotalEstimado,
      timestamp: new Date().toISOString(),
      notas: notasCombinadas.trim(),
      estado: 'Borrador',
    };
  }, [
    formData.clienteNombre,
    formData.eventoTipo,
    formData.eventoFecha,
    formData.invitadosCantidad,
    formData.serviciosDisponibles, 
    formData.serviciosSeleccionadosIds,
    formData.notas,
    formData.salonFiestas,
    formData.nombreHomenajeado1,
    formData.nombreHomenajeado2,
    formData.nombreEmpresa
  ]);

  useEffect(() => {
    if (formData.pasoActual === TOTAL_PASOS) { 
      const resumenCalculado = calcularResumen(); 

      let comparableCalculado = null;
      if (resumenCalculado) {
        const { id, timestamp, ...rest } = resumenCalculado; 
        comparableCalculado = rest;
      }

      let comparableActual = null;
      if (formData.resumen) {
        const { id, timestamp, ...rest } = formData.resumen; 
        comparableActual = rest;
      }
      
      const strCalculado = JSON.stringify(comparableCalculado);
      const strActual = JSON.stringify(comparableActual);

      if (strCalculado !== strActual) {
        setFormData(prev => ({ ...prev, resumen: resumenCalculado ?? undefined }));
      }
    }
  }, [formData.pasoActual, calcularResumen, formData.resumen]);


  const handleSave = async () => {
    const resumen = calcularResumen(); 
    if (!resumen) {
      toast({ title: "Error", description: "Faltan datos para generar el resumen.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const {id, ...presupuestoParaGuardar} = resumen;
      const result = await savePresupuesto(presupuestoParaGuardar as Omit<Presupuesto, 'id' | 'estado' | 'invoiceId'>); 
      if (result.success && result.id) {
        toast({ title: "¡Presupuesto Guardado!", description: `El presupuesto para ${resumen.clienteNombre} ha sido guardado con éxito.` });
        router.push('/presupuestos'); 
      } else {
        throw new Error(result.error || "Error desconocido al guardar.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message || "No se pudo guardar el presupuesto.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const progreso = (formData.pasoActual / TOTAL_PASOS) * 100;

  const renderPaso = () => {
    if (isLoadingInitialData && formData.pasoActual === 1) {
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
        return <Paso3Servicios formData={formData} setFormData={setFormData} />;
      case 3: 
        return <Paso4Resumen presupuesto={formData.resumen} formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  const titulosPasos = [
    "Datos Generales del Evento",
    "Servicios Adicionales",
    "Resumen y Notas del Presupuesto"
  ];
  const descripcionesPasos = [
    "Completá la información básica de tu evento.",
    "Añadí servicios opcionales para complementar tu fiesta.",
    "Revisá todos los detalles, añadí notas y el costo final estimado."
  ];


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
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          {formData.pasoActual < TOTAL_PASOS && (
            <Button onClick={handleNext} disabled={isSaving || isLoadingInitialData} className="w-full sm:w-auto">
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {formData.pasoActual === TOTAL_PASOS && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={handleSave} disabled={isSaving || isLoadingInitialData || !formData.resumen} className="w-full sm:w-auto order-last sm:order-first">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isSaving ? 'Guardando...' : 'Guardar Presupuesto'}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

