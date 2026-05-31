import { useEffect, useRef } from 'react';

const STICK_DEAD_ZONE = 0.22;

function getFirstGamepad(): Gamepad | null {
  const pads = navigator.getGamepads();
  for (let i = 0; i < pads.length; i++) {
    const p = pads[i];
    if (p) return p;
  }
  return null;
}

/**
 * Polls the first connected gamepad: left stick → `gamepadDirRef`, right stick → `cameraStickRef` (axes 2–3).
 * A button (index 0) and B button (index 1) fire on press edge.
 * Calls `flushRef` every frame so the host can merge stick with touch and apply movement.
 */
export function useGamepadWorldInput(
  enabledRef: React.MutableRefObject<boolean>,
  gamepadDirRef: React.MutableRefObject<{ x: number; z: number } | null>,
  cameraStickRef: React.MutableRefObject<{ x: number; y: number } | null>,
  flushRef: React.MutableRefObject<() => void>,
  aButtonEdgeRef: React.MutableRefObject<(() => void) | null>,
  bButtonEdgeRef: React.MutableRefObject<(() => void) | null>
) {
  const aPrevRef = useRef(false);
  const bPrevRef = useRef(false);
  const cameraVecScratch = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      if (!enabledRef.current) {
        gamepadDirRef.current = null;
        cameraStickRef.current = null;
        aPrevRef.current = false;
        bPrevRef.current = false;
        flushRef.current();
        raf = requestAnimationFrame(tick);
        return;
      }

      const gp = getFirstGamepad();

      if (gp) {
        const ax = gp.axes[0] ?? 0;
        const az = gp.axes[1] ?? 0;
        const m = Math.hypot(ax, az);
        if (m < STICK_DEAD_ZONE) {
          gamepadDirRef.current = null;
        } else {
          const nx = ax / m;
          const nz = az / m;
          const mag = Math.min(1, (m - STICK_DEAD_ZONE) / (1 - STICK_DEAD_ZONE));
          gamepadDirRef.current = { x: nx * mag, z: nz * mag };
        }

        const rx = gp.axes[2] ?? 0;
        const ry = gp.axes[3] ?? 0;
        const rm = Math.hypot(rx, ry);
        if (rm < STICK_DEAD_ZONE) {
          cameraStickRef.current = null;
        } else {
          const nx = rx / rm;
          const ny = ry / rm;
          const mag = Math.min(1, (rm - STICK_DEAD_ZONE) / (1 - STICK_DEAD_ZONE));
          const v = cameraVecScratch.current;
          v.x = nx * mag;
          v.y = ny * mag;
          cameraStickRef.current = v;
        }

        const cbA = aButtonEdgeRef.current;
        if (cbA) {
          const pressed = !!(gp.buttons[0]?.pressed || (gp.buttons[0]?.value ?? 0) > 0.25);
          if (pressed && !aPrevRef.current) cbA();
          aPrevRef.current = pressed;
        }

        const cbB = bButtonEdgeRef.current;
        if (cbB) {
          const pressed = !!(gp.buttons[1]?.pressed || (gp.buttons[1]?.value ?? 0) > 0.25);
          if (pressed && !bPrevRef.current) cbB();
          bPrevRef.current = pressed;
        }
      } else {
        gamepadDirRef.current = null;
        cameraStickRef.current = null;
        aPrevRef.current = false;
        bPrevRef.current = false;
      }

      flushRef.current();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabledRef, gamepadDirRef, cameraStickRef, flushRef, aButtonEdgeRef, bButtonEdgeRef]);
}
