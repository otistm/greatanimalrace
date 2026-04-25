import React from 'react';
import {
  TopHat, Crown, Cap, Beanie, WitchHat, StrawHat,
  Glasses,
  Shirt, Sleeve, CropTop, RaglanShirt, PoloShirt, Robe, LuffyVest,
  MilestoneShirt,
  Scepter, Sword, Shield, Breastplate, KnightMask, Jersey, BaseballBat,
} from './index';
import { getColor, createCosmeticTexture } from '../../utils/cosmetics';
import { getCosmeticData, getMilestoneShirtNumber } from '../../utils/cosmeticsRegistry';

const COMPONENT_MAP: Record<string, React.FC<any>> = {
  TopHat, Crown, Cap, Beanie, WitchHat, StrawHat,
  Glasses,
  Shirt, CropTop, RaglanShirt, PoloShirt, Robe, LuffyVest,
  MilestoneShirt,
  Scepter, Sword, Shield, Breastplate, KnightMask, Jersey, BaseballBat,
};

export interface CosmeticsNodes {
  head: React.ReactNode[];
  body: React.ReactNode[];
  leftArm: React.ReactNode[];
  rightArm: React.ReactNode[];
  heldLeft: React.ReactNode[];
  heldRight: React.ReactNode[];
  back: React.ReactNode[];
}

export function useCosmeticsNodes(equippedCosmetics: string[], animalType: 'bunny' | 'unicorn'): CosmeticsNodes {
  const nodes: CosmeticsNodes = {
    head: [],
    body: [],
    leftArm: [],
    rightArm: [],
    heldLeft: [],
    heldRight: [],
    back: [],
  };

  equippedCosmetics.forEach(cosmetic => {
    let baseName = cosmetic;
    let data = getCosmeticData(baseName);
    if (!data) {
      baseName = cosmetic.split(' ').slice(1).join(' ') || cosmetic;
      data = getCosmeticData(baseName);
    }
    if (!data) return;

    const Component = COMPONENT_MAP[data.componentName];
    if (!Component) return;

    const color = getColor(cosmetic, '#ef4444');
    const texture = createCosmeticTexture(cosmetic);
    const key = cosmetic;

    const baseProps = { key, color, animalType, texture };

    if (data.part === 'hat' || data.part === 'glasses') {
      nodes.head.push(<Component {...baseProps} lensType={data.lensType} shape={data.shape} />);
    } else if (data.part === 'held-left') {
      nodes.heldLeft.push(<Component {...baseProps} />);
    } else if (data.part === 'held-right') {
      nodes.heldRight.push(<Component {...baseProps} />);
    } else if (data.part === 'back') {
      nodes.back.push(<Component {...baseProps} />);
    } else if (data.part === 'top') {
      if (data.componentName === 'RaglanShirt') {
        nodes.body.push(<Component {...baseProps} />);
        nodes.leftArm.push(<Sleeve key={`${key}-l`} color={color} isLong={true} />);
        nodes.rightArm.push(<Sleeve key={`${key}-r`} color={color} isLong={true} />);
      } else if (data.componentName === 'CropTop') {
        nodes.body.push(<Component {...baseProps} />);
        nodes.leftArm.push(<Sleeve key={`${key}-l`} {...baseProps} />);
        nodes.rightArm.push(<Sleeve key={`${key}-r`} {...baseProps} />);
      } else if (data.componentName === 'MilestoneShirt') {
        const number = getMilestoneShirtNumber(data.id) ?? 1;
        nodes.body.push(<Component {...baseProps} number={number} />);
        nodes.leftArm.push(<Sleeve key={`${key}-l`} color={color} />);
        nodes.rightArm.push(<Sleeve key={`${key}-r`} color={color} />);
      } else if (data.componentName === 'PoloShirt') {
        nodes.body.push(<Component {...baseProps} />);
        nodes.leftArm.push(<Sleeve key={`${key}-l`} color={color} texture={texture} />);
        nodes.rightArm.push(<Sleeve key={`${key}-r`} color={color} texture={texture} />);
      } else if (data.componentName === 'Robe') {
        nodes.body.push(<Component {...baseProps} />);
        nodes.leftArm.push(<Sleeve key={`${key}-l`} color={color} texture={texture} isLong={true} />);
        nodes.rightArm.push(<Sleeve key={`${key}-r`} color={color} texture={texture} isLong={true} />);
      } else if (data.componentName === 'LuffyVest') {
        // Sleeveless tops — only render the body piece, leave arms bare.
        nodes.body.push(<Component {...baseProps} />);
      } else if (data.componentName === 'Breastplate') {
        // Pauldrons are part of the breastplate body, no fabric sleeves needed.
        nodes.body.push(<Component {...baseProps} />);
      } else if (data.componentName === 'Jersey') {
        nodes.body.push(<Component {...baseProps} />);
        nodes.leftArm.push(<Sleeve key={`${key}-l`} color={color} texture={texture} />);
        nodes.rightArm.push(<Sleeve key={`${key}-r`} color={color} texture={texture} />);
      } else {
        // Generic Shirt
        nodes.body.push(<Component {...baseProps} />);
        nodes.leftArm.push(<Sleeve key={`${key}-l`} {...baseProps} />);
        nodes.rightArm.push(<Sleeve key={`${key}-r`} {...baseProps} />);
      }
    }
  });

  return nodes;
}

// Single-item preview used by the 3D inventory icons.
export function CosmeticModel({ cosmetic, animalType, isUI = false }: { cosmetic: string; animalType: 'bunny' | 'unicorn'; isUI?: boolean }) {
  const nodes = useCosmeticsNodes([cosmetic], animalType);

  return (
    <group position={isUI ? [0, -0.4, 0] : [0, 0, 0]}>
      {nodes.head}
      {nodes.body}
      <group position={[-0.4, 0.2, 0]} rotation={[0, 0, 0.5]}>
        {nodes.leftArm}
        {nodes.heldLeft}
      </group>
      <group position={[0.4, 0.2, 0]} rotation={[0, 0, -0.5]}>
        {nodes.rightArm}
        {nodes.heldRight}
      </group>
      <group position={[0, 0.2, -0.6]} rotation={[0, Math.PI, 0]}>
        {nodes.back}
      </group>
    </group>
  );
}
