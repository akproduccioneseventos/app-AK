
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, PackagePlus, Edit, Trash2, Loader2, AlertTriangle, Search, DollarSign, Tag, BarChart3, StickyNote, Printer, Share2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InventarioInsumosPage() {
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestión de Insumos e Ingredientes
          </h1>
        </div>
         <div className="flex gap-2 flex-wrap">
            <Link href="/empresa/todos-los-servicios/nuevo?type=Insumo/Ingrediente" passHref>
                <Button variant="default">
                    <PackagePlus className="w-4 h-4 mr-2" />
                    Añadir Insumo
                </Button>
            </Link>
             <Link href="/empresa/todos-los-servicios" passHref>
                <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2"/>
                    Volver al Catálogo
                </Button>
            </Link>
        </div>
      </div>
      <CardDescription>Gestiona tu inventario de consumibles (ingredientes, bebidas, descartables, etc.).</CardDescription>

      <Card>
        <CardContent className="p-10 text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4"/>
            <p className="text-muted-foreground">Módulo en construcción. La funcionalidad completa será restaurada en breve.</p>
        </CardContent>
      </Card>

    </div>
  );
}
