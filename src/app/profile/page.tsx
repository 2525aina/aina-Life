'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/features/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, PawPrint, ExternalLink, Camera, CalendarIcon, Save, User, Bell, MessageSquare, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePets } from '@/hooks/usePets';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ProfilePage() {
    const { user, userProfile, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const { pets } = usePets();
    const { uploadUserAvatar, uploading } = useImageUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // プロフィール情報
    const [displayName, setDisplayName] = useState('');
    const [nickname, setNickname] = useState('');
    const [birthday, setBirthday] = useState<Date | undefined>(undefined);
    const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
    const [introduction, setIntroduction] = useState('');
    const [notifications, setNotifications] = useState({ dailySummary: false });
    const [timeFormat, setTimeFormat] = useState('HH:mm');
    const [toastPosition, setToastPosition] = useState('bottom-right');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || '');
            setNickname(userProfile.nickname || '');
            setBirthday(userProfile.birthday ? parse(userProfile.birthday, 'yyyy-MM-dd', new Date()) : undefined);
            setGender(userProfile.gender || '');
            setIntroduction(userProfile.introduction || '');
            if (userProfile.settings) {
                setNotifications(userProfile.settings.notifications || { dailySummary: false });
                setTimeFormat(userProfile.settings.timeFormat || 'HH:mm');
                setToastPosition(userProfile.settings.toastPosition || 'bottom-right');
            }
        }
    }, [userProfile]);

    const handleUpdateSettings = async (key: string, value: any) => {
        if (!user) return;

        // Optimistic update
        if (key === 'notifications') setNotifications(value);
        if (key === 'timeFormat') setTimeFormat(value);
        if (key === 'toastPosition') setToastPosition(value);

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                [`settings.${key}`]: value,
                updatedAt: serverTimestamp()
            });
            // toast.success('設定を保存しました'); // いちいち出すとうるさいかも？
        } catch (error) {
            console.error(error);
            toast.error('設定の保存に失敗しました');
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !user) return;
        try {
            const url = await uploadUserAvatar(e.target.files[0]);
            await updateDoc(doc(db, 'users', user.uid), {
                avatarUrl: url,
                updatedAt: serverTimestamp()
            });
            toast.success('画像を更新しました');
        } catch {
            toast.error('画像のアップロードに失敗しました');
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                displayName: displayName.trim() || userProfile?.displayName,
                nickname: nickname.trim() || null,
                birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null,
                gender: gender || null,
                introduction: introduction.trim() || null,
                updatedAt: serverTimestamp(),
            });
            toast.success('プロフィールを更新しました');
            setIsEditing(false);
        } catch {
            toast.error('エラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppLayout>
            <div className="p-4 space-y-6 pb-24">
                {/* プロフィールカード */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative">
                                    <Avatar className="w-20 h-20">
                                        <AvatarImage src={userProfile?.avatarUrl} alt={userProfile?.displayName} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                                            {userProfile?.displayName?.charAt(0) || <User className="w-8 h-8" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold truncate">{userProfile?.nickname || userProfile?.displayName}</h2>
                                    <p className="text-sm text-muted-foreground truncate">{userProfile?.email}</p>
                                </div>
                            </div>
                            {!isEditing ? (
                                <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                                    プロフィールを編集
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="displayName">表示名</Label>
                                        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="nickname">ニックネーム</Label>
                                        <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="呼ばれたい名前" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>性別</Label>
                                        <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                                            <SelectTrigger className="mt-1"><SelectValue placeholder="選択してください" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">男性</SelectItem>
                                                <SelectItem value="female">女性</SelectItem>
                                                <SelectItem value="other">その他</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>誕生日</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn('w-full mt-1 justify-start text-left font-normal', !birthday && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {birthday ? format(birthday, 'yyyy年M月d日', { locale: ja }) : '選択してください'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={birthday} onSelect={setBirthday} locale={ja} captionLayout="dropdown" disabled={(date) => date > new Date()} />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div>
                                        <Label htmlFor="introduction">自己紹介</Label>
                                        <textarea
                                            id="introduction"
                                            value={introduction}
                                            onChange={(e) => setIntroduction(e.target.value)}
                                            placeholder="自己紹介を書いてください"
                                            rows={3}
                                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>キャンセル</Button>
                                        <Button className="flex-1 gradient-primary" onClick={handleSaveProfile} disabled={isSaving}>
                                            <Save className="w-4 h-4 mr-2" />{isSaving ? '保存中...' : '保存'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* ペット一覧 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2"><PawPrint className="w-4 h-4" />登録ペット</CardTitle>
                                <Link href="/pets/new"><Button variant="ghost" size="sm">追加</Button></Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {pets.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">まだペットが登録されていません</p>
                            ) : (
                                <div className="space-y-3">
                                    {pets.map((pet) => (
                                        <Link key={pet.id} href={`/pets/settings?id=${pet.id}`}>
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={pet.avatarUrl} alt={pet.name} />
                                                    <AvatarFallback className="bg-primary/10"><PawPrint className="w-5 h-5 text-primary" /></AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{pet.name}</p>
                                                    {pet.breed && <p className="text-sm text-muted-foreground truncate">{pet.breed}</p>}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 設定 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">設定</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    <Label htmlFor="dark-mode">ダークモード</Label>
                                </div>
                                <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5" />
                                    <Label htmlFor="daily-summary">毎日のサマリー通知</Label>
                                </div>
                                <Switch
                                    id="daily-summary"
                                    checked={notifications.dailySummary}
                                    onCheckedChange={(checked) => handleUpdateSettings('notifications', { ...notifications, dailySummary: checked })}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <Clock className="w-5 h-5" />
                                    <Label>時刻表示フォーマット</Label>
                                </div>
                                <Select value={timeFormat} onValueChange={(v) => handleUpdateSettings('timeFormat', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HH:mm">24時間表記 (13:00)</SelectItem>
                                        <SelectItem value="h:mm aa">12時間表記 (1:00 PM)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <MessageSquare className="w-5 h-5" />
                                    <Label>通知の表示位置</Label>
                                </div>
                                <Select value={toastPosition} onValueChange={(v) => handleUpdateSettings('toastPosition', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="top-right">右上</SelectItem>
                                        <SelectItem value="top-center">上部中央</SelectItem>
                                        <SelectItem value="top-left">左上</SelectItem>
                                        <SelectItem value="bottom-right">右下</SelectItem>
                                        <SelectItem value="bottom-center">下部中央</SelectItem>
                                        <SelectItem value="bottom-left">左下</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* その他 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">その他</CardTitle></CardHeader>
                        <CardContent>
                            <a href="https://aina-life-dev.web.app" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <span className="text-sm">旧アプリ（aina-life-dev）</span>
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </a>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* ログアウト */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={signOut}>
                        <LogOut className="w-4 h-4 mr-2" />ログアウト
                    </Button>
                </motion.div>
            </div>
        </AppLayout>
    );
}
