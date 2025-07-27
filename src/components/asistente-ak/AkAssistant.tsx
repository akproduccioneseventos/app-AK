
'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, X, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { assistant, type AssistantOutput } from '@/app/ai/flows/assistant-flow';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import armadoRapidoConfig from '@/data/armado-rapido-config.json';
import { useToast } from '@/hooks/use-toast';
import { DatePickerDemo } from '../date-picker-demo';
import { ALL_TIPOS_EVENTO, type TipoEvento } from '@/types/presupuesto';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Step {
    id: 'tipoFiesta' | 'cantidadInvitados' | 'nombreCliente' | 'fechaEvento' | 'confirmacion';
    title: string;
    description: string;
}

const steps: Step[] = [
    { id: 'tipoFiesta', title: 'Tipo de Evento', description: 'Para empezar, cuéntanos qué tipo de evento estás planeando.' },
    { id: 'cantidadInvitados', title: 'Cantidad de Invitados', description: '¿Para cuántas personas sería el evento aproximadamente?' },
    { id: 'nombreCliente', title: 'Tu Nombre', description: 'Para personalizar la propuesta, ¿a nombre de quién la preparamos?' },
    { id: 'fechaEvento', title: 'Fecha del Evento', description: '¿Tienes alguna fecha en mente? Si no, no te preocupes, lo vemos después.' },
    { id: 'confirmacion', title: '¡Listo para Calcular!', description: 'Revisa los datos y generaremos una propuesta inicial para ti.' },
];

export function AkAssistant({ isPage = false }: { isPage?: boolean }) {
    const [isOpen, setIsOpen] = useState(isPage);
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        tipoFiesta: '',
        cantidadInvitados: '50',
        nombreCliente: '',
        fechaEvento: undefined as Date | undefined,
    });
    const [resultado, setResultado] = useState<AssistantOutput | null>(null);
    const { toast } = useToast();

    const handleNext = () => {
      // Validation logic for each step can be added here
      if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
      }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const result = await assistant({
                query: JSON.stringify(formData), // Send all data at once
                history: [], // No history needed for this flow
            });
            setResultado(result);
            setCurrentStep(currentStep + 1); // Move to final step
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al generar el presupuesto.");
            toast({ title: "Error", description: err.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }

    const containerClasses = isPage 
        ? "relative w-full h-full flex flex-col bg-card border rounded-lg" 
        : "fixed bottom-5 right-5 z-50";
        
    const renderStepContent = () => {
        const step = steps[currentStep];
        switch(step.id) {
            case 'tipoFiesta':
                return (
                    <RadioGroup value={formData.tipoFiesta} onValueChange={(v) => setFormData(p => ({...p, tipoFiesta: v}))} className="grid grid-cols-2 gap-3">
                        {ALL_TIPOS_EVENTO.map(tipo => (
                           <Label key={tipo} htmlFor={tipo} className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.tipoFiesta === tipo ? 'border-primary' : 'hover:bg-muted/50'}`}>
                               <RadioGroupItem value={tipo} id={tipo} className="sr-only"/>
                               <span className="font-semibold">{tipo}</span>
                           </Label>
                        ))}
                    </RadioGroup>
                );
            case 'cantidadInvitados':
                return <Input type="number" value={formData.cantidadInvitados} onChange={(e) => setFormData(p => ({...p, cantidadInvitados: e.target.value}))} placeholder="Ej: 50" className="text-center text-lg h-12" />;
            case 'nombreCliente':
                return <Input value={formData.nombreCliente} onChange={(e) => setFormData(p => ({...p, nombreCliente: e.target.value}))} placeholder="Tu nombre y apellido" className="text-center text-lg h-12"/>;
            case 'fechaEvento':
                return <DatePickerDemo selectedDate={formData.fechaEvento} onDateChange={(date) => setFormData(p => ({...p, fechaEvento: date}))} />;
            case 'confirmacion':
                 return (
                    <div className="text-center space-y-4">
                        <p>Hemos recopilado la información necesaria. ¿Listo para crear tu presupuesto inicial?</p>
                        <Button size="lg" onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                            Crear Mi Presupuesto
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    }
    
    const renderFinalStep = () => {
        if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
        if (error) return <p className="text-destructive text-center">{error}</p>;
        if (!resultado) return null;
        return (
             <div className="text-center space-y-4 p-4">
                <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{resultado.response}</ReactMarkdown>
                 {resultado.presupuestoId && (
                    <Button asChild variant="default" size="lg" className="mt-4 w-full">
                        <Link href={`/presupuestos/${resultado.presupuestoId}/ver`}>
                            Ver Presupuesto Detallado <ArrowRight className="w-4 h-4 ml-2"/>
                        </Link>
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className={containerClasses}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className={isPage ? "w-full h-full flex flex-col" : "w-96 h-[32rem] flex flex-col bg-card rounded-xl shadow-2xl border"}
                    >
                        <header className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8"><AvatarImage src="https://placehold.co/40x40/EF4444/FFFFFF.png?text=AK" alt="AK Assistant"/><AvatarFallback>AK</AvatarFallback></Avatar>
                                <h3 className="font-semibold text-sm">Asistente AK</h3>
                            </div>
                            {!isPage && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>}
                        </header>
                        
                        <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                            {currentStep < steps.length ? (
                                <>
                                  <div className="mb-6">
                                    <h4 className="font-bold text-lg text-primary">{steps[currentStep].title}</h4>
                                    <p className="text-muted-foreground text-sm">{steps[currentStep].description}</p>
                                  </div>
                                  <div className="w-full max-w-sm">
                                    {renderStepContent()}
                                  </div>
                                </>
                            ) : (
                                renderFinalStep()
                            )}
                        </div>

                         {currentStep < steps.length - 1 && (
                            <footer className="p-3 border-t flex justify-end">
                                <Button onClick={handleNext}>
                                    Siguiente <ArrowRight className="w-4 h-4 ml-2"/>
                                </Button>
                            </footer>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            {!isPage && !isOpen && (
                 <Button onClick={() => setIsOpen(true)} className="rounded-full w-16 h-16 shadow-lg">
                    <Bot className="h-8 w-8" />
                </Button>
            )}
        </div>
    );
}
