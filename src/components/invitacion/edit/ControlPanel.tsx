
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultInvitacionDigitalData } from "@/lib/invitacion-digital-defaults";
import type { InvitacionDigitalData, SeccionInvitacion, ColorPalette } from '@/types/fiesta';
import { Sparkles, PlusCircle, Trash2, Edit, Link as LinkIcon, QrCode, ClipboardCopy } from "lucide-react";
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import QRCodeStylized from 'qrcode.react';
import { useToast } from "@/hooks/use-toast";

interface ControlPanelProps {
    data: InvitacionDigitalData;
    update: (newData: Partial<InvitacionDigitalData>) => void;
    addSection: (type: SeccionInvitacion['tipo']) => void;
    removeSection: (id: string) => void;
    onSectionClick: (sectionId: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ data, update, addSection, removeSection, onSectionClick }) => {
    
    const { toast } = useToast();

    const allPossibleSections = defaultInvitacionDigitalData.secciones.map(s => s.tipo);

    const handleColorChange = (colorType: keyof ColorPalette, value: string) => {
        const newPalette = { ...data.cabecera.paletaColores, [colorType]: value };
        update({ cabecera: { ...data.cabecera, paletaColores: newPalette } });
    };

    const handleCopyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: "Enlace Copiado" });
    };

    const getFullLink = (path: string, hash?: string) => {
        if (typeof window === 'undefined') return '';
        const fiestaId = new URLSearchParams(window.location.search).get('fiestaId');
        if (!fiestaId) return '';
        return `${window.location.origin}${path.replace('[fiestaId]', fiestaId)}${hash ? `#${hash}` : ''}`;
    }

    return (
        <div className="p-4 space-y-4">
            <Accordion type="multiple" defaultValue={['general', 'secciones']} className="w-full">
                <AccordionItem value="general">
                    <AccordionTrigger><Sparkles className="w-4 h-4 mr-2"/>Diseño General</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
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
                                    <SelectItem value="Allegria">Allegria (Moderno y Fotográfico)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label className="font-medium">Paleta de Colores</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {(['primary', 'secondary', 'accent'] as Array<keyof ColorPalette>).map(key => (
                                <div key={key} className="space-y-1">
                                <Label htmlFor={`color-${key}`} className="text-xs capitalize">{key}</Label>
                                <div className="flex items-center gap-1">
                                    <Input type="color" id={`color-picker-${key}`} value={data.cabecera.paletaColores?.[key] || '#000000'} onChange={e => handleColorChange(key, e.target.value)} className="w-8 h-8 p-0.5 aspect-square"/>
                                    <Input type="text" id={`color-hex-${key}`} value={data.cabecera.paletaColores?.[key] || '#000000'} onChange={e => handleColorChange(key, e.target.value)} className="h-8 text-xs" placeholder="#RRGGBB"/>
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="plantilla-musica">URL Música de Fondo (MP3)</Label>
                            <Input id="plantilla-musica" value={data.musicaFondoUrl || ''} onChange={e => update({musicaFondoUrl: e.target.value})} placeholder="https://..."/>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="secciones">
                    <AccordionTrigger>Secciones de la Invitación</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                        {data.secciones.map(seccion => (
                            <div key={seccion.id} className="flex items-center justify-between p-2 border rounded-md bg-background">
                                <span className="text-sm capitalize">{seccion.tipo}</span>
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onSectionClick?.(seccion.id)}>
                                        <Edit className="w-4 h-4"/>
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeSection(seccion.id)}>
                                        <Trash2 className="w-4 h-4"/>
                                    </Button>
                                </div>
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
                 <AccordionItem value="links">
                    <AccordionTrigger><LinkIcon className="w-4 h-4 mr-2"/>Enlaces y QR</AccordionTrigger>
                    <AccordionContent>
                        <Card className="bg-muted/40 p-3 mt-2">
                            <CardDescription className="text-xs mb-2">Usa estos enlaces y QR para integrar partes de tu invitación en diseños externos.</CardDescription>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Enlace RSVP (Confirmar Asistencia)</Label>
                                <div className="flex items-center space-x-2">
                                    <Input value={getFullLink('/evento/actual', 'confirmacion')} readOnly />
                                    <Button size="icon" variant="outline" onClick={() => handleCopyToClipboard(getFullLink('/evento/actual', 'confirmacion'))}><ClipboardCopy className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};
