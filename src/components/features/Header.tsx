'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PetSwitcher } from './PetSwitcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

export function Header() {
    const { userProfile, signOut } = useAuth();
    const { theme, setTheme } = useTheme();

    return (
        <header className="sticky top-0 z-40 bg-white/30 dark:bg-black/30 backdrop-blur-xl border-b border-white/10 transition-colors">
            <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
                <PetSwitcher />
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-9 h-9">
                        <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.displayName} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="px-2 py-1.5">
                                <p className="font-medium truncate">{userProfile?.displayName}</p>
                                <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href="/profile" className="cursor-pointer"><Settings className="w-4 h-4 mr-2" />設定</Link></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive"><LogOut className="w-4 h-4 mr-2" />ログアウト</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
