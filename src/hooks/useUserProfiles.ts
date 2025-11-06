import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';

export const useUserProfiles = (userIds: string[]) => {
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userIds.length === 0) {
      setUserProfiles({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const usersRef = collection(db, 'users'); // Corrected collection name
    const q = query(usersRef, where('__name__', 'in', userIds)); // Query by document ID

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProfiles: Record<string, UserProfile> = {};
      snapshot.forEach(doc => {
        const profile = { uid: doc.id, ...(doc.data() as Omit<UserProfile, 'uid'>) }; // Map doc.id to uid
        fetchedProfiles[profile.uid] = profile;
      });
      setUserProfiles(fetchedProfiles);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching user profiles:", err);
      setError("ユーザープロファイルの取得に失敗しました。");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userIds]);

  return { userProfiles, loading, error };
};
