
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UtensilsCrossed, Music, Camera, Paintbrush, HomeIcon, Archive, Car, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ProviderCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const providerCategories: ProviderCategory[] = [
  {
    id: 'catering',
    name: 'Catering y Bebidas',
    description: 'Encuentra y gestiona servicios de comida, bebida, pastelería y más.',
    icon: UtensilsCrossed,
  },
  {
    id: 'music',
    name: 'Música y Entretenimiento',
    description: 'DJs, bandas, animadores, shows y todo para el entretenimiento.',
    icon: Music,
  },
  {
    id: 'photo_video',
    name: 'Fotografía y Video',
    description: 'Contrata fotógrafos y videógrafos para capturar cada momento.',
    icon: Camera,
  },
  {
    id: 'decoration',
    name: 'Decoración y Ambientación',
    description: 'Floristas, decoradores, alquiler de mobiliario temático.',
    icon: Paintbrush,
  },
  {
    id: 'venue',
    name: 'Lugar del Evento / Salón',
    description: 'Salones, fincas, espacios al aire libre y más opciones.',
    icon: HomeIcon,
  },
  {
    id: 'rentals',
    name: 'Alquileres Diversos',
    description: 'Mesas, sillas, carpas, sonido, iluminación y equipamiento general.',
    icon: Archive,
  },
  {
    id: 'transport',
    name: 'Transporte',
    description: 'Servicios de transporte para invitados o equipamiento.',
    icon: Car,
  },
  {
    id: 'additional',
    name: 'Servicios Adicionales',
    description: 'Seguridad, personal de apoyo, wedding planners, etc.',
    icon: Sparkles,
  },
];

export default function ProveedoresEventoPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Proveedores y Servicios del Evento
          </h1>
          <p className="text-muted-foreground mt-1">
            Organiza y selecciona los mejores proveedores para tu fiesta.
          </p>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providerCategories.map((category) => (
          <Card key={category.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <category.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-lg mb-1">{category.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-3">{category.description}</p>
            </CardContent>
            <CardContent className="pt-2">
               <Button variant="secondary" className="w-full" disabled>
                Gestionar {category.name}
                <span className="ml-2 text-xs opacity-70">(Próximamente)</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mt-8 bg-muted/30 border-dashed">
        <CardHeader>
            <CardTitle className="font-headline text-xl">¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <p className="text-muted-foreground">
                Desde esta sección podrás explorar diferentes categorías de proveedores. Próximamente, podrás añadir tus proveedores preferidos,
                comparar presupuestos, y llevar un seguimiento de los contratos y pagos para cada uno.
            </p>
            <img 
              src="https://placehold.co/600x300.png" 
              alt="Planificación de proveedores" 
              className="rounded-md shadow-md mx-auto"
              data-ai-hint="vendor categories event planning"
            />
        </CardContent>
      </Card>
    </div>
  );
}
