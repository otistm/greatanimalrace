// Species registry for the pet model. Every species reuses the bunny's
// skeleton (sphere body/head, capsule limbs) but swaps colors and face
// features. Cosmetics positioning still keys off 'bunny' since the
// underlying anchor points are identical.

export type SpeciesId =
  | 'bunny'
  | 'cow'
  | 'wolf'
  | 'lion'
  | 'owl'
  | 'tiger'
  | 'bear'
  | 'horse'
  | 'pig'
  | 'frog';

export type EarStyle =
  | 'long-bunny'      // tall floppy capsules
  | 'cone-small'      // small upright triangle (horse)
  | 'cow-flap'        // wide rounded flop ears sticking sideways (cow)
  | 'horse-flap'      // upright rounded flap ears pointing up (horse)
  | 'cat'             // pointed triangle (tiger)
  | 'wolf-pointed'    // narrow pointed triangle (wolf)
  | 'round-bear'      // small round disk (bear, lion)
  | 'pig-floppy'      // floppy triangle drooping forward (pig)
  | 'owl-tufts'       // small upright tufts (owl)
  | 'none';           // frog (no visible ears)

export type SnoutStyle =
  | 'oval-bunny'      // small oval cream muzzle (bunny default)
  | 'wolf-snout'      // longer pointed snout (wolf)
  | 'horse-snout'     // long elongated muzzle with two nostrils (horse)
  | 'cow-large'       // large flat snout with nostrils
  | 'pig-disc'        // flat disc snout pointing forward
  | 'cat-small'       // tiny pad with whisker dots (tiger, lion)
  | 'beak'            // owl beak — small downward triangle
  | 'frog-wide'       // wide thin slit mouth across face
  | 'bear-round';     // rounded small muzzle

export type EyeStyle =
  | 'small-bead'      // standard small black bead
  | 'large-disc'      // big round eyes (owl)
  | 'frog-bulge';     // bulging eyes mounted on top of head

export interface SpeciesConfig {
  id: SpeciesId;
  displayName: string;
  emoji: string;

  // Core color palette
  primary: string;     // body / head / limbs
  belly: string;       // belly + muzzle highlight
  nose: string;        // nose tip
  accent: string;      // mouth / muzzle outline / eye darks
  tail: string;        // tail color

  // Optional patterned overlay applied to the body sphere
  pattern?: 'spots' | 'stripes' | null;
  patternColor?: string;

  // Face configuration
  ears: EarStyle;
  earColor?: string;       // optional override (defaults to primary)
  earInner?: string;       // optional inner ear tint (cat, pig)
  snout: SnoutStyle;
  eyes: EyeStyle;

  // Special head decorations
  horns?: 'cow' | null;
  hasMane?: boolean;       // lion mane
  maneColor?: string;

  // Tail toggle (defaults to true if omitted). Used to hide the tail
  // sphere for species that visually shouldn't have one.
  hasTail?: boolean;
  // Belly toggle (defaults to true if omitted). Used to hide the cream
  // belly patch for species (like the frog) where the belly is the
  // body's natural color rather than a separate decal.
  hasBelly?: boolean;
  // Tail shape variant. Defaults to 'puff' — a single round bobble.
  tailStyle?: 'puff' | 'wolf-bushy';
  tailTip?: string;        // optional lighter tip color (wolf-bushy)
}

export const SPECIES_CONFIG: Record<SpeciesId, SpeciesConfig> = {
  bunny: {
    id: 'bunny',
    displayName: 'Bunny',
    emoji: '🐰',
    primary: '#ff99b4',
    belly: '#fff5f5',
    nose: '#ff6b8b',
    accent: '#1a1a1a',
    tail: '#fff5f5',
    ears: 'long-bunny',
    snout: 'oval-bunny',
    eyes: 'small-bead',
  },
  cow: {
    id: 'cow',
    displayName: 'Cow',
    emoji: '🐮',
    primary: '#ffffff',
    belly: '#fde2e4',
    nose: '#1a1a1a',
    accent: '#1a1a1a',
    tail: '#1a1a1a',
    pattern: 'spots',
    patternColor: '#1f1f1f',
    ears: 'cow-flap',
    earInner: '#fde2e4',
    snout: 'cow-large',
    eyes: 'small-bead',
    horns: 'cow',
    hasTail: false,
  },
  wolf: {
    id: 'wolf',
    displayName: 'Wolf',
    emoji: '🐺',
    primary: '#7d8590',
    belly: '#cdd1d4',
    nose: '#1a1a1a',
    accent: '#1a1a1a',
    tail: '#7d8590',
    tailStyle: 'wolf-bushy',
    tailTip: '#ffffff',
    ears: 'wolf-pointed',
    earInner: '#cdd1d4',
    snout: 'wolf-snout',
    eyes: 'small-bead',
  },
  lion: {
    id: 'lion',
    displayName: 'Lion',
    emoji: '🦁',
    primary: '#e6a153',
    belly: '#f8e6c5',
    nose: '#7a4926',
    accent: '#1a1a1a',
    tail: '#7a4926',
    ears: 'round-bear',
    earInner: '#f8e6c5',
    snout: 'cat-small',
    eyes: 'small-bead',
    hasMane: true,
    maneColor: '#a85f1f',
  },
  owl: {
    id: 'owl',
    displayName: 'Owl',
    emoji: '🦉',
    primary: '#a17c5a',
    belly: '#f3d8b8',
    nose: '#f59e0b',
    accent: '#1a1a1a',
    tail: '#7a4926',
    ears: 'owl-tufts',
    snout: 'beak',
    eyes: 'small-bead',
    hasTail: false,
  },
  tiger: {
    id: 'tiger',
    displayName: 'Tiger',
    emoji: '🐯',
    primary: '#ee8a3f',
    belly: '#ffffff',
    nose: '#1a1a1a',
    accent: '#1a1a1a',
    tail: '#ee8a3f',
    // Stripes are rendered as placed paint-stroke decals on the body /
    // head (see TigerStripes in PinkBunny) instead of a procedural
    // texture, so we omit pattern/patternColor here.
    ears: 'cat',
    earInner: '#ffffff',
    snout: 'bear-round',
    eyes: 'small-bead',
  },
  bear: {
    id: 'bear',
    displayName: 'Bear',
    emoji: '🐻',
    primary: '#8a5a2b',
    belly: '#d3a87a',
    nose: '#1a1a1a',
    accent: '#1a1a1a',
    tail: '#8a5a2b',
    ears: 'round-bear',
    earInner: '#d3a87a',
    snout: 'bear-round',
    eyes: 'small-bead',
  },
  horse: {
    id: 'horse',
    displayName: 'Horse',
    emoji: '🐴',
    primary: '#a0764e',
    belly: '#e0c8a4',
    nose: '#1a1a1a',
    accent: '#1a1a1a',
    tail: '#1a1a1a',
    tailStyle: 'wolf-bushy',
    ears: 'horse-flap',
    earInner: '#e0c8a4',
    snout: 'horse-snout',
    eyes: 'small-bead',
    hasMane: true,
    maneColor: '#1a1a1a',
  },
  pig: {
    id: 'pig',
    displayName: 'Pig',
    emoji: '🐷',
    primary: '#f8b7b7',
    belly: '#fcd0d0',
    nose: '#e07b7b',
    accent: '#1a1a1a',
    tail: '#f8b7b7',
    ears: 'pig-floppy',
    earInner: '#fcd0d0',
    snout: 'pig-disc',
    eyes: 'small-bead',
  },
  frog: {
    id: 'frog',
    displayName: 'Frog',
    emoji: '🐸',
    primary: '#74c69d',
    belly: '#fdf4e3',
    nose: '#3d6b4f',
    accent: '#1a1a1a',
    tail: '#74c69d',
    ears: 'none',
    snout: 'frog-wide',
    eyes: 'frog-bulge',
    hasBelly: false,
  },
};

export function getSpeciesConfig(id: string | undefined | null): SpeciesConfig {
  if (!id) return SPECIES_CONFIG.bunny;
  return (SPECIES_CONFIG as Record<string, SpeciesConfig | undefined>)[id] ?? SPECIES_CONFIG.bunny;
}

// Animal IDs that the new species-driven PinkBunny renderer handles.
// 'unicorn' still uses its own dedicated component so it's intentionally
// excluded from this list.
export const SPECIES_IDS: SpeciesId[] = [
  'bunny', 'cow', 'wolf', 'lion', 'owl', 'tiger', 'bear', 'horse', 'pig', 'frog',
];
