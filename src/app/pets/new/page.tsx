'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/features/AppLayout';
import { usePets } from '@/hooks/usePets';
import { usePetContext } from '@/contexts/PetContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropper } from '@/components/ui/image-cropper';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, PawPrint, Save, Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function NewPetPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { addPet, updatePet } = usePets();
    const { setSelectedPet } = usePetContext();
    const { uploadPetAvatar, uploading } = useImageUpload();

    // 基本情報
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [birthday, setBirthday] = useState<Date | undefined>(undefined);
    const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
    const [adoptionDate, setAdoptionDate] = useState<Date | undefined>(undefined);
    const [microchipId, setMicrochipId] = useState('');

    // 画像
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setOriginalImageSrc(url);
        setCropperOpen(true);
        e.target.value = ''; // Reset for re-selection
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setCropperOpen(false);
    };

    const handleCropCancel = () => {
        setCropperOpen(false);
        if (!avatarFile) {
            setOriginalImageSrc(null);
        }
    };

    const handleRemoveImage = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setOriginalImageSrc(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('名前を入力してください'); return; }
        setIsSubmitting(true);
        try {
            // 1. まずペットを作成（画像なしで）
            const petData = {
                name: name.trim(),
                breed: breed.trim() || undefined,
                birthday: birthday ? format(birthday, 'yyyy-MM-dd') : undefined,
                gender: gender || undefined,
                adoptionDate: adoptionDate ? format(adoptionDate, 'yyyy-MM-dd') : undefined,
                microchipId: microchipId.trim() || undefined,
                avatarUrl: undefined as string | undefined, // まずはundefined
            };

            const petId = await addPet(petData);
            let finalAvatarUrl: string | undefined = undefined;

            // 2. 画像があればアップロードして更新
            if (avatarFile) {
                try {
                    finalAvatarUrl = await uploadPetAvatar(avatarFile, petId);
                    await updatePet(petId, { avatarUrl: finalAvatarUrl });
                } catch (error) {
                    console.error('Image upload failed:', error);
                    toast.error('画像のアップロードに失敗しました（ペットは登録されました）');
                }
            }

            toast.success(`${name}を登録しました！`);
            setSelectedPet({
                id: petId,
                ...petData,
                avatarUrl: finalAvatarUrl,
                memberUids: user ? [user.uid] : [],
                createdBy: '', updatedBy: '', createdAt: null as any, updatedAt: null as any
            });
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error('エラーが発生しました');
        } finally { setIsSubmitting(false); }
    };

    return (
        <AppLayout>
            <div className="pb-24">
                {/* ヘッダーエリア */}
                <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 pb-8 pt-6 px-4 -mx-4 md:mx-0 md:rounded-b-3xl">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="md:container max-w-2xl mx-auto flex flex-col items-center text-center">
                        <div className="relative group mb-4">
                            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                                <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                                <AvatarFallback className="bg-primary/10 text-4xl"><PawPrint className="w-12 h-12 text-primary" /></AvatarFallback>
                            </Avatar>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        </div>
                        {avatarPreview && (
                            <Button type="button" variant="ghost" size="sm" onClick={handleRemoveImage} className="text-destructive text-xs hover:bg-destructive/10 mb-2">
                                画像を削除
                            </Button>
                        )}
                        <h1 className="text-2xl font-bold">新しいペット</h1>
                        <p className="text-sm text-muted-foreground mt-1">ペットの情報を入力してください</p>
                    </motion.div>
                </div>

                <div className="px-4 md:container max-w-2xl mx-auto mt-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
                        <span className="text-sm text-muted-foreground">戻る</span>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Card>
                                <CardHeader className="pb-2"><CardTitle className="text-base">基本情報</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">名前 <span className="text-destructive">*</span></Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ペットの名前" maxLength={20} className="mt-1" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="breed">品種</Label>
                                            <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="例：柴犬" className="mt-1" />
                                        </div>
                                        <div>
                                            <Label>性別</Label>
                                            <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="選択" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">男の子 ♂</SelectItem>
                                                    <SelectItem value="female">女の子 ♀</SelectItem>
                                                    <SelectItem value="other">その他</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>誕生日</Label>
                                            <div className="relative">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className={cn('w-full mt-1 justify-start text-left font-normal pl-3 pr-10', !birthday && 'text-muted-foreground')}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {birthday ? format(birthday, 'yyyy/MM/dd') : '選択'}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={birthday} onSelect={setBirthday} locale={ja} disabled={(date) => date > new Date()} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                                {birthday && (
                                                    <div className="absolute right-1 top-1 bottom-0 mt-1 flex items-center">
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setBirthday(undefined); }}><X className="w-4 h-4" /></Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label>お迎え日</Label>
                                            <div className="relative">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className={cn('w-full mt-1 justify-start text-left font-normal pl-3 pr-10', !adoptionDate && 'text-muted-foreground')}>
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {adoptionDate ? format(adoptionDate, 'yyyy/MM/dd') : '選択'}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={adoptionDate} onSelect={setAdoptionDate} locale={ja} disabled={(date) => date > new Date()} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                                {adoptionDate && (
                                                    <div className="absolute right-1 top-1 bottom-0 mt-1 flex items-center">
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setAdoptionDate(undefined); }}><X className="w-4 h-4" /></Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="microchipId">マイクロチップID</Label>
                                        <Input id="microchipId" value={microchipId} onChange={(e) => setMicrochipId(e.target.value)} placeholder="マイクロチップID（任意）" className="mt-1" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Button type="submit" disabled={isSubmitting || !name.trim() || uploading} className="w-full h-12 text-base gradient-primary shadow-lg">
                                <Save className="w-5 h-5 mr-2" />
                                {isSubmitting ? '登録中...' : '登録する'}
                            </Button>
                        </form>
                    </motion.div>
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
