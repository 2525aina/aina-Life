'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Member, MemberRole } from '@/lib/types';

export function useMembers(petId: string | null) {
    const { user } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<MemberRole | null>(null);

    useEffect(() => {
        if (!petId || !user) {
            setMembers([]);
            setLoading(false);
            return;
        }

        const membersQuery = query(collection(db, 'pets', petId, 'members'));
        const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
            const membersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Member[];
            // removed/declined は除外して表示
            const activeMembers = membersData.filter((m) => m.status !== 'removed' && m.status !== 'declined');
            setMembers(activeMembers);

            // 現在のユーザーのロールを取得
            const currentMember = activeMembers.find((m) => m.userId === user.uid);
            setCurrentUserRole(currentMember?.role || null);

            setLoading(false);
        });

        return () => unsubscribe();
    }, [petId, user]);

    // メンバーを招待（メールアドレスで）
    const inviteMember = useCallback(async (email: string, role: MemberRole = 'editor') => {
        if (!petId || !user) throw new Error('ペットが選択されていません');
        if (currentUserRole !== 'owner') throw new Error('オーナーのみ招待できます');

        const emailLower = email.toLowerCase();

        // 既に招待済みか確認（pending または active のみ）
        const existingQuery = query(
            collection(db, 'pets', petId, 'members'),
            where('inviteEmail', '==', emailLower)
        );
        const existingSnap = await getDocs(existingQuery);
        const existingMember = existingSnap.docs.find((doc) => {
            const data = doc.data();
            return data.status === 'pending' || data.status === 'active';
        });
        if (existingMember) {
            throw new Error('このメールアドレスは既に招待済みまたはメンバーです');
        }

        await addDoc(collection(db, 'pets', petId, 'members'), {
            userId: '', // 承諾時に設定
            inviteEmail: emailLower,
            role: role,
            status: 'pending',
            invitedBy: user.uid,
            invitedAt: serverTimestamp(),
            updatedBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }, [petId, user, currentUserRole]);

    // 招待を承諾
    const acceptInvitation = useCallback(async (memberId: string) => {
        if (!petId || !user) throw new Error('エラーが発生しました');

        const memberRef = doc(db, 'pets', petId, 'members', memberId);
        await updateDoc(memberRef, {
            userId: user.uid,
            status: 'active',
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
        });
    }, [petId, user]);

    // 招待を辞退
    const declineInvitation = useCallback(async (memberId: string) => {
        if (!petId || !user) throw new Error('エラーが発生しました');

        const memberRef = doc(db, 'pets', petId, 'members', memberId);
        await updateDoc(memberRef, {
            status: 'declined',
            userId: user.uid,
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
        });
    }, [petId, user]);

    // メンバーの権限変更
    const updateMemberRole = useCallback(async (memberId: string, newRole: MemberRole) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');
        if (currentUserRole !== 'owner') throw new Error('オーナーのみ権限を変更できます');

        const member = members.find((m) => m.id === memberId);
        if (!member) throw new Error('メンバーが見つかりません');

        // 自分自身のオーナー権限を外す場合、他にオーナーがいるか確認
        if (member.userId === user.uid && member.role === 'owner' && newRole !== 'owner') {
            const otherOwners = members.filter((m) => m.role === 'owner' && m.id !== memberId);
            if (otherOwners.length === 0) {
                throw new Error('最低1人のオーナーが必要です。先に他のメンバーをオーナーに設定してください');
            }
        }

        const memberRef = doc(db, 'pets', petId, 'members', memberId);
        await updateDoc(memberRef, {
            role: newRole,
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
        });
    }, [petId, user, currentUserRole, members]);

    // オーナー権限の譲渡
    const transferOwnership = useCallback(async (newOwnerId: string) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');
        if (currentUserRole !== 'owner') throw new Error('オーナーのみ権限を譲渡できます');

        const newOwner = members.find((m) => m.id === newOwnerId);
        if (!newOwner) throw new Error('メンバーが見つかりません');
        if (newOwner.role === 'owner') throw new Error('既にオーナーです');

        // 新しいオーナーを設定
        const newOwnerRef = doc(db, 'pets', petId, 'members', newOwnerId);
        await updateDoc(newOwnerRef, {
            role: 'owner',
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
        });

        // 現在のユーザーを editor に変更
        const currentMember = members.find((m) => m.userId === user.uid);
        if (currentMember) {
            const currentMemberRef = doc(db, 'pets', petId, 'members', currentMember.id);
            await updateDoc(currentMemberRef, {
                role: 'editor',
                updatedBy: user.uid,
                updatedAt: serverTimestamp(),
            });
        }
    }, [petId, user, currentUserRole, members]);

    // メンバーを削除
    const removeMember = useCallback(async (memberId: string) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');
        if (currentUserRole !== 'owner') throw new Error('オーナーのみ削除できます');

        const member = members.find((m) => m.id === memberId);
        if (!member) throw new Error('メンバーが見つかりません');

        // オーナーは削除できない（自分含む）
        if (member.role === 'owner') {
            throw new Error('オーナーは削除できません。先に権限を変更してください');
        }

        // 物理削除
        const memberRef = doc(db, 'pets', petId, 'members', memberId);
        await deleteDoc(memberRef);
    }, [petId, user, currentUserRole, members]);

    // 自分が脱退
    const leaveTeam = useCallback(async () => {
        if (!petId || !user) throw new Error('エラーが発生しました');
        if (currentUserRole === 'owner') {
            const otherOwners = members.filter((m) => m.role === 'owner' && m.userId !== user.uid);
            if (otherOwners.length === 0) {
                throw new Error('あなたが唯一のオーナーです。脱退する前に他のメンバーをオーナーに設定してください');
            }
        }

        const currentMember = members.find((m) => m.userId === user.uid);
        if (!currentMember) throw new Error('メンバーが見つかりません');

        // 物理削除
        const memberRef = doc(db, 'pets', petId, 'members', currentMember.id);
        await deleteDoc(memberRef);
    }, [petId, user, currentUserRole, members]);

    // 権限に応じた操作可否
    const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';
    const canManageMembers = currentUserRole === 'owner';

    return {
        members,
        loading,
        currentUserRole,
        isOwner: currentUserRole === 'owner',
        canEdit,
        canManageMembers,
        inviteMember,
        acceptInvitation,
        declineInvitation,
        updateMemberRole,
        transferOwnership,
        removeMember,
        leaveTeam,
    };
}
