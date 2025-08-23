'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Bot, Edit, PartyPopper, User, CalendarDays, Users, Save, Loader2, Trash2, PlusCircle, X, GripVertical, CornerDownLeft, RefreshCcw } from 'lucide-react';
import { AkAssistant } from '@/components/asistente-ak/AkAssistant';
import { useToast } from '@/hooks/use-toast';
import { getAssistantConfig, saveAssistantConfig, type DialogConfig, type DialogStep } from '@/app/actions/assistant-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const iconMap: Record<string, React.ElementType> = {
  PartyPopper, Users, User, CalendarDays,
};

function SortableStep({ step, index, onEdit, onDelete }: { step: DialogStep, index: number, onEdit: (step: DialogStep, index: number) => void, onDelete: (index: number) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const Icon = iconMap[step.icon || 'Users'] || Users;

    return (
        <Card ref={setNodeRef} style={style} className="shadow-sm bg-muted/30">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-3 flex-grow">
                        <div {...listeners} {...attributes} className="cursor-grab p-1 text-muted-foreground mt-1"><GripVertical className="w-5 h-5" /></div>
                        <div className="p-2 bg-background rounded-md border flex-shrink-0"><Icon className="w-5 h-5 text-primary"/></div>
                        <div className="flex-grow">
                            <CardTitle className="text-lg">{index + 1}. {step.title}</CardTitle>
                            <CardDescription className="text-xs">Pregunta del Asistente:</CardDescription>
                            <p className="p-3 bg-background rounded-md border text-sm italic mt-2">"{step.pregunta}"</p>
                            {step.opciones && step.opciones.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs text-muted-foreground mb-1">Opciones de respuesta:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {step.opciones.map(opt => <Badge key={opt} variant="secondary">{opt}</Badge>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(step, index)}><Edit className="w-4 h-4 mr-2"/>Editar</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(index)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

export default function AsistenteAkConfigPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<DialogConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<DialogStep | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
    
    const [newOption, setNewOption] = useState('');
    const [simulatorKey, setSimulatorKey] = useState(0);
    const questionTextareaRef = useRef<HTMLTextAreaElement>(null);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const loadConfig = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedConfig = await getAssistantConfig();
            setConfig(fetchedConfig);
        } catch (e: any) {
            toast({ title: "Error", description: "No se pudo cargar la configuración del asistente.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);
    
    const openEditModal = (step: DialogStep, index: number) => {
        setCurrentStep(JSON.parse(JSON.stringify(step)));
        setCurrentStepIndex(index);
        setIsModalOpen(true);
    };

    const handleModalInputChange = (field: keyof DialogStep, value: string) => {
        setCurrentStep(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleAddOption = () => {
        if (newOption.trim() && currentStep && !currentStep.opciones?.includes(newOption.trim())) {
            setCurrentStep(prev => prev ? ({ ...prev, opciones: [...(prev.opciones || []), newOption.trim()] }) : null);
            setNewOption('');
        }
    };

    const handleRemoveOption = (optionToRemove: string) => {
        setCurrentStep(prev => prev ? ({ ...prev, opciones: (prev.opciones || []).filter(opt => opt !== optionToRemove) }) : null);
    };

    const handleInsertPlaceholder = () => {
        const textarea = questionTextareaRef.current;
        if (textarea && currentStep) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const placeholder = "{{{nombreCliente}}}";
            const newText = text.substring(0, start) + placeholder + text.substring(end);
            
            handleModalInputChange('pregunta', newText);

            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
            }, 0);
        }
    };


    const handleSaveStep = async () => {
        if (!currentStep || !currentStep.pregunta.trim() || currentStepIndex === null || !config) return;
        
        const newConfig = { ...config };
        newConfig.pasos[currentStepIndex] = currentStep;

        await saveAndReload(newConfig);
        setIsModalOpen(false);
    };
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id && config) {
            const oldIndex = config.pasos.findIndex(p => p.id === active.id);
            const newIndex = config.pasos.findIndex(p => p.id === over.id);
            const newPasos = arrayMove(config.pasos, oldIndex, newIndex);
            saveAndReload({ ...config, pasos: newPasos }, "Orden guardado.");
        }
    };

    const handleAddStep = () => {
        if (!config) return;
        const newStep: DialogStep = {
            id: `step_${Date.now()}`,
            title: "Nuevo Paso sin Título",
            pregunta: "¿Cuál es tu pregunta?",
            icon: "Users"
        };
        const newConfig = { ...config, pasos: [...config.pasos, newStep] };
        setConfig(newConfig); // Optimistically update UI
        openEditModal(newStep, config.pasos.length);
    };

    const handleDeleteStep = async (index: number) => {
        if (!config || config.pasos.length <= 1) {
            toast({ title: "Acción no permitida", description: "Debe haber al menos un paso en el flujo.", variant: "destructive" });
            return;
        }
        const newConfig = { ...config, pasos: config.pasos.filter((_, i) => i !== index) };
        await saveAndReload(newConfig, "Paso eliminado correctamente.");
    };

    const saveAndReload = async (newConfig: DialogConfig, message: string = "Configuración guardada.") => {
         setIsSaving(true);
        try {
            await saveAssistantConfig(newConfig);
            setConfig(newConfig);
            setSimulatorKey(prev => prev + 1);
            toast({ title: "¡Éxito!", description: message });
        } catch(e: any) {
             toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !config) {
        return (
             <div className="max-w-4xl mx-auto space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><BrainCircuit className="w-10 h-10 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Asistente AK</h1></div>
                    <Skeleton className="h-10 w-24" />
                </div>
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full"/></CardContent></Card>
                 <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-40 w-full"/></CardContent></Card>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Paso: {currentStep?.title}</DialogTitle>
                        <DialogDescription>Modifica la pregunta y las opciones de respuesta para este paso.</DialogDescription>
                    </DialogHeader>
                    {currentStep && (
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="step-title">Título del Paso</Label>
                           <Input id="step-title" value={currentStep.title || ''} onChange={(e) => handleModalInputChange('title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="question-text">Texto de la Pregunta</Label>
                                <Button type="button" size="sm" variant="link" onClick={handleInsertPlaceholder} className="text-xs p-0 h-auto">Insertar Nombre del Cliente</Button>
                            </div>
                            <Textarea ref={questionTextareaRef} id="question-text" value={currentStep.pregunta || ''} onChange={e => handleModalInputChange('pregunta', e.target.value)} rows={3}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Opciones de Respuesta</Label>
                            {(currentStep.opciones || []).length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                                {currentStep.opciones?.map(opt => (
                                    <Badge key={opt} variant="secondary" className="text-sm py-1">
                                        {opt}
                                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-1.5" onClick={() => handleRemoveOption(opt)}><X className="h-3 w-3"/></Button>
                                    </Badge>
                                ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Input value={newOption} onChange={e => setNewOption(e.target.value)} placeholder="Añadir nueva opción..." onKeyDown={(e) => {if(e.key === 'Enter'){ e.preventDefault(); handleAddOption();}}}/>
                                <Button type="button" variant="outline" onClick={handleAddOption}>Añadir</Button>
                            </div>
                        </div>
                    </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveStep} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="w-10 h-10 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Asistente AK</h1>
                </div>
                <Link href="/settings" passHref>
                    <Button variant="outline"><ArrowLeft className="mr-2" /> Volver a Configuración</Button>
                </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Flujo del Diálogo</CardTitle>
                            <CardDescription>
                                Edita y reordena las preguntas que el asistente usará para conversar con los clientes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={config.pasos.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-4">
                                        {config.pasos.map((step, index) => (
                                           <SortableStep key={step.id} step={step} index={index} onEdit={openEditModal} onDelete={handleDeleteStep} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                             <Button variant="outline" className="w-full border-dashed" onClick={handleAddStep}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Nuevo Paso</Button>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-1">
                     <Card className="sticky top-20">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="font-headline text-xl">Simulador de Chat</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setSimulatorKey(prev => prev + 1)} title="Reiniciar Chat">
                                    <RefreshCcw className="w-4 h-4 text-muted-foreground"/>
                                </Button>
                            </div>
                             <CardDescription>
                                Prueba el flujo de conversación en tiempo real.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="h-[450px] w-full">
                             <AkAssistant key={simulatorKey} isPage />
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
