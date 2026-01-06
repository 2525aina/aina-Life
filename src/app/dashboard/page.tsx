'use client';

import { AppLayout } from '@/components/features/AppLayout';
import { PendingInvitations } from '@/components/features/PendingInvitations';
import { usePetContext } from '@/contexts/PetContext';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TimelineView } from '@/components/dashboard/TimelineView';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Image from 'next/image';

export default function DashboardPage() {
    const { selectedPet } = usePetContext();
    const { canEdit } = useMembers(selectedPet?.id || null);

    if (!selectedPet) {
        return (
            <AppLayout>
                <div className="p-4 space-y-6 flex flex-col items-center justify-center min-h-[70vh]">
                    <PendingInvitations />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 w-full max-w-sm bg-white/50 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-8"
                    >
                        <div className="w-28 h-28 mx-auto rounded-full overflow-hidden mb-6 ring-4 ring-primary/20 shadow-lg">
                            <Image src="/ogp.webp" alt="Welcome" width={112} height={112} className="w-full h-full object-cover" priority />
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

                <div className="sticky top-14 z-20 px-4 pt-4 pb-4 bg-gradient-to-b from-background via-background/95 to-transparent backdrop-blur-sm">
                    <PendingInvitations />

                    {/* Header */}
                    <div className="flex items-end justify-between relative mt-2">
                        <div>
                            <p className="text-xs font-bold text-muted-foreground mb-1 pl-1">
                                {format(new Date(), 'yyyy年M月d日 (E)', { locale: ja })}
                            </p>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter filter drop-shadow-sm">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                                    {selectedPet.name}
                                </span>
                            </h1>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                            <Link href="/calendar">
                                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-white/40 dark:bg-black/20 hover:bg-white/50 backdrop-blur-md shadow-sm border border-white/20 transition-all hover:scale-110 active:scale-95">
                                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/80" />
                                </Button>
                            </Link>
                            <Link href={`/pets/settings?id=${selectedPet.id}`}>
                                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-white/40 dark:bg-black/20 hover:bg-white/50 backdrop-blur-md shadow-sm border border-white/20 transition-all hover:scale-110 active:scale-95">
                                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/80" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="px-2">
                    {/* Timeline */}
                    <TimelineView />
                </div>

                {/* FAB - sticky above footer */}
                {canEdit && (
                    <div className="sticky bottom-24 z-20 flex justify-end px-4 pt-6">
                        <Link href="/entry/new">
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center justify-center w-14 h-14 rounded-full gradient-primary shadow-xl shadow-primary/30"
                            >
                                <Plus className="w-7 h-7 text-white" />
                            </motion.div>
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

