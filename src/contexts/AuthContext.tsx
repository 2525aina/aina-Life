'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';

interface AuthContextType {
    user: FirebaseUser | null;
    userProfile: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            // ユーザー切り替えなどで再発火した場合、前のリスナーを解除
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            setUser(firebaseUser);

            if (firebaseUser) {
                const userRef = doc(db, 'users', firebaseUser.uid);

                // リアルタイムリスナーを設定
                unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile({ uid: firebaseUser.uid, ...docSnap.data() } as User);
                    } else {
                        // 初回ログイン時など、ドキュメントがない場合は作成
                        const newUser: Record<string, unknown> = {
                            displayName: firebaseUser.displayName || 'ユーザー',
                            settings: { theme: 'system' },
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        };
                        if (firebaseUser.photoURL) {
                            newUser.avatarUrl = firebaseUser.photoURL;
                        }
                        if (firebaseUser.email) {
                            newUser.email = firebaseUser.email;
                        }

                        try {
                            await setDoc(userRef, newUser);
                            // setDoc後の更新はリスナーが拾うが、即時反映のため
                            setUserProfile({ uid: firebaseUser.uid, ...newUser } as User);
                        } catch (e) {
                            console.error("Error creating user profile:", e);
                        }
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Profile sync error:", error);
                    setLoading(false);
                });
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        // クリーンアップ
        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) {
                unsubscribeProfile();
            }
        };
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
