'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Weight } from '@/lib/types';

export const useWeights = (petId: string) => {
  const { user } = useAuth();
  const [weights, setWeights] = useState<Weight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !petId) {
      setWeights([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const weightsCollectionRef = collection(db, `pets/${petId}/weights`);
    const q = query(weightsCollectionRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedWeights: Weight[] = snapshot.docs.map(doc => ({
        id: doc.id,
        petId: petId,
        ...doc.data() as Omit<Weight, 'id' | 'petId'>
      }));
      setWeights(fetchedWeights);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching weights: ", err);
      setError("体重データの取得中にエラーが発生しました。");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, petId]);

  const addWeight = useCallback(async (newWeight: Omit<Weight, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt' | 'petId'>) => {
    if (!user || !petId) {
      setError("ユーザーが認証されていないか、犬が選択されていません。");
      return;
    }
    try {
      const weightsCollectionRef = collection(db, `pets/${petId}/weights`);
      await addDoc(weightsCollectionRef, {
        ...newWeight,
        petId: petId,
        createdBy: user.uid,
        updatedBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error("Error adding weight: ", err);
      setError("体重の追加中にエラーが発生しました。");
    }
  }, [user, petId]);

  const updateWeight = useCallback(async (weightId: string, updatedFields: Partial<Omit<Weight, 'id' | 'createdBy' | 'createdAt' | 'petId'>>) => {
    if (!user || !petId) {
      setError("ユーザーが認証されていないか、犬が選択されていません。");
      return;
    }
    try {
      const weightDocRef = doc(db, `pets/${petId}/weights`, weightId);
      await updateDoc(weightDocRef, {
        ...updatedFields,
        updatedBy: user.uid,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error("Error updating weight: ", err);
      setError("体重の更新中にエラーが発生しました。");
    }
  }, [user, petId]);

  const deleteWeight = useCallback(async (weightId: string) => {
    if (!user || !petId) {
      setError("ユーザーが認証されていないか、犬が選択されていません。");
      return;
    }
    try {
      const weightDocRef = doc(db, `pets/${petId}/weights`, weightId);
      await deleteDoc(weightDocRef);
    } catch (err) {
      console.error("Error deleting weight: ", err);
      setError("体重の削除中にエラーが発生しました。");
    }
  }, [user, petId]);

  return { weights, loading, error, addWeight, updateWeight, deleteWeight };
};
