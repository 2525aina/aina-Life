'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, collectionGroup,
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

        const membersQuery = query(
            collectionGroup(db, 'members'),
            where('userId', '==', user.uid),
            where('status', '==', 'active')
        );

        const unsubscribe = onSnapshot(membersQuery, async (snapshot) => {
            const petIds = snapshot.docs.map((doc) => doc.ref.parent.parent?.id).filter(Boolean) as string[];

            if (petIds.length === 0) {
                setPets([]);
                setLoading(false);
                return;
            }

            const petUnsubscribes = petIds.map((petId) => {
                const petRef = doc(db, 'pets', petId);
                return onSnapshot(petRef, (petSnap) => {
                    if (petSnap.exists()) {
                        const petData = { id: petSnap.id, ...petSnap.data() } as Pet;
                        setPets((prev) => {
                            const index = prev.findIndex((p) => p.id === petId);
                            if (index >= 0) {
                                const updated = [...prev];
                                updated[index] = petData;
                                return updated;
                            }
                            return [...prev, petData];
                        });
                    } else {
                        setPets((prev) => prev.filter((p) => p.id !== petId));
                    }
                });
            });

            setLoading(false);
            return () => petUnsubscribes.forEach((unsub) => unsub());
        });

        return () => unsubscribe();
    }, [user]);

    const addPet = useCallback(async (petData: Omit<Pet, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
        if (!user) throw new Error('認証が必要です');

        const petRef = await addDoc(collection(db, 'pets'), {
            ...petData,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, 'pets', petRef.id, 'members'), {
            userId: user.uid,
            role: 'owner',
            status: 'active',
            inviteEmail: user.email?.toLowerCase() || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return petRef.id;
    }, [user]);

    const updatePet = useCallback(async (petId: string, petData: Partial<Omit<Pet, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>) => {
        const petRef = doc(db, 'pets', petId);
        await updateDoc(petRef, { ...petData, updatedAt: serverTimestamp() });
    }, []);

    const deletePet = useCallback(async (petId: string) => {
        const petRef = doc(db, 'pets', petId);
        await deleteDoc(petRef);
    }, []);

    return { pets, loading, addPet, updatePet, deletePet };
}
