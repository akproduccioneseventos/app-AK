
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, RefreshCw, Send, Users, Palette, Sparkles, PartyPopper, Check, Home, ChefHat, GlassWater, Camera, Music, Gift, Briefcase, Wallet, List, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { AsistentePaso1_TipoFiesta } from '@/components/asistente-ak/Paso1_TipoFiesta';
import { AsistentePaso2_Invitados } from '@/components/asistente-ak/Paso2_Invitados';
import { AsistentePaso3_Decoracion } from '@/components/asistente-ak/Paso3_Decoracion';
import { AsistentePaso4_Catering } from '@/components/asistente-ak/Paso4_Catering';
import { AsistentePaso5_Bebidas } from '@/components/asistente-ak/Paso5_Bebidas';
import { AsistentePaso6_FotoVideo } from '@/components/asistente-ak/Paso6_FotoVideo';
import { AsistentePaso7_Musica } from '@/components/asistente-ak/Paso7_Musica';
import { AsistentePaso8_Reposteria } from '@/components/asistente-ak/Paso8_Reposteria';
import { AsistentePaso9_Entretenimiento } from '@/components/asistente-ak/Paso9_Entretenimiento';
import { AsistentePaso10_Regalos } from '@/components/asistente-ak/Paso10_Regalos';
import { AsistentePaso11_Presupuesto } from '@/components/asistente-ak/Paso11_Presupuesto';
import { AsistentePaso12_Resumen } from '@/components/asistente-ak/Paso12_Resumen';
import { AsistenteModoRapido } from '@/components/asistente-ak/ModoRapido';

import Link from 'next/link';

export interface AsistenteData {
  tipoFiesta: { id: string; nombre: string; costoBase: number } | null;
  invitados: { adultos: number; adolescentes: number; ninos: number };
  estiloDecoracion: { id:string; nombre: string; multiplicadorCosto: number } | null;
  catering: { id: string; nombre: string; costoPorPersona: number } | null;
  bebidas: { id: string; nombre: string; costoPorPersona: number } | null;
  fotoVideo: { id: string; nombre: string; costoBase: number } | null;
  musica: { id: string; nombre: string; costoBase: number } | null;
  reposteria: { id: string; nombre: string; costoBase: number; costoPorPersona: number } | null;
  entretenimiento: { id: string; nombre: string; costoBase: number } | null;
  listaRegalos: boolean | null;
  presupuestoCliente: number;
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(amount);
};


export default function AsistenteAkPage() {
  const [paso, setPaso] = useState(1);
  const [mode, setMode] = useState<'guided' | 'fast'>('guided');
  const [data, setData] = useState<AsistenteData>({
    tipoFiesta: null,
    invitados: { adultos: 50, adolescentes: 0, ninos: 0 },
    estiloDecoracion: null,
    catering: null,
    bebidas: null,
    fotoVideo: null,
    musica: null,
    reposteria: null,
    entretenimiento: null,
    listaRegalos: null,
    presupuestoCliente: 50000,
  });

  const pasos = [
    { numero: 1, nombre: 'Tipo', icon: PartyPopper, fields: ['tipoFiesta'] },
    { numero: 2, nombre: 'Invitados', icon: Users, fields: ['invitados'] },
    { numero: 3, nombre: 'Decoración', icon: Palette, fields: ['estiloDecoracion'] },
    { numero: 4, nombre: 'Catering', icon: ChefHat, fields: ['catering'] },
    { numero: 5, nombre: 'Bebidas', icon: GlassWater, fields: ['bebidas'] },
    { numero: 6, nombre: 'Foto/Video', icon: Camera, fields: ['fotoVideo'] },
    { numero: 7, nombre: 'Música', icon: Music, fields: ['musica'] },
    { numero: 8, nombre: 'Repostería', icon: Cake, fields: ['reposteria'] },
    { numero: 9, nombre: 'Extras', icon: Briefcase, fields: ['entretenimiento'] },
    { numero: 10, nombre: 'Regalos', icon: Gift, fields: ['listaRegalos'] },
    { numero: 11, nombre: 'Presupuesto', icon: Wallet, fields: ['presupuestoCliente'] },
    { numero: 12, nombre: 'Resumen', icon: Check, fields: [] },
  ];
  const TOTAL_PASOS = pasos.length;

  const handleNext = () => {
    setPaso((p) => Math.min(p + 1, TOTAL_PASOS));
  };

  const handlePrev = () => {
    setPaso((p) => Math.max(p - 1, 1));
  };
  
  const handleReset = () => {
      setData({
        tipoFiesta: null,
        invitados: { adultos: 50, adolescentes: 0, ninos: 0 },
        estiloDecoracion: null,
        catering: null,
        bebidas: null,
        fotoVideo: null,
        musica: null,
        reposteria: null,
        entretenimiento: null,
        listaRegalos: null,
        presupuestoCliente: 50000,
      });
      setPaso(1);
      setMode('guided');
  }

  const isPasoCompleto = (pasoNumero: number): boolean => {
      const pasoActual = pasos.find(p => p.numero === pasoNumero);
      if (!pasoActual) return false;
      return pasoActual.fields.every(field => {
          const value = data[field as keyof AsistenteData];
          if (value === null || value === undefined) return false;
          if (typeof value === 'object' && Object.keys(value).length === 0) return false;
          return true;
      })
  }
  
  const presupuestoEstimado = useMemo(() => {
    let base = data.tipoFiesta?.costoBase || 0;
    const totalInvitados = data.invitados.adultos + data.invitados.adolescentes + data.invitados.ninos;

    if(totalInvitados > 0) {
      base += data.catering ? data.catering.costoPorPersona * totalInvitados : 0;
      base += data.bebidas ? data.bebidas.costoPorPersona * totalInvitados : 0;
      base += data.reposteria ? data.reposteria.costoPorPersona * totalInvitados : 0;
    }
    
    if (data.estiloDecoracion) {
        base *= data.estiloDecoracion.multiplicadorCosto;
    }
    
    base += data.fotoVideo?.costoBase || 0;
    base += data.musica?.costoBase || 0;
    base += data.reposteria?.costoBase || 0;
    base += data.entretenimiento?.costoBase || 0;

    return base;
  }, [data]);


  const renderPaso = () => {
    const commonProps = { data, setData, handleNext };
    switch (paso) {
      case 1: return <AsistentePaso1_TipoFiesta {...commonProps} />;
      case 2: return <AsistentePaso2_Invitados {...commonProps} />;
      case 3: return <AsistentePaso3_Decoracion {...commonProps} />;
      case 4: return <AsistentePaso4_Catering {...commonProps} />;
      case 5: return <AsistentePaso5_Bebidas {...commonProps} />;
      case 6: return <AsistentePaso6_FotoVideo {...commonProps} />;
      case 7: return <AsistentePaso7_Musica {...commonProps} />;
      case 8: return <AsistentePaso8_Reposteria {...commonProps} />;
      case 9: return <AsistentePaso9_Entretenimiento {...commonProps} />;
      case 10: return <AsistentePaso10_Regalos {...commonProps} />;
      case 11: return <AsistentePaso11_Presupuesto {...commonProps} />;
      case 12: return <AsistentePaso12_Resumen data={data} presupuestoEstimado={presupuestoEstimado} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (mode === 'guided') {
      return (
        <AnimatePresence mode="wait">
          <motion.div
              key={paso}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
          >
              {renderPaso()}
          </motion.div>
        </AnimatePresence>
      );
    } else { // mode === 'fast'
      return <AsistenteModoRapido data={data} setData={setData} />;
    }
  };

  const isLastStep = paso === TOTAL_PASOS;
  const showGuidedNav = mode === 'guided' && !isLastStep;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-3">
                         <Sparkles className="w-8 h-8 text-primary" />
                         <div>
                            <h1 className="text-xl font-bold font-headline">Asistente AK</h1>
                            <p className="text-xs text-muted-foreground">Arma tu fiesta ideal, paso a paso.</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" onClick={() => setMode(m => m === 'guided' ? 'fast' : 'guided')}>
                            {mode === 'guided' ? <><Zap className="mr-2"/>Armado Rápido</> : <><List className="mr-2"/>Paso a Paso</>}
                        </Button>
                         <Link href="/" passHref>
                            <Button variant="ghost" size="sm"><Home className="mr-2"/>Volver</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </header>

        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {mode === 'guided' && (
                  <>
                    {/* Progress Bar and Steps */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Paso {paso} de {TOTAL_PASOS}</span>
                            <span>{pasos.find(p => p.numero === paso)?.nombre}</span>
                        </div>
                        <Progress value={(paso / TOTAL_PASOS) * 100} className="h-2"/>
                        <ol className="flex justify-between items-center">
                            {pasos.map((p) => (
                            <li key={p.numero} className="flex-1 text-center relative">
                                <div className="flex items-center flex-col">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${paso > p.numero || isPasoCompleto(p.numero) ? 'bg-primary border-primary text-primary-foreground' : paso === p.numero ? 'bg-primary/20 border-primary text-primary' : 'bg-muted border-border'}`}>
                                        {paso > p.numero || isPasoCompleto(p.numero) ? <CheckCircle className="w-5 h-5"/> : <p.icon className="w-5 h-5"/>}
                                    </div>
                                    <p className={`mt-2 text-xs font-medium transition-colors duration-300 ${paso >= p.numero ? 'text-primary' : 'text-muted-foreground'}`}>{p.nombre}</p>
                                </div>
                                {p.numero < TOTAL_PASOS && <div className={`absolute top-4 left-1/2 w-full h-0.5 -translate-x-0 -z-10 ${paso > p.numero || isPasoCompleto(p.numero) ? 'bg-primary' : 'bg-border'}`}></div>}
                            </li>
                            ))}
                        </ol>
                    </div>
                  </>
                )}
                {renderContent()}
            </div>
        </main>

       <footer className="sticky bottom-0 z-10 bg-background/80 backdrop-blur-sm border-t">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={handlePrev} disabled={paso === 1} className={`w-28 transition-opacity ${showGuidedNav ? 'opacity-100' : 'opacity-0'}`}>
                            <ArrowLeft className="mr-2" /> Anterior
                        </Button>
                         <Button onClick={handleReset}>
                            <RefreshCw className="w-4 h-4"/>
                        </Button>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Presupuesto Estimado</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(presupuestoEstimado)}</p>
                    </div>
                    
                    {mode === 'guided' ? (
                       isLastStep ? (
                         <Button disabled className="w-28 opacity-0">Siguiente</Button> // Placeholder for alignment
                       ) : (
                        <Button onClick={handleNext} disabled={!isPasoCompleto(paso)} className="w-28">
                            Siguiente <ArrowRight className="ml-2" />
                        </Button>
                       )
                    ) : (
                        <Button onClick={() => setPaso(TOTAL_PASOS)} className="w-28">
                            Ir al Resumen <ArrowRight className="ml-2" />
                        </Button>
                    )}
                </div>
            </div>
       </footer>
    </div>
  );
}
