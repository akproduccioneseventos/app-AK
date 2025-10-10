
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { defaultInvitacionDigitalData } from "@/lib/invitacion-digital-defaults";
import type { InvitacionDigitalData, SeccionInvitacion } from "@/types/fiesta";
import { ImageIcon, PlusCircle, Sparkles, Trash2 } from "lucide-react";
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ControlPanelProps {
    data: InvitacionDigitalData;
    update: (newData: Partial<InvitacionDigitalData>) => void;
    addSection: (type: SeccionInvitacion['tipo']) => void;
    removeSection: (id: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ data, update, addSection, removeSection }) => {
    
    const allPossibleSections = defaultInvitacionDigitalData.secciones.map(s => s.tipo);

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Panel de Control</h2>
            <Accordion type="multiple" defaultValue={['general']} className="w-full">
                <AccordionItem value="general">
                    <AccordionTrigger><Sparkles className="w-4 h-4 mr-2"/>Diseño General</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="plantilla-nombre">Nombre Plantilla</Label>
                            <Input id="plantilla-nombre" value={data.name || ''} onChange={e => update({name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="plantilla-categoria">Categoría</Label>
                            <Select value={data.category} onValueChange={v => update({category: v as any})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Boda">Boda</SelectItem>
                                    <SelectItem value="XV Años">XV Años</SelectItem>
                                    <SelectItem value="Cumpleaños">Cumpleaños</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="plantilla-estilo">Estilo Visual</Label>
                             <Select value={data.plantilla} onValueChange={v => update({plantilla: v as any})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Grazia">Grazia (Clásico y Elegante)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="plantilla-musica">URL Música de Fondo (MP3)</Label>
                            <Input id="plantilla-musica" value={data.musicaFondoUrl || ''} onChange={e => update({musicaFondoUrl: e.target.value})} placeholder="https://..."/>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="secciones">
                    <AccordionTrigger>Secciones de la Invitación</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        {data.secciones.map(seccion => (
                            <div key={seccion.id} className="flex items-center justify-between p-2 border rounded-md">
                                <span className="text-sm">{seccion.tipo}</span>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeSection(seccion.id)}>
                                    <Trash2 className="w-4 h-4"/>
                                </Button>
                            </div>
                        ))}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full mt-2"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Sección</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {allPossibleSections.map(tipo => (
                                    <DropdownMenuItem key={tipo} onClick={() => addSection(tipo)} disabled={data.secciones.some(s => s.tipo === tipo)}>
                                        {tipo}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};
