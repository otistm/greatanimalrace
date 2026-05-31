import React from 'react';
import { getGameById } from '../games/registry';

interface Props {
  gameId: string;
  level: number;
  autoStart: boolean;
}

export function MiniGameIframe({ gameId, level, autoStart }: Props) {
  const game = getGameById(gameId);
  if (!game) return null;

  const src = `/${game.slug}.html?level=${level}${autoStart ? '&autoStart=true' : ''}`;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <iframe
        key={`${gameId}_${level}`}
        src={src}
        className="w-full h-full border-none"
        title={`${game.name} Game`}
      />
    </div>
  );
}
