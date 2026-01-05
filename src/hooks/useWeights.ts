'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Weight } from '@/lib/types';

export function useWeights(petId: string | null) {
    const { user } = useAuth();
    const [weights, setWeights] = useState<Weight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!petId || !user) {
            setWeights([]);
            setLoading(false);
            return;
        }

        const weightsQuery = query(collection(db, 'pets', petId, 'weights'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(weightsQuery, (snapshot) => {
            const weightsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Weight[];
            // クライアントサイドでソート（同じ日付の場合は作成順）
            weightsData.sort((a, b) => {
                const dateDiff = b.date.toMillis() - a.date.toMillis();
                if (dateDiff !== 0) return dateDiff;
                // 日付が同じ場合は作成日時で降順（新しいものが上）
                // createdAtがない古いデータに対応
                const aTime = a.createdAt?.toMillis() ?? 0;
                const bTime = b.createdAt?.toMillis() ?? 0;
                return bTime - aTime;
            });
            setWeights(weightsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [petId, user]);

    const addWeight = useCallback(async (weightData: { value: number; unit: 'kg' | 'g'; date: Date }) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        await addDoc(collection(db, 'pets', petId, 'weights'), {
            ...weightData,
            date: Timestamp.fromDate(weightData.date),
            createdBy: user.uid,
            updatedBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }, [petId, user]);

    const updateWeight = useCallback(async (weightId: string, weightData: Partial<{ value: number; unit: 'kg' | 'g'; date: Date }>) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const updateData: Record<string, unknown> = {
            ...weightData,
            updatedBy: user.uid,
            updatedAt: serverTimestamp()
        };
        if (weightData.date) updateData.date = Timestamp.fromDate(weightData.date);

        const weightRef = doc(db, 'pets', petId, 'weights', weightId);
        await updateDoc(weightRef, updateData);
    }, [petId, user]);

    const deleteWeight = useCallback(async (weightId: string) => {
        if (!petId) throw new Error('ペットが選択されていません');

        const weightRef = doc(db, 'pets', petId, 'weights', weightId);
        await deleteDoc(weightRef);
    }, [petId]);

    return { weights, loading, addWeight, updateWeight, deleteWeight };
}
