'use client';

import { useState, useEffect, useCallback, Suspense, useReducer } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Loader2, RotateCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import Paso1DatosEvento from '@/components/presupuestos/paso-1-datos-evento';
import Paso2Servicios from '@/components/presupuestos/paso-2-servicios';
import Paso4Resumen from '@/components/presupuestos/paso-4-resumen';

import type { PresupuestoFormData, ItemPresupuestado, Presupuesto, TipoEvento } from '@/types/presupuesto';
import { savePresupuesto } from '@/app/actions/presupuestos';
import type { ServicioEmpresa } from '@/types/empresa';
import type { BudgetDisplaySettings } from '@/types/settings';
import { getBudgetDisplaySettings } from '@/app/actions/settings';

const TOTAL_PASOS = 3;
const SESSION_STORAGE_KEY = 'presupuestoEnProgreso';

const initialFormData: PresupuestoFormData = {
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
};

function formStateInitializer(initialState: PresupuestoFormData): PresupuestoFormData {
    if (typeof window === 'undefined') {
        return initialState;
    }
    try {
        const storedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedState) {
            const parsed = JSON.parse(storedState);
            // Re-hydrate the Map from the stored array
            parsed.serviciosSeleccionados = new Map(parsed.serviciosSeleccionados);
            parsed.eventoFecha = parsed.eventoFecha ? new Date(parsed.eventoFecha) : undefined;
            return parsed;
        }
    } catch (error) {
        console.error("Failed to parse form state from sessionStorage", error);
    }
    return initialState;
}

function NuevoPresupuestoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  const [displaySettings, setDisplaySettings] = useState<BudgetDisplaySettings | null>(null);

  const [formData, setFormData] = useState<PresupuestoFormData>(() => formStateInitializer(initialFormData));

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          ...formData,
          serviciosSeleccionados: Array.from(formData.serviciosSeleccionados.entries())
      }));
    } catch (error) {
      console.warn("Could not save form state to sessionStorage", error);
    }
  }, [formData]);

  const handleReset = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setFormData(initialFormData);
    router.replace('/presupuestos/nuevo'); // Clear URL params too
    toast({ description: "El formulario del simulador ha sido reiniciado." });
  };


  useEffect(() => {
    async function cargarDatosIniciales() {
      setIsLoadingInitialData(true);
      try {
        const leadNameParam = searchParams.get('leadName');

        const [fetchedServiciosCatalogo, fetchedSettings] = await Promise.all([
          import('@/app/actions/servicios-empresa').then(mod => mod.getServiciosEmpresa()),
          getBudgetDisplaySettings()
        ]);
        
        setServiciosCatalogo(fetchedServiciosCatalogo);
        setDisplaySettings(fetchedSettings);
        
        if (leadNameParam && !sessionStorage.getItem(SESSION_STORAGE_KEY)) {
           setFormData(prev => ({...prev, clienteNombre: leadNameParam}));
        }
       
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        toast({ title: "Error", description: "No se pudieron cargar datos iniciales.", variant: "destructive" });
      } finally {
        setIsLoadingInitialData(false);
      }
    }
    cargarDatosIniciales();
  }, [toast, searchParams]);

  const handleNext = () => {
    if (formData.pasoActual === 1) {
      if (!formData.clienteNombre.trim()) { toast({ title: "Requerido", description: "Nombre del cliente.", variant: "destructive" }); return; }
      if (!formData.eventoTipo.trim()) { toast({ title: "Requerido", description: "Tipo de evento.", variant: "destructive" }); return; }
      if (!formData.salonFiestas.trim()) { toast({ title: "Requerido", description: "Salón de fiestas.", variant: "destructive" }); return; }
      if (!formData.eventoFecha) { toast({ title: "Requerido", description: "Fecha del evento.", variant: "destructive" }); return; }
      if (formData.invitadosCantidad === null || formData.invitadosCantidad <= 0) { toast({ title: "Requerido", description: "Cantidad de invitados > 0.", variant: "destructive" }); return; }
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

  const calcularPresupuestoDesdeForm = useCallback((currentFormData: PresupuestoFormData): Omit<Presupuesto, 'id' | 'estado' | 'invoiceId'> => {
    const itemsPresupuestados: ItemPresupuestado[] = [];
    let costoTotalSinDescuento = 0;

    currentFormData.serviciosSeleccionados.forEach((servicioInfo, servicioId) => {
      const costoTotalItem = servicioInfo.cantidad * servicioInfo.precioUnitarioPresupuesto;
      itemsPresupuestados.push({
        idServicioCatalogo: servicioId,
        nombreServicio: servicioInfo.nombreServicio,
        cantidad: servicioInfo.cantidad,
        unidad: servicioInfo.unidad,
        precioUnitario: servicioInfo.precioUnitarioPresupuesto,
        costoTotalItem: costoTotalItem,
        categoriaServicio: servicioInfo.categoriaServicio,
        esRegalo: servicioInfo.esRegalo,
      });
       if (!servicioInfo.esRegalo) {
          costoTotalSinDescuento += costoTotalItem;
      }
    });

    let totalConDescuentoCalculado = costoTotalSinDescuento;
    const descuentoValorNum = parseFloat(currentFormData.descuentoValor || '0');
    if (currentFormData.descuentoTipo && descuentoValorNum > 0) {
      let descuentoAplicado = 0;
      if (currentFormData.descuentoTipo === 'porcentaje') {
        descuentoAplicado = (costoTotalSinDescuento * descuentoValorNum) / 100;
      } else {
        descuentoAplicado = descuentoValorNum;
      }
      totalConDescuentoCalculado = costoTotalSinDescuento - descuentoAplicado;
    }
    
    let notasCombinadas = currentFormData.notas || '';
    if (currentFormData.salonFiestas.trim()) notasCombinadas += `\nSalón: ${currentFormData.salonFiestas.trim()}`;
    let protagonistasTexto = '';
    if (currentFormData.eventoTipo === 'Boda') {
      if (currentFormData.protagonista1Nombre && currentFormData.protagonista2Nombre) protagonistasTexto = `Boda de ${currentFormData.protagonista1Nombre} y ${currentFormData.protagonista2Nombre}.`;
      else if (currentFormData.protagonista1Nombre) protagonistasTexto = `Boda de ${currentFormData.protagonista1Nombre}.`;
    } else if (currentFormData.eventoTipo === 'Evento corporativo') {
        protagonistasTexto = `Evento para empresa: ${currentFormData.nombreEmpresa || currentFormData.protagonista1Nombre || 'No especificada'}.`;
    } else if (currentFormData.protagonista1Nombre) {
      protagonistasTexto = `Evento para ${currentFormData.protagonista1Nombre}.`;
    }
    if(protagonistasTexto) notasCombinadas = `${notasCombinadas}\n${protagonistasTexto}`.trim();


    return {
      clienteNombre: currentFormData.clienteNombre.trim() || "Cliente",
      eventoTipo: currentFormData.eventoTipo.trim() || "Evento",
      eventoFecha: currentFormData.eventoFecha ? currentFormData.eventoFecha.toISOString() : new Date().toISOString(),
      invitadosCantidad: currentFormData.invitadosCantidad || 1,
      salonFiestas: currentFormData.salonFiestas.trim() || "Salón a definir",
      protagonista1Nombre: currentFormData.protagonista1Nombre?.trim() || undefined,
      protagonista2Nombre: currentFormData.protagonista2Nombre?.trim() || undefined,
      nombreEmpresa: currentFormData.nombreEmpresa?.trim() || undefined,
      itemsPresupuestados,
      costoTotalEstimado: costoTotalSinDescuento, 
      nombrePromocion: currentFormData.nombrePromocion?.trim() || undefined,
      descuentoTipo: currentFormData.descuentoTipo,
      descuentoValor: descuentoValorNum > 0 ? descuentoValorNum : undefined,
      totalConDescuento: descuentoValorNum > 0 ? totalConDescuentoCalculado : undefined, 
      vigenciaPromocion: currentFormData.vigenciaPromocion?.trim() || undefined,
      timestamp: new Date().toISOString(),
      notas: notasCombinadas.trim() || undefined,
    };
  }, []);

  const handleSave = async () => {
    const presupuestoAGuardar = calcularPresupuestoDesdeForm(formData);
    if (!presupuestoAGuardar.clienteNombre || presupuestoAGuardar.clienteNombre === "Cliente") { toast({ title: "Requerido", description: "Nombre del cliente.", variant: "destructive" }); return; }
    if (!presupuestoAGuardar.eventoTipo || presupuestoAGuardar.eventoTipo === "Evento") { toast({ title: "Requerido", description: "Tipo de evento.", variant: "destructive" }); return; }
    if (!presupuestoAGuardar.salonFiestas || presupuestoAGuardar.salonFiestas === "Salón a definir") { toast({ title: "Requerido", description: "Salón de fiestas.", variant: "destructive" }); return; }
    if (presupuestoAGuardar.invitadosCantidad <= 0) { toast({ title: "Requerido", description: "Cantidad de invitados > 0.", variant: "destructive" }); return; }
    if (presupuestoAGuardar.itemsPresupuestados.length === 0) { toast({ title: "Requerido", description: "Seleccionar al menos un servicio.", variant: "destructive" }); return; }

    setIsSaving(true);
    try {
      const result = await savePresupuesto(presupuestoAGuardar);
      if (result.success && result.id) {
        toast({ title: "¡Presupuesto Guardado!", description: `Presupuesto para ${presupuestoAGuardar.clienteNombre} guardado con ID: ${result.id.split('_').pop()}` });
        sessionStorage.removeItem(SESSION_STORAGE_KEY); // Clear saved data after successful save
        router.push('/presupuestos');
      } else {
        throw new Error(result.error || "Error desconocido al guardar el presupuesto.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const progreso = (formData.pasoActual / TOTAL_PASOS) * 100;
  const titulosPasos = ["Datos Generales del Evento", "Selección de Servicios", "Resumen, Descuentos y Notas"];
  const descripcionesPasos = ["Información básica de tu evento.", "Elige servicios del catálogo.", "Revisa, aplica descuentos y añade notas."];

  const renderPaso = () => {
    if (isLoadingInitialData || !displaySettings) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }
    switch (formData.pasoActual) {
      case 1: return <Paso1DatosEvento formData={formData} setFormData={setFormData} />;
      case 2: return <Paso2Servicios formData={formData} setFormData={setFormData} serviciosCatalogo={serviciosCatalogo} />;
      case 3:
        const presupuestoParaResumen: Presupuesto = {
            ...calcularPresupuestoDesdeForm(formData),
            id: 'temp-summary', 
            estado: 'Borrador',
            invoiceId: undefined,
        };
        return <Paso4Resumen presupuesto={presupuestoParaResumen} formData={formData} setFormData={setFormData} displaySettings={displaySettings}/>;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-0">
      <Card className="shadow-xl overflow-hidden border-primary/20 print:p-0 print:m-0 print:shadow-none print:border-none">
        <CardHeader className="bg-primary/10 p-6 print:hidden">
            <div className="flex justify-between items-center">
                 <Progress value={progreso} className="w-full h-2" />
                 <Button variant="ghost" size="sm" onClick={handleReset} className="ml-4 shrink-0"><RotateCcw className="w-4 h-4 mr-1"/> Reiniciar</Button>
            </div>
          <CardTitle className="font-headline text-3xl text-primary mt-4">{titulosPasos[formData.pasoActual - 1]}</CardTitle>
          <CardDescription className="text-lg">{descripcionesPasos[formData.pasoActual - 1]} (Paso {formData.pasoActual} de {TOTAL_PASOS})</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 min-h-[400px] print:p-0 print:pt-0 print:pb-0">
          {renderPaso()}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-muted/50 border-t print:hidden">
          <Button variant="outline" onClick={handlePrev} disabled={formData.pasoActual === 1 || isSaving || isLoadingInitialData} className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
          </Button>
          {formData.pasoActual < TOTAL_PASOS ? (
            <Button onClick={handleNext} disabled={isSaving || isLoadingInitialData} className="w-full sm:w-auto">
              Siguiente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isSaving || isLoadingInitialData} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Presupuesto'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function NuevoPresupuestoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <NuevoPresupuestoContent />
        </Suspense>
    )
}
