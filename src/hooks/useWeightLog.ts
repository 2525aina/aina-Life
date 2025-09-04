// src/hooks/useWeightLog.ts
// ペットの体重ログを管理するためのカスタムフック

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

// WeightLogの型定義
export interface WeightLog {
  id: string;
  value: number;
  unit: 'kg' | 'lb';
  date: Date;
}

export const useWeightLog = (petId?: string) => {
  const { user } = useAuth();
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 体重履歴の取得
  useEffect(() => {
    if (!petId || !user) {
      setWeights([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const weightsCollectionRef = collection(db, 'dogs', petId, 'weights');
    const q = query(weightsCollectionRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const weightsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            value: data.value,
            unit: data.unit,
            date: (data.date as Timestamp).toDate(),
          };
        });
        setWeights(weightsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching weight logs:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [petId, user]);

  // 新しい体重の追加
  const addWeight = useCallback(
    async (value: number, date: Date, unit: 'kg' | 'lb' = 'kg') => {
      if (!petId || !user) {
        throw new Error('Pet ID or user not available.');
      }

      const weightsCollectionRef = collection(db, 'dogs', petId, 'weights');
      
      await addDoc(weightsCollectionRef, {
        value,
        unit,
        date: Timestamp.fromDate(date),
        createdBy: user.uid,
      });
    },
    [petId, user]
  );

  // 体重記録の更新
  const updateWeight = useCallback(
    async (logId: string, value: number, date: Date) => {
      if (!petId || !user) {
        throw new Error('Pet ID or user not available.');
      }
      const weightDocRef = doc(db, 'dogs', petId, 'weights', logId);
      await updateDoc(weightDocRef, {
        value,
        date: Timestamp.fromDate(date),
        updatedBy: user.uid,
      });
    },
    [petId, user]
  );

  // 体重記録の削除
  const deleteWeight = useCallback(
    async (logId: string) => {
      if (!petId) {
        throw new Error('Pet ID not available.');
      }
      const weightDocRef = doc(db, 'dogs', petId, 'weights', logId);
      await deleteDoc(weightDocRef);
    },
    [petId]
  );

  return { weights, loading, error, addWeight, updateWeight, deleteWeight };
};
