import { useLayoutEffect, useRef, useState } from 'react';
import type { Camera, Viewport } from '../domain/board-layout.ts';
import { createFlight, sameCamera, sampleFlight } from './camera-flight.ts';

// The RAF lives in the scene, not the app: the sidebar/dialogs do not render at
// 60 Hz. A new destination starts at the *current* frame and cancels the old RAF.
export function useCameraFlight(target: Camera, viewport: Viewport, destination: number, enabled: boolean, immediate: boolean, onMovingChange: (moving: boolean) => void) {
  const current = useRef(target);
  const previous = useRef({ width: viewport.width, height: viewport.height, destination });
  const [frame, setFrame] = useState({ camera: target, moving: false });

  useLayoutEffect(() => {
    const resized = previous.current.width !== viewport.width || previous.current.height !== viewport.height;
    const travel = previous.current.destination !== destination;
    previous.current = { ...viewport, destination };
    let raf = 0;
    let cancelled = false;
    const finish = () => {
      cancelAnimationFrame(raf);
      current.current = target;
      setFrame({ camera: target, moving: false });
      onMovingChange(false);
    };
    if (!enabled || immediate || resized || document.hidden || sameCamera(current.current, target)) {
      finish();
      return;
    }

    const flight = createFlight(current.current, target, viewport, travel ? 'travel' : 'frame');
    const start = performance.now();
    onMovingChange(true);
    setFrame({ camera: current.current, moving: true });
    const tick = (time: number) => {
      if (cancelled) return;
      const progress = Math.min(1, (time - start) / flight.duration);
      if (progress >= 1) { finish(); return; }
      current.current = sampleFlight(flight, progress);
      setFrame({ camera: current.current, moving: true });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onVisibility = () => {
      if (document.hidden) { cancelled = true; finish(); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [target.x, target.y, target.scale, viewport.width, viewport.height, destination, enabled, immediate, onMovingChange]);

  return frame;
}