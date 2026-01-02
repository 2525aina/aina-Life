'use client';

import { AppLayout } from '@/components/features/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, PawPrint, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePets } from '@/hooks/usePets';

export default function ProfilePage() {
    const { userProfile, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const { pets } = usePets();

    return (
        <AppLayout>
            <div className="p-4 space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><Card><CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16"><AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.displayName} /><AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0"><h2 className="text-xl font-bold truncate">{userProfile?.displayName}</h2><p className="text-sm text-muted-foreground truncate">{userProfile?.email}</p></div>
                    </div>
                </CardContent></Card></motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><Card><CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><PawPrint className="w-4 h-4" />登録ペット</CardTitle><Link href="/pets/new"><Button variant="ghost" size="sm">追加</Button></Link></div></CardHeader><CardContent>
                    {pets.length === 0 ? <p className="text-center text-muted-foreground py-4">まだペットが登録されていません</p>
                        : <div className="space-y-3">{pets.map((pet) => <div key={pet.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"><Avatar className="w-10 h-10"><AvatarImage src={pet.avatarUrl} alt={pet.name} /><AvatarFallback className="bg-primary/10"><PawPrint className="w-5 h-5 text-primary" /></AvatarFallback></Avatar><div className="flex-1 min-w-0"><p className="font-medium truncate">{pet.name}</p>{pet.breed && <p className="text-sm text-muted-foreground truncate">{pet.breed}</p>}</div></div>)}</div>}
                </CardContent></Card></motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}><Card><CardHeader className="pb-2"><CardTitle className="text-base">設定</CardTitle></CardHeader><CardContent>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3">{theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}<Label htmlFor="dark-mode">ダークモード</Label></div><Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} /></div>
                </CardContent></Card></motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Card><CardHeader className="pb-2"><CardTitle className="text-base">その他</CardTitle></CardHeader><CardContent><a href="https://aina-life-dev.web.app" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"><span className="text-sm">旧アプリ（aina-life-dev）</span><ExternalLink className="w-4 h-4 text-muted-foreground" /></a></CardContent></Card></motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}><Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />ログアウト</Button></motion.div>
            </div>
        </AppLayout>
    );
}
