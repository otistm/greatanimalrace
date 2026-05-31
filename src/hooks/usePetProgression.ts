import { useState, useCallback, useEffect } from 'react';

export function usePetProgression() {
  const [progression, setProgression] = useState(() => {
    const saved = localStorage.getItem('petProgression');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { age: 0, xp: 0 };
  });

  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('petCoins');
    if (saved !== null) return parseInt(saved);
    return 0;
  });

  useEffect(() => {
    localStorage.setItem('petProgression', JSON.stringify(progression));
    localStorage.setItem('petCoins', coins.toString());
  }, [progression, coins]);

  const loadState = useCallback((state: { age: number; xp: number; coins?: number }) => {
    setProgression({ age: state.age, xp: state.xp });
    if (state.coins !== undefined) setCoins(state.coins);
  }, []);

  const resetState = useCallback(() => {
    setProgression({ age: 0, xp: 0 });
    setCoins(0);
  }, []);

  const getRequiredXp = (age: number) => 500 + (age * 300) + (age * age * 50);

  const addXp = useCallback((amount: number) => {
    setProgression(prev => {
      let newXp = prev.xp + amount;
      let newAge = prev.age;
      let reqXp = getRequiredXp(newAge);

      while (newXp >= reqXp) {
        newXp -= reqXp;
        newAge++;
        reqXp = getRequiredXp(newAge);
      }

      return { age: newAge, xp: newXp };
    });
  }, []);

  const updateCoins = useCallback((amount: number) => {
    setCoins(prev => Math.max(0, prev + amount));
  }, []);

  return {
    ageInMonths: progression.age,
    currentXp: progression.xp,
    requiredXp: getRequiredXp(progression.age),
    addXp,
    coins,
    updateCoins,
    loadState,
    resetState,
  };
}
