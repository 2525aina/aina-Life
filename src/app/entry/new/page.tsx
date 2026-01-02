'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useEntries } from '@/hooks/useEntries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ENTRY_TAGS, type EntryTag } from '@/lib/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon, Clock, ImagePlus, X, ArrowLeft, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function NewEntryPage() {
    const router = useRouter();
    const { selectedPet } = usePetContext();
    const { addEntry } = useEntries(selectedPet?.id || null);

    const [type, setType] = useState<'diary' | 'schedule'>('diary');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tags, setTags] = useState<EntryTag[]>([]);
    const [date, setDate] = useState<Date>(new Date());
    const [time, setTime] = useState(format(new Date(), 'HH:mm'));
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleTag = (tag: EntryTag) => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPet) { toast.error('ペットが選択されていません'); return; }
        if (tags.length === 0) { toast.error('カテゴリを1つ以上選択してください'); return; }
        setIsSubmitting(true);
        try {
            const [hours, minutes] = time.split(':').map(Number);
            const entryDate = new Date(date); entryDate.setHours(hours, minutes, 0, 0);
            await addEntry({ type, title: title.trim() || undefined, body: body.trim() || undefined, tags, imageUrls, date: entryDate });
            toast.success(type === 'diary' ? '記録しました' : '予定を追加しました');
            router.push('/dashboard');
        } catch (error) { console.error(error); toast.error('エラーが発生しました'); }
        finally { setIsSubmitting(false); }
    };

    if (!selectedPet) return <AppLayout><div className="p-4 text-center py-12"><p className="text-muted-foreground">ペットを選択してください</p></div></AppLayout>;

    return (
        <AppLayout>
            <div className="p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6"><Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button><h1 className="text-xl font-bold">新しい記録</h1></div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Tabs value={type} onValueChange={(v) => setType(v as 'diary' | 'schedule')}><TabsList className="w-full"><TabsTrigger value="diary" className="flex-1">日記</TabsTrigger><TabsTrigger value="schedule" className="flex-1">予定</TabsTrigger></TabsList></Tabs>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">日時</CardTitle></CardHeader><CardContent className="flex gap-3">
                            <Popover><PopoverTrigger asChild><Button variant="outline" className={cn('flex-1 justify-start text-left font-normal')}><CalendarIcon className="mr-2 h-4 w-4" />{format(date, 'M月d日（E）', { locale: ja })}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} locale={ja} /></PopoverContent></Popover>
                            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-28" /></div>
                        </CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">カテゴリ</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{ENTRY_TAGS.map((tag) => <Button key={tag.value} type="button" variant={tags.includes(tag.value) ? 'default' : 'outline'} size="sm" onClick={() => toggleTag(tag.value)} className={cn('gap-1.5', tags.includes(tag.value) && 'gradient-primary')}><span>{tag.emoji}</span><span>{tag.label}</span></Button>)}</div></CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">内容</CardTitle></CardHeader><CardContent className="space-y-4">
                            <div><Label htmlFor="title" className="text-xs text-muted-foreground">タイトル（任意）</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトルを入力" className="mt-1" /></div>
                            <div><Label htmlFor="body" className="text-xs text-muted-foreground">メモ（任意）</Label><textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="詳細を入力..." rows={4} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" /></div>
                        </CardContent></Card>
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">写真</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-3">
                            {imageUrls.map((url, i) => <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden"><img src={url} alt="" className="w-full h-full object-cover" /><button type="button" onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"><X className="w-3 h-3 text-white" /></button></div>)}
                            <button type="button" className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors" onClick={() => toast.info('画像アップロード機能は準備中です')}><ImagePlus className="w-6 h-6 text-muted-foreground" /></button>
                        </div></CardContent></Card>
                        <Button type="submit" disabled={isSubmitting || tags.length === 0} className="w-full h-12 text-base gradient-primary"><Save className="w-5 h-5 mr-2" />{isSubmitting ? '保存中...' : '保存する'}</Button>
                    </form>
                </motion.div>
            </div>
        </AppLayout>
    );
}
