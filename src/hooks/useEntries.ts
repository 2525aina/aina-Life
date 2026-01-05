'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, limit as firestoreLimit, startAfter, getDocs, QueryDocumentSnapshot, getDoc, setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Entry, TimeType, EntrySummary, MonthlyEntries } from '@/lib/types';
import { format } from 'date-fns';

const PAGE_SIZE = 20;

// Helper to get YYYY-MM document ID
const getMonthId = (date: Date) => format(date, 'yyyy-MM');

export function useCalendarEntries(petId: string | null, currentMonth: Date) {
    const { user } = useAuth();
    const [entries, setEntries] = useState<EntrySummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!petId || !user) {
            setEntries([]);
            setLoading(false);
            return;
        }

        const monthId = getMonthId(currentMonth);
        const docRef = doc(db, 'pets', petId, 'entry_months', monthId);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as MonthlyEntries;
                // 日付順にソート（クライアントサイド）
                const sorted = (data.entries || []).sort((a, b) => b.date.toMillis() - a.date.toMillis());
                setEntries(sorted);
            } else {
                setEntries([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [petId, user, currentMonth]);

    return { entries, loading };
}

export function useEntries(petId: string | null) {
    const { user } = useAuth();
    // Pagination logic remains same for List View
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

    // Initial Load (Pagination)
    useEffect(() => {
        if (!petId || !user) {
            setEntries([]);
            setLoading(false);
            setHasMore(true);
            return;
        }

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

    // Update Monthly Summary Helper
    const updateMonthlySummary = async (
        type: 'add' | 'update' | 'delete',
        entryData: Partial<Entry> & { id: string; date: Timestamp },
        oldDate?: Timestamp
    ) => {
        if (!petId) return;

        const processUpdate = async (targetDate: Date, action: 'add' | 'remove' | 'update', data?: EntrySummary) => {
            const monthId = getMonthId(targetDate);
            const monthRef = doc(db, 'pets', petId, 'entry_months', monthId);
            const monthSnap = await getDoc(monthRef);

            let currentEntries: EntrySummary[] = monthSnap.exists()
                ? (monthSnap.data() as MonthlyEntries).entries
                : [];

            if (action === 'add' && data) {
                currentEntries.push(data);
            } else if (action === 'remove') {
                currentEntries = currentEntries.filter(e => e.id !== entryData.id);
            } else if (action === 'update' && data) {
                currentEntries = currentEntries.map(e => e.id === entryData.id ? data : e);
            }

            // Clean up empty months or update
            if (currentEntries.length === 0 && monthSnap.exists()) {
                await setDoc(monthRef, { entries: [] }, { merge: true }); // Keep doc empty or delete? Keep empty simpler.
            } else {
                await setDoc(monthRef, {
                    id: monthId,
                    entries: currentEntries
                }, { merge: true });
            }
        };

        const newDate = entryData.date.toDate();
        const summary: EntrySummary = {
            id: entryData.id,
            date: entryData.date,
            endDate: entryData.endDate,
            title: entryData.title,
            body: entryData.body,
            type: entryData.type as any, // Cast for safety if partial
            timeType: entryData.timeType as any,
            tags: entryData.tags || [],
            firstImageUrl: entryData.imageUrls?.[0],
            isCompleted: entryData.isCompleted
        };

        if (type === 'add') {
            await processUpdate(newDate, 'add', summary);
        } else if (type === 'delete') {
            await processUpdate(newDate, 'remove');
        } else if (type === 'update') {
            const oldDateObj = oldDate?.toDate();
            // If date changed month, remove from old, add to new
            if (oldDateObj && getMonthId(oldDateObj) !== getMonthId(newDate)) {
                await processUpdate(oldDateObj, 'remove');
                await processUpdate(newDate, 'add', summary);
            } else {
                await processUpdate(newDate, 'update', summary);
            }
        }
    };


    const addEntry = useCallback(async (entryData: {
        type: 'diary' | 'schedule';
        timeType?: TimeType;
        title?: string;
        body?: string;
        tags: string[];
        imageUrls: string[];
        friendIds?: string[];
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
        if (entryData.friendIds) docData.friendIds = entryData.friendIds;
        if (entryData.endDate) docData.endDate = Timestamp.fromDate(entryData.endDate);
        if (entryData.isCompleted !== undefined) docData.isCompleted = entryData.isCompleted;

        const docRef = await addDoc(collection(db, 'pets', petId, 'entries'), docData);

        // Update Summary
        await updateMonthlySummary('add', {
            id: docRef.id,
            ...entryData,
            date: Timestamp.fromDate(entryData.date),
            endDate: entryData.endDate ? Timestamp.fromDate(entryData.endDate) : undefined,
        } as any);

    }, [petId, user]);

    const updateEntry = useCallback(async (entryId: string, entryData: Partial<{
        type: 'diary' | 'schedule';
        timeType: TimeType;
        title?: string;
        body?: string;
        tags: string[];
        imageUrls: string[];
        friendIds?: string[];
        date: Date;
        endDate?: Date;
        isCompleted?: boolean;
    }>) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        // Need old data to check date change
        const oldEntryDoc = await getDoc(doc(db, 'pets', petId, 'entries', entryId));
        if (!oldEntryDoc.exists()) throw new Error('Entry not found');
        const oldData = oldEntryDoc.data() as Entry;

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
        if (entryData.friendIds !== undefined) updateData.friendIds = entryData.friendIds;
        if (entryData.date !== undefined) updateData.date = Timestamp.fromDate(entryData.date);
        if (entryData.endDate !== undefined) updateData.endDate = Timestamp.fromDate(entryData.endDate);
        if (entryData.isCompleted !== undefined) updateData.isCompleted = entryData.isCompleted;

        const entryRef = doc(db, 'pets', petId, 'entries', entryId);
        await updateDoc(entryRef, updateData);

        // Update Summary
        // Merge old data with new data for complete summary object
        const mergedData = {
            ...oldData,
            ...entryData,
            id: entryId,
            date: entryData.date ? Timestamp.fromDate(entryData.date) : oldData.date,
            endDate: entryData.endDate ? Timestamp.fromDate(entryData.endDate) : (oldData.endDate || undefined)
        };

        await updateMonthlySummary('update', mergedData, oldData.date);

    }, [petId, user]);

    const deleteEntry = useCallback(async (entryId: string) => {
        if (!petId) throw new Error('ペットが選択されていません');

        // Need data to find month
        const oldEntryDoc = await getDoc(doc(db, 'pets', petId, 'entries', entryId));
        if (!oldEntryDoc.exists()) return; // Already deleted
        const oldData = oldEntryDoc.data() as Entry;

        const entryRef = doc(db, 'pets', petId, 'entries', entryId);
        await deleteDoc(entryRef);

        // Update Summary
        await updateMonthlySummary('delete', { id: entryId, date: oldData.date });

    }, [petId]);

    // Keep these helpers for list view if necessary, but Calendar should use useCalendarEntries
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
            // ここでだけ entries state を使うと、リスト表示されていないデータ（ページネーション外）が取れない可能性がある。
            // 本来は今日の予定用の専用フックを作るか、ここでも Firestore クエリを投げるべきだが
            // いったん既存ロジック維持（ただしページネーションされているので不正確なリスクあり）
            // ※カレンダー改修がメインなので今回はスコープ外とする
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
