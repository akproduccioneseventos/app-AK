import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-30 flex justify-end px-1 pt-1">
        <Button asChild size="sm" className="rounded-2xl bg-red-600 font-black shadow-lg shadow-red-900/20 hover:bg-red-700">
          <Link href="/contabilidad/crm/ciclo-comercial">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Ciclo comercial
          </Link>
        </Button>
      </div>
      {children}
    </div>
  );
}
