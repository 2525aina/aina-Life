'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/features/AppLayout';
import { usePets } from '@/hooks/usePets';
import { usePetContext } from '@/contexts/PetContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, PawPrint, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function NewPetPage() {
    const router = useRouter();
    const { addPet } = usePets();
    const { setSelectedPet } = usePetContext();
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [birthday, setBirthday] = useState<Date | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('名前を入力してください'); return; }
        setIsSubmitting(true);
        try {
            const petId = await addPet({ name: name.trim(), breed: breed.trim() || undefined, birthday: birthday ? format(birthday, 'yyyy-MM-dd') : undefined });
            toast.success(`${name}を登録しました！`);
            setSelectedPet({ id: petId, ownerId: '', name: name.trim(), breed: breed.trim() || undefined, birthday: birthday ? format(birthday, 'yyyy-MM-dd') : undefined, createdAt: null as any, updatedAt: null as any });
            router.push('/dashboard');
        } catch { toast.error('エラーが発生しました'); }
        finally { setIsSubmitting(false); }
    };

    return (
        <AppLayout>
            <div className="p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6"><Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button><h1 className="text-xl font-bold">ペットを登録</h1></div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-center"><div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"><PawPrint className="w-12 h-12 text-primary" /></div></div>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">基本情報</CardTitle></CardHeader><CardContent className="space-y-4">
                            <div><Label htmlFor="name">名前 <span className="text-destructive">*</span></Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ペットの名前" maxLength={20} className="mt-1" /></div>
                            <div><Label htmlFor="breed">品種</Label><Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="例：柴犬、アメリカンショートヘア" className="mt-1" /></div>
                            <div><Label>誕生日</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn('w-full mt-1 justify-start text-left font-normal', !birthday && 'text-muted-foreground')}><CalendarIcon className="mr-2 h-4 w-4" />{birthday ? format(birthday, 'yyyy年M月d日', { locale: ja }) : '選択してください'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={birthday} onSelect={setBirthday} locale={ja} captionLayout="dropdown" /></PopoverContent></Popover></div>
                        </CardContent></Card>
                        <Button type="submit" disabled={isSubmitting || !name.trim()} className="w-full h-12 text-base gradient-primary"><Save className="w-5 h-5 mr-2" />{isSubmitting ? '登録中...' : '登録する'}</Button>
                    </form>
                </motion.div>
            </div>
        </AppLayout>
    );
}
