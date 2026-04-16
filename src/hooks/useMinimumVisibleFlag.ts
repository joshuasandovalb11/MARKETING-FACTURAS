import { useEffect, useRef, useState } from 'react';

export function useMinimumVisibleFlag(active: boolean, minVisibleMs = 350) {
  const [visible, setVisible] = useState(active);
  const startedAtRef = useRef<number | null>(active ? Date.now() : null);

  useEffect(() => {
    let timeoutId: number | null = null;

    if (active) {
      startedAtRef.current = Date.now();
      setVisible(true);
      return;
    }

    if (!visible) return;

    const startedAt = startedAtRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(minVisibleMs - elapsed, 0);

    timeoutId = window.setTimeout(() => {
      setVisible(false);
      startedAtRef.current = null;
    }, remaining);

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [active, minVisibleMs, visible]);

  return visible;
}
