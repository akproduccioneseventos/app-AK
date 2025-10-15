
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer as PrinterIcon, Share2, AlertTriangle, ChefHat, GlassWater, CakeSlice, Utensils, Star, QrCode } from 'lucide-react';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { getMenuById } from '@/app/actions/menus-catering';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { FullMenu, MenuItem } from '@/types/catering';
import QRCodeStylized from 'qrcode.react';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const companyInfo = {
  name: "AK Producciones",
  contact: "098 355 530 - akproduccionessalto@gmail.com",
};

interface MenuSectionProps {
  title: string;
  icon: React.ElementType;
  items: string[];
  color?: string;
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, icon: Icon, items, color }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="print:break-inside-avoid">
      <h3 className="font-headline text-2xl flex items-center gap-2 mb-3" style={{ color }}>
        <Icon className="w-6 h-6" /> {title}
      </h3>
      <ul className="space-y-1 list-disc list-inside pl-2">
        {items.map((item, index) => <li key={index} className="text-sm">{item}</li>)}
      </ul>
    </div>
  );
};


export default function MenuMesaPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socialWallUrl, setSocialWallUrl] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      
      if (fiestaData.menuAsignadoId) {
        const menuData = await getMenuById(fiestaData.menuAsignadoId);
        setMenu(menuData);
      }
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

  const primaryColor = fiesta?.decoracion?.paletaColores?.primary || '#000';
  const accentColor = fiesta?.decoracion?.paletaColores?.accent || '#333';

  if (isLoading) {
    return <div className="p-8 max-w-lg mx-auto bg-white"><Skeleton className="h-[80vh] w-full" /></div>;
  }
  
  if (error) {
    return <div className="p-8 max-w-lg mx-auto text-center"><AlertTriangle className="w-12 h-12 mx-auto text-destructive"/><p className="mt-2 text-destructive">{error}</p></div>;
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="fixed top-4 right-4 print:hidden flex flex-col gap-2 z-50">
        <Link href={`/fiestas/nueva?fiestaId=${fiesta?.id}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button></Link>
        <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
        <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir</Button>
      </div>
      
      {/* A4-sized container */}
      <div className="w-[210mm] h-[297mm] mx-auto bg-white shadow-lg print:shadow-none p-12 print:p-8 flex flex-col" style={{ fontFamily: 'var(--font-belleza)'}}>
        <header className="text-center mb-8">
          <h1 className="text-4xl font-headline" style={{ color: accentColor }}>
            {fiesta?.configuracion.protagonista1Nombre ? `${fiesta?.configuracion.eventoTipo} de ${fiesta?.configuracion.protagonista1Nombre}` : fiesta?.configuracion.nombreEvento}
          </h1>
          {fiesta?.configuracion.protagonista2Nombre && <h2 className="text-3xl font-headline" style={{ color: accentColor }}>& {fiesta?.configuracion.protagonista2Nombre}</h2>}
        </header>

        <main className="flex-grow space-y-6">
          <MenuSection title="Entradas" icon={Star} items={menuEntradas} color={primaryColor} />
          <MenuSection title="Plato Principal" icon={Utensils} items={menuPrincipal} color={primaryColor} />
          {menuAdolescente.length > 0 && <MenuSection title="Menú Adolescente" icon={PartyPopper} items={menuAdolescente} color={primaryColor} />}
          <MenuSection title="Bebidas" icon={GlassWater} items={bebidas} color={primaryColor} />
          <MenuSection title="Postres" icon={CakeSlice} items={[...mesaPostres, ...tortaPrincipal, ...fuenteChocolate]} color={primaryColor} />
        </main>
        
        <footer className="mt-auto pt-8 border-t flex justify-between items-end">
            <div className="text-xs text-gray-500">
                <p className="font-bold text-gray-700">{companyInfo.name}</p>
                <p>{companyInfo.contact}</p>
            </div>
            <div className="text-center">
                <p className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>¡Compartí tus fotos!</p>
                {socialWallUrl && <QRCodeStylized value={socialWallUrl} size={64} fgColor={primaryColor} bgColor="transparent" />}
            </div>
        </footer>
      </div>
    </div>
  );
}
