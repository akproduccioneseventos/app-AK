'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function AdminUsuariosPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getSession()) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground text-sm">
          Administración de usuarios del sistema.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5" />
            Modo contraseña compartida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El sistema usa autenticación por contraseña compartida. No se requiere gestión individual de usuarios.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
