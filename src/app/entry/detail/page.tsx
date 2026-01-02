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

function EntryDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const entryId = searchParams.get('id');

    const { selectedPet } = usePetContext();
    const { entries, deleteEntry, loading } = useEntries(selectedPet?.id || null);

    const entry = entries.find((e) => e.id === entryId);

    const handleDelete = async () => {
        if (!entryId) return;
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
            <div className="p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <h1 className="text-xl font-bold">
                                {entry.type === 'diary' ? '日記' : '予定'}の詳細
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/entry/edit?id=${entryId}`)}>
                                <Edit className="w-5 h-5" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive">
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>エントリーを削除</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            本当にこのエントリーを削除しますか？この操作は取り消せません。
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                                            削除
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <Card className="mb-4">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>{format(entryDate, 'yyyy年M月d日（E）', { locale: ja })}</span>
                                <Clock className="w-4 h-4 ml-2" />
                                <span>{format(entryDate, 'H:mm')}</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* タグ */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {entry.tags.map((tag) => {
                                    const tagInfo = ENTRY_TAGS.find((t) => t.value === tag);
                                    return (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm">
                                            <span>{tagInfo?.emoji}</span>
                                            <span>{tagInfo?.label}</span>
                                        </span>
                                    );
                                })}
                            </div>

                            {/* タイトル */}
                            {entry.title && (
                                <h2 className="text-lg font-semibold mb-2">{entry.title}</h2>
                            )}

                            {/* 本文 */}
                            {entry.body && (
                                <p className="text-foreground whitespace-pre-wrap">{entry.body}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* 画像 */}
                    {entry.imageUrls.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">写真</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2">
                                    {entry.imageUrls.map((url, i) => (
                                        <div key={i} className="aspect-square rounded-lg overflow-hidden">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
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
