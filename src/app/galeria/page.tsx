
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function GaleriaPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Galería de Eventos
        </h1>
        <Link href="/" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
            <ImageIcon className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            Esta sección mostrará una galería de tus eventos pasados.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Próximamente podrás subir y organizar aquí las mejores fotos y videos de tus fiestas y eventos.
          </p>
          <Image
            src="https://placehold.co/600x300.png"
            alt="Galería en construcción"
            width={600}
            height={300}
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="photo gallery construction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
