'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/features/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, PawPrint, ExternalLink, Camera, CalendarIcon, Save, User, Bell, MessageSquare, Clock, ArrowLeft, Mail, Info } from 'lucide-react';
import { motion } from 'framer-motion';
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

            // 画像削除
            if (removeAvatar) {
                avatarUrl = deleteField();
            }
            // 新しい画像をアップロード
            else if (pendingAvatarFile) {
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

            // 状態リセット
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
        // Reset local state to profile values
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

    return (
        <AppLayout>
            <div className="md:container max-w-2xl mx-auto pb-24">
                {/* ヘッダーエリア */}
                <div className="relative h-48 bg-gradient-to-r from-primary/10 to-primary/5 mb-16 md:rounded-b-3xl -mx-4 md:mx-0">
                    <div className="absolute top-4 left-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="bg-background/50 hover:bg-background/80 backdrop-blur-sm">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* アバター（重なり） */}
                    <div className="absolute -bottom-12 left-0 right-0 flex justify-center">
                        <div className="relative group">
                            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                                <AvatarImage src={displayAvatar} alt={userProfile?.displayName} className="object-cover" />
                                <AvatarFallback className="bg-primary/10 text-primary text-4xl font-medium">
                                    {userProfile?.displayName?.charAt(0) || <User className="w-12 h-12" />}
                                </AvatarFallback>
                            </Avatar>

                            {isEditing && (
                                <>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-10"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                    {!removeAvatar && (displayAvatar || userProfile?.avatarUrl) && (
                                        <button
                                            onClick={() => setConfirmDeleteAvatarOpen(true)}
                                            className="absolute top-1 right-1 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors z-10"
                                            title="画像を削除"
                                        >
                                            <LogOut className="w-4 h-4 rotate-180" /> {/* ゴミ箱アイコンの代わり */}
                                        </button>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-4 space-y-8 mt-4 text-center">
                    {/* 名前表示 (閲覧モード) */}
                    {!isEditing && (
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold">{nickname || displayName}</h1>
                            {nickname && <p className="text-sm text-muted-foreground">{displayName}</p>}
                            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2">
                                <Mail className="w-3 h-3" /> {userProfile?.email}
                            </p>
                            <Button variant="outline" size="sm" className="mt-4 rounded-full px-6" onClick={() => setIsEditing(true)}>
                                プロフィールを編集
                            </Button>
                        </div>
                    )}
                </div>

                <div className="px-4 space-y-6 mt-8">
                    {/* 編集フォーム */}
                    {isEditing && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>プロフィール編集</CardTitle>
                                    <CardDescription>あなたの情報を更新します</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="displayName">表示名 <span className="text-destructive">*</span></Label>
                                            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" placeholder="お名前" />
                                            <p className="text-[10px] text-muted-foreground mt-1">基本となる名前です</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="nickname">ニックネーム</Label>
                                            <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="mt-1" placeholder="ニックネーム（省略可）" />
                                            <p className="text-[10px] text-muted-foreground mt-1">アプリ内で優先して表示されます</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
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
                                    </div>

                                    <div>
                                        <Label htmlFor="introduction">自己紹介</Label>
                                        <textarea
                                            id="introduction"
                                            value={introduction}
                                            onChange={(e) => setIntroduction(e.target.value)}
                                            rows={3}
                                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                            placeholder="ペットへの想いや趣味など..."
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t mt-4">
                                        <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>キャンセル</Button>
                                        <Button className="flex-1 gradient-primary" onClick={handleSaveProfile} disabled={isSaving || !displayName.trim()}>
                                            <Save className="w-4 h-4 mr-2" />{isSaving ? '保存中...' : '変更を保存'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* App Settings */}
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base">アプリ設定</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {/* Theme */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-full">
                                        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label htmlFor="dark-mode" className="text-base">ダークモード</Label>
                                        <p className="text-xs text-muted-foreground">画面を暗くして目の負担を軽減</p>
                                    </div>
                                </div>
                                <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
                            </div>

                            {/* Notifications */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-full">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Label htmlFor="daily-summary" className="text-base">デイリーサマリー</Label>
                                        <p className="text-xs text-muted-foreground">毎日の記録まとめを受け取る</p>
                                    </div>
                                </div>
                                <Switch
                                    id="daily-summary"
                                    checked={notifications.dailySummary}
                                    onCheckedChange={(checked) => handleUpdateSettings('notifications', { ...notifications, dailySummary: checked })}
                                />
                            </div>

                            {/* Time Format */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-full">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <Label className="text-base">時刻フォーマット</Label>
                                </div>
                                <Select value={timeFormat} onValueChange={(v) => handleUpdateSettings('timeFormat', v)}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HH:mm">24時間 (13:00)</SelectItem>
                                        <SelectItem value="h:mm aa">12時間 (1:00 PM)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Toast Position */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-full">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <Label className="text-base">通知位置</Label>
                                </div>
                                <Select value={toastPosition} onValueChange={(v) => handleUpdateSettings('toastPosition', v)}>
                                    <SelectTrigger className="w-[140px]">
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

                    {/* ペット一覧 */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2"><PawPrint className="w-4 h-4" />登録ペット</CardTitle>
                                <Link href="/pets/new"><Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">追加</Button></Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {pets.length === 0 ? (
                                <div className="text-center py-6 bg-muted/20 rounded-lg">
                                    <p className="text-muted-foreground mb-2">まだペットが登録されていません</p>
                                    <Link href="/pets/new"><Button size="sm" variant="outline">登録する</Button></Link>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {pets.map((pet) => (
                                        <Link key={pet.id} href={`/pets/settings?id=${pet.id}`}>
                                            <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors shadow-sm">
                                                <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                                                    <AvatarImage src={pet.avatarUrl} alt={pet.name} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/10"><PawPrint className="w-5 h-5 text-primary" /></AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{pet.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{pet.breed || '犬種未設定'}</p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground"><ArrowLeft className="w-4 h-4 rotate-180" /></Button>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* その他リンク */}
                    <div className="space-y-3">
                        <a href="https://aina-life-dev.web.app" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-xl bg-card border shadow-sm hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-full"><Info className="w-4 h-4" /></div>
                                <span className="font-medium text-sm">旧アプリ（aina-life-dev）</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </a>

                        <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-12" onClick={signOut}>
                            <LogOut className="w-4 h-4 mr-2" />ログアウト
                        </Button>
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
                            <DialogTitle>画像を削除</DialogTitle>
                            <DialogDescription>プロフィール画像を削除して初期状態に戻しますか？</DialogDescription>
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
