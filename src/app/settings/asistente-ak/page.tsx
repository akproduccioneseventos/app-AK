
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Bot, Edit, PartyPopper, User, CalendarDays, Users, Save, Loader2, Trash2, PlusCircle, X, GripVertical, BookOpen, Sparkles as SparklesIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAssistantConfig, saveAssistantConfig, type DialogConfig, type DialogStep, type DialogOption } from '@/app/actions/assistant-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getServiciosEmpresa, type ServicioEmpresa } from '@/app/actions/servicios-empresa';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';


const iconMap: Record<string, React.ElementType> = {
  PartyPopper, Users, User, CalendarDays, Sparkles: SparklesIcon
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
                                        {step.opciones.map(opt => <Badge key={opt.id} variant={opt.type === 'service' ? 'default' : 'secondary'}>{opt.label}</Badge>)}
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
    
    // --- Modal State ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<DialogStep | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
    const [newOptionText, setNewOptionText] = useState('');
    const questionTextareaRef = useRef<HTMLTextAreaElement>(null);
    
    // --- Service Catalog Modal State ---
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [catalog, setCatalog] = useState<ServicioEmpresa[]>([]);
    const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);


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
    
     const loadCatalog = useCallback(async () => {
        setIsLoadingCatalog(true);
        try {
            const services = await getServiciosEmpresa();
            setCatalog(services.filter(s => s.tipoItem === 'Servicio'));
        } catch (e: any) {
            toast({ title: "Error", description: "No se pudo cargar el catálogo de servicios.", variant: "destructive" });
        } finally {
            setIsLoadingCatalog(false);
        }
    }, [toast]);

    useEffect(() => {
        loadConfig();
        loadCatalog();
    }, [loadConfig, loadCatalog]);
    
    const openEditModal = (step: DialogStep, index: number) => {
        setCurrentStep(JSON.parse(JSON.stringify(step))); // Deep copy
        setCurrentStepIndex(index);
        setIsEditModalOpen(true);
    };

    const handleModalInputChange = (field: keyof DialogStep, value: string) => {
        setCurrentStep(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleAddTextOption = () => {
        if (newOptionText.trim() && currentStep) {
            const existingOptions = currentStep.opciones || [];
            const newId = `opt_${newOptionText.trim().toLowerCase().replace(/\s+/g, '-')}`;

            if(existingOptions.some(opt => opt.id === newId)) {
                toast({title: "Opción Duplicada", description: "Esta opción de texto ya existe.", variant: "default"});
                return;
            }
            const newOption: DialogOption = {
                id: newId,
                type: 'text',
                label: newOptionText.trim()
            };
            setCurrentStep(prev => prev ? ({ ...prev, opciones: [...(prev.opciones || []), newOption] }) : null);
            setNewOptionText('');
        }
    };

    const handleAddServiceOption = (service: ServicioEmpresa) => {
         if (currentStep) {
            const existingOptions = currentStep.opciones || [];
            if(existingOptions.some(opt => opt.id === service.id)) {
                toast({title: "Servicio Duplicado", description: "Este servicio ya ha sido añadido a las opciones.", variant: "default"});
                return;
            }
            const newOption: DialogOption = {
                id: service.id,
                type: 'service',
                label: service.nombre,
                serviceId: service.id,
            };
            setCurrentStep(prev => prev ? ({ ...prev, opciones: [...(prev.opciones || []), newOption] }) : null);
            setIsCatalogModalOpen(false);
        }
    };


    const handleRemoveOption = (optionIdToRemove: string) => {
        setCurrentStep(prev => prev ? ({ ...prev, opciones: (prev.opciones || []).filter(opt => opt.id !== optionIdToRemove) }) : null);
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
            setTimeout(() => { textarea.focus(); textarea.selectionStart = textarea.selectionEnd = start + placeholder.length; }, 0);
        }
    };

    const handleSaveStep = async () => {
        if (!currentStep || !currentStep.pregunta.trim() || currentStepIndex === null || !config) return;
        const newConfig = { ...config };
        newConfig.pasos[currentStepIndex] = currentStep;
        await saveAndReload(newConfig);
        setIsEditModalOpen(false);
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
        const newStep: DialogStep = { id: `step_${Date.now()}`, title: "Nuevo Paso sin Título", pregunta: "¿Cuál es tu pregunta?", icon: "Users" };
        const newConfig = { ...config, pasos: [...config.pasos, newStep] };
        setConfig(newConfig);
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
            toast({ title: "¡Éxito!", description: message });
        } catch(e: any) {
             toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const filteredCatalog = catalog.filter(s => s.nombre.toLowerCase().includes(catalogSearchTerm.toLowerCase()));

    if (isLoading || !config) {
        return ( <div className="max-w-xl mx-auto space-y-8"><Skeleton className="h-12 w-full" /><Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-40 w-full"/></CardContent></Card></div>)
    }

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Paso: {currentStep?.title}</DialogTitle>
                        <DialogDescription>Modifica la pregunta y las opciones de respuesta para este paso.</DialogDescription>
                    </DialogHeader>
                    {currentStep && (
                    <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="space-y-2"><Label htmlFor="step-title">Título del Paso</Label><Input id="step-title" value={currentStep.title || ''} onChange={(e) => handleModalInputChange('title', e.target.value)} /></div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><Label htmlFor="question-text">Texto de la Pregunta</Label><Button type="button" size="sm" variant="link" onClick={handleInsertPlaceholder} className="text-xs p-0 h-auto">Insertar Nombre del Cliente</Button></div>
                            <Textarea ref={questionTextareaRef} id="question-text" value={currentStep.pregunta || ''} onChange={e => handleModalInputChange('pregunta', e.target.value)} rows={3}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Opciones de Respuesta (Botones)</Label>
                            {(currentStep.opciones || []).length > 0 && (
                                <div className="space-y-2 p-2 border rounded-md bg-muted/50">
                                {currentStep.opciones?.map(opt => (
                                    <div key={opt.id} className="flex items-center justify-between bg-background p-1.5 rounded">
                                        <Badge variant={opt.type === 'service' ? 'default' : 'secondary'}>{opt.type === 'service' ? 'Servicio:' : 'Texto:'} {opt.label}</Badge>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveOption(opt.id)}><X className="h-3 w-3"/></Button>
                                    </div>
                                ))}
                                </div>
                            )}
                             <div className="flex gap-2">
                                <Input value={newOptionText} onChange={e => setNewOptionText(e.target.value)} placeholder="Añadir opción de texto..."/>
                                <Button type="button" variant="outline" onClick={handleAddTextOption}>Añadir Opción</Button>
                            </div>
                            <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
                                <DialogTrigger asChild><Button type="button" variant="outline" className="w-full"><BookOpen className="w-4 h-4 mr-2"/>Añadir Servicio del Catálogo</Button></DialogTrigger>
                                <DialogContent><DialogHeader><DialogTitle>Seleccionar Servicio</DialogTitle></DialogHeader>
                                    <Input placeholder="Buscar servicio..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="my-2"/>
                                    <ScrollArea className="h-64 border rounded-md"><div className="p-2 space-y-1">
                                        {filteredCatalog.map(s => <Button key={s.id} variant="ghost" className="w-full justify-start" onClick={() => handleAddServiceOption(s)}>{s.nombre}</Button>)}
                                    </div></ScrollArea>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    )}
                    <DialogFooter><Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveStep} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}Guardar Cambios</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><BrainCircuit className="w-10 h-10 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Asistente AK</h1></div>
                <Link href="/settings" passHref><Button variant="outline"><ArrowLeft className="mr-2" /> Volver</Button></Link>
            </div>
             <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-background rounded-md border border-blue-200"><SparklesIcon className="w-6 h-6 text-blue-600"/></div>
                    <div>
                        <CardTitle className="font-headline text-lg text-blue-800">Catálogo de Servicios del Asistente</CardTitle>
                        <CardDescription className="text-blue-700/80">Los servicios que el asistente puede ofrecer se gestionan en el catálogo general.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                     <Link href="/empresa/servicios" passHref><Button variant="secondary" className="w-full">Ir al Catálogo de Servicios</Button></Link>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle className="font-headline text-2xl">Flujo del Diálogo</CardTitle><CardDescription>Edita y reordena las preguntas que el asistente usará para conversar con los clientes.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={config.pasos.map(p => p.id)} strategy={verticalListSortingStrategy}><div className="space-y-4">
                            {config.pasos.map((step, index) => <SortableStep key={step.id} step={step} index={index} onEdit={openEditModal} onDelete={handleDeleteStep} />)}
                        </div></SortableContext>
                    </DndContext>
                    <Button variant="outline" className="w-full border-dashed" onClick={handleAddStep}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Nuevo Paso</Button>
                </CardContent>
            </Card>
        </div>
    );
}
      
    

    

