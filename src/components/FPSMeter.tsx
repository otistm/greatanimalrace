import React, { useState, useEffect } from 'react';

export function FPSMeter() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const loop = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] bg-black/60 text-green-400 font-mono text-[10px] md:text-xs px-2 py-1 rounded shadow-md backdrop-blur-sm pointer-events-none border border-black/20">
      {fps} FPS
    </div>
  );
}
