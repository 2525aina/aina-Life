'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, BarChart3, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
    { href: '/dashboard', icon: Home, label: 'ホーム' },
    { href: '/calendar', icon: Calendar, label: 'カレンダー' },
    { href: '/weight', icon: BarChart3, label: '体重' },
    { href: '/friends', icon: Users, label: '友達' },
    { href: '/profile', icon: User, label: 'プロフィール' },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none flex justify-center safe-area-bottom">
            <div className="glass-capsule pointer-events-auto flex items-center justify-around w-[95%] max-w-[420px] h-16 px-2 backdrop-blur-2xl">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'relative flex flex-col items-center justify-center w-14 h-12 transition-all duration-300 rounded-full hover:bg-white/10',
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
