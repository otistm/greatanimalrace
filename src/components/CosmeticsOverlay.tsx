import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shirt as ShirtIcon, Store, Coins, Crown, Glasses, LayoutGrid, Sword as SwordIcon } from 'lucide-react';
import { Cosmetic3DIcon } from './Cosmetic3DIcon';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { COSMETIC_SETS, getCosmeticData, getMilestoneShirtNumber, matchesBaseName, type CosmeticPart, type CosmeticSet } from '../utils/cosmeticsRegistry';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cosmetics: string[];
  equippedCosmetics: string[];
  onToggleEquip: (cosmetic: string) => void;
  onSetColor: (cosmetic: string, color: string) => void;
  coins: number;
  onBuySet: (set: CosmeticSet) => void;
}

// Token-exact color -> CSS swatch mapping. Only the four supported tokens.
//   Ruby = red, Ocean = blue, Emerald = green, Golden = yellow.
const COLOR_SWATCH: Record<string, string> = {
  Ruby: '#ef4444',
  Ocean: '#3b82f6',
  Emerald: '#22c55e',
  Golden: '#fbbf24',
};

const COLOR_BG: Record<string, { equipped: string; idle: string }> = {
  Ruby: { equipped: 'bg-red-300', idle: 'bg-red-50' },
  Ocean: { equipped: 'bg-blue-300', idle: 'bg-blue-50' },
  Emerald: { equipped: 'bg-green-300', idle: 'bg-green-50' },
  Golden: { equipped: 'bg-yellow-300', idle: 'bg-yellow-50' },
};

const COLOR_BORDER: Record<string, string> = {
  Ruby: 'border-red-400 shadow-md transform scale-[1.02] ring-2 ring-red-200',
  Ocean: 'border-blue-400 shadow-md transform scale-[1.02] ring-2 ring-blue-200',
  Emerald: 'border-green-400 shadow-md transform scale-[1.02] ring-2 ring-green-200',
  Golden: 'border-yellow-400 shadow-md transform scale-[1.02] ring-2 ring-yellow-200',
};

const DEFAULT_EQUIPPED_BORDER = 'border-pink-400 shadow-md transform scale-[1.02] ring-2 ring-pink-200';
const DEFAULT_BG = { equipped: 'bg-pink-300', idle: 'bg-gray-50' };

// Extracts the color token (first word) from an equipped variant if and only
// if it matches a known color in the cosmetic's `colors` array.
const extractColor = (equippedStr: string | undefined, cosmetic: string): string | null => {
  if (!equippedStr) return null;
  const data = getCosmeticData(cosmetic);
  if (!data) return null;
  const firstWord = equippedStr.split(' ')[0];
  // Some themed pieces have multi-word names and a single color that matches
  // the first word of the name. We check if the FIRST word of the equipped
  // string is in the valid colors list.
  return data.colors.includes(firstWord) ? firstWord : null;
};

type InventoryCategory = 'all' | CosmeticPart | 'held' | 'back';

const CATEGORY_TABS: { id: InventoryCategory; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All', Icon: LayoutGrid },
  { id: 'hat', label: 'Hats', Icon: Crown },
  { id: 'glasses', label: 'Glasses', Icon: Glasses },
  { id: 'top', label: 'Tops', Icon: ShirtIcon },
  { id: 'held', label: 'Items', Icon: SwordIcon },
  { id: 'back', label: 'Back', Icon: SwordIcon },
];

export function CosmeticsOverlay({ isOpen, onClose, cosmetics, equippedCosmetics, onToggleEquip, onSetColor, coins, onBuySet }: Props) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'shop'>('inventory');
  const [activeCategory, setActiveCategory] = useState<InventoryCategory>('all');

  // Drop entries we can't render (legacy/migrated names, typos, etc.) so the
  // inventory grid never shows broken cards or miscounts in the "All" badge.
  const recognized = useMemo(
    () => cosmetics.filter((c) => !!getCosmeticData(c)),
    [cosmetics]
  );

  // Sort tops so base shirts come first and milestone shirts come last in
  // numeric order (otherwise insertion order pushes milestones in between).
  const sortTopsLast = (a: string, b: string): number => {
    const aNum = getMilestoneShirtNumber(a);
    const bNum = getMilestoneShirtNumber(b);
    if (aNum !== null && bNum !== null) return aNum - bNum;
    if (aNum !== null) return 1;
    if (bNum !== null) return -1;
    return a.localeCompare(b);
  };

  const sortedRecognized = useMemo(() => {
    return [...recognized].sort((a, b) => {
      const aData = getCosmeticData(a);
      const bData = getCosmeticData(b);
      const aTop = aData?.part === 'top';
      const bTop = bData?.part === 'top';
      if (aTop && bTop) return sortTopsLast(a, b);
      return 0;
    });
  }, [recognized]);

  const categoryCounts = useMemo(() => {
    const counts: Record<InventoryCategory, number> = {
      all: recognized.length,
      hat: 0,
      glasses: 0,
      top: 0,
      'held-left': 0,
      'held-right': 0,
      held: 0,
      back: 0,
    };
    recognized.forEach((c) => {
      const data = getCosmeticData(c);
      if (!data) return;
      counts[data.part] += 1;
      if (data.part === 'held-left' || data.part === 'held-right') {
        counts.held += 1;
      }
    });
    return counts;
  }, [recognized]);

  const filteredCosmetics = useMemo(() => {
    if (activeCategory === 'all') return sortedRecognized;
    return sortedRecognized.filter((c) => {
      const data = getCosmeticData(c);
      if (!data) return false;
      if (activeCategory === 'held') {
        return data.part === 'held-left' || data.part === 'held-right';
      }
      return data.part === activeCategory;
    });
  }, [sortedRecognized, activeCategory]);

  const getCosmeticVisual = (cosmetic: string, isEquipped: boolean, equippedStr?: string) => {
    const color = extractColor(equippedStr, cosmetic);
    // Themed-set pieces use color tokens (Royal/Steel/Pink/Wood/Eden/Brown)
    // that aren't in COLOR_BG, so fall back to DEFAULT_BG when missing.
    const palette = (color && COLOR_BG[color]) || DEFAULT_BG;
    const bgClass = isEquipped ? palette.equipped : palette.idle;

    return (
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-3 ${bgClass} transition-colors overflow-hidden relative shadow-inner`}>
        <Cosmetic3DIcon cosmetic={equippedStr || cosmetic} />
      </div>
    );
  };

  const renderColorSwatches = (cosmetic: string, equippedStr: string | undefined) => {
    const data = getCosmeticData(cosmetic);
    if (!data || data.colors.length <= 1) return null;
    const currentColor = extractColor(equippedStr, cosmetic);
    return (
      <div
        className="flex items-center justify-center gap-1.5 mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        {data.colors.map((c) => {
          const isCurrent = c === currentColor;
          const swatchColor = COLOR_SWATCH[c] || '#d4d4d8';
          return (
            <button
              key={c}
              type="button"
              aria-label={`Set color ${c}`}
              onClick={(e) => {
                e.stopPropagation();
                onSetColor(cosmetic, c);
              }}
              className={`w-4 h-4 rounded-full border transition-transform ${isCurrent ? 'border-zinc-900 scale-110 ring-2 ring-offset-1 ring-zinc-900/40' : 'border-zinc-300 hover:scale-110'}`}
              style={{ backgroundColor: swatchColor }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4 sm:p-6 md:p-8 pointer-events-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 shrink-0" />
            
            <div className="flex justify-end p-4 shrink-0">
              <button 
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-800 transition-colors bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 md:px-8 pb-6 md:pb-8 flex flex-col flex-1 min-h-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shrink-0">
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl">
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'inventory' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <div className="flex items-center gap-2">
                      <ShirtIcon className="w-4 h-4" />
                      My Items
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'shop' ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      Shop
                    </div>
                  </button>
                </div>
                
                {activeTab === 'shop' && (
                  <div className="flex items-center gap-2 bg-yellow-50 text-yellow-600 px-4 py-2 rounded-2xl font-black text-lg border-2 border-yellow-200">
                    <Coins className="w-5 h-5" />
                    {coins.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                <AnimatePresence mode="wait">
                  {activeTab === 'inventory' ? (
                    <motion.div
                      key="inventory"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      {recognized.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <ShirtIcon className="w-10 h-10 text-gray-300" />
                          </div>
                          <p className="text-gray-500 font-medium">You haven't found any cosmetics yet.</p>
                          <p className="text-gray-400 text-sm mt-2">Find treasure chests to unlock cool items!</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-2 mb-3 -mx-2 px-2 sticky top-0 bg-white z-10">
                            {CATEGORY_TABS.map(({ id, label, Icon }) => {
                              const count = categoryCounts[id];
                              const isActive = activeCategory === id;
                              const isDisabled = count === 0 && id !== 'all';
                              return (
                                <button
                                  key={id}
                                  onClick={() => !isDisabled && setActiveCategory(id)}
                                  disabled={isDisabled}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 ${
                                    isActive
                                      ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                                      : isDisabled
                                      ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                      : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-500'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  {label}
                                  <span
                                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] leading-none font-black ${
                                      isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                                    }`}
                                  >
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {filteredCosmetics.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <ShirtIcon className="w-8 h-8 text-gray-300" />
                              </div>
                              <p className="text-gray-500 font-medium text-sm">No items in this category yet.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
                              {filteredCosmetics.map((cosmetic) => {
                            const equippedStr = equippedCosmetics?.find(c => matchesBaseName(c, cosmetic));
                            const isEquipped = !!equippedStr;
                            const color = extractColor(equippedStr, cosmetic);
                            const borderClass = isEquipped
                              ? (color && COLOR_BORDER[color]) || DEFAULT_EQUIPPED_BORDER
                              : 'border-pink-100 hover:border-pink-200';

                            return (
                              <button
                                key={cosmetic}
                                onClick={() => onToggleEquip(cosmetic)}
                                className={`bg-white border-2 rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-200 ease-out outline-none ${borderClass}`}
                              >
                                {getCosmeticVisual(cosmetic, isEquipped, equippedStr)}
                                <span className={`font-bold text-sm capitalize ${isEquipped ? 'text-zinc-800' : 'text-zinc-600'}`}>
                                  {cosmetic.replace(/^(a |some |an )/, '').replace('!', '')}
                                </span>
                                <span className={`text-xs mt-1 font-bold ${isEquipped ? 'text-green-500' : 'text-zinc-400'}`}>
                                  {isEquipped ? 'EQUIPPED' : 'Equip'}
                                </span>
                                {isEquipped && renderColorSwatches(cosmetic, equippedStr)}
                              </button>
                            );
                          })}
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="shop"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 h-full content-start"
                    >
                      {COSMETIC_SETS.map((set) => {
                        const isOwned = set.pieces.every(p => cosmetics.includes(p));
                        const canAfford = coins >= set.price;

                        return (
                          <div
                            key={set.id}
                            className={`bg-white border-2 rounded-2xl p-4 flex flex-col text-center transition-all duration-200 ${isOwned ? 'border-gray-200 opacity-90' : canAfford ? 'border-yellow-200 hover:border-yellow-400 hover:shadow-md' : 'border-gray-200 opacity-60'}`}
                          >
                            <div className="font-black text-base text-zinc-800 mb-1">
                              {set.name.toUpperCase()}
                            </div>
                            <div className="text-xs text-zinc-500 mb-3">
                              {set.description}
                            </div>

                            <div className="flex items-center justify-center gap-2 mb-3">
                              {set.pieces.map((piece) => {
                                const data = getCosmeticData(piece);
                                const swatchVariant = data ? `${data.colors[0]} ${piece}` : piece;
                                return (
                                  <div
                                    key={piece}
                                    className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shadow-inner"
                                    title={piece}
                                  >
                                    <Cosmetic3DIcon cosmetic={swatchVariant} />
                                  </div>
                                );
                              })}
                            </div>

                            {isOwned ? (
                              <div className="mt-auto px-4 py-2 bg-gray-100 text-gray-500 rounded-full text-xs font-bold w-full">
                                OWNED
                              </div>
                            ) : (
                              <button
                                onClick={() => canAfford && onBuySet(set)}
                                disabled={!canAfford}
                                className={`mt-auto px-4 py-2 rounded-full text-sm font-black w-full flex items-center justify-center gap-1.5 transition-colors ${canAfford ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                              >
                                <Coins className="w-4 h-4" />
                                {set.price}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
        <Canvas 
          className="fixed inset-0 pointer-events-none z-[120]" 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}
          frameloop="always"
          gl={{ preserveDrawingBuffer: false, alpha: true, antialias: true }}
          eventSource={document.getElementById('root') || undefined}
        >
          <View.Port />
        </Canvas>
      </>
    )}
  </AnimatePresence>
);
}