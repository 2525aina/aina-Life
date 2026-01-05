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
import { DatePickerDropdown } from '@/components/ui/date-picker-dropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserPlus, Crown, Trash2, LogOut, Mail, Clock, Eye, Edit, Camera, Plus, X, CalendarIcon, PawPrint, Settings, Users, AlertTriangle, ListTodo, Shield, Info, Phone } from 'lucide-react';
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
    const [confirmDeleteAvatarOpen, setConfirmDeleteAvatarOpen] = useState(false);

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
        setConfirmDeleteAvatarOpen(false);
    };

    const handleUpdatePet = async () => {
        if (!petId || !petName.trim()) {
            toast.error('名前を入力してください');
            return;
        }
        try {
            let avatarUrl: any = pet?.avatarUrl;

            if (removeAvatar) {
                avatarUrl = deleteField();
            } else if (pendingAvatarFile) {
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
                name: petName.trim(),
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
                <div className="p-4 text-center py-24 flex flex-col items-center justify-center">
                    <PawPrint className="w-16 h-16 text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground mb-4">ペット情報が見つかりません</p>
                    <Button onClick={() => router.push('/dashboard')} variant="outline">ダッシュボードに戻る</Button>
                </div>
            </AppLayout>
        );
    }

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
    const displayAvatar = avatarPreview || pet.avatarUrl;

    return (
        <AppLayout>
            <div className="pb-32 min-h-screen">
                {/* Modern Header Section */}
                <div className="relative">
                    <div className="absolute inset-0 h-[40vh] bg-gradient-to-b from-primary/10 via-orange-400/5 to-transparent -z-10 rounded-b-[4rem]" />

                    <div className="md:container max-w-2xl mx-auto px-4 pt-6">
                        {/* Navigation */}
                        <div className="flex items-center gap-3 mb-6">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors" onClick={() => router.back()}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Pet Identity */}
                        <div className="flex flex-col items-center mb-10">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative group mb-6"
                            >
                                <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-orange-400 rounded-full opacity-30 blur-2xl group-hover:opacity-40 transition duration-1000 animate-pulse" />
                                <div className="relative">
                                    <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white/50 dark:border-white/10 shadow-2xl relative z-10">
                                        <AvatarImage src={displayAvatar} alt={pet.name} className="object-cover" />
                                        <AvatarFallback className="bg-primary/10 text-primary-foreground/50"><PawPrint className="w-16 h-16" /></AvatarFallback>
                                    </Avatar>

                                    {canEdit && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="absolute bottom-1 right-1 w-12 h-12 rounded-full gradient-primary text-white flex items-center justify-center shadow-lg border-4 border-background z-20"
                                        >
                                            <Camera className="w-5 h-5" />
                                        </motion.button>
                                    )}
                                </div>

                                {canEdit && (avatarPreview || pet.avatarUrl) && !removeAvatar && (
                                    <button
                                        onClick={() => setConfirmDeleteAvatarOpen(true)}
                                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-destructive/90 text-white flex items-center justify-center shadow-md border-2 border-background z-20 hover:scale-110 transition-transform"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </motion.div>

                            <div className="text-center space-y-4">
                                <h1 className="text-4xl font-black tracking-tight text-foreground/90 flex items-center justify-center gap-3">
                                    {pet.name}
                                    {pet.gender && (
                                        <span className={cn(
                                            "inline-flex items-center justify-center w-8 h-8 rounded-full text-base shadow-inner",
                                            pet.gender === 'male' ? "bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                                pet.gender === 'female' ? "bg-pink-100/50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" :
                                                    "bg-gray-100/50 text-gray-600"
                                        )}>
                                            {pet.gender === 'male' ? '♂' : pet.gender === 'female' ? '♀' : '?'}
                                        </span>
                                    )}
                                </h1>
                                <div className="glass-capsule inline-flex items-center gap-3 px-6 py-2 shadow-sm">
                                    <span className="font-bold text-sm text-foreground/80">{pet.breed || '犬種未設定'}</span>
                                    {pet.birthday && (
                                        <>
                                            <span className="w-1 h-1 bg-foreground/20 rounded-full" />
                                            <span className="text-sm font-medium text-muted-foreground">{calculateAge(pet.birthday)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content Tabs */}
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="glass-capsule w-full p-1.5 rounded-full mb-8 shadow-lg flex">
                                <TabsTrigger value="general" className="flex-1 rounded-full text-xs md:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg h-10 md:h-12 transition-all"><Settings className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">基本</span></TabsTrigger>
                                <TabsTrigger value="custom" className="flex-1 rounded-full text-xs md:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg h-10 md:h-12 transition-all"><ListTodo className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">タスク</span></TabsTrigger>
                                <TabsTrigger value="members" className="flex-1 rounded-full text-xs md:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg h-10 md:h-12 transition-all"><Users className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">共有</span></TabsTrigger>
                                <TabsTrigger value="danger" className="flex-1 rounded-full text-xs md:text-sm font-bold data-[state=active]:bg-destructive data-[state=active]:text-white data-[state=active]:shadow-lg h-10 md:h-12 transition-all"><Shield className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">高度</span></TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <div className="glass rounded-[2.5rem] p-8 shadow-xl space-y-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1 h-4 bg-primary rounded-full" />
                                            <h3 className="font-bold text-lg text-foreground/80">基本情報</h3>
                                        </div>
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground ml-1">名前</Label>
                                                <Input id="name" value={petName} onChange={(e) => setPetName(e.target.value)} className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20" disabled={!canEdit} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="breed" className="text-xs font-bold text-muted-foreground ml-1">品種</Label>
                                                <Input id="breed" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="例：柴犬" className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20" disabled={!canEdit} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground ml-1">性別</Label>
                                            <Select value={petGender} onValueChange={(v) => setPetGender(v as any)} disabled={!canEdit}>
                                                <SelectTrigger className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20"><SelectValue placeholder="選択" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">オス ♂</SelectItem>
                                                    <SelectItem value="female">メス ♀</SelectItem>
                                                    <SelectItem value="other">その他</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <DatePickerDropdown
                                            label="誕生日"
                                            date={petBirthday}
                                            setDate={setPetBirthday}
                                            disabled={!canEdit}
                                        />
                                    </div>

                                    <DatePickerDropdown
                                        label="お迎え日"
                                        date={petAdoptionDate}
                                        setDate={setPetAdoptionDate}
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="glass rounded-[2.5rem] p-8 shadow-xl space-y-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-4 bg-primary rounded-full" />
                                        <h3 className="font-bold text-lg text-foreground/80">医療・その他</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="microchipId" className="text-xs font-bold text-muted-foreground ml-1">マイクロチップID</Label>
                                        <Input id="microchipId" value={petMicrochipId} onChange={(e) => setPetMicrochipId(e.target.value)} placeholder="15桁の番号" className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20" disabled={!canEdit} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="medicalNotes" className="text-xs font-bold text-muted-foreground ml-1">医療メモ</Label>
                                        <textarea
                                            id="medicalNotes"
                                            value={petMedicalNotes}
                                            onChange={(e) => setPetMedicalNotes(e.target.value)}
                                            placeholder="アレルギー、持病、服薬情報など..."
                                            rows={3}
                                            disabled={!canEdit}
                                            className="w-full rounded-xl border border-white/20 bg-white/50 dark:bg-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-muted-foreground ml-1">かかりつけ動物病院</Label>
                                            {canEdit && <Button type="button" variant="ghost" size="sm" onClick={addVetInfo} className="h-8 text-xs text-primary rounded-full hover:bg-primary/10"><Plus className="w-3 h-3 mr-1" />追加</Button>}
                                        </div>

                                        {petVetInfo.length === 0 ? (
                                            <div className="text-xs text-muted-foreground text-center py-6 border-2 border-dashed border-white/20 rounded-xl bg-muted/10">
                                                登録された病院はありません
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {petVetInfo.map((vet, index) => (
                                                    <div key={index} className="flex gap-3 items-start p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/10">
                                                        <div className="grid gap-2 flex-1">
                                                            <Input value={vet.name} onChange={(e) => updateVetInfo(index, 'name', e.target.value)} placeholder="病院名" className="h-10 rounded-lg bg-transparent border-white/20" disabled={!canEdit} />
                                                            <Input value={vet.phone || ''} onChange={(e) => updateVetInfo(index, 'phone', e.target.value)} placeholder="電話番号" className="h-10 rounded-lg bg-transparent border-white/20" disabled={!canEdit} />
                                                        </div>
                                                        {canEdit && (
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeVetInfo(index)} className="h-10 w-10 text-muted-foreground hover:text-destructive rounded-full shrink-0">
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {canEdit && (
                                    <div className="sticky bottom-8 z-20 mx-auto max-w-sm px-4">
                                        <Button onClick={handleUpdatePet} className="w-full shadow-2xl gradient-primary h-14 text-base font-bold rounded-full hover:scale-105 transition-transform">
                                            変更を保存
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="custom" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <CustomTaskEditor petId={petId} canEdit={canEdit} />
                            </TabsContent>

                            <TabsContent value="members" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <div className="glass rounded-[2.5rem] p-8 shadow-xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-1 h-4 bg-primary rounded-full" />
                                                <h3 className="font-bold text-lg text-foreground/80">共有メンバー</h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground ml-3">家族やパートナーと情報を共有</p>
                                        </div>
                                        {canManageMembers && (
                                            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" className="gap-1 gradient-primary shadow-lg rounded-full px-4"><UserPlus className="w-4 h-4" /> 招待</Button>
                                                </DialogTrigger>
                                                <DialogContent className="glass border-white/20 rounded-[2rem]">
                                                    <DialogHeader>
                                                        <DialogTitle>メンバーを招待</DialogTitle>
                                                        <DialogDescription>招待したい人のメールアドレスを入力してください。</DialogDescription>
                                                    </DialogHeader>
                                                    <form onSubmit={handleInvite} className="space-y-4 pt-4">
                                                        <div>
                                                            <Label htmlFor="invite-email" className="ml-1 text-xs">メールアドレス</Label>
                                                            <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="example@gmail.com" className="mt-1 h-12 rounded-xl bg-white/50 border-white/20" autoComplete="email" />
                                                        </div>
                                                        <div>
                                                            <Label className="ml-1 text-xs">権限設定</Label>
                                                            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as MemberRole)}>
                                                                <SelectTrigger className="mt-1 h-12 rounded-xl bg-white/50 border-white/20"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {MEMBER_ROLES.filter((r) => r.value !== 'owner').map((role) => (
                                                                        <SelectItem key={role.value} value={role.value}>
                                                                            <div className="flex items-center gap-2">{getRoleIcon(role.value)}<span>{role.label}</span></div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <Button type="submit" disabled={isSubmitting || !inviteEmail.trim()} className="w-full gradient-primary h-12 rounded-xl font-bold">{isSubmitting ? '送信中...' : '招待状を送る'}</Button>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {loading ? (
                                            <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-2xl" />)}</div>
                                        ) : (
                                            <>
                                                {activeMembers.map((member) => (
                                                    <div key={member.id} className="flex items-center p-4 rounded-2xl glass hover:bg-white/40 border-white/10 transition-colors gap-4">
                                                        <Avatar className="w-12 h-12 flex-shrink-0 border-2 border-white/20 shadow-sm">
                                                            <AvatarImage src={member.userProfile?.avatarUrl} alt={member.userProfile?.displayName} />
                                                            <AvatarFallback className="bg-primary/10">{getRoleIcon(member.role)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-bold text-sm truncate max-w-[120px]">
                                                                    {member.userId === user?.uid
                                                                        ? `あなた`
                                                                        : (member.userProfile?.nickname || member.userProfile?.displayName || '未登録ユーザー')}
                                                                </span>
                                                                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold border',
                                                                    member.role === 'owner' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                                        member.role === 'editor' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                                            'bg-gray-500/10 text-gray-600 border-gray-500/20')}>
                                                                    {getRoleLabel(member.role)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground truncate opacity-70">{member.inviteEmail}</p>

                                                            {canManageMembers && member.userId !== user?.uid && (
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <Select value={member.role} onValueChange={(v) => handleRoleChange(member.id, v as MemberRole)}>
                                                                        <SelectTrigger className="h-8 text-xs bg-white/20 border-white/20 rounded-lg w-auto min-w-[100px]"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            {MEMBER_ROLES.map((role) => (
                                                                                <SelectItem key={role.value} value={role.value}>
                                                                                    <div className="flex items-center gap-2">{getRoleIcon(role.value)}<span className="text-xs">{role.label}</span></div>
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {member.role !== 'owner' && (
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                                                            <AlertDialogContent className="glass border-white/20 rounded-[2rem]">
                                                                                <AlertDialogHeader><AlertDialogTitle>メンバーを削除</AlertDialogTitle><AlertDialogDescription>この操作を行うと、このメンバーは情報にアクセスできなくなります。</AlertDialogDescription></AlertDialogHeader>
                                                                                <AlertDialogFooter><AlertDialogCancel className="rounded-full">キャンセル</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveMember(member.id, member.inviteEmail || 'メンバー')} className="bg-destructive text-destructive-foreground rounded-full">削除する</AlertDialogAction></AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {pendingMembers.length > 0 && (
                                                    <div className="mt-8">
                                                        <p className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-2 opacity-70 ml-2"><Clock className="w-3 h-3" /> 招待中</p>
                                                        <div className="space-y-3">
                                                            {pendingMembers.map((member) => (
                                                                <div key={member.id} className="flex items-center p-3 rounded-2xl bg-muted/10 border border-white/10 gap-4 opacity-70">
                                                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><Mail className="w-4 h-4 text-muted-foreground" /></div>
                                                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-sm truncate">{member.inviteEmail}</span>
                                                                            <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded-full">{getRoleLabel(member.role)}</span>
                                                                        </div>
                                                                        {canManageMembers && (
                                                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id, member.inviteEmail || '')} className="text-xs h-7 justify-start px-0 text-muted-foreground hover:text-destructive w-fit"><Trash2 className="w-3 h-3 mr-1" />招待を取り消す</Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="danger" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <div className="glass rounded-[2.5rem] p-8 shadow-xl border-destructive/20 overflow-hidden">
                                    <div className="flex items-center gap-2 mb-6 text-destructive">
                                        <AlertTriangle className="w-5 h-5" />
                                        <h3 className="font-bold text-lg">危険な操作</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground bg-destructive/5 p-4 rounded-xl border border-destructive/10 mb-6">
                                        これらの操作は取り消すことができません。慎重に操作してください。
                                    </p>

                                    <div className="space-y-4">
                                        {/* Danger actions with consistent styling */}
                                        {(!isOwner || activeMembers.some(m => m.userId !== user?.uid && m.role === 'owner')) && (
                                            <div className="flex items-center justify-between p-4 rounded-2xl border border-dotted border-destructive/30 hover:bg-destructive/5 transition-colors">
                                                <div>
                                                    <h4 className="font-bold text-sm text-destructive">チームから脱退</h4>
                                                    <p className="text-xs text-muted-foreground mt-1">このペットの共有メンバーから抜けます。</p>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="rounded-full">脱退する</Button></AlertDialogTrigger>
                                                    <AlertDialogContent className="glass border-white/20 rounded-[2rem]">
                                                        <AlertDialogHeader><AlertDialogTitle>チームから脱退</AlertDialogTitle><AlertDialogDescription>本当にこのペットのチームから脱退しますか？</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel className="rounded-full">キャンセル</AlertDialogCancel><AlertDialogAction onClick={handleLeaveTeam} className="bg-destructive text-destructive-foreground rounded-full">脱退する</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                        {isOwner && (
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-destructive/5 border border-destructive/20">
                                                <div>
                                                    <h4 className="font-bold text-sm text-destructive">ペットを削除</h4>
                                                    <p className="text-xs text-destructive/70 mt-1">すべてのデータが永久に削除されます。</p>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="rounded-full">削除する</Button></AlertDialogTrigger>
                                                    <AlertDialogContent className="glass border-white/20 rounded-[2rem]">
                                                        <AlertDialogHeader><AlertDialogTitle>ペットを削除</AlertDialogTitle><AlertDialogDescription>本当に {pet.name} を削除しますか？この操作は取り消せません。</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel className="rounded-full">キャンセル</AlertDialogCancel><AlertDialogAction onClick={handleDeletePet} className="bg-destructive text-destructive-foreground rounded-full">削除する</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <ImageCropper
                    open={cropperOpen}
                    imageSrc={originalImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />

                <Dialog open={confirmDeleteAvatarOpen} onOpenChange={setConfirmDeleteAvatarOpen}>
                    <DialogContent className="glass border-white/20 rounded-[2rem]">
                        <DialogHeader>
                            <DialogTitle>画像を削除しますか？</DialogTitle>
                            <DialogDescription>ペットのプロフィール画像が初期状態に戻ります。</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setConfirmDeleteAvatarOpen(false)} className="rounded-full">キャンセル</Button>
                            <Button variant="destructive" onClick={handleRemoveAvatar} className="rounded-full">削除する</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

export default function PetSettingsPage() {
    return (
        <Suspense fallback={<AppLayout><div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div></AppLayout>}>
            <PetSettingsContent />
        </Suspense>
    );
}
