
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Wand2, Loader2, AlertTriangle, Send, CheckCircle, User, Users, Calendar, Building, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

function calcularCostoServicio(servicio: ServicioEmpresa, cantidadInvitados: number, esRegalo?: boolean): number {
  if (esRegalo) return 0;
  if (!servicio.calculationMethod) {
    return servicio.precioVenta || 0; // Fallback to precioVenta if no method is defined
  }
  
  let costo = 0;
  switch (servicio.calculationMethod) {
    case 'fijo':
      costo = servicio.precioVenta || 0;
      break;
    case 'porPersona':
      costo = (servicio.precioPorPersona || 0) * cantidadInvitados;
      break;
    case 'ratio':
      const invitadosPorUnidadNum = Number(servicio.invitadosPorUnidad);
      if (invitadosPorUnidadNum > 0) {
        costo = Math.ceil(cantidadInvitados / invitadosPorUnidadNum) * (servicio.precioBase || 0);
      }
      break;
    case 'tramos':
      const tramo = servicio.tramosDePrecio?.find(t => cantidadInvitados >= t.desde && cantidadInvitados <= t.hasta);
      costo = tramo?.precio || 0;
      break;
    default:
      costo = servicio.precioVenta || 0;
  }
  return costo;
}


function calcularCostoPaquete(
    paquete: PaqueteArmadoRapido, 
    catalogo: ServicioEmpresa[], 
    cantidadInvitados: number,
    descuentoGeneral: number,
): number {
    if (!paquete) return 0;
    
    let costoTotal = 0;
    paquete.serviciosIncluidos.forEach(servIncluido => {
        const servicioCatalogo = catalogo.find(s => s.id === servIncluido.id);
        if (servicioCatalogo) {
            costoTotal += calcularCostoServicio(servicioCatalogo, cantidadInvitados, servIncluido.esRegalo);
        }
    });

    if (descuentoGeneral > 0) {
        costoTotal *= (1 - (descuentoGeneral / 100));
    }
    
    return costoTotal;
}

export default function SimuladorDePresupuestoPage() {
  const { toast } = useToast();
  const [paso, setPaso] = useState(1);
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [catalogo, setCatalogo] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // User Selections
  const [tipoEvento, setTipoEvento] = useState('');
  const [cantidadInvitados, setCantidadInvitados] = useState<number>(50);
  const [salonFiestas, setSalonFiestas] = useState('');
  const [paqueteSeleccionadoId, setPaqueteSeleccionadoId] = useState<string>('');
  const [menuSeleccionadoId, setMenuSeleccionadoId] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState('');

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [configData, catalogoData] = await Promise.all([
        getArmadoRapidoConfig(),
        getServiciosEmpresa()
      ]);
      setConfig(configData);
      setCatalogo(catalogoData);
    } catch (err: any) {
      setError("No se pudo cargar la configuración del simulador.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const paqueteSeleccionado = useMemo(() => {
    return config?.paquetes.find(p => p.id === paqueteSeleccionadoId);
  }, [paqueteSeleccionadoId, config]);

  const costoEstimado = useMemo(() => {
    if (!paqueteSeleccionado || !config || !catalogo) return 0;
    // La lógica de cálculo ahora es más robusta y vive en una función dedicada
    return calcularCostoPaquete(paqueteSeleccionado, catalogo, cantidadInvitados, config.descuentoGeneral || 0);
  }, [paqueteSeleccionado, catalogo, cantidadInvitados, config]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      toast({ title: "Nombre requerido", description: "Por favor, ingresa tu nombre.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const dataToSubmit = {
      clienteNombre,
      tipoEvento,
      cantidadInvitados,
      salonFiestas,
      nombrePaquete: paqueteSeleccionado?.nombre,
      nombreMenu: config?.menus.find(m => m.id === menuSeleccionadoId)?.nombre,
      costoEstimado,
    };
    try {
      const result = await generateLeadFromQuickBudget(dataToSubmit);
      if (result.success) {
        setSubmissionSuccess(true);
      } else {
        throw new Error(result.error || "No se pudo generar el prospecto.");
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (paso === 1 && !tipoEvento) {
      toast({ description: "Por favor, selecciona un tipo de evento." });
      return;
    }
     if (paso === 2 && !paqueteSeleccionadoId) {
      toast({ description: "Por favor, selecciona un paquete de servicios." });
      return;
    }
     if (paso === 3 && !menuSeleccionadoId) {
      toast({ description: "Por favor, selecciona una opción de catering." });
      return;
    }
    setPaso(p => p + 1);
  };
  
  const handlePrevStep = () => setPaso(p => p - 1);
  const resetSimulator = () => {
      setPaso(1);
      setSubmissionSuccess(false);
      setClienteNombre('');
      setPaqueteSeleccionadoId('');
      setMenuSeleccionadoId('');
      setTipoEvento('');
  };


  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>;
  }
  
  if (submissionSuccess) {
    return (
       <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-lg text-center shadow-2xl p-4 sm:p-8">
            <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
            <CardTitle className="text-3xl font-bold font-headline text-green-700">¡Presupuesto Enviado!</CardTitle>
            <CardDescription className="text-lg mt-2 text-muted-foreground">Gracias, {clienteNombre}. Hemos recibido tu solicitud.</CardDescription>
            <CardContent className="mt-6">
                <p>Un asesor se pondrá en contacto contigo a la brevedad para confirmar los detalles y ajustar el presupuesto a tus necesidades.</p>
                 <Button onClick={resetSimulator} className="mt-6">Crear Otro Presupuesto</Button>
            </CardContent>
          </Card>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <Wand2 className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="text-3xl font-bold font-headline">Simulador de Presupuesto</CardTitle>
          <CardDescription className="text-lg">Obtén una cotización estimada para tu evento en pocos pasos.</CardDescription>
           <Progress value={(paso / 4) * 100} className="w-full h-2 mt-4" />
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="min-h-[300px]">
            {paso === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-xl text-center flex items-center justify-center gap-2"><Calendar className="w-5 h-5"/>¿Qué tipo de evento estás planeando?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Tipo de evento</Label><Select value={tipoEvento} onValueChange={setTipoEvento}><SelectTrigger><SelectValue placeholder="Selecciona uno..."/></SelectTrigger><SelectContent><SelectItem value="Boda">Boda</SelectItem><SelectItem value="Cumpleaños de 15">Cumpleaños de 15</SelectItem><SelectItem value="Evento Corporativo">Evento Corporativo</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select></div>
                   <div className="space-y-1"><Label>Salón de fiestas</Label><Input value={salonFiestas} onChange={e => setSalonFiestas(e.target.value)} placeholder="Ej: Club Uruguay" /></div>
                </div>
                 <div className="space-y-1 pt-4"><Label>Cantidad de invitados</Label><Input type="number" value={cantidadInvitados} onChange={e => setCantidadInvitados(Number(e.target.value))} /></div>
              </div>
            )}
             {paso === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-xl text-center flex items-center justify-center gap-2"><Package className="w-5 h-5"/>Elige un Paquete de Servicios</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {config?.paquetes.map(pkg => (
                        <Card key={pkg.id} onClick={() => setPaqueteSeleccionadoId(pkg.id)} className={`cursor-pointer transition-all ${paqueteSeleccionadoId === pkg.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
                            <CardHeader><CardTitle className="text-base">{pkg.nombre}</CardTitle></CardHeader>
                            <CardContent><p className="text-xs text-muted-foreground">{pkg.descripcion || `${pkg.serviciosIncluidos.length} servicios incluidos.`}</p></CardContent>
                        </Card>
                    ))}
                </div>
              </div>
            )}
             {paso === 3 && (
               <div className="space-y-4">
                <h3 className="font-semibold text-xl text-center flex items-center justify-center gap-2"><ChefHat className="w-5 h-5"/>Elige tu Catering</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {config?.menus.map(menu => (
                        <Card key={menu.id} onClick={() => setMenuSeleccionadoId(menu.id)} className={`cursor-pointer transition-all ${menuSeleccionadoId === menu.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
                            <CardHeader><CardTitle className="text-base">{menu.nombre}</CardTitle></CardHeader>
                            <CardContent><p className="text-xs text-muted-foreground">{menu.descripcion}</p></CardContent>
                        </Card>
                    ))}
                </div>
              </div>
            )}
            {paso === 4 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-xl text-center flex items-center justify-center gap-2"><DollarSign className="w-5 h-5"/>Resumen y Contacto</h3>
                <Card className="bg-muted/50">
                    <CardHeader><CardTitle className="text-lg">Presupuesto Estimado</CardTitle></CardHeader>
                    <CardContent className="text-center">
                        <p className="text-4xl font-bold text-primary">{formatCurrency(costoEstimado)}</p>
                        <p className="text-xs text-muted-foreground">IVA Incluido. Válido por 30 días.</p>
                    </CardContent>
                </Card>
                 <div className="space-y-1">
                    <Label htmlFor="cliente-nombre">Tu Nombre*</Label>
                    <Input id="cliente-nombre" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Ingresa tu nombre completo" required />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={handlePrevStep} disabled={paso === 1}>Anterior</Button>
            {paso < 4 ? (
              <Button type="button" onClick={handleNextStep}>Siguiente <ArrowRight className="w-4 h-4 ml-2"/></Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                Enviar Presupuesto
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
