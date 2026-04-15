'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, RotateCcw, ArrowLeft, Database, AlertTriangle } from 'lucide-react';
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
import { resetAppCompleto } from '@/app/actions/admin-reset';

export default function AdminDatosPage() {
  const { toast } = useToast();

  const [isResettingCrm, setIsResettingCrm] = useState(false);
  const [isResettingPresupuestos, setIsResettingPresupuestos] = useState(false);
  const [isArchivingFiestas, setIsArchivingFiestas] = useState(false);
  const [isDeletingFiestas, setIsDeletingFiestas] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

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

  const handleResetAll = useCallback(async () => {
    setIsResettingAll(true);
    setResetDialogOpen(false);
    try {
      const result = await resetAppCompleto();
      if (result.success && result.results) {
        const r = result.results;
        const summary = [
          `Clientes: ${r.clientes}`,
          `Facturas: ${r.facturas}`,
          `Presupuestos: ${r.presupuestos}`,
          `Fiestas: ${r.fiestas + (r.archive ?? 0)}`,
          `CRM Prospectos: ${r.prospectos}`,
          `Notificaciones: ${r.notificaciones}`,
          `Historial: ${r.fiestas_historicas}`,
        ].join(' · ');
        toast({ title: '✅ Reset completo ejecutado', description: summary });
      } else {
        toast({ title: 'Error en reset completo', description: result.error || 'Error desconocido.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsResettingAll(false);
      setResetConfirmText('');
    }
  }, [toast]);

  const handleResetDialogOpenChange = useCallback((open: boolean) => {
    setResetDialogOpen(open);
    if (!open) setResetConfirmText('');
  }, []);

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

      <Separator />

      {/* RESET COMPLETO */}
      <Card className="border-2 border-destructive/60 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertTriangle className="w-5 h-5" />
            🔴 RESET COMPLETO — Borrar todo y empezar de cero
          </CardTitle>
          <CardDescription className="text-destructive/80">
            Elimina <strong>todos</strong> los datos operativos: clientes, facturas, presupuestos, eventos, CRM (leads), notificaciones e historial.
            <br />
            <strong className="text-green-700 dark:text-green-400">✅ SE CONSERVA:</strong> proveedores, servicios, menús, empleados, roles, activos fijos, insumos, configuración de empresa, catálogo de fotos y gastos generales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={resetDialogOpen} onOpenChange={handleResetDialogOpenChange}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isResettingAll} className="font-bold text-base px-6 py-5">
                {isResettingAll ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
                🔴 RESET COMPLETO
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  ⚠️ RESET COMPLETO — Acción irreversible
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm">
                    <p>Esta acción eliminará <strong>permanentemente e irreversiblemente</strong>:</p>
                    <ul className="list-disc list-inside space-y-1 text-destructive font-medium">
                      <li>Todos los clientes</li>
                      <li>Todas las facturas</li>
                      <li>Todos los presupuestos</li>
                      <li>Todos los eventos (fiestas activas y archivadas)</li>
                      <li>Todos los prospectos CRM</li>
                      <li>Todas las notificaciones</li>
                      <li>Todo el historial de fiestas</li>
                    </ul>
                    <p className="text-green-700 dark:text-green-400 font-medium">
                      ✅ Proveedores, servicios, menús y configuración NO serán eliminados.
                    </p>
                    <p className="font-semibold">Para confirmar, escribí <code className="bg-muted px-1 rounded">CONFIRMAR</code> en el campo de abajo:</p>
                    <Input
                      placeholder="Escribí CONFIRMAR para habilitar el botón"
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                      className="border-destructive focus-visible:ring-destructive"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setResetConfirmText('')}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetAll}
                  disabled={resetConfirmText !== 'CONFIRMAR' || isResettingAll}
                  className="bg-destructive hover:bg-destructive/90 disabled:opacity-40"
                >
                  {isResettingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sí, ejecutar RESET COMPLETO
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
