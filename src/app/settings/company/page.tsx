
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import React from 'react'; // Ensure React is imported

export default function CompanySettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Información de la Empresa (Simplified)
        </h1>
        <Link href="/settings" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
      </div>
      <p>Contenido de la página de configuración de la empresa se mostrará aquí.</p>
    </div>
  );
}
