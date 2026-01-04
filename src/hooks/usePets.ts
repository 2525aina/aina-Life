'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, collectionGroup, setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Pet } from '@/lib/types';

export function usePets() {
    const { user } = useAuth();
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setPets([]);
            setLoading(false);
            return;
        }

        let petUnsubscribes: (() => void)[] = [];

        const membersQuery = query(
            collectionGroup(db, 'members'),
            where('userId', '==', user.uid),
            where('status', '==', 'active')
        );

        const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
            // 既存のペットリスナーを解除
            petUnsubscribes.forEach(unsub => unsub());
            petUnsubscribes = [];

            const petIds = snapshot.docs.map((doc) => doc.ref.parent.parent?.id).filter(Boolean) as string[];
            const uniquePetIds = Array.from(new Set(petIds));

            if (uniquePetIds.length === 0) {
                setPets([]);
                setLoading(false);
                return;
            }

            // 新しいペットリストに基づいてStateを初期化（削除されたペットを除去）
            setPets(prev => prev.filter(p => uniquePetIds.includes(p.id)));

            // 各ペットのリスナーを設定
            uniquePetIds.forEach((petId) => {
                const petRef = doc(db, 'pets', petId);
                const unsub = onSnapshot(petRef, (petSnap) => {
                    if (petSnap.exists()) {
                        const petData = { id: petSnap.id, ...petSnap.data() } as Pet;
                        setPets((prev) => {
                            const index = prev.findIndex((p) => p.id === petId);
                            if (index >= 0) {
                                // 変更がない場合は更新しない（レンダリング最適化）
                                if (JSON.stringify(prev[index]) === JSON.stringify(petData)) return prev;
                                const updated = [...prev];
                                updated[index] = petData;
                                return updated;
                            }
                            return [...prev, petData];
                        });
                    } else {
                        // ペット自体が削除された場合
                        setPets((prev) => prev.filter((p) => p.id !== petId));
                    }
                }, (error) => {
                    console.error(`Error fetching pet ${petId}:`, error);
                    // 権限エラーなどで読めなくなった場合も削除
                    setPets((prev) => prev.filter((p) => p.id !== petId));
                });
                petUnsubscribes.push(unsub);
            });

            setLoading(false);
        });

        return () => {
            unsubscribeMembers();
            petUnsubscribes.forEach(unsub => unsub());
        };
    }, [user]);

    const addPet = useCallback(async (petData: Omit<Pet, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'memberUids'>) => {
        if (!user) throw new Error('認証が必要です');

        // 1. ペット作成 (memberUidsは不要)
        const petRef = await addDoc(collection(db, 'pets'), {
            ...petData,
            createdBy: user.uid,
            updatedBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        const memberData: any = {
            userId: user.uid,
            role: 'owner',
            status: 'active',
            inviteEmail: user.email?.toLowerCase() || '',
            invitedBy: user.uid,
            invitedAt: serverTimestamp(),
            updatedBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // 表示用（非正規化）
            petName: petData.name,
        };

        if (petData.avatarUrl) {
            memberData.petAvatarUrl = petData.avatarUrl;
        }

        // 2. メンバー作成 (IDをUIDにする)
        await setDoc(doc(db, 'pets', petRef.id, 'members', user.uid), memberData);

        return petRef.id;
    }, [user]);

    const updatePet = useCallback(async (petId: string, petData: Partial<Omit<Pet, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'memberUids'>>) => {
        if (!user) throw new Error('認証が必要です');
        const petRef = doc(db, 'pets', petId);
        await updateDoc(petRef, {
            ...petData,
            updatedBy: user.uid,
            updatedAt: serverTimestamp()
        });
    }, [user]);

    const deletePet = useCallback(async (petId: string) => {
        const petRef = doc(db, 'pets', petId);
        await deleteDoc(petRef);
    }, []);

    return { pets, loading, addPet, updatePet, deletePet };
}
