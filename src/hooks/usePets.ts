// src/hooks/usePets.ts
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

// Petデータ型定義
export interface Pet {
  id: string;
  ownerIds: string[];
  name: string;
  breed: string;
  birthday: string;
}

export const usePets = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ペット一覧を取得する副作用フック
  useEffect(() => {
    if (!user) {
      setPets([]);
      setSelectedPetId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const petsCollection = collection(db, 'dogs');
    const q = query(petsCollection, where('ownerIds', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Pet, 'id'>),
        }));
        setPets(fetchedPets);

        // 選択中のペットがない、またはリストに存在しない場合、先頭のペットを選択
        if (fetchedPets.length > 0) {
          const currentSelectionExists = fetchedPets.some(p => p.id === selectedPetId);
          if (!selectedPetId || !currentSelectionExists) {
            setSelectedPetId(fetchedPets[0].id);
          }
        } else {
          setSelectedPetId(null);
        }

        setLoading(false);
      },
      (error) => {
        console.error('ペット情報の取得に失敗しました:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, selectedPetId]); // userが変わった時に再実行

  // ペットを選択する関数
  const selectPet = useCallback((petId: string) => {
    setSelectedPetId(petId);
  }, []);

  // 新しいペットを追加する関数（UIは別途作成）
  const addPet = async (petData: Omit<Pet, 'id' | 'ownerIds'>) => {
    if (!user) {
      alert('ログインが必要です。');
      return;
    }
    try {
      await addDoc(collection(db, 'dogs'), {
        ...petData,
        ownerIds: [user.uid],
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('ペットの追加に失敗しました:', error);
      alert('ペットの追加に失敗しました。');
    }
  };

  const deletePet = async (petId: string) => {
    if (!user) {
      alert('ログインが必要です。');
      return;
    }
    try {
      await deleteDoc(doc(db, 'dogs', petId));
      // If the deleted pet was the selected one, clear selection or select another
      if (selectedPetId === petId) {
        setSelectedPetId(null);
      }
    } catch (error) {
      console.error('ペットの削除に失敗しました:', error);
      alert('ペットの削除に失敗しました。');
    }
  };

  const updatePet = async (petId: string, petData: Omit<Pet, 'id' | 'ownerIds'>) => {
    if (!user) {
      alert('ログインが必要です。');
      return;
    }
    try {
      await updateDoc(doc(db, 'dogs', petId), petData);
    } catch (error) {
      console.error('ペットの更新に失敗しました:', error);
      alert('ペットの更新に失敗しました。');
    }
  };

  return { pets, selectedPetId, loading, selectPet, addPet, deletePet, updatePet };
};
