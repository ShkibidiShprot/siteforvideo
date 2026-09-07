import type { Camera, Viewport } from './board-layout.ts';

export type FlightKind = 'travel' | 'frame';
export interface CameraFlight {
  from: Camera;
  to: Camera;
  viewport: Viewport;
  fromCenter: { x: number; y: number };
  toCenter: { x: number; y: number };
  cruiseScale: number;
  duration: number;
  kind: FlightKind;
}
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const zoomMix = (a: number, b: number, t: number) => Math.exp(mix(Math.log(a), Math.log(b), t));

export function createFlight(from: Camera, to: Camera, viewport: Viewport, kind: FlightKind = 'travel'): CameraFlight {
  const center = (camera: Camera) => ({ x: (viewport.width / 2 - camera.x) / camera.scale, y: (viewport.height / 2 - camera.y) / camera.scale });
  const fromCenter = center(from);
  const toCenter = center(to);
  const distance = Math.hypot(toCenter.x - fromCenter.x, toCenter.y - fromCenter.y);
  const screenDistance = distance * Math.min(from.scale, to.scale);
  const contextScale = Math.min(viewport.width, viewport.height) / (500 + distance * 0.48);
  return {
    from, to, viewport, fromCenter, toCenter, kind,
    cruiseScale: kind === 'travel' ? Math.max(Math.min(from.scale, to.scale) * 0.22, Math.min(from.scale, to.scale, contextScale) * 0.78) : Math.min(from.scale, to.scale),
    duration: kind === 'travel' ? Math.min(2200, 1150 + screenDistance * 0.44) : 800,
  };
}

export function sampleFlight(flight: CameraFlight, progress: number): Camera {
  const t = clamp(progress);
  if (t === 0) return flight.from;
  if (t === 1) return flight.to;
  const pan = smooth(flight.kind === 'travel' ? (t - 0.05) / 0.9 : t);
  let scale: number;
  if (flight.kind === 'frame') scale = zoomMix(flight.from.scale, flight.to.scale, smooth(t));
  else if (t < 0.28) scale = zoomMix(flight.from.scale, flight.cruiseScale, smooth(t / 0.28));
  else if (t < 0.67) scale = flight.cruiseScale;
  else scale = zoomMix(flight.cruiseScale, flight.to.scale, smooth((t - 0.67) / 0.33));
  const cx = mix(flight.fromCenter.x, flight.toCenter.x, pan);
  const cy = mix(flight.fromCenter.y, flight.toCenter.y, pan);
  return { scale, x: flight.viewport.width / 2 - cx * scale, y: flight.viewport.height / 2 - cy * scale };
}

export function sameCamera(a: Camera, b: Camera): boolean {
  return Math.abs(a.x - b.x) < 0.05 && Math.abs(a.y - b.y) < 0.05 && Math.abs(a.scale - b.scale) < 0.00001;
}