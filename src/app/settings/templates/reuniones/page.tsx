
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, ListChecks, PlusCircle, Trash2, Info, MessageSquareText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMeetingMasterTemplate, saveMeetingMasterTemplate, type MeetingMasterTemplate } from '@/app/actions/meeting-checklist';
import { Separator } from '@/components/ui/separator';

export default function MeetingTemplatePage() {
  const { toast } = useToast();
  const [template, setTemplate] = useState<MeetingMasterTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMeetingMasterTemplate();
      setTemplate(data);
    } catch (e) {
      toast({ title: "Error", description: "No se pudo cargar la plantilla.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddItem = () => {
    if (!newItemText.trim() || !template) return;
    const newItem = { id: `master_${Date.now()}`, text: newItemText.trim() };
    setTemplate({ ...template, checklist: [...template.checklist, newItem] });
    setNewItemText('');
  };

  const handleRemoveItem = (id: string) => {
    if (!template) return;
    setTemplate({ ...template, checklist: template.checklist.filter(i => i.id !== id) });
  };

  const handleUpdateItem = (id: string, text: string) => {
    if (!template) return;
    setTemplate({ ...template, checklist: template.checklist.map(i => i.id === id ? { ...i, text } : i) });
  };

  const handleSave = async () => {
    if (!template) return;
    setIsSaving(true);
    try {
      const result = await saveMeetingMasterTemplate(template);
      if (result.success) {
        toast({ title: "Plantilla Actualizada", description: "Todos los nuevos eventos usarán esta lista por defecto." });
      } else throw new Error(result.error);
    } catch (e: any) {
      toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Plantilla Maestra de Reuniones</h1>
        </div>
        <Link href="/settings/templates" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Checklist Predeterminado</CardTitle>
            <CardDescription>Estos puntos aparecerán automáticamente en cada nueva reunión que agendes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={newItemText} 
                onChange={e => setNewItemText(e.target.value)} 
                placeholder="Añadir nuevo punto clave..."
                onKeyDown={e => e.key === 'Enter' && handleAddItem()}
              />
              <Button onClick={handleAddItem} disabled={!newItemText.trim()}><PlusCircle className="w-4 h-4 mr-2"/>Añadir</Button>
            </div>
            <Separator />
            <div className="space-y-2">
              {template?.checklist.map((item) => (
                <div key={item.id} className="flex gap-2 items-center">
                  <Input 
                    value={item.text} 
                    onChange={e => handleUpdateItem(item.id, e.target.value)}
                    className="flex-grow bg-muted/30"
                  />
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800"><MessageSquareText className="w-5 h-5"/>Guía de Consultoría</CardTitle>
            <CardDescription>Escribe aquí los consejos o recordatorios que quieres ver durante la reunión.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={template?.guideNotes || ''} 
              onChange={e => setTemplate(p => p ? {...p, guideNotes: e.target.value} : null)}
              rows={6}
              placeholder="Escribe los puntos de consultoría..."
            />
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
              Guardar Configuración Maestra
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
