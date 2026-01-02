import type { Timestamp } from 'firebase/firestore';

// ユーザープロフィール
export interface User {
    uid: string;
    displayName: string;
    avatarUrl?: string;
    email?: string;
    settings: UserSettings;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface UserSettings {
    theme: 'system' | 'light' | 'dark';
}

// ペット
export interface Pet {
    id: string;
    ownerId: string;
    name: string;
    breed?: string;
    birthday?: string;
    avatarUrl?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ペットメンバー（共有）
export interface Member {
    id: string;
    userId: string;
    role: 'owner' | 'editor' | 'viewer';
    inviteEmail?: string;
    status: 'pending' | 'active' | 'removed' | 'declined';
    invitedBy?: string;
    invitedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export type MemberRole = 'owner' | 'editor' | 'viewer';

export const MEMBER_ROLES: { value: MemberRole; label: string; description: string }[] = [
    { value: 'owner', label: 'オーナー', description: 'すべての権限（メンバー管理・削除可能）' },
    { value: 'editor', label: '編集者', description: '記録の追加・編集が可能' },
    { value: 'viewer', label: '閲覧者', description: '閲覧のみ' },
];

// 日記エントリー
export interface Entry {
    id: string;
    type: 'diary' | 'schedule';
    title?: string;
    body?: string;
    tags: EntryTag[];
    imageUrls: string[];
    date: Timestamp;
    friendIds?: string[];
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type EntryTag =
    | 'ごはん' | '散歩' | 'お薬' | '通院' | '体調不良'
    | '睡眠' | '排泄' | 'トリミング' | '予防接種' | 'その他';

export const ENTRY_TAGS: { value: EntryTag; label: string; emoji: string }[] = [
    { value: 'ごはん', label: 'ごはん', emoji: '🍚' },
    { value: '散歩', label: 'おさんぽ', emoji: '🚶' },
    { value: 'お薬', label: 'お薬', emoji: '💊' },
    { value: '通院', label: '通院', emoji: '🏥' },
    { value: '体調不良', label: '体調不良', emoji: '😷' },
    { value: '睡眠', label: '睡眠', emoji: '💤' },
    { value: '排泄', label: '排泄', emoji: '💩' },
    { value: 'トリミング', label: 'トリミング', emoji: '✂️' },
    { value: '予防接種', label: '予防接種', emoji: '💉' },
    { value: 'その他', label: 'その他', emoji: '📝' },
];

// 体重記録
export interface Weight {
    id: string;
    value: number;
    unit: 'kg' | 'g';
    date: Timestamp;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// お散歩友達
export interface Friend {
    id: string;
    name: string;
    breed?: string;
    avatarUrl?: string;
    note?: string;
    firstMetAt: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// 遭遇記録
export interface Encounter {
    id: string;
    date: Timestamp;
    note?: string;
    imageUrl?: string;
    createdAt: Timestamp;
}
