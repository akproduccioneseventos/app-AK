
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
    const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('all');

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
        // Pre-select the filter matching the current category
        setTemplateCategoryFilter(data.category || 'all');
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
                    {/* Category filter buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        {(['all', 'Boda', 'XV Años', 'Cumpleaños', 'Infantil', 'General'] as const).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setTemplateCategoryFilter(cat)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${templateCategoryFilter === cat ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                            >
                                {cat === 'all' ? '🌐 Todas' : cat === 'Boda' ? '💍 Bodas' : cat === 'XV Años' ? '👑 XV Años' : cat === 'Cumpleaños' ? '🎂 Cumpleaños' : cat === 'Infantil' ? '🎈 Infantil' : '🎉 General'}
                            </button>
                        ))}
                    </div>
                    {isLoadingTemplates ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                            {templates.filter(tpl => templateCategoryFilter === 'all' || tpl.category === templateCategoryFilter).map(tpl => {
                                const palette = tpl.cabecera?.paletaColores;
                                const primary = palette?.primary ?? '#8b5cf6';
                                const secondary = palette?.secondary ?? '#c4b5fd';
                                const accent = palette?.accent ?? '#ede9fe';
                                const categoryEmoji = tpl.category === 'XV Años' ? '👑' : tpl.category === 'Boda' ? '💍' : tpl.category === 'Cumpleaños' ? '🎂' : tpl.category === 'Infantil' ? '🎈' : '🎉';
                                return (
                                <button
                                    key={tpl.id}
                                    onClick={() => applyTemplate(tpl)}
                                    className="relative overflow-hidden rounded-2xl border-2 border-white/20 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 group text-left"
                                    style={{ aspectRatio: '9/16' }}
                                    title={tpl.name}
                                >
                                    {/* Gradient background */}
                                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}ee 0%, ${secondary}cc 50%, ${accent}88 100%)` }} />
                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 text-center">
                                        <div className="text-3xl mb-1.5 drop-shadow-lg">{categoryEmoji}</div>
                                        <div className="text-white text-[11px] font-bold drop-shadow-md leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                                            {tpl.cabecera?.protagonista1 || 'Valentina'}
                                        </div>
                                        <div className="flex gap-1 mt-2">
                                            <div className="w-4 h-1 rounded-full" style={{ backgroundColor: primary }} />
                                            <div className="w-4 h-1 rounded-full" style={{ backgroundColor: secondary }} />
                                            <div className="w-4 h-1 rounded-full" style={{ backgroundColor: accent }} />
                                        </div>
                                    </div>
                                    {/* Footer */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-2 py-1.5">
                                        <p className="text-white text-[10px] font-bold truncate">{tpl.name}</p>
                                        <p className="text-white/60 text-[9px]">{tpl.plantilla === 'Grazia' ? 'Clásica' : 'Moderna'}</p>
                                    </div>
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xl" style={{ color: primary }}>Aplicar</span>
                                    </div>
                                </button>
                                );
                            })}
                            {templates.filter(tpl => templateCategoryFilter === 'all' || tpl.category === templateCategoryFilter).length === 0 && (
                                <p className="col-span-3 text-center text-sm text-muted-foreground py-8">No hay plantillas disponibles para esta categoría.</p>
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
                                    <SelectItem value="Infantil">Infantil</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="plantilla-estilo">Estilo Visual</Label>
                             <Select value={data.plantilla} onValueChange={v => update({plantilla: v as any})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Grazia">Clásica Elegante</SelectItem>
                                    <SelectItem value="Allegria">Moderna Vibrante</SelectItem>
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
