'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Pet, Member } from '@/lib/types';

interface PendingInvitation {
    pet: Pet;
    member: Member;
}

export function usePendingInvitations() {
    const { user } = useAuth();
    const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.email) {
            setInvitations([]);
            setLoading(false);
            return;
        }

        // 自分宛の保留中の招待を取得
        const invitationsQuery = query(
            collectionGroup(db, 'members'),
            where('inviteEmail', '==', user.email.toLowerCase()),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(invitationsQuery, async (snapshot) => {
            const pendingInvitations: PendingInvitation[] = [];

            for (const docSnap of snapshot.docs) {
                const member = { id: docSnap.id, ...docSnap.data() } as Member;
                const petRef = docSnap.ref.parent.parent;

                if (petRef) {
                    // ペット情報を取得するためにリスナーを設定
                    const petId = petRef.id;
                    const petDocSnap = await import('firebase/firestore').then(({ getDoc, doc }) =>
                        getDoc(doc(db, 'pets', petId))
                    );

                    if (petDocSnap.exists()) {
                        pendingInvitations.push({
                            pet: { id: petDocSnap.id, ...petDocSnap.data() } as Pet,
                            member,
                        });
                    }
                }
            }

            setInvitations(pendingInvitations);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { invitations, loading };
}
