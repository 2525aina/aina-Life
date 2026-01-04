'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePetContext } from '@/contexts/PetContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useCustomTasks } from '@/hooks/useCustomTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { ENTRY_TAGS, type EntryTag, type TimeType, type Entry } from '@/lib/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon, Clock, ImagePlus, X, ArrowLeft, Save, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ImageCropper } from '@/components/ui/image-cropper';

interface EntryFormProps {
    initialData?: Entry;
    onSubmit: (data: any) => Promise<void>;
    isSubmitting: boolean;
    title: string;
}

export function EntryForm({ initialData, onSubmit, isSubmitting, title: pageTitle }: EntryFormProps) {
    const router = useRouter();
    const { selectedPet } = usePetContext();
    const { uploadEntryImage, uploading } = useImageUpload();
    const { tasks } = useCustomTasks(selectedPet?.id || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [type, setType] = useState<'diary' | 'schedule'>('diary');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tags, setTags] = useState<EntryTag[]>([]);
    const [date, setDate] = useState<Date>(new Date());
    const [time, setTime] = useState(format(new Date(), 'HH:mm'));
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    // 範囲日時対応
    const [timeType, setTimeType] = useState<TimeType>('point');
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [endTime, setEndTime] = useState(format(new Date(), 'HH:mm'));

    // 画像クロッパー用
    const [cropperOpen, setCropperOpen] = useState(false);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setType(initialData.type);
            setTitle(initialData.title || '');
            setBody(initialData.body || '');
            setTags(initialData.tags as EntryTag[]);

            const entryDate = initialData.date.toDate();
            setDate(entryDate);
            setTime(format(entryDate, 'HH:mm'));

            if (initialData.endDate) {
                const end = initialData.endDate.toDate();
                setEndDate(end);
                setEndTime(format(end, 'HH:mm'));
            }

            setTimeType(initialData.timeType || 'point');
            setImageUrls(initialData.imageUrls || []);
        }
    }, [initialData]);

    const toggleTag = (tag: EntryTag) => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        if (imageUrls.length >= 5) {
            toast.error('画像は最大5枚までです');
            return;
        }

        const file = e.target.files[0];
        if (file.size > 10 * 1024 * 1024) {
            toast.error('10MB以下の画像を選択してください');
            return;
        }

        const url = URL.createObjectURL(file);
        setOriginalImageSrc(url);
        setCropperOpen(true);
        e.target.value = ''; // Reset
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setCropperOpen(false);
        if (!selectedPet?.id) return;

        try {
            const file = new File([croppedBlob], "entry-image.jpg", { type: "image/jpeg" });
            const url = await uploadEntryImage(file, selectedPet.id);
            setImageUrls((prev) => [...prev, url]);
            toast.success('画像を追加しました');
        } catch (error) {
            console.error(error);
            toast.error('画像のアップロードに失敗しました');
        } finally {
            setOriginalImageSrc(null);
        }
    };

    const handleCropCancel = () => {
        setCropperOpen(false);
        setOriginalImageSrc(null);
    };

    const handleRemoveImage = (index: number) => {
        setImageUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const [hours, minutes] = time.split(':').map(Number);
        const entryDate = new Date(date);
        entryDate.setHours(hours, minutes, 0, 0);

        let entryEndDate: Date | undefined;
        if (timeType === 'range') {
            const [endHours, endMinutes] = endTime.split(':').map(Number);
            entryEndDate = new Date(endDate);
            entryEndDate.setHours(endHours, endMinutes, 0, 0);
        }

        await onSubmit({
            type,
            timeType,
            title: title.trim() || undefined,
            body: body.trim() || undefined,
            tags,
            imageUrls,
            date: entryDate,
            endDate: entryEndDate,
            isCompleted: initialData?.isCompleted, // 既存の完了状態を維持
        });
    };

    // タグリストの結合 (デフォルトタグ + カスタムタグ)
    const allTags = [...ENTRY_TAGS, ...tasks.map(t => ({ value: t.name, label: t.name, emoji: t.emoji }))];
    // 重複除外 (名前で判定)
    const uniqueTags = Array.from(new Map(allTags.map(item => [item.label, item])).values());

    return (
        <div className="p-4 pb-24">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
                    <h1 className="text-xl font-bold">{pageTitle}</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs value={type} onValueChange={(v) => setType(v as 'diary' | 'schedule')}>
                        <TabsList className="w-full">
                            <TabsTrigger value="diary" className="flex-1">日記</TabsTrigger>
                            <TabsTrigger value="schedule" className="flex-1">予定</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* 日時カード */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">日時</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="time-type" className="text-xs text-muted-foreground">範囲で記録</Label>
                                    <Switch
                                        id="time-type"
                                        checked={timeType === 'range'}
                                        onCheckedChange={(checked) => setTimeType(checked ? 'range' : 'point')}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* 開始日時 */}
                            <div className="flex gap-3 items-center">
                                {timeType === 'range' && <span className="text-xs text-muted-foreground">開始</span>}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />{format(date, 'M月d日（E）', { locale: ja })}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} locale={ja} />
                                    </PopoverContent>
                                </Popover>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-28" />
                                </div>
                            </div>

                            {/* 終了日時（範囲の場合のみ） */}
                            {timeType === 'range' && (
                                <div className="flex gap-3 items-center">
                                    <span className="text-xs text-muted-foreground">終了</span>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />{format(endDate, 'M月d日（E）', { locale: ja })}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} locale={ja} />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-28" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* カテゴリ */}
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">カテゴリ</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {uniqueTags.map((tag) => (
                                    <Button
                                        key={tag.value}
                                        type="button"
                                        variant={tags.includes(tag.label as any) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => toggleTag(tag.label as any)}
                                        className={cn('gap-1.5', tags.includes(tag.label as any) && 'gradient-primary')}
                                    >
                                        <span>{tag.emoji}</span>
                                        <span>{tag.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 内容 */}
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">内容</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title" className="text-xs text-muted-foreground">タイトル（任意）</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトルを入力" className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="body" className="text-xs text-muted-foreground">メモ（任意）</Label>
                                <textarea
                                    id="body"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="詳細を入力..."
                                    rows={4}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 写真 */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center justify-between">
                                写真
                                <span className="text-xs text-muted-foreground font-normal">{imageUrls.length}/5</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            <div className="flex flex-wrap gap-3">
                                {imageUrls.map((url, i) => (
                                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(i)}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                ))}
                                {imageUrls.length < 5 && (
                                    <button
                                        type="button"
                                        className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors disabled:opacity-50"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                                        ) : (
                                            <ImagePlus className="w-6 h-6 text-muted-foreground" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={isSubmitting || tags.length === 0 || uploading} className="w-full h-12 text-base gradient-primary">
                        <Save className="w-5 h-5 mr-2" />
                        {isSubmitting ? '保存中...' : '保存する'}
                    </Button>
                </form>
            </motion.div>

            <ImageCropper
                open={cropperOpen}
                imageSrc={originalImageSrc}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
            />
        </div>
    );
}
