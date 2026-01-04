'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/features/AppLayout';
import { useMembers } from '@/hooks/useMembers';
import { usePets } from '@/hooks/usePets';
import { useAuth } from '@/contexts/AuthContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { CustomTaskEditor } from '@/components/features/CustomTaskEditor';
import { ImageCropper } from '@/components/ui/image-cropper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserPlus, Crown, Trash2, LogOut, Mail, Clock, Eye, Edit, Camera, Plus, X, CalendarIcon, PawPrint, Settings, Users, AlertTriangle, ListTodo } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MEMBER_ROLES, type MemberRole, type VetInfo } from '@/lib/types';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { deleteField } from 'firebase/firestore';

function PetSettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const petId = searchParams.get('id');

    const { user } = useAuth();
    const { pets, updatePet, deletePet } = usePets();
    const { members, loading, isOwner, canEdit, canManageMembers, inviteMember, updateMemberRole, removeMember, leaveTeam } = useMembers(petId);
    const { uploadPetAvatar, uploading } = useImageUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const pet = pets.find((p) => p.id === petId);

    // 基本情報
    const [petName, setPetName] = useState('');
    const [petBreed, setPetBreed] = useState('');
    const [petBirthday, setPetBirthday] = useState<Date | undefined>(undefined);
    const [petGender, setPetGender] = useState<'male' | 'female' | 'other' | ''>('');
    const [petAdoptionDate, setPetAdoptionDate] = useState<Date | undefined>(undefined);

    // 詳細情報
    const [petMicrochipId, setPetMicrochipId] = useState('');
    const [petMedicalNotes, setPetMedicalNotes] = useState('');
    const [petVetInfo, setPetVetInfo] = useState<VetInfo[]>([]);

    // 画像関連
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [removeAvatar, setRemoveAvatar] = useState(false);

    // 招待
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<MemberRole>('editor');
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (pet) {
            setPetName(pet.name);
            setPetBreed(pet.breed || '');
            setPetBirthday(pet.birthday ? parse(pet.birthday, 'yyyy-MM-dd', new Date()) : undefined);
            setPetGender(pet.gender || '');
            setPetAdoptionDate(pet.adoptionDate ? parse(pet.adoptionDate, 'yyyy-MM-dd', new Date()) : undefined);
            setPetMicrochipId(pet.microchipId || '');
            setPetMedicalNotes(pet.medicalNotes || '');
            setPetVetInfo(pet.vetInfo || []);
        }
    }, [pet]);

    const [cropperOpen, setCropperOpen] = useState(false);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);

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
    };

    const handleUpdatePet = async () => {
        if (!petId || !petName.trim()) {
            toast.error('名前を入力してください');
            return;
        }
        try {
            let avatarUrl: any = pet?.avatarUrl;

            // 画像削除
            if (removeAvatar) {
                avatarUrl = deleteField();
            }
            // 新しい画像をアップロード
            else if (pendingAvatarFile) {
                avatarUrl = await uploadPetAvatar(pendingAvatarFile, petId);
            }

            await updatePet(petId, {
                name: petName.trim(),
                breed: petBreed.trim() || undefined,
                birthday: petBirthday ? format(petBirthday, 'yyyy-MM-dd') : undefined,
                gender: petGender || undefined,
                adoptionDate: petAdoptionDate ? format(petAdoptionDate, 'yyyy-MM-dd') : undefined,
                microchipId: petMicrochipId.trim() || undefined,
                medicalNotes: petMedicalNotes.trim() || undefined,
                vetInfo: petVetInfo.length > 0 ? petVetInfo : undefined,
                avatarUrl,
            });

            // 状態リセット
            setPendingAvatarFile(null);
            setAvatarPreview(null);
            setRemoveAvatar(false);

            toast.success('更新しました');
        } catch {
            toast.error('エラーが発生しました');
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        setIsSubmitting(true);
        try {
            await inviteMember(inviteEmail.trim(), inviteRole, {
                name: petName.trim(), // 現在入力中の名前を使用
                avatarUrl: pet?.avatarUrl,
            });
            toast.success('招待を送信しました');
            setInviteEmail('');
            setInviteRole('editor');
            setIsInviteDialogOpen(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
        try {
            await updateMemberRole(memberId, newRole);
            toast.success('権限を変更しました');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'エラーが発生しました');
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        try {
            await removeMember(memberId);
            toast.success(`${memberName}さんを削除しました`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'エラーが発生しました');
        }
    };

    const handleLeaveTeam = async () => {
        try {
            await leaveTeam();
            toast.success('チームから脱退しました');
            router.push('/dashboard');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'エラーが発生しました');
        }
    };

    const handleDeletePet = async () => {
        if (!petId) return;
        try {
            await deletePet(petId);
            toast.success('ペットを削除しました');
            router.push('/dashboard');
        } catch {
            toast.error('エラーが発生しました');
        }
    };

    const addVetInfo = () => {
        setPetVetInfo([...petVetInfo, { name: '', phone: '' }]);
    };

    const updateVetInfo = (index: number, field: 'name' | 'phone', value: string) => {
        const updated = [...petVetInfo];
        updated[index] = { ...updated[index], [field]: value };
        setPetVetInfo(updated);
    };

    const removeVetInfo = (index: number) => {
        setPetVetInfo(petVetInfo.filter((_, i) => i !== index));
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-amber-500" />;
            case 'editor': return <Edit className="w-4 h-4 text-blue-500" />;
            case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
            default: return null;
        }
    };

    const getRoleLabel = (role: string) => {
        return MEMBER_ROLES.find((r) => r.value === role)?.label || role;
    };

    if (!petId || !pet) {
        return (
            <AppLayout>
                <div className="p-4 text-center py-12">
                    <p className="text-muted-foreground">ペットが見つかりません</p>
                    <Button onClick={() => router.push('/dashboard')} className="mt-4">ダッシュボードに戻る</Button>
                </div>
            </AppLayout>
        );
    }

    // 年齢計算
    const calculateAge = (birthday: string) => {
        const birthDate = new Date(birthday);
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        if (months < 0) {
            years--;
            months += 12;
        }
        return `${years}歳${months}ヶ月`;
    };

    const activeMembers = members.filter((m) => m.status === 'active');
    const pendingMembers = members.filter((m) => m.status === 'pending');

    return (
        <AppLayout>
            <div className="pb-24">
                {/* ヘッダーエリア */}
                <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 pb-8 pt-6 px-4 -mx-4 md:mx-0 md:rounded-b-3xl">
                    <div className="md:container max-w-2xl mx-auto flex flex-col items-center text-center">
                        <div className="relative group mb-4">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                                <AvatarImage src={pet.avatarUrl} alt={pet.name} className="object-cover" />
                                <AvatarFallback className="bg-primary/10"><PawPrint className="w-8 h-8 text-primary" /></AvatarFallback>
                            </Avatar>
                            {canEdit && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                                {pet.name}
                                {pet.gender && (
                                    <span className={cn(
                                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs",
                                        pet.gender === 'male' ? "bg-blue-100 text-blue-600" :
                                            pet.gender === 'female' ? "bg-pink-100 text-pink-600" :
                                                "bg-gray-100 text-gray-600"
                                    )}>
                                        {pet.gender === 'male' ? '♂' : pet.gender === 'female' ? '♀' : '?'}
                                    </span>
                                )}
                            </h1>
                            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                                {pet.breed && <span>{pet.breed}</span>}
                                {pet.birthday && (
                                    <>
                                        <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                                        <span>{calculateAge(pet.birthday)}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Image Cropper Component */}
                        <ImageCropper
                            open={cropperOpen}
                            imageSrc={originalImageSrc}
                            onCropComplete={handleCropComplete}
                            onCancel={handleCropCancel}
                        />
                    </div>
                </div>

                <div className="px-4 md:container max-w-2xl mx-auto mt-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
                        <h1 className="text-xl font-bold">{pet.name}の設定</h1>
                    </div>

                    {canEdit && (avatarPreview || pet.avatarUrl) && !removeAvatar && (
                        <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-8">
                            画像を削除
                        </Button>
                    )}

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="general"><Settings className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">基本</span></TabsTrigger>
                            <TabsTrigger value="custom"><ListTodo className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">カスタム</span></TabsTrigger>
                            <TabsTrigger value="members"><Users className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">メンバー</span></TabsTrigger>
                            <TabsTrigger value="danger"><AlertTriangle className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">その他</span></TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-6">
                            {/* 基本情報 */}
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-base">基本情報</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">名前 <span className="text-destructive">*</span></Label>
                                        <Input id="name" value={petName} onChange={(e) => setPetName(e.target.value)} className="mt-1" disabled={!canEdit} />
                                    </div>
                                    <div>
                                        <Label htmlFor="breed">品種</Label>
                                        <Input id="breed" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="例：柴犬" className="mt-1" disabled={!canEdit} />
                                    </div>
                                    <div>
                                        <Label>性別</Label>
                                        <Select value={petGender} onValueChange={(v) => setPetGender(v as any)} disabled={!canEdit}>
                                            <SelectTrigger className="mt-1"><SelectValue placeholder="選択してください" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">オス ♂</SelectItem>
                                                <SelectItem value="female">メス ♀</SelectItem>
                                                <SelectItem value="other">その他</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>誕生日</Label>
                                        <div className="relative">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" disabled={!canEdit} className={cn('w-full mt-1 justify-start text-left font-normal pr-10', !petBirthday && 'text-muted-foreground')}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {petBirthday ? format(petBirthday, 'yyyy年M月d日', { locale: ja }) : '選択してください'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={petBirthday} onSelect={setPetBirthday} locale={ja} captionLayout="dropdown" disabled={(date) => date > new Date()} />
                                                </PopoverContent>
                                            </Popover>
                                            {canEdit && petBirthday && (
                                                <div className="absolute right-1 top-1 bottom-0 mt-1 flex items-center">
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setPetBirthday(undefined); }}><X className="w-4 h-4" /></Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label>お迎え日</Label>
                                        <div className="relative">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" disabled={!canEdit} className={cn('w-full mt-1 justify-start text-left font-normal pr-10', !petAdoptionDate && 'text-muted-foreground')}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {petAdoptionDate ? format(petAdoptionDate, 'yyyy年M月d日', { locale: ja }) : '選択してください'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={petAdoptionDate} onSelect={setPetAdoptionDate} locale={ja} captionLayout="dropdown" disabled={(date) => date > new Date()} />
                                                </PopoverContent>
                                            </Popover>
                                            {canEdit && petAdoptionDate && (
                                                <div className="absolute right-1 top-1 bottom-0 mt-1 flex items-center">
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setPetAdoptionDate(undefined); }}><X className="w-4 h-4" /></Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 詳細情報 */}
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-base">医療・その他</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="microchipId">マイクロチップID</Label>
                                        <Input id="microchipId" value={petMicrochipId} onChange={(e) => setPetMicrochipId(e.target.value)} placeholder="15桁の番号" className="mt-1" disabled={!canEdit} />
                                    </div>
                                    <div>
                                        <Label htmlFor="medicalNotes">医療メモ</Label>
                                        <textarea
                                            id="medicalNotes"
                                            value={petMedicalNotes}
                                            onChange={(e) => setPetMedicalNotes(e.target.value)}
                                            placeholder="アレルギー、持病、服用中の薬など"
                                            rows={3}
                                            disabled={!canEdit}
                                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label>かかりつけ獣医</Label>
                                            {canEdit && <Button type="button" variant="outline" size="sm" onClick={addVetInfo}><Plus className="w-3 h-3 mr-1" />追加</Button>}
                                        </div>
                                        {petVetInfo.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center py-2 border rounded-md border-dashed">登録なし</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {petVetInfo.map((vet, index) => (
                                                    <div key={index} className="flex gap-2 items-end">
                                                        <div className="flex-1">
                                                            <Input value={vet.name} onChange={(e) => updateVetInfo(index, 'name', e.target.value)} placeholder="病院名" className="text-sm h-9" disabled={!canEdit} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <Input value={vet.phone || ''} onChange={(e) => updateVetInfo(index, 'phone', e.target.value)} placeholder="電話番号" className="text-sm h-9" disabled={!canEdit} />
                                                        </div>
                                                        {canEdit && (
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeVetInfo(index)} className="h-9 w-9 text-muted-foreground hover:text-destructive">
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {canEdit && (
                                <div className="sticky bottom-20 z-10">
                                    <Button onClick={handleUpdatePet} className="w-full shadow-lg gradient-primary h-12 text-base font-medium">変更を保存</Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="custom">
                            <CustomTaskEditor petId={petId} canEdit={canEdit} />
                        </TabsContent>

                        <TabsContent value="members" className="space-y-6">
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div><CardTitle className="text-base">メンバーリスト</CardTitle><CardDescription className="text-sm">共有メンバーの管理</CardDescription></div>
                                        {canManageMembers && (
                                            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" className="gap-1 gradient-primary"><UserPlus className="w-3 h-3" />招待</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>メンバーを招待</DialogTitle>
                                                        <DialogDescription>招待したい人のメールアドレスと権限を選択してください。</DialogDescription>
                                                    </DialogHeader>
                                                    <form onSubmit={handleInvite} className="space-y-4 pt-4">
                                                        <div>
                                                            <Label htmlFor="invite-email">メールアドレス</Label>
                                                            <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="example@gmail.com" className="mt-1" autoComplete="email" />
                                                        </div>
                                                        <div>
                                                            <Label>権限</Label>
                                                            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as MemberRole)}>
                                                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {MEMBER_ROLES.filter((r) => r.value !== 'owner').map((role) => (
                                                                        <SelectItem key={role.value} value={role.value}>
                                                                            <div className="flex items-center gap-2">{getRoleIcon(role.value)}<span>{role.label}</span></div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <p className="text-xs text-muted-foreground mt-1">{MEMBER_ROLES.find((r) => r.value === inviteRole)?.description}</p>
                                                        </div>
                                                        <Button type="submit" disabled={isSubmitting || !inviteEmail.trim()} className="w-full gradient-primary">{isSubmitting ? '送信中...' : '招待を送信'}</Button>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {activeMembers.map((member) => (
                                                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-card border shadow-sm">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                                        <Avatar className="w-10 h-10 flex-shrink-0">
                                                            <AvatarImage src={member.userProfile?.avatarUrl} alt={member.userProfile?.displayName} />
                                                            <AvatarFallback className="bg-primary/10">{getRoleIcon(member.role)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium flex items-center gap-2 flex-wrap text-sm">
                                                                <span className="break-all">
                                                                    {member.userId === user?.uid
                                                                        ? `あなた (${member.userProfile?.nickname || member.userProfile?.displayName || '未設定'})`
                                                                        : (member.userProfile?.nickname || member.userProfile?.displayName || member.inviteEmail || 'メンバー')}
                                                                </span>
                                                                <span className={cn('text-[10px] px-1.5 py-0.5 rounded flex-shrink-0', member.role === 'owner' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : member.role === 'editor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300')}>
                                                                    {getRoleLabel(member.role)}
                                                                </span>
                                                            </p>
                                                            <p className="text-xs text-muted-foreground break-all">{member.inviteEmail}</p>
                                                        </div>
                                                    </div>
                                                    {canManageMembers && member.userId !== user?.uid && (
                                                        <div className="flex gap-1 flex-shrink-0">
                                                            <Select value={member.role} onValueChange={(v) => handleRoleChange(member.id, v as MemberRole)}>
                                                                <SelectTrigger className="w-[100px] h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {MEMBER_ROLES.map((role) => (
                                                                        <SelectItem key={role.value} value={role.value}>
                                                                            <div className="flex items-center gap-2">{getRoleIcon(role.value)}<span>{role.label}</span></div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            {member.role !== 'owner' && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader><AlertDialogTitle>メンバーを削除</AlertDialogTitle><AlertDialogDescription>このメンバーを削除しますか？</AlertDialogDescription></AlertDialogHeader>
                                                                        <AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveMember(member.id, member.inviteEmail || 'メンバー')} className="bg-destructive text-destructive-foreground">削除</AlertDialogAction></AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {pendingMembers.length > 0 && (
                                                <>
                                                    <p className="text-xs font-semibold text-muted-foreground pt-2">招待中</p>
                                                    {pendingMembers.map((member) => (
                                                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-dashed">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Mail className="w-4 h-4 text-muted-foreground" /></div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="font-medium text-muted-foreground flex items-center gap-2 flex-wrap text-sm">
                                                                        <span className="break-all">{member.inviteEmail}</span>
                                                                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded flex-shrink-0">{getRoleLabel(member.role)}</span>
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />承認待ち</p>
                                                                </div>
                                                            </div>
                                                            {canManageMembers && <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id, member.inviteEmail || '')} className="text-muted-foreground hover:text-destructive flex-shrink-0"><Trash2 className="w-4 h-4" /></Button>}
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="danger" className="space-y-4">
                            <Card className="border-destructive/50">
                                <CardHeader className="pb-2"><CardTitle className="text-base text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> 危険な操作</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground mb-4">これらの操作は取り消すことができません。</p>

                                    {isOwner && !activeMembers.some(m => m.userId !== user?.uid && m.role === 'owner') && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="outline" className="w-full text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/50 hover:bg-destructive/10"><LogOut className="w-4 h-4 mr-2" />チームから脱退</Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>チームから脱退</AlertDialogTitle><AlertDialogDescription>オーナーとして脱退する前に、他のメンバーをオーナーに設定してください。</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>閉じる</AlertDialogCancel></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                    {(!isOwner || activeMembers.some(m => m.userId !== user?.uid && m.role === 'owner')) && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="outline" className="w-full text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/50 hover:bg-destructive/10"><LogOut className="w-4 h-4 mr-2" />チームから脱退</Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>チームから脱退</AlertDialogTitle><AlertDialogDescription>本当にこのペットのチームから脱退しますか？</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction onClick={handleLeaveTeam} className="bg-destructive text-destructive-foreground">脱退する</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                    {isOwner && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="outline" className="w-full text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/50 hover:bg-destructive/10"><Trash2 className="w-4 h-4 mr-2" />ペットを削除</Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>ペットを削除</AlertDialogTitle><AlertDialogDescription>本当に {pet.name} を削除しますか？すべてのデータが削除されます。</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction onClick={handleDeletePet} className="bg-destructive text-destructive-foreground">削除する</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
                <ImageCropper
                    open={cropperOpen}
                    imageSrc={originalImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            </div>
        </AppLayout>
    );
}

export default function PetSettingsPage() {
    return (
        <Suspense fallback={<AppLayout><div className="p-4 text-center py-12">読み込み中...</div></AppLayout>}>
            <PetSettingsContent />
        </Suspense>
    );
}
