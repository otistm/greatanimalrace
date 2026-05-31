import React from 'react';
import { Html } from '@react-three/drei';
import { PinkBunny } from './PinkBunny';
import { Unicorn } from './Unicorn';
import { getSpeciesConfig } from '../utils/petSpecies';
import { RemotePlayer as RemotePlayerData } from '../hooks/useRemotePlayers';

interface RemotePlayerProps {
  player: RemotePlayerData;
  onMessageUser: (uid: string, petName: string, animalId: string) => void;
}

export function RemotePlayer({ player, onMessageUser }: RemotePlayerProps) {
  const species = getSpeciesConfig(player.animalId);
  const isUnicorn = player.animalId === 'unicorn';

  // The 3D avatar handles its own positioning internally when given the `remote` prop.
  // The `<Html>` tag needs an explicit position to hover above the avatar's head.
  return (
    <group>
      {isUnicorn ? (
        <Unicorn 
          remote={{ x: player.x, y: player.y, z: player.z, yaw: player.yaw, action: player.action }}
          equippedCosmetics={player.equippedCosmetics}
        />
      ) : (
        <PinkBunny 
          speciesId={player.animalId}
          remote={{ x: player.x, y: player.y, z: player.z, yaw: player.yaw, action: player.action }}
          equippedCosmetics={player.equippedCosmetics}
        />
      )}
      
      <Html 
        position={[player.x, player.y + 2.8, player.z]} 
        center
      >
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onMessageUser(player.uid, player.petName, player.animalId);
          }}
          className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full whitespace-nowrap font-bold text-sm shadow-xl border border-white/20 cursor-pointer hover:bg-black/80 hover:scale-105 transition-all select-none"
          title={`Message ${player.petName}`}
        >
          <span className="text-base leading-none">{species.emoji}</span>
          <span className="leading-none">{player.petName}</span>
        </div>
      </Html>
    </group>
  );
}
