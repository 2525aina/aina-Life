'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ENTRY_TAGS, Entry } from '@/lib/types';
import { format, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Trash2, Edit, Calendar, Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTimeFormat } from '@/hooks/useTimeFormat';
import { Friend } from '@/lib/types';

interface EntryDetailSheetProps {
    entry: Entry | null;
    open: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: (entryId: string) => Promise<void>;
    tasks: any[];
    friends: Friend[];
    canEdit: boolean;
}

export function EntryDetailSheet({
    entry,
    open,
    onClose,
    onEdit,
    onDelete,
    tasks,
    friends,
    canEdit,
}: EntryDetailSheetProps) {
    const { formatTime } = useTimeFormat();
    const [isDeleting, setIsDeleting] = useState(false);

    if (!entry) return null;

    const entryDate = entry.date.toDate();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(entry.id);
            toast.success('削除しました');
            onClose();
        } catch {
            toast.error('エラーが発生しました');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background/95 backdrop-blur-xl border-t border-white/20 p-0 overflow-hidden">
                {/* Header */}
                <SheetHeader className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-9 h-9">
                            <X className="w-5 h-5" />
                        </Button>
                        <SheetTitle className="text-sm font-bold">詳細</SheetTitle>
                        <div className="flex gap-1">
                            {canEdit && (
                                <>
                                    <Button variant="ghost" size="icon" onClick={onEdit} className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="glass border-white/20">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>エントリーを削除</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    本当にこのエントリーを削除しますか？この操作は取り消せません。
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-full">キャンセル</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90">
                                                    削除
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                        </div>
                    </div>
                </SheetHeader>

                {/* Content */}
                <div className="overflow-y-auto h-full pb-20 px-4 py-6 space-y-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Date & Time Badge */}
                        <div className="flex justify-center mb-6">
                            <div className="glass-capsule px-4 py-2 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-foreground/80 shadow-lg backdrop-blur-xl bg-white/40 dark:bg-black/40 border border-white/20">
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> {format(entryDate, 'M/d (E)', { locale: ja })}</span>
                                <span className="w-px h-3 bg-foreground/20" />
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> {formatTime(entryDate)}</span>

                                {entry.timeType === 'range' && entry.endDate && (
                                    <>
                                        <span className="text-primary/50">→</span>
                                        {!isSameDay(entryDate, entry.endDate.toDate()) && (
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary/70" /> {format(entry.endDate.toDate(), 'M/d (E)', { locale: ja })}</span>
                                        )}
                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary/70" /> {formatTime(entry.endDate.toDate())}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Friends */}
                        {entry.friendIds && entry.friendIds.length > 0 && (
                            <div className="flex justify-center mb-4">
                                <div className="glass-capsule px-3 py-1.5 flex items-center gap-3 bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/10">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">With</span>
                                    <div className="flex items-center -space-x-2">
                                        {entry.friendIds.map(fid => {
                                            const friend = friends.find(f => f.id === fid);
                                            if (!friend) return null;
                                            return (
                                                <div key={fid} className="relative w-7 h-7 rounded-full border-2 border-background overflow-hidden" title={friend.name}>
                                                    {friend.images?.[0] ? (
                                                        <img src={friend.images[0]} alt={friend.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                                            <img src="/ogp.webp" alt="No image" className="w-full h-full object-cover opacity-50 grayscale" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Content Glass Panel */}
                        <div className="glass rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary opacity-50" />

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-6 justify-center">
                                {entry.tags.map((tag) => {
                                    const tagInfo = tasks.find((t: any) => t.name === tag) || ENTRY_TAGS.find((t) => t.value === tag);
                                    return (
                                        <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 text-foreground text-sm font-bold shadow-sm backdrop-blur-md">
                                            <span className="text-base">{tagInfo?.emoji}</span>
                                            <span>{(tagInfo as any)?.name || (tagInfo as any)?.label}</span>
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Title */}
                            {entry.title && (
                                <h1 className="text-xl font-bold text-center mb-4">{entry.title}</h1>
                            )}

                            {/* Body */}
                            {entry.body && (
                                <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-sm">
                                    {entry.body}
                                </div>
                            )}

                            {/* Images Grid */}
                            {entry.imageUrls.length > 0 && (
                                <div className="mt-6 grid grid-cols-2 gap-2">
                                    {entry.imageUrls.map((url, i) => (
                                        <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-md ring-1 ring-white/10">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
