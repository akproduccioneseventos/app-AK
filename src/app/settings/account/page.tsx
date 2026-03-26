
'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UserCog, ShieldCheck, Lock, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [enable2FA, setEnable2FA] = useState(false);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "Las nuevas contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Contraseña Débil", description: "La nueva contraseña debe tener al menos 8 caracteres.", variant: "destructive" });
      return;
    }
    setIsSavingPassword(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({ title: "Contraseña Actualizada (Simulado)", description: "Tu contraseña ha sido actualizada con éxito." });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsSavingPassword(false);
  };
  
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({ title: "Cuenta Eliminada (Simulado)", description: "Tu cuenta ha sido eliminada. Serás redirigido.", variant: "destructive" });
    // router.push('/login'); // Redirect after actual deletion
    setIsDeletingAccount(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Seguridad y Cuenta
          </h1>
        </div>
        <Link href="/settings">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
      </div>

      {/* Change Password Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            <CardTitle className="font-headline text-xl">Cambiar Contraseña</CardTitle>
          </div>
          <CardDescription>Actualiza tu contraseña regularmente para mantener tu cuenta segura.</CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <div className="relative">
                <Input 
                  id="current-password" 
                  type={showCurrentPassword ? "text" : "password"} 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  required 
                  disabled={isSavingPassword}
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)} tabIndex={-1}>
                  {showCurrentPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <div className="relative">
                <Input 
                  id="new-password" 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                  disabled={isSavingPassword}
                />
                 <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1}>
                  {showNewPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmar Nueva Contraseña</Label>
               <div className="relative">
                <Input 
                  id="confirm-new-password" 
                  type={showConfirmNewPassword ? "text" : "password"} 
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  minLength={8}
                  required
                  disabled={isSavingPassword}
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} tabIndex={-1}>
                  {showConfirmNewPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
              {isSavingPassword ? "Guardando..." : "Guardar Contraseña"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Account Preferences Card */}
      <Card className="shadow-lg">
        <CardHeader>
           <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <CardTitle className="font-headline text-xl">Preferencias de Seguridad</CardTitle>
          </div>
          <CardDescription>Gestiona opciones adicionales de seguridad para tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="two-factor-auth" className="text-base font-medium">Autenticación de Dos Factores (2FA)</Label>
              <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad a tu cuenta.</p>
            </div>
            <Switch
              id="two-factor-auth"
              checked={enable2FA}
              onCheckedChange={setEnable2FA}
              disabled // Feature not implemented
            />
          </div>
           <p className="text-xs text-muted-foreground text-center">La autenticación de dos factores y otras preferencias de seguridad se habilitarán en futuras actualizaciones.</p>
        </CardContent>
      </Card>
      
      {/* Delete Account Card */}
      <Card className="shadow-lg border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-destructive" />
            <CardTitle className="font-headline text-xl text-destructive">Eliminar Cuenta</CardTitle>
          </div>
          <CardDescription>Esta acción es permanente y no se puede deshacer.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Si eliminas tu cuenta, todos tus datos, incluyendo eventos, clientes, facturas y presupuestos, serán eliminados permanentemente.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto" disabled={isDeletingAccount}>
                {isDeletingAccount && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                Eliminar mi Cuenta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Todos tus datos serán eliminados de forma permanente.
                  Escribe "ELIMINAR CUENTA" para confirmar.
                </AlertDialogDescription>
              </AlertDialogHeader>
               {/* Basic input for confirmation, real implementation would verify the input */}
              <Input type="text" placeholder='Escribe "ELIMINAR CUENTA"' className="my-2"/>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingAccount}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="bg-destructive hover:bg-destructive/80"
                >
                  {isDeletingAccount ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                  Sí, eliminar mi cuenta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
         <CardFooter>
          <p className="text-xs text-muted-foreground">La eliminación de cuenta está simulada. No se borrarán datos reales.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
