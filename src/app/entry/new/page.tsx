'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useEntries } from '@/hooks/useEntries';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EntryForm } from '@/components/features/EntryForm';

export default function NewEntryPage() {
    const router = useRouter();
    const { selectedPet, isPetLoading } = usePetContext();
    const { loading: authLoading } = useAuth();
    const { canEdit, loading: membersLoading } = useMembers(selectedPet?.id || null);
    const { addEntry } = useEntries(selectedPet?.id || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 権限チェックはレンダリング時に行い、リダイレクトはしない（UX向上とチラつき防止）
    // useEffectでのリダイレクトは削除

    const handleSubmit = async (data: any) => {
        if (!selectedPet || !canEdit) {
            toast.error('ペットが選択されていません、または権限がありません');
            return;
        }
        setIsSubmitting(true);
        try {
            await addEntry({
                type: data.type,
                timeType: data.timeType,
                title: data.title,
                body: data.body,
                tags: data.tags,
                imageUrls: data.imageUrls,
                date: data.date,
                endDate: data.endDate,
                isCompleted: data.type === 'schedule' ? false : undefined,
            });
            toast.success(data.type === 'diary' ? '記録しました' : '予定を追加しました');
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error('エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isPetLoading || authLoading) return <AppLayout><div className="p-4 text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div></div></AppLayout>;

    if (!selectedPet) return <AppLayout><div className="p-4 text-center py-12"><p className="text-muted-foreground">ペットを選択してください</p></div></AppLayout>;

    // 権限チェック（ローディング完了後）
    if (!membersLoading && !canEdit) {
        return (
            <AppLayout>
                <div className="p-4 text-center py-12 space-y-4">
                    <p className="text-red-500 font-bold">編集権限がありません</p>
                    <p className="text-muted-foreground text-sm">
                        このペットの日記を記録するには、オーナーまたは編集者の権限が必要です。
                    </p>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        ダッシュボードに戻る
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <EntryForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                title="新しい記録"
            />
        </AppLayout>
    );
}
