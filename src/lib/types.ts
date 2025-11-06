import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  authEmail: string;
  authName?: string;
  nickname?: string;
  profileImageUrl?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  introduction?: string;
  primaryPetId?: string;
  lastLoginAt?: Timestamp;
  authProvider?: string | null;
  fcmTokens?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
      settings: {
        notifications: {
          dailySummary: boolean;
        };
        theme: 'system' | 'light' | 'dark';
        timeFormat?: 'HH:mm:ss' | 'H:m:s' | 'HH:mm' | 'H:m';
        toastPosition?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
        logDisplayColors?: {
          enabled?: boolean;
          creatorNameBg?: string;
          creatorNameText?: string;
          timeBg?: string;
          timeText?: string;
          deletedTaskBg?: string;
          deletedTaskText?: string;
        };
        taskLogger?: {
          showDateTime: boolean;
          showMemo: boolean;
          initialDateTimeOpen: boolean;
          initialMemoOpen: boolean;
        };
      };
}

export interface Message {
  id: string;
  senderId: string;
  messageText: string;
  timestamp: Timestamp;
  isUnsent?: boolean;
}

export interface Log {
  id: string;
  petId: string;
  taskId: string;
  taskName: string;
  timestamp: Timestamp;
  note?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  taskColor?: string;
  taskTextColor?: string;
  deleted?: boolean;
  deletedAt?: Timestamp | null;
  isTaskDeleted?: boolean;
  createdByName?: string;
  updatedByName?: string;
  creatorNameBgColor?: string;
  creatorNameTextColor?: string;
  timeBgColor?: string;
  timeTextColor?: string;
}

export interface VetInfo {
  id: string;
  name?: string;
  phone?: string;
}

export interface Pet {
  id: string;
  name: string;
  breed?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  adoptionDate?: string;
  profileImageUrl?: string;
  microchipId?: string;
  medicalNotes?: string;
  vetInfo?: VetInfo[];
  deleted?: boolean;
  deletedAt?: Timestamp | null;
}

export interface Member {
  id: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'active' | 'removed' | 'declined';
  uid: string;
  inviteEmail: string | null;
  invitedBy?: string;
  invitedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PendingInvitation {
  pet: Pet;
  memberId: string;
}

export interface Task {
  id: string;
  name: string;
  color: string;
  order: number;
  textColor?: string;
  deleted?: boolean;
  deletedAt?: Timestamp | null;
}

export interface Weight {
  id: string;
  dogId: string;
  createdBy: string;
  date: Timestamp;
  unit: string;
  value: number;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}