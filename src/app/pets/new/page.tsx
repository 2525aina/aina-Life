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
import { DatePickerDropdown } from '@/components/ui/date-picker-dropdown';
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
            <div className="pb-32 min-h-screen">
                {/* Header Area */}
                <div className="relative">
                    <div className="absolute inset-0 h-[40vh] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent -z-10 rounded-b-[4rem]" />

                    <div className="md:container max-w-xl mx-auto px-4 pt-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors" onClick={() => router.back()}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center mb-8">
                            <h1 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Welcome</h1>
                            <p className="text-sm font-medium text-muted-foreground mb-8">新しい家族を迎えましょう</p>

                            <div className="relative group mb-6">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-orange-400 rounded-full opacity-30 blur-xl group-hover:opacity-40 transition duration-1000 animate-pulse" />
                                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white/50 dark:border-white/10 shadow-2xl relative z-10">
                                    <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-white/50 dark:bg-black/20 text-4xl backdrop-blur-md"><PawPrint className="w-16 h-16 text-primary/50" /></AvatarFallback>
                                </Avatar>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 hover:scale-110 transition-all z-20"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                {avatarPreview && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:bg-destructive/90 hover:scale-110 transition-all z-20"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="glass rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary opacity-50" />

                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-4 bg-primary rounded-full" />
                                        <h3 className="font-bold text-lg text-foreground/80">基本情報</h3>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold text-muted-foreground ml-1">名前 <span className="text-destructive">*</span></Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ペットの名前" maxLength={20} className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20 focus:scale-[1.01] transition-transform" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="breed" className="text-xs font-bold text-muted-foreground ml-1">品種</Label>
                                            <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="例：柴犬" className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground ml-1">性別</Label>
                                            <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                                                <SelectTrigger className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20">
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

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <DatePickerDropdown
                                            label="誕生日"
                                            date={birthday}
                                            setDate={setBirthday}
                                        />

                                        <DatePickerDropdown
                                            label="お迎え日"
                                            date={adoptionDate}
                                            setDate={setAdoptionDate}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="microchipId" className="text-xs font-bold text-muted-foreground ml-1">マイクロチップID</Label>
                                        <Input id="microchipId" value={microchipId} onChange={(e) => setMicrochipId(e.target.value)} placeholder="マイクロチップID（任意）" className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20" />
                                    </div>
                                </div>

                                <Button type="submit" disabled={isSubmitting || !name.trim() || uploading} className="w-full h-14 text-lg font-bold gradient-primary shadow-xl rounded-full hover:scale-105 transition-transform">
                                    <Save className="w-5 h-5 mr-2" />
                                    {isSubmitting ? '登録中...' : '登録する'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
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
