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
import { clearSession, setSession } from '@/lib/auth';
import { getSessionStatus } from '@/app/actions/session';
import { sanitizeAppRedirect } from '@/lib/auth/redirect';
import {
  getPublicSecurityRecoveryStatus,
  requestPasswordResetEmail,
  resetPasswordWithCode,
  resetPasswordWithGoogleIdToken,
  resetPasswordWithRecoveryCode,
  resetPasswordWithSecurityAnswers,
  loginWithPassword,
  loginWithGoogleIdToken,
} from '@/app/actions/simple-auth';

type RecoveryStatus = Awaited<ReturnType<typeof getPublicSecurityRecoveryStatus>>;

const RECOVERY_STATUS_FALLBACK: RecoveryStatus = {
  hasRecoveryEmail: false,
  hasSecurityQuestions: false,
  hasBackupCodes: false,
  backupCodeCount: 0,
  gmailConnected: false,
  gmailWarning: 'No se pudo verificar la recuperacion automaticamente. Podes intentar entrar o volver a pedir la verificacion.',
};

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs = 3500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

function getRedirectPath() {
  return sanitizeAppRedirect(new URLSearchParams(window.location.search).get('redirect'));
}

function GoogleMark() {
  return (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
  const [recovery, setRecovery] = useState<RecoveryStatus | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function loadLoginData() {
      const hasServerSession = await withTimeout(getSessionStatus(), false);
      if (!active) return;
      if (hasServerSession) {
        setSession();
        router.replace(getRedirectPath());
        return;
      }

      // The signed cookie is authoritative. Clearing stale browser state avoids
      // a redirect loop after the server session expires.
      clearSession();

      try {
        const googleAuth = await import('@/lib/firebase/google-auth-client');
        const redirectToken = await googleAuth.consumeGoogleRedirectToken();
        if (redirectToken) {
          const response = await loginWithGoogleIdToken(redirectToken);
          await googleAuth.clearGoogleAuthSession();
          if (response.success) {
            setSession();
            router.replace(getRedirectPath());
            router.refresh();
            return;
          }
          setError(response.error || 'Acceso denegado.');
        }
      } catch (googleError) {
        const googleAuth = await import('@/lib/firebase/google-auth-client');
        setError(googleAuth.getGoogleAuthErrorMessage(googleError));
        await googleAuth.clearGoogleAuthSession();
      }

      const [settings, recoveryStatus] = await Promise.all([
        withTimeout(getInvoiceTemplateSettings(), { logoUrl: null } as Awaited<ReturnType<typeof getInvoiceTemplateSettings>>),
        withTimeout(getPublicSecurityRecoveryStatus(), RECOVERY_STATUS_FALLBACK),
      ]);
      if (!active) return;
      setLogoUrl(settings.logoUrl);
      setRecovery(recoveryStatus);
    }
    loadLoginData();

    return () => {
      active = false;
    };
  }, [router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');

    try {
      const result = await loginWithPassword(password);
      if (!result.success) {
        setError(result.error || 'Contraseña incorrecta.');
        setIsSubmitting(false);
        return;
      }

      setSession();
      router.replace(getRedirectPath());
      router.refresh();
    } catch {
      setError('Error al verificar la contraseña.');
      setIsSubmitting(false);
    }
  };
 
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError('');
    setNotice('');

    try {
      const googleAuth = await import('@/lib/firebase/google-auth-client');
      if (googleAuth.shouldPreferGoogleRedirect()) {
        await googleAuth.startGoogleSignInRedirect();
        return;
      }

      const token = await googleAuth.signInWithGooglePopup();
      const response = await loginWithGoogleIdToken(token);
      await googleAuth.clearGoogleAuthSession();
      if (!response.success) {
        setError(response.error || 'Acceso denegado.');
        return;
      }

      setSession();
      router.replace(getRedirectPath());
      router.refresh();
    } catch (googleError) {
      const googleAuth = await import('@/lib/firebase/google-auth-client');
      if (googleAuth.shouldFallbackToGoogleRedirect(googleError)) {
        await googleAuth.startGoogleSignInRedirect();
        return;
      }
      setError(googleAuth.getGoogleAuthErrorMessage(googleError));
      await googleAuth.clearGoogleAuthSession();
    } finally {
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
      if (result.error && !recovery?.gmailConnected) {
        setRecovery((current) => current ? { ...current, gmailWarning: result.error } : current);
      }
    }
    setIsSubmitting(false);
  };

  const validateResetPasswords = () => {
    if (resetPassword !== resetConfirmPassword) {
      setError('Las contraseñas no coinciden.');
      return false;
    }
    if (resetPassword.length < 10) {
      setError('La nueva contraseña debe tener al menos 10 caracteres.');
      return false;
    }
    if (!/[a-zA-Z]/.test(resetPassword) || !/\d/.test(resetPassword)) {
      setError('La nueva contraseña debe combinar letras y numeros.');
      return false;
    }
    return true;
  };

  const handleResetWithGoogle = async () => {
    setIsSubmitting(true);
    setError('');
    setNotice('');
    if (!validateResetPasswords()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const googleAuth = await import('@/lib/firebase/google-auth-client');
      const token = await googleAuth.signInWithGooglePopup();
      const result = await resetPasswordWithGoogleIdToken(token, resetPassword);
      await googleAuth.clearGoogleAuthSession();
      if (!result.success) {
        setError(result.error || 'No se pudo recuperar el acceso con Google.');
        return;
      }

      setSession();
      setResetPassword('');
      setResetConfirmPassword('');
      router.replace(getRedirectPath());
      router.refresh();
    } catch (googleError) {
      const googleAuth = await import('@/lib/firebase/google-auth-client');
      setError(googleAuth.getGoogleAuthErrorMessage(googleError));
      await googleAuth.clearGoogleAuthSession();
    } finally {
      setIsSubmitting(false);
    }
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

  const handleResetWithBackupCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');
    if (!validateResetPasswords()) {
      setIsSubmitting(false);
      return;
    }
    const result = await resetPasswordWithRecoveryCode(backupCode, resetPassword);
    if (result.success) {
      setNotice('Contraseña actualizada. Ya podes entrar.');
      setMode('login');
      setBackupCode('');
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
          <CardDescription>{mode === 'login' ? 'Ingresa la contraseña para acceder.' : 'Recupera el acceso con el Gmail de AK.'}</CardDescription>
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

              <div className="relative flex py-2 items-center w-full">
                <div className="flex-grow border-t border-muted"></div>
                <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase">O</span>
                <div className="flex-grow border-t border-muted"></div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full relative hover:bg-muted/50 transition-colors"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
              >
                <GoogleMark />
                Ingresar con Google
              </Button>

              <Button type="button" variant="link" className="h-auto p-0 text-xs mt-2" onClick={() => { setMode('recovery'); setError(''); setNotice(''); }}>
                Olvide mi contraseña
              </Button>
            </CardFooter>
          </form>
        ) : (
          <div>
            <CardContent className="space-y-5">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground space-y-1">
                <p>{recovery?.hasRecoveryEmail ? `Mail de recuperacion: ${recovery.recoveryEmailHint}.` : 'Todavia no hay mail de recuperacion configurado.'}</p>
                <p className={recovery?.gmailConnected ? 'text-emerald-700' : 'text-amber-700'}>
                  {recovery?.gmailConnected
                    ? `Gmail conectado${recovery.gmailAccountHint ? `: ${recovery.gmailAccountHint}` : ''}.`
                    : recovery?.gmailWarning || 'Gmail todavia no esta conectado para enviar codigos.'}
                </p>
                {recovery?.hasBackupCodes ? <p>Tenes {recovery.backupCodeCount} codigo(s) de respaldo disponible(s).</p> : null}
              </div>

              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-semibold">Nueva contrasena para recuperar acceso</p>
                <Input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} placeholder="Minimo 10 caracteres, letras y numeros" disabled={isSubmitting} />
                <Input type="password" value={resetConfirmPassword} onChange={(event) => setResetConfirmPassword(event.target.value)} placeholder="Repetir nueva contrasena" disabled={isSubmitting} />
              </div>

              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
                <p className="text-sm font-semibold text-blue-950">Recuperar verificando tu Gmail</p>
                <p className="text-xs leading-relaxed text-blue-800">
                  Confirma la cuenta Google autorizada y la nueva contrasena se guarda sin depender del envio de correos.
                </p>
                <Button type="button" className="w-full" onClick={handleResetWithGoogle} disabled={isSubmitting || !resetPassword || !resetConfirmPassword}>
                  <GoogleMark />
                  Verificar Gmail y recuperar acceso
                </Button>
              </div>

              <form onSubmit={handleResetWithCode} className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-semibold">Recibir un codigo por correo</p>
                {!recovery?.gmailConnected && recovery?.hasRecoveryEmail ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-relaxed text-amber-800">
                    El boton vuelve a verificar Gmail al tocarlo. Si la cuenta sigue desconectada, usa codigos de respaldo o preguntas de seguridad y reconecta Google Workspace desde Ajustes.
                  </p>
                ) : null}
                <Button type="button" variant="outline" className="w-full" onClick={handleRequestCode} disabled={isSubmitting || !recovery?.hasRecoveryEmail}>
                  {recovery?.gmailConnected ? 'Enviar codigo por Gmail' : 'Verificar Gmail y enviar codigo'}
                </Button>
                <Input value={resetCode} onChange={(event) => setResetCode(event.target.value)} placeholder="Codigo de 6 numeros" inputMode="numeric" disabled={isSubmitting} />
                <Button type="submit" className="w-full" disabled={isSubmitting || !resetCode || !resetPassword}>
                  Cambiar con codigo
                </Button>
              </form>

              {recovery?.hasBackupCodes && (
                <form onSubmit={handleResetWithBackupCode} className="space-y-3 rounded-lg border p-3">
                  <p className="text-sm font-semibold">Recuperar con codigo de respaldo</p>
                  <Input value={backupCode} onChange={(event) => setBackupCode(event.target.value)} placeholder="XXXX-XXXX-XXXX" disabled={isSubmitting} />
                  <Button type="submit" variant="secondary" className="w-full" disabled={isSubmitting || !backupCode || !resetPassword}>
                    Cambiar con respaldo
                  </Button>
                </form>
              )}

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
