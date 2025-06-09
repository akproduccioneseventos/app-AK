
'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Palette, Save, UploadCloud, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export default function DecoracionEventoPage() {
  const { toast } = useToast();
  const [tema, setTema] = useState('');
  const [colorPalette, setColorPalette] = useState<ColorPalette>({
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    accent: '#FFFFFF',
  });
  const [notas, setNotas] = useState('');
  const [moodboardImage, setMoodboardImage] = useState<File | null>(null);
  const [moodboardPreview, setMoodboardPreview] = useState<string | null>(null);

  const handleColorChange = (colorName: keyof ColorPalette, value: string) => {
    setColorPalette(prev => ({ ...prev, [colorName]: value }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMoodboardImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMoodboardPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMoodboardImage(null);
      setMoodboardPreview(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // En una aplicación real, aquí guardarías los datos.
    console.log({ tema, colorPalette, notas, moodboardImageName: moodboardImage?.name });
    toast({
      title: "Diseño Guardado (Simulación)",
      description: "Los detalles de diseño y decoración se han guardado.",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Diseño y Decoración del Evento
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
              <Palette className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-xl">Define la Estética de tu Evento</CardTitle>
                <CardDescription>Establece el tema, colores y sube imágenes de inspiración.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tema-evento" className="text-base">Tema del Evento</Label>
              <Input
                id="tema-evento"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ej: Fiesta Tropical, Noche de Gala, Años 80"
                className="text-base p-3"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base">Paleta de Colores Principal</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: 'Primario', id: 'primary' as keyof ColorPalette },
                  { name: 'Secundario', id: 'secondary' as keyof ColorPalette },
                  { name: 'Acento', id: 'accent' as keyof ColorPalette }
                ].map(colorItem => (
                  <div key={colorItem.id} className="space-y-1">
                    <Label htmlFor={`color-${colorItem.id}`} className="text-sm">{colorItem.name}</Label>
                    <div className="flex items-center gap-2">
                       <Input
                        id={`color-${colorItem.id}`}
                        type="color"
                        value={colorPalette[colorItem.id]}
                        onChange={(e) => handleColorChange(colorItem.id, e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={colorPalette[colorItem.id]}
                        onChange={(e) => handleColorChange(colorItem.id, e.target.value)}
                        className="text-sm p-2 h-10"
                        placeholder="#RRGGBB"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moodboard-upload" className="text-base">Inspiración / Moodboard</Label>
              <Input
                id="moodboard-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {moodboardPreview && (
                <div className="mt-3 p-2 border rounded-md inline-block bg-muted/50">
                  <Image
                    src={moodboardPreview}
                    alt="Vista previa del Moodboard"
                    width={200}
                    height={200}
                    className="rounded object-contain max-h-[200px]"
                    data-ai-hint="moodboard preview event"
                  />
                </div>
              )}
              {!moodboardPreview && (
                <div className="mt-3 p-4 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground h-[150px] bg-muted/30">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <p className="text-sm">Sube una imagen de inspiración</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notas-decoracion" className="text-base">Notas Adicionales de Decoración</Label>
              <Textarea
                id="notas-decoracion"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Detalles sobre flores, iluminación, centros de mesa, etc."
                rows={5}
                className="text-base p-3"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Guardar Diseño y Decoración
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
