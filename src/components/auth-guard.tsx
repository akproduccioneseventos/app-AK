
'use client';

import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldCheck, LogIn, LogOut } from 'lucide-react';
import Image from 'next/image';

interface AuthGuardProps {
  children: ReactNode;
}

const HARDCODED_PASSWORD = "akadmin2024"; // ¡Cambia esto por algo más seguro si quieres!
const AUTH_KEY = 'app_authenticated';

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check localStorage only on the client side after mount
    const storedAuth = localStorage.getItem(AUTH_KEY);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (password === HARDCODED_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setError('');
      setPassword(''); // Clear password field
    } else {
      setError('Contraseña incorrecta. Intenta de nuevo.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    // Consider redirecting to a login page or simply showing the form again
  };
  
  // This effect could be added to AppShell or a similar top-level client component
  // to provide a global logout function if needed elsewhere.
  useEffect(() => {
    const logoutEventHandler = () => handleLogout();
    window.addEventListener('app-logout', logoutEventHandler);
    return () => window.removeEventListener('app-logout', logoutEventHandler);
  }, []);


  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary">
        <CardHeader className="text-center space-y-4 pt-8">
           <Image 
            src="https://placehold.co/150x80.png?text=AK+Logo" 
            alt="AK Producciones Logo" 
            width={120} 
            height={64} 
            className="mx-auto rounded-sm"
            data-ai-hint="company event logo"
          />
          <CardTitle className="text-2xl font-bold font-headline flex items-center justify-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary"/> Acceso Protegido
          </CardTitle>
          <CardDescription>
            Ingresa la contraseña para acceder a la aplicación.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 pb-8">
            <div className="space-y-2">
              <Label htmlFor="password-guard">Contraseña</Label>
              <Input
                id="password-guard"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña de acceso"
                required
                className="text-base p-3"
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-lg py-6">
              <LogIn className="w-5 h-5 mr-2" />
              Ingresar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Helper function to dispatch a logout event (can be called from AppShell)
export function triggerAppLogout() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent('app-logout'));
  }
}
