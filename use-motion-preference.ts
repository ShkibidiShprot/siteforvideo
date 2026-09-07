import { useCallback, useEffect, useState } from 'react';

export type MotionPreference = 'auto' | 'on' | 'off';
const storageKey = 'nitky-motion-v1';

export function useMotionPreference() {
  const [preference, setPreference] = useState<MotionPreference>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === 'on' || saved === 'off' ? saved : 'auto';
    } catch { return 'auto'; }
  });
  const [reduce, setReduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(storageKey, preference); } catch { /* Private mode must still work. */ }
  }, [preference]);
  const enabled = preference === 'auto' ? !reduce : preference === 'on';
  const toggle = useCallback(() => setPreference(enabled ? 'off' : 'on'), [enabled]);
  return { preference, setPreference, enabled, toggle };
}