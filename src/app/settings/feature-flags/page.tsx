'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ToggleLeft, ToggleRight, Loader2, Shield, Zap, Crown, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  getFeatureFlags,
  updateDefaultTier,
  updateGlobalOverride,
} from '@/app/actions/feature-flags';
import {
  ALL_MODULES,
  TIER_DEFINITIONS,
  type GlobalFeatureFlags,
  type ServiceTier,
  type FeatureModule,
} from '@/types/feature-flags';

const TIER_ICONS: Record<ServiceTier, React.ElementType> = {
  Básico: Shield,
  Premium: Star,
  Elite: Crown,
};

const TIER_COLORS: Record<ServiceTier, string> = {
  Básico: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
  Premium: 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200',
  Elite: 'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200',
};

const TIER_ACTIVE_COLORS: Record<ServiceTier, string> = {
  Básico: 'bg-slate-800 text-white border-slate-800 shadow-lg',
  Premium: 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200',
  Elite: 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200',
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<GlobalFeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFeatureFlags();
      setFlags(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los Feature Flags.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleTierChange = async (tier: ServiceTier) => {
    if (!flags || flags.defaultTier === tier) return;
    setSaving('tier');
    try {
      const result = await updateDefaultTier(tier);
      if (result.success) {
        setFlags(prev => prev ? { ...prev, defaultTier: tier } : prev);
        toast({ title: '✓ Tier actualizado', description: `El tier por defecto es ahora "${tier}".` });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setSaving(null);
    }
  };

  const handleGlobalOverride = async (module: FeatureModule, enabled: boolean) => {
    setSaving(module);
    try {
      const result = await updateGlobalOverride(module, enabled);
      if (result.success) {
        setFlags(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            globalOverrides: { ...prev.globalOverrides, [module]: enabled },
          };
        });
        toast({
          title: enabled ? '✓ Módulo habilitado' : '✓ Módulo deshabilitado',
          description: `El módulo fue ${enabled ? 'activado' : 'desactivado'} globalmente.`,
        });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setSaving(null);
    }
  };

  const isModuleActiveForTier = (module: FeatureModule, tier: ServiceTier): boolean => {
    const tierDef = TIER_DEFINITIONS.find(t => t.tier === tier);
    return tierDef ? tierDef.modules.includes(module) : false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900">
            Feature Flags <span className="text-primary italic">&amp; Tiers</span>
          </h1>
          <p className="text-slate-500 font-semibold text-sm">
            Controlá qué módulos están habilitados para cada nivel de servicio y aplicá overrides globales.
          </p>
        </motion.div>
      </header>

      {/* Default Tier Selector */}
      <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
          <CardTitle className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            Tier por Defecto
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium">
            Seleccioná el nivel de servicio que se aplica a todos los nuevos eventos (puede sobreescribirse por evento).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-4">
            {TIER_DEFINITIONS.map(tierDef => {
              const Icon = TIER_ICONS[tierDef.tier];
              const isActive = flags?.defaultTier === tierDef.tier;
              return (
                <button
                  key={tierDef.tier}
                  onClick={() => handleTierChange(tierDef.tier)}
                  disabled={saving === 'tier'}
                  className={cn(
                    'flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 min-w-[200px] flex-1',
                    isActive ? TIER_ACTIVE_COLORS[tierDef.tier] : TIER_COLORS[tierDef.tier]
                  )}
                >
                  <Icon className="w-6 h-6 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-sm">{tierDef.label}</p>
                    <p className={cn('text-xs font-medium mt-0.5', isActive ? 'opacity-80' : 'opacity-60')}>
                      {tierDef.description}
                    </p>
                    <p className={cn('text-[11px] font-bold mt-1', isActive ? 'opacity-70' : 'opacity-50')}>
                      {tierDef.modules.length} módulo(s) incluidos
                    </p>
                  </div>
                  {isActive && (
                    <Badge className="ml-auto shrink-0 bg-white/20 text-current border-0 text-[10px] font-black">
                      ACTIVO
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Module Matrix */}
      <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
          <CardTitle className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-2">
            <ToggleRight className="w-5 h-5 text-emerald-500" />
            Control de Módulos
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium">
            Los overrides globales sobreescriben cualquier configuración de tier para todos los eventos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 border-b border-slate-100 px-6 py-3 bg-slate-50/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Módulo</span>
            {TIER_DEFINITIONS.map(t => (
              <span key={t.tier} className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-20">
                {t.tier}
              </span>
            ))}
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-20">Override</span>
          </div>

          <div className="divide-y divide-slate-100">
            {ALL_MODULES.map(mod => {
              const globalOverride = flags?.globalOverrides[mod.id];
              const hasOverride = globalOverride !== undefined;

              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 items-center px-6 py-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="pr-4">
                    <p className="font-bold text-sm text-slate-800">{mod.label}</p>
                    <p className="text-xs text-slate-400 font-medium">{mod.description}</p>
                  </div>

                  {TIER_DEFINITIONS.map(tierDef => {
                    const active = isModuleActiveForTier(mod.id, tierDef.tier);
                    return (
                      <div key={tierDef.tier} className="flex items-center justify-center w-20">
                        {active ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                          </span>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-center w-20 gap-2">
                    <Switch
                      checked={hasOverride ? (globalOverride as boolean) : isModuleActiveForTier(mod.id, flags?.defaultTier ?? 'Elite')}
                      onCheckedChange={(checked) => handleGlobalOverride(mod.id, checked)}
                      disabled={saving === mod.id}
                      className={cn(hasOverride && 'ring-2 ring-indigo-400 ring-offset-1')}
                    />
                    {hasOverride && (
                      <button
                        onClick={async () => {
                          setSaving(mod.id);
                          await updateGlobalOverride(mod.id, null as unknown as boolean);
                          setFlags(prev => {
                            if (!prev) return prev;
                            const next = { ...prev, globalOverrides: { ...prev.globalOverrides } };
                            delete next.globalOverrides[mod.id];
                            return next;
                          });
                          setSaving(null);
                          toast({ title: 'Override eliminado' });
                        }}
                        className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 transition-colors"
                        title="Eliminar override global"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          Incluido en tier
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-300" />
          No incluido
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-3 rounded-full bg-indigo-200 border border-indigo-400" />
          Override global activo
        </div>
      </div>
    </div>
  );
}
