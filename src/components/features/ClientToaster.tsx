'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

export function ClientToaster() {
    const { userProfile } = useAuth();
    const position = (userProfile?.settings?.toastPosition as any) || 'top-center';

    return <Toaster position={position} richColors closeButton />;
}
