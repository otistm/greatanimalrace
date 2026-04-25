import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useGlobalRank(ageInMonths: number) {
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRank = async () => {
      setLoading(true);
      try {
        // Find how many users have a strictly older pet
        const q = query(
          collection(db, 'users_v3'),
          where('progression.age', '>', ageInMonths)
        );
        
        const snapshot = await getDocs(q);
        
        // Rank is the number of older pets + 1
        setRank(snapshot.size + 1);
      } catch (error) {
        console.error('Error fetching global rank:', error);
        setRank(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRank();
  }, [user, ageInMonths]);

  return { rank, loading };
}
