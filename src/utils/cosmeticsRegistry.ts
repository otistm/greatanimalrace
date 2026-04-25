import { getColor } from './cosmetics';

export type CosmeticPart = 'hat' | 'glasses' | 'top' | 'held-left' | 'held-right' | 'back';

export interface CosmeticData {
  id: string;
  name: string;
  part: CosmeticPart;
  componentName: string; // The R3F component to render
  lensType?: 'dark' | 'clear';
  shape?: 'circle' | 'rectangle';
  texturePattern?: string; // e.g. 'striped', 'polka-dot', 'heart', 'star'
  colors: string[]; // Available color variants
}

// The four canonical color tokens used everywhere. Names map to red/blue/green/yellow:
//   Ruby = red, Ocean = blue, Emerald = green, Golden = yellow.
export const COSMETIC_COLORS = ["Ruby", "Ocean", "Emerald", "Golden"] as const;
export type CosmeticColor = typeof COSMETIC_COLORS[number];

export const COSMETIC_REGISTRY: Record<string, CosmeticData> = {
  "Crown": { id: "Crown", name: "Crown", part: "hat", componentName: "Crown", colors: [...COSMETIC_COLORS] },
  "Top Hat": { id: "Top Hat", name: "Top Hat", part: "hat", componentName: "TopHat", colors: [...COSMETIC_COLORS] },
  "Cap": { id: "Cap", name: "Cap", part: "hat", componentName: "Cap", colors: [...COSMETIC_COLORS] },
  "Beanie": { id: "Beanie", name: "Beanie", part: "hat", componentName: "Beanie", colors: [...COSMETIC_COLORS] },
  "Witch Hat": { id: "Witch Hat", name: "Witch Hat", part: "hat", componentName: "WitchHat", colors: [...COSMETIC_COLORS] },
  "Circle Sunglasses": { id: "Circle Sunglasses", name: "Circle Sunglasses", part: "glasses", componentName: "Glasses", lensType: 'dark', shape: 'circle', colors: [...COSMETIC_COLORS] },
  "Rectangle Sunglasses": { id: "Rectangle Sunglasses", name: "Rectangle Sunglasses", part: "glasses", componentName: "Glasses", lensType: 'dark', shape: 'rectangle', colors: [...COSMETIC_COLORS] },
  "Circle Glasses": { id: "Circle Glasses", name: "Circle Glasses", part: "glasses", componentName: "Glasses", lensType: 'clear', shape: 'circle', colors: [...COSMETIC_COLORS] },
  "Rectangle Glasses": { id: "Rectangle Glasses", name: "Rectangle Glasses", part: "glasses", componentName: "Glasses", lensType: 'clear', shape: 'rectangle', colors: [...COSMETIC_COLORS] },
  "Striped Shirt": { id: "Striped Shirt", name: "Striped Shirt", part: "top", componentName: "Shirt", texturePattern: 'striped', colors: [...COSMETIC_COLORS] },
  "Polka-Dot Shirt": { id: "Polka-Dot Shirt", name: "Polka-Dot Shirt", part: "top", componentName: "Shirt", texturePattern: 'polka-dot', colors: [...COSMETIC_COLORS] },
  "Heart Crop Top": { id: "Heart Crop Top", name: "Heart Crop Top", part: "top", componentName: "CropTop", texturePattern: 'heart', colors: [...COSMETIC_COLORS] },
  "Star Crop Top": { id: "Star Crop Top", name: "Star Crop Top", part: "top", componentName: "CropTop", texturePattern: 'star', colors: [...COSMETIC_COLORS] },
  "Raglan": { id: "Raglan", name: "Raglan", part: "top", componentName: "RaglanShirt", colors: [...COSMETIC_COLORS] },
  "Polo": { id: "Polo", name: "Polo", part: "top", componentName: "PoloShirt", colors: [...COSMETIC_COLORS] },

  // ===================== Themed Set Pieces =====================
  // Each piece uses a single fixed color so the swatch row hides itself.

  // Crown Set
  "Royal Crown": { id: "Royal Crown", name: "Royal Crown", part: "hat", componentName: "Crown", colors: ["Golden"] },
  "Royal Robe": { id: "Royal Robe", name: "Royal Robe", part: "top", componentName: "Robe", colors: ["Royal"] },
  "Royal Scepter": { id: "Royal Scepter", name: "Royal Scepter", part: "held-right", componentName: "Scepter", colors: ["Golden"] },

  // Armor Set
  "Knight Breastplate": { id: "Knight Breastplate", name: "Knight Breastplate", part: "top", componentName: "Breastplate", colors: ["Steel"] },
  "Knight Mask": { id: "Knight Mask", name: "Knight Mask", part: "hat", componentName: "KnightMask", colors: ["Steel", "Dark Steel", "Obsidian"] },
  "Knight Shield": { id: "Knight Shield", name: "Knight Shield", part: "back", componentName: "Shield", colors: ["Steel"] },
  "Knight Sword": { id: "Knight Sword", name: "Knight Sword", part: "back", componentName: "Sword", colors: ["Steel"] },

  // Slugger Set — Yankees-style navy with white pinstripes.
  "Slugger Jersey": { id: "Slugger Jersey", name: "Slugger Jersey", part: "top", componentName: "Jersey", texturePattern: 'pinstripe', colors: ["Navy"] },
  "Slugger Cap": { id: "Slugger Cap", name: "Slugger Cap", part: "hat", componentName: "Cap", texturePattern: 'pinstripe', colors: ["Navy"] },
  "Slugger Bat": { id: "Slugger Bat", name: "Slugger Bat", part: "held-right", componentName: "BaseballBat", colors: ["Wood"] },

  // Luffy Set — Pirate king's straw hat and open red captain's vest.
  "Straw Hat": { id: "Straw Hat", name: "Straw Hat", part: "hat", componentName: "StrawHat", colors: ["Straw"] },
  "Luffy Vest": { id: "Luffy Vest", name: "Luffy Vest", part: "top", componentName: "LuffyVest", colors: ["Pirate"] },
};

// =================== Cosmetic Sets ===================
// Sets are sold in the store as a single bundle. Buying a set unlocks every
// piece and auto-equips the full outfit (replacing any conflicting pieces).
export interface CosmeticSet {
  id: string;
  name: string;
  description: string;
  price: number;
  pieces: string[]; // Cosmetic ids from COSMETIC_REGISTRY
}

export const COSMETIC_SETS: CosmeticSet[] = [
  {
    id: "Crown Set",
    name: "Crown Set",
    description: "Royal crown, regal robe, and a golden scepter.",
    price: 100,
    pieces: ["Royal Crown", "Royal Robe", "Royal Scepter"],
  },
  {
    id: "Armor Set",
    name: "Armor Set",
    description: "Steel breastplate, sturdy shield, and trusty sword.",
    price: 100,
    pieces: ["Knight Breastplate", "Knight Shield", "Knight Sword", "Knight Mask"],
  },
  {
    id: "Slugger Set",
    name: "Slugger Set",
    description: "Team jersey, fitted cap, and a wooden bat.",
    price: 100,
    pieces: ["Slugger Jersey", "Slugger Cap", "Slugger Bat"],
  },
  {
    id: "Luffy Set",
    name: "Luffy Set",
    description: "Pirate king's straw hat and open red captain's vest.",
    price: 100,
    pieces: ["Straw Hat", "Luffy Vest"],
  },
];

export const getCosmeticSet = (id: string): CosmeticSet | null =>
  COSMETIC_SETS.find(s => s.id === id) ?? null;

// Legacy color tokens that should be remapped to one of the canonical four.
// Used when migrating already-saved equipped strings whose color prefix is no
// longer in the supported palette.
const LEGACY_COLOR_MAP: Record<string, CosmeticColor> = {
  Rose: "Ruby",
  Pink: "Ruby",
  Red: "Ruby",
  Amethyst: "Ruby",
  Purple: "Ruby",
  Silver: "Golden",
  Gray: "Golden",
  Platinum: "Golden",
  Yellow: "Golden",
  Gold: "Golden",
  Blue: "Ocean",
  Cyan: "Ocean",
  Diamond: "Ocean",
  Green: "Emerald",
  Lime: "Emerald",
  Neon: "Emerald",
  Black: "Ocean",
  Obsidian: "Ocean",
};

// Canonicalize an equipped variant string so its color prefix matches one of
// the cosmetic's supported colors. Themed-set pieces use fixed single-color
// palettes (Royal, Steel, Wood, etc.); base cosmetics use the 4 canonical
// tokens. We respect both.
export const canonicalizeEquippedString = (equipped: string): string => {
  if (!equipped) return equipped;
  const parts = equipped.split(' ');

  // No prefix at all - prepend the cosmetic's default first color.
  if (parts.length < 2) {
    const data = getCosmeticData(equipped);
    if (data) return `${data.colors[0]} ${equipped}`;
    return equipped;
  }

  const [first, ...rest] = parts;
  const restName = rest.join(' ');
  const restData = getCosmeticData(restName);

  // First word is already a valid color for this specific cosmetic.
  if (restData && restData.colors.includes(first)) return equipped;

  // First word is a canonical color but the cosmetic uses a different palette
  // (e.g. "Ruby Royal Robe" → "Royal Royal Robe").
  if (restData && (COSMETIC_COLORS as readonly string[]).includes(first)) {
    return `${restData.colors[0]} ${restName}`;
  }

  // Legacy color token: remap and re-validate against the cosmetic's palette.
  if (restData && LEGACY_COLOR_MAP[first]) {
    const mapped = LEGACY_COLOR_MAP[first];
    if (restData.colors.includes(mapped)) return `${mapped} ${restName}`;
    return `${restData.colors[0]} ${restName}`;
  }

  // First word is canonical but rest doesn't resolve - leave as-is.
  if ((COSMETIC_COLORS as readonly string[]).includes(first)) return equipped;

  // Treat the whole string as the base name (prefix was missing).
  const wholeData = getCosmeticData(equipped);
  if (wholeData) return `${wholeData.colors[0]} ${equipped}`;

  return equipped;
};

export const BASE_COSMETIC_TYPES = Object.keys(COSMETIC_REGISTRY);

const MILESTONE_SHIRT_RE = /^Milestone Shirt (\d+)$/i;

export const getMilestoneShirtNumber = (id: string): number | null => {
  if (!id) return null;
  const m = id.match(MILESTONE_SHIRT_RE);
  return m ? parseInt(m[1], 10) : null;
};

export const milestoneShirtId = (n: number): string => `Milestone Shirt ${n}`;

// Returns true if `equippedStr` is the equipped variant of `baseName`.
// Accepts either an exact match or a single color-word prefix (e.g.
// "Golden Milestone Shirt 1"). Strips just the leading color word and
// requires the remainder to equal `baseName` exactly so multi-word
// names don't false-match against shorter suffixes — e.g. "Navy Slugger
// Cap" must NOT match the base name "Cap", and "Golden Milestone Shirt
// 1" must NOT match "Milestone Shirt 11".
export const matchesBaseName = (equippedStr: string, baseName: string): boolean => {
  if (equippedStr === baseName) return true;
  const firstSpace = equippedStr.indexOf(' ');
  if (firstSpace <= 0) return false;
  return equippedStr.substring(firstSpace + 1) === baseName;
};

export const getCosmeticData = (id: string): CosmeticData | null => {
  if (COSMETIC_REGISTRY[id]) return COSMETIC_REGISTRY[id];

  const milestoneNum = getMilestoneShirtNumber(id);
  if (milestoneNum !== null) {
    return {
      id,
      name: id,
      part: 'top',
      componentName: 'MilestoneShirt',
      colors: [...COSMETIC_COLORS],
    };
  }

  return null;
};
