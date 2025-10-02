
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
import type { PaqueteArmadoRapido, MenuArmadoRapido } from '@/types/armado-rapido';
import { savePresupuesto, deletePresupuesto } from '@/app/actions/presupuestos';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import { getCrmStages, moveCrmLead } from '@/app/actions/crm'; // Importar acciones de CRM
import { Paso1DatosEvento } from '@/components/presupuestos/paso-1-datos-evento';
import Paso2Servicios from '@/components/presupuestos/paso-2-servicios';
import Paso3Resumen from '@/components/presupuestos/paso-3-resumen';
import { Progress } from '@/components/ui/progress';
import { getPresupuestos } from '@/app/actions/presupuestos';
import PresupuestoCard from '@/components/presupuestos/presupuesto-card';
import { Separator } from '@/components/ui/separator';
import { getMenus } from '@/app/actions/menus-catering';
import type { FullMenu } from '@/types/catering';

const SESSION_STORAGE_KEY = 'presupuestoEnProgreso_v3';

const initialFormData: PresupuestoFormData = {
  clienteNombre: '',
  clienteContacto: '',
  eventoTipo: '',
  eventoFecha: undefined,
  invitadosCantidad: 50,
  invitadosAdultos: 50,
  invitadosNinos: 0,
  salonFiestas: '',
  protagonista1Nombre: '',
  protagonista2Nombre: '',
  nombreEmpresa: '',
  serviciosSeleccionados: new Map(),
  selectedMenuId: '', // Changed from gastronomic selections
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
    const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
    const [paso, setPaso] = useState(1);
    
    const [formData, setFormData] = useState<PresupuestoFormData>(() => formStateInitializer(initialFormData));
    const [presupuestosGuardados, setPresupuestosGuardados] = useState<Presupuesto[]>([]);
    
    const leadIdFromParams = searchParams.get('leadId');

    const fetchGuardados = useCallback(async () => {
        try {
            const guardados = await getPresupuestos();
            setPresupuestosGuardados(guardados);
        } catch(e) {
            toast({ title: "Error", description: "No se pudieron cargar los presupuestos guardados."});
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
                const [armadoConfig, guardados, menuData] = await Promise.all([getArmadoRapidoConfig(), getPresupuestos(), getMenus()]);
                await fetchServicios();
                setPaquetesBase(armadoConfig.paquetes || []);
                setAllMenus(menuData || []);
                setPresupuestosGuardados(guardados);
                
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
             if (!formData.clienteNombre.trim() || !formData.eventoTipo.trim() || !formData.salonFiestas.trim() || !formData.eventoFecha || (formData.invitadosAdultos ?? 0) < 0) {
                 toast({ title: "Requerido", description: "Por favor, completa Cliente, Salón, Tipo de Evento, Fecha y Nº de Adultos.", variant: "destructive" });
                 return;
             }
        }
        if (paso < 3) {
            setPaso(p => p + 1);
        }
    };
    
    const handlePrev = () => {
        if (paso > 1) {
            setPaso(p => p + 1);
        }
    };

    const totalInvitados = (formData.invitadosAdultos || 0) + (formData.invitadosNinos || 0);

    const totalCalculado = useMemo(() => {
      let total = 0;
      formData.serviciosSeleccionados.forEach((item, id) => {
        const itemDataForCalc: ItemPresupuestado = {
          idServicioCatalogo: id,
          ...item,
          precioUnitario: item.precioUnitarioOriginal,
          costoTotalItem: 0 // Will be calculated in function
        };
        total += calcularCostoItem(itemDataForCalc, totalInvitados);
      });
      return total;
    }, [formData.serviciosSeleccionados, totalInvitados]);

    const handleSave = async () => {
        const descuentoValorNum = parseFloat(formData.descuentoValor || '0') || 0;
        let descuentoAplicado = 0;
        if (formData.descuentoTipo && descuentoValorNum > 0) {
            descuentoAplicado = formData.descuentoTipo === 'porcentaje' ? (totalCalculado * descuentoValorNum) / 100 : descuentoValorNum;
        }
        const totalFinalConDescuento = totalCalculado - descuentoAplicado;


        const presupuestoAGuardar: Omit<Presupuesto, 'id'> = {
            clienteNombre: formData.clienteNombre,
            clienteContacto: formData.clienteContacto,
            eventoTipo: formData.eventoTipo,
            eventoFecha: formData.eventoFecha?.toISOString() || '',
            invitadosCantidad: totalInvitados,
            invitadosAdultos: formData.invitadosAdultos || 0,
            invitadosNinos: formData.invitadosNinos || 0,
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
                  costoTotalItem: 0
              }, totalInvitados),
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
            descuentoValor: descuentoValorNum > 0 ? descuentoValorNum : undefined,
            totalConDescuento: descuentoAplicado > 0 ? totalFinalConDescuento : undefined,
            vigenciaPromocion: formData.vigenciaPromocion,
            estado: 'Borrador',
            timestamp: new Date().toISOString(),
            notas: formData.notas
        };
        
        setIsSaving(true);
        try {
          const result = await savePresupuesto(presupuestoAGuardar);
          if (result.success && result.id) {
            if (leadIdFromParams) {
                const stages = await getCrmStages();
                const targetStage = stages.find(s => s.name.toLowerCase() === 'con presupuesto');
                if (targetStage) {
                    await moveCrmLead(leadIdFromParams, targetStage.id);
                    toast({ title: "Prospecto Actualizado", description: `Se movió a "${formData.clienteNombre}" a la etapa "Con presupuesto".` });
                }
            } else {
                await generateLeadFromQuickBudget({
                    clienteNombre: presupuestoAGuardar.clienteNombre,
                    clienteContacto: presupuestoAGuardar.clienteContacto,
                    adultos: presupuestoAGuardar.invitadosAdultos || 0,
                    ninos: presupuestoAGuardar.invitadosNinos || 0,
                    costoEstimado: totalFinalConDescuento,
                    serviciosIncluidos: presupuestoAGuardar.itemsPresupuestados.map(i => i.nombreServicio),
                    paqueteNombre: undefined
                });
                toast({ title: "Prospecto Creado", description: `Se creó un nuevo prospecto en el CRM para "${formData.clienteNombre}".` });
            }

            toast({ title: "Presupuesto Guardado" });
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
                <h1 className="text-3xl font-bold tracking-tight font-headline">Central de Presupuestos</h1>
                <Link href="/empresa/contabilidad" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Paso {paso} de 3: {['Datos del Evento', 'Selección de Servicios', 'Resumen y Descuentos'][paso-1]}</CardTitle>
                    <Progress value={(paso / 3) * 100} className="w-full h-2 mt-2" />
                </CardHeader>
                <CardContent>
                    {isLoadingInitialData ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div> : (
                        <>
                            {paso === 1 && <Paso1DatosEvento formData={formData} setFormData={setFormData} />}
                            {paso === 2 && <Paso2Servicios formData={formData} setFormData={setFormData} serviciosCatalogo={serviciosCatalogo} paquetesBase={paquetesBase} allMenus={allMenus} onCatalogUpdate={fetchServicios} totalInvitados={totalInvitados} />}
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
                            {isSaving ? 'Guardando...' : 'Finalizar y Generar Presupuesto'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
            
            <Separator className="my-8" />
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-headline">Presupuestos Guardados</h2>
              {isLoadingInitialData ? <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
                presupuestosGuardados.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presupuestosGuardados.map(p => (
                      <PresupuestoCard key={p.id} presupuesto={p} onDeleteSuccess={fetchGuardados}/>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-center py-4">No hay presupuestos guardados.</p>
              }
            </div>
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
