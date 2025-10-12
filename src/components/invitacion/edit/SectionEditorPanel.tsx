
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
import { SeccionRedesSocialesEditor } from './SeccionRedesSociales';
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
                s.id === selectedSection.id ? { ...s, data: {...s.data, ...newData} } : s
            );
            update({ secciones: newSecciones });
        }
    };
    
    const renderEditor = () => {
        if (!selectedSection) return null;
        
        let props: any;

        if (selectedSection.tipo === 'cabecera') {
            props = { data: data.cabecera, update: (newData: any) => update({ cabecera: { ...data.cabecera, ...newData } }), fiestaId: fiestaId || undefined };
            return <SeccionCabeceraEditor {...props} />;
        }
        
        if (selectedSection.tipo === 'despedida') {
            props = { data: data.despedida, update: (newData: any) => update({ despedida: { ...data.despedida, ...newData } }) };
            return <SeccionDespedidaEditor {...props} />;
        }
        
         if (selectedSection.tipo === 'dressCode') {
            props = { data: data.dressCode, update: (newData: any) => update({ dressCode: { ...data.dressCode, ...newData } }), fiestaId: fiestaId || undefined };
            return <SeccionDressCodeEditor {...props} />;
        }
        
        if (selectedSection.tipo === 'historia') {
            props = { data: data.historia, update: (newData: any) => update({ historia: { ...data.historia, ...newData } }), fiestaId: fiestaId || undefined };
            return <SeccionHistoriaEditor {...props} />;
        }
        
        if (selectedSection.tipo === 'itinerario') {
            props = { data: data.itinerario, update: (newData: any) => update({ itinerario: { ...data.itinerario, ...newData } }), fiestaId: fiestaId || undefined };
            return <SeccionItinerarioEditor {...props} />;
        }

        if (selectedSection.tipo === 'regalos') {
            props = { data: data.regalos, update: (newData: any) => update({ regalos: { ...data.regalos, ...newData } }), fiestaId: fiestaId || undefined };
            return <SeccionRegalos {...props} />;
        }
        
        if (selectedSection.tipo === 'footer') {
            props = { data: data.footer, update: (newData: any) => update({ footer: { ...data.footer, ...newData } }) };
            return <SeccionFooterEditor {...props} />;
        }
        
        if (selectedSection.tipo === 'redesSociales') {
            props = { data: data.redesSociales, update: (newData: any) => update({ redesSociales: { ...data.redesSociales, ...newData } }) };
            return <SeccionRedesSocialesEditor {...props} />;
        }


        props = { data: selectedSection.data, update: handleSectionDataChange, fiestaId: fiestaId || undefined };
        
        switch (selectedSection.tipo) {
            case 'bienvenida': return <SeccionBienvenidaEditor data={data.bienvenida} update={(newData) => update({ bienvenida: {...data.bienvenida, ...newData} })} fiestaId={fiestaId || undefined} />;
            case 'confirmacion': return <SeccionConfirmacionEditor data={data.confirmacion} update={(newData) => update({ confirmacion: {...data.confirmacion, ...newData} })} />;
            case 'cuentaRegresiva': return <SeccionCuentaRegresivaEditor data={data.cuentaRegresiva} update={(newData) => update({ cuentaRegresiva: {...data.cuentaRegresiva, ...newData} })} />;
            case 'detallesEvento': return <SeccionDetallesEventoEditor data={data.detallesEvento} update={(newData) => update({ detallesEvento: {...data.detallesEvento, ...newData} })} />;
            case 'galeria': return <SeccionGaleriaEditor data={data.galeria} update={(newData) => update({ galeria: {...data.galeria, ...newData} })} />;
            default: return <div>Editor no implementado para "{selectedSection.tipo}"</div>;
        }
    }
    
    const currentDataForVisibility = selectedSection?.tipo === 'cabecera' 
        ? data.cabecera 
        : data[selectedSection?.tipo as keyof Omit<InvitacionDigitalData, 'secciones'>] || selectedSection?.data;

    const handleVisibilityChange = (checked: boolean) => {
        if (!selectedSection) return;
        if (selectedSection.tipo === 'cabecera') {
            update({ cabecera: { ...data.cabecera, visible: checked } });
        } else {
            handleSectionDataChange({ visible: checked });
        }
    };


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
                        {selectedSection && (
                             <div className="flex items-center justify-between space-x-2 border p-3 rounded-md mb-4">
                                <Label htmlFor={`visible-${selectedSectionId}`} className="font-normal">Mostrar esta sección</Label>
                                <Switch 
                                    id={`visible-${selectedSectionId}`}
                                    checked={currentDataForVisibility?.visible} 
                                    onCheckedChange={handleVisibilityChange}
                                />
                            </div>
                        )}
                        {currentDataForVisibility?.visible && renderEditor()}
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
};
