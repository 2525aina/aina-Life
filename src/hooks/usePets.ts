// src/hooks/usePets.ts
// ペット情報を管理するカスタムフック。
// Firestore（dogsコレクション）からペット一覧を取得し、追加・更新・削除を提供。
// 依存: useAuth, firebase/firestore, db(firebase初期化)

// Reactフック
import { useState, useEffect, useCallback } from 'react';
// Firestore関連API
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
// Firebase初期化済みインスタンス
import { db } from '@/lib/firebase';
// 認証情報を取得するカスタムフック
import { useAuth } from './useAuth';

// ペットデータ型定義
export interface Pet {
  id: string;
  ownerIds: string[];
  name: string;
  breed: string;
  birthday: string;
}

export const usePets = () => {
  const { user } = useAuth(); // ログインユーザーを取得
  const [pets, setPets] = useState<Pet[]>([]); // ユーザーが登録したペット一覧
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null); // 現在選択中のペットID
  const [loading, setLoading] = useState(true); // Firestoreからの読み込み状態

  useEffect(() => {
    if (!user) {
      // 未ログイン時は初期化して終了
      setPets([]);
      setSelectedPetId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const petsCollection = collection(db, 'dogs');
    const q = query(petsCollection, where('ownerIds', 'array-contains', user.uid));

    // Firestoreのリアルタイム購読
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Pet, 'id'>),
        }));
        setPets(fetchedPets);

        // 選択中のペットが存在しない場合は、先頭のペットを自動選択
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

    return () => unsubscribe(); // クリーンアップ時に購読解除
  }, [user, selectedPetId]);

  // ペットを選択する関数（UI側で選択操作時に使用）
  const selectPet = useCallback((petId: string) => {
    setSelectedPetId(petId);
  }, []);

  // 新しいペットを追加する関数
  const addPet = async (petData: Omit<Pet, 'id' | 'ownerIds'>) => {
    if (!user) {
      alert('ログインが必要です。');
      return;
    }
    try {
      await addDoc(collection(db, 'dogs'), {
        ...petData,
        ownerIds: [user.uid], // ログインユーザーをオーナーとして登録
        createdAt: serverTimestamp(), // 作成日時を付与
      });
    } catch (error) {
      console.error('ペットの追加に失敗しました:', error);
      alert('ペットの追加に失敗しました。');
    }
  };

  // ペットを削除する関数
  const deletePet = async (petId: string) => {
    if (!user) {
      alert('ログインが必要です。');
      return;
    }
    try {
      await deleteDoc(doc(db, 'dogs', petId));
      // 選択中のペットが削除された場合は選択解除
      if (selectedPetId === petId) {
        setSelectedPetId(null);
      }
    } catch (error) {
      console.error('ペットの削除に失敗しました:', error);
      alert('ペットの削除に失敗しました。');
    }
  };

  // ペット情報を更新する関数
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