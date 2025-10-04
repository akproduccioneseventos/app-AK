
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Share2, ChefHat, Loader2, AlertTriangle, Info, Cake, GlassWater } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FullMenu, MenuItem, ReposteriaData, BebidasData } from '@/types/fiesta';
import { getMenus } from '@/app/actions/menus-catering';
import { getReposteriaMasterTemplate } from '@/app/actions/reposteria.actions';
import { getBebidasMasterTemplate } from '@/app/actions/bebidas.actions';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function ReporteMenusPage() {
  const { toast } = useToast();
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
  const [reposteria, setReposteria] = useState<ReposteriaData | null>(null);
  const [bebidas, setBebidas] = useState<BebidasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [menusData, reposteriaData, bebidasData] = await Promise.all([
        getMenus(),
        getReposteriaMasterTemplate(),
        getBebidasMasterTemplate()
      ]);
      setAllMenus(menusData);
      setReposteria(reposteriaData);
      setBebidas(bebidasData);
    } catch (err: any) {
      setError("No se pudo cargar el catálogo gastronómico.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handlePrint = () => { window.print(); };

  const handleShare = async () => {
    const shareData = {
      title: 'Catálogo Gastronómico - AK Producciones',
      text: 'Resumen de menús, repostería y bebidas.',
      url: window.location.href,
    };
    try {
      await navigator.share(shareData);
    } catch (err) {
      await navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Enlace Copiado",
        description: "El enlace a esta página ha sido copiado a tu portapapeles.",
      });
    }
  };

  const renderPlatos = (items: MenuItem[]) => {
    return items.map(item => (
        <li key={item.id} className="text-sm print:text-xs">
            <span className="font-medium">{item.name}</span> - <span className="text-muted-foreground">{formatCurrency(item.suggestedSellingPrice)}</span>
        </li>
    ));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Error al Generar Reporte</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Link href="/empresa/menus" passHref>
            <Button variant="outline" className="mt-4">Volver</Button>
          </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/empresa/menus" passHref>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver al Planificador</Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-4 text-center border-b pb-3 print:pb-2">
          <h1 className="text-xl font-bold text-primary print:text-lg flex items-center justify-center gap-2">
            <ChefHat className="w-6 h-6 print:w-5 print:h-5" /> Reporte Gastronómico Maestro
          </h1>
          <p className="text-sm text-gray-500 print:text-[9pt]">Generado el: {new Date().toLocaleDateString('es-ES')}</p>
        </header>

        {allMenus.length === 0 && reposteria?.categorias.length === 0 && bebidas?.categorias.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Info className="w-12 h-12 mx-auto mb-3 opacity-50"/>
            <p>No hay elementos gastronómicos para generar un reporte.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allMenus.map(menu => (
              <section key={menu.id} className="mb-4 print:mb-2 print:break-inside-avoid">
                <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2">
                  Menú: {menu.name}
                </h2>
                <ul className="space-y-1 list-disc list-inside pl-2">
                    {renderPlatos(menu.items)}
                </ul>
              </section>
            ))}
            
            {reposteria && (
                 <section className="mb-4 print:mb-2 print:break-inside-avoid">
                    <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><Cake className="w-5 h-5"/>Repostería</h2>
                    {reposteria.categorias.map(cat => (
                        <div key={cat.id} className="mt-2">
                            <h3 className="font-medium text-primary/80 text-sm">{cat.nombreDisplay}</h3>
                            <ul className="space-y-1 list-disc list-inside pl-4 text-sm print:text-xs">
                                {cat.items.map(item => <li key={item.id}>{item.nombre} - {formatCurrency(item.precioSugerido)}</li>)}
                            </ul>
                        </div>
                    ))}
                 </section>
            )}

            {bebidas && (
                 <section className="mb-4 print:mb-2 print:break-inside-avoid">
                    <h2 className="text-lg font-semibold text-gray-800 print:text-base border-b border-gray-300 pb-1 mb-2 flex items-center gap-2"><GlassWater className="w-5 h-5"/>Bebidas</h2>
                    {bebidas.categorias.map(cat => (
                        <div key={cat.id} className="mt-2">
                            <h3 className="font-medium text-primary/80 text-sm">{cat.nombreDisplay}</h3>
                            <ul className="space-y-1 list-disc list-inside pl-4 text-sm print:text-xs">
                                {cat.items.map(item => <li key={item.id}>{item.nombre} ({item.cantidadNecesaria} {item.unidadCantidad}) - {formatCurrency(item.costoUnitario)} c/u</li>)}
                            </ul>
                        </div>
                    ))}
                 </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
