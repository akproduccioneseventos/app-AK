'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, RotateCcw, ArrowLeft, Database } from 'lucide-react';
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
import { resetCrm } from '@/app/actions/crm';
import { resetAllPresupuestos } from '@/app/actions/presupuestos';
import { resetAllActiveFiestas, deleteAllFiestas } from '@/app/actions/fiesta-actual';

export default function AdminDatosPage() {
  const { toast } = useToast();

  const [isResettingCrm, setIsResettingCrm] = useState(false);
  const [isResettingPresupuestos, setIsResettingPresupuestos] = useState(false);
  const [isArchivingFiestas, setIsArchivingFiestas] = useState(false);
  const [isDeletingFiestas, setIsDeletingFiestas] = useState(false);

  const handleResetCrm = useCallback(async () => {
    setIsResettingCrm(true);
    try {
      const result = await resetCrm();
      if (result.success) {
        toast({ title: 'CRM reiniciado', description: `${result.deletedCount ?? 0} prospecto(s) eliminado(s) de Firestore.` });
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo reiniciar el CRM.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsResettingCrm(false);
    }
  }, [toast]);

  const handleResetPresupuestos = useCallback(async () => {
    setIsResettingPresupuestos(true);
    try {
      const result = await resetAllPresupuestos();
      if (result.success) {
        toast({ title: '🗑️ Presupuestos eliminados', description: `${result.deletedCount ?? 0} presupuesto(s) eliminado(s) permanentemente.`, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudieron eliminar los presupuestos.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsResettingPresupuestos(false);
    }
  }, [toast]);

  const handleArchiveFiestas = useCallback(async () => {
    setIsArchivingFiestas(true);
    try {
      const result = await resetAllActiveFiestas();
      if (result.success) {
        toast({ title: 'Planificador reiniciado', description: `${result.archivedCount ?? 0} evento(s) archivado(s).` });
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo reiniciar el planificador.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsArchivingFiestas(false);
    }
  }, [toast]);

  const handleDeleteAllFiestas = useCallback(async () => {
    setIsDeletingFiestas(true);
    try {
      const result = await deleteAllFiestas();
      if (result.success) {
        toast({ title: '🗑️ Eventos eliminados permanentemente', description: `${result.deletedCount ?? 0} evento(s) eliminado(s) de forma irreversible.`, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudieron eliminar los eventos.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeletingFiestas(false);
    }
  }, [toast]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Settings
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Database className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight font-headline">Administración de Datos</h1>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        Desde acá podés reiniciar o eliminar permanentemente los datos de cada módulo directamente en Firestore. <strong>Todas las operaciones son irreversibles.</strong>
      </p>

      <Separator />

      {/* CRM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">🤝 CRM — Prospectos</CardTitle>
          <CardDescription>Elimina todos los prospectos de la colección <code>prospectos</code> en Firestore. Las etapas del CRM se conservan.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" disabled={isResettingCrm}>
                {isResettingCrm ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Reiniciar CRM
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Reiniciar el CRM?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará <strong>todos los prospectos</strong> de Firestore de forma irreversible. Las etapas se conservan. Esta operación no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetCrm} className="bg-destructive hover:bg-destructive/90">
                  Sí, reiniciar CRM
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Presupuestos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">📄 Presupuestos</CardTitle>
          <CardDescription>Elimina permanentemente todos los presupuestos (incluyendo archivados) de la colección <code>presupuestos</code> en Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" disabled={isResettingPresupuestos}>
                {isResettingPresupuestos ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                🗑️ Borrar todos los presupuestos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ ¿Borrar TODOS los presupuestos permanentemente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará <strong>de forma irreversible</strong> todos los presupuestos incluyendo los archivados. Los datos <strong>NO se podrán recuperar</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetPresupuestos} className="bg-destructive hover:bg-destructive/90">
                  Sí, borrar todos permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Planificador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">🎉 Planificador de Eventos</CardTitle>
          <CardDescription>Archiva o elimina permanentemente los eventos activos de la colección <code>fiestas</code> en Firestore.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" disabled={isArchivingFiestas}>
                {isArchivingFiestas ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Archivar todos los eventos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Archivar todos los eventos activos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción archivará todos los eventos activos. Los eventos se conservarán en el historial. Esta operación no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchiveFiestas} className="bg-destructive hover:bg-destructive/90">
                  Sí, archivar todos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" disabled={isDeletingFiestas}>
                {isDeletingFiestas ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                🗑️ Eliminar todo permanentemente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ ¿Eliminar TODOS los eventos permanentemente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará <strong>de forma irreversible</strong> todos los eventos de Firestore. Los datos <strong>NO se podrán recuperar</strong>. Esta operación no puede deshacerse.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllFiestas} className="bg-destructive hover:bg-destructive/90">
                  Sí, eliminar todo permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
