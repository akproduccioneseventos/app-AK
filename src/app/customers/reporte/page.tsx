
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Share2, Users, Loader2, AlertTriangle, Info, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/customer';
import { getCustomers } from '@/app/actions/customers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { WatermarkedImage } from '@/components/watermarked-image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';


const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        return utcDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'numeric', year: 'numeric' });
    } catch(e) { return "Fecha inválida"; }
}

export default function ReporteClientesPage() {
  const { toast } = useToast();
  const [allItems, setAllItems] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, settings] = await Promise.all([
          getCustomers(),
          getInvoiceTemplateSettings()
      ]);
      setAllItems(data);
      setLogoUrl(settings.logoUrl);
    } catch (err: any) {
      setError("No se pudo cargar la lista de clientes.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handlePrint = () => { window.print(); };

  const handleShare = () => {
    const shareData = {
      title: 'Reporte de Clientes - AK Producciones',
      text: 'Listado de todos los clientes registrados en el sistema.',
      url: window.location.href,
    };
    if (typeof navigator.share !== 'undefined' && navigator.canShare(shareData)) {
        navigator.share(shareData).catch(err => console.error("Error al compartir:", err));
    } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + '\n' + shareData.url)}`;
        window.open(whatsappUrl, '_blank');
    }
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
          <Link href="/customers" passHref>
            <Button variant="outline" className="mt-4">Volver</Button>
          </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 print:bg-white py-6 print:py-0 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none p-6 md:p-10 print:p-2 relative">
        <div className="w-full h-24 print:h-20 mb-4 relative">
          <WatermarkedImage src={logoUrl} alt="Marca de agua" />
        </div>
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/customers" passHref>
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1.5" />Volver a Clientes</Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm"><Eye className="w-4 h-4 mr-1.5"/>Vista Previa</Button>
            <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1.5"/>Compartir</Button>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-1.5" />Imprimir / PDF</Button>
          </div>
        </div>

        <header className="mb-6 print:mb-4 text-center border-b pb-3 print:pb-2">
          <h1 className="text-xl font-bold text-primary print:text-lg flex items-center justify-center gap-2">
            <Users className="w-6 h-6 print:w-5 print:h-5" /> Reporte de Clientes
          </h1>
          <p className="text-sm text-gray-500 print:text-[9pt]">Generado el: {new Date().toLocaleDateString('es-ES')}</p>
        </header>

        {allItems.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Info className="w-12 h-12 mx-auto mb-3 opacity-50"/>
            <p>No hay clientes registrados para generar un reporte.</p>
          </div>
        ) : (
          <Table>
            <TableCaption>Listado de clientes registrados en el sistema.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Nombre / Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>RUT/Cédula</TableHead>
                <TableHead>Próximo/Último Evento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.companyName || item.name}</TableCell>
                  <TableCell>{item.phone || '-'}</TableCell>
                  <TableCell>{item.taxId || '-'}</TableCell>
                  <TableCell>{formatDate(item.partyDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
