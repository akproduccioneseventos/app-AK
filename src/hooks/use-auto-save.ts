import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoSaveOptions<T> {
  /** Los datos a guardar. Cuando cambien, el timer se reinicia. */
  data: T;
  /** La funcion que realiza el guardado. Debe retornar una Promise. */
  onSave: (data: T) => Promise<{ success: boolean; error?: string }>;
  /** Milisegundos de espera tras el ultimo cambio antes de guardar. Default: 2000ms */
  debounceMs?: number;
  /** Si es false, no se activa el auto-save (ej: mientras carga). Default: true */
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  /** Fuerza un guardado inmediato sin esperar el debounce */
  saveNow: () => Promise<void>;
}

function getDataSignature(value: unknown): string {
  try {
    return JSON.stringify(value) ?? 'undefined';
  } catch {
    return String(value);
  }
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dataSignature = getDataSignature(data);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<T>(data);
  const signatureRef = useRef(dataSignature);
  const onSaveRef = useRef(onSave);
  const enabledRef = useRef(enabled);
  const baselineReadyRef = useRef(false);
  const lastObservedSignatureRef = useRef<string | null>(null);
  const saveInFlightRef = useRef<Promise<void> | null>(null);
  const saveQueuedRef = useRef(false);
  const mountedRef = useRef(true);

  dataRef.current = data;
  signatureRef.current = dataSignature;
  onSaveRef.current = onSave;
  enabledRef.current = enabled;

  const executeSave = useCallback(async (): Promise<void> => {
    if (!enabledRef.current) return;
    if (saveInFlightRef.current) {
      saveQueuedRef.current = true;
      return saveInFlightRef.current;
    }

    const saveLoop = async () => {
      if (mountedRef.current) {
        setIsSaving(true);
        setSaveError(null);
      }

      try {
        while (enabledRef.current) {
          saveQueuedRef.current = false;
          const valueToSave = dataRef.current;
          const signatureToSave = signatureRef.current;
          const result = await onSaveRef.current(valueToSave);

          if (!result.success) {
            if (mountedRef.current) setSaveError(result.error ?? 'Error al guardar');
            break;
          }

          if (mountedRef.current) {
            setLastSaved(new Date());
            setSaveError(null);
          }

          if (!saveQueuedRef.current && signatureRef.current === signatureToSave) {
            break;
          }
        }
      } catch (error: any) {
        if (mountedRef.current) {
          setSaveError(error?.message ?? 'No se pudo guardar los cambios');
        }
      } finally {
        saveInFlightRef.current = null;
        if (mountedRef.current) setIsSaving(false);
      }
    };

    saveInFlightRef.current = saveLoop();
    return saveInFlightRef.current;
  }, []);

  const saveNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    baselineReadyRef.current = true;
    lastObservedSignatureRef.current = signatureRef.current;
    await executeSave();
  }, [executeSave]);

  useEffect(() => {
    if (!enabled) {
      baselineReadyRef.current = false;
      lastObservedSignatureRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!baselineReadyRef.current) {
      baselineReadyRef.current = true;
      lastObservedSignatureRef.current = dataSignature;
      return;
    }

    if (lastObservedSignatureRef.current === dataSignature) return;
    lastObservedSignatureRef.current = dataSignature;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void executeSave();
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [dataSignature, enabled, debounceMs, executeSave]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { isSaving, lastSaved, saveError, saveNow };
}
