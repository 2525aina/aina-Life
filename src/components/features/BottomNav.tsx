'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Plus, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
    { href: '/dashboard', icon: Home, label: 'ホーム' },
    { href: '/calendar', icon: Calendar, label: 'カレンダー' },
    { href: '/entry/new', icon: Plus, label: '記録', isAction: true },
    { href: '/weight', icon: BarChart3, label: '体重' },
    { href: '/profile', icon: User, label: 'プロフィール' },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    if (item.isAction) {
                        return (
                            <Link key={item.href} href={item.href}>
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full gradient-primary shadow-lg"
                                >
                                    <Icon className="w-6 h-6 text-white" />
                                </motion.div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center w-16 h-full transition-colors',
                                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs mt-1 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
