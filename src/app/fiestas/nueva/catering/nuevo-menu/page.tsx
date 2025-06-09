
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, PlusCircle, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

interface MenuItem {
  id: string;
  name: string;
  type: 'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | '';
  // ingredients: Ingredient[]; // To be added later
}

// interface Ingredient { // To be added later
//   id: string;
//   name: string;
//   quantity: number;
//   unit: string;
//   cost: number;
// }

export default function NuevoMenuPersonalizadoPage() {
  const { toast } = useToast();
  const [menuName, setMenuName] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // For the "Add Item" form
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | ''>('');

  const handleAddItem = () => {
    if (!newItemName || !newItemType) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor, ingresa el nombre y tipo del plato.',
        variant: 'destructive',
      });
      return;
    }
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: newItemName,
      type: newItemType,
    };
    setMenuItems(prevItems => [...prevItems, newItem]);
    setNewItemName('');
    setNewItemType('');
    toast({
      title: 'Plato Añadido',
      description: `${newItemName} (${newItemType}) fue añadido al menú.`,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    const itemToRemove = menuItems.find(item => item.id === itemId);
    setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
    if (itemToRemove) {
        toast({
            title: 'Plato Eliminado',
            description: `El plato "${itemToRemove.name}" ha sido eliminado del menú.`,
            variant: 'default' // Using default as it's a common action, not necessarily an error
        });
    }
  };

  const handleSaveMenu = () => {
    if (!menuName.trim()) {
        toast({
            title: 'Nombre del Menú Requerido',
            description: 'Por favor, asigna un nombre a tu menú.',
            variant: 'destructive',
        });
        return;
    }
    if (menuItems.length === 0) {
        toast({
            title: 'Menú Vacío',
            description: 'Añade al menos un plato al menú antes de guardar.',
            variant: 'destructive',
        });
        return;
    }
    // Simulate saving
    console.log('Guardando Menú:', { menuName, menuItems });
    toast({
      title: 'Menú Guardado (Simulación)',
      description: `El menú "${menuName}" con ${menuItems.length} plato(s) ha sido guardado.`,
    });
    // Potentially redirect or clear form
    // router.push('/fiestas/nueva/catering');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Crear Nuevo Menú Personalizado
        </h1>
        <Link href="/fiestas/nueva/catering" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Catering
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Información del Menú</CardTitle>
          <CardDescription>Dale un nombre a tu nuevo menú y añade los platos que lo componen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="menu-name" className="text-base">Nombre del Menú</Label>
            <Input
              id="menu-name"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="Ej: Menú Primavera, Menú Fiesta Infantil"
              className="text-base p-3"
            />
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-3 font-headline">Añadir Plato al Menú</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="new-item-name">Nombre del Plato</Label>
                <Input
                  id="new-item-name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ej: Ensalada Caprese"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-item-type">Tipo de Plato</Label>
                <Select value={newItemType} onValueChange={(value) => setNewItemType(value as MenuItem['type'])}>
                  <SelectTrigger id="new-item-type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Plato Principal">Plato Principal</SelectItem>
                    <SelectItem value="Postre">Postre</SelectItem>
                    <SelectItem value="Bebida">Bebida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddItem} type="button">
              <PlusCircle className="w-4 h-4 mr-2" />
              Añadir Plato
            </Button>
          </div>
          
          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-3 font-headline">Platos en "{menuName || 'Nuevo Menú'}"</h3>
            {menuItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-md">
                <p>Aún no has añadido ningún plato a este menú.</p>
                <p className="text-sm">Comienza usando el formulario de arriba.</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-3 border rounded-md">
                <ul className="space-y-0">
                  {menuItems.map((item, index) => (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between p-3 ${index !== menuItems.length - 1 ? 'border-b' : ''} hover:bg-muted/50`}
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.type}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-destructive hover:bg-destructive/10"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
            {menuItems.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2 text-right">Total de platos: {menuItems.length}</p>
            )}
          </div>
          <div className="pt-4 text-center text-muted-foreground">
            <p className="text-sm">
              Próximamente: podrás detallar ingredientes y costos para cada plato.
            </p>
            <Image 
              src="https://placehold.co/400x200.png" 
              alt="Detalle de ingredientes en construcción" 
              width={400}
              height={200}
              className="mt-4 rounded-md shadow-sm mx-auto opacity-70"
              data-ai-hint="ingredients list cooking"
            />
          </div>

        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button onClick={handleSaveMenu} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            Guardar Menú (Simulación)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
