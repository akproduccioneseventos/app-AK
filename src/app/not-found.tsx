import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2rem] overflow-hidden text-center">
        <CardHeader className="pb-2 pt-8">
          <div className="mx-auto p-4 bg-primary/10 rounded-2xl w-fit mb-4">
            <Search className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-6xl font-black tracking-tighter text-slate-200 font-headline">
            404
          </CardTitle>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900 font-headline mt-2">
            Página no encontrada
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 mt-2">
            La página que buscás no existe o fue movida a otra ubicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          <Link href="/">
            <Button className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20">
              <Home className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
