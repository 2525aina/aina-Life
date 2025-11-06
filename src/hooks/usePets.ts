'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  collectionGroup,
  getDoc,
  writeBatch,
  FieldValue,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Pet, Member, PendingInvitation } from '@/lib/types';

export const usePets = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const petListenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!user) {
      setPets([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    petListenersRef.current.forEach(unsubscribe => unsubscribe());
    petListenersRef.current = [];

    const membersQuery = query(
      collectionGroup(db, 'members'),
      where('uid', '==', user.uid),
      where('status', '==', 'active')
    );

    const unsubscribeMembers = onSnapshot(membersQuery, async (membersSnapshot) => {
      const petIds = membersSnapshot.docs.map(memberDoc => memberDoc.ref.parent.parent!.id);
      const uniquePetIds = Array.from(new Set(petIds));

      petListenersRef.current.forEach(unsubscribe => unsubscribe());
      petListenersRef.current = [];

      if (uniquePetIds.length === 0) {
        setPets([]);
        setLoading(false);
        return;
      }

      const currentPetsMap = new Map<string, Pet>();
      const initialFetches: Promise<void>[] = [];

      uniquePetIds.forEach(petId => {
        const petDocRef = doc(db, 'dogs', petId);
        const unsubscribePet = onSnapshot(petDocRef, (petSnapshot) => {
          if (petSnapshot.exists() && !petSnapshot.data()?.deleted) {
            currentPetsMap.set(petId, { id: petSnapshot.id, ...(petSnapshot.data() as Omit<Pet, 'id'>) });
          } else {
            currentPetsMap.delete(petId);
          }
          setPets(Array.from(currentPetsMap.values()));
        }, (error) => {
          console.error(`usePets: ペット ${petId} の取得に失敗しました:`, error);
          setPets(Array.from(currentPetsMap.values()));
        });
        petListenersRef.current.push(unsubscribePet);
        initialFetches.push(new Promise(resolve => {
          const tempUnsubscribe = onSnapshot(petDocRef, () => {
            tempUnsubscribe();
            resolve();
          });
        }));
      });

      await Promise.all(initialFetches);
      setLoading(false);

    }, (error) => {
      console.error('usePets: メンバーシップの取得に失敗しました:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeMembers();
      petListenersRef.current.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  const addPet = async (petData: Omit<Pet, 'id'>) => {
    if (!user) {
      toast.error('ログインが必要です。');
      return;
    }
    try {
      const newPetRef = await addDoc(collection(db, 'dogs'), {
        ...petData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'dogs', newPetRef.id, 'members'), {
        uid: user.uid,
        inviteEmail: user.email,
        role: 'owner',
        status: 'active',
        invitedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newPetRef.id;
    } catch (error) {
      console.error('ペットの追加に失敗しました:', error);
      toast.error('ペットの追加に失敗しました。');
    }
  };

  const updatePet = async (petId: string, petData: Partial<Omit<Pet, 'id'>>) => {
    if (!user) {
      toast.error('ログインが必要です。');
      return;
    }
    try {
      await updateDoc(doc(db, 'dogs', petId), {
        ...petData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('usePets: ペットの更新に失敗しました:', error);
      toast.error('ペットの更新に失敗しました。');
    }
  };

  const deletePet = async (petId: string) => {
    if (!user) {
      toast.error('ログインが必要です。');
      return;
    }
    try {
      const batch = writeBatch(db);
      const petRef = doc(db, 'dogs', petId);

      batch.update(petRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const tasksRef = collection(db, 'dogs', petId, 'tasks');
      const taskDocs = await getDocs(tasksRef);
      taskDocs.docs.forEach(d => {
        batch.update(d.ref, {
          deleted: true,
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      const logsRef = collection(db, 'dogs', petId, 'logs');
      const logDocs = await getDocs(logsRef);
      logDocs.docs.forEach(d => {
        batch.update(d.ref, {
          deleted: true,
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      toast.success('ペットと関連データが論理削除されました。');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error('usePets: ペットの論理削除に失敗しました:', errorMessage);
      toast.error('ペットの論理削除に失敗しました。');
    }
  };

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
    }, (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error('共有メンバーの取得に失敗しました:', errorMessage);
      onMembersUpdate([]);
    });
    return unsubscribe;
  }, [user]);

  const inviteMember = async (petId: string, email: string) => {
    if (!user) {
      toast.error('ログインが必要です。');
      throw new Error('ログインが必要です。');
    }
    try {
      const membersCollection = collection(db, 'dogs', petId, 'members');
      // TODO: 招待する前に、既にメンバーでないか、招待中でないかを確認する
      // TODO: 招待される側のUIDが不明なため、メールアドレスから検索し確認し、アプリユーザーであればそのUIDを使用し、アプリに存在しないユーザー場合は招待させないようにする
      await addDoc(membersCollection, {
        inviteEmail: email,
        invitedBy: user.uid,
        role: 'viewer',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        invitedAt: serverTimestamp(),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error('メンバーの招待に失敗しました:', errorMessage);
      toast.error('メンバーの招待に失敗しました。');
      throw new Error('メンバーの招待に失敗しました。');
    }
  };

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
    }, (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error("保留中の招待の取得に失敗しました:", errorMessage);
      onInvitationsUpdate([]);
    });
    return unsubscribe;
  }, [user]);

  const updateInvitationStatus = useCallback(async (petId: string, memberId: string, newStatus: 'active' | 'declined' | 'removed' | 'pending') => {
    if (!user) {
      toast.error('ログインが必要です。');
      throw new Error('ログインが必要です。');
    }
    try {
      const memberDocRef = doc(db, 'dogs', petId, 'members', memberId);
            const dataToUpdate: {
              status: 'active' | 'declined' | 'removed' | 'pending';
              updatedAt: FieldValue;
              uid?: string;
              inviteEmail?: null;
            } = {
              status: newStatus,
              updatedAt: serverTimestamp(),
            };
      if (newStatus === 'active') {
        dataToUpdate.uid = user.uid;
      }

      await updateDoc(memberDocRef, dataToUpdate);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error('招待ステータスの更新に失敗しました:', errorMessage);
      toast.error('招待ステータスの更新に失敗しました。');
      throw new Error('招待ステータスの更新に失敗しました。');
    }
  }, [user]);

  const removeMember = useCallback(async (petId: string, memberId: string) => {
    if (!user) {
      toast.error('ログインが必要です。');
      throw new Error('ログインが必要です。');
    }
    try {
      const memberDocRef = doc(db, 'dogs', petId, 'members', memberId);
      await deleteDoc(memberDocRef);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error('メンバーの削除に失敗しました:', errorMessage);
      toast.error('メンバーの削除に失敗しました。');
      throw new Error('メンバーの削除に失敗しました。');
    }
  }, [user]);

  const updateMemberRole = useCallback(async (petId: string, memberId: string, newRole: 'owner' | 'editor' | 'viewer') => {
    if (!user) {
      toast.error('ログインが必要です。');
      throw new Error('ログインが必要です。');
    }
    try {
      const memberDocRef = doc(db, 'dogs', petId, 'members', memberId);
      await updateDoc(memberDocRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      toast.success('メンバーの役割を更新しました。');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error('メンバーの役割の更新に失敗しました:', errorMessage);
      toast.error('メンバーの役割の更新に失敗しました。');
      throw new Error('メンバーの役割の更新に失敗しました。');
    }
  }, [user]);

  return { pets, loading, addPet, updatePet, deletePet, getSharedMembers, inviteMember, getPendingInvitations, updateInvitationStatus, removeMember, updateMemberRole };
};
