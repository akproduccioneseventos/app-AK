
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
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
          <CardTitle className="text-3xl font-bold font-headline">Iniciar Sesión</CardTitle>
          <CardDescription>Bienvenido de nuevo. Ingresa tus credenciales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tu@correo.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" placeholder="••••••••" required />
          </div>
          <div className="flex items-center justify-between text-sm">
            <Link href="#" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" type="submit">
            <LogIn className="w-5 h-5 mr-2" />
            Iniciar Sesión
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Crear una cuenta
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
