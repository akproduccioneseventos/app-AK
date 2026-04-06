
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, Loader2, Mail } from "lucide-react";
import Image from "next/image";
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { signInAdmin, sendPasswordResetEmail, subscribeToAuthState } from '@/lib/firebase/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  // Forgot-password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [forgotError, setForgotError] = useState('');

  useEffect(() => {
    // If already authenticated, redirect to home
    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        router.push('/');
      }
    });

    async function fetchLogo() {
      try {
        const settings = await getInvoiceTemplateSettings();
        setLogoUrl(settings.logoUrl);
      } catch {
        setLogoUrl(null);
      }
    }
    fetchLogo();

    return unsubscribe;
  }, [router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await signInAdmin(email, password);
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === 'UNAUTHORIZED') {
        setError('Acceso no autorizado. Este correo no tiene permisos de acceso.');
      } else if (
        message.includes('auth/invalid-credential') ||
        message.includes('auth/wrong-password') ||
        message.includes('auth/user-not-found')
      ) {
        setError('Correo o contraseña incorrectos. Inténtalo de nuevo.');
      } else if (message.includes('auth/too-many-requests')) {
        setError('Demasiados intentos fallidos. Intentá más tarde o restablecé tu contraseña.');
      } else {
        setError('Error al iniciar sesión. Verificá tus datos e intentá de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotStatus('sending');
    setForgotError('');

    try {
      await sendPasswordResetEmail(forgotEmail);
      setForgotStatus('sent');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('auth/user-not-found') || message.includes('auth/invalid-email')) {
        setForgotError('No se encontró una cuenta con ese correo.');
      } else {
        setForgotError('No se pudo enviar el correo. Intentá de nuevo.');
      }
      setForgotStatus('error');
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email);
    setForgotStatus('idle');
    setForgotError('');
    setForgotOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto h-20 flex items-center justify-center">
              {logoUrl === undefined ? (
                <Skeleton className="h-16 w-36" />
              ) : logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo de la Empresa"
                  width={150}
                  height={80}
                  className="object-contain max-h-20"
                  priority
                  data-ai-hint="company logo"
                />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">AK Producciones</span>
              )}
            </div>
            <CardTitle className="text-3xl font-bold font-headline">Acceso Protegido</CardTitle>
            <CardDescription>Ingresá tu correo y contraseña para acceder.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Correo electrónico</Label>
                <Input
                  id="login-email"
                  data-testid="login-email"
                  type="email"
                  placeholder="admin@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <div className="text-right">
                <button
                  type="button"
                  data-testid="forgot-password-link"
                  onClick={openForgotModal}
                  className="text-sm text-primary hover:underline focus:outline-none"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                type="submit"
                data-testid="login-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5 mr-2" />
                )}
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Restablecer contraseña
            </DialogTitle>
            <DialogDescription>
              Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </DialogDescription>
          </DialogHeader>

          {forgotStatus === 'sent' ? (
            <div className="py-4 text-center space-y-2">
              <p className="text-sm font-medium text-green-600">
                ¡Correo enviado! Revisá tu bandeja de entrada.
              </p>
              <p className="text-xs text-muted-foreground">
                Si no lo ves, revisá la carpeta de spam.
              </p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <div className="space-y-3 py-2">
                <Label htmlFor="forgot-email">Correo electrónico</Label>
                <Input
                  id="forgot-email"
                  data-testid="forgot-email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={forgotStatus === 'sending'}
                />
                {forgotError && (
                  <p className="text-sm text-destructive">{forgotError}</p>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotOpen(false)}
                  disabled={forgotStatus === 'sending'}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  data-testid="forgot-submit"
                  disabled={forgotStatus === 'sending'}
                >
                  {forgotStatus === 'sending' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  {forgotStatus === 'sending' ? 'Enviando...' : 'Enviar enlace'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
