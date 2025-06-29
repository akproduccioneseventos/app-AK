
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SocialGalleryPage({ params }: { params: { fiestaId: string } }) {

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <Camera className="w-12 h-12 mx-auto text-primary mb-3" />
          <CardTitle className="font-headline text-2xl">Galería Social Interactiva</CardTitle>
          <CardDescription>¡Próximamente!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estamos construyendo esta sección. Pronto podrás subir y ver las fotos del evento aquí mismo.
          </p>
        </CardContent>
        <CardFooter>
            <Link href={`/evento/actual`} passHref className="w-full">
                <Button variant="outline" className="w-full">Volver al Evento</Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
