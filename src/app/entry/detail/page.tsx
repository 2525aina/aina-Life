'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useEntries } from '@/hooks/useEntries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ENTRY_TAGS } from '@/lib/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, Trash2, Edit, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useCustomTasks } from '@/hooks/useCustomTasks';
import { useMembers } from '@/hooks/useMembers';

function EntryDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const entryId = searchParams.get('id');

    const { selectedPet } = usePetContext();
    const { entries, deleteEntry, loading } = useEntries(selectedPet?.id || null);
    const { tasks } = useCustomTasks(selectedPet?.id || null);

    // Check permissions
    const { canEdit } = useMembers(selectedPet?.id || null);

    const entry = entries.find((e) => e.id === entryId);

    const handleDelete = async () => {
        if (!entryId || !canEdit) return; // double check
        try {
            await deleteEntry(entryId);
            toast.success('削除しました');
            router.push('/dashboard');
        } catch (error) {
            toast.error('エラーが発生しました');
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-4">
                    <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4" />
                    <div className="h-48 bg-muted animate-pulse rounded" />
                </div>
            </AppLayout>
        );
    }

    if (!entry) {
        return (
            <AppLayout>
                <div className="p-4 text-center py-12">
                    <p className="text-muted-foreground mb-4">エントリーが見つかりません</p>
                    <Button onClick={() => router.push('/dashboard')}>ダッシュボードに戻る</Button>
                </div>
            </AppLayout>
        );
    }

    const entryDate = entry.date.toDate();

    return (
        <AppLayout>
            <div className="relative min-h-screen pt-4 pb-32 px-4 space-y-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Header & Actions */}
                    <div className="flex items-center justify-between mb-8">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full w-10 h-10 hover:bg-white/10 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>

                        {canEdit && (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => router.push(`/entry/edit?id=${entryId}`)} className="rounded-full w-10 h-10 hover:bg-white/10 text-muted-foreground hover:text-foreground">
                                    <Edit className="w-5 h-5" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                            <Trash2 className="w-5 h-5" />
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
                                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90">
                                                削除
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">

                        {/* Date & Time Badge */}
                        <div className="flex justify-center">
                            <div className="glass-capsule px-6 py-3 flex items-center gap-4 text-sm font-bold text-foreground/80 shadow-lg backdrop-blur-xl bg-white/40 dark:bg-black/40 border border-white/20">
                                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {format(entryDate, 'yyyy/MM/dd (E)', { locale: ja })}</span>
                                <span className="w-px h-3 bg-foreground/20" />
                                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {format(entryDate, 'HH:mm')}</span>
                            </div>
                        </div>

                        {/* Main Content Glass Panel */}
                        <div className="glass rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary opacity-50" />
                            <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-8 justify-center relative z-10">
                                {entry.tags.map((tag) => {
                                    const tagInfo = tasks.find((t: any) => t.name === tag) || ENTRY_TAGS.find((t) => t.value === tag);
                                    return (
                                        <span key={tag} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 text-foreground text-sm font-bold shadow-sm backdrop-blur-md">
                                            <span className="text-lg">{tagInfo?.emoji}</span>
                                            <span>{(tagInfo as any)?.name || (tagInfo as any)?.label}</span>
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Title */}
                            {entry.title && (
                                <h1 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 relative z-10">{entry.title}</h1>
                            )}

                            {/* Body */}
                            {entry.body && (
                                <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-base font-medium relative z-10">
                                    {entry.body}
                                </div>
                            )}

                            {/* Images Grid */}
                            {entry.imageUrls.length > 0 && (
                                <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
                                    {entry.imageUrls.map((url, i) => (
                                        <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-md ring-1 ring-white/10 group/image cursor-pointer">
                                            <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
}

export default function EntryDetailPage() {
    return (
        <Suspense fallback={<AppLayout><div className="p-4 text-center py-12">読み込み中...</div></AppLayout>}>
            <EntryDetailContent />
        </Suspense>
    );
}
