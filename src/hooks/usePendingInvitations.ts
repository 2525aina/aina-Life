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

        const unsubscribe = onSnapshot(invitationsQuery, (snapshot) => {
            const pendingInvitations: PendingInvitation[] = [];

            snapshot.docs.forEach((docSnap) => {
                const member = { id: docSnap.id, ...docSnap.data() } as Member;
                const petRef = docSnap.ref.parent.parent;

                if (petRef) {
                    pendingInvitations.push({
                        pet: {
                            id: petRef.id,
                            name: member.petName || '不明なペット',
                            avatarUrl: member.petAvatarUrl,
                            // 他の必須フィールドは適当に埋めるか、Partialにする
                            createdAt: member.createdAt,
                            updatedAt: member.updatedAt,
                            createdBy: '',
                            updatedBy: '',
                        } as Pet,
                        member,
                    });
                }
            });

            setInvitations(pendingInvitations);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { invitations, loading };
}
