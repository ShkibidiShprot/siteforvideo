import { useCallback, useEffect, useState } from 'react';

export type MotionPreference = 'auto' | 'on' | 'off';
const storageKey = 'nitky-motion-v1';

export function useMotionPreference() {
  const [preference, setPreference] = useState<MotionPreference>(() => {
    try {
      return localStorage.getItem(storageKey) === 'off' ? 'off' : 'on';
    } catch { return 'on'; }
  });
  useEffect(() => {
    try { localStorage.setItem(storageKey, preference); } catch { /* Private mode must still work. */ }
  }, [preference]);
  const enabled = preference !== 'off';
  const toggle = useCallback(() => setPreference(enabled ? 'off' : 'on'), [enabled]);
  return { preference, setPreference, enabled, toggle };
}
