'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, ChefHat, GlassWater, CakeSlice, Utensils, Star, QrCode, Phone } from 'lucide-react';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getMenuById } from '@/app/actions/menus-catering';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { FullMenu, MenuItem } from '@/types/catering';
import QRCodeStylized from 'qrcode.react';
import NextImage from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings'; // Import settings
import { cn } from '@/lib/utils';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const companyInfo = {
  name: "AK PRODUCCIONES",
  line1: "Servicio de fiestas integral",
  line2: "Todos los servicios-un solo lugar",
  contact: "098 355 530",
};

interface MenuSectionProps {
  title: string;
  items: string[];
  color?: string;
  titleClassName?: string;
  itemClassName?: string;
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, items, color, titleClassName, itemClassName }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="text-center">
      <h3 className={`font-headline text-3xl font-bold tracking-wider mb-2 ${titleClassName}`} style={{ color }}>
        {title}
      </h3>
      <div className="relative inline-block px-4">
        <div className="absolute left-0 top-1/2 w-4 h-px bg-purple-400"></div>
        <svg width="10" height="10" viewBox="0 0 10 10" className="inline-block fill-current text-purple-400">
            <polygon points="5,0 6.5,3.5 10,5 6.5,6.5 5,10 3.5,6.5 0,5 3.5,3.5" />
        </svg>
        <div className="absolute right-0 top-1/2 w-4 h-px bg-purple-400"></div>
      </div>
      <div className={`mt-2 ${itemClassName}`}>
        {items.map((item, index) => <p key={index} className="text-lg">{item}</p>)}
      </div>
    </div>
  );
};

const CornerBorder: React.FC<{className?: string}> = ({ className }) => (
    <svg className={cn("absolute w-12 h-12 text-purple-400", className)} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 0H20V5H35V20H40V0Z" fill="currentColor"/>
        <path d="M0 0H5V15H20V20H0V0Z" fill="currentColor"/>
        <path d="M20 40V20H15V35H0V40H20Z" fill="currentColor"/>
        <path d="M40 40H20V35H35V20H40V40Z" fill="currentColor"/>
    </svg>
);


export default function MenuMesaPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socialWallUrl, setSocialWallUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null); // State for logo

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      
      const [templateSettings, menuData] = await Promise.all([
          getInvoiceTemplateSettings(),
          fiestaData.menuAsignadoId ? getMenuById(fiestaData.menuAsignadoId) : Promise.resolve(null),
      ]);
      setLogoUrl(templateSettings.logoUrl);
      setMenu(menuData);
      
    } catch (err: any) {
      setError("No se pudieron cargar los datos para el menú.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    if(typeof window !== 'undefined' && fiesta?.id) {
        setSocialWallUrl(`${window.location.origin}/evento/social/${fiesta.id}`);
    }
  }, [loadData, fiesta?.id]);

  const { menuEntradas, menuPrincipal, menuAdolescente, mesaPostres, bebidas, tortaPrincipal, fuenteChocolate } = useMemo(() => {
    const allItems = menu?.items || [];
    const reposteriaItems = fiesta?.reposteria?.categorias.flatMap(c => c.items.map(i => i.nombre)) || [];
    const bebidasItems = fiesta?.bebidas?.categorias.flatMap(c => c.items.map(i => i.nombre)) || [];
    const torta = fiesta?.decoracion?.decoracionTorta?.descripcion ? [fiesta.decoracion.decoracionTorta.descripcion] : [];
    const fuente = fiesta?.reposteria?.categorias.find(c => c.id === 'fuente_chocolate' && c.activada) ? ['Fuente de Chocolate con frutas de estación'] : [];

    return {
      menuEntradas: allItems.filter(i => i.type === 'Entrada').map(i => i.name),
      menuPrincipal: allItems.filter(i => i.type === 'Plato Principal').map(i => i.name),
      menuAdolescente: allItems.filter(i => i.type === 'Menú Infantil/Adolescente').map(i => i.name),
      mesaPostres: reposteriaItems,
      bebidas: bebidasItems,
      tortaPrincipal: torta,
      fuenteChocolate: fuente,
    };
  }, [menu, fiesta]);
  
  const handlePrint = () => window.print();

  const handleShare = () => {
    const url = window.location.href;
    const message = `Menú del Evento: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const protagonistName = useMemo(() => {
    if (!fiesta) return 'Luciana';
    const { protagonista1Nombre, protagonista2Nombre } = fiesta.configuracion;
    if (protagonista1Nombre && protagonista2Nombre) {
      return `${protagonista1Nombre} & ${protagonista2Nombre}`;
    }
    return protagonista1Nombre || 'Evento Especial';
  }, [fiesta]);
  
  const protagonistPhoto = useMemo(() => {
    return fiesta?.decoracion?.moodboardImageUrl || 'https://picsum.photos/seed/quinceanera/300/300';
  }, [fiesta]);


  if (isLoading) {
    return <div className="p-8 max-w-lg mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }
  
  if (error) {
    return <div className="p-8 max-w-lg mx-auto text-center"><AlertTriangle className="w-12 h-12 mx-auto text-destructive"/><p className="mt-2 text-destructive">{error}</p></div>;
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans" lang="es">
      <div className="fixed top-4 right-4 print:hidden flex flex-col gap-2 z-50">
        <Link href={`/fiestas/nueva?fiestaId=${fiesta?.id}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button></Link>
        <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
        <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir</Button>
      </div>
      
      <div className="w-[210mm] min-h-[297mm] mx-auto bg-white shadow-lg print:shadow-none p-8 flex flex-col relative border-8 border-purple-400">
        <CornerBorder className="top-0 left-0"/>
        <CornerBorder className="top-0 right-0 rotate-90"/>
        <CornerBorder className="bottom-0 left-0 -rotate-90"/>
        <CornerBorder className="bottom-0 right-0 rotate-180"/>
        
        <header className="text-center mb-6 relative">
           <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full border-4 border-purple-400 bg-white shadow-lg p-1">
                <NextImage 
                  src={protagonistPhoto} 
                  alt={`Foto de ${protagonistName}`}
                  width={144}
                  height={144}
                  className="rounded-full object-cover w-full h-full"
                  data-ai-hint="protagonist photo"
                />
           </div>
           <div className="pt-20">
             <h1 className="text-7xl font-bold" style={{fontFamily: "'Belleza', serif", color: '#9333ea', textShadow: '2px 2px 4px rgba(0,0,0,0.1)'}}>MENÚ</h1>
             <div className="relative mt-2 inline-block">
                <div className="absolute inset-x-0 top-1/2 h-8 bg-purple-400 transform -translate-y-1/2"></div>
                <h2 className="font-['Dancing_Script',_cursive] text-4xl relative px-4" style={{color: '#fff'}}>
                    {protagonistName}
                </h2>
             </div>
           </div>
        </header>

        <main className="flex-grow space-y-6 font-['Belleza',_serif]">
          <MenuSection title="ENTRADA" items={[...menuEntradas]} color="#9333ea" itemClassName="text-gray-700"/>
          <MenuSection title="PLATO PRINCIPAL" items={[...menuPrincipal]} color="#9333ea" itemClassName="text-gray-700"/>
          {menuAdolescente.length > 0 && <MenuSection title="ADOLESCENTES Y NIÑOS" items={menuAdolescente} color="#9333ea" itemClassName="text-gray-700"/>}
          <MenuSection title="POSTRES" items={[...mesaPostres, ...tortaPrincipal, ...fuenteChocolate]} color="#9333ea" itemClassName="text-gray-700"/>
          <MenuSection title="BEBIDAS" items={[...bebidas]} color="#9333ea" itemClassName="text-gray-700"/>
        </main>
        
        <footer className="mt-auto pt-8 text-center relative -mb-4">
            <svg viewBox="0 0 100 20" className="w-full h-auto text-purple-400 absolute left-0 -top-8">
                <path d="M 0 10 Q 50 20, 100 10" stroke="currentColor" fill="none" strokeWidth="0.5"/>
            </svg>
            <div className="bg-purple-400 text-white p-4 rounded-lg relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center transform rotate-45">
                    <div className="w-4 h-4 bg-purple-400"></div>
                </div>
                <p className="text-xl font-bold">{companyInfo.name}</p>
                <p className="text-sm">{companyInfo.line1}</p>
                <p className="text-sm">{companyInfo.line2}</p>
                <div className="flex justify-center items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-black"/>
                    </div>
                    <span className="font-bold text-lg">{companyInfo.contact}</span>
                </div>
                 {logoUrl && (
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white rounded-full p-1 shadow-md">
                        <NextImage src={logoUrl} alt="Logo" width={72} height={72} className="rounded-full object-contain"/>
                    </div>
                 )}
            </div>
        </footer>
      </div>
    </div>
  );
}
