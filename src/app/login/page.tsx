'use client';

import { useState, type FormEvent, type MouseEvent, useEffect } from 'react';
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
  verifyResetCode,
  resetPasswordWithCode,
  resetPasswordWithGoogleIdToken,
  resetPasswordWithRecoveryCode,
  resetPasswordWithSecurityAnswers,
  loginWithPassword,
  loginWithGoogleIdToken,
} from '@/app/actions/simple-auth';
import { loginUser } from '@/app/actions/auth';
import type { DiagnosticoAcceso } from '@/lib/auth/diagnostico-acceso';

type RecoveryStatus = Awaited<ReturnType<typeof getPublicSecurityRecoveryStatus>>;

const PUBLIC_RECOVERY_EMAIL =
  process.env.NEXT_PUBLIC_AUTH_ALLOWED_EMAILS?.split(',')[0]?.trim().toLowerCase() ||
  'akproduccionessalto@gmail.com';
const PUBLIC_RECOVERY_EMAIL_HINT = PUBLIC_RECOVERY_EMAIL.replace(/^(.{2}).*(@.*)$/, '$1***$2');

const RECOVERY_STATUS_FALLBACK: RecoveryStatus = {
  hasRecoveryEmail: true,
  hasSecurityQuestions: false,
  hasBackupCodes: false,
  backupCodeCount: 0,
  gmailConnected: false,
  gmailWarning: 'No se pudo confirmar la conexion con Gmail automaticamente. Podes volver a verificarla al solicitar el codigo.',
  recoveryEmailHint: PUBLIC_RECOVERY_EMAIL_HINT,
};

/**
 * Cuanto se espera al servidor antes de avisar en pantalla.
 *
 * Son 25 segundos a proposito, no 3: el servidor esta puesto para apagarse solo
 * cuando pasa un rato sin visitas (decision del dueno, porque dejarlo despierto se
 * paga), asi que la primera entrada del dia paga el arranque. Cortar antes dejaria
 * afuera un ingreso que iba a funcionar.
 */
const ESPERA_MAXIMA_MS = 25000;

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs = 3500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

async function confirmServerSession() {
  // Evitar la verificacion inmediata del servidor en la pantalla de login para prevenir
  // condiciones de carrera y timeouts en producción. El AuthGuard y las acciones protegidas
  // validan la sesion de manera segura en la pagina de destino.
  return true;
}

function getRedirectPath() {
  return sanitizeAppRedirect(new URLSearchParams(window.location.search).get('redirect'));
}

function enterAuthenticatedApp() {
  setSession();
  window.location.replace(getRedirectPath());
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
  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  const [recoveryStep, setRecoveryStep] = useState<'method' | 'verify' | 'new-password'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'google' | 'backup' | 'questions' | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
  const [recovery, setRecovery] = useState<RecoveryStatus>(RECOVERY_STATUS_FALLBACK);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Cuando un intento falla, la app averigua sola por que y lo dice en criollo.
  // Antes habia que leer registros del servidor para distinguir cuatro problemas
  // distintos, y el dueno no es programador: la app tiene que averiguarlo ella.
  const [diagnostico, setDiagnostico] = useState<DiagnosticoAcceso | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    if (new URLSearchParams(window.location.search).get('mode') === 'recovery') {
      setMode('recovery');
    }

    async function loadLoginData() {
      const hasServerSession = await withTimeout(getSessionStatus(), false);
      if (!active) return;
      if (hasServerSession) {
        enterAuthenticatedApp();
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
            if (!await confirmServerSession()) {
              clearSession();
              setError('Google verifico tu identidad, pero no se pudo crear la sesion segura. Intenta nuevamente.');
              return;
            }
            enterAuthenticatedApp();
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
  }, []);

  const openRecovery = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.history.pushState({}, '', '/login?mode=recovery');
    setMode('recovery');
    setError('');
    setNotice('');
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');
    setDiagnostico(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // TOPE DE ESPERA. Antes esta llamada no tenia ninguno: si el servidor tardaba
      // en despertarse o la base no contestaba, el boton se quedaba en
      // "Ingresando..." para siempre, sin error y sin poder reintentar. Es lo que
      // reporto el dueno: "aprieto el boton y nada".
      const respuesta = await Promise.race([
        (normalizedEmail
          ? loginUser(normalizedEmail, password)
          : loginWithPassword(password)
        ).then((r) => ({ llego: true as const, r })),
        new Promise<{ llego: false }>((resolve) =>
          window.setTimeout(() => resolve({ llego: false }), ESPERA_MAXIMA_MS),
        ),
      ]);

      if (!respuesta.llego) {
        setError(
          'El servidor está tardando en contestar. Suele pasar la primera vez del día: '
          + 'esperá unos segundos y volvé a intentar.',
        );
        setIsSubmitting(false);
        return;
      }

      const result = respuesta.r;
      if (!result.success) {
        setError(result.error || 'Correo o contraseña incorrectos.');
        setIsSubmitting(false);
        // El diagnostico viene dentro de la misma respuesta. Si no vino, no se
        // muestra nada extra: nunca se inventa una explicacion.
        setDiagnostico(result.diagnostico ?? null);
        return;
      }

      if (!await confirmServerSession()) {
        clearSession();
        setError('La contrasena fue aceptada, pero no se pudo crear la sesion segura. Intenta nuevamente.');
        setIsSubmitting(false);
        return;
      }

      enterAuthenticatedApp();
    } catch {
      setError('Error al verificar la contraseña.');
      setIsSubmitting(false);
    }
  };
 
  /**
   * Manda a Google por el desvio y **se queda mirando si de verdad se va**.
   *
   * El desvio puede no navegar a ningun lado y no tirar ningun error: pasa en los
   * navegadores que bloquean el guardado de datos de otros sitios. Si eso ocurre, sin
   * esto la persona se queda mirando un boton que no hizo nada. Con esto, a los cuatro
   * segundos se le dice que ese camino esta cerrado y cual usar.
   */
  const irAGooglePorDesvio = async (
    googleAuth: typeof import('@/lib/firebase/google-auth-client'),
  ) => {
    await googleAuth.startGoogleSignInRedirect();
    window.setTimeout(() => {
      setIsSubmitting(false);
      setError(
        'Tu navegador esta bloqueando el ingreso con Google. Probá desde otro navegador, '
        + 'o entrá con tu correo y contraseña.',
      );
    }, 4000);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError('');
    setNotice('');

    try {
      const googleAuth = await import('@/lib/firebase/google-auth-client');
      if (googleAuth.shouldPreferGoogleRedirect()) {
        await irAGooglePorDesvio(googleAuth);
        return;
      }

      const token = await googleAuth.signInWithGooglePopup();
      const response = await loginWithGoogleIdToken(token);
      await googleAuth.clearGoogleAuthSession();
      if (!response.success) {
        setError(response.error || 'Acceso denegado.');
        return;
      }

      if (!await confirmServerSession()) {
        clearSession();
        setError('Google verifico tu identidad, pero no se pudo crear la sesion segura. Intenta nuevamente.');
        return;
      }

      enterAuthenticatedApp();
    } catch (googleError) {
      const googleAuth = await import('@/lib/firebase/google-auth-client');
      if (googleAuth.shouldFallbackToGoogleRedirect(googleError)) {
        await irAGooglePorDesvio(googleAuth);
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
    try {
      const result = await requestPasswordResetEmail();
      if (result.success) {
        setNotice(result.sent ? 'Te enviamos un codigo al mail de recuperacion.' : result.warning || 'Codigo generado.');
        setCodeSent(true);
      } else {
        setError(result.error || 'No se pudo enviar el codigo.');
        if (result.error && !recovery?.gmailConnected) {
          setRecovery((current) => current ? { ...current, gmailWarning: result.error } : current);
        }
      }
    } catch {
      setError('No se pudo solicitar el codigo. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmailCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await verifyResetCode(resetCode);
      if (result.success) {
        setNotice('Codigo verificado con exito. Escribi tu nueva contraseña.');
        setRecoveryStep('new-password');
      } else {
        setError(result.error || 'Codigo incorrecto.');
      }
    } catch {
      setError('Error al verificar el codigo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyGoogle = async () => {
    setIsSubmitting(true);
    setError('');
    setNotice('');
    try {
      const googleAuth = await import('@/lib/firebase/google-auth-client');
      const token = await googleAuth.signInWithGooglePopup();
      if (!token) {
        setError('No se pudo autenticar con Google.');
        setIsSubmitting(false);
        return;
      }
      setGoogleIdToken(token);
      setNotice('Identidad de Google verificada. Escribi tu nueva contraseña.');
      setRecoveryStep('new-password');
    } catch (googleError) {
      const googleAuth = await import('@/lib/firebase/google-auth-client');
      setError(googleAuth.getGoogleAuthErrorMessage(googleError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithBackupCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!backupCode.trim()) {
      setError('Ingresa el codigo de respaldo.');
      return;
    }
    setError('');
    setNotice('Codigo de respaldo ingresado. Escribi tu nueva contraseña.');
    setRecoveryStep('new-password');
  };

  const handleContinueWithQuestions = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answers.q1.trim() || !answers.q2.trim() || !answers.q3.trim()) {
      setError('Responde las 3 preguntas de seguridad.');
      return;
    }
    setError('');
    setNotice('Respuestas completadas. Escribi tu nueva contraseña.');
    setRecoveryStep('new-password');
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

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setNotice('');

    if (!validateResetPasswords()) {
      setIsSubmitting(false);
      return;
    }

    try {
      let result: { success: boolean; error?: string };
      if (selectedMethod === 'email') {
        result = await resetPasswordWithCode(resetCode, resetPassword);
      } else if (selectedMethod === 'google') {
        result = await resetPasswordWithGoogleIdToken(googleIdToken, resetPassword);
      } else if (selectedMethod === 'backup') {
        result = await resetPasswordWithRecoveryCode(backupCode, resetPassword);
      } else if (selectedMethod === 'questions') {
        result = await resetPasswordWithSecurityAnswers({ answers, newPassword: resetPassword });
      } else {
        setError('Metodo de recuperacion no valido.');
        setIsSubmitting(false);
        return;
      }

      if (result.success) {
        if (!await confirmServerSession()) {
          clearSession();
          setError('La contraseña se actualizó, pero no se pudo crear la sesión segura. Ingresa con la nueva contraseña.');
          setMode('login');
          setRecoveryStep('method');
          return;
        }
        setNotice('Contraseña actualizada. Ingresando al panel...');
        enterAuthenticatedApp();
        return;
      } else {
        setError(result.error || 'No se pudo actualizar la contraseña.');
      }
    } catch {
      setError('Error al procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
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
          <CardTitle className="text-3xl font-bold font-headline">
            {mode === 'login' ? 'Acceso Protegido' : 'Recuperar Acceso'}
          </CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Ingresa con tu correo y contraseña.'
              : recoveryStep === 'method'
              ? 'Elige un método para recuperar tu acceso.'
              : recoveryStep === 'verify'
              ? 'Completa la verificación requerida.'
              : 'Escribe tu nueva contraseña de acceso.'}
          </CardDescription>
        </CardHeader>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Correo electrónico</Label>
                <Input
                  id="login-email"
                  data-testid="login-email"
                  type="email"
                  placeholder="nombre@correo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>
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
              {diagnostico && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-center">
                  <p className="text-sm font-semibold text-amber-900">{diagnostico.causa}</p>
                  <p className="mt-1 text-xs text-amber-800">{diagnostico.queHacer}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button className="w-full" type="submit" data-testid="login-submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
              {/*
                El aviso de la espera. Sin esto, la primera entrada del dia deja el
                boton diciendo "Ingresando..." varios segundos sin nada mas en
                pantalla, y parece que la aplicacion no anda: el dueno reporto
                exactamente eso, que apretaba y no pasaba nada.
              */}
              {isSubmitting && (
                <p className="text-xs text-center text-muted-foreground">
                  La primera entrada del día puede demorar unos segundos. Ya está andando.
                </p>
              )}

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

              <Button asChild variant="link" className="h-auto p-0 text-xs mt-2">
                <a href="/login?mode=recovery" onClick={openRecovery}>
                Olvide mi contraseña
                </a>
              </Button>
            </CardFooter>
          </form>
        ) : (
          <div>
            <CardContent className="space-y-5">
              {recoveryStep === 'method' && (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                    <p>{recovery?.hasRecoveryEmail ? `Mail de recuperación: ${recovery.recoveryEmailHint}.` : 'Todavía no hay mail de recuperación configurado.'}</p>
                    <p className={recovery?.gmailConnected ? 'text-emerald-700' : 'text-amber-700'}>
                      {recovery?.gmailConnected
                        ? `Gmail conectado${recovery.gmailAccountHint ? `: ${recovery.gmailAccountHint}` : ''}.`
                        : recovery?.gmailWarning || 'Gmail todavía no está conectado para enviar códigos.'}
                    </p>
                    {recovery?.hasBackupCodes ? <p>Tenés {recovery.backupCodeCount} código(s) de respaldo disponible(s).</p> : null}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Elige el método de verificación</p>
                    <div className="grid gap-2">
                      {recovery?.hasRecoveryEmail && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start py-5 text-left border hover:bg-muted/50 transition-all"
                          onClick={() => { setSelectedMethod('email'); setRecoveryStep('verify'); setError(''); setNotice(''); }}
                          disabled={isSubmitting}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Código por Correo</span>
                            <span className="text-xs text-muted-foreground">Envía un código de 6 números a {recovery.recoveryEmailHint}</span>
                          </div>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start py-5 text-left border hover:bg-muted/50 transition-all"
                        onClick={() => { setSelectedMethod('google'); setRecoveryStep('verify'); setError(''); setNotice(''); }}
                        disabled={isSubmitting}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">Verificar con Google</span>
                          <span className="text-xs text-muted-foreground">Confirma rápido con tu cuenta autorizada</span>
                        </div>
                      </Button>

                      {recovery?.hasBackupCodes && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start py-5 text-left border hover:bg-muted/50 transition-all"
                          onClick={() => { setSelectedMethod('backup'); setRecoveryStep('verify'); setError(''); setNotice(''); }}
                          disabled={isSubmitting}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Código de Respaldo</span>
                            <span className="text-xs text-muted-foreground">Usa uno de tus códigos de 12 letras de respaldo</span>
                          </div>
                        </Button>
                      )}

                      {recovery?.questions && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start py-5 text-left border hover:bg-muted/50 transition-all"
                          onClick={() => { setSelectedMethod('questions'); setRecoveryStep('verify'); setError(''); setNotice(''); }}
                          disabled={isSubmitting}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Preguntas de Seguridad</span>
                            <span className="text-xs text-muted-foreground">Responde las 3 preguntas secretas configuradas</span>
                          </div>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {recoveryStep === 'verify' && (
                <div className="space-y-4">
                  {selectedMethod === 'email' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Recibir un código por correo</p>
                        {!recovery?.gmailConnected && recovery?.hasRecoveryEmail ? (
                          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-relaxed text-amber-800">
                            El botón vuelve a verificar Gmail al tocarlo. Si la cuenta sigue desconectada, usa códigos de respaldo o preguntas de seguridad y reconecta Google Workspace desde Ajustes.
                          </p>
                        ) : null}
                        <Button type="button" variant="outline" className="w-full" onClick={handleRequestCode} disabled={isSubmitting || !recovery?.hasRecoveryEmail}>
                          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          {codeSent ? 'Reenviar código por Gmail' : 'Enviar código por Gmail'}
                        </Button>
                      </div>

                      {codeSent && (
                        <form onSubmit={handleVerifyEmailCode} className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="verify-email-code">Ingresa el código enviado</Label>
                            <Input
                              id="verify-email-code"
                              value={resetCode}
                              onChange={(event) => setResetCode(event.target.value)}
                              placeholder="Código de 6 números"
                              inputMode="numeric"
                              required
                              disabled={isSubmitting}
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={isSubmitting || !resetCode}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Verificar Código
                          </Button>
                        </form>
                      )}
                    </div>
                  )}

                  {selectedMethod === 'google' && (
                    <div className="space-y-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Haz clic a continuación para abrir la ventana de verificación de Google y confirmar tu identidad.
                      </p>
                      <Button type="button" className="w-full" onClick={handleVerifyGoogle} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GoogleMark />}
                        Verificar identidad con Google
                      </Button>
                    </div>
                  )}

                  {selectedMethod === 'backup' && (
                    <form onSubmit={handleContinueWithBackupCode} className="space-y-3">
                      <p className="text-sm font-semibold">Código de Respaldo</p>
                      <div className="space-y-2">
                        <Label htmlFor="verify-backup-code">Ingresa un código disponible</Label>
                        <Input
                          id="verify-backup-code"
                          value={backupCode}
                          onChange={(event) => setBackupCode(event.target.value)}
                          placeholder="XXXX-XXXX-XXXX"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting || !backupCode}>
                        Continuar
                      </Button>
                    </form>
                  )}

                  {selectedMethod === 'questions' && recovery?.questions && (
                    <form onSubmit={handleContinueWithQuestions} className="space-y-3">
                      <p className="text-sm font-semibold">Preguntas de Seguridad</p>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{recovery.questions.q1}</Label>
                          <Input value={answers.q1} onChange={(event) => setAnswers((current) => ({ ...current, q1: event.target.value }))} placeholder="Respuesta 1" required disabled={isSubmitting} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{recovery.questions.q2}</Label>
                          <Input value={answers.q2} onChange={(event) => setAnswers((current) => ({ ...current, q2: event.target.value }))} placeholder="Respuesta 2" required disabled={isSubmitting} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{recovery.questions.q3}</Label>
                          <Input value={answers.q3} onChange={(event) => setAnswers((current) => ({ ...current, q3: event.target.value }))} placeholder="Respuesta 3" required disabled={isSubmitting} />
                        </div>
                      </div>
                      <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                        Continuar
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {recoveryStep === 'new-password' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
                    <p className="text-sm font-semibold">Establecer nueva contraseña</p>
                    <div className="space-y-2">
                      <Label htmlFor="new-pwd">Nueva Contraseña</Label>
                      <Input
                        id="new-pwd"
                        type="password"
                        value={resetPassword}
                        onChange={(event) => setResetPassword(event.target.value)}
                        placeholder="Mínimo 10 caracteres, letras y números"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-pwd-confirm">Confirmar Contraseña</Label>
                      <Input
                        id="new-pwd-confirm"
                        type="password"
                        value={resetConfirmPassword}
                        onChange={(event) => setResetConfirmPassword(event.target.value)}
                        placeholder="Repetir nueva contraseña"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || !resetPassword || !resetConfirmPassword}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Guardar nueva contraseña
                  </Button>
                </form>
              )}

              {notice && <p className="text-sm text-emerald-700 text-center">{notice}</p>}
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  if (recoveryStep === 'method') {
                    setMode('login');
                  } else if (recoveryStep === 'verify') {
                    setRecoveryStep('method');
                    setSelectedMethod(null);
                  } else if (recoveryStep === 'new-password') {
                    if (selectedMethod === 'google') {
                      // Google goes back to method selection since identity token is validated in popup
                      setRecoveryStep('method');
                      setSelectedMethod(null);
                      setGoogleIdToken('');
                    } else {
                      setRecoveryStep('verify');
                    }
                  }
                  setError('');
                  setNotice('');
                }}
              >
                {recoveryStep === 'method'
                  ? 'Volver al ingreso'
                  : recoveryStep === 'verify'
                  ? 'Volver a métodos de recuperación'
                  : 'Volver a verificación'}
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  );
}
