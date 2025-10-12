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
import { SeccionMusicaEditor } from './SeccionMusica';
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
        if (!selectedSection) return;
        const sectionKey = selectedSection.tipo as keyof Omit<InvitacionDigitalData, 'secciones' | 'plantilla' | 'name' | 'category' | 'musicaFondoUrl'>;
        update({ [sectionKey]: { ...data[sectionKey], ...newData } });
    };
    
    const renderEditor = () => {
        if (!selectedSection) return null;
        
        const sectionKey = selectedSection.tipo as keyof Omit<InvitacionDigitalData, 'secciones' | 'plantilla' | 'name' | 'category' | 'musicaFondoUrl'>;
        const props = { 
            data: data[sectionKey], 
            update: handleSectionDataChange, 
            fiestaId: fiestaId || undefined 
        };

        switch (selectedSection.tipo) {
            case 'cabecera': return <SeccionCabeceraEditor data={data.cabecera} update={(newData) => update({ cabecera: { ...data.cabecera, ...newData } })} fiestaId={fiestaId || undefined} />;
            case 'bienvenida': return <SeccionBienvenidaEditor {...props} />;
            case 'cuentaRegresiva': return <SeccionCuentaRegresivaEditor {...props} />;
            case 'detallesEvento': return <SeccionDetallesEventoEditor {...props} />;
            case 'itinerario': return <SeccionItinerarioEditor {...props} />;
            case 'galeria': return <SeccionGaleriaEditor {...props} />;
            case 'historia': return <SeccionHistoriaEditor {...props} />;
            case 'regalos': return <SeccionRegalosEditor {...props} />;
            case 'dressCode': return <SeccionDressCodeEditor {...props} />;
            case 'confirmacion': return <SeccionConfirmacionEditor {...props} />;
            case 'musica': return <SeccionMusicaEditor {...props} />;
            case 'redesSociales': return <SeccionRedesSocialesEditor {...props} />;
            case 'despedida': return <SeccionDespedidaEditor {...props} />;
            case 'footer': return <SeccionFooterEditor {...props} />;
            default: return <div>Editor no implementado para "{selectedSection.tipo}"</div>;
        }
    }
    
    const currentDataForVisibility = selectedSection?.tipo === 'cabecera' 
        ? data.cabecera 
        : data[selectedSection?.tipo as keyof Omit<InvitacionDigitalData, 'secciones' | 'plantilla' | 'name' | 'category' | 'musicaFondoUrl'>];

    const handleVisibilityChange = (checked: boolean) => {
        if (!selectedSection) return;
        
        const updatedSecciones = data.secciones.map(sec => {
            if (sec.id === selectedSectionId) {
                // This is not correct. `data` is a flat object, we should update the specific section property
                const sectionKey = sec.tipo as keyof Omit<InvitacionDigitalData, 'secciones'>;
                 update({
                    [sectionKey]: { ...(data[sectionKey] as any), visible: checked }
                });
                return { ...sec, data: { ...sec.data, visible: checked }}; // Update the section in the array too for UI consistency
            }
            return sec;
        });
        update({secciones: updatedSecciones});
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