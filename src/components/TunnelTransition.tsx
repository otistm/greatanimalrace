import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function TunnelTransition({ onComplete }: { onComplete: () => void }) {
  const numRings = 35;
  const ringSpacing = 8;
  const centerHoleSize = 15;
  
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    // Wait for the browser to paint the heavy box-shadows first, THEN start the animation
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setStartAnimation(true);
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  const rings = [];
  // Loop backwards so the largest rings are appended first 
  // (sitting at the back of the stacking context)
  for (let i = numRings; i >= 1; i--) {
    const size = centerHoleSize + (i * ringSpacing);
    let hue = 280 - ((i - 1) * 35);
    hue = ((hue % 360) + 360) % 360;
    
    rings.push(
      <div
        key={i}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: `${size}vmin`,
          height: `${size}vmin`,
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
          boxShadow: '0 0 3vmin 0.5vmin rgba(0, 0, 0, 0.8)'
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[150] bg-black flex items-center justify-center overflow-hidden"
    >
      <div 
        className={`relative w-0 h-0 ${startAnimation ? 'animate-zoomIn' : ''}`}
        onAnimationEnd={onComplete}
        style={{ willChange: 'transform' }}
      >
        {rings}
        {/* Center hole */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black z-[100]"
          style={{
            width: `${centerHoleSize}vmin`,
            height: `${centerHoleSize}vmin`,
            boxShadow: '0 0 5vmin 1vmin rgba(0, 0, 0, 0.95)'
          }}
        />
      </div>
    </motion.div>
  );
}
