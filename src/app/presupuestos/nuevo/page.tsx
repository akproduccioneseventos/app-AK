
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, ClipboardCopy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import Paso1DatosEvento from '@/components/presupuestos/paso-1-datos-evento';
import Paso2Menu from '@/components/presupuestos/paso-2-menu';
import Paso3Servicios from '@/components/presupuestos/paso-3-servicios';
import Paso4Resumen from '@/components/presupuestos/paso-4-resumen';

import type { PresupuestoFormData, PlatoPresupuesto, ServicioAdicional, Presupuesto } from '@/types/presupuesto';
import { getPlatos, savePresupuesto } from '@/app/actions/presupuestos'; 
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import type { ConfigEventoDataStorage } from '@/types/fiesta';

const TOTAL_PASOS = 4;

const serviciosDisponiblesMock: ServicioAdicional[] = [
  { id: 'grab_video_hd', nombre: 'Grabación de Video (Full HD)', costo: 450, seleccionado: false },
  { id: 'grab_video_4k', nombre: 'Grabación de Video (4K)', costo: 650, seleccionado: false },
  { id: 'edit_video_pro', nombre: 'Edición de Video Profesional', costo: 300, seleccionado: false },
  { id: 'streaming_live', nombre: 'Streaming en Vivo para Eventos', costo: 550, seleccionado: false },
  { id: 'sonido_basico', nombre: 'Alquiler de Equipo de Sonido Básico', costo: 150, seleccionado: false },
  { id: 'sonido_completo', nombre: 'Alquiler de Equipo de Sonido Completo', costo: 350, seleccionado: false },
  { id: 'ilum_basica', nombre: 'Alquiler de Iluminación Básica', costo: 100, seleccionado: false },
  { id: 'ilum_pro', nombre: 'Alquiler de Iluminación Profesional', costo: 280, seleccionado: false },
  { id: 'foto_evento', nombre: 'Cobertura Fotográfica de Eventos', costo: 400, seleccionado: false },
  { id: 'foto_producto', nombre: 'Sesión Fotográfica de Producto', costo: 350, seleccionado: false },
  { id: 'video_corp', nombre: 'Video Corporativo / Institucional', costo: 700, seleccionado: false },
  { id: 'cobertura_completa', nombre: 'Cobertura Completa (Video y Foto)', costo: 900, seleccionado: false },
  { id: 'drone_servicio', nombre: 'Servicio de Drone (Video y Foto)', costo: 450, seleccionado: false },
  { id: 'motion_graphics', nombre: 'Creación de Motion Graphics', costo: 300, seleccionado: false },
  { id: 'diseno_grafico_evento', nombre: 'Diseño Gráfico para Eventos', costo: 200, seleccionado: false },
  { id: 'dj_sonido', nombre: 'DJ / Sonido para Eventos', costo: 400, seleccionado: false },
  { id: 'deco_tematica', nombre: 'Decoración Temática', costo: 500, seleccionado: false },
  { id: 'animacion_evento', nombre: 'Animación para Eventos', costo: 250, seleccionado: false },
  { id: 'pantalla_gigante', nombre: 'Pantalla Gigante y Proyector', costo: 180, seleccionado: false },
];


export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [formData, setFormData] = useState<PresupuestoFormData>({
    pasoActual: 1,
    clienteNombre: '',
    eventoTipo: 'Cumpleaños',
    eventoFecha: undefined,
    invitadosCantidad: null,
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
        const [platos, fiestaActual] = await Promise.all([
          getPlatos(),
          getFiestaActual()
        ]);

        setFormData(prev => {
          let newClienteNombre = prev.clienteNombre;
          let newEventoTipo = prev.eventoTipo;
          let newEventoFecha = prev.eventoFecha;
          let newInvitadosCantidad = prev.invitadosCantidad;

          if (fiestaActual && fiestaActual.configuracion) {
            const config = fiestaActual.configuracion;
            if (!prev.clienteNombre && config.nombreEvento) { // Solo pre-rellenar si está vacío
              newClienteNombre = config.nombreEvento; // Usamos el nombre del evento como posible nombre de cliente
            }
            if (prev.eventoTipo === 'Cumpleaños' && config.tipoCelebracion) { // Solo si es el default y hay config
              newEventoTipo = config.tipoCelebracion;
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
          }

          return { 
            ...prev, 
            platosDisponibles: platos.map(p => ({...p, seleccionado: false})),
            clienteNombre: newClienteNombre,
            eventoTipo: newEventoTipo,
            eventoFecha: newEventoFecha,
            invitadosCantidad: newInvitadosCantidad,
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
        if (!formData.clienteNombre || !formData.eventoTipo || !formData.eventoFecha || !formData.invitadosCantidad || formData.invitadosCantidad <= 0) {
          toast({ title: "Campos incompletos", description: "Por favor, completa todos los datos generales del evento.", variant: "destructive" });
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
    if (!formData.clienteNombre || !formData.eventoTipo || !formData.eventoFecha || !formData.invitadosCantidad) {
      return null;
    }

    let costoSubtotalPlatos = 0;
    const platosFinales = formData.platosDisponibles
      .filter(p => formData.platosSeleccionadosIds.has(p.id))
      .map(p => {
        const costoTotalPlato = p.costoPorPersona * (formData.invitadosCantidad || 0);
        costoSubtotalPlatos += costoTotalPlato;
        return {
          idPlato: p.id,
          nombrePlato: p.nombre,
          cantidad: formData.invitadosCantidad || 0,
          costoUnitario: p.costoPorPersona,
          costoTotalPlato: costoTotalPlato,
        };
      });

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

    // Los datos del vendor se añadirán en la acción savePresupuesto
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
      notas: formData.notas,
      estado: 'Borrador',
    };
  }, [formData]);

  useEffect(() => {
    if (formData.pasoActual === TOTAL_PASOS) {
      const resumenCalculado = calcularResumen();
      setFormData(prev => ({ ...prev, resumen: resumenCalculado ?? undefined }));
    }
  }, [formData.pasoActual, formData.platosSeleccionadosIds, formData.serviciosSeleccionadosIds, formData.invitadosCantidad, formData.notas, calcularResumen]);


  const handleSave = async () => {
    const resumen = calcularResumen();
    if (!resumen) {
      toast({ title: "Error", description: "Faltan datos para generar el resumen.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const {id, ...presupuestoParaGuardar} = resumen;
      const result = await savePresupuesto(presupuestoParaGuardar as Presupuesto);
      if (result.success) {
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
        return <Paso2Menu formData={formData} setFormData={setFormData} />;
      case 3:
        return <Paso3Servicios formData={formData} setFormData={setFormData} />;
      case 4:
        return <Paso4Resumen presupuesto={formData.resumen} formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  const titulosPasos = [
    "Datos Generales del Evento",
    "Selección de Menú y Platos",
    "Servicios Adicionales",
    "Resumen y Notas del Presupuesto"
  ];
  const descripcionesPasos = [
    "Completá la información básica de tu evento.",
    "Elegí los platos que formarán parte de tu menú.",
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

