import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAutoSaveOptions<T> {
  /** Los datos a guardar. Cuando cambien, el timer se reinicia. */
  data: T;
  /** La función que realiza el guardado. Debe retornar una Promise. */
  onSave: (data: T) => Promise<{ success: boolean; error?: string }>;
  /** Milisegundos de espera tras el último cambio antes de guardar. Default: 2000ms */
  debounceMs?: number;
  /** Si es false, no se activa el auto-save (ej: mientras carga). Default: true */
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  /** Fuerza un guardado inmediato sin esperar el debounce */
  saveNow: () => void;
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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<T>(data);
  const onSaveRef = useRef(onSave);
  const isFirstRender = useRef(true);

  // Keep refs up to date
  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  const executeSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await onSaveRef.current(dataRef.current);
      if (result.success) {
        setLastSaved(new Date());
      } else {
        setSaveError(result.error ?? 'Error al guardar');
      }
    } catch (e: any) {
      setSaveError(e.message ?? 'No se pudo guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    executeSave();
  }, [executeSave]);

  useEffect(() => {
    // Skip the very first render (don't save on mount)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(executeSave, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, enabled, debounceMs, executeSave]);

  return { isSaving, lastSaved, saveError, saveNow };
}
