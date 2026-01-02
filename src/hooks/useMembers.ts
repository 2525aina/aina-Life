'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Member } from '@/lib/types';

export function useMembers(petId: string | null) {
    const { user } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'member' | null>(null);

    useEffect(() => {
        if (!petId || !user) {
            setMembers([]);
            setLoading(false);
            return;
        }

        const membersQuery = query(collection(db, 'pets', petId, 'members'));
        const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
            const membersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Member[];
            setMembers(membersData);

            // 現在のユーザーのロールを取得
            const currentMember = membersData.find((m) => m.userId === user.uid);
            setCurrentUserRole(currentMember?.role || null);

            setLoading(false);
        });

        return () => unsubscribe();
    }, [petId, user]);

    // メンバーを招待（メールアドレスで）
    const inviteMember = useCallback(async (email: string) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');
        if (currentUserRole !== 'owner') throw new Error('オーナーのみ招待できます');

        // 既に招待済みか確認
        const existingQuery = query(
            collection(db, 'pets', petId, 'members'),
            where('inviteEmail', '==', email.toLowerCase())
        );
        const existingSnap = await getDocs(existingQuery);
        if (!existingSnap.empty) {
            throw new Error('このメールアドレスは既に招待済みです');
        }

        await addDoc(collection(db, 'pets', petId, 'members'), {
            userId: '', // 承諾時に設定
            inviteEmail: email.toLowerCase(),
            role: 'member',
            status: 'pending',
            invitedBy: user.uid,
            createdAt: serverTimestamp(),
        });
    }, [petId, user, currentUserRole]);

    // 招待を承諾
    const acceptInvitation = useCallback(async (memberId: string) => {
        if (!petId || !user) throw new Error('エラーが発生しました');

        const memberRef = doc(db, 'pets', petId, 'members', memberId);
        await updateDoc(memberRef, {
            userId: user.uid,
            status: 'active',
        });
    }, [petId, user]);

    // 招待を辞退
    const declineInvitation = useCallback(async (memberId: string) => {
        if (!petId) throw new Error('エラーが発生しました');

        const memberRef = doc(db, 'pets', petId, 'members', memberId);
        await deleteDoc(memberRef);
    }, [petId]);

    // メンバーを削除
    const removeMember = useCallback(async (memberId: string) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');
        if (currentUserRole !== 'owner') throw new Error('オーナーのみ削除できます');

        const member = members.find((m) => m.id === memberId);
        if (member?.role === 'owner') {
            throw new Error('オーナーは削除できません');
        }

        const memberRef = doc(db, 'pets', petId, 'members', memberId);
        await deleteDoc(memberRef);
    }, [petId, user, currentUserRole, members]);

    // 自分が脱退
    const leaveTeam = useCallback(async () => {
        if (!petId || !user) throw new Error('エラーが発生しました');
        if (currentUserRole === 'owner') throw new Error('オーナーは脱退できません');

        const currentMember = members.find((m) => m.userId === user.uid);
        if (!currentMember) throw new Error('メンバーが見つかりません');

        const memberRef = doc(db, 'pets', petId, 'members', currentMember.id);
        await deleteDoc(memberRef);
    }, [petId, user, currentUserRole, members]);

    return {
        members,
        loading,
        currentUserRole,
        isOwner: currentUserRole === 'owner',
        inviteMember,
        acceptInvitation,
        declineInvitation,
        removeMember,
        leaveTeam,
    };
}
