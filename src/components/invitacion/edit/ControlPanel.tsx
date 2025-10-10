
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { defaultInvitacionDigitalData } from "@/lib/invitacion-digital-defaults";
import type { InvitacionDigitalData, SeccionInvitacion } from "@/types/fiesta";
import { ImageIcon, PlusCircle, Sparkles } from "lucide-react";
import React from 'react';

interface ControlPanelProps {
    data: InvitacionDigitalData;
    update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ data, update }) => {
    
    const handleSectionToggle = (seccionTipo: SeccionInvitacion['tipo'], visible: boolean) => {
        const newSecciones = data.secciones.map(s => 
            s.tipo === seccionTipo ? { ...s, data: { ...s.data, visible } } : s
        );
        update({ secciones: newSecciones });
    };

    const addSection = (tipo: SeccionInvitacion['tipo']) => {
        const defaultSeccion = defaultInvitacionDigitalData.secciones.find(s => s.tipo === tipo);
        if (defaultSeccion && !data.secciones.some(s => s.tipo === tipo)) {
             update({ secciones: [...data.secciones, defaultSeccion] });
        }
    };
    
    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Panel de Control</h2>
            <Accordion type="multiple" defaultValue={['general']} className="w-full">
                <AccordionItem value="general">
                    <AccordionTrigger><Sparkles className="w-4 h-4 mr-2"/>Diseño General</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                        {/* Global settings like template, music, etc. go here */}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};
