'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { usePetContext } from '@/contexts/PetContext';
import { useEntries } from '@/hooks/useEntries';
import { useCustomTasks } from '@/hooks/useCustomTasks';
import { ENTRY_TAGS } from '@/lib/types';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { useTimeFormat } from '@/hooks/useTimeFormat';

export function TimelineView() {
    const { selectedPet } = usePetContext();
    const { entries, loading, updateEntry } = useEntries(selectedPet?.id || null);
    const { tasks } = useCustomTasks(selectedPet?.id || null);
    const { formatTime } = useTimeFormat();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEntries = entries.filter((entry) => {
        const entryStart = entry.date.toDate();
        const entryEnd = entry.timeType === 'range' && entry.endDate
            ? entry.endDate.toDate()
            : entryStart;

        // Show entry if:
        // 1. Entry starts today, OR
        // 2. Today falls within entry's date range (entry spans from past to today or beyond)
        const startsToday = entryStart >= today && entryStart < tomorrow;
        const todayInRange = entryStart < tomorrow && entryEnd >= today;

        return startsToday || todayInRange;
    }).sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());

    const handleToggleComplete = async (e: React.MouseEvent, entryId: string, isCompleted: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await updateEntry(entryId, { isCompleted: !isCompleted });
            toast.success(isCompleted ? '未完了にしました' : '完了しました');
        } catch {
            toast.error('エラーが発生しました');
        }
    };

    if (loading) {
        return <div className="space-y-8 px-4 mt-8">{[...Array(3)].map((_, i) => <div key={i} className="flex gap-4"><div className="w-12 h-4 bg-muted animate-pulse rounded" /><div className="flex-1 h-20 bg-muted/20 animate-pulse rounded-2xl" /></div>)}</div>;
    }

    if (todayEntries.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
            >
                <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-tr from-primary/10 to-primary/5 flex items-center justify-center">
                    <span className="text-4xl filter drop-shadow-sm">✨</span>
                </div>
                <p className="text-lg font-medium text-foreground/80">今日はまだ記録がありません</p>
                <p className="text-sm text-muted-foreground mt-2">すてきな一日を始めましょう！</p>
            </motion.div>
        );
    }

    return (
        <div className="relative px-2 py-6">
            {/* Continuous Axis Line */}
            <div className="absolute left-[3.9rem] top-6 bottom-6 w-0.5 bg-gradient-to-b from-transparent via-border to-transparent" />

            <div className="space-y-8">
                {todayEntries.map((entry, index) => {
                    const isSchedule = entry.type === 'schedule';
                    const startTime = formatTime(entry.date.toDate());

                    // Range time display
                    let timeStr = startTime;
                    if (entry.timeType === 'range' && entry.endDate) {
                        const endDateTime = entry.endDate.toDate();
                        const startDate = entry.date.toDate();
                        const endTime = formatTime(endDateTime);

                        // Check if end date is different day
                        const isSameDay = startDate.toDateString() === endDateTime.toDateString();
                        if (isSameDay) {
                            timeStr = `${startTime} ~ ${endTime}`;
                        } else {
                            // Multi-day: show "h:m ~ m/d h:m"
                            timeStr = `${startTime} ~ ${format(endDateTime, 'M/d')} ${endTime}`;
                        }
                    }

                    // Determine main emoji (Node)
                    const firstTag = entry.tags[0];
                    const tagInfo = tasks.find((t) => t.name === firstTag) || ENTRY_TAGS.find((t) => t.value === firstTag);
                    const mainEmoji = tagInfo?.emoji || '📝';

                    return (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative flex gap-6 group"
                        >
                            {/* Time Column */}
                            <div className="w-10 pt-4 text-right flex-shrink-0">
                                <span className="text-sm font-bold font-mono text-muted-foreground group-hover:text-primary transition-colors">
                                    {timeStr}
                                </span>
                            </div>

                            {/* Node Column */}
                            <div className="relative z-10 flex-shrink-0 pt-1">
                                <div className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full border-4 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
                                    isSchedule
                                        ? "bg-background border-blue-100 dark:border-blue-900"
                                        : "bg-background border-primary/10"
                                )}>
                                    <span className="text-xl leading-none select-none">{mainEmoji}</span>
                                </div>
                            </div>

                            {/* Content Column */}
                            <Link href={`/entry/detail?id=${entry.id}`} className="flex-1 min-w-0 pt-1">
                                <div className={cn(
                                    "relative p-4 rounded-2xl border transition-all duration-300",
                                    isSchedule
                                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50 hover:shadow-lg hover:shadow-blue-500/5"
                                        : "bg-white/60 dark:bg-zinc-900/60 border-white/20 dark:border-white/5 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-primary/5"
                                )}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            {/* Tags (if more than 1) + Title */}
                                            <div className="flex flex-wrap items-center gap-2 pr-6"> {/* Added padding-right to avoid overlap with schedule badge */}
                                                {entry.tags.length > 1 && (
                                                    <div className="flex -space-x-1.5 opacity-80">
                                                        {entry.tags.slice(1).map(tag => {
                                                            const t = tasks.find(x => x.name === tag) || ENTRY_TAGS.find(x => x.value === tag);
                                                            return <span key={tag} className="text-sm">{t?.emoji}</span>
                                                        })}
                                                    </div>
                                                )}
                                                <h3 className={cn("font-bold text-base leading-tight", entry.isCompleted && "line-through opacity-60")}>
                                                    {entry.title || (tagInfo && ('label' in tagInfo ? tagInfo.label : tagInfo.name)) || entry.tags[0]}
                                                </h3>
                                            </div>

                                            {/* Body */}
                                            {entry.body && (
                                                <p className={cn("text-sm text-muted-foreground leading-relaxed line-clamp-3", entry.isCompleted && "line-through opacity-60")}>
                                                    {entry.body}
                                                </p>
                                            )}

                                            {/* Images */}
                                            {entry.imageUrls.length > 0 && (
                                                <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                                                    {entry.imageUrls.map((url, i) => (
                                                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-border">
                                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Toggle (Schedule Only) */}
                                        {isSchedule && (
                                            <button
                                                onClick={(e) => handleToggleComplete(e, entry.id, entry.isCompleted || false)}
                                                className="flex-shrink-0 mt-0.5 ml-1 text-muted-foreground hover:text-green-500 transition-colors z-20"
                                            >
                                                {entry.isCompleted
                                                    ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                    : <Circle className="w-6 h-6" />
                                                }
                                            </button>
                                        )}
                                    </div>

                                    {/* Decoration for 'Schedule' type */}
                                    {isSchedule && (
                                        <div className="absolute top-3 right-3 text-[10px] font-bold tracking-wider text-blue-500/40 dark:text-blue-400/30 uppercase pointer-events-none">
                                            Schedule
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
