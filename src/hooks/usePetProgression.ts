import { useState, useCallback, useEffect } from 'react';

export function usePetProgression(isActive: boolean = true) {
  const [progression, setProgression] = useState(() => {
    const saved = localStorage.getItem('petProgression');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { age: 0, xp: 0 };
  });

  const [stamina, setStamina] = useState(() => {
    const saved = localStorage.getItem('petStamina');
    if (saved !== null) return parseInt(saved);
    return 100;
  });

  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('petCoins');
    if (saved !== null) return parseInt(saved);
    return 0;
  });

  useEffect(() => {
    localStorage.setItem('petProgression', JSON.stringify(progression));
    localStorage.setItem('petStamina', stamina.toString());
    localStorage.setItem('petCoins', coins.toString());
  }, [progression, stamina, coins]);

  const loadState = useCallback((state: { age: number, xp: number, stamina?: number, coins?: number }) => {
    setProgression({ age: state.age, xp: state.xp });
    if (state.stamina !== undefined) setStamina(state.stamina);
    if (state.coins !== undefined) setCoins(state.coins);
  }, []);

  const resetState = useCallback(() => {
    setProgression({ age: 0, xp: 0 });
    setStamina(100);
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

  const updateStamina = useCallback((amount: number) => {
    setStamina(prev => Math.max(0, Math.min(100, prev + amount)));
  }, []);

  const updateCoins = useCallback((amount: number) => {
    setCoins(prev => Math.max(0, prev + amount));
  }, []);

  // Decrease stamina slightly over time just so it falls asleep eventually if not fed
  useEffect(() => {
    // Only apply passive drain if not active, or handle it elsewhere based on movement
    // Removing the passive drain so stamina is only lost during movement
    if (!isActive) return;
    
    // Removing the passive interval drain
  }, [isActive]);

  return {
    ageInMonths: progression.age,
    currentXp: progression.xp,
    requiredXp: getRequiredXp(progression.age),
    addXp,
    stamina,
    coins,
    updateStamina,
    updateCoins,
    loadState,
    resetState
  };
}

