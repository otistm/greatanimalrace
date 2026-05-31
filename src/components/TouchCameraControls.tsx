import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

export type CameraTouchInput = {
  yaw: number;
  pitch: number;
  zoom: number;
};

const DRAG_THRESHOLD_PX = 10;
const ORBIT_SENS = 0.004;

function pinchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function TouchCameraControls({
  cameraTouchRef,
  enabledRef,
}: {
  cameraTouchRef: React.MutableRefObject<CameraTouchInput | null>;
  enabledRef: React.MutableRefObject<boolean>;
}) {
  const { gl } = useThree();
  const touchState = useRef({
    mode: 'none' as 'none' | 'orbit' | 'pinch',
    lastPinchDist: 0,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    activeTouchId: -1,
  });
  const pointerState = useRef({
    id: -1,
    dragging: false,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    const el = gl.domElement;

    const setOrbit = (dx: number, dy: number) => {
      cameraTouchRef.current = {
        yaw: -dx * ORBIT_SENS,
        pitch: -dy * ORBIT_SENS,
        zoom: 1,
      };
    };

    const setZoom = (factor: number) => {
      cameraTouchRef.current = {
        yaw: 0,
        pitch: 0,
        zoom: Math.max(0.85, Math.min(1.15, factor)),
      };
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!enabledRef.current) return;

      if (e.touches.length >= 2) {
        touchState.current.mode = 'pinch';
        touchState.current.lastPinchDist = pinchDistance(e.touches);
        touchState.current.activeTouchId = -1;
        return;
      }

      const t = e.changedTouches[0];
      if (!t) return;
      touchState.current.mode = 'orbit';
      touchState.current.activeTouchId = t.identifier;
      touchState.current.startX = touchState.current.lastX = t.clientX;
      touchState.current.startY = touchState.current.lastY = t.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!enabledRef.current) return;

      if (e.touches.length >= 2) {
        e.preventDefault();
        touchState.current.mode = 'pinch';
        const dist = pinchDistance(e.touches);
        if (touchState.current.lastPinchDist > 0) {
          setZoom(dist / touchState.current.lastPinchDist);
        }
        touchState.current.lastPinchDist = dist;
        return;
      }

      if (touchState.current.mode !== 'orbit') return;
      const t = [...e.touches].find(
        (touch) => touch.identifier === touchState.current.activeTouchId
      );
      if (!t) return;

      const dx = t.clientX - touchState.current.lastX;
      const dy = t.clientY - touchState.current.lastY;
      const total = Math.hypot(
        t.clientX - touchState.current.startX,
        t.clientY - touchState.current.startY
      );
      if (total < DRAG_THRESHOLD_PX && Math.hypot(dx, dy) < 1) return;

      e.preventDefault();
      setOrbit(dx, dy);
      touchState.current.lastX = t.clientX;
      touchState.current.lastY = t.clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === touchState.current.activeTouchId) {
          touchState.current.activeTouchId = -1;
        }
      }
      if (e.touches.length === 0) {
        touchState.current.mode = 'none';
        touchState.current.lastPinchDist = 0;
      } else if (e.touches.length === 1 && touchState.current.mode === 'pinch') {
        touchState.current.mode = 'none';
        touchState.current.lastPinchDist = 0;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!enabledRef.current || e.button !== 0 || e.pointerType === 'touch') return;
      pointerState.current.id = e.pointerId;
      pointerState.current.dragging = false;
      pointerState.current.startX = pointerState.current.lastX = e.clientX;
      pointerState.current.startY = pointerState.current.lastY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!enabledRef.current || e.pointerId !== pointerState.current.id) return;
      if (e.pointerType === 'touch') return;

      const dx = e.clientX - pointerState.current.lastX;
      const dy = e.clientY - pointerState.current.lastY;
      if (!pointerState.current.dragging) {
        const total = Math.hypot(
          e.clientX - pointerState.current.startX,
          e.clientY - pointerState.current.startY
        );
        if (total < DRAG_THRESHOLD_PX) return;
        pointerState.current.dragging = true;
        el.setPointerCapture(e.pointerId);
      }

      e.preventDefault();
      setOrbit(dx, dy);
      pointerState.current.lastX = e.clientX;
      pointerState.current.lastY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerState.current.id) return;
      if (pointerState.current.dragging) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
      }
      pointerState.current.id = -1;
      pointerState.current.dragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!enabledRef.current) return;
      e.preventDefault();
      setZoom(e.deltaY > 0 ? 1.06 : 0.94);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, [gl, cameraTouchRef, enabledRef]);

  return null;
}
