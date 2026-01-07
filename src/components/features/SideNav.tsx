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

export function SideNav() {
    const pathname = usePathname();

    return (
        <nav className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-56 bg-background/80 backdrop-blur-xl border-r border-white/10 p-4 z-40">
            <div className="space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
                            )}
                        >
                            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
