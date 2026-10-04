import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import {
  applyManualCamera,
  manualFromCamera,
  REST_CAMERA,
  zoomCamera,
  type Camera,
  type ManualCamera,
  type Viewport,
} from '../../domain/board-layout.ts';

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  zoom: number;
  moved: boolean;
}

export interface UseStageGestureOptions {
  baseCamera: Camera;
  size: Viewport;
  renderedCameraRef: RefObject<Camera | null>;
  onStopAutoplay: () => void;
}

export function useStageGesture({
  baseCamera,
  size,
  renderedCameraRef,
  onStopAutoplay,
}: UseStageGestureOptions) {
  const [manual, setManual] = useState<ManualCamera>(REST_CAMERA);
  const [dragging, setDragging] = useState(false);

  const panFrame = useRef<number | null>(null);
  const pendingPan = useRef<ManualCamera | null>(null);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  const resetManual = useCallback(() => {
    if (panFrame.current !== null) cancelAnimationFrame(panFrame.current);
    panFrame.current = null;
    pendingPan.current = null;
    drag.current = null;
    setDragging(false);
    setManual(REST_CAMERA);
  }, []);

  const zoom = useCallback(
    (factor: number) => {
      onStopAutoplay();
      setManual((current) =>
        zoomCamera(
          baseCamera,
          renderedCameraRef.current
            ? manualFromCamera(baseCamera, renderedCameraRef.current, size)
            : current,
          size,
          factor
        )
      );
    },
    [baseCamera, size, renderedCameraRef, onStopAutoplay]
  );

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const target = event.target;
    if (target instanceof Element && target.closest('button, a, input, select, textarea, [data-board-ui]')) return;
    onStopAutoplay();
    const live = renderedCameraRef.current
      ? manualFromCamera(baseCamera, renderedCameraRef.current, size)
      : manual;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: live.x,
      y: live.y,
      zoom: live.zoom,
      moved: false,
    };
    suppressClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const currentDrag = drag.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - currentDrag.startX;
    const deltaY = event.clientY - currentDrag.startY;
    if (Math.hypot(deltaX, deltaY) > 5) currentDrag.moved = true;
    const nextManual: ManualCamera = {
      x: currentDrag.x + deltaX,
      y: currentDrag.y + deltaY,
      zoom: currentDrag.zoom,
    };
    pendingPan.current = nextManual;
    if (panFrame.current === null) {
      panFrame.current = requestAnimationFrame(() => {
        panFrame.current = null;
        if (pendingPan.current) setManual(pendingPan.current);
      });
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    if (panFrame.current !== null) {
      cancelAnimationFrame(panFrame.current);
      panFrame.current = null;
    }
    if (pendingPan.current) setManual(pendingPan.current);
    pendingPan.current = null;
    suppressClick.current = drag.current.moved;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const camera = applyManualCamera(baseCamera, manual, size);
  const isFreeCamera = manual.zoom !== 1 || manual.x !== 0 || manual.y !== 0;

  return {
    camera,
    manual,
    isFreeCamera,
    dragging,
    resetManual,
    zoom,
    startDrag,
    moveDrag,
    endDrag,
    suppressClick,
    setManual,
  };
}
