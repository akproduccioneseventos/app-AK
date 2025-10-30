
'use client';

import React from 'react';
import NextImage from 'next/image';
import type { FiestaEnPlanificacion, MenuMesaData } from '@/types/fiesta';
import { EditableText } from '../edit/EditableText';
import { cn } from '@/lib/utils';
import { Phone } from 'lucide-react';

interface MenuMesaTemplateProps {
    fiesta: FiestaEnPlanificacion;
    data: MenuMesaData;
    logoUrl: string | null;
    onUpdate?: (newData: Partial<MenuMesaData>) => void;
    isPreview?: boolean;
}

export const MenuMesaTemplate: React.FC<MenuMesaTemplateProps> = ({ fiesta, data, logoUrl, onUpdate, isPreview }) => {
    
    const paleta = data.paletaColores;
    
    const handleUpdate = (field: keyof Omit<MenuMesaData, 'paletaColores' | 'protagonistaFotoUrl'>, value: string) => {
        if (onUpdate && isPreview) {
            onUpdate({ [field]: value });
        }
    };
    
    const handleEmpresaUpdate = (field: keyof MenuMesaData['empresa'], value: string) => {
         if (onUpdate && isPreview) {
            onUpdate({ empresa: { ...data.empresa, [field]: value } });
        }
    }
    
    const renderTextWithLineBreaks = (text: string) => {
        return text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                <br />
            </React.Fragment>
        ));
    };

    return (
        <div
            className={cn("w-full h-full p-4 relative overflow-hidden flex flex-col items-center border-4")}
            style={{ backgroundColor: paleta.background, borderColor: paleta.primary }}
        >
             {/* Corner Ornaments */}
            <div className="absolute top-2 left-2 w-8 h-8 ornament-top-left" style={{'--color': paleta.primary}}/>
            <div className="absolute top-2 right-2 w-8 h-8 ornament-top-right" style={{'--color': paleta.primary}}/>
            <div className="absolute bottom-2 left-2 w-8 h-8 ornament-bottom-left" style={{'--color': paleta.primary}}/>
            <div className="absolute bottom-2 right-2 w-8 h-8 ornament-bottom-right" style={{'--color': paleta.primary}}/>

            <header className="w-full text-center mt-6">
                <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden border-4" style={{borderColor: paleta.primary}}>
                    {data.protagonistaFotoUrl ? (
                         <NextImage src={data.protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" />
                    ) : <div className="w-full h-full bg-gray-200"></div>}
                </div>
                <h1 className="font-['Belleza',_serif] text-5xl mt-2" style={{color: paleta.primary, textShadow: '1px 1px 2px rgba(0,0,0,0.1)'}}>
                    MENÚ
                </h1>
                <h2 className="font-['Dancing_Script',_cursive] text-4xl" style={{color: paleta.primary}}>
                     {isPreview ? <EditableText initialValue={fiesta.configuracion.protagonista1Nombre || 'Luciana'} onSave={(val) => onUpdate?.({ protagonistaNombre: val })} textarea={false}/> : (fiesta.configuracion.protagonista1Nombre || 'Luciana')}
                </h2>
            </header>

            <main className="w-full px-4 mt-3 space-y-3 text-center flex-grow">
                 <div>
                    <h3 className="font-['Belleza',_serif] text-xl" style={{color: paleta.primary}}>ENTRADA</h3>
                    <div className="font-['Belleza',_serif] text-sm whitespace-pre-line" style={{color: paleta.secondary}}>{isPreview ? <EditableText initialValue={data.entrada} onSave={val => handleUpdate('entrada', val)} textarea/> : renderTextWithLineBreaks(data.entrada)}</div>
                </div>
                <div className="flex items-center justify-center gap-2"><div className="w-8 h-px bg-gray-300"></div><div className="w-2 h-2 transform rotate-45" style={{backgroundColor: paleta.accent}}></div><div className="w-8 h-px bg-gray-300"></div></div>
                <div>
                    <h3 className="font-['Belleza',_serif] text-xl" style={{color: paleta.primary}}>PLATO PRINCIPAL</h3>
                    <div className="font-['Belleza',_serif] text-sm whitespace-pre-line" style={{color: paleta.secondary}}>{isPreview ? <EditableText initialValue={data.platoPrincipal} onSave={val => handleUpdate('platoPrincipal', val)} textarea/> : renderTextWithLineBreaks(data.platoPrincipal)}</div>
                </div>
                <div className="flex items-center justify-center gap-2"><div className="w-8 h-px bg-gray-300"></div><div className="w-2 h-2 transform rotate-45" style={{backgroundColor: paleta.accent}}></div><div className="w-8 h-px bg-gray-300"></div></div>
                <div>
                    <h3 className="font-['Belleza',_serif] text-xl" style={{color: paleta.primary}}>ADOLESCENTES Y NIÑOS</h3>
                    <div className="font-['Belleza',_serif] text-sm whitespace-pre-line" style={{color: paleta.secondary}}>{isPreview ? <EditableText initialValue={data.adolescentes} onSave={val => handleUpdate('adolescentes', val)} textarea/> : renderTextWithLineBreaks(data.adolescentes)}</div>
                </div>
                <div className="flex items-center justify-center gap-2"><div className="w-8 h-px bg-gray-300"></div><div className="w-2 h-2 transform rotate-45" style={{backgroundColor: paleta.accent}}></div><div className="w-8 h-px bg-gray-300"></div></div>
                <div>
                    <h3 className="font-['Belleza',_serif] text-xl" style={{color: paleta.primary}}>POSTRES</h3>
                    <div className="font-['Belleza',_serif] text-sm whitespace-pre-line" style={{color: paleta.secondary}}>{isPreview ? <EditableText initialValue={data.postres} onSave={val => handleUpdate('postres', val)} textarea/> : renderTextWithLineBreaks(data.postres)}</div>
                </div>
                <div className="flex items-center justify-center gap-2"><div className="w-8 h-px bg-gray-300"></div><div className="w-2 h-2 transform rotate-45" style={{backgroundColor: paleta.accent}}></div><div className="w-8 h-px bg-gray-300"></div></div>
                <div>
                    <h3 className="font-['Belleza',_serif] text-xl" style={{color: paleta.primary}}>BEBIDAS</h3>
                    <div className="font-['Belleza',_serif] text-sm whitespace-pre-line" style={{color: paleta.secondary}}>{isPreview ? <EditableText initialValue={data.bebidas} onSave={val => handleUpdate('bebidas', val)} textarea/> : renderTextWithLineBreaks(data.bebidas)}</div>
                </div>
            </main>
            
            <footer 
                className="relative z-10 w-[110%] -bottom-4 mt-auto rounded-t-[100%] p-4 pt-8 text-center text-white" 
                style={{backgroundColor: paleta.primary}}
            >
                <div className="relative -top-3">
                    <h4 className="font-['Belleza',_serif] font-bold text-lg">{isPreview ? <EditableText initialValue={data.empresa.linea1} onSave={val => handleEmpresaUpdate('linea1', val)} textarea={false}/> : data.empresa.linea1}</h4>
                    <p className="text-xs">{isPreview ? <EditableText initialValue={data.empresa.linea2} onSave={val => handleEmpresaUpdate('linea2', val)} textarea={false}/> : data.empresa.linea2}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                        <Phone className="w-3 h-3"/>
                        <p className="text-xs font-semibold">{isPreview ? <EditableText initialValue={data.empresa.contacto} onSave={val => handleEmpresaUpdate('contacto', val)} textarea={false}/> : data.empresa.contacto}</p>
                    </div>
                </div>
                {logoUrl && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full p-1 shadow-lg">
                        <div className="relative w-full h-full rounded-full overflow-hidden">
                           <NextImage src={logoUrl} alt="Logo" layout="fill" objectFit="contain" />
                        </div>
                    </div>
                )}
            </footer>

            <style jsx>{`
                .ornament-top-left { border-top: 2px solid var(--color); border-left: 2px solid var(--color); }
                .ornament-top-right { border-top: 2px solid var(--color); border-right: 2px solid var(--color); }
                .ornament-bottom-left { border-bottom: 2px solid var(--color); border-left: 2px solid var(--color); }
                .ornament-bottom-right { border-bottom: 2px solid var(--color); border-right: 2px solid var(--color); }
                .ornament-top-left::before, .ornament-top-right::before, .ornament-bottom-left::before, .ornament-bottom-right::before {
                    content: '';
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background-color: var(--color);
                }
                .ornament-top-left::before { top: -3px; left: 10px; }
                .ornament-top-left::after { content: ''; position: absolute; width: 4px; height: 4px; background-color: var(--color); top: 10px; left: -3px; }
                .ornament-top-right::before { top: -3px; right: 10px; }
                .ornament-top-right::after { content: ''; position: absolute; width: 4px; height: 4px; background-color: var(--color); top: 10px; right: -3px; }
                .ornament-bottom-left::before { bottom: -3px; left: 10px; }
                .ornament-bottom-left::after { content: ''; position: absolute; width: 4px; height: 4px; background-color: var(--color); bottom: 10px; left: -3px; }
                .ornament-bottom-right::before { bottom: -3px; right: 10px; }
                .ornament-bottom-right::after { content: ''; position: absolute; width: 4px; height: 4px; background-color: var(--color); bottom: 10px; right: -3px; }
            `}</style>
        </div>
    );
};
