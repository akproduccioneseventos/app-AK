'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';
import { getSecurityQuestions, resetPasswordWithQuestions } from '@/app/actions/auth';

type Step = 'email' | 'questions' | 'success';

export default function RecuperarContrasenaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');

  // Step 1: Email
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Step 2: Questions + new password
  const [questions, setQuestions] = useState<{ q1: string; q2: string; q3: string } | null>(null);
  const [answers, setAnswers] = useState({ a1: '', a2: '', a3: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError('');
    setEmailLoading(true);

    const result = await getSecurityQuestions(email);
    setEmailLoading(false);

    if (!result.success || !result.questions) {
      if (result.noQuestionsConfigured) {
        setEmailError(
          'Este usuario no tiene preguntas de seguridad configuradas. ' +
          'Contactá al administrador para que restablezca tu contraseña.'
        );
      } else {
        setEmailError(result.error ?? 'No se pudo obtener las preguntas de seguridad.');
      }
      return;
    }

    setQuestions(result.questions);
    setStep('questions');
  };

  const handleResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetError('');

    if (newPassword.length < 8) {
      setResetError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Las contraseñas no coinciden.');
      return;
    }

    setResetLoading(true);
    const result = await resetPasswordWithQuestions(email, answers, newPassword);
    setResetLoading(false);

    if (!result.success) {
      setResetError(result.error ?? 'Error al restablecer la contraseña.');
      return;
    }

    setStep('success');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        {step === 'email' && (
          <>
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold font-headline">Recuperar contraseña</CardTitle>
              <CardDescription>
                Ingresá tu correo electrónico para verificar tu identidad con tus preguntas de seguridad.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleEmailSubmit}>
              <CardContent className="space-y-4">
                {emailError && (
                  <Alert variant="destructive">
                    <AlertDescription>{emailError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">Correo electrónico</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="tu-correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={emailLoading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full" type="submit" disabled={emailLoading}>
                  {emailLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 mr-2" />
                  )}
                  {emailLoading ? 'Verificando...' : 'Verificar correo'}
                </Button>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Volver al login
                </Link>
              </CardFooter>
            </form>
          </>
        )}

        {step === 'questions' && questions && (
          <>
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold font-headline">Preguntas de seguridad</CardTitle>
              <CardDescription>
                Respondé correctamente a tus preguntas de seguridad y elegí una nueva contraseña.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetSubmit}>
              <CardContent className="space-y-4">
                {resetError && (
                  <Alert variant="destructive">
                    <AlertDescription>{resetError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="q1">{questions.q1}</Label>
                  <Input
                    id="q1"
                    type="text"
                    value={answers.a1}
                    onChange={(e) => setAnswers(a => ({ ...a, a1: e.target.value }))}
                    required
                    disabled={resetLoading}
                    placeholder="Tu respuesta"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="q2">{questions.q2}</Label>
                  <Input
                    id="q2"
                    type="text"
                    value={answers.a2}
                    onChange={(e) => setAnswers(a => ({ ...a, a2: e.target.value }))}
                    required
                    disabled={resetLoading}
                    placeholder="Tu respuesta"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="q3">{questions.q3}</Label>
                  <Input
                    id="q3"
                    type="text"
                    value={answers.a3}
                    onChange={(e) => setAnswers(a => ({ ...a, a3: e.target.value }))}
                    required
                    disabled={resetLoading}
                    placeholder="Tu respuesta"
                    autoComplete="off"
                  />
                </div>

                <hr className="my-2" />

                <div className="space-y-2">
                  <Label htmlFor="new-pwd">Nueva contraseña</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={resetLoading}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pwd">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirm-pwd"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={resetLoading}
                    placeholder="Repetí la nueva contraseña"
                    autoComplete="new-password"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Las respuestas no distinguen mayúsculas de minúsculas.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full" type="submit" disabled={resetLoading}>
                  {resetLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-2" />
                  )}
                  {resetLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setAnswers({ a1: '', a2: '', a3: '' });
                    setNewPassword('');
                    setConfirmPassword('');
                    setResetError('');
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Volver
                </button>
              </CardFooter>
            </form>
          </>
        )}

        {step === 'success' && (
          <>
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold font-headline">¡Contraseña restablecida!</CardTitle>
              <CardDescription>
                Tu contraseña fue actualizada exitosamente. Ya podés iniciar sesión con tu nueva contraseña.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button className="w-full" onClick={() => router.push('/login')}>
                Ir al login
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
