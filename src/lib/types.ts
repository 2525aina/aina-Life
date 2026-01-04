import type { Timestamp } from 'firebase/firestore';

// ============================================
// 共通フィールド（監査カラム）
// ============================================
export interface BaseDocument {
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface AuditDocument extends BaseDocument {
    createdBy: string;
    updatedBy: string;
}

// ============================================
// ユーザープロフィール
// ============================================
export interface User extends BaseDocument {
    uid: string;
    email: string;
    displayName: string;
    nickname?: string;
    avatarUrl?: string;
    birthday?: string;
    gender?: 'male' | 'female' | 'other';
    introduction?: string;
    settings: UserSettings;
}

export interface UserSettings {
    theme: 'system' | 'light' | 'dark';
}

// ============================================
// ペット
// ============================================
export interface VetInfo {
    name: string;
    phone?: string;
}

export interface Pet extends AuditDocument {
    id: string;
    name: string;
    breed?: string;
    birthday?: string;
    gender?: 'male' | 'female' | 'other';
    avatarUrl?: string;
    adoptionDate?: string;
    microchipId?: string;
    medicalNotes?: string;
    vetInfo?: VetInfo[];
}

// ============================================
// ペットメンバー（共有）
// ============================================
export type MemberRole = 'owner' | 'editor' | 'viewer';
export type MemberStatus = 'pending' | 'active' | 'removed' | 'declined';

export interface Member {
    id: string;
    userId: string;
    inviteEmail: string;
    role: MemberRole;
    status: MemberStatus;
    invitedBy: string;
    invitedAt: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    updatedBy: string;
}

export const MEMBER_ROLES: { value: MemberRole; label: string; description: string }[] = [
    { value: 'owner', label: 'オーナー', description: 'すべての権限（メンバー管理・削除可能）' },
    { value: 'editor', label: '編集者', description: '記録の追加・編集が可能' },
    { value: 'viewer', label: '閲覧者', description: '閲覧のみ' },
];

// ============================================
// 日記エントリー
// ============================================
export type EntryType = 'diary' | 'schedule';
export type TimeType = 'point' | 'range';

export interface Entry extends AuditDocument {
    id: string;
    type: EntryType;
    timeType: TimeType;
    date: Timestamp;
    endDate?: Timestamp;
    title?: string;
    body?: string;
    tags: string[];
    imageUrls: string[];
    isCompleted?: boolean;
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

// ============================================
// 体重記録
// ============================================
export interface Weight extends AuditDocument {
    id: string;
    value: number;
    unit: 'kg' | 'g';
    date: Timestamp;
}

// ============================================
// カスタムタスク
// ============================================
export interface CustomTask extends AuditDocument {
    id: string;
    name: string;
    emoji: string;
    order: number;
}

// ============================================
// お散歩友達
// ============================================
export interface Friend extends BaseDocument {
    id: string;
    name: string;
    breed?: string;
    avatarUrl?: string;
    note?: string;
    firstMetAt: Timestamp;
}

// ============================================
// 遭遇記録
// ============================================
export interface Encounter {
    id: string;
    date: Timestamp;
    note?: string;
    imageUrl?: string;
    createdAt: Timestamp;
}
