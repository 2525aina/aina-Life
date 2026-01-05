'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Entry } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

export function useEntry(petId: string | null, entryId: string | null) {
    const { user } = useAuth();
    const [entry, setEntry] = useState<Entry | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!petId || !entryId || !user) {
            setEntry(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const entryRef = doc(db, 'pets', petId, 'entries', entryId);

        const unsubscribe = onSnapshot(entryRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setEntry({ id: docSnap.id, ...docSnap.data() } as Entry);
                } else {
                    setEntry(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching entry:", err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [petId, entryId, user]);

    return { entry, loading, error };
}
