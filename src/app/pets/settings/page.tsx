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
            <div className="pb-32">
                {/* Modern Header Section */}
                <div className="relative">
                    <div className="absolute inset-0 h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent -z-10" />

                    <div className="md:container max-w-2xl mx-auto px-4 pt-6">
                        {/* Navigation */}
                        <div className="flex items-center gap-3 mb-6">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-background/80" onClick={() => router.back()}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <span className="text-sm font-medium text-muted-foreground">戻る</span>
                        </div>

                        {/* Pet Identity */}
                        <div className="flex flex-col items-center mb-10">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative group mb-4"
                            >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full opacity-30 blur group-hover:opacity-50 transition duration-500"></div>
                                <Avatar className="w-32 h-32 border-4 border-background shadow-2xl relative">
                                    <AvatarImage src={displayAvatar} alt={pet.name} className="object-cover" />
                                    <AvatarFallback className="bg-primary/10"><PawPrint className="w-12 h-12 text-primary" /></AvatarFallback>
                                </Avatar>
                                {canEdit && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-background z-10"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </motion.button>
                                )}
                                {canEdit && (avatarPreview || pet.avatarUrl) && !removeAvatar && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setConfirmDeleteAvatarOpen(true)}
                                        className="absolute top-0 right-0 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg border-2 border-background z-10"
                                        title="画像を削除"
                                    >
                                        <X className="w-4 h-4" />
                                    </motion.button>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </motion.div>

                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                                    {pet.name}
                                    {pet.gender && (
                                        <span className={cn(
                                            "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs shadow-sm",
                                            pet.gender === 'male' ? "bg-blue-100 text-blue-600" :
                                                pet.gender === 'female' ? "bg-pink-100 text-pink-600" :
                                                    "bg-gray-100 text-gray-600"
                                        )}>
                                            {pet.gender === 'male' ? '♂' : pet.gender === 'female' ? '♀' : '?'}
                                        </span>
                                    )}
                                </h1>
                                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground bg-muted/40 py-1.5 px-4 rounded-full inline-block backdrop-blur-sm border border-white/20">
                                    <span>{pet.breed || '犬種未設定'}</span>
                                    {pet.birthday && (
                                        <>
                                            <span className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
                                            <span>{calculateAge(pet.birthday)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content Tabs */}
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 mb-8 bg-muted/50 p-1 rounded-xl">
                                <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">基本</span></TabsTrigger>
                                <TabsTrigger value="custom" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><ListTodo className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">タスク</span></TabsTrigger>
                                <TabsTrigger value="members" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">共有</span></TabsTrigger>
                                <TabsTrigger value="danger" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-destructive data-[state=active]:shadow-sm"><Shield className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">高度</span></TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <Card className="border-none shadow-md">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> 基本情報</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <Label htmlFor="name" className="text-xs text-muted-foreground ml-1">名前 <span className="text-destructive">*</span></Label>
                                                <Input id="name" value={petName} onChange={(e) => setPetName(e.target.value)} className="mt-1 bg-muted/30" disabled={!canEdit} />
                                            </div>
                                            <div>
                                                <Label htmlFor="breed" className="text-xs text-muted-foreground ml-1">品種</Label>
                                                <Input id="breed" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="例：柴犬" className="mt-1 bg-muted/30" disabled={!canEdit} />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <Label className="text-xs text-muted-foreground ml-1">性別</Label>
                                                <Select value={petGender} onValueChange={(v) => setPetGender(v as any)} disabled={!canEdit}>
                                                    <SelectTrigger className="mt-1 bg-muted/30"><SelectValue placeholder="選択" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">オス ♂</SelectItem>
                                                        <SelectItem value="female">メス ♀</SelectItem>
                                                        <SelectItem value="other">その他</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground ml-1">誕生日</Label>
                                                <div className="relative">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" disabled={!canEdit} className={cn('w-full mt-1 justify-start text-left font-normal pr-10 bg-muted/30 border-input shadow-sm', !petBirthday && 'text-muted-foreground')}>
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {petBirthday ? format(petBirthday, 'yyyy/MM/dd') : '選択'}
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
                                        </div>

                                        <div>
                                            <Label className="text-xs text-muted-foreground ml-1">お迎え日</Label>
                                            <div className="relative">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" disabled={!canEdit} className={cn('w-full mt-1 justify-start text-left font-normal pr-10 bg-muted/30 border-input shadow-sm', !petAdoptionDate && 'text-muted-foreground')}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {petAdoptionDate ? format(petAdoptionDate, 'yyyy/MM/dd') : '選択'}
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

                                <Card className="border-none shadow-md">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> 医療・その他</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="microchipId" className="text-xs text-muted-foreground ml-1">マイクロチップID</Label>
                                            <Input id="microchipId" value={petMicrochipId} onChange={(e) => setPetMicrochipId(e.target.value)} placeholder="15桁の番号" className="mt-1 bg-muted/30" disabled={!canEdit} />
                                        </div>
                                        <div>
                                            <Label htmlFor="medicalNotes" className="text-xs text-muted-foreground ml-1">医療メモ</Label>
                                            <textarea
                                                id="medicalNotes"
                                                value={petMedicalNotes}
                                                onChange={(e) => setPetMedicalNotes(e.target.value)}
                                                placeholder="アレルギー、持病、服薬情報など..."
                                                rows={3}
                                                disabled={!canEdit}
                                                className="mt-1 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs text-muted-foreground ml-1">かかりつけ動物病院</Label>
                                                {canEdit && <Button type="button" variant="ghost" size="sm" onClick={addVetInfo} className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"><Plus className="w-3 h-3 mr-1" />追加</Button>}
                                            </div>

                                            {petVetInfo.length === 0 ? (
                                                <div className="text-xs text-muted-foreground text-center py-4 border rounded-lg border-dashed bg-muted/30">
                                                    登録された病院はありません
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {petVetInfo.map((vet, index) => (
                                                        <div key={index} className="flex gap-2 items-start p-2 rounded-lg bg-muted/20 border">
                                                            <div className="grid gap-2 flex-1">
                                                                <Input value={vet.name} onChange={(e) => updateVetInfo(index, 'name', e.target.value)} placeholder="病院名" className="text-sm h-8 bg-white/50" disabled={!canEdit} />
                                                                <Input value={vet.phone || ''} onChange={(e) => updateVetInfo(index, 'phone', e.target.value)} placeholder="電話番号" className="text-sm h-8 bg-white/50" disabled={!canEdit} />
                                                            </div>
                                                            {canEdit && (
                                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeVetInfo(index)} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
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
                                    <div className="sticky bottom-4 z-20 mx-auto max-w-sm">
                                        <Button onClick={handleUpdatePet} className="w-full shadow-xl gradient-primary h-12 text-base font-medium rounded-full">
                                            変更を保存
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="custom" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <CustomTaskEditor petId={petId} canEdit={canEdit} />
                            </TabsContent>

                            <TabsContent value="members" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <Card className="border-none shadow-md">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> 共有メンバー</CardTitle>
                                                <CardDescription className="text-xs mt-1">家族やパートナーと情報を共有</CardDescription>
                                            </div>
                                            {canManageMembers && (
                                                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" className="gap-1 gradient-primary shadow-sm rounded-full"><UserPlus className="w-3 h-3" /> 招待</Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>メンバーを招待</DialogTitle>
                                                            <DialogDescription>招待したい人のメールアドレスを入力してください。</DialogDescription>
                                                        </DialogHeader>
                                                        <form onSubmit={handleInvite} className="space-y-4 pt-4">
                                                            <div>
                                                                <Label htmlFor="invite-email">メールアドレス</Label>
                                                                <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="example@gmail.com" className="mt-1" autoComplete="email" />
                                                            </div>
                                                            <div>
                                                                <Label>権限設定</Label>
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
                                                                <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">{MEMBER_ROLES.find((r) => r.value === inviteRole)?.description}</p>
                                                            </div>
                                                            <Button type="submit" disabled={isSubmitting || !inviteEmail.trim()} className="w-full gradient-primary">{isSubmitting ? '送信中...' : '招待状を送る'}</Button>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {activeMembers.map((member) => (
                                                    <div key={member.id} className="flex items-center p-3 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all gap-4">
                                                        <Avatar className="w-12 h-12 flex-shrink-0 border-2 border-background">
                                                            <AvatarImage src={member.userProfile?.avatarUrl} alt={member.userProfile?.displayName} />
                                                            <AvatarFallback className="bg-primary/10">{getRoleIcon(member.role)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                <p className="font-bold text-sm break-all">
                                                                    {member.userId === user?.uid
                                                                        ? `あなた`
                                                                        : (member.userProfile?.nickname || member.userProfile?.displayName || '未登録ユーザー')}
                                                                </p>
                                                                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', member.role === 'owner' ? 'bg-amber-100 text-amber-700' : member.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}>
                                                                    {getRoleLabel(member.role)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground break-all leading-tight">{member.inviteEmail}</p>

                                                            {canManageMembers && member.userId !== user?.uid && (
                                                                <div className="flex items-center gap-2 w-full pt-1">
                                                                    <Select value={member.role} onValueChange={(v) => handleRoleChange(member.id, v as MemberRole)}>
                                                                        <SelectTrigger className="w-full h-8 text-xs px-3 bg-muted/50 border-none shrink-0"><SelectValue /></SelectTrigger>
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
                                                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader><AlertDialogTitle>メンバーを削除</AlertDialogTitle><AlertDialogDescription>この操作を行うと、このメンバーは情報にアクセスできなくなります。</AlertDialogDescription></AlertDialogHeader>
                                                                                <AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveMember(member.id, member.inviteEmail || 'メンバー')} className="bg-destructive text-destructive-foreground">削除する</AlertDialogAction></AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {pendingMembers.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t">
                                                        <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1"><Clock className="w-3 h-3" /> 招待中</p>
                                                        <div className="space-y-2">
                                                            {pendingMembers.map((member) => (
                                                                <div key={member.id} className="flex items-center p-3 rounded-lg bg-muted/30 border border-dashed gap-4">
                                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 border"><Mail className="w-4 h-4 text-muted-foreground" /></div>
                                                                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                            <p className="font-medium text-sm break-all">{member.inviteEmail}</p>
                                                                            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border text-muted-foreground">{getRoleLabel(member.role)}</span>
                                                                        </div>
                                                                        {canManageMembers && (
                                                                            <div className="flex justify-start w-full pt-1">
                                                                                <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id, member.inviteEmail || '')} className="text-muted-foreground hover:text-destructive h-8 px-2 -ml-2"><Trash2 className="w-3 h-3 mr-1" />招待を取り消す</Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="danger" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                                <Card className="border-destructive/30 shadow-sm overflow-hidden">
                                    <div className="h-2 bg-destructive/20 w-full" />
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> 危険な操作</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-2">
                                        <p className="text-sm text-muted-foreground bg-destructive/5 p-3 rounded-md border border-destructive/10">
                                            これらの操作は取り消すことができません。慎重に操作してください。
                                        </p>

                                        {isOwner && !activeMembers.some(m => m.userId !== user?.uid && m.role === 'owner') && (
                                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                                <div>
                                                    <h4 className="font-medium text-sm">チームから脱退</h4>
                                                    <p className="text-xs text-muted-foreground">オーナー権限のため、先に他のメンバーへ権限を譲渡する必要があります。</p>
                                                </div>
                                                <Button variant="outline" disabled className="text-muted-foreground">脱退不可</Button>
                                            </div>
                                        )}
                                        {(!isOwner || activeMembers.some(m => m.userId !== user?.uid && m.role === 'owner')) && (
                                            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-destructive/5 transition-colors">
                                                <div>
                                                    <h4 className="font-medium text-sm text-destructive">チームから脱退</h4>
                                                    <p className="text-xs text-muted-foreground">このペットの共有メンバーから抜けます。</p>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm">脱退する</Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>チームから脱退</AlertDialogTitle><AlertDialogDescription>本当にこのペットのチームから脱退しますか？</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction onClick={handleLeaveTeam} className="bg-destructive text-destructive-foreground">脱退する</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                        {isOwner && (
                                            <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                                                <div>
                                                    <h4 className="font-medium text-sm text-destructive">ペットを削除</h4>
                                                    <p className="text-xs text-destructive/70">このペットのすべてのデータが永久に削除されます。</p>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm">削除する</Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>ペットを削除</AlertDialogTitle><AlertDialogDescription>本当に {pet.name} を削除しますか？この操作は取り消せません。</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction onClick={handleDeletePet} className="bg-destructive text-destructive-foreground">削除する</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
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
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>画像を削除しますか？</DialogTitle>
                            <DialogDescription>ペットのプロフィール画像が初期状態に戻ります。</DialogDescription>
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

export default function PetSettingsPage() {
    return (
        <Suspense fallback={<AppLayout><div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div></AppLayout>}>
            <PetSettingsContent />
        </Suspense>
    );
}
