'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { getSession, setSession } from '@/lib/auth';
import {
  getPublicSecurityRecoveryStatus,
  requestPasswordResetEmail,
  resetPasswordWithCode,
  resetPasswordWithSecurityAnswers,
  verifyPassword,
} from '@/app/actions/simple-auth';
import { setSessionCookie } from '@/app/actions/session';

type RecoveryStatus = Awaited<ReturnType<typeof getPublicSecurityRecoveryStatus>>;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
  const [recovery, setRecovery] = useState<RecoveryStatus | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (getSession()) {
      router.push('/');
      return;
    }

    async function loadLoginData() {
      try {
        const [settings, recoveryStatus] = await Promise.all([
          getInvoiceTemplateSettings(),
          getPublicSecurityRecoveryStatus(),
        ]);
        setLogoUrl(settings.logoUrl);
        setRecovery(recoveryStatus);
      } catch {
        setLogoUrl(null);
      }
    }
    loadLoginData();
  }, [router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');

    try {
      const result = await verifyPassword(password);
      if (!result.success) {
        setError('Contraseña incorrecta.');
        setIsSubmitting(false);
        return;
      }

      setSession();
      await setSessionCookie();
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/';
      router.push(redirect);
    } catch {
      setError('Error al verificar la contraseña.');
      setIsSubmitting(false);
    }
  };

  const handleRequestCode = async () => {
    setIsSubmitting(true);
    setError('');
    setNotice('');
    const result = await requestPasswordResetEmail();
    if (result.success) {
      setNotice(result.sent ? 'Te enviamos un codigo al mail de recuperacion.' : result.warning || 'Codigo generado.');
    } else {
      setError(result.error || 'No se pudo enviar el codigo.');
    }
    setIsSubmitting(false);
  };

  const validateResetPasswords = () => {
    if (resetPassword !== resetConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return false;
    }
    if (resetPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return false;
    }
    return true;
  };

  const handleResetWithCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');
    if (!validateResetPasswords()) {
      setIsSubmitting(false);
      return;
    }
    const result = await resetPasswordWithCode(resetCode, resetPassword);
    if (result.success) {
      setNotice('Contraseña actualizada. Ya podes entrar.');
      setMode('login');
      setResetCode('');
      setResetPassword('');
      setResetConfirmPassword('');
    } else {
      setError(result.error || 'No se pudo cambiar la contraseña.');
    }
    setIsSubmitting(false);
  };

  const handleResetWithAnswers = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');
    if (!validateResetPasswords()) {
      setIsSubmitting(false);
      return;
    }
    const result = await resetPasswordWithSecurityAnswers({ answers, newPassword: resetPassword });
    if (result.success) {
      setNotice('Contraseña actualizada. Ya podes entrar.');
      setMode('login');
      setAnswers({ q1: '', q2: '', q3: '' });
      setResetPassword('');
      setResetConfirmPassword('');
    } else {
      setError(result.error || 'No se pudo cambiar la contraseña.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-20 flex items-center justify-center">
            {logoUrl === undefined ? (
              <Skeleton className="h-16 w-36" />
            ) : logoUrl ? (
              <Image src={logoUrl} alt="Logo de la Empresa" width={150} height={80} className="object-contain max-h-20" priority data-ai-hint="company logo" />
            ) : (
              <span className="text-xl font-bold text-muted-foreground">AK Producciones</span>
            )}
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Acceso Protegido</CardTitle>
          <CardDescription>{mode === 'login' ? 'Ingresa la contraseña para acceder.' : 'Recupera el acceso sin bloquear la app.'}</CardDescription>
        </CardHeader>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <Input
                  id="login-password"
                  data-testid="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </div>
              {notice && <p className="text-sm text-emerald-700 text-center">{notice}</p>}
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button className="w-full" type="submit" data-testid="login-submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
              <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => { setMode('recovery'); setError(''); setNotice(''); }}>
                Olvide mi contraseña
              </Button>
            </CardFooter>
          </form>
        ) : (
          <div>
            <CardContent className="space-y-5">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                {recovery?.hasRecoveryEmail ? `Mail configurado: ${recovery.recoveryEmailHint}.` : 'Todavia no hay mail de recuperacion configurado.'}
              </div>

              <form onSubmit={handleResetWithCode} className="space-y-3">
                <Button type="button" variant="outline" className="w-full" onClick={handleRequestCode} disabled={isSubmitting || !recovery?.hasRecoveryEmail}>
                  Enviar codigo por mail
                </Button>
                <Input value={resetCode} onChange={(event) => setResetCode(event.target.value)} placeholder="Codigo de 6 numeros" inputMode="numeric" disabled={isSubmitting} />
                <Input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} placeholder="Nueva contraseña" disabled={isSubmitting} />
                <Input type="password" value={resetConfirmPassword} onChange={(event) => setResetConfirmPassword(event.target.value)} placeholder="Repetir nueva contraseña" disabled={isSubmitting} />
                <Button type="submit" className="w-full" disabled={isSubmitting || !resetCode || !resetPassword}>
                  Cambiar con codigo
                </Button>
              </form>

              {recovery?.questions && (
                <form onSubmit={handleResetWithAnswers} className="space-y-3 rounded-lg border p-3">
                  <p className="text-sm font-semibold">O responder preguntas de seguridad</p>
                  <Input value={answers.q1} onChange={(event) => setAnswers((current) => ({ ...current, q1: event.target.value }))} placeholder={recovery.questions.q1} disabled={isSubmitting} />
                  <Input value={answers.q2} onChange={(event) => setAnswers((current) => ({ ...current, q2: event.target.value }))} placeholder={recovery.questions.q2} disabled={isSubmitting} />
                  <Input value={answers.q3} onChange={(event) => setAnswers((current) => ({ ...current, q3: event.target.value }))} placeholder={recovery.questions.q3} disabled={isSubmitting} />
                  <Button type="submit" variant="secondary" className="w-full" disabled={isSubmitting || !resetPassword}>
                    Cambiar con preguntas
                  </Button>
                </form>
              )}

              {notice && <p className="text-sm text-emerald-700 text-center">{notice}</p>}
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode('login'); setError(''); setNotice(''); }}>
                Volver al ingreso
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  );
}
