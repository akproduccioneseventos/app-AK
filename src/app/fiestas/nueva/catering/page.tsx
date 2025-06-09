
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, UtensilsCrossed, Users, ShoppingBasket } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import type { PlatoPresupuesto } from '@/types/presupuesto'; // Reutilizamos este tipo por ahora
import { useToast } from '@/hooks/use-toast';

// Datos de ejemplo para el menú. Reemplazar con datos de la hoja de Google o API.
const mockMenuItems: PlatoPresupuesto[] = [
  { id: 'entrada-bruschetta', nombre: 'Bruschetta Clásica', descripcion: 'Tomate fresco, albahaca, ajo y oliva.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 8, seleccionado: false },
  { id: 'entrada-empanadas', nombre: 'Empanadas Criollas (2u)', descripcion: 'Carne cortada a cuchillo.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 10, seleccionado: false },
  { id: 'principal-asado', nombre: 'Asado Argentino Completo', descripcion: 'Tira, vacío, chorizo, morcilla, ensaladas.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 35, seleccionado: false },
  { id: 'principal-pasta-salmon', nombre: 'Pasta Casera con Salmón Ahumado', descripcion: 'Salsa crema de eneldo y limón.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 28, seleccionado: false },
  { id: 'principal-risotto', nombre: 'Risotto de Hongos de Pino', descripcion: 'Con parmesano y aceite de trufa.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 25, seleccionado: false },
  { id: 'postre-volcan', nombre: 'Volcán de Chocolate', descripcion: 'Con helado de crema americana.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 12, seleccionado: false },
  { id: 'postre-flan', nombre: 'Flan Casero con Dulce de Leche', descripcion: 'El clásico argentino.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 9, seleccionado: false },
  { id: 'bebida-gaseosa', nombre: 'Gaseosa Línea Coca-Cola', descripcion: 'Por persona, consumo libre.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 5, seleccionado: false },
  { id: 'bebida-vino', nombre: 'Vino Malbec (Botella cada 4 pers.)', descripcion: 'Selección de bodega.', imagenUrl: 'https://placehold.co/300x200.png', costoPorPersona: 7, seleccionado: false },
];


interface CateringState {
  numInvitados: number | string;
  menuItems: PlatoPresupuesto[];
  selectedItemIds: Set<string>;
  costoTotalCatering: number;
}

export default function CateringEventoPage() {
  const { toast } = useToast();
  const [state, setState] = useState<CateringState>({
    numInvitados: '',
    menuItems: mockMenuItems.map(item => ({ ...item, seleccionado: false })), // Inicializar 'seleccionado'
    selectedItemIds: new Set(),
    costoTotalCatering: 0,
  });

  const handleNumInvitadosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setState(prev => ({ ...prev, numInvitados: value === '' ? '' : parseInt(value, 10) }));
  };

  const handleItemToggle = (itemId: string) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedItemIds);
      if (newSelectedIds.has(itemId)) {
        newSelectedIds.delete(itemId);
      } else {
        newSelectedIds.add(itemId);
      }
      return { ...prev, selectedItemIds: newSelectedIds };
    });
  };

  useEffect(() => {
    const invitados = typeof state.numInvitados === 'number' ? state.numInvitados : 0;
    if (invitados <= 0) {
      setState(prev => ({ ...prev, costoTotalCatering: 0 }));
      return;
    }

    const costoTotal = state.menuItems
      .filter(item => state.selectedItemIds.has(item.id))
      .reduce((sum, item) => sum + (item.costoPorPersona * invitados), 0);
    
    setState(prev => ({ ...prev, costoTotalCatering: costoTotal }));
  }, [state.numInvitados, state.selectedItemIds, state.menuItems]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (typeof state.numInvitados !== 'number' || state.numInvitados <= 0) {
        toast({
            title: "Error",
            description: "Por favor, ingrese un número válido de invitados.",
            variant: "destructive",
        });
        return;
    }
    // En una aplicación real, aquí guardarías los datos del catering del evento.
    console.log({ 
        invitados: state.numInvitados, 
        itemsSeleccionados: Array.from(state.selectedItemIds),
        costoTotal: state.costoTotalCatering 
    });
    toast({
      title: "Catering Guardado (Simulación)",
      description: `Costo total del catering: $${state.costoTotalCatering.toFixed(2)} para ${state.numInvitados} invitados.`,
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Catering y Menú del Evento
        </h1>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-xl">Configura el Menú</CardTitle>
                <CardDescription>Selecciona los platos y calcula el costo total del catering.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="num-invitados-catering" className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground"/>
                Número de Invitados
              </Label>
              <Input
                id="num-invitados-catering"
                type="number"
                value={state.numInvitados}
                onChange={handleNumInvitadosChange}
                placeholder="Ej: 50"
                min="1"
                className="text-base p-3"
                required
              />
            </div>

            <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                    <ShoppingBasket className="w-5 h-5 text-muted-foreground"/>
                    Selección de Platos del Menú
                </Label>
                 {typeof state.numInvitados !== 'number' || state.numInvitados <= 0 && (
                    <p className="text-sm text-muted-foreground">Por favor, ingresa el número de invitados para ver los costos y seleccionar platos.</p>
                )}
                {(typeof state.numInvitados === 'number' && state.numInvitados > 0) && (
                    <ScrollArea className="h-[450px] pr-4 border rounded-md p-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3">
                        {state.menuItems.map((item) => (
                            <Card key={item.id} className={`overflow-hidden transition-all hover:shadow-lg ${state.selectedItemIds.has(item.id) ? 'ring-2 ring-primary' : 'border-border'}`}>
                            <CardHeader className="p-0 relative">
                                <Image 
                                src={item.imagenUrl || "https://placehold.co/300x200.png"} 
                                alt={item.nombre} 
                                width={300} 
                                height={200} 
                                className="w-full h-32 object-cover"
                                data-ai-hint="food delicious plate"
                                />
                            </CardHeader>
                            <CardContent className="p-3 space-y-1">
                                <CardTitle className="text-md font-medium">{item.nombre}</CardTitle>
                                {item.descripcion && <p className="text-xs text-muted-foreground h-8 overflow-hidden">{item.descripcion}</p>}
                                <p className="text-md font-semibold text-primary">{formatCurrency(item.costoPorPersona)} <span className="text-xs text-muted-foreground">p/persona</span></p>
                            </CardContent>
                            <CardFooter className="p-3 bg-muted/30">
                                <div className="flex items-center space-x-2 w-full">
                                <Checkbox
                                    id={`item-${item.id}`}
                                    checked={state.selectedItemIds.has(item.id)}
                                    onCheckedChange={() => handleItemToggle(item.id)}
                                    disabled={typeof state.numInvitados !== 'number' || state.numInvitados <= 0}
                                />
                                <Label htmlFor={`item-${item.id}`} className="text-xs font-medium cursor-pointer grow">
                                    Seleccionar
                                </Label>
                                </div>
                            </CardFooter>
                            </Card>
                        ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
            
            {typeof state.numInvitados === 'number' && state.numInvitados > 0 && (
                <div className="mt-6 pt-4 border-t">
                    <p className="text-2xl font-bold text-right text-primary">
                    Costo Total Estimado del Catering: {formatCurrency(state.costoTotalCatering)}
                    </p>
                    <p className="text-sm text-muted-foreground text-right">
                        Calculado para {state.numInvitados} invitados.
                    </p>
                </div>
            )}

          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto">
              Guardar Configuración de Catering
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
