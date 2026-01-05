'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/features/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, PawPrint, ExternalLink, Camera, CalendarIcon, Save, User, Bell, MessageSquare, Clock, ArrowLeft, Mail, ChevronRight, Settings, Edit3, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePets } from '@/hooks/usePets';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ImageCropper } from '@/components/ui/image-cropper';

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

    // 設定
    const [notifications, setNotifications] = useState({ dailySummary: false });
    const [timeFormat, setTimeFormat] = useState('HH:mm');
    const [toastPosition, setToastPosition] = useState('bottom-right');

    // UI状態
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 画像編集状態
    const [cropperOpen, setCropperOpen] = useState(false);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [removeAvatar, setRemoveAvatar] = useState(false);
    const [confirmDeleteAvatarOpen, setConfirmDeleteAvatarOpen] = useState(false);

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
            toast.success('設定を保存しました');
        } catch (error) {
            console.error(error);
            toast.error('設定の保存に失敗しました');
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setOriginalImageSrc(url);
        setCropperOpen(true);
        e.target.value = '';
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
        setPendingAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setRemoveAvatar(false);
        setCropperOpen(false);
    };

    const handleCropCancel = () => {
        setCropperOpen(false);
        if (!pendingAvatarFile) {
            setOriginalImageSrc(null);
        }
    };

    const handleRemoveAvatar = () => {
        setPendingAvatarFile(null);
        setAvatarPreview(null);
        setRemoveAvatar(true);
        setConfirmDeleteAvatarOpen(false);
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            let avatarUrl: any = userProfile?.avatarUrl;
            if (removeAvatar) {
                avatarUrl = deleteField();
            } else if (pendingAvatarFile) {
                avatarUrl = await uploadUserAvatar(pendingAvatarFile);
            }

            await updateDoc(doc(db, 'users', user.uid), {
                displayName: displayName.trim() || userProfile?.displayName,
                nickname: nickname.trim() || null,
                birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null,
                gender: gender || null,
                introduction: introduction.trim() || null,
                avatarUrl: avatarUrl,
                updatedAt: serverTimestamp(),
            });

            setPendingAvatarFile(null);
            setAvatarPreview(null);
            setRemoveAvatar(false);
            toast.success('プロフィールを更新しました');
            setIsEditing(false);
        } catch {
            toast.error('エラーが発生しました');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (userProfile) {
            setDisplayName(userProfile.displayName || '');
            setNickname(userProfile.nickname || '');
            setBirthday(userProfile.birthday ? parse(userProfile.birthday, 'yyyy-MM-dd', new Date()) : undefined);
            setGender(userProfile.gender || '');
            setIntroduction(userProfile.introduction || '');
        }
        setPendingAvatarFile(null);
        setAvatarPreview(null);
        setRemoveAvatar(false);
    };

    const displayAvatar = avatarPreview || (removeAvatar ? undefined : userProfile?.avatarUrl);

    // Common List Item Component
    const ListItem = ({ icon: Icon, label, subLabel, action, className }: any) => (
        <div className={cn("flex items-center justify-between p-4 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all duration-300 group", className)}>
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                    <h3 className="font-medium text-sm leading-none">{label}</h3>
                    {subLabel && <p className="text-xs text-muted-foreground">{subLabel}</p>}
                </div>
            </div>
            <div>{action}</div>
        </div>
    );

    return (
        <AppLayout>
            <div className="pb-32">
                {/* Modern Hero Section */}
                <div className="relative">
                    <div className="absolute inset-0 h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent -z-10" />

                    <div className="md:container max-w-2xl mx-auto px-4 pt-8">
                        {/* Header Navigation */}
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-background/80 hover:shadow-sm">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={signOut}>
                                    <LogOut className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Profile Header Card */}
                        <div className="flex flex-col items-center mb-8">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative group mb-4"
                            >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full opacity-30 blur group-hover:opacity-50 transition duration-500"></div>
                                <Avatar className="w-32 h-32 border-4 border-background shadow-2xl relative">
                                    <AvatarImage src={displayAvatar} alt={userProfile?.displayName} className="object-cover" />
                                    <AvatarFallback className="bg-primary/5 text-primary text-4xl font-medium">
                                        {userProfile?.displayName?.charAt(0) || <User className="w-12 h-12" />}
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-background z-10"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </motion.button>
                                )}
                                {isEditing && !removeAvatar && (displayAvatar || userProfile?.avatarUrl) && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setConfirmDeleteAvatarOpen(true)}
                                        className="absolute top-0 right-0 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg border-2 border-background z-10"
                                    >
                                        <LogOut className="w-3 h-3 rotate-180" />
                                    </motion.button>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </motion.div>

                            <AnimatePresence mode="wait">
                                {!isEditing ? (
                                    <motion.div
                                        key="view"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        className="flex flex-col items-center relative z-10"
                                    >
                                        {/* Avatar Container with Glow */}
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-orange-400 rounded-full blur-3xl opacity-30 animate-pulse" />
                                            <div className="relative z-10 p-2 rounded-full glass border border-white/20 dark:border-white/10">
                                                <Avatar className="w-32 h-32 md:w-40 md:h-40 shadow-2xl">
                                                    <AvatarImage src={displayAvatar} alt={userProfile?.displayName} className="object-cover" />
                                                    <AvatarFallback className="bg-white/10 text-4xl font-light">
                                                        {userProfile?.displayName?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            {/* Edit Pencil Fab */}
                                            <Button
                                                size="icon"
                                                className="absolute bottom-1 right-1 rounded-full z-20 shadow-xl gradient-primary hover:scale-110 transition-transform w-12 h-12"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <Edit3 className="w-6 h-6 text-white" />
                                            </Button>
                                        </div>

                                        {/* Name & Bio */}
                                        <div className="text-center space-y-2 mb-8">
                                            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/40">
                                                {nickname || displayName}
                                            </h1>
                                            {nickname && <p className="text-sm font-medium text-muted-foreground tracking-wide">{displayName}</p>}

                                            {/* Email Badge */}
                                            <div className="inline-flex items-center px-4 py-1.5 rounded-full glass border border-white/20 text-xs font-medium text-muted-foreground/80 mt-3 shadow-sm">
                                                <Mail className="w-3.5 h-3.5 mr-2 opacity-70" />
                                                {userProfile?.email}
                                            </div>
                                        </div>

                                        {/* Decorative Divider */}
                                        <div className="w-24 h-1 rounded-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-8" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="edit" className="w-full max-w-md mt-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <Card className="border-none shadow-xl bg-background/80 backdrop-blur-sm">
                                            <CardContent className="p-6 space-y-4">
                                                <div className="grid gap-4">
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground ml-1">表示名</Label>
                                                        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-muted/50" placeholder="お名前" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground ml-1">ニックネーム</Label>
                                                        <Input value={nickname} onChange={(e) => setNickname(e.target.value)} className="bg-muted/50" placeholder="ニックネーム" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground ml-1">性別</Label>
                                                        <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                                                            <SelectTrigger className="bg-muted/50"><SelectValue placeholder="選択" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="male">男性</SelectItem>
                                                                <SelectItem value="female">女性</SelectItem>
                                                                <SelectItem value="other">その他</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground ml-1">誕生日</Label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" className={cn('w-full bg-muted/50 justify-start text-left font-normal', !birthday && 'text-muted-foreground')}>
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {birthday ? format(birthday, 'yyyy/MM/dd') : '選択'}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar mode="single" selected={birthday} onSelect={setBirthday} locale={ja} disabled={(date) => date > new Date()} />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground ml-1">自己紹介</Label>
                                                    <textarea
                                                        value={introduction}
                                                        onChange={(e) => setIntroduction(e.target.value)}
                                                        rows={2}
                                                        className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:bg-background transition-colors resize-none"
                                                        placeholder="ひとこと..."
                                                    />
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button variant="ghost" className="flex-1" onClick={handleCancelEdit}>キャンセル</Button>
                                                    <Button className="flex-1 gradient-primary shadow-lg" onClick={handleSaveProfile} disabled={isSaving || !displayName.trim()}>
                                                        <Save className="w-4 h-4 mr-2" />{isSaving ? '保存中...' : '保存'}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Settings Sections */}
                        <div className="space-y-8">
                            {/* Pets Section */}
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold px-1 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    マイファミリー
                                </h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {pets.map((pet) => (
                                        <Link key={pet.id} href={`/pets/settings?id=${pet.id}`}>
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
                                                <Avatar className="w-12 h-12 border-2 border-background group-hover:scale-105 transition-transform duration-300">
                                                    <AvatarImage src={pet.avatarUrl} alt={pet.name} className="object-cover" />
                                                    <AvatarFallback className="bg-orange-100 text-orange-500"><PawPrint className="w-6 h-6" /></AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{pet.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{pet.breed || '犬種未設定'}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </Link>
                                    ))}
                                    <Link href="/pets/new">
                                        <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 cursor-pointer h-full justify-center group">
                                            <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                                <PawPrint className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">新しい家族を迎える</span>
                                        </div>
                                    </Link>
                                </div>
                            </section>

                            {/* App Settings */}
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold px-1 flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-primary" />
                                    アプリ設定
                                </h2>
                                <div className="space-y-3">
                                    <ListItem
                                        icon={theme === 'dark' ? Moon : Sun}
                                        label="ダークモード"
                                        subLabel="画面の明度を調整します"
                                        action={<Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />}
                                    />
                                    <ListItem
                                        icon={Bell}
                                        label="デイリーサマリー"
                                        subLabel="毎日の記録まとめを受け取る"
                                        action={<Switch checked={notifications.dailySummary} onCheckedChange={(c) => handleUpdateSettings('notifications', { ...notifications, dailySummary: c })} />}
                                    />
                                    <ListItem
                                        icon={Clock}
                                        label="時刻表記"
                                        subLabel={timeFormat}
                                        action={
                                            <Select value={timeFormat} onValueChange={(v) => handleUpdateSettings('timeFormat', v)}>
                                                <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="HH:mm">24時間</SelectItem>
                                                    <SelectItem value="h:mm aa">12時間</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        }
                                    />
                                    <ListItem
                                        icon={MessageSquare}
                                        label="通知位置"
                                        subLabel="トースト通知の表示場所"
                                        action={
                                            <Select value={toastPosition} onValueChange={(v) => handleUpdateSettings('toastPosition', v)}>
                                                <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="top-right">右上</SelectItem>
                                                    <SelectItem value="top-center">上部中央</SelectItem>
                                                    <SelectItem value="bottom-right">右下</SelectItem>
                                                    <SelectItem value="bottom-center">下部中央</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        }
                                    />
                                </div>
                            </section>

                            {/* Other Links */}
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold px-1 flex items-center gap-2">
                                    <span className="w-4 h-4" /> {/* Spacer for alignment */}
                                    その他
                                </h2>
                                <a href="https://aina-life-dev.web.app" target="_blank" rel="noopener noreferrer">
                                    <ListItem
                                        icon={ExternalLink}
                                        label="旧アプリを開く"
                                        subLabel="aina-life-dev.web.app"
                                        action={<ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                    />
                                </a>
                            </section>
                        </div>
                    </div>
                </div>

                <ImageCropper
                    open={cropperOpen}
                    imageSrc={originalImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />

                <Dialog open={confirmDeleteAvatarOpen} onOpenChange={setConfirmDeleteAvatarOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>画像を削除しますか？</DialogTitle>
                            <DialogDescription>プロフィール画像が初期状態に戻ります。この操作は取り消せません。</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setConfirmDeleteAvatarOpen(false)}>キャンセル</Button>
                            <Button variant="destructive" onClick={handleRemoveAvatar}>削除する</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
