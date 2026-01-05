'use client';

import { AppLayout } from '@/components/features/AppLayout';
import { PendingInvitations } from '@/components/features/PendingInvitations';
import { usePetContext } from '@/contexts/PetContext';
import { Button } from '@/components/ui/button';
import { Plus, PawPrint, Calendar as CalendarIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TimelineView } from '@/components/dashboard/TimelineView';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function DashboardPage() {
    const { selectedPet } = usePetContext();

    if (!selectedPet) {
        return (
            <AppLayout>
                <div className="p-4 space-y-6 flex flex-col items-center justify-center min-h-[70vh]">
                    <PendingInvitations />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 w-full max-w-sm bg-white/50 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-8"
                    >
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 ring-4 ring-white/50">
                            <PawPrint className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">ようこそ！</h2>
                        <p className="text-muted-foreground mb-8 leading-relaxed">
                            まずはペットを登録して、<br />
                            新しい思い出作りを始めましょう。
                        </p>
                        <Link href="/pets/new" className="block">
                            <Button size="lg" className="w-full rounded-xl gradient-primary shadow-lg hover:shadow-primary/25 transition-all hover:scale-105">
                                <Plus className="w-5 h-5 mr-2" />
                                ペットを登録する
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>

            <div className="relative min-h-screen pb-24">
                {/* Global Header Gradient */}
                <div className="absolute inset-0 h-[40vh] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent -z-10 rounded-b-[4rem]" />

                <div className="fixed bottom-0 right-0 w-[80%] h-[50%] bg-blue-400/5 rounded-full blur-[100px] -z-20 pointer-events-none" />

                <div className="px-4 pt-6 space-y-6">
                    <PendingInvitations />

                    {/* Header */}
                    <div className="flex items-end justify-between z-10 relative mb-4">
                        <div>
                            <p className="text-xs font-bold text-muted-foreground mb-1 pl-1">
                                {format(new Date(), 'yyyy年M月d日 (E)', { locale: ja })}
                            </p>
                            <h1 className="text-4xl font-black tracking-tighter filter drop-shadow-sm">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                                    {selectedPet.name}
                                </span>
                            </h1>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/calendar">
                                <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 bg-white/40 dark:bg-black/20 hover:bg-white/50 backdrop-blur-md shadow-sm border border-white/20 transition-all hover:scale-110 active:scale-95">
                                    <CalendarIcon className="w-6 h-6 text-foreground/80" />
                                </Button>
                            </Link>
                            <Link href={`/pets/settings?id=${selectedPet.id}`}>
                                <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 bg-white/40 dark:bg-black/20 hover:bg-white/50 backdrop-blur-md shadow-sm border border-white/20 transition-all hover:scale-110 active:scale-95">
                                    <Settings className="w-6 h-6 text-foreground/80" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="px-2">
                    {/* Timeline */}
                    <TimelineView />
                </div>

                {/* FAB */}
            </div>
        </AppLayout>
    );
}

