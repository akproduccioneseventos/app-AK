'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Wand2, Heart, UploadCloud, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updateDecoracion } from '@/app/actions/fiesta/decoracion.actions';
import type { FiestaEnPlanificacion, MoodboardItem } from '@/types/fiesta';
import { UploadButton } from '@/components/invitacion/edit/UploadButton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ClientMoodboardPage({ params }: { params: { fiestaId: string } }) {
  const fiestaId = params.fiestaId;
  const { toast } = useToast();
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFiestaById(fiestaId);
      setFiesta(data);
    } catch (e) {
      toast({ title: "Error al cargar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleLike = async (itemId: string) => {
    if (!fiesta || !fiesta.decoracion) return;
    
    const items = (fiesta.decoracion.moodboardItems || []).map(i => 
        i.id === itemId ? { ...i, likedByClient: !i.likedByClient } : i
    );
    
    const updatedDecoracion = { ...fiesta.decoracion, moodboardItems: items };
    
    // Optimistic UI
    setFiesta({ ...fiesta, decoracion: updatedDecoracion });

    try {
        await updateDecoracion(fiestaId, updatedDecoracion);
        toast({ title: "Preferencia guardada" });
    } catch (e) {
        loadData(); // Revert on error
    }
  };

  const handleUploadFromClient = async (url: string) => {
    if (!fiesta || !fiesta.decoracion) return;
    
    const newItem: MoodboardItem = {
        id: `mood_client_${Date.now()}`,
        url,
        uploadedBy: 'Cliente',
        likedByClient: true,
        timestamp: new Date().toISOString()
    };

    const updatedDecoracion = { 
        ...fiesta.decoracion, 
        moodboardItems: [...(fiesta.decoracion.moodboardItems || []), newItem] 
    };

    setIsProcessing(true);
    try {
        await updateDecoracion(fiestaId, updatedDecoracion);
        toast({ title: "¡Foto añadida!", description: "Tu organizador verá esta sugerencia." });
        await loadData();
    } catch (e) {
        toast({ title: "Error al subir", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  const moodItems = fiesta?.decoracion?.moodboardItems || [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white">
                        <Wand2 className="w-6 h-6"/>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 font-headline uppercase">Dream Designer</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tablero de Inspiración del Evento</p>
                    </div>
                </div>
                <Link href={`/portal?fiestaId=${fiestaId}`} passHref>
                    <Button variant="outline" className="rounded-xl border-slate-200"><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Portal</Button>
                </Link>
            </header>

            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-md">
                <CardHeader className="bg-slate-50 p-6 border-b border-slate-100">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-800">Tu Mural de Sueños</CardTitle>
                    <CardDescription>Marca con un corazón las ideas que más te gusten o sube tus propias fotos de referencia.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-4 items-start">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0"/>
                        <p className="text-sm text-blue-700 font-medium">
                            Usa este espacio para que definamos juntos la estética de la fiesta. Haz clic en el corazón para decirnos qué fotos representan mejor tu visión.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {moodItems.map((item) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative aspect-square rounded-[2rem] overflow-hidden border shadow-sm group bg-white"
                                >
                                    <NextImage src={item.url} alt="inspiración" layout="fill" objectFit="cover" className="transition-transform duration-1000 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                    <button 
                                        onClick={() => handleToggleLike(item.id)}
                                        className={cn(
                                            "absolute bottom-4 right-4 p-3 rounded-2xl shadow-2xl transition-all duration-300 transform active:scale-90",
                                            item.likedByClient ? "bg-rose-500 text-white" : "bg-white/90 text-slate-400 hover:text-rose-500 backdrop-blur-sm"
                                        )}
                                    >
                                        <Heart className={cn("w-6 h-6", item.likedByClient && "fill-current")} />
                                    </button>
                                    {item.description && (
                                        <div className="absolute bottom-4 left-4 right-16 p-2">
                                            <p className="text-white text-xs font-bold leading-tight line-clamp-2">{item.description}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Upload Slot */}
                        <div className="aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center group hover:bg-white hover:border-primary/30 transition-all">
                            <UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-primary transition-colors mb-2"/>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">¿Tienes una idea?</p>
                            <UploadButton onUrlChange={handleUploadFromClient} fiestaId={fiestaId} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
