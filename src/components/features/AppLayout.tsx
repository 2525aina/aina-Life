'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/features/Header';
import { BottomNav } from '@/components/features/BottomNav';
import { SideNav } from '@/components/features/SideNav';
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
        <div className="min-h-screen relative bg-background">
            {/* Living Background - fixed so it doesn't scroll */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-orange-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />
            </div>

            <Header />
            <SideNav />
            <main className="relative z-10 pb-32 max-w-2xl mx-auto px-4 md:ml-56">{children}</main>
            <BottomNav />
        </div>
    );
}
