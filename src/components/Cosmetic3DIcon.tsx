import React, { Suspense, useEffect, useRef, useState } from 'react';
import { View, Center, PerspectiveCamera } from '@react-three/drei';
import { CosmeticModel } from './cosmetics/CosmeticModel';

interface Props {
  cosmetic: string;
}

export function Cosmetic3DIcon({ cosmetic }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Lazy-mount the heavy <View>/CosmeticModel only when the icon scrolls into
  // the viewport. The overlay can render dozens of these at once and we don't
  // want to spin up dozens of three.js scenes off-screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const s = cosmetic.toLowerCase();

  const isShirt = s.includes('shirt') || s.includes('tee') || s.includes('crop top') ||
           s.includes('raglan') || s.includes('polo') || s.includes('robe');

  const isSunglasses = s.includes('sunglass') || s.includes('shades') || s.includes('glass');

  let fov = 50;
  if (isShirt) fov = 40;
  if (isSunglasses) fov = 30;

  return (
    <div ref={ref} className="w-full h-full pointer-events-none drop-shadow-sm flex items-center justify-center">
      {isVisible && (
        <View track={ref as React.MutableRefObject<HTMLElement>}>
          <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={fov} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={2} />
          <pointLight position={[-5, 5, -5]} intensity={1} />
          <pointLight position={[0, -5, 5]} intensity={0.5} />
          <Suspense fallback={null}>
            <Center>
              <group rotation={[0.1, 0.3, 0]}>
                <CosmeticModel cosmetic={cosmetic} animalType="bunny" isUI={true} />
              </group>
            </Center>
          </Suspense>
        </View>
      )}
    </div>
  );
}
