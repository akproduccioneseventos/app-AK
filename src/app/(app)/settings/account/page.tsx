'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { changeAppPassword, generateBackupRecoveryCodes, saveSecurityRecoverySettings } from '@/app/actions/simple-auth';

export default function AccountSettingsPage() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [questions, setQuestions] = useState({
    q1: { question: 'Nombre de tu primera mascota', answer: '' },
    q2: { question: 'Color favorito', answer: '' },
    q3: { question: 'Nombre de una persona de confianza', answer: '' },
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingRecovery, setIsSavingRecovery] = useState(false);
  const [isGeneratingBackupCodes, setIsGeneratingBackupCodes] = useState(false);

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Error', description: 'Las nuevas contraseñas no coinciden.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 10) {
      toast({ title: 'Contraseña debil', description: 'La nueva contraseña debe tener al menos 10 caracteres.', variant: 'destructive' });
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast({ title: 'Contraseña debil', description: 'La nueva contraseña debe combinar letras y numeros.', variant: 'destructive' });
      return;
    }
    setIsSavingPassword(true);
    const result = await changeAppPassword(currentPassword, newPassword);
    if (result.success) {
      toast({ title: 'Contraseña actualizada', description: 'Se guardo hasheada y la entrada actual sigue funcionando.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudo cambiar la contraseña.', variant: 'destructive' });
    }
    setIsSavingPassword(false);
  };

  const handleSaveRecovery = async (event: FormEvent) => {
    event.preventDefault();
    setIsSavingRecovery(true);
    const result = await saveSecurityRecoverySettings({
      currentPassword: recoveryPassword,
      recoveryEmail,
      questions,
    });
    if (result.success) {
      toast({ title: 'Recuperacion configurada', description: 'Ya podes recuperar acceso por mail o preguntas de seguridad.' });
      setRecoveryPassword('');
      setQuestions((current) => ({
        q1: { ...current.q1, answer: '' },
        q2: { ...current.q2, answer: '' },
        q3: { ...current.q3, answer: '' },
      }));
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudo guardar la recuperacion.', variant: 'destructive' });
    }
    setIsSavingRecovery(false);
  };

  const handleGenerateBackupCodes = async (event: FormEvent) => {
    event.preventDefault();
    setIsGeneratingBackupCodes(true);
    setBackupCodes([]);
    const result = await generateBackupRecoveryCodes(backupPassword);
    if (result.success && result.codes) {
      setBackupCodes(result.codes);
      setBackupPassword('');
      toast({ title: 'Codigos generados', description: 'Se muestran una sola vez para recuperar acceso si olvidas la contrasena.' });
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudieron generar codigos.', variant: 'destructive' });
    }
    setIsGeneratingBackupCodes(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserCog className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Seguridad y Cuenta</h1>
        </div>
        <Button asChild variant="outline"><Link href="/settings">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link></Button>
      </div>

      <Card className="shadow-sm rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            <CardTitle className="font-headline text-xl">Cambiar contraseña</CardTitle>
          </div>
          <CardDescription>La contraseña nueva queda protegida. Usa minimo 10 caracteres con letras y numeros.</CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña actual</Label>
              <div className="relative">
                <Input id="current-password" type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required disabled={isSavingPassword} className="rounded-lg" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)} tabIndex={-1}>
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <div className="relative">
                <Input id="new-password" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={10} required disabled={isSavingPassword} className="rounded-lg" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1}>
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmar nueva contraseña</Label>
              <div className="relative">
                <Input id="confirm-new-password" type={showConfirmNewPassword ? 'text' : 'password'} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} minLength={10} required disabled={isSavingPassword} className="rounded-lg" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} tabIndex={-1}>
                  {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSavingPassword} className="rounded-lg">
              {isSavingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar contraseña
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-sm rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <CardTitle className="font-headline text-xl">Recuperacion de acceso</CardTitle>
          </div>
          <CardDescription>Configura mail y preguntas. Si Gmail esta conectado, el codigo llega por correo.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveRecovery}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-current-password">Contraseña actual para autorizar</Label>
              <Input id="recovery-current-password" type="password" value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)} required disabled={isSavingRecovery} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recovery-email">Mail de recuperacion</Label>
              <Input id="recovery-email" type="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="tu-mail@ejemplo.com" required disabled={isSavingRecovery} className="rounded-lg" />
            </div>
            {(['q1', 'q2', 'q3'] as const).map((key, index) => (
              <div key={key} className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pregunta {index + 1}</Label>
                  <Input value={questions[key].question} onChange={(event) => setQuestions((current) => ({ ...current, [key]: { ...current[key], question: event.target.value } }))} required disabled={isSavingRecovery} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Respuesta</Label>
                  <Input type="password" value={questions[key].answer} onChange={(event) => setQuestions((current) => ({ ...current, [key]: { ...current[key], answer: event.target.value } }))} required disabled={isSavingRecovery} className="rounded-lg" />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSavingRecovery} className="rounded-lg">
              {isSavingRecovery && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar recuperacion
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-sm rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-primary" />
            <CardTitle className="font-headline text-xl">Codigos de respaldo</CardTitle>
          </div>
          <CardDescription>Son codigos de un solo uso para entrar si olvidas la contrasena y no tenes mail disponible.</CardDescription>
        </CardHeader>
        <form onSubmit={handleGenerateBackupCodes}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-current-password">Contraseña actual para generar codigos</Label>
              <Input id="backup-current-password" type="password" value={backupPassword} onChange={(event) => setBackupPassword(event.target.value)} required disabled={isGeneratingBackupCodes} />
            </div>
            {backupCodes.length > 0 && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="mb-3 text-sm font-semibold">Estos codigos se muestran una sola vez:</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {backupCodes.map((code) => (
                    <code key={code} className="rounded-md bg-background px-3 py-2 text-center text-sm font-bold tracking-widest">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isGeneratingBackupCodes}>
              {isGeneratingBackupCodes && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generar codigos
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
