'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/features/Header';
import { BottomNav } from '@/components/features/BottomNav';
import { PawPrint } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppLayoutProps { children: ReactNode; }

export function AppLayout({ children }: AppLayoutProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <PawPrint className="w-12 h-12 text-primary" />
                </motion.div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pb-20 max-w-2xl mx-auto">{children}</main>
            <BottomNav />
        </div>
    );
}
