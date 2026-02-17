import { useCallback, useRef, useState } from "react";

const MAX_HISTORY = 5;

interface UseHistoryReturn {
  push: (snapshot: string) => void;
  undo: () => string | null;
  redo: () => string | null;
  reset: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useHistory = (): UseHistoryReturn => {
  const stackRef = useRef<string[]>([]);
  const indexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < stackRef.current.length - 1);
  }, []);

  const push = useCallback(
    (snapshot: string) => {
      stackRef.current = stackRef.current.slice(0, indexRef.current + 1);
      stackRef.current.push(snapshot);

      if (stackRef.current.length > MAX_HISTORY) {
        stackRef.current.shift();
      } else {
        indexRef.current += 1;
      }

      updateFlags();
    },
    [updateFlags],
  );

  const undo = useCallback((): string | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current -= 1;
    updateFlags();
    return stackRef.current[indexRef.current];
  }, [updateFlags]);

  const redo = useCallback((): string | null => {
    if (indexRef.current >= stackRef.current.length - 1) return null;
    indexRef.current += 1;
    updateFlags();
    return stackRef.current[indexRef.current];
  }, [updateFlags]);

  const reset = useCallback(() => {
    stackRef.current = [];
    indexRef.current = -1;
    updateFlags();
  }, [updateFlags]);

  return { push, undo, redo, reset, canUndo, canRedo };
};
