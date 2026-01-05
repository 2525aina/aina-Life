'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Friend, FriendSortOption } from '@/lib/types';

export function useFriends(petId: string | null) {
    const { user } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOption, setSortOption] = useState<FriendSortOption>('metAt_desc');

    useEffect(() => {
        if (!petId || !user) {
            setFriends([]);
            setLoading(false);
            return;
        }

        const friendsQuery = query(collection(db, 'pets', petId, 'friends'));

        const unsubscribe = onSnapshot(friendsQuery, (snapshot) => {
            const friendsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Friend[];
            setFriends(friendsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [petId, user]);

    // Client-side sorting because we might want dynamic sorting without re-fetching
    const sortedFriends = [...friends].sort((a, b) => {
        if (sortOption === 'metAt_desc') {
            return b.metAt.toMillis() - a.metAt.toMillis();
        } else if (sortOption === 'metAt_asc') {
            return a.metAt.toMillis() - b.metAt.toMillis();
        } else if (sortOption === 'name_asc') {
            return a.name.localeCompare(b.name, 'ja');
        }
        return 0;
    });

    const addFriend = useCallback(async (friendData: Omit<Friend, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'metAt'> & { metAt: Date }) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const docData = {
            ...friendData,
            metAt: Timestamp.fromDate(friendData.metAt),
            createdBy: user.uid,
            updatedBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'pets', petId, 'friends'), docData);
    }, [petId, user]);

    const updateFriend = useCallback(async (friendId: string, friendData: Partial<Omit<Friend, 'metAt'>> & { metAt?: Date }) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const updateData: Record<string, unknown> = {
            ...friendData,
            updatedBy: user.uid,
            updatedAt: serverTimestamp()
        };
        if (friendData.metAt) {
            updateData.metAt = Timestamp.fromDate(friendData.metAt);
        }

        const friendRef = doc(db, 'pets', petId, 'friends', friendId);
        await updateDoc(friendRef, updateData);
    }, [petId, user]);

    const deleteFriend = useCallback(async (friendId: string) => {
        if (!petId) throw new Error('ペットが選択されていません');

        const friendRef = doc(db, 'pets', petId, 'friends', friendId);
        await deleteDoc(friendRef);
    }, [petId]);

    return {
        friends: sortedFriends,
        loading,
        sortOption,
        setSortOption,
        addFriend,
        updateFriend,
        deleteFriend
    };
}

export function useFriend(petId: string | null, friendId: string) {
    const { user } = useAuth();
    const [friend, setFriend] = useState<Friend | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!petId || !user || !friendId) {
            setLoading(false);
            return;
        }

        const friendRef = doc(db, 'pets', petId, 'friends', friendId);
        const unsubscribe = onSnapshot(friendRef, (docSnap) => {
            if (docSnap.exists()) {
                setFriend({ id: docSnap.id, ...docSnap.data() } as Friend);
            } else {
                setFriend(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [petId, user, friendId]);

    return { friend, loading };
}
