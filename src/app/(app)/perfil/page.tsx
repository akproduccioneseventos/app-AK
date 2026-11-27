'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getMiPerfilDeSesion, type MiPerfilDeSesion } from '@/app/actions/sesion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function PerfilPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<MiPerfilDeSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!getSession()) {
      router.push('/login');
      return;
    }
    let activo = true;
    getMiPerfilDeSesion()
      .then((info) => {
        if (!activo) return;
        setPerfil(info);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground text-sm">
          Información de sesión.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5" />
            Sesión activa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {cargando ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando tu sesión...</span>
            </div>
          ) : perfil ? (
            <>
              <p>
                <span className="font-semibold">Rol:</span> {perfil.rol}
              </p>
              {perfil.email && (
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Usuario:</span> {perfil.email}
                </p>
              )}
              {perfil.metodo && (
                <p className="text-muted-foreground">
                  {perfil.metodo === 'google'
                    ? 'Iniciaste sesión con Google.'
                    : 'Iniciaste sesión con tu clave.'}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              Sesión iniciada en el panel del equipo.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
