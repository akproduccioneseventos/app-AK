
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PresupuestoFormData, ItemPresupuestado } from '@/types/presupuesto';
import type { ServicioEmpresa } from '@/types/empresa';
import type { PaqueteArmadoRapido } from '@/types/armado-rapido';
import { savePresupuesto } from '@/app/actions/presupuestos';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { Paso1DatosEvento } from '@/components/presupuestos/paso-1-datos-evento';
import Paso2Servicios from '@/components/presupuestos/paso-2-servicios';
import Paso3Resumen from '@/components/presupuestos/paso-3-resumen';
import { Progress } from '@/components/ui/progress';

const SESSION_STORAGE_KEY = 'presupuestoEnProgreso_v3';

const initialFormData: PresupuestoFormData = {
  clienteNombre: '',
  eventoTipo: '',
  eventoFecha: undefined,
  invitadosCantidad: 50,
  salonFiestas: '',
  protagonista1Nombre: '',
  protagonista2Nombre: '',
  nombreEmpresa: '',
  serviciosSeleccionados: new Map(),
  nombrePromocion: '',
  descuentoTipo: undefined,
  descuentoValor: '',
  vigenciaPromocion: '',
  notas: '',
};

function formStateInitializer(initialState: PresupuestoFormData): PresupuestoFormData {
    if (typeof window === 'undefined') return initialState;
    try {
        const storedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedState) {
            const parsed = JSON.parse(storedState);
            parsed.serviciosSeleccionados = new Map(parsed.serviciosSeleccionados);
            parsed.eventoFecha = parsed.eventoFecha ? new Date(parsed.eventoFecha) : undefined;
            return parsed;
        }
    } catch (error) { console.error("Failed to parse form state", error); }
    return initialState;
}

function calcularCostoItem(item: ItemPresupuestado, invitados: number): number {
  if (item.esRegalo) return 0;
  
  let itemTotal = 0;
  const precioUnitario = item.precioUnitarioPresupuesto ?? item.precioUnitario;

  switch (item.calculationMethod) {
    case 'fijo':
      itemTotal = item.precioBase ?? precioUnitario;
      break;
    case 'porPersona':
      itemTotal = (item.precioPorPersona ?? precioUnitario) * invitados;
      break;
    case 'ratio':
      const invitadosPorUnidadNum = Number(item.invitadosPorUnidad);
      if (invitadosPorUnidadNum > 0) {
        const basePrice = item.precioBase ?? precioUnitario;
        itemTotal = Math.ceil(invitados / invitadosPorUnidadNum) * basePrice;
      } else {
        itemTotal = item.precioBase ?? precioUnitario; // Fallback
      }
      break;
    case 'tramos':
      const tramo = item.tramosDePrecio?.find(t => invitados >= t.desde && invitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default: // Fallback to simple calculation
      itemTotal = item.cantidad * precioUnitario;
  }
  return itemTotal;
}


function NuevoPresupuestoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
    const [paquetesBase, setPaquetesBase] = useState<PaqueteArmadoRapido[]>([]);
    const [paso, setPaso] = useState(1);
    
    const [formData, setFormData] = useState<PresupuestoFormData>(() => formStateInitializer(initialFormData));

    useEffect(() => {
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                ...formData,
                serviciosSeleccionados: Array.from(formData.serviciosSeleccionados.entries())
            }));
        } catch (error) { console.warn("Could not save form state", error); }
    }, [formData]);

    const fetchServicios = useCallback(async () => {
        try {
            const services = await getServiciosEmpresa();
            setServiciosCatalogo(services.filter(s => s.tipoItem === 'Servicio'));
        } catch (error) {
            toast({ title: "Error", description: "No se pudo recargar el catálogo de servicios.", variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingInitialData(true);
            try {
                const [armadoConfig] = await Promise.all([getArmadoRapidoConfig()]);
                await fetchServicios();
                setPaquetesBase(armadoConfig.paquetes || []);
                const leadName = searchParams.get('leadName');
                if (leadName && !sessionStorage.getItem(SESSION_STORAGE_KEY)) {
                    setFormData(prev => ({ ...prev, clienteNombre: leadName }));
                }
            } catch (error) {
                toast({ title: "Error", description: "No se pudieron cargar datos iniciales.", variant: "destructive" });
            } finally {
                setIsLoadingInitialData(false);
            }
        };
        fetchInitialData();
    }, [searchParams, toast, fetchServicios]);

    const handleNext = () => {
        if (paso === 1) {
             if (!formData.clienteNombre.trim() || !formData.eventoTipo.trim() || !formData.salonFiestas.trim() || !formData.eventoFecha || (formData.invitadosCantidad || 0) <= 0) {
                 toast({ title: "Requerido", description: "Por favor, completa Cliente, Salón, Tipo de Evento, Fecha y Nº de Invitados.", variant: "destructive" });
                 return;
             }
        }
        setPaso(p => p < 3 ? p + 1 : p);
    };

    const totalCalculado = useMemo(() => {
      let total = 0;
      const invitados = formData.invitadosCantidad || 0;
      formData.serviciosSeleccionados.forEach(item => {
        const itemDataForCalc: ItemPresupuestado = {
          ...item,
          idServicioCatalogo: '', // dummy
          precioUnitario: item.precioUnitarioOriginal,
          costoTotalItem: 0 // Will be calculated
        };
        total += calcularCostoItem(itemDataForCalc, invitados);
      });
      return total;
    }, [formData.serviciosSeleccionados, formData.invitadosCantidad]);

    const handleSave = async () => {
        const presupuestoAGuardar = {
            clienteNombre: formData.clienteNombre,
            eventoTipo: formData.eventoTipo,
            eventoFecha: formData.eventoFecha?.toISOString() || '',
            invitadosCantidad: formData.invitadosCantidad || 0,
            salonFiestas: formData.salonFiestas,
            protagonista1Nombre: formData.protagonista1Nombre,
            protagonista2Nombre: formData.protagonista2Nombre,
            nombreEmpresa: formData.nombreEmpresa,
            itemsPresupuestados: Array.from(formData.serviciosSeleccionados.entries()).map(([id, serv]) => ({
              idServicioCatalogo: id,
              nombreServicio: serv.nombreServicio,
              cantidad: serv.cantidad,
              unidad: serv.unidad,
              precioUnitario: serv.precioUnitarioOriginal,
              precioUnitarioPresupuesto: serv.precioUnitarioPresupuesto,
              costoTotalItem: calcularCostoItem({
                  ...serv,
                  idServicioCatalogo: id,
                  precioUnitario: serv.precioUnitarioOriginal,
                  costoTotalItem: 0 // placeholder for calc
              }, formData.invitadosCantidad || 0),
              esRegalo: serv.esRegalo,
              categoriaServicio: serv.categoriaServicio,
              calculationMethod: serv.calculationMethod,
              precioBase: serv.precioBase,
              precioPorPersona: serv.precioPorPersona,
              invitadosPorUnidad: serv.invitadosPorUnidad,
              tramosDePrecio: serv.tramosDePrecio,
            })),
            costoTotalEstimado: totalCalculado,
            nombrePromocion: formData.nombrePromocion,
            descuentoTipo: formData.descuentoTipo,
            descuentoValor: parseFloat(formData.descuentoValor || '0') || undefined,
            vigenciaPromocion: formData.vigenciaPromocion,
            timestamp: new Date().toISOString(),
            notas: formData.notas
        };
        
        setIsSaving(true);
        try {
          const result = await savePresupuesto(presupuestoAGuardar);
          if (result.success && result.id) {
            toast({ title: "¡Presupuesto Guardado!", description: `Se ha creado el presupuesto para ${presupuestoAGuardar.clienteNombre}.` });
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            router.push('/presupuestos');
          } else { throw new Error(result.error || "Error al guardar"); }
        } catch (error: any) {
          toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
        } finally {
          setIsSaving(false);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
             <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Nueva Cotización Manual</h1>
                <Link href="/presupuestos" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver a Central</Button></Link>
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Paso {paso} de 3: {paso === 1 ? 'Datos del Evento' : paso === 2 ? 'Selección de Servicios' : 'Resumen y Descuentos'}</CardTitle>
                     <Progress value={(paso / 3) * 100} className="w-full h-2 mt-2" />
                </CardHeader>
                <CardContent>
                    {isLoadingInitialData ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div> : (
                        <>
                            {paso === 1 && <Paso1DatosEvento formData={formData} setFormData={setFormData} />}
                            {paso === 2 && <Paso2Servicios formData={formData} setFormData={setFormData} serviciosCatalogo={serviciosCatalogo} paquetesBase={paquetesBase} onCatalogUpdate={fetchServicios}/>}
                            {paso === 3 && <Paso3Resumen formData={formData} setFormData={setFormData} totalCalculado={totalCalculado} />}
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" onClick={() => setPaso(p => p - 1)} disabled={paso === 1 || isSaving}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                    </Button>
                    {paso < 3 ? (
                        <Button onClick={handleNext} disabled={isSaving}>
                            Siguiente 
                        </Button>
                    ) : (
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Guardar Presupuesto
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

export default function NuevoPresupuestoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NuevoPresupuestoContent />
        </Suspense>
    )
}
