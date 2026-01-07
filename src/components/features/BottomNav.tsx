'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, BarChart3, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            <div className="glass-capsule pointer-events-auto flex items-center justify-around w-[95%] max-w-[420px] h-[68px] px-2 backdrop-blur-2xl">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'relative flex flex-col items-center justify-center w-14 min-h-[44px] py-1.5 transition-all duration-300 rounded-2xl hover:bg-white/10',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground/60 hover:text-muted-foreground'
                            )}
                        >
                            <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={cn(
                                "text-[9px] font-medium mt-0.5 transition-colors truncate max-w-full",
                                isActive ? "text-primary" : "text-muted-foreground/60"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
