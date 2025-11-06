import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp, collection, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceStatus {
  state: 'online' | 'offline';
  last_changed: Timestamp;
}

export const usePresence = (userIdsToMonitor: string[] = []) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const userPresenceRef = useRef(user ? doc(db, 'presence', user.uid) : null);

  // Function to update current user's presence
  const updateMyPresence = useCallback(async (status: 'online' | 'offline') => {
    if (!user || !userPresenceRef.current) return;
    console.log(`[usePresence] Attempting to set user ${user.uid} to ${status}`);
    try {
      await setDoc(userPresenceRef.current, {
        state: status,
        last_changed: serverTimestamp(),
      }, { merge: true });
      console.log(`[usePresence] Successfully set user ${user.uid} to ${status}`);
    } catch (error) {
      console.error("[usePresence] Error updating user presence:", error);
    }
  }, [user]);

  useEffect(() => {
    console.log("[usePresence] useEffect triggered. User:", user?.uid);
    if (!user) {
      // If user logs out, ensure their status is set to offline
      if (userPresenceRef.current) {
        console.log("[usePresence] User logged out, setting offline.");
        updateMyPresence('offline');
      }
      setOnlineUsers(new Set());
      return;
    }

    userPresenceRef.current = doc(db, 'presence', user.uid);

    // Set user status to online when component mounts
    console.log("[usePresence] Setting user online on mount.");
    updateMyPresence('online');

    // Handle browser/tab closing
    const handleBeforeUnload = () => {
      updateMyPresence('offline');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Listen for changes in other users' presence
    let unsubscribeFromPresence: () => void;
    if (userIdsToMonitor.length > 0) {
      // Monitor specific users
      const presenceCollectionRef = collection(db, 'presence');
      const q = query(presenceCollectionRef, where('__name__', 'in', userIdsToMonitor));
      unsubscribeFromPresence = onSnapshot(q, (snapshot) => {
        const currentOnlineUsers = new Set<string>();
        snapshot.forEach(doc => {
          const data = doc.data() as PresenceStatus;
          if (data.state === 'online') {
            currentOnlineUsers.add(doc.id);
          }
        });
        setOnlineUsers(currentOnlineUsers);
        console.log("[usePresence] Presence snapshot received. Online users:", Array.from(currentOnlineUsers));
      }, (error) => {
        console.error("[usePresence] Error listening to presence updates:", error);
      });
    } else {
      // If no specific users to monitor, don't listen to all presence documents for performance
      // Or, if we want to listen to all, we'd do it here without a 'where' clause.
      // For now, let's assume we only monitor specific users in chat contexts.
      // If the intent is to show all online users in a global list, this part would change.
      unsubscribeFromPresence = () => {}; // No-op if not monitoring specific users
    }


    return () => {
      console.log("[usePresence] useEffect cleanup: Setting user offline.");
      updateMyPresence('offline'); // Set offline when component unmounts
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribeFromPresence();
    };
  }, [user, updateMyPresence, userIdsToMonitor]);

  const isUserOnline = (uid: string) => onlineUsers.has(uid);

  return { isUserOnline, onlineUsers };
};