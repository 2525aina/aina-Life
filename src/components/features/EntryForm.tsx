'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePetContext } from '@/contexts/PetContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useCustomTasks } from '@/hooks/useCustomTasks';
import { useFriends } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DatePickerDropdown } from '@/components/ui/date-picker-dropdown';
import { TimePickerInput } from '@/components/ui/time-picker-input';
import { ENTRY_TAGS, type EntryTag, type TimeType, type Entry } from '@/lib/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, ImagePlus, X, ArrowLeft, Save, Loader2 } from 'lucide-react';
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
    const [friendIds, setFriendIds] = useState<string[]>([]);

    const { friends } = useFriends(selectedPet?.id || null);

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
            setFriendIds(initialData.friendIds || []);
        }
    }, [initialData]);

    const toggleFriend = (friendId: string) => {
        setFriendIds(prev => prev.includes(friendId)
            ? prev.filter(id => id !== friendId)
            : [...prev, friendId]
        );
    };

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
            friendIds,
            date: entryDate,
            endDate: entryEndDate,
            isCompleted: initialData?.isCompleted, // 既存の完了状態を維持
        });
    };

    // タグリスト (カスタムタスクを使用)
    const uniqueTags = tasks.map(t => ({ value: t.name, label: t.name, emoji: t.emoji }));

    return (


        <div className="relative min-h-screen pt-4 pb-40 px-4">
            {/* Global Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent -z-10 rounded-b-[4rem]" />

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full w-10 h-10 hover:bg-white/10 backdrop-blur-md">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-lg font-bold tracking-wider uppercase text-muted-foreground/50">{pageTitle}</h1>
                    <div className="w-10" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
                    {/* Type Switcher */}
                    <div className="glass-capsule p-1.5 flex shadow-lg bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/10">
                        <button
                            type="button"
                            onClick={() => setType('diary')}
                            className={cn(
                                "flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300",
                                type === 'diary' ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                            )}
                        >
                            日記
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('schedule')}
                            className={cn(
                                "flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300",
                                type === 'schedule' ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                            )}
                        >
                            予定
                        </button>
                    </div>

                    {/* Date & Time */}
                    <div className="glass rounded-[2rem] p-4 sm:p-6 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between text-muted-foreground mb-1">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-bold tracking-wider">日時</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="time-type" className="text-[10px] font-medium">範囲</Label>
                                <Switch
                                    id="time-type"
                                    checked={timeType === 'range'}
                                    onCheckedChange={(checked) => setTimeType(checked ? 'range' : 'point')}
                                    className="scale-75"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <DatePickerDropdown
                                date={date}
                                setDate={(d) => d && setDate(d)}
                                label="開始日"
                                toDate={undefined}
                            />
                            <TimePickerInput
                                time={time}
                                setTime={setTime}
                                label="時間"
                            />
                        </div>

                        {/* End Time for Range */}
                        {timeType === 'range' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10"
                            >
                                <DatePickerDropdown
                                    date={endDate}
                                    setDate={(d) => d && setEndDate(d)}
                                    label="終了日"
                                    toDate={undefined}
                                />
                                <TimePickerInput
                                    time={endTime}
                                    setTime={setEndTime}
                                    label="終了時間"
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="glass rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                            <span className="text-xs font-bold tracking-wider">CATEGORY</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {uniqueTags.map((tag) => {
                                const isSelected = tags.includes(tag.label as any);
                                return (
                                    <button
                                        key={tag.value}
                                        type="button"
                                        onClick={() => toggleTag(tag.label as any)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border",
                                            isSelected
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-105"
                                                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <span>{tag.emoji}</span>
                                        <span>{tag.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Friends (Only for Diary) */}
                    {type === 'diary' && friends.length > 0 && (
                        <div className="glass rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                <span className="text-xs font-bold tracking-wider">WALKING FRIENDS</span>
                            </div>
                            <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar">
                                {friends.map((friend) => {
                                    const isSelected = friendIds.includes(friend.id);
                                    return (
                                        <button
                                            key={friend.id}
                                            type="button"
                                            onClick={() => toggleFriend(friend.id)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 min-w-[4rem] transition-all duration-300",
                                                isSelected ? "scale-105" : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-14 h-14 rounded-full overflow-hidden border-2 transition-colors",
                                                isSelected ? "border-primary shadow-lg shadow-primary/25" : "border-transparent"
                                            )}>
                                                {friend.images?.[0] ? (
                                                    <img src={friend.images[0]} alt={friend.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                                        <img src="/ogp.webp" alt="No image" className="w-full h-full object-cover opacity-50 grayscale" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className={cn(
                                                "text-xs font-bold truncate w-full text-center",
                                                isSelected ? "text-primary" : "text-muted-foreground"
                                            )}>
                                                {friend.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="glass rounded-[2rem] p-6 space-y-6 shadow-sm">
                        <div className="space-y-4">
                            <input
                                placeholder="タイトルを入力"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-transparent border-0 border-b border-white/10 rounded-none text-xl font-bold px-0 focus:ring-0 focus:border-primary placeholder:text-muted-foreground/30 py-2 transition-colors"
                            />
                            <textarea
                                placeholder="詳細を入力..."
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={5}
                                className="w-full bg-transparent border-none text-base resize-none outline-none placeholder:text-muted-foreground/30 leading-relaxed"
                            />
                        </div>

                        {/* Images Grid */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-muted-foreground tracking-wider">PHOTOS</span>
                                <span className="text-[10px] text-muted-foreground/50">{imageUrls.length}/5</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {imageUrls.map((url, i) => (
                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                                        <img src={url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(i)}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-destructive transition-colors backdrop-blur-sm"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                ))}
                                {imageUrls.length < 5 && (
                                    <button
                                        type="button"
                                        className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all gap-1 group disabled:opacity-50"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                        ) : (
                                            <ImagePlus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                        )}
                                    </button>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        </div>
                    </div>

                    {/* Sticky Save Button */}
                    <div className="sticky bottom-24 z-20 pt-4 mx-auto max-w-sm">
                        <Button
                            type="submit"
                            disabled={isSubmitting || tags.length === 0 || uploading}
                            className="rounded-full gradient-primary shadow-2xl w-full h-14 text-lg font-bold hover:scale-105 active:scale-95 transition-all"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 mr-2" />}
                            保存する
                        </Button>
                    </div>
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
