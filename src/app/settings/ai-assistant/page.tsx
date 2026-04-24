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
import { getAiAssistantSettings, saveAiAssistantSettings, testGeminiConnection, scanAiAssistantAppContext } from '@/app/actions/settings';

type KnowledgeDocument = {
  id: string;
  name: string;
  type: string;
  content: string;
  updatedAt: string;
};

const KNOWLEDGE_DOC_MAX_CHARS = 12000; // Keep context payload bounded to avoid oversized prompts/storage.

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
  const [operationalInstructions, setOperationalInstructions] = useState('');
  const [salesMarketingInstructions, setSalesMarketingInstructions] = useState('');
  const [dynamicBusinessRules, setDynamicBusinessRules] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [appFunctionalityContext, setAppFunctionalityContext] = useState('');
  const [isScanningApp, setIsScanningApp] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getAiAssistantSettings().then((data) => {
      setCustomInstructions(data.customInstructions || '');
      setOperationalInstructions(data.operationalInstructions || '');
      setSalesMarketingInstructions(data.salesMarketingInstructions || '');
      setDynamicBusinessRules(data.dynamicBusinessRules || '');
      setLessonsLearned(data.lessonsLearned || '');
      setAppFunctionalityContext(data.appFunctionalityContext || '');
      setKnowledgeDocuments(Array.isArray(data.knowledgeDocuments) ? data.knowledgeDocuments : []);
      setUpdatedAt(data.updatedAt || '');
      setIsLoading(false);
    });
  }, []);

  const handleKnowledgeFilesUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const docs: KnowledgeDocument[] = [];
    const skipped: string[] = [];

    for (const [index, file] of files.entries()) {
      let content = '';
      const isTextReadable =
        file.type.startsWith('text/') ||
        ['application/json', 'application/xml', 'text/csv'].includes(file.type) ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.md');

      const isPdfOrDoc =
        file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.doc') ||
        file.name.endsWith('.docx');

      if (isTextReadable) {
        content = (await file.text()).slice(0, KNOWLEDGE_DOC_MAX_CHARS);
      } else if (isPdfOrDoc) {
        // PDF/DOC — no se puede leer el contenido automáticamente en el navegador.
        // Mostramos advertencia y dejamos el contenido vacío para que el usuario lo complete.
        skipped.push(file.name);
        content = '';
      } else {
        content = '';
      }

      docs.push({
        id: `doc_${crypto.randomUUID()}_${index}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        content,
        updatedAt: new Date().toISOString(),
      });
    }

    setKnowledgeDocuments((prev) => [...docs, ...prev]);
    event.target.value = '';

    if (skipped.length > 0) {
      const plural = skipped.length > 1;
      toast({
        title: '⚠️ Archivos no leídos automáticamente',
        description: plural
          ? `Estos archivos no fueron leídos automáticamente: ${skipped.join(', ')}. Pegá el texto o subí versión TXT.`
          : `${skipped[0]}: Este archivo no fue leído automáticamente; pegá el texto o subí versión TXT.`,
        variant: 'destructive',
      });
    }

    const readCount = docs.length - skipped.length;
    if (readCount > 0) {
      toast({ title: 'Documentos cargados', description: `Se agregaron ${readCount} documento(s) leído(s) a la base de conocimiento.` });
    }
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
    const result = await saveAiAssistantSettings({
      customInstructions,
      operationalInstructions,
      salesMarketingInstructions,
      dynamicBusinessRules,
      lessonsLearned,
      appFunctionalityContext,
      knowledgeDocuments,
    });
    setIsSaving(false);
    if (result.success) {
      setUpdatedAt(new Date().toISOString());
      toast({ title: 'Guardado', description: 'Configuración del Asistente AK actualizada.' });
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudo guardar.', variant: 'destructive' });
    }
  };

  const handleScanApp = useCallback(async () => {
    setIsScanningApp(true);
    const result = await scanAiAssistantAppContext();
    setIsScanningApp(false);
    if (result.success && result.context) {
      setAppFunctionalityContext(result.context);
      toast({ title: 'Escaneo completado', description: 'Se actualizó el contexto funcional de la app.' });
      return;
    }
    toast({ title: 'Error de escaneo', description: result.error || 'No se pudo escanear la app.', variant: 'destructive' });
  }, [toast]);

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
          <CardTitle>Perfiles de asistentes</CardTitle>
          <CardDescription>
            Configurá la base de instrucciones para el modo Operativo y para Ventas/Marketing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operationalInstructions">Asistente Operativo</Label>
            <Textarea
              id="operationalInstructions"
              value={operationalInstructions}
              onChange={(e) => setOperationalInstructions(e.target.value)}
              rows={7}
              className="resize-y font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salesMarketingInstructions">Asistente de Ventas/Marketing</Label>
            <Textarea
              id="salesMarketingInstructions"
              value={salesMarketingInstructions}
              onChange={(e) => setSalesMarketingInstructions(e.target.value)}
              rows={7}
              className="resize-y font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrenamiento dinámico</CardTitle>
          <CardDescription>
            Agregá reglas de negocio, lecciones aprendidas y correcciones sin tocar código.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dynamicBusinessRules">Reglas dinámicas</Label>
            <Textarea
              id="dynamicBusinessRules"
              value={dynamicBusinessRules}
              onChange={(e) => setDynamicBusinessRules(e.target.value)}
              rows={6}
              className="resize-y font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lessonsLearned">Lecciones aprendidas / correcciones</Label>
            <Textarea
              id="lessonsLearned"
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              rows={6}
              className="resize-y font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escaneo funcional de la app</CardTitle>
          <CardDescription>
            Generá un resumen automático de rutas/módulos para que el asistente entienda mejor cómo funciona la app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" variant="outline" onClick={handleScanApp} disabled={isScanningApp}>
            {isScanningApp ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Escaneando app...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Escanear app ahora
              </>
            )}
          </Button>
          <Textarea
            value={appFunctionalityContext}
            onChange={(e) => setAppFunctionalityContext(e.target.value)}
            rows={10}
            className="resize-y font-mono text-xs"
          />
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
              filteredKnowledgeDocuments.map((doc) => {
                const isPdfOrDoc =
                  doc.type === 'application/pdf' ||
                  doc.type === 'application/msword' ||
                  doc.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                  doc.name.endsWith('.pdf') ||
                  doc.name.endsWith('.doc') ||
                  doc.name.endsWith('.docx');
                const isUnread = isPdfOrDoc && !doc.content.trim();
                return (
                  <div key={doc.id} className={`rounded-md border p-3 space-y-2 ${isUnread ? 'border-amber-300 bg-amber-50' : ''}`}>
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
                    {isUnread && (
                      <div className="flex items-start gap-2 p-2 bg-amber-100 border border-amber-200 rounded text-xs text-amber-800">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          Este archivo no fue leído automáticamente; pegá el texto o subí versión TXT.
                        </span>
                      </div>
                    )}
                    <Textarea
                      value={doc.content}
                      onChange={(e) => setKnowledgeDocuments((prev) => prev.map((d) => d.id === doc.id ? { ...d, content: e.target.value } : d))}
                      rows={4}
                      className="text-xs"
                      placeholder={isUnread ? 'Pegá acá el contenido del documento...' : undefined}
                    />
                  </div>
                );
              })
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
