'use client';

import { AkAssistant } from '@/components/asistente-ak/AkAssistant';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AsistenteAkPage() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
       <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Asistente de Marketing con IA</h1>
        <Link href="/" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
        </Link>
      </div>
      <AkAssistant />
    </div>
  );
}
