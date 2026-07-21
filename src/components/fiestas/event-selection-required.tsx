import Link from 'next/link';
import { CalendarSearch } from 'lucide-react';

import { Button } from '@/components/ui/button';

type EventSelectionRequiredProps = {
  moduleName: string;
};

export function EventSelectionRequired({ moduleName }: EventSelectionRequiredProps) {
  return (
    <main className="flex min-h-[55vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <CalendarSearch className="mx-auto h-10 w-10 text-red-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-black text-slate-950">Seleccioná un evento</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Para abrir {moduleName}, primero elegí la fiesta que querés organizar.
        </p>
        <Button asChild className="mt-5 w-full">
          <Link href="/eventos">Ver eventos activos</Link>
        </Button>
      </div>
    </main>
  );
}
