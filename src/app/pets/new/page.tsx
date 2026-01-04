'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, PawPrint, Save, Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function NewPetPage() {
    const router = useRouter();
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
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
            <div className="p-4 mb-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
                        <h1 className="text-xl font-bold">ペットを登録</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 画像アップロード */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                                    <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-primary/10 text-2xl"><PawPrint className="w-12 h-12 text-primary" /></AvatarFallback>
                                </Avatar>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    className="absolute bottom-0 right-0 rounded-full shadow-lg"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="w-5 h-5" />
                                </Button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </div>
                            {avatarPreview && (
                                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveImage} className="text-destructive text-xs">
                                    画像を削除
                                </Button>
                            )}
                            <p className="text-xs text-muted-foreground">プロフィール画像を設定（任意）</p>
                        </div>

                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">基本情報</CardTitle></CardHeader>
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
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn('w-full mt-1 justify-start text-left font-normal pl-3', !birthday && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {birthday ? format(birthday, 'yyyy/MM/dd') : '選択'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={birthday} onSelect={setBirthday} locale={ja} disabled={(date) => date > new Date()} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div>
                                        <Label>お迎え日</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn('w-full mt-1 justify-start text-left font-normal pl-3', !adoptionDate && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {adoptionDate ? format(adoptionDate, 'yyyy/MM/dd') : '選択'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={adoptionDate} onSelect={setAdoptionDate} locale={ja} disabled={(date) => date > new Date()} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="microchipId">マイクロチップID</Label>
                                    <Input id="microchipId" value={microchipId} onChange={(e) => setMicrochipId(e.target.value)} placeholder="マイクロチップID（任意）" className="mt-1" />
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="submit" disabled={isSubmitting || !name.trim() || uploading} className="w-full h-12 text-base gradient-primary">
                            <Save className="w-5 h-5 mr-2" />
                            {isSubmitting ? '登録中...' : '登録する'}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </AppLayout>
    );
}
