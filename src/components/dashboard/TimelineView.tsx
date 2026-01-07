'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { usePetContext } from '@/contexts/PetContext';
import { useEntries } from '@/hooks/useEntries';
import { useFriends } from '@/hooks/useFriends';
import { useCustomTasks } from '@/hooks/useCustomTasks';
import { useMembers } from '@/hooks/useMembers';
import { ENTRY_TAGS, Entry } from '@/lib/types';
import { CheckCircle2, Circle, Clock, ChevronDown, Sparkles, CalendarCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTimeFormat } from '@/hooks/useTimeFormat';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EntryDetailSheet } from '@/components/features/EntryDetailSheet';
import { EntryEditSheet } from '@/components/features/EntryEditSheet';

// Section Header Component
function SectionHeader({
    icon,
    title,
    count,
    color = 'primary',
    isCollapsible = false,
    isOpen = true,
    onToggle
}: {
    icon: React.ReactNode;
    title: string;
    count: number;
    color?: 'primary' | 'blue' | 'green' | 'amber';
    isCollapsible?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
}) {
    const colorClasses = {
        primary: 'from-primary/20 to-primary/5 text-primary',
        blue: 'from-blue-500/20 to-blue-500/5 text-blue-500',
        green: 'from-green-500/20 to-green-500/5 text-green-500',
        amber: 'from-amber-500/20 to-amber-500/5 text-amber-600',
    };

    return (
        <button
            onClick={onToggle}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all",
                `bg-gradient-to-r ${colorClasses[color]}`,
                "cursor-pointer hover:opacity-90 active:scale-[0.99]"
            )}
        >
            <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center",
                "bg-white/50 dark:bg-black/20 shadow-sm"
            )}>
                {icon}
            </div>
            <span className="font-bold text-sm flex-1 text-left">{title}</span>
            <span className="text-xs font-bold opacity-60 bg-white/30 dark:bg-black/20 px-2.5 py-1 rounded-full">
                {count}
            </span>
            <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-300",
                !isOpen && "-rotate-90"
            )} />
        </button>
    );
}

// Entry Card Component
function EntryCard({
    entry,
    tasks,
    friends,
    formatTime,
    onToggleComplete,
    onClick,
    isCompact = false,
    isOverdue = false
}: {
    entry: Entry;
    tasks: any[];
    friends: any[];
    formatTime: (date: Date) => string;
    onToggleComplete: (e: React.MouseEvent, entryId: string, isCompleted: boolean) => void;
    onClick: () => void;
    isCompact?: boolean;
    isOverdue?: boolean;
}) {
    const isSchedule = entry.type === 'schedule';
    const firstTag = entry.tags[0];
    const tagInfo = tasks.find((t) => t.name === firstTag) || ENTRY_TAGS.find((t) => t.value === firstTag);
    const mainEmoji = tagInfo?.emoji || '📝';
    const displayName = entry.title || (tagInfo && ('label' in tagInfo ? tagInfo.label : tagInfo.name)) || firstTag;

    // Time display logic
    const renderTime = () => {
        const startDate = entry.date.toDate();

        if (entry.timeType === 'range' && entry.endDate) {
            const endDateTime = entry.endDate.toDate();
            const isSameDayRange = startDate.toDateString() === endDateTime.toDateString();

            if (isSameDayRange) {
                return (
                    <span className="text-[10px] font-bold font-mono text-muted-foreground">
                        {formatTime(startDate)} ~ {formatTime(endDateTime)}
                    </span>
                );
            } else {
                return (
                    <div className="flex flex-col items-end text-[9px] font-bold font-mono text-muted-foreground leading-tight">
                        <span>{format(startDate, 'M/d')} {formatTime(startDate)}</span>
                        <span className="text-primary/50">~</span>
                        <span>{format(endDateTime, 'M/d')} {formatTime(endDateTime)}</span>
                    </div>
                );
            }
        }

        return (
            <span className="text-xs font-bold font-mono text-muted-foreground">
                {formatTime(startDate)}
            </span>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="group"
        >
            <div onClick={onClick} className="cursor-pointer">
                <div className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    isOverdue
                        ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300/50 dark:border-amber-800/30"
                        : isSchedule && !entry.isCompleted
                            ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-800/30"
                            : entry.isCompleted
                                ? "bg-muted/30 border-muted/20 opacity-60"
                                : "bg-white/60 dark:bg-zinc-900/60 border-white/30 dark:border-white/5 backdrop-blur-xl"
                )}>
                    {/* Time */}
                    <div className="w-14 sm:w-16 flex-shrink-0 text-right">
                        {renderTime()}
                    </div>

                    {/* Emoji */}
                    <div className={cn(
                        "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        "bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-white/5",
                        "shadow-sm border border-white/50 dark:border-white/10"
                    )}>
                        <span className="text-lg sm:text-xl">{mainEmoji}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                            {entry.tags.length > 1 && (
                                <div className="flex -space-x-1 opacity-70 flex-shrink-0">
                                    {entry.tags.slice(1, 3).map(tag => {
                                        const t = tasks.find(x => x.name === tag) || ENTRY_TAGS.find(x => x.value === tag);
                                        return <span key={tag} className="text-xs">{t?.emoji}</span>;
                                    })}
                                </div>
                            )}
                            <h3 className={cn(
                                "font-bold text-sm truncate",
                                entry.isCompleted && "line-through"
                            )}>
                                {displayName}
                            </h3>
                        </div>
                        {!isCompact && entry.body && (
                            <p className={cn(
                                "text-xs text-muted-foreground truncate mt-0.5",
                                entry.isCompleted && "line-through"
                            )}>
                                {entry.body}
                            </p>
                        )}
                    </div>

                    {/* Images - scrollable on mobile */}
                    {entry.imageUrls.length > 0 && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="flex -space-x-2 overflow-hidden">
                                {entry.imageUrls.slice(0, 2).map((url, i) => (
                                    <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden ring-2 ring-background flex-shrink-0">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            {entry.imageUrls.length > 2 && (
                                <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-muted-foreground">+{entry.imageUrls.length - 2}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Friends */}
                    {entry.friendIds && entry.friendIds.length > 0 && (
                        <div className="flex -space-x-1.5 flex-shrink-0 ml-1">
                            {entry.friendIds.slice(0, 3).map((fid) => {
                                const friend = friends.find(f => f.id === fid);
                                if (!friend) return null;
                                return (
                                    <div key={fid} className="w-6 h-6 rounded-full ring-1 ring-background overflow-hidden" title={friend.name}>
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
                    )}

                    {/* Complete toggle */}
                    {isSchedule && (
                        <button
                            onClick={(e) => onToggleComplete(e, entry.id, entry.isCompleted || false)}
                            className="flex-shrink-0 text-muted-foreground hover:text-green-500 transition-colors z-20"
                        >
                            {entry.isCompleted
                                ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                                : <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                            }
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export function TimelineView() {
    const { selectedPet } = usePetContext();
    const { entries, loading, updateEntry, deleteEntry } = useEntries(selectedPet?.id || null);
    const { friends } = useFriends(selectedPet?.id || null);
    const { tasks } = useCustomTasks(selectedPet?.id || null);
    const { formatTime } = useTimeFormat();
    const { canEdit } = useMembers(selectedPet?.id || null);

    // Collapsible section states
    const [showOverdue, setShowOverdue] = useState(true);
    const [showSchedules, setShowSchedules] = useState(true);
    const [showRecords, setShowRecords] = useState(true);
    const [showCompleted, setShowCompleted] = useState(false);

    // Sheet states
    const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
    const [sheetMode, setSheetMode] = useState<'detail' | 'edit' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Overdue schedules (past incomplete)
    const [overdueSchedules, setOverdueSchedules] = useState<Entry[]>([]);

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch overdue schedules (past incomplete)
    useEffect(() => {
        if (!selectedPet?.id) {
            setOverdueSchedules([]);
            return;
        }

        // Index-free query: Filter by date only, then filter type in memory
        const overdueQuery = query(
            collection(db, 'pets', selectedPet.id, 'entries'),
            where('date', '<', Timestamp.fromDate(today)),
            orderBy('date', 'desc')
            // limit(50) // Optional: restrict fetch size
        );

        const unsubscribe = onSnapshot(overdueQuery, (snapshot) => {
            const overdue = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() } as Entry))
                .filter(entry => entry.type === 'schedule' && !entry.isCompleted);
            setOverdueSchedules(overdue);
        });

        return () => unsubscribe();
    }, [selectedPet?.id, today]);

    // Filter today's entries
    const todayEntries = useMemo(() => entries.filter((entry) => {
        const entryStart = entry.date.toDate();
        const entryEnd = entry.timeType === 'range' && entry.endDate
            ? entry.endDate.toDate()
            : entryStart;

        const startsToday = entryStart >= today && entryStart < tomorrow;
        const todayInRange = entryStart < tomorrow && entryEnd >= today;

        return startsToday || todayInRange;
    }), [entries, today, tomorrow]);

    // Categorize entries
    const { upcomingSchedules, pastRecords, completedItems } = useMemo(() => {
        const upcoming: Entry[] = [];
        const past: Entry[] = [];
        const completed: Entry[] = [];

        todayEntries.forEach(entry => {
            const entryTime = entry.date.toDate();
            const isSchedule = entry.type === 'schedule';

            if (isSchedule && entry.isCompleted) {
                completed.push(entry);
            } else if (isSchedule && entryTime > now) {
                upcoming.push(entry);
            } else if (isSchedule && !entry.isCompleted) {
                // Overdue incomplete schedule
                upcoming.push(entry);
            } else {
                past.push(entry);
            }
        });

        // Sort
        upcoming.sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());
        past.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime()); // Recent first
        completed.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());

        return { upcomingSchedules: upcoming, pastRecords: past, completedItems: completed };
    }, [todayEntries, now]);

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
        return (
            <div className="space-y-4 px-4 mt-8">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-2xl" />
                ))}
            </div>
        );
    }

    if (todayEntries.length === 0 && overdueSchedules.length === 0) {
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
        <>
            <div className="px-4 py-6 space-y-6">
                {/* Overdue Schedules */}
                {overdueSchedules.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <SectionHeader
                            icon={<AlertTriangle className="w-4 h-4" />}
                            title="期限切れの予定"
                            count={overdueSchedules.length}
                            color="amber"
                            isOpen={showOverdue}
                            onToggle={() => setShowOverdue(!showOverdue)}
                        />
                        <AnimatePresence>
                            {showOverdue && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 pl-2 overflow-hidden"
                                >
                                    {overdueSchedules.map(entry => (
                                        <EntryCard
                                            key={entry.id}
                                            entry={entry}
                                            tasks={tasks}
                                            friends={friends}
                                            formatTime={formatTime}
                                            onToggleComplete={handleToggleComplete}
                                            onClick={() => { setSelectedEntry(entry); setSheetMode('detail'); }}
                                            isOverdue
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Upcoming Schedules */}
                {upcomingSchedules.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <SectionHeader
                            icon={<Clock className="w-4 h-4" />}
                            title="今日の予定"
                            count={upcomingSchedules.length}
                            color="blue"
                            isOpen={showSchedules}
                            onToggle={() => setShowSchedules(!showSchedules)}
                        />
                        <AnimatePresence>
                            {showSchedules && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 pl-2 overflow-hidden"
                                >
                                    {upcomingSchedules.map(entry => (
                                        <EntryCard
                                            key={entry.id}
                                            entry={entry}
                                            tasks={tasks}
                                            friends={friends}
                                            formatTime={formatTime}
                                            onToggleComplete={handleToggleComplete}
                                            onClick={() => { setSelectedEntry(entry); setSheetMode('detail'); }}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Today's Records */}
                {pastRecords.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-3"
                    >
                        <SectionHeader
                            icon={<Sparkles className="w-4 h-4" />}
                            title="今日の記録"
                            count={pastRecords.length}
                            color="primary"
                            isOpen={showRecords}
                            onToggle={() => setShowRecords(!showRecords)}
                        />
                        <AnimatePresence>
                            {showRecords && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 pl-2 overflow-hidden"
                                >
                                    {pastRecords.map(entry => (
                                        <EntryCard
                                            key={entry.id}
                                            entry={entry}
                                            tasks={tasks}
                                            friends={friends}
                                            formatTime={formatTime}
                                            onToggleComplete={handleToggleComplete}
                                            onClick={() => { setSelectedEntry(entry); setSheetMode('detail'); }}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Completed */}
                {completedItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3"
                    >
                        <SectionHeader
                            icon={<CalendarCheck className="w-4 h-4" />}
                            title="完了済み"
                            count={completedItems.length}
                            color="green"
                            isCollapsible
                            isOpen={showCompleted}
                            onToggle={() => setShowCompleted(!showCompleted)}
                        />
                        <AnimatePresence>
                            {showCompleted && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 pl-2 overflow-hidden"
                                >
                                    {completedItems.map(entry => (
                                        <EntryCard
                                            key={entry.id}
                                            entry={entry}
                                            tasks={tasks}
                                            friends={friends}
                                            formatTime={formatTime}
                                            onToggleComplete={handleToggleComplete}
                                            onClick={() => { setSelectedEntry(entry); setSheetMode('detail'); }}
                                            isCompact
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Detail Sheet */}
            <EntryDetailSheet
                entry={selectedEntry}
                open={sheetMode === 'detail'}
                onClose={() => { setSelectedEntry(null); setSheetMode(null); }}
                onEdit={() => setSheetMode('edit')}
                onDelete={async (id) => { await deleteEntry(id); }}
                tasks={tasks}
                friends={friends}
                canEdit={canEdit}
            />

            {/* Edit Sheet */}
            <EntryEditSheet
                entry={selectedEntry}
                open={sheetMode === 'edit'}
                onClose={() => { setSelectedEntry(null); setSheetMode(null); }}
                onSave={async (id, data) => {
                    setIsSubmitting(true);
                    try {
                        await updateEntry(id, data);
                        toast.success('保存しました');
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
                isSubmitting={isSubmitting}
            />
        </>
    );
}
