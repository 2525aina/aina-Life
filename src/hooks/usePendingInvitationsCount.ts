import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from './usePets';

export const usePendingInvitationsCount = () => {
  const { user, loading: authLoading } = useAuth(); // Assuming useAuth is available
  const { getPendingInvitations } = usePets();
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  useEffect(() => {
    if (!user || authLoading) {
      setPendingInvitationsCount(0);
      return;
    }

    const unsubscribe = getPendingInvitations((invitations) => {
      setPendingInvitationsCount(invitations.length);
    });

    return () => unsubscribe();
  }, [user, authLoading, getPendingInvitations]);

  return pendingInvitationsCount;
};
