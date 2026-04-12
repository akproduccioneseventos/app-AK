'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getContractSettings, saveContractSettings } from '@/app/actions/settings';
import { defaultContractSettings } from '@/types/settings';
import type { ContractSettings, ContractClause } from '@/types/settings';
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Loader2,
  FileText,
  GripVertical,
} from 'lucide-react';

const AVAILABLE_VARIABLES = [
  { key: '{{CIUDAD_FECHA}}', desc: 'Ciudad y fecha' },
  { key: '{{CLIENTE_NOMBRE}}', desc: 'Nombre del cliente' },
  { key: '{{CLIENTE_DOMICILIO}}', desc: 'Domicilio' },
  { key: '{{CLIENTE_CI}}', desc: 'Cédula' },
  { key: '{{CLIENTE_TELEFONO}}', desc: 'Teléfono' },
  { key: '{{FECHA_EVENTO}}', desc: 'Fecha del evento' },
  { key: '{{SALON}}', desc: 'Salón' },
  { key: '{{MONTO_SENA}}', desc: 'Monto de seña' },
];

export default function ClausulasContractPage() {
  const [settings, setSettings] = useState<ContractSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getContractSettings();
      setSettings(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las cláusulas.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const result = await saveContractSettings(settings);
      if (result.success) {
        toast({ title: 'Guardado', description: 'Las cláusulas del contrato se guardaron correctamente.' });
      } else {
        throw new Error(result.error);
      }
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'No se pudo guardar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    setSettings({ ...defaultContractSettings });
    toast({ title: 'Restaurado', description: 'Se restauraron las cláusulas predeterminadas. Recordá guardar los cambios.' });
  };

  const updateClause = (id: string, field: keyof ContractClause, value: string | number | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      clauses: settings.clauses.map(c => c.id === id ? { ...c, [field]: value } : c),
    });
  };

  const moveClause = (id: string, direction: 'up' | 'down') => {
    if (!settings) return;
    const clauses = [...settings.clauses].sort((a, b) => a.order - b.order);
    const idx = clauses.findIndex(c => c.id === id);
    if (direction === 'up' && idx > 0) {
      const prevOrder = clauses[idx - 1].order;
      clauses[idx - 1].order = clauses[idx].order;
      clauses[idx].order = prevOrder;
    } else if (direction === 'down' && idx < clauses.length - 1) {
      const nextOrder = clauses[idx + 1].order;
      clauses[idx + 1].order = clauses[idx].order;
      clauses[idx].order = nextOrder;
    }
    setSettings({ ...settings, clauses });
  };

  const addClause = () => {
    if (!settings) return;
    const maxOrder = settings.clauses.reduce((max, c) => Math.max(max, c.order), 0);
    const newClause: ContractClause = {
      id: `c_${Date.now()}`,
      order: maxOrder + 1,
      title: 'NUEVA CLÁUSULA',
      content: '',
      isActive: true,
    };
    setSettings({ ...settings, clauses: [...settings.clauses, newClause] });
  };

  const removeClause = (id: string) => {
    if (!settings) return;
    setSettings({ ...settings, clauses: settings.clauses.filter(c => c.id !== id) });
  };

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sortedClauses = [...settings.clauses].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Cláusulas del Contrato</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Editá el contenido, orden y estado de las cláusulas del contrato legal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRestoreDefaults} className="rounded-xl">
            <RotateCcw className="w-4 h-4 mr-2" /> Restaurar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-xl">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </div>

      {/* Header/Footer settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" /> Encabezado y Firma
          </CardTitle>
          <CardDescription>Texto introductorio del contrato y datos del firmante.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Texto Introductorio</Label>
            <Textarea
              value={settings.headerText}
              onChange={e => setSettings({ ...settings, headerText: e.target.value })}
              rows={4}
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nombre del Firmante</Label>
              <Input
                value={settings.companySignerName}
                onChange={e => setSettings({ ...settings, companySignerName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Cargo / Rol</Label>
              <Input
                value={settings.companySignerRole}
                onChange={e => setSettings({ ...settings, companySignerRole: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available variables reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Variables Disponibles</CardTitle>
          <CardDescription className="text-xs">Usá estas variables en el texto de las cláusulas. Se reemplazarán automáticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_VARIABLES.map(v => (
              <Badge key={v.key} variant="secondary" className="text-[10px] font-mono">
                {v.key} <span className="ml-1 font-sans text-muted-foreground">({v.desc})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clauses list */}
      <div className="space-y-3">
        {sortedClauses.map((clause, idx) => (
          <Card key={clause.id} className={`transition-opacity ${clause.isActive ? '' : 'opacity-50'}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveClause(clause.id, 'up')}
                    disabled={idx === 0}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveClause(clause.id, 'down')}
                    disabled={idx === sortedClauses.length - 1}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Input
                  value={clause.title}
                  onChange={e => updateClause(clause.id, 'title', e.target.value)}
                  className="font-bold text-sm uppercase flex-1"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={clause.isActive}
                    onCheckedChange={val => updateClause(clause.id, 'isActive', val)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeClause(clause.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={clause.content}
                onChange={e => updateClause(clause.id, 'content', e.target.value)}
                rows={3}
                className="text-xs leading-relaxed"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add clause button */}
      <Button variant="outline" onClick={addClause} className="w-full rounded-xl border-dashed">
        <Plus className="w-4 h-4 mr-2" /> Agregar Cláusula
      </Button>

      <Separator />

      {/* Bottom save bar */}
      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={handleRestoreDefaults} className="rounded-xl">
          <RotateCcw className="w-4 h-4 mr-2" /> Restaurar Predeterminados
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="rounded-xl">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
