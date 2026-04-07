
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
import { LogIn, Loader2, KeyRound, ShieldQuestion, CheckCircle2, Info } from "lucide-react";
import Image from "next/image";
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { loginUser, getSecurityQuestions, resetPasswordWithQuestions } from '@/app/actions/auth';
import { getSession, setSession, generateToken } from '@/lib/auth';

type ForgotStep = 'email' | 'questions' | 'newPassword' | 'done';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  // Forgot-password dialog state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotNoQuestions, setForgotNoQuestions] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [securityQuestions, setSecurityQuestions] = useState<{ q1: string; q2: string; q3: string } | null>(null);
  const [answers, setAnswers] = useState({ a1: '', a2: '', a3: '' });
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  useEffect(() => {
    // If already authenticated, redirect to home
    if (getSession()) {
      router.push('/');
      return;
    }

    async function fetchLogo() {
      try {
        const settings = await getInvoiceTemplateSettings();
        setLogoUrl(settings.logoUrl);
      } catch {
        setLogoUrl(null);
      }
    }
    fetchLogo();
  }, [router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await loginUser(email, password);
      if (!result.success || !result.user) {
        setError(result.error ?? 'Error al iniciar sesión.');
        return;
      }

      const token = generateToken(result.user.id);
      setSession({
        token,
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        modules: result.user.modules,
        mustChangePassword: result.user.mustChangePassword,
        createdAt: Date.now(),
      });

      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Error al iniciar sesión. Verificá tus datos e intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email);
    setForgotStep('email');
    setForgotError('');
    setForgotNoQuestions(false);
    setSecurityQuestions(null);
    setAnswers({ a1: '', a2: '', a3: '' });
    setNewPassword('');
    setNewPasswordConfirm('');
    setForgotOpen(true);
  };

  const handleForgotEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotNoQuestions(false);

    const result = await getSecurityQuestions(forgotEmail);
    setForgotLoading(false);

    if (!result.success || !result.questions) {
      if (result.noQuestionsConfigured) {
        setForgotNoQuestions(true);
      }
      setForgotError(result.error ?? 'Error al obtener las preguntas.');
      return;
    }

    setSecurityQuestions(result.questions);
    setForgotStep('questions');
  };

  const handleAnswersSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!answers.a1.trim() || !answers.a2.trim() || !answers.a3.trim()) {
      setForgotError('Debes responder las 3 preguntas.');
      return;
    }
    setForgotError('');
    setForgotStep('newPassword');
  };

  const handleNewPasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotError('');

    if (newPassword !== newPasswordConfirm) {
      setForgotError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setForgotLoading(true);
    const result = await resetPasswordWithQuestions(forgotEmail, answers, newPassword);
    setForgotLoading(false);

    if (!result.success) {
      setForgotError(result.error ?? 'Error al restablecer la contraseña.');
      setForgotStep('questions'); // Go back to questions step
      return;
    }

    setForgotStep('done');
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

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldQuestion className="w-5 h-5 text-primary" />
              {forgotStep === 'done' ? 'Contraseña restablecida' : 'Recuperar contraseña'}
            </DialogTitle>
            <DialogDescription>
              {forgotStep === 'email' && 'Ingresá tu correo para continuar.'}
              {forgotStep === 'questions' && 'Respondé las preguntas de seguridad.'}
              {forgotStep === 'newPassword' && 'Creá tu nueva contraseña.'}
              {forgotStep === 'done' && 'Ya podés iniciar sesión con tu nueva contraseña.'}
            </DialogDescription>
          </DialogHeader>

          {forgotStep === 'done' && (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-green-600">
                ¡Contraseña actualizada exitosamente!
              </p>
              <Button className="w-full" onClick={() => setForgotOpen(false)}>
                Cerrar
              </Button>
            </div>
          )}

          {forgotStep === 'email' && (
            <form onSubmit={handleForgotEmailSubmit}>
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
                  disabled={forgotLoading}
                />
                {forgotNoQuestions && forgotError && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Sin preguntas de seguridad</AlertTitle>
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}
                {!forgotNoQuestions && forgotError && (
                  <Alert variant="destructive">
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setForgotOpen(false)} disabled={forgotLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Continuar
                </Button>
              </DialogFooter>
            </form>
          )}

          {forgotStep === 'questions' && securityQuestions && (
            <form onSubmit={handleAnswersSubmit}>
              <div className="space-y-4 py-2">
                {forgotError && (
                  <Alert variant="destructive">
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label>{securityQuestions.q1}</Label>
                  <Input
                    value={answers.a1}
                    onChange={(e) => setAnswers(a => ({ ...a, a1: e.target.value }))}
                    placeholder="Tu respuesta"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{securityQuestions.q2}</Label>
                  <Input
                    value={answers.a2}
                    onChange={(e) => setAnswers(a => ({ ...a, a2: e.target.value }))}
                    placeholder="Tu respuesta"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{securityQuestions.q3}</Label>
                  <Input
                    value={answers.a3}
                    onChange={(e) => setAnswers(a => ({ ...a, a3: e.target.value }))}
                    placeholder="Tu respuesta"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setForgotStep('email')}>
                  Volver
                </Button>
                <Button type="submit">
                  Verificar respuestas
                </Button>
              </DialogFooter>
            </form>
          )}

          {forgotStep === 'newPassword' && (
            <form onSubmit={handleNewPasswordSubmit}>
              <div className="space-y-4 py-2">
                {forgotError && (
                  <Alert variant="destructive">
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={forgotLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password-confirm">Confirmar contraseña</Label>
                  <Input
                    id="new-password-confirm"
                    type="password"
                    placeholder="Repetí la contraseña"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    required
                    disabled={forgotLoading}
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setForgotStep('questions')} disabled={forgotLoading}>
                  Volver
                </Button>
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-2" />
                  )}
                  {forgotLoading ? 'Guardando...' : 'Guardar contraseña'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
