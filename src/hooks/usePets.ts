// src/hooks/usePets.ts
// ペット情報を管理するカスタムフック。
// Firestore（dogsコレクション）からペット一覧を取得し、追加・更新・削除を提供。
// 依存: useAuth, firebase/firestore, db(firebase初期化)

// Reactフック
import { useState, useEffect, useCallback } from 'react';
// Firestore関連API
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs, collectionGroup, getDoc, DocumentSnapshot, setDoc } from 'firebase/firestore';
// Firebase初期化済みインスタンス
import { db } from '@/lib/firebase';
// 認証情報を取得するカスタムフック
import { useAuth } from './useAuth';

// ペットの獣医情報
export interface VetInfo {
  id: string; // UIでの管理をしやすくするためのID
  name?: string;
  phone?: string;
}

// ペットデータ型定義
export interface Pet {
  id: string;
  ownerIds?: string[]; // Optional to support old data
  name: string;
  breed?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  profileImageUrl?: string;
  adoptionDate?: string;
  microchipId?: string;
  medicalNotes?: string;
  vetInfo?: VetInfo[]; // 配列に変更
}

// 共有メンバーのデータ型定義
export interface Member {
  id: string;
  role: 'owner' | 'general' | 'viewer';
  inviteEmail?: string; // 招待時のメールアドレス
  status?: 'pending' | 'active' | 'removed' | 'declined';
  uid?: string; // For querying
}

// 保留中の招待データ型定義
export interface PendingInvitation {
  pet: Pet;
  memberId: string;
}

export const usePets = () => {
  const { user } = useAuth(); // ログインユーザーを取得
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. ペット情報を購読
  useEffect(() => {
    if (!user) {
      setPets([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query 1: For old data structure with ownerIds
    const ownerIdsQuery = query(collection(db, 'dogs'), where('ownerIds', 'array-contains', user.uid));

    // Query 2: For new data structure with members subcollection
    const membersQuery = query(collectionGroup(db, 'members'), where('uid', '==', user.uid), where('status', '==', 'active'));

    const unsubscribeOwnerIds = onSnapshot(ownerIdsQuery, (snapshot) => {
      const ownerIdsPets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet));
      updatePets(ownerIdsPets, 'ownerIds');
    });

    const unsubscribeMembers = onSnapshot(membersQuery, async (snapshot) => {
      const memberPetsPromises = snapshot.docs.map(memberDoc => getDoc(memberDoc.ref.parent.parent!));
      const petDocs = await Promise.all(memberPetsPromises);
      const memberPets = petDocs.filter(doc => doc.exists()).map(doc => ({ id: doc.id, ...doc.data() } as Pet));
      updatePets(memberPets, 'members');
    });

    // Temporary state to hold results from different queries
    let petSources: { [key: string]: Pet[] } = {};

    const updatePets = (newPets: Pet[], source: 'ownerIds' | 'members') => {
      petSources[source] = newPets;
      const allPets = Object.values(petSources).flat();
      const uniquePets = Array.from(new Map(allPets.map(p => [p.id, p])).values());
      setPets(uniquePets);
      setLoading(false);
    };

    return () => {
      unsubscribeOwnerIds();
      unsubscribeMembers();
    };
  }, [user]);


  // 新しいペットを追加する関数
  const addPet = async (petData: Omit<Pet, 'id' | 'ownerIds'>) => {
    if (!user) {
      alert('ログインが必要です。');
      return;
    }
    try {
      // 1. Create the main dog document
      const newPetRef = await addDoc(collection(db, 'dogs'), {
        ...petData,
        // ownerIds is no longer added
        createdAt: serverTimestamp(),
      });

      // 2. Create the owner in the members subcollection
      const memberDocRef = doc(db, 'dogs', newPetRef.id, 'members', user.uid);
      await setDoc(memberDocRef, {
        uid: user.uid,
        role: 'owner',
        status: 'active',
        invitedAt: serverTimestamp(), // Using as joinedAt
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
  const updatePet = async (petId: string, petData: Partial<Omit<Pet, 'id' | 'ownerIds'>>) => {
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
  const getSharedMembers = useCallback((petId: string, onMembersUpdate: (members: Member[]) => void) => {
    if (!user) {
      onMembersUpdate([]);
      return () => {};
    }
    const membersCollection = collection(db, 'dogs', petId, 'members');
    const unsubscribe = onSnapshot(membersCollection, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Member, 'id'>),
      }));
      onMembersUpdate(members);
    }, (error) => {
      console.error('共有メンバーの取得に失敗しました:', error);
      onMembersUpdate([]);
    });
    return unsubscribe;
  }, [user]);

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

  // 保留中の招待を取得する関数
  const getPendingInvitations = useCallback((onInvitationsUpdate: (invitations: PendingInvitation[]) => void) => {
    if (!user || !user.email) {
      onInvitationsUpdate([]);
      return () => {};
    }
    const q = query(
      collectionGroup(db, 'members'),
      where('inviteEmail', '==', user.email),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const invitations = await Promise.all(snapshot.docs.map(async (memberDoc) => {
        const petDocRef = memberDoc.ref.parent.parent;
        if (!petDocRef) return null;
        const petDoc = await getDoc(petDocRef);
        if (!petDoc.exists()) return null;
        return {
          pet: { id: petDoc.id, ...petDoc.data() } as Pet,
          memberId: memberDoc.id,
        };
      }));
      onInvitationsUpdate(invitations.filter(inv => inv !== null) as PendingInvitation[]);
    }, (error) => {
      console.error("保留中の招待の取得に失敗しました:", error);
      onInvitationsUpdate([]);
    });
    return unsubscribe;
  }, [user]);

  // 招待のステータスを更新する関数
  const updateInvitationStatus = useCallback(async (petId: string, memberId: string, newStatus: 'active' | 'declined' | 'removed') => {
    if (!user) {
      throw new Error('ログインが必要です。');
    }
    try {
      const memberDocRef = doc(db, 'dogs', petId, 'members', memberId);
      await updateDoc(memberDocRef, { status: newStatus });
    } catch (error) {
      console.error('招待ステータスの更新に失敗しました:', error);
      throw new Error('招待ステータスの更新に失敗しました。');
    }
  }, [user]);

  // 共有メンバーを削除する関数
  const removeMember = useCallback(async (petId: string, memberId: string) => {
    if (!user) {
      throw new Error('ログインが必要です。');
    }
    try {
      const memberDocRef = doc(db, 'dogs', petId, 'members', memberId);
      await deleteDoc(memberDocRef);
    } catch (error) {
      console.error('メンバーの削除に失敗しました:', error);
      throw new Error('メンバーの削除に失敗しました。');
    }
  }, [user]);

  return { pets, loading, addPet, deletePet, updatePet, getSharedMembers, inviteMember, getPendingInvitations, updateInvitationStatus, removeMember };
};