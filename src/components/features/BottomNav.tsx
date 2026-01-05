'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Plus, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { usePetContext } from '@/contexts/PetContext';
import { useMembers } from '@/hooks/useMembers';

const navItems = [
    { href: '/dashboard', icon: Home, label: 'ホーム' },
    { href: '/calendar', icon: Calendar, label: 'カレンダー' },
    { href: '/entry/new', icon: Plus, label: '記録', isAction: true },
    { href: '/weight', icon: BarChart3, label: '体重' },
    { href: '/profile', icon: User, label: 'プロフィール' },
];

export function BottomNav() {
    const pathname = usePathname();
    const { selectedPet } = usePetContext();
    const { canEdit } = useMembers(selectedPet?.id || null);

    return (
        <nav className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none flex justify-center safe-area-bottom">
            <div className="glass-capsule pointer-events-auto flex items-center justify-around w-[90%] max-w-[360px] h-16 px-1 backdrop-blur-2xl">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    if (item.isAction) {
                        if (!canEdit) return <div key={item.href} className="w-14" />; // Placeholder to keep spacing
                        return (
                            <Link key={item.href} href={item.href} className="relative -top-6">
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center justify-center w-14 h-14 rounded-full gradient-primary shadow-xl shadow-primary/30"
                                >
                                    <Icon className="w-7 h-7 text-white" />
                                </motion.div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 rounded-full hover:bg-white/10',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground/60 hover:text-muted-foreground'
                            )}
                        >
                            <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                            {isActive && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
