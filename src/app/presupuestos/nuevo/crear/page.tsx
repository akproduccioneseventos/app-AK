

'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, PlusCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Presupuesto, PresupuestoFormData, ItemPresupuestado } from '@/types/presupuesto';
import type { ServicioEmpresa } from '@/types/empresa';
import type { PaqueteArmadoRapido, MenuArmadoRapido, ArmadoRapidoConfig } from '@/types/armado-rapido';
import { savePresupuesto, getPresupuestoById, updatePresupuesto } from '@/app/actions/presupuestos';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { Paso1DatosEvento } from '@/components/presupuestos/paso-1-datos-evento';
import Paso2Servicios from '@/components/presupuestos/paso-2-servicios';
import Paso3Resumen from '@/components/presupuestos/paso-3-resumen';
import { Progress } from '@/components/ui/progress';
import { getMenus } from '@/app/actions/menus-catering';
import type { FullMenu } from '@/types/catering';
import { getOcupiedDates } from '@/app/actions/agenda';

const SESSION_STORAGE_KEY = 'presupuestoEnProgreso_v3';

const initialFormData: PresupuestoFormData = {
  clienteNombre: '',
  clienteContacto: '',
  eventoTipo: '',
  eventoFecha: undefined,
  invitadosCantidad: 50,
  invitadosAdultos: 50,
  invitadosNinos: 0,
  invitadosAdolescentes: 0,
  salonFiestas: '',
  protagonista1Nombre: '',
  protagonista2Nombre: '',
  nombreEmpresa: '',
  serviciosSeleccionados: new Map(),
  selectedMenuId: '',
  notas: '',
  estado: 'Borrador',
  nombrePromocion: 'Descuento Promocional',
  descuentoTipo: 'porcentaje',
  descuentoValor: '15',
  vigenciaPromocion: 'Válido por 30 días',
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

// Helper function to decide which guest count to use for an item
function getGuestCountForItem(item: { nombreServicio: string, categoriaServicio?: string, subcategoria?: string }, adultos: number, adolescentes: number, ninos: number): number {
  const categoria = (item.categoriaServicio || '').toLowerCase();
  const subcategoria = (item.subcategoria || '').toLowerCase();
  const ninosYAdolescentes = ninos + adolescentes;
  
  if (categoria.includes('infantil') || categoria.includes('adolescente') || subcategoria.includes('infantil') || subcategoria.includes('adolescente')) {
    return ninosYAdolescentes;
  }
  
  if (categoria.includes('plato principal') || subcategoria.includes('plato principal')) {
    return adultos;
  }

  // Default to total guests for general services (DJ, decor, etc.)
  return adultos + adolescentes + ninos;
};

function calcularCostoItem(item: ItemPresupuestado, adultos: number, adolescentes: number, ninos: number): number {
  if (item.esRegalo) return 0;
  
  const totalInvitados = adultos + adolescentes + ninos;
  const cantidadInvitados = getGuestCountForItem(item, adultos, adolescentes, ninos);
  
  if (cantidadInvitados === 0 && (item.calculationMethod === 'porPersona' || item.calculationMethod === 'ratio')) {
    return 0;
  }

  let itemTotal = 0;
  const precioUnitario = item.precioUnitarioPresupuesto ?? item.precioUnitario;

  switch (item.calculationMethod) {
    case 'fijo': 
      itemTotal = (item.precioBase ?? precioUnitario) * (item.cantidad > 0 ? item.cantidad : 1);
      break;
    case 'porPersona': 
      itemTotal = (item.precioPorPersona ?? precioUnitario) * cantidadInvitados; 
      break;
    case 'ratio':
      const invitadosPorUnidadNum = Number(item.invitadosPorUnidad);
      if (invitadosPorUnidadNum > 0) {
        itemTotal = Math.ceil(cantidadInvitados / invitadosPorUnidadNum) * (item.precioBase ?? precioUnitario);
      } else {
        itemTotal = item.precioBase ?? precioUnitario; // Fallback
      }
      break;
    case 'tramos':
      const tramo = item.tramosDePrecio?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default: // Fallback to simple calculation
      itemTotal = item.cantidad * precioUnitario;
  }
  return itemTotal;
}

function CrearPresupuestoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
    const [paquetesBase, setPaquetesBase] = useState<PaqueteArmadoRapido[]>([]);
    const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
    const [paso, setPaso] = useState(1);
    
    const [formData, setFormData] = useState<PresupuestoFormData>(() => formStateInitializer(initialFormData));
    const [editingPresupuestoId, setEditingPresupuestoId] = useState<string | null>(null);
    const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);
    const [armadoConfig, setArmadoConfig] = useState<ArmadoRapidoConfig | null>(null);
    
    const leadIdFromParams = searchParams.get('leadId');

    const fetchServicios = useCallback(async () => {
        try {
            const services = await getServiciosEmpresa();
            setServiciosCatalogo(services.filter(s => s.tipoItem === 'Servicio'));
        } catch (error) {
            toast({ title: "Error", description: "No se pudo recargar el catálogo de servicios.", variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => {
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                ...formData,
                serviciosSeleccionados: Array.from(formData.serviciosSeleccionados.entries())
            }));
        } catch (error) { console.warn("Could not save form state", error); }
    }, [formData]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingInitialData(true);
            try {
                const editId = searchParams.get('editId');
                setEditingPresupuestoId(editId);

                const [config, menuData, services, occupiedDatesStrings] = await Promise.all([
                    getArmadoRapidoConfig(), 
                    getMenus(), 
                    getServiciosEmpresa(),
                    getOcupiedDates()
                ]);
                setArmadoConfig(config);
                setOccupiedDates(occupiedDatesStrings.map(d => new Date(d)));
                setServiciosCatalogo(services.filter(s => s.tipoItem === 'Servicio'));
                setPaquetesBase(config.paquetes || []);
                setAllMenus(menuData || []);

                if (editId) {
                    const presupuestoToEdit = await getPresupuestoById(editId);
                    if (presupuestoToEdit) {
                        const serviciosMap = new Map();
                        presupuestoToEdit.itemsPresupuestados.forEach(item => {
                            serviciosMap.set(item.idServicioCatalogo, {
                                cantidad: item.cantidad,
                                precioUnitarioOriginal: item.precioUnitario,
                                precioUnitarioPresupuesto: item.precioUnitarioPresupuesto,
                                nombreServicio: item.nombreServicio,
                                unidad: item.unidad,
                                categoriaServicio: item.categoriaServicio,
                                esRegalo: item.esRegalo,
                                calculationMethod: item.calculationMethod,
                                precioBase: item.precioBase,
                                precioPorPersona: item.precioPorPersona,
                                invitadosPorUnidad: item.invitadosPorUnidad,
                                tramosDePrecio: item.tramosDePrecio,
                            });
                        });
                        setFormData({
                            ...presupuestoToEdit,
                            eventoFecha: new Date(presupuestoToEdit.eventoFecha),
                            serviciosSeleccionados: serviciosMap,
                            descuentoValor: presupuestoToEdit.descuentoValor?.toString() || ''
                        });
                         toast({ title: "Modo Edición", description: `Cargado el presupuesto de ${presupuestoToEdit.clienteNombre}.`});
                    } else {
                        toast({ title: "Error", description: "No se encontró el presupuesto a editar.", variant: "destructive" });
                    }
                } else {
                    const leadName = searchParams.get('leadName');
                    if (leadName && !sessionStorage.getItem(SESSION_STORAGE_KEY)) {
                        setFormData(prev => ({ ...prev, clienteNombre: leadName }));
                    }
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
             if (!formData.clienteNombre.trim()) {
                 toast({ title: "Requerido", description: "Por favor, completa el nombre del cliente para continuar.", variant: "destructive" });
                 return;
             }
        }
        if (paso < 3) setPaso(p => p + 1);
    };
    
    const handlePrev = () => { if (paso > 1) setPaso(p => p - 1); };
    
    const totalInvitados = (formData.invitadosAdultos || 0) + (formData.invitadosNinos || 0) + (formData.invitadosAdolescentes || 0);

    const totalCalculado = useMemo(() => {
      return Array.from(formData.serviciosSeleccionados.values()).reduce((sum, item) => {
        const itemDataForCalc: ItemPresupuestado = {
          idServicioCatalogo: '', ...item, precioUnitario: item.precioUnitarioOriginal, costoTotalItem: 0 // dummy for calc
        };
        return sum + calcularCostoItem(itemDataForCalc, formData.invitadosAdultos || 0, formData.invitadosAdolescentes || 0, formData.invitadosNinos || 0);
      }, 0);
    }, [formData]);

    const handleSave = async () => {
        const descuentoValorNum = parseFloat(formData.descuentoValor || '0') || 0;
        const presupuestoData: Omit<Presupuesto, 'id'> = {
            clienteNombre: formData.clienteNombre,
            clienteContacto: formData.clienteContacto,
            eventoTipo: formData.eventoTipo,
            eventoFecha: formData.eventoFecha?.toISOString() || '',
            invitadosCantidad: totalInvitados,
            invitadosAdultos: formData.invitadosAdultos || 0,
            invitadosNinos: formData.invitadosNinos || 0,
            invitadosAdolescentes: formData.invitadosAdolescentes || 0,
            salonFiestas: formData.salonFiestas,
            protagonista1Nombre: formData.protagonista1Nombre,
            protagonista2Nombre: formData.protagonista2Nombre,
            nombreEmpresa: formData.nombreEmpresa,
            itemsPresupuestados: Array.from(formData.serviciosSeleccionados.entries()).map(([id, serv]) => {
              const invitadosParaItem = getGuestCountForItem(serv, formData.invitadosAdultos || 0, formData.invitadosAdolescentes || 0, formData.invitadosNinos || 0);
              let cantidad = 1;
              switch (serv.calculationMethod) {
                case 'porPersona':
                  cantidad = invitadosParaItem;
                  break;
                case 'ratio':
                  cantidad = Math.ceil(invitadosParaItem / (serv.invitadosPorUnidad || 1));
                  break;
                default:
                  cantidad = serv.cantidad;
              }
              return {
                idServicioCatalogo: id,
                nombreServicio: serv.nombreServicio,
                cantidad: cantidad,
                unidad: serv.unidad,
                precioUnitario: serv.precioUnitarioOriginal,
                precioUnitarioPresupuesto: serv.precioUnitarioPresupuesto,
                costoTotalItem: 0, // Recalculated on server
                esRegalo: serv.esRegalo,
                categoriaServicio: serv.categoriaServicio,
                subcategoria: serv.subcategoria,
                calculationMethod: serv.calculationMethod,
                precioBase: serv.precioBase,
                precioPorPersona: serv.precioPorPersona,
                invitadosPorUnidad: serv.invitadosPorUnidad,
                tramosDePrecio: serv.tramosDePrecio,
              };
            }),
            costoTotalEstimado: 0, // Will be recalculated on the server
            nombrePromocion: formData.nombrePromocion,
            descuentoTipo: formData.descuentoTipo,
            descuentoValor: descuentoValorNum > 0 ? descuentoValorNum : undefined,
            vigenciaPromocion: formData.vigenciaPromocion,
            notas: formData.notas,
            estado: formData.estado,
            invoiceId: formData.invoiceId,
        };
        
        setIsSaving(true);
        try {
          let result;
          if (editingPresupuestoId) {
            result = await updatePresupuesto({ ...presupuestoData, id: editingPresupuestoId });
          } else {
            result = await savePresupuesto(presupuestoData, { source: 'manual', leadId: leadIdFromParams || undefined });
          }

          if (result.success && result.id) {
            toast({ title: `Presupuesto ${editingPresupuestoId ? 'Actualizado' : 'Guardado'}` });
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            router.push(`/presupuestos/${result.id}/ver`);
          } else { throw new Error(result.error || "Error al guardar"); }
        } catch (error: any) {
          toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
        } finally {
          setIsSaving(false);
        }
    };
    
    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight font-headline">{editingPresupuestoId ? 'Modificar Presupuesto' : 'Crear Presupuesto'}</h1>
                <Link href="/presupuestos/nuevo" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver a la Central</Button></Link>
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Paso {paso} de 3: {['Datos del Evento', 'Selección de Servicios', 'Resumen y Descuentos'][paso-1]}</CardTitle>
                    <Progress value={(paso / 3) * 100} className="w-full h-2 mt-2" />
                </CardHeader>
                <CardContent>
                    {isLoadingInitialData ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div> : (
                        <>
                            {paso === 1 && <Paso1DatosEvento formData={formData} setFormData={setFormData} occupiedDates={occupiedDates} />}
                            {paso === 2 && <Paso2Servicios formData={formData} setFormData={setFormData} serviciosCatalogo={serviciosCatalogo} paquetesBase={paquetesBase} allMenus={allMenus} onCatalogUpdate={fetchServicios} totalInvitados={totalInvitados} config={armadoConfig} />}
                            {paso === 3 && <Paso3Resumen formData={formData} setFormData={setFormData} totalCalculado={totalCalculado} totalInvitados={totalInvitados} />}
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" onClick={handlePrev} disabled={paso === 1 || isSaving}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                    </Button>
                    {paso < 3 ? (
                         <Button onClick={handleNext} disabled={isSaving}>
                            Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isSaving ? 'Guardando...' : 'Finalizar y Generar'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

export default function CrearPresupuestoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <CrearPresupuestoContent />
        </Suspense>
    )
}
