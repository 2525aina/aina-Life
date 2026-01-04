'use client';

import { AppLayout } from '@/components/features/AppLayout';
import { PendingInvitations } from '@/components/features/PendingInvitations';
import { usePetContext } from '@/contexts/PetContext';
import { useEntries } from '@/hooks/useEntries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, Calendar, PawPrint, ChevronRight, Settings, ListTodo, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ENTRY_TAGS } from '@/lib/types';
import { toast } from 'sonner';
import { useCustomTasks } from '@/hooks/useCustomTasks';

export default function DashboardPage() {
    const { selectedPet } = usePetContext();
    const { entries, loading, updateEntry } = useEntries(selectedPet?.id || null);
    const { tasks } = useCustomTasks(selectedPet?.id || null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 今日の日記（diary タイプ）
    const todayDiaries = entries.filter((entry) => {
        if (entry.type !== 'diary') return false;
        const entryDate = entry.date.toDate();
        return entryDate >= today && entryDate < tomorrow;
    });

    // 今日の予定（schedule タイプ）
    const todaySchedules = entries.filter((entry) => {
        if (entry.type !== 'schedule') return false;
        const entryDate = entry.date.toDate();
        return entryDate >= today && entryDate < tomorrow;
    });

    const recentEntries = entries.slice(0, 5);

    const handleToggleComplete = async (entryId: string, isCompleted: boolean) => {
        try {
            await updateEntry(entryId, { isCompleted: !isCompleted });
            toast.success(isCompleted ? '未完了にしました' : '完了しました');
        } catch {
            toast.error('エラーが発生しました');
        }
    };

    if (!selectedPet) {
        return (
            <AppLayout>
                <div className="p-4 space-y-6">
                    <PendingInvitations />
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                        <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4"><PawPrint className="w-10 h-10 text-muted-foreground" /></div>
                        <h2 className="text-xl font-semibold mb-2">ペットを登録しましょう</h2>
                        <p className="text-muted-foreground mb-6">大切なペットの情報を登録して、<br />日記を始めましょう。</p>
                        <Link href="/pets/new"><Button className="gradient-primary"><Plus className="w-4 h-4 mr-2" />ペットを登録</Button></Link>
                    </motion.div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-4 space-y-6 pb-24">
                <PendingInvitations />

                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{format(new Date(), 'yyyy年M月d日（E）', { locale: ja })}</p>
                            <h1 className="text-2xl font-bold">{selectedPet.name}の日記</h1>
                        </div>
                        <Link href={`/pets/settings?id=${selectedPet.id}`}>
                            <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
                        </Link>
                    </div>
                </motion.div>

                {/* 今日の予定（TODOリスト） */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2"><ListTodo className="w-4 h-4 text-primary" />今日の予定</CardTitle>
                                <Link href="/entry/new"><Button size="sm" variant="outline" className="gap-1"><Plus className="w-3 h-3" />追加</Button></Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {todaySchedules.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4 text-sm">予定はありません</p>
                            ) : (
                                <div className="space-y-2">
                                    {todaySchedules.map((schedule) => (
                                        <div key={schedule.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                            <Checkbox
                                                checked={schedule.isCompleted || false}
                                                onCheckedChange={() => handleToggleComplete(schedule.id, schedule.isCompleted || false)}
                                                className="mt-0.5"
                                            />
                                            <Link href={`/entry/detail?id=${schedule.id}`} className="flex-1 min-w-0">
                                                <div className={schedule.isCompleted ? 'opacity-50 line-through' : ''}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {format(schedule.date.toDate(), 'H:mm')}
                                                            {schedule.timeType === 'range' && schedule.endDate && (
                                                                <> - {format(schedule.endDate.toDate(), 'H:mm')}</>
                                                            )}
                                                        </span>
                                                        {schedule.tags.map((tag) => {
                                                            const tagInfo = tasks.find((t) => t.name === tag) || ENTRY_TAGS.find((t) => t.value === tag);
                                                            return <span key={tag}>{tagInfo?.emoji}</span>;
                                                        })}
                                                    </div>
                                                    {schedule.title && <p className="font-medium text-sm">{schedule.title}</p>}
                                                    {schedule.body && <p className="text-xs text-muted-foreground line-clamp-1">{schedule.body}</p>}
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 今日の記録 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />今日の記録</CardTitle></CardHeader>
                        <CardContent>
                            {todayDiaries.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground mb-4">まだ記録がありません</p>
                                    <Link href="/entry/new"><Button size="sm" className="gradient-primary"><Plus className="w-4 h-4 mr-2" />記録する</Button></Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayDiaries.map((entry) => (
                                        <Link key={entry.id} href={`/entry/detail?id=${entry.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                            <div className="flex flex-wrap gap-1">{entry.tags.map((tag) => { const tagInfo = tasks.find((t) => t.name === tag) || ENTRY_TAGS.find((t) => t.value === tag); return <span key={tag} className="text-lg">{tagInfo?.emoji}</span>; })}</div>
                                            <div className="flex-1 min-w-0">
                                                {entry.title && <p className="font-medium truncate">{entry.title}</p>}
                                                {entry.body && <p className="text-sm text-muted-foreground line-clamp-2">{entry.body}</p>}
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {format(entry.date.toDate(), 'H:mm')}
                                                    {entry.timeType === 'range' && entry.endDate && (
                                                        <> - {format(entry.endDate.toDate(), 'H:mm')}</>
                                                    )}
                                                </p>
                                            </div>
                                            {entry.imageUrls.length > 0 && <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0"><img src={entry.imageUrls[0]} alt="" className="w-full h-full object-cover" /></div>}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 最近の記録 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between"><CardTitle className="text-base">最近の記録</CardTitle><Link href="/calendar"><Button variant="ghost" size="sm" className="gap-1 text-sm">すべて見る<ChevronRight className="w-4 h-4" /></Button></Link></div>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
                                : recentEntries.length === 0 ? <p className="text-center text-muted-foreground py-6">まだ記録がありません</p>
                                    : <div className="space-y-3">{recentEntries.map((entry) => (
                                        <Link key={entry.id} href={`/entry/detail?id=${entry.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                            <div className="flex flex-wrap gap-1 flex-shrink-0">{entry.tags.slice(0, 2).map((tag) => { const tagInfo = tasks.find((t) => t.name === tag) || ENTRY_TAGS.find((t) => t.value === tag); return <span key={tag} className="text-lg">{tagInfo?.emoji}</span>; })}{entry.tags.length > 2 && <span className="text-xs text-muted-foreground">+{entry.tags.length - 2}</span>}</div>
                                            <div className="flex-1 min-w-0">
                                                {entry.title && <p className="font-medium truncate">{entry.title}</p>}
                                                {entry.body && <p className="text-sm text-muted-foreground line-clamp-1">{entry.body}</p>}
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {format(entry.date.toDate(), 'M/d H:mm', { locale: ja })}
                                                    {entry.type === 'schedule' && <span className="ml-2 px-1 py-0.5 bg-primary/10 text-primary rounded text-[10px]">予定</span>}
                                                </p>
                                            </div>
                                            {entry.imageUrls.length > 0 && <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0"><img src={entry.imageUrls[0]} alt="" className="w-full h-full object-cover" /></div>}
                                        </Link>
                                    ))}</div>}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </AppLayout>
    );
}
