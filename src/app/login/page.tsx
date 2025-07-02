'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2 } from "lucide-react";
import Image from "next/image";

const SESSION_KEY = 'ak_producciones_auth_session';
const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || 'SOydocenTE2124.';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to home
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      router.push('/');
    }
  }, [router]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // In a real app, this would be an API call.
    // For this app, a simple hardcoded password check is sufficient.
    if (password === APP_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
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
           <Image
            src="https://placehold.co/150x80.png?text=AK+Logo"
            alt="AK Producciones Logo"
            width={150}
            height={80}
            className="mx-auto rounded-sm"
            data-ai-hint="company logo elegant"
          />
          <CardTitle className="text-3xl font-bold font-headline">Acceso Protegido</CardTitle>
          <CardDescription>Ingresa la contraseña para acceder a la aplicación.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
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
