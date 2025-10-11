

'use client';

import type { InvitacionDigitalData, SeccionInvitacion } from '@/types/fiesta';
import { SeccionBienvenidaEditor } from './SeccionBienvenida';
import { SeccionCabeceraEditor } from './SeccionCabecera';
import { SeccionConfirmacionEditor } from './SeccionConfirmacion';
import { SeccionCuentaRegresivaEditor } from './SeccionCuentaRegresiva';
import { SeccionDetallesEventoEditor } from './SeccionDetallesEvento';
import { SeccionDressCodeEditor } from './SeccionDressCode';
import { SeccionGaleriaEditor } from './SeccionGaleria';
import { SeccionHistoriaEditor } from './SeccionHistoria';
import { SeccionItinerarioEditor } from './SeccionItinerario';
import { SeccionRegalos } from './SeccionRegalos';
import { SeccionDespedidaEditor } from './SeccionDespedida';
import { SeccionFooterEditor } from './SeccionFooter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft } from 'lucide-react';
import { FiestaEnPlanificacion } from '@/types/fiesta';

interface Props {
    data: InvitacionDigitalData;
    update: (newData: Partial<InvitacionDigitalData>) => void;
    selectedSectionId: string | null;
    fiestaId?: string | null;
    onClose: () => void;
}

export const SectionEditorPanel: React.FC<Props> = ({ data, update, selectedSectionId, fiestaId, onClose }) => {
    
    const selectedSection = data.secciones.find(s => s.id === selectedSectionId);

    const handleSectionDataChange = (newData: any) => {
        if (selectedSection) {
            const newSecciones = data.secciones.map(s => 
                s.id === selectedSection.id ? { ...s, data: newData } : s
            );
            update({ secciones: newSecciones });
        }
    };

    const handleUpdateCabecera = (newData: Partial<InvitacionDigitalData>) => {
        update(newData);
    };

    const renderEditor = () => {
        if (!selectedSection) return null;
        
        const props = { data: selectedSection.data, update: handleSectionDataChange, fiestaId: fiestaId || undefined };

        switch (selectedSection.tipo) {
            case 'cabecera': return <SeccionCabeceraEditor data={data.cabecera} update={handleUpdateCabecera} fiestaId={fiestaId || undefined} />;
            case 'bienvenida': return <SeccionBienvenidaEditor {...props} />;
            case 'confirmacion': return <SeccionConfirmacionEditor {...props} />;
            case 'cuentaRegresiva': return <SeccionCuentaRegresivaEditor {...props} />;
            case 'detallesEvento': return <SeccionDetallesEventoEditor {...props} />;
            case 'dressCode': return <SeccionDressCodeEditor {...props} />;
            case 'galeria': return <SeccionGaleriaEditor {...props} />;
            case 'historia': return <SeccionHistoriaEditor {...props} />;
            case 'itinerario': return <SeccionItinerarioEditor {...props} />;
            case 'regalos': return <SeccionRegalos {...props} />;
            case 'despedida': return <SeccionDespedidaEditor {...props} />;
            case 'footer': return <SeccionFooterEditor data={data.footer} update={(newData) => update({footer: newData}) } />;
            default: return <div>Editor no implementado para "{selectedSection.tipo}"</div>;
        }
    }
    
    return (
        <ScrollArea className="h-full">
            <div className="p-4">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft className="w-4 h-4 mr-2"/>Panel General</Button>
                        </div>
                         <CardTitle className="capitalize pt-2">{selectedSection?.tipo}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedSection?.tipo !== 'cabecera' && (
                            <div className="flex items-center justify-between space-x-2 border p-3 rounded-md mb-4">
                                <Label htmlFor={`visible-${selectedSectionId}`} className="font-normal">Mostrar esta sección</Label>
                                <Switch 
                                    id={`visible-${selectedSectionId}`}
                                    checked={selectedSection?.data.visible} 
                                    onCheckedChange={(checked) => handleSectionDataChange({...selectedSection?.data, visible: checked})}
                                />
                            </div>
                        )}
                        {selectedSection?.data.visible && renderEditor()}
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
};
