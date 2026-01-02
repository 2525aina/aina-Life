'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Entry, EntryTag } from '@/lib/types';

export function useEntries(petId: string | null) {
    const { user } = useAuth();
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!petId || !user) {
            setEntries([]);
            setLoading(false);
            return;
        }

        const entriesQuery = query(collection(db, 'pets', petId, 'entries'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(entriesQuery, (snapshot) => {
            const entriesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Entry[];
            setEntries(entriesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [petId, user]);

    const addEntry = useCallback(async (entryData: {
        type: 'diary' | 'schedule';
        title?: string;
        body?: string;
        tags: EntryTag[];
        imageUrls: string[];
        date: Date;
        friendIds?: string[];
    }) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        await addDoc(collection(db, 'pets', petId, 'entries'), {
            ...entryData,
            date: Timestamp.fromDate(entryData.date),
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }, [petId, user]);

    const updateEntry = useCallback(async (entryId: string, entryData: Partial<{
        type: 'diary' | 'schedule';
        title?: string;
        body?: string;
        tags: EntryTag[];
        imageUrls: string[];
        date: Date;
        friendIds?: string[];
    }>) => {
        if (!petId) throw new Error('ペットが選択されていません');

        const updateData: Record<string, unknown> = { ...entryData, updatedAt: serverTimestamp() };
        if (entryData.date) updateData.date = Timestamp.fromDate(entryData.date);

        const entryRef = doc(db, 'pets', petId, 'entries', entryId);
        await updateDoc(entryRef, updateData);
    }, [petId]);

    const deleteEntry = useCallback(async (entryId: string) => {
        if (!petId) throw new Error('ペットが選択されていません');

        const entryRef = doc(db, 'pets', petId, 'entries', entryId);
        await deleteDoc(entryRef);
    }, [petId]);

    const getEntriesByDateRange = useCallback((startDate: Date, endDate: Date) => {
        return entries.filter((entry) => {
            const entryDate = entry.date.toDate();
            return entryDate >= startDate && entryDate <= endDate;
        });
    }, [entries]);

    const getEntriesByDate = useCallback((date: Date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return getEntriesByDateRange(startOfDay, endOfDay);
    }, [getEntriesByDateRange]);

    return { entries, loading, addEntry, updateEntry, deleteEntry, getEntriesByDate, getEntriesByDateRange };
}
