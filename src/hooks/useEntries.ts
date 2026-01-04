'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, limit as firestoreLimit, startAfter, getDocs, QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Entry, TimeType } from '@/lib/types';

const PAGE_SIZE = 20;

export function useEntries(petId: string | null) {
    const { user } = useAuth();
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

    useEffect(() => {
        if (!petId || !user) {
            setEntries([]);
            setLoading(false);
            setHasMore(true);
            return;
        }

        // リアルタイム更新は最初のページのみ
        const entriesQuery = query(
            collection(db, 'pets', petId, 'entries'),
            orderBy('date', 'desc'),
            firestoreLimit(PAGE_SIZE)
        );

        const unsubscribe = onSnapshot(entriesQuery, (snapshot) => {
            const entriesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Entry[];
            setEntries(entriesData);
            setLoading(false);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
            lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
        });

        return () => unsubscribe();
    }, [petId, user]);

    const loadMore = useCallback(async () => {
        if (!petId || !lastDocRef.current || loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const nextQuery = query(
                collection(db, 'pets', petId, 'entries'),
                orderBy('date', 'desc'),
                startAfter(lastDocRef.current),
                firestoreLimit(PAGE_SIZE)
            );

            const snapshot = await getDocs(nextQuery);
            const newEntries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Entry[];

            setEntries((prev) => {
                // 重複を除外
                const existingIds = new Set(prev.map((e) => e.id));
                const uniqueNewEntries = newEntries.filter((e) => !existingIds.has(e.id));
                return [...prev, ...uniqueNewEntries];
            });

            setHasMore(snapshot.docs.length === PAGE_SIZE);
            lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
        } finally {
            setLoadingMore(false);
        }
    }, [petId, loadingMore, hasMore]);

    const addEntry = useCallback(async (entryData: {
        type: 'diary' | 'schedule';
        timeType?: TimeType;
        title?: string;
        body?: string;
        tags: string[];
        imageUrls: string[];
        date: Date;
        endDate?: Date;
        isCompleted?: boolean;
    }) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const docData: Record<string, unknown> = {
            type: entryData.type,
            timeType: entryData.timeType || 'point',
            tags: entryData.tags,
            imageUrls: entryData.imageUrls,
            date: Timestamp.fromDate(entryData.date),
            createdBy: user.uid,
            updatedBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        if (entryData.title) docData.title = entryData.title;
        if (entryData.body) docData.body = entryData.body;
        if (entryData.endDate) docData.endDate = Timestamp.fromDate(entryData.endDate);
        if (entryData.isCompleted !== undefined) docData.isCompleted = entryData.isCompleted;

        await addDoc(collection(db, 'pets', petId, 'entries'), docData);
    }, [petId, user]);

    const updateEntry = useCallback(async (entryId: string, entryData: Partial<{
        type: 'diary' | 'schedule';
        timeType: TimeType;
        title?: string;
        body?: string;
        tags: string[];
        imageUrls: string[];
        date: Date;
        endDate?: Date;
        isCompleted?: boolean;
    }>) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const updateData: Record<string, unknown> = {
            updatedBy: user.uid,
            updatedAt: serverTimestamp()
        };
        if (entryData.type !== undefined) updateData.type = entryData.type;
        if (entryData.timeType !== undefined) updateData.timeType = entryData.timeType;
        if (entryData.title !== undefined) updateData.title = entryData.title;
        if (entryData.body !== undefined) updateData.body = entryData.body;
        if (entryData.tags !== undefined) updateData.tags = entryData.tags;
        if (entryData.imageUrls !== undefined) updateData.imageUrls = entryData.imageUrls;
        if (entryData.date !== undefined) updateData.date = Timestamp.fromDate(entryData.date);
        if (entryData.endDate !== undefined) updateData.endDate = Timestamp.fromDate(entryData.endDate);
        if (entryData.isCompleted !== undefined) updateData.isCompleted = entryData.isCompleted;

        const entryRef = doc(db, 'pets', petId, 'entries', entryId);
        await updateDoc(entryRef, updateData);
    }, [petId, user]);

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

    const getScheduleEntries = useCallback(() => {
        return entries.filter((entry) => entry.type === 'schedule' && !entry.isCompleted);
    }, [entries]);

    const getTodaySchedules = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return entries.filter((entry) => {
            if (entry.type !== 'schedule') return false;
            const entryDate = entry.date.toDate();
            return entryDate >= today && entryDate < tomorrow;
        });
    }, [entries]);

    return {
        entries,
        loading,
        hasMore,
        loadingMore,
        loadMore,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntriesByDate,
        getEntriesByDateRange,
        getScheduleEntries,
        getTodaySchedules,
    };
}
