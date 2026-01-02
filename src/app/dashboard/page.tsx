'use client';

import { AppLayout } from '@/components/features/AppLayout';
import { PendingInvitations } from '@/components/features/PendingInvitations';
import { usePetContext } from '@/contexts/PetContext';
import { useEntries } from '@/hooks/useEntries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, Calendar, PawPrint, ChevronRight, Settings } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ENTRY_TAGS } from '@/lib/types';

export default function DashboardPage() {
    const { selectedPet } = usePetContext();
    const { entries, loading } = useEntries(selectedPet?.id || null);

    const today = new Date();
    const todayEntries = entries.filter((entry) => {
        const entryDate = entry.date.toDate();
        return entryDate.getFullYear() === today.getFullYear() && entryDate.getMonth() === today.getMonth() && entryDate.getDate() === today.getDate();
    });
    const recentEntries = entries.slice(0, 5);

    if (!selectedPet) {
        return (
            <AppLayout>
                <div className="p-4 space-y-6">
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
            <div className="p-4 space-y-6">
                <PendingInvitations />

                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{format(today, 'yyyy年M月d日（E）', { locale: ja })}</p>
                            <h1 className="text-2xl font-bold">{selectedPet.name}の日記</h1>
                        </div>
                        <Link href={`/pets/settings?id=${selectedPet.id}`}>
                            <Button variant="ghost" size="icon">
                                <Settings className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />今日の記録</CardTitle></CardHeader>
                        <CardContent>
                            {todayEntries.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-muted-foreground mb-4">まだ記録がありません</p>
                                    <Link href="/entry/new"><Button size="sm" className="gradient-primary"><Plus className="w-4 h-4 mr-2" />記録する</Button></Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayEntries.map((entry) => (
                                        <Link key={entry.id} href={`/entry/detail?id=${entry.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                            <div className="flex flex-wrap gap-1">{entry.tags.map((tag) => { const tagInfo = ENTRY_TAGS.find((t) => t.value === tag); return <span key={tag} className="text-lg">{tagInfo?.emoji}</span>; })}</div>
                                            <div className="flex-1 min-w-0">
                                                {entry.title && <p className="font-medium truncate">{entry.title}</p>}
                                                {entry.body && <p className="text-sm text-muted-foreground line-clamp-2">{entry.body}</p>}
                                                <p className="text-xs text-muted-foreground mt-1">{format(entry.date.toDate(), 'H:mm')}</p>
                                            </div>
                                            {entry.imageUrls.length > 0 && <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0"><img src={entry.imageUrls[0]} alt="" className="w-full h-full object-cover" /></div>}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

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
                                            <div className="flex flex-wrap gap-1 flex-shrink-0">{entry.tags.slice(0, 2).map((tag) => { const tagInfo = ENTRY_TAGS.find((t) => t.value === tag); return <span key={tag} className="text-lg">{tagInfo?.emoji}</span>; })}{entry.tags.length > 2 && <span className="text-xs text-muted-foreground">+{entry.tags.length - 2}</span>}</div>
                                            <div className="flex-1 min-w-0">{entry.title && <p className="font-medium truncate">{entry.title}</p>}{entry.body && <p className="text-sm text-muted-foreground line-clamp-1">{entry.body}</p>}<p className="text-xs text-muted-foreground mt-1">{format(entry.date.toDate(), 'M/d H:mm', { locale: ja })}</p></div>
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
