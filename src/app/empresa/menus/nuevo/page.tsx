
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { MenuForm } from '@/components/catering/MenuForm';


export default function NuevoMenuPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Crear Nuevo Menú
          </h1>
        </div>
        <Link href="/empresa/menus" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Menús
          </Button>
        </Link>
      </div>

      <MenuForm />
      
    </div>
  );
}
