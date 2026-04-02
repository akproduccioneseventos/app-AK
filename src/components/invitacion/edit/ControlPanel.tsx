
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultInvitacionDigitalData } from "@/lib/invitacion-digital-defaults";
import type { InvitacionDigitalData, SeccionInvitacion, ColorPalette } from '@/types/fiesta';
import { Sparkles, PlusCircle, Trash2, Edit, Link as LinkIcon, ClipboardCopy, Camera, LayoutTemplate, Loader2 } from "lucide-react";
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import QRCodeStylized from 'qrcode.react';
import { useToast } from "@/hooks/use-toast";
import { getInvitationTemplates, type InvitacionDigitalTemplate } from "@/app/actions/invitacion-digital-templates";
import { Badge } from "@/components/ui/badge";
import { merge, cloneDeep } from 'lodash';

interface ControlPanelProps {
    data: InvitacionDigitalData;
    update: (newData: Partial<InvitacionDigitalData>) => void;
    addSection: (type: SeccionInvitacion['tipo']) => void;
    removeSection: (id: string) => void;
    onSectionClick: (sectionId: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ data, update, addSection, removeSection, onSectionClick }) => {
    
    const { toast } = useToast();
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templates, setTemplates] = useState<InvitacionDigitalTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

    const allPossibleSections = defaultInvitacionDigitalData.secciones.map(s => s.tipo);

    const handleColorChange = (colorType: keyof ColorPalette, value: string) => {
        const newPalette = { ...data.cabecera.paletaColores, [colorType]: value };
        update({ cabecera: { ...data.cabecera, paletaColores: newPalette } });
    };

    const handleCopyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: "Enlace Copiado" });
    };

    const openTemplateModal = async () => {
        setIsTemplateModalOpen(true);
        setIsLoadingTemplates(true);
        try {
            const tpls = await getInvitationTemplates();
            setTemplates(tpls);
        } catch {
            toast({ title: "Error", description: "No se pudieron cargar las plantillas.", variant: "destructive" });
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const applyTemplate = (template: InvitacionDigitalTemplate) => {
        const merged = merge(cloneDeep(defaultInvitacionDigitalData), template);
        update(merged);
        setIsTemplateModalOpen(false);
        toast({ title: "Plantilla aplicada", description: `Se aplicó "${template.name}".` });
    };

    const getFullLink = (path: string, hash?: string) => {
        if (typeof window === 'undefined') return '';
        const fiestaId = new URLSearchParams(window.location.search).get('fiestaId');
        if (!fiestaId) return '';
        return `${window.location.origin}${path.replace('[fiestaId]', fiestaId)}${hash ? `#${hash}` : ''}`;
    }
    
    const downloadQR = (id: string, name: string) => {
        const canvas = document.getElementById(id) as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `${name}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };


    return (
        <div className="p-4 space-y-4">
            {/* Load Template button */}
            <Button variant="outline" className="w-full gap-2" onClick={openTemplateModal}>
                <LayoutTemplate className="w-4 h-4" />
                Cargar Plantilla
            </Button>

            {/* Template picker modal */}
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Plantilla</DialogTitle>
                        <DialogDescription className="flex items-start gap-1.5">
                            <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                            <span>Elige una plantilla para aplicarla a esta invitación. <strong>Los cambios actuales no guardados se perderán</strong> al aplicar una plantilla nueva.</span>
                        </DialogDescription>
                    </DialogHeader>
                    {isLoadingTemplates ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {templates.map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => applyTemplate(tpl)}
                                    className="text-left p-4 border rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all space-y-1.5 group"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-sm">{tpl.name}</span>
                                        <Badge variant="secondary" className="text-[10px] shrink-0">{tpl.category}</Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Estilo: {tpl.plantilla}
                                    </p>
                                </button>
                            ))}
                            {templates.length === 0 && (
                                <p className="col-span-2 text-center text-sm text-muted-foreground py-8">No hay plantillas disponibles.</p>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
                             <div className="space-y-2 mt-4">
                                <Label className="text-sm font-medium flex items-center gap-1.5"><Camera className="w-4 h-4"/>Muro Social</Label>
                                <div className="flex items-center space-x-2">
                                    <Input value={getFullLink('/evento/social/[fiestaId]')} readOnly />
                                    <Button size="icon" variant="outline" onClick={() => handleCopyToClipboard(getFullLink('/evento/social/[fiestaId]'))}><ClipboardCopy className="h-4 w-4" /></Button>
                                </div>
                                <div className="text-center mt-3">
                                    <QRCodeStylized id="qr-social-panel" value={getFullLink('/evento/social/[fiestaId]')} size={80} level="M" />
                                    <Button size="sm" variant="link" onClick={() => downloadQR('qr-social-panel', 'qr-muro-social')}>Descargar QR</Button>
                                </div>
                            </div>
                        </Card>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};
