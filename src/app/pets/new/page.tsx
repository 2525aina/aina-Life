'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/features/AppLayout';
import { usePets } from '@/hooks/usePets';
import { usePetContext } from '@/contexts/PetContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { PetBasicInfoForm, type PetBasicInfoData } from '@/components/features/pet-basic-info-form';
import { PetAvatarEditor } from '@/components/features/pet-avatar-editor';
import { format } from 'date-fns';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function NewPetPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { addPet, updatePet } = usePets();
    const { setSelectedPet } = usePetContext();
    const { uploadPetAvatar, uploading } = useImageUpload();

    // 基本情報
    const [formData, setFormData] = useState<PetBasicInfoData>({
        name: '',
        species: '',
        breed: '',
        color: '',
        gender: '',
        birthday: undefined,
        adoptionDate: undefined,
        microchipId: '',
    });

    // 画像
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (file: File) => {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleImageRemove = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) { toast.error('名前を入力してください'); return; }
        setIsSubmitting(true);
        try {
            // 1. まずペットを作成（画像なしで）
            const petData = {
                name: formData.name.trim(),
                species: formData.species || undefined,
                breed: formData.breed.trim() || undefined,
                color: formData.color || undefined,
                birthday: formData.birthday ? format(formData.birthday, 'yyyy-MM-dd') : undefined,
                gender: formData.gender || undefined,
                adoptionDate: formData.adoptionDate ? format(formData.adoptionDate, 'yyyy-MM-dd') : undefined,
                microchipId: formData.microchipId.trim() || undefined,
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

            toast.success(`${formData.name}を登録しました！`);
            setSelectedPet({
                id: petId,
                ...petData,
                avatarUrl: finalAvatarUrl,
                memberUids: user ? [user.uid] : [],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                            <h1 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">ようこそ</h1>
                            <p className="text-sm font-medium text-muted-foreground mb-8">新しい家族を迎えましょう</p>

                            <div className="mb-6">
                                <PetAvatarEditor
                                    imageUrl={avatarPreview}
                                    onImageChange={handleImageChange}
                                    onImageRemove={handleImageRemove}
                                    disabled={isSubmitting || uploading}
                                />
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <form onSubmit={handleSubmit} className="space-y-8 pb-24">
                                <PetBasicInfoForm
                                    data={formData}
                                    onChange={setFormData}
                                    disabled={isSubmitting || uploading}
                                />
                            </form>

                            {/* Sticky Submit Button */}
                            <div className="fixed bottom-24 left-0 right-0 px-6 flex justify-center pointer-events-none z-50">
                                <Button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const form = document.querySelector('form');
                                        if (form) form.requestSubmit();
                                    }}
                                    disabled={isSubmitting || !formData.name.trim() || uploading}
                                    className="pointer-events-auto w-full max-w-sm h-14 text-lg font-bold gradient-primary shadow-xl rounded-full hover:scale-105 transition-transform"
                                >
                                    <Save className="w-5 h-5 mr-2" />
                                    {isSubmitting ? '登録中...' : '登録する'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

