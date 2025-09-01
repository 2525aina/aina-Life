// src/hooks/usePets.ts
// ペット情報を管理するカスタムフック。
// Firestore（dogsコレクション）からペット一覧を取得し、追加・更新・削除を提供。
// 依存: useAuth, firebase/firestore, db(firebase初期化)

// Reactフック
import { useState, useEffect, useCallback } from 'react';
// Firestore関連API
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs, collectionGroup, getDoc } from 'firebase/firestore';
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

// 共有メンバーのデータ型定義
export interface Member {
  id: string;
  role: 'owner' | 'general' | 'viewer';
  inviteEmail?: string; // 招待時のメールアドレス
  status?: 'pending' | 'active' | 'removed' | 'declined';
}

export const usePets = () => {
  const { user } = useAuth(); // ログインユーザーを取得
  const [pets, setPets] = useState<Pet[]>([]); // ユーザーが登録したペット一覧
  const [loading, setLoading] = useState(true); // Firestoreからの読み込み状態

  useEffect(() => {
    if (!user) {
      setPets([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. 自分がオーナーのペットを購読
    const ownerPetsQuery = query(collection(db, 'dogs'), where('ownerIds', 'array-contains', user.uid));
    const unsubscribeOwnerPets = onSnapshot(ownerPetsQuery, (snapshot) => {
      const ownedPets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet));
      
      // 2. 共有されているペットを取得 (inviteEmail と status でクエリ)
      const sharedPetsQuery = query(
        collectionGroup(db, 'members'), 
        where('inviteEmail', '==', user.email),
        where('status', '==', 'active')
      );

      getDocs(sharedPetsQuery).then(async (membersSnapshot) => {
        const sharedPetPromises = membersSnapshot.docs.map(memberDoc => {
          // memberドキュメントの親(pet)の参照を取得
          const petDocRef = memberDoc.ref.parent.parent;
          if (!petDocRef) return null;
          return getDoc(petDocRef);
        }).filter(p => p !== null) as Promise<any>[];
        
        const sharedPetDocs = await Promise.all(sharedPetPromises);
        const sharedPets = sharedPetDocs.map(doc => ({ id: doc.id, ...doc.data() } as Pet));

        // 3. 統合と重複排除
        const allPets = [...ownedPets, ...sharedPets];
        const uniquePets = Array.from(new Map(allPets.map(p => [p.id, p])).values());
        
        setPets(uniquePets);
        setLoading(false);
      }).catch(error => {
        console.error("共有ペットの取得に失敗しました:", error);
        // エラーが発生しても、オーナーのペットは表示する
        setPets(ownedPets);
        setLoading(false);
      });
    }, (error) => {
      console.error('ペット情報の取得に失敗しました:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeOwnerPets();
    };
  }, [user]);

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
    if (!confirm('⚠️本当にこのペットを完全に削除しますか？この操作は元に戻せません。')) {
      return;
    }
    try {
      // 1. サブコレクション (tasks) のドキュメントを全て削除
      const tasksRef = collection(db, 'dogs', petId, 'tasks');
      const taskDocs = await getDocs(tasksRef);
      const deleteTasksPromises = taskDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deleteTasksPromises);

      // 2. サブコレクション (logs) のドキュメントを全て削除
      const logsRef = collection(db, 'dogs', petId, 'logs');
      const logDocs = await getDocs(logsRef);
      const deleteLogsPromises = logDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deleteLogsPromises);

      // 3. 親ドキュメント (pet) を削除
      await deleteDoc(doc(db, 'dogs', petId));
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

  // 共有メンバーを取得する関数
  const getSharedMembers = useCallback(async (petId: string): Promise<Member[]> => {
    try {
      const membersCollection = collection(db, 'dogs', petId, 'members');
      const snapshot = await getDocs(membersCollection);
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Member, 'id'>),
      }));
      return members;
    } catch (error) {
      console.error('共有メンバーの取得に失敗しました:', error);
      return []; // エラー時は空配列を返す
    }
  }, []);

  // メンバーを招待する関数
  const inviteMember = async (petId: string, email: string) => {
    if (!user) {
      throw new Error('ログインが必要です。');
    }
    try {
      const membersCollection = collection(db, 'dogs', petId, 'members');
      // TODO: 招待する前に、既にメンバーでないか、招待中でないかを確認する
      await addDoc(membersCollection, {
        inviteEmail: email,
        invitedBy: user.uid,
        invitedAt: serverTimestamp(),
        role: 'viewer', // 招待時は閲覧者として設定
        status: 'pending', //ステータスは招待中
      });
    } catch (error) {
      console.error('メンバーの招待に失敗しました:', error);
      throw new Error('メンバーの招待に失敗しました。');
    }
  };

  return { pets, loading, addPet, deletePet, updatePet, getSharedMembers, inviteMember };
};