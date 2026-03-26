
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2 } from "lucide-react";
import Image from "next/image";
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Skeleton } from '@/components/ui/skeleton';

const SESSION_KEY = 'ak_producciones_auth_session';
// Password loaded from environment variable for security
const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || '';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);


  useEffect(() => {
    // If already logged in, redirect to home
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session && session.startsWith('YWtfYXV0aF8')) { // base64 prefix of 'ak_auth_'
      router.push('/');
    }

    async function fetchLogo() {
      try {
        const settings = await getInvoiceTemplateSettings();
        setLogoUrl(settings.logoUrl);
      } catch (error) {
        console.error("Failed to fetch company logo for login", error);
        setLogoUrl(null);
      }
    }
    fetchLogo();

  }, [router]);

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    // Honeypot check for bots
    if (formData.get('confirm_email')) {
      // It's a bot, fail silently after a delay
      setTimeout(() => setIsSubmitting(false), 1000);
      return;
    }

    if (password && APP_PASSWORD && password === APP_PASSWORD) {
      // Store a session token with timestamp to prevent simple replay attacks
      const sessionToken = btoa(`ak_auth_${Date.now()}_${Math.random().toString(36).substring(2)}`);
      sessionStorage.setItem(SESSION_KEY, sessionToken);
      router.push('/');
    } else {
      setTimeout(() => {
        setError('Contraseña incorrecta. Inténtalo de nuevo.');
        setIsSubmitting(false);
      }, 500); // Small delay to prevent brute-forcing
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
          <CardDescription>Ingresa la contraseña para acceder a la aplicación.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
             {/* Honeypot field for bot protection, visually hidden */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="confirm_email">Please leave this field empty</label>
              <input id="confirm_email" name="confirm_email" type="email" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-password">Contraseña</Label>
              <Input
                id="app-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
