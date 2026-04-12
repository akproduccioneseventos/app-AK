'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, KeyRound, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { changePassword } from '@/app/actions/auth';

export default function PerfilPage() {
  const router = useRouter();
  const [session, setSession] = useState(getSession());

  // Change password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwdConfirm, setNewPwdConfirm] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.push('/login');
      return;
    }
    setSession(s);
  }, [router]);

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);

    if (newPwd !== newPwdConfirm) {
      setPwdError('Las contraseñas no coinciden.');
      return;
    }

    if (!session) return;
    setPwdLoading(true);
    const result = await changePassword(session.userId, currentPwd, newPwd);
    setPwdLoading(false);

    if (!result.success) {
      setPwdError(result.error ?? 'Error al cambiar la contraseña.');
      return;
    }

    setPwdSuccess(true);
    setCurrentPwd('');
    setNewPwd('');
    setNewPwdConfirm('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground text-sm">
          Gestioná tu contraseña.
        </p>
      </div>

      {/* Session info */}
      {session && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary text-sm">
                  {session.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{session.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {session.role === 'admin' ? (
                    <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Administrador
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Usuario</Badge>
                  )}
                  {session.mustChangePassword && (
                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Cambiar contraseña
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Must change password alert */}
      {session?.mustChangePassword && (
        <Alert className="border-amber-400 bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Por seguridad, debés cambiar tu contraseña antes de continuar.
          </AlertDescription>
        </Alert>
      )}

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="w-5 h-5" />
            Cambiar contraseña
          </CardTitle>
          <CardDescription>
            Ingresá tu contraseña actual y elegí una nueva.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            {pwdError && (
              <Alert variant="destructive">
                <AlertDescription>{pwdError}</AlertDescription>
              </Alert>
            )}
            {pwdSuccess && (
              <Alert className="border-green-400 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  ¡Contraseña actualizada exitosamente!
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-pwd">Contraseña actual</Label>
              <Input
                id="current-pwd"
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
                disabled={pwdLoading}
                placeholder="Tu contraseña actual"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="new-pwd">Nueva contraseña</Label>
              <Input
                id="new-pwd"
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                disabled={pwdLoading}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pwd-confirm">Confirmar nueva contraseña</Label>
              <Input
                id="new-pwd-confirm"
                type="password"
                value={newPwdConfirm}
                onChange={(e) => setNewPwdConfirm(e.target.value)}
                required
                disabled={pwdLoading}
                placeholder="Repetí la nueva contraseña"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={pwdLoading}>
              {pwdLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              {pwdLoading ? 'Guardando...' : 'Cambiar contraseña'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
