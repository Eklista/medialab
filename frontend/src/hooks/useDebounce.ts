// frontend/src/hooks/useDebounce.ts

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para debounce de valores - optimizado para búsquedas y filtros
 * 
 * @param value - Valor a hacer debounce
 * @param delay - Delay en millisegundos (default: 300)
 * @param options - Opciones adicionales de configuración
 * @returns El valor con debounce aplicado
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     searchAPI(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */

interface UseDebounceOptions {
  /** Ejecutar inmediatamente en el primer render */
  immediate?: boolean;
  /** Valor mínimo de caracteres para aplicar debounce */
  minLength?: number;
  /** Callback que se ejecuta cuando cambia el valor */
  onDebounceChange?: (value: any) => void;
}

export function useDebounce<T>(
  value: T,
  delay: number = 300,
  options: UseDebounceOptions = {}
): T {
  const {
    immediate = false,
    minLength = 0,
    onDebounceChange
  } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<number | undefined>(undefined);
  const isFirstRender = useRef<boolean>(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    // Si es el primer render y immediate es true, actualizar inmediatamente
    if (isFirstRender.current && immediate) {
      setDebouncedValue(value);
      onDebounceChange?.(value);
      isFirstRender.current = false;
      return;
    }

    isFirstRender.current = false;

    // Si hay longitud mínima y el valor no la cumple, no hacer debounce
    if (minLength > 0 && typeof value === 'string' && value.length < minLength && value.length > 0) {
      return;
    }

    // Limpiar timeout anterior
    cleanup();

    // Crear nuevo timeout
    timeoutRef.current = window.setTimeout(() => {
      setDebouncedValue(value);
      onDebounceChange?.(value);
    }, delay);

    // Cleanup en unmount o cambio de dependencias
    return cleanup;
  }, [value, delay, minLength, immediate, onDebounceChange, cleanup]);

  // Cleanup en unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return debouncedValue;
}

/**
 * Hook avanzado de debounce con más control y estado
 * 
 * @param value - Valor a hacer debounce
 * @param delay - Delay en millisegundos
 * @param options - Opciones de configuración
 * @returns Objeto con valor, estado y funciones de control
 * 
 * @example
 * ```tsx
 * const {
 *   debouncedValue,
 *   isPending,
 *   cancel,
 *   flush
 * } = useDebouncedState(searchTerm, 300);
 * ```
 */
interface UseDebouncedStateOptions extends UseDebounceOptions {
  /** Si el valor vacío debe ser procesado inmediatamente */
  flushOnEmpty?: boolean;
}

interface UseDebouncedStateReturn<T> {
  /** Valor con debounce aplicado */
  debouncedValue: T;
  /** Si hay un debounce pendiente */
  isPending: boolean;
  /** Cancela el debounce pendiente */
  cancel: () => void;
  /** Ejecuta el debounce inmediatamente */
  flush: () => void;
  /** Resetea al valor original */
  reset: () => void;
}

export function useDebouncedState<T>(
  value: T,
  delay: number = 300,
  options: UseDebouncedStateOptions = {}
): UseDebouncedStateReturn<T> {
  const {
    immediate = false,
    minLength = 0,
    flushOnEmpty = true,
    onDebounceChange
  } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isPending, setIsPending] = useState<boolean>(false);
  const timeoutRef = useRef<number | undefined>(undefined);
  const originalValueRef = useRef<T>(value);
  const isFirstRender = useRef<boolean>(true);

  // Actualizar valor original
  useEffect(() => {
    originalValueRef.current = value;
  }, [value]);

  const executeDebouncedUpdate = useCallback(() => {
    setDebouncedValue(value);
    setIsPending(false);
    onDebounceChange?.(value);
  }, [value, onDebounceChange]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
      setIsPending(false);
    }
  }, []);

  const flush = useCallback(() => {
    cancel();
    executeDebouncedUpdate();
  }, [cancel, executeDebouncedUpdate]);

  const reset = useCallback(() => {
    cancel();
    setDebouncedValue(originalValueRef.current);
    setIsPending(false);
  }, [cancel]);

  useEffect(() => {
    // Primer render con immediate
    if (isFirstRender.current && immediate) {
      setDebouncedValue(value);
      onDebounceChange?.(value);
      isFirstRender.current = false;
      return;
    }

    isFirstRender.current = false;

    // Valor vacío con flushOnEmpty
    if (flushOnEmpty && (!value || (typeof value === 'string' && value.trim() === ''))) {
      flush();
      return;
    }

    // Verificar longitud mínima
    if (minLength > 0 && typeof value === 'string' && value.length < minLength && value.length > 0) {
      return;
    }

    // Cancelar timeout anterior
    cancel();

    // Marcar como pendiente
    setIsPending(true);

    // Crear nuevo timeout
    timeoutRef.current = window.setTimeout(() => {
      executeDebouncedUpdate();
    }, delay);

    // Cleanup
    return cancel;
  }, [value, delay, minLength, immediate, flushOnEmpty, onDebounceChange, executeDebouncedUpdate, flush, cancel]);

  // Cleanup en unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return {
    debouncedValue,
    isPending,
    cancel,
    flush,
    reset
  };
}

/**
 * Hook para debounce de funciones/callbacks
 * 
 * @param callback - Función a hacer debounce
 * @param delay - Delay en millisegundos
 * @param deps - Dependencias del callback
 * @returns Función con debounce aplicado
 * 
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback(
 *   (term: string) => {
 *     searchAPI(term);
 *   },
 *   300,
 *   []
 * );
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<number | undefined>(undefined);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        callback(...args);
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, ...deps]
  ) as T;

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook combinado para búsquedas optimizadas
 * Ideal para campos de búsqueda en tablas/listas
 * 
 * @param initialValue - Valor inicial
 * @param delay - Delay en millisegundos
 * @returns Objeto con valor, setter y valor con debounce
 * 
 * @example
 * ```tsx
 * const { value, setValue, debouncedValue, isPending } = useSearchDebounce('', 300);
 * 
 * return (
 *   <input
 *     value={value}
 *     onChange={(e) => setValue(e.target.value)}
 *     placeholder="Buscar..."
 *   />
 * );
 * ```
 */
interface UseSearchDebounceReturn {
  /** Valor actual del input */
  value: string;
  /** Función para actualizar el valor */
  setValue: (value: string) => void;
  /** Valor con debounce aplicado */
  debouncedValue: string;
  /** Si hay un debounce pendiente */
  isPending: boolean;
  /** Limpia el valor */
  clear: () => void;
  /** Ejecuta el debounce inmediatamente */
  flush: () => void;
}

export function useSearchDebounce(
  initialValue: string = '',
  delay: number = 300
): UseSearchDebounceReturn {
  const [value, setValue] = useState(initialValue);
  
  const {
    debouncedValue,
    isPending,
    flush
  } = useDebouncedState(value, delay, {
    minLength: 0, // Para búsquedas permitimos strings vacíos
    flushOnEmpty: true // Limpiar resultados cuando se borra la búsqueda
  });

  const clear = useCallback(() => {
    setValue('');
  }, []);

  return {
    value,
    setValue,
    debouncedValue,
    isPending,
    clear,
    flush
  };
}

// Export por defecto del hook básico
export default useDebounce;