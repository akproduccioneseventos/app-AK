

'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, AlertTriangle, StickyNote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual, updateClientNotes } from '@/app/actions/fiesta-actual';

export default function NotasClientePage() {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setNotes(fiestaData.clientNotes || '');
    } catch (err: any) {
      console.error("Error loading client notes:", err);
      setError("No se pudieron cargar las notas.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updateClientNotes(notes);
      if (result.success) {
        toast({ title: "Notas Guardadas", description: "Las notas del cliente han sido actualizadas." });
      } else {
        throw new Error(result.error || "No se pudo guardar la información.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StickyNote className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Notas y Preferencias del Cliente
          </h1>
        </div>
        <Link href="/fiestas/nueva/portal-cliente" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Portal
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle>Espacio Compartido de Notas</CardTitle>
            <CardDescription>
              Utiliza este espacio para registrar cualquier preferencia, detalle, o nota importante que el cliente te comunique. El cliente podrá ver (y editar, si lo permites) este contenido desde su portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-destructive text-center p-4">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                <p>{error}</p>
              </div>
            ) : (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alergias alimentarias, preferencias de colores, sorpresas planeadas, etc."
                rows={12}
                disabled={isSaving}
              />
            )}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? "Guardando..." : "Guardar Notas"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
