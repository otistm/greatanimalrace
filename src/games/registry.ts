export type GameId =
  | 'toy_bin_bonanza'
  | 'swaddle_gami'
  | 'naptime_runner'
  | 'hide_and_seek'
  | 'tiny_chef'
  | 'bottle_rama';

export interface GameDefinition {
  id: GameId;
  name: string;
  slug: string;
  unlockMonth: number;
  description: string;
  xpRule: string;
  color: string;
}

export const GAMES: GameDefinition[] = [
  {
    id: 'toy_bin_bonanza',
    name: 'Toy Bin Bonanza',
    slug: 'toy-bin-bonanza',
    unlockMonth: 0,
    description: 'Move Left & Right. Catch as Many Toys as you can before Time Runs out!',
    xpRule: 'Up to 2,550 XP (+850 per star)',
    color: 'bg-blue-100',
  },
  {
    id: 'swaddle_gami',
    name: 'Swaddle-gami',
    slug: 'swaddle-gami',
    unlockMonth: 2,
    description: 'Fold, Spin and Drag pieces to match the outlined shapes before time runs out!',
    xpRule: 'Up to 2,550 XP (+850 per star)',
    color: 'bg-purple-100',
  },
  {
    id: 'naptime_runner',
    name: 'Naptime Runner',
    slug: 'naptime-runner',
    unlockMonth: 3,
    description: 'Get Home before the timer runs out! Tap anywhere to jump over obstacles and grab clocks for extra time.',
    xpRule: 'Up to 2,550 XP (+850 per star)',
    color: 'bg-indigo-100',
  },
  {
    id: 'hide_and_seek',
    name: 'Hide & Sneak',
    slug: 'hide-and-seek',
    unlockMonth: 5,
    description: "Tip-Toe to Complete Quests as fast as possible! Don't make too much noise. If the baby looks, freeze!",
    xpRule: 'Up to 2,550 XP (+850 per star)',
    color: 'bg-blue-100',
  },
  {
    id: 'tiny_chef',
    name: 'Tiny Chef',
    slug: 'tiny-chef',
    unlockMonth: 7,
    description: 'Cut the food to match the baby plate fractions! Complete all dishes before time runs out!',
    xpRule: 'Up to 2,550 XP (+850 per star)',
    color: 'bg-yellow-100',
  },
  {
    id: 'bottle_rama',
    name: 'Bottle-Rama',
    slug: 'bottle-rama',
    unlockMonth: 9,
    description: 'Follow the recipe ticket! Serve as many bottles before time runs out!',
    xpRule: 'Up to 2,550 XP (+850 per star)',
    color: 'bg-orange-100',
  },
];

export const GAME_IDS: GameId[] = GAMES.map((g) => g.id);

export function getGameById(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
