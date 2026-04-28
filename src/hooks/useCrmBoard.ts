'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead, CrmStage } from '@/types/crm';
import {
  getCrmLeads,
  getCrmStages,
  moveCrmLead,
  deleteCrmLead,
  getCrmKpiData,
} from '@/app/actions/crm';
import { getCached, setCached, invalidateCache } from './useCrmCache';

const CACHE_KEY_STAGES = 'crm-stages';
const CACHE_KEY_LEADS = 'crm-leads';
const CACHE_KEY_KPIS = 'crm-kpis';

const sortLeadsByDate = (a: CrmLead, b: CrmLead) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

function sortLeadsInStage(leads: CrmLead[]): CrmLead[] {
  const withDate = leads.filter(l => l.followUpDate).sort((a, b) =>
    new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()
  );
  const withoutDate = leads.filter(l => !l.followUpDate).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return [...withDate, ...withoutDate];
}

export function useCrmBoard() {
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const { toast } = useToast();
  // Keep toast in a ref so callbacks don't need it as a dependency
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    if (forceRefresh) {
      invalidateCache(CACHE_KEY_LEADS);
      invalidateCache(CACHE_KEY_KPIS);
    }

    if (!forceRefresh) {
      const cachedStages = getCached<CrmStage[]>(CACHE_KEY_STAGES);
      const cachedLeads = getCached<CrmLead[]>(CACHE_KEY_LEADS);
      const cachedKpis = getCached<any>(CACHE_KEY_KPIS);
      if (cachedStages && cachedLeads && cachedKpis !== null) {
        setStages(cachedStages);
        setLeads(cachedLeads);
        setKpiData(cachedKpis);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const [stagesData, leadsData, crmKpis] = await Promise.all([
        getCrmStages(),
        getCrmLeads(),
        getCrmKpiData(),
      ]);

      if (!isMountedRef.current) return;

      const sortedStages = stagesData.sort((a, b) => a.order - b.order);
      const sortedLeads = leadsData.sort(sortLeadsByDate);

      setCached(CACHE_KEY_STAGES, sortedStages);
      setCached(CACHE_KEY_LEADS, sortedLeads);
      if (crmKpis.success) setCached(CACHE_KEY_KPIS, crmKpis.data);

      setStages(sortedStages);
      setLeads(sortedLeads);
      if (crmKpis.success) setKpiData(crmKpis.data);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setError('No se pudieron cargar los datos del CRM.');
      toastRef.current({
        title: 'Error',
        description: err.message || 'Ocurrió un problema.',
        variant: 'destructive',
      });
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []); // Stable - dependencies accessed via refs

  // Fetch only on mount
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Move a lead optimistically; reverts on server error. */
  const moveLead = useCallback(
    async (leadId: string, targetStageId: string, meetingDate?: string): Promise<boolean> => {
      // Optimistic update
      setLeads(prev => {
        const nextLeads = prev.map(l =>
          l.id === leadId
            ? { ...l, currentStageId: targetStageId, updatedAt: new Date().toISOString() }
            : l
        );
        setCached(CACHE_KEY_LEADS, nextLeads);
        return nextLeads;
      });
      invalidateCache(CACHE_KEY_KPIS);

      const result = await moveCrmLead(leadId, targetStageId, meetingDate);
      if (!result.success) {
        if (isMountedRef.current) {
          toastRef.current({ title: 'Error', description: result.error, variant: 'destructive' });
          fetchData(true); // Revert via fresh server data
        }
        return false;
      }
      getCrmKpiData().then(kpis => {
        if (kpis.success && isMountedRef.current) {
          setKpiData(kpis.data);
          setCached(CACHE_KEY_KPIS, kpis.data);
        }
      }).catch((error) => {
        console.warn('[CRM] No se pudieron refrescar KPIs tras mover lead:', error);
      });
      return true;
    },
    [fetchData]
  );

  /** Delete a lead optimistically; reverts on server error. */
  const deleteLead = useCallback(
    async (leadId: string) => {
      // Capture current lead before optimistic removal
      let removedLead: CrmLead | undefined;
      setLeads(prev => {
        removedLead = prev.find(l => l.id === leadId);
        const nextLeads = prev.filter(l => l.id !== leadId);
        setCached(CACHE_KEY_LEADS, nextLeads);
        return nextLeads;
      });
      setDeletingLeadId(leadId);
      invalidateCache(CACHE_KEY_KPIS);

      try {
        const result = await deleteCrmLead(leadId);
        if (!isMountedRef.current) return;
        if (result.success) {
          toastRef.current({ description: 'Prospecto eliminado.' });
          invalidateCache(CACHE_KEY_LEADS);
          invalidateCache(CACHE_KEY_KPIS);
          getCrmKpiData().then(kpis => {
            if (kpis.success && isMountedRef.current) {
              setKpiData(kpis.data);
              setCached(CACHE_KEY_KPIS, kpis.data);
            }
          }).catch((error) => {
            console.warn('[CRM] No se pudieron refrescar KPIs tras eliminar lead:', error);
          });
        } else {
          // Revert
          if (removedLead) {
            setLeads(prev => {
              const restoredLeads = [...prev, removedLead!].sort(sortLeadsByDate);
              setCached(CACHE_KEY_LEADS, restoredLeads);
              return restoredLeads;
            });
          }
          toastRef.current({ title: 'Error', description: result.error, variant: 'destructive' });
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        if (removedLead) {
          setLeads(prev => {
            const restoredLeads = [...prev, removedLead!].sort(sortLeadsByDate);
            setCached(CACHE_KEY_LEADS, restoredLeads);
            return restoredLeads;
          });
        }
        toastRef.current({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        if (isMountedRef.current) setDeletingLeadId(null);
      }
    },
    []
  );

  const leadsByStage = useMemo(
    () =>
      stages.reduce((acc, stage) => {
        acc[stage.id] = sortLeadsInStage(leads.filter(lead => lead.currentStageId === stage.id));
        return acc;
      }, {} as Record<string, CrmLead[]>),
    [stages, leads]
  );

  return {
    stages,
    leads,
    kpiData,
    isLoading,
    error,
    deletingLeadId,
    leadsByStage,
    fetchData,
    moveLead,
    deleteLead,
  };
}
