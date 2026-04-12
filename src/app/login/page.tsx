
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { getSession, setSession } from '@/lib/auth';
import { loginUser } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
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

    const result = await loginUser(email, password);

    if (!result.success || !result.user) {
      setError(result.error ?? 'Correo o contraseña incorrectos.');
      setIsSubmitting(false);
      return;
    }

    setSession({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      modules: result.user.modules,
      mustChangePassword: result.user.mustChangePassword,
    });
    router.push('/');
  };

  return (
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
              <div className="flex flex-col items-center gap-1">
                <Sparkles className="h-10 w-10 text-primary" />
                <span className="text-2xl font-bold text-primary font-headline leading-tight">AK Producciones</span>
                <span className="text-sm font-medium text-muted-foreground">Eventos</span>
              </div>
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
  );
}

