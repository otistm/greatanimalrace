import * as THREE from 'three';

export interface CosmeticProps {
  color?: string;
  animalType?: 'bunny' | 'unicorn';
  headScale?: [number, number, number] | number;
  headOffset?: [number, number, number];
  // Add more specific props as needed
}

export interface ShirtProps extends CosmeticProps {
  texture?: THREE.Texture | null;
  bodyScale?: [number, number, number];
  bodyOffset?: [number, number, number];
}
