'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, updateDoc, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { UserInfo } from "firebase/auth";
import { UserProfile } from '@/lib/types';

export const useUser = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      try {
        const getProviderName = (providerId: string) => {
          if (providerId === 'google.com') return 'Google認証';
          if (providerId === 'password') return 'メール認証';
          return providerId;
        };

        const getAuthNamePart = (provider: UserInfo): string | null => {
            if (provider.providerId === 'password') return 'mailUser';
            if (provider.providerId === 'google.com') return provider.displayName;
            return null;
        }

        if (docSnap.exists()) {
          const existingProfile = docSnap.data() as Omit<UserProfile, 'uid'>;
          const updatedData: Partial<UserProfile> = {};

          if (user.isAnonymous) {
              if (existingProfile.authEmail !== 'アカウント未登録者') updatedData.authEmail = 'アカウント未登録者';
              if (existingProfile.authName !== 'ゲストユーザー') updatedData.authName = 'ゲストユーザー';
              if (existingProfile.authProvider !== '匿名認証') updatedData.authProvider = '匿名認証';
          } else {
              const providerNames = user.providerData.map(p => getProviderName(p.providerId)).filter(p => p !== null).sort();
              const newAuthProvider = providerNames.join('&');

              const authNameParts = user.providerData.map(p => getAuthNamePart(p)).filter(p => p !== null).sort();
              const newAuthName = authNameParts.join('&');

              if (user.email && existingProfile.authEmail !== user.email) {
                  updatedData.authEmail = user.email;
              }
              if (newAuthName && existingProfile.authName !== newAuthName) {
                  updatedData.authName = newAuthName;
              }
              if (newAuthProvider && existingProfile.authProvider !== newAuthProvider) {
                  updatedData.authProvider = newAuthProvider;
              }
          }

          if (Object.keys(updatedData).length > 0) {
            await updateDoc(userDocRef, { ...updatedData, updatedAt: serverTimestamp() });
          } else {
            setUserProfile({ uid: user.uid, ...existingProfile });
          }
        } else {
          let authProviderName: string | null;
          let authName: string;
          let authEmail: string;

          if (user.isAnonymous) {
              authEmail = 'アカウント未登録者';
              authName = 'ゲストユーザー';
              authProviderName = '匿名認証';
          } else {
              authEmail = user.email || '';
              const providerId = user.providerData[0]?.providerId;
              if (providerId === 'password') {
                  authName = 'mailUser';
                  authProviderName = 'メール認証';
              } else if (providerId === 'google.com') {
                  authName = user.displayName || '';
                  authProviderName = 'Google認証';
              } else {
                  authName = user.displayName || '';
                  authProviderName = providerId ? getProviderName(providerId) : null;
              }
          }

          const newProfile: Omit<UserProfile, 'uid'> = {
            authEmail: authEmail,
            authName: authName,
            authProvider: authProviderName,
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
            settings: {
              notifications: { dailySummary: false },
              theme: 'system',
              timeFormat: 'HH:mm:ss',
              toastPosition: 'top-center',
              logDisplayColors: {
                enabled: true,
                creatorNameBg: "#e5e7eb",
                creatorNameText: "#6b7280",
                timeBg: "#e5e7eb",
                timeText: "#4b5563",
                deletedTaskBg: "#e5e7eb",
                deletedTaskText: "#9ca3af",
              },
              taskLogger: {
                showDateTime: true,
                showMemo: true,
                initialDateTimeOpen: true,
                initialMemoOpen: true,
              },
            },
          };
          await setDoc(userDocRef, newProfile);
        }

        // After potential update or set, the snapshot will trigger again with the latest data.
        // We can just set the profile from the latest snapshot.
        if (docSnap.exists()) {
            setUserProfile({ uid: docSnap.id, ...(docSnap.data() as Omit<UserProfile, 'uid'>) });
        }

      } catch (error) {
        console.error("Error in user profile snapshot listener:", error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    }, (error) => {
        console.error("Error fetching user profile snapshot:", error);
        setUserProfile(null);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateUserProfile = useCallback(async (data: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'authEmail'>>) => {
    if (!user) throw new Error('ユーザーが認証されていません。');
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }, [user]);

  return { userProfile, loading, updateUserProfile };
};