'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Bot, Save, Loader2, CheckCircle2, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiAssistantSettings, saveAiAssistantSettings, testGeminiConnection } from '@/app/actions/settings';

type KnowledgeDocument = {
  id: string;
  name: string;
  type: string;
  content: string;
  updatedAt: string;
};

export default function AiAssistantSettingsPage() {
  const [customInstructions, setCustomInstructions] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchDocTerm, setSearchDocTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    getAiAssistantSettings().then((data) => {
      setCustomInstructions(data.customInstructions || '');
      setKnowledgeDocuments(Array.isArray(data.knowledgeDocuments) ? data.knowledgeDocuments : []);
      setUpdatedAt(data.updatedAt || '');
      setIsLoading(false);
    });
  }, []);

  const handleKnowledgeFilesUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const docs: KnowledgeDocument[] = [];
    for (const file of files) {
      let content = '';
      if (
        file.type.startsWith('text/') ||
        ['application/json', 'application/xml', 'text/csv'].includes(file.type)
      ) {
        content = (await file.text()).slice(0, 12000);
      } else {
        content = `Documento cargado: ${file.name}. Tipo: ${file.type || 'desconocido'}. Si es PDF/DOC, agregá un resumen textual para que el asistente lo use como contexto.`;
      }

      docs.push({
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        content,
        updatedAt: new Date().toISOString(),
      });
    }

    setKnowledgeDocuments((prev) => [...docs, ...prev]);
    event.target.value = '';
    toast({ title: 'Documentos cargados', description: `Se agregaron ${docs.length} documento(s) a la base de conocimiento.` });
  }, [toast]);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    setApiStatus('unknown');
    setApiError(null);
    try {
      const result = await testGeminiConnection();
      if (result.ok) {
        setApiStatus('ok');
        toast({ title: '✅ Conexión exitosa', description: 'La API de Gemini está funcionando correctamente.' });
      } else {
        setApiStatus('error');
        setApiError(result.error || 'Error desconocido');
        toast({ title: '❌ Error de conexión', description: result.error || 'No se pudo conectar a Gemini.', variant: 'destructive' });
      }
    } catch {
      setApiStatus('error');
      setApiError('No se pudo contactar al servidor.');
      toast({ title: '❌ Error', description: 'No se pudo probar la conexión.', variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveAiAssistantSettings({ customInstructions, knowledgeDocuments });
    setIsSaving(false);
    if (result.success) {
      setUpdatedAt(new Date().toISOString());
      toast({ title: 'Guardado', description: 'Configuración del Asistente AK actualizada.' });
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudo guardar.', variant: 'destructive' });
    }
  };

  const filteredKnowledgeDocuments = knowledgeDocuments.filter((doc) => {
    const term = searchDocTerm.trim().toLowerCase();
    if (!term) return true;
    return doc.name.toLowerCase().includes(term) || doc.content.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="p-2 bg-violet-100 rounded-lg">
          <Bot className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asistente IA — Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Personalizá el comportamiento del Asistente AK con instrucciones y conocimiento empresarial.
          </p>
        </div>
      </div>

      <Card className={
        apiStatus === 'ok' ? 'border-green-300 bg-green-50' :
        apiStatus === 'error' ? 'border-red-300 bg-red-50' :
        'border-slate-200'
      }>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {apiStatus === 'ok' && <Wifi className="w-4 h-4 text-green-600" />}
            {apiStatus === 'error' && <WifiOff className="w-4 h-4 text-red-600" />}
            {apiStatus === 'unknown' && <Wifi className="w-4 h-4 text-slate-400" />}
            Estado de la API de Gemini
          </CardTitle>
          <CardDescription>
            {apiStatus === 'ok' && (
              <span className="text-green-700 font-medium">✅ Conectada — La API de Gemini está funcionando correctamente.</span>
            )}
            {apiStatus === 'error' && (
              <span className="text-red-700 font-medium">❌ Sin conexión — El Asistente AK no puede funcionar sin esta API.</span>
            )}
            {apiStatus === 'unknown' && (
              <span className="text-slate-500">Verificá si la API key de Gemini está configurada y es válida.</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {apiStatus === 'error' && apiError && (
            <div className="flex gap-2 p-3 bg-red-100 border border-red-200 rounded-md text-sm text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Detalle del error:</p>
                <p className="font-mono text-xs mt-1 break-all">{apiError}</p>
              </div>
            </div>
          )}
          <Button
            variant={apiStatus === 'error' ? 'destructive' : 'outline'}
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full sm:w-auto"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Probando conexión...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Probar conexión con Gemini
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones personalizadas</CardTitle>
          <CardDescription>
            Reglas de comportamiento que el asistente debe seguir en cada conversación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Cargando configuración...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="customInstructions">Instrucciones para el Asistente</Label>
              <Textarea
                id="customInstructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={10}
                className="resize-y font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Base de conocimiento empresarial</CardTitle>
          <CardDescription>
            Subí documentos y editá su contenido para que el asistente use esta información como contexto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="knowledgeUpload">Subir documentos (múltiple)</Label>
            <Input id="knowledgeUpload" type="file" multiple onChange={handleKnowledgeFilesUpload} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="knowledgeSearch">Buscar en documentos</Label>
            <Input
              id="knowledgeSearch"
              value={searchDocTerm}
              onChange={(e) => setSearchDocTerm(e.target.value)}
              placeholder="Buscar por nombre o contenido..."
            />
          </div>
          <div className="space-y-3">
            {filteredKnowledgeDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay documentos cargados.</p>
            ) : (
              filteredKnowledgeDocuments.map((doc) => (
                <div key={doc.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold truncate">{doc.name}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setKnowledgeDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                    >
                      Quitar
                    </Button>
                  </div>
                  <Textarea
                    value={doc.content}
                    onChange={(e) => setKnowledgeDocuments((prev) => prev.map((d) => d.id === doc.id ? { ...d, content: e.target.value } : d))}
                    rows={4}
                    className="text-xs"
                  />
                </div>
              ))
            )}
          </div>

          {updatedAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span>
                Última actualización:{' '}
                {new Date(updatedAt).toLocaleString('es-UY', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar configuración
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
