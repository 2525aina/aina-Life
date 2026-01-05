'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection, query, onSnapshot, setDoc, doc, serverTimestamp, Timestamp, getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Weight, YearlyWeights, WeightItem } from '@/lib/types';

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

        // 年次集約データを取得（全期間）
        const weightsQuery = query(collection(db, 'pets', petId, 'weight_years'));

        const unsubscribe = onSnapshot(weightsQuery, (snapshot) => {
            let allWeights: Weight[] = [];

            snapshot.docs.forEach((docSnapshot) => {
                const data = docSnapshot.data() as YearlyWeights;
                if (data.weights && Array.isArray(data.weights)) {
                    // WeightItem[] -> Weight[] 変換
                    const yearWeights = data.weights.map(item => ({
                        id: item.id,
                        value: item.value,
                        unit: item.unit,
                        date: item.date,
                        createdAt: item.createdAt || item.date,
                        createdBy: user.uid, // 集約なのでDocの作成者を使用すべきだが簡略化
                        updatedBy: user.uid,
                        updatedAt: data.updatedAt,
                    } as Weight));
                    allWeights = [...allWeights, ...yearWeights];
                }
            });

            // ソート
            allWeights.sort((a, b) => {
                return b.date.toMillis() - a.date.toMillis();
            });

            setWeights(allWeights);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [petId, user]);

    const addWeight = useCallback(async (weightData: { value: number; unit: 'kg' | 'g'; date: Date }) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const year = weightData.date.getFullYear();
        const yearDocRef = doc(db, 'pets', petId, 'weight_years', year.toString());

        // 新しいID生成
        const newId = crypto.randomUUID();
        const now = Timestamp.now();

        const newItem: WeightItem = {
            id: newId,
            value: weightData.value,
            unit: weightData.unit,
            date: Timestamp.fromDate(weightData.date),
            createdAt: now,
        };

        const docSnap = await getDoc(yearDocRef);

        let currentWeights: WeightItem[] = [];
        if (docSnap.exists()) {
            const data = docSnap.data() as YearlyWeights;
            currentWeights = data.weights || [];
        }

        const newWeights = [...currentWeights, newItem];
        newWeights.sort((a, b) => b.date.toMillis() - a.date.toMillis());

        await setDoc(yearDocRef, {
            id: year.toString(),
            year: year,
            weights: newWeights,
            createdAt: docSnap.exists() ? (docSnap.data() as YearlyWeights).createdAt : serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: docSnap.exists() ? (docSnap.data() as YearlyWeights).createdBy : user.uid,
            updatedBy: user.uid,
        }, { merge: true });

    }, [petId, user]);

    // Moved deleteWeight BEFORE updateWeight to fix hoisting issue
    const deleteWeight = useCallback(async (weightId: string) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const target = weights.find(w => w.id === weightId);
        if (!target) return;

        const year = target.date.toDate().getFullYear();
        const yearDocRef = doc(db, 'pets', petId, 'weight_years', year.toString());

        const docSnap = await getDoc(yearDocRef);
        if (!docSnap.exists()) return;

        const data = docSnap.data() as YearlyWeights;
        const currentWeights = data.weights || [];

        const newWeights = currentWeights.filter(w => w.id !== weightId);

        await setDoc(yearDocRef, {
            weights: newWeights,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
        }, { merge: true });

    }, [petId, user, weights]);

    const updateWeight = useCallback(async (weightId: string, weightData: Partial<{ value: number; unit: 'kg' | 'g'; date: Date }>) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const targetOld = weights.find(w => w.id === weightId);
        if (!targetOld) throw new Error('データが見つかりません');

        const oldYear = targetOld.date.toDate().getFullYear();
        const newYear = weightData.date ? weightData.date.getFullYear() : oldYear;

        if (oldYear !== newYear) {
            await deleteWeight(weightId);
            await addWeight({
                value: weightData.value ?? targetOld.value,
                unit: weightData.unit ?? targetOld.unit,
                date: weightData.date!,
            });
            return;
        }

        const yearDocRef = doc(db, 'pets', petId, 'weight_years', oldYear.toString());
        const docSnap = await getDoc(yearDocRef);
        if (!docSnap.exists()) return;

        const data = docSnap.data() as YearlyWeights;
        const currentWeights = data.weights || [];

        const newWeights = currentWeights.map(item => {
            if (item.id === weightId) {
                return {
                    ...item,
                    value: weightData.value ?? item.value,
                    unit: weightData.unit ?? item.unit,
                    date: weightData.date ? Timestamp.fromDate(weightData.date) : item.date,
                };
            }
            return item;
        });

        newWeights.sort((a, b) => b.date.toMillis() - a.date.toMillis());

        await setDoc(yearDocRef, {
            weights: newWeights,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
        }, { merge: true });

    }, [petId, user, weights, deleteWeight, addWeight]);

    return { weights, loading, addWeight, updateWeight, deleteWeight };
}
