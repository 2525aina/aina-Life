'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function useTimeFormat() {
    const { userProfile } = useAuth();
    const timeFormat = userProfile?.settings?.timeFormat || 'HH:mm';

    const formatTime = useCallback((date: Date | number) => {
        return format(date, timeFormat, { locale: ja });
    }, [timeFormat]);

    return { formatTime, timeFormat };
}
