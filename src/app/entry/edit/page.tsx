'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useEntries } from '@/hooks/useEntries';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { EntryForm } from '@/components/features/EntryForm';

function EditEntryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const entryId = searchParams.get('id');

    const { selectedPet } = usePetContext();
    const { entries, updateEntry, loading } = useEntries(selectedPet?.id || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const entry = entries.find((e) => e.id === entryId);

    const handleSubmit = async (data: any) => {
        if (!selectedPet || !entryId) {
            toast.error('エラーが発生しました');
            return;
        }
        setIsSubmitting(true);
        try {
            await updateEntry(entryId, {
                type: data.type,
                timeType: data.timeType,
                title: data.title,
                body: data.body,
                tags: data.tags,
                imageUrls: data.imageUrls,
                date: data.date,
                endDate: data.endDate,
                // isCompleted is preserved in EntryForm's data merging logic if passed, 
                // but here updating mainly content.
            });
            toast.success('更新しました');
            router.push(`/entry/detail?id=${entryId}`);
        } catch (error) {
            console.error(error);
            toast.error('エラーが発生しました');
        } finally {
            setIsSubmitting(false);
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

    return (
        <AppLayout>
            <EntryForm
                initialData={entry}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                title="記録を編集"
            />
        </AppLayout>
    );
}

export default function EditEntryPage() {
    return (
        <Suspense fallback={<AppLayout><div className="p-4 text-center py-12">読み込み中...</div></AppLayout>}>
            <EditEntryContent />
        </Suspense>
    );
}
