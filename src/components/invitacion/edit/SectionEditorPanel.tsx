
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { SeccionBienvenidaEditor } from './SeccionBienvenida';
import { SeccionCabeceraEditor } from './SeccionCabecera';
import { SeccionConfirmacionEditor } from './SeccionConfirmacion';
import { SeccionCuentaRegresivaEditor } from './SeccionCuentaRegresiva';
import { SeccionDetallesEventoEditor } from './SeccionDetallesEvento';
import { SeccionDressCodeEditor } from './SeccionDressCode';
import { SeccionGaleriaEditor } from './SeccionGaleria';
import { SeccionHistoriaEditor } from './SeccionHistoria';
import { SeccionInstagramEditor } from './SeccionInstagram';
import { SeccionItinerarioEditor } from './SeccionItinerario';
import { SeccionRegalos } from './SeccionRegalos';
import { SeccionDespedidaEditor } from './SeccionDespedida';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FiestaEnPlanificacion } from '@/types/fiesta';

interface Props {
    data: InvitacionDigitalData;
    update: (newData: Partial<InvitacionDigitalData>) => void;
    selectedSectionId: string | null;
    fiestaId?: string;
}

export const SectionEditorPanel: React.FC<Props> = ({ data, update, selectedSectionId, fiestaId }) => {
    const selectedSection = data.secciones.find(s => s.id === selectedSectionId);

    const handleSectionDataChange = (newData: any) => {
        if (selectedSection) {
            const newSecciones = data.secciones.map(s => 
                s.id === selectedSection.id ? { ...s, data: newData } : s
            );
            update({ secciones: newSecciones });
        }
    };
    
    const renderEditor = () => {
        if (!selectedSection) return null;
        
        const props = { data: selectedSection.data, update: handleSectionDataChange, fiestaId };

        switch (selectedSection.tipo) {
            case 'bienvenida': return <SeccionBienvenidaEditor {...props} />;
            case 'cabecera': return <SeccionCabeceraEditor {...props} />;
            case 'confirmacion': return <SeccionConfirmacionEditor {...props} />;
            case 'cuentaRegresiva': return <SeccionCuentaRegresivaEditor {...props} />;
            case 'detallesEvento': return <SeccionDetallesEventoEditor {...props} />;
            case 'dressCode': return <SeccionDressCodeEditor {...props} />;
            case 'galeria': return <SeccionGaleriaEditor {...props} />;
            case 'historia': return <SeccionHistoriaEditor {...props} />;
            case 'instagram': return <SeccionInstagramEditor {...props} />;
            case 'itinerario': return <SeccionItinerarioEditor {...props} />;
            case 'regalos': return <SeccionRegalos {...props} />;
            case 'despedida': return <SeccionDespedidaEditor {...props} />;
            default: return <div>Editor no implementado para "{selectedSection.tipo}"</div>;
        }
    }
    
    if (!selectedSection) {
        return (
            <div className="p-4 h-full flex flex-col items-center justify-center text-center">
                 <p className="text-sm text-muted-foreground">Selecciona una sección de la invitación para ver sus opciones de configuración aquí.</p>
            </div>
        );
    }
    
    return (
        <ScrollArea className="h-full">
            <div className="p-4">
                 <Card>
                    <CardHeader>
                        <CardTitle className="capitalize">{selectedSection.tipo}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between space-x-2 border p-3 rounded-md mb-4">
                            <Label htmlFor={`visible-${selectedSection.id}`} className="font-normal">Mostrar esta sección</Label>
                            <Switch 
                                id={`visible-${selectedSection.id}`}
                                checked={selectedSection.data.visible} 
                                onCheckedChange={(checked) => handleSectionDataChange({...selectedSection.data, visible: checked})}
                            />
                        </div>
                        {selectedSection.data.visible && renderEditor()}
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
};
