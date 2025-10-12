
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
import { SeccionRegalosEditor } from './SeccionRegalos';
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

        const commonProps = { 
            data: selectedSection.data, 
            update: handleSectionDataChange, 
            fiestaId: fiestaId || undefined 
        };

        switch (selectedSection.tipo) {
            case 'cabecera': return <SeccionCabeceraEditor data={data.cabecera} update={(newData) => update({ cabecera: { ...data.cabecera, ...newData } })} fiestaId={fiestaId || undefined} />;
            case 'bienvenida': return <SeccionBienvenidaEditor data={data.bienvenida} update={(newData) => update({ bienvenida: {...data.bienvenida, ...newData} })} fiestaId={fiestaId || undefined} />;
            case 'cuentaRegresiva': return <SeccionCuentaRegresivaEditor data={data.cuentaRegresiva} update={(newData) => update({ cuentaRegresiva: {...data.cuentaRegresiva, ...newData} })} />;
            case 'detallesEvento': return <SeccionDetallesEventoEditor data={data.detallesEvento} update={(newData) => update({ detallesEvento: {...data.detallesEvento, ...newData} })} fiestaId={fiestaId || undefined} />;
            case 'itinerario': return <SeccionItinerarioEditor data={data.itinerario} update={(newData) => update({ itinerario: {...data.itinerario, ...newData} })} fiestaId={fiestaId || undefined} />;
            case 'galeria': return <SeccionGaleriaEditor data={data.galeria} update={(newData) => update({ galeria: {...data.galeria, ...newData} })} fiestaId={fiestaId || undefined} />;
            case 'historia': return <SeccionHistoriaEditor data={data.historia} update={(newData) => update({ historia: {...data.historia, ...newData} })} fiestaId={fiestaId || undefined} />;
            case 'regalos': return <SeccionRegalosEditor data={data.regalos} update={(newData) => update({ regalos: {...data.regalos, ...newData} })} fiestaId={fiestaId || undefined} />;
            case 'dressCode': return <SeccionDressCodeEditor data={data.dressCode} update={(newData) => update({ dressCode: {...data.dressCode, ...newData} })} />;
            case 'confirmacion': return <SeccionConfirmacionEditor data={data.confirmacion} update={(newData) => update({ confirmacion: {...data.confirmacion, ...newData} })} />;
            case 'redesSociales': return <SeccionRedesSocialesEditor data={data.redesSociales} update={(newData) => update({ redesSociales: {...data.redesSociales, ...newData} })} />;
            case 'despedida': return <SeccionDespedidaEditor data={data.despedida} update={(newData) => update({ despedida: {...data.despedida, ...newData} })} />;
            case 'footer': return <SeccionFooterEditor data={data.footer} update={(newData) => update({ footer: {...data.footer, ...newData} })} />;
            default: return <div>Editor no implementado para "{selectedSection.tipo}"</div>;
        }
    }
    
    const currentDataForVisibility = selectedSection?.tipo === 'cabecera' 
        ? data.cabecera 
        : data[selectedSection?.tipo as keyof Omit<InvitacionDigitalData, 'secciones'>];

    const handleVisibilityChange = (checked: boolean) => {
        if (!selectedSection) return;
        const sectionKey = selectedSection.tipo as keyof Omit<InvitacionDigitalData, 'secciones' | 'plantilla' | 'name' | 'category' | 'musicaFondoUrl'>;
        
        if (data[sectionKey]) {
            const updatedSection = { ...data[sectionKey], visible: checked };
            update({ [sectionKey]: updatedSection });
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
