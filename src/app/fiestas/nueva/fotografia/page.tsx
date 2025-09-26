
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, AlertTriangle, Film, Calendar, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual, updateFotografiaYFilmacionFiestaActual as updateFotografia } from '@/app/actions/fiesta-actual';
import type { FotografiaYFilmacionData, EntregaMaterialEstado } from '@/types/fiesta';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_ESTADOS_ENTREGA: EntregaMaterialEstado[] = ['Pendiente', 'En edición', 'En revisión', 'Entregado parcial', 'Entregado completo'];

export default function FotografiaPage() {
    const { toast } = useToast();
    const [formData, setFormData] = useState<FotografiaYFilmacionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const fiesta = await getFiestaActual();
            setFormData(fiesta.fotografiaYFilmacion || { estadoEntrega: 'Pendiente', recibidoPorCliente: false });
        } catch (e) {
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleFormChange = (field: keyof FotografiaYFilmacionData, value: any) => {
        setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const handleDateChange = (field: 'fechaEstimadaEntregaFotos' | 'fechaEstimadaEntregaVideo' | 'fechaEntregaFinal', date?: Date) => {
        handleFormChange(field, date ? date.toISOString() : undefined);
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData) return;
        setIsSaving(true);
        try {
            const result = await updateFotografia(formData);
            if (result.success) {
                toast({ title: "¡Guardado!", description: "La información de fotografía y filmación ha sido actualizada." });
                await loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading || !formData) {
        return <div className="p-8 max-w-2xl mx-auto"><Loader2 className="w-8 h-8 animate-spin"/></div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Film className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Fotografía y Filmación</h1>
                </div>
                <Link href="/fiestas/nueva" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
            </div>
            
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Estado de la Entrega</CardTitle>
                        <CardDescription>Gestiona el proceso de entrega del material fotográfico y de video al cliente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="estado-entrega">Estado General de la Entrega</Label>
                            <Select value={formData.estadoEntrega} onValueChange={(v) => handleFormChange('estadoEntrega', v as EntregaMaterialEstado)}>
                                <SelectTrigger id="estado-entrega"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {ALL_ESTADOS_ENTREGA.map(estado => <SelectItem key={estado} value={estado}>{estado}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40">
                             <Label htmlFor="recibido-cliente" className="text-base font-medium">Material Recibido por el Cliente</Label>
                             <Switch id="recibido-cliente" checked={formData.recibidoPorCliente} onCheckedChange={(val) => handleFormChange('recibidoPorCliente', val)} />
                        </div>
                         {formData.recibidoPorCliente && formData.fechaEntregaFinal && (
                             <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Confirmado el: {new Date(formData.fechaEntregaFinal).toLocaleDateString('es-ES')}</p>
                         )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fecha-fotos">Fecha Estimada Entrega Fotos</Label>
                                <DatePickerDemo selectedDate={formData.fechaEstimadaEntregaFotos ? new Date(formData.fechaEstimadaEntregaFotos) : undefined} onDateChange={(d) => handleDateChange('fechaEstimadaEntregaFotos', d)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fecha-video">Fecha Estimada Entrega Video</Label>
                                <DatePickerDemo selectedDate={formData.fechaEstimadaEntregaVideo ? new Date(formData.fechaEstimadaEntregaVideo) : undefined} onDateChange={(d) => handleDateChange('fechaEstimadaEntregaVideo', d)} />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                           <Label htmlFor="link-fotos">Enlace de Descarga de Fotos (Ej: WeTransfer, Drive)</Label>
                           <Input id="link-fotos" type="url" value={formData.linkDescargaFotos || ''} onChange={(e) => handleFormChange('linkDescargaFotos', e.target.value)} placeholder="https://..."/>
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="link-video">Enlace de Descarga de Video</Label>
                           <Input id="link-video" type="url" value={formData.linkDescargaVideo || ''} onChange={(e) => handleFormChange('linkDescargaVideo', e.target.value)} placeholder="https://..."/>
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="fecha-final">Fecha de Entrega Final (se completa al marcar como recibido)</Label>
                           <DatePickerDemo selectedDate={formData.fechaEntregaFinal ? new Date(formData.fechaEntregaFinal) : undefined} onDateChange={(d) => handleDateChange('fechaEntregaFinal', d)} />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="notas-entrega">Notas Adicionales</Label>
                           <Textarea id="notas-entrega" value={formData.notasEntrega || ''} onChange={(e) => handleFormChange('notasEntrega', e.target.value)} placeholder="Detalles sobre la entrega, feedback, etc." rows={3}/>
                        </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                            Guardar Cambios
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
