'use client';

import React, { useState } from 'react';
import { BookOpen, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getPublicDedications, getSongRequests } from '@/app/actions/social-interactive';
import { getPublicSocialPosts } from '@/app/actions/social-gallery';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { generarLibroFiestaPdf } from '@/lib/pdf/generador-libro-fiesta';

interface DownloadPartyBookButtonProps {
  fiestaId: string;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function DownloadPartyBookButton({
  fiestaId,
  variant = 'outline',
  className = '',
}: DownloadPartyBookButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const [fiesta, posts, dedications, songs] = await Promise.all([
        getFiestaById(fiestaId),
        getPublicSocialPosts(fiestaId),
        getPublicDedications(fiestaId),
        getSongRequests(fiestaId),
      ]);

      if (!fiesta) {
        toast({
          title: 'Fiesta no encontrada',
          description: 'No se pudo obtener los datos del evento.',
          variant: 'destructive',
        });
        return;
      }

      const doc = generarLibroFiestaPdf({
        fiesta,
        posts,
        dedications,
        songs,
      });

      const cleanName = (fiesta.configuracion.nombreEvento || 'Fiesta')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      doc.save(`libro-de-la-fiesta-${cleanName}.pdf`);

      toast({
        title: '¡Libro de la Fiesta generado!',
        description: 'Se descargó el PDF con las dedicatorias y recuerdos.',
      });
    } catch (err: any) {
      console.error('Error generando libro de la fiesta:', err);
      toast({
        title: 'Error al generar el PDF',
        description: err.message || 'No se pudo crear el archivo.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleDownload}
      disabled={downloading}
      className={`font-bold gap-2 rounded-xl transition ${className}`}
    >
      {downloading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Armando libro PDF...</span>
        </>
      ) : (
        <>
          <BookOpen className="h-4 w-4 text-amber-600" />
          <span>Descargar Libro de la Fiesta (PDF)</span>
        </>
      )}
    </Button>
  );
}
