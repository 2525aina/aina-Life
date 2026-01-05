'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useMembers } from '@/hooks/useMembers';
import { useEntries } from '@/hooks/useEntries';
import { Button } from '@/components/ui/button';
import { ENTRY_TAGS } from '@/lib/types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCustomTasks } from '@/hooks/useCustomTasks';
import { useTimeFormat } from '@/hooks/useTimeFormat';

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarPage() {
    const { selectedPet } = usePetContext();
    const { canEdit } = useMembers(selectedPet?.id || null);
    const { entries, loading } = useEntries(selectedPet?.id || null);
    const { tasks } = useCustomTasks(selectedPet?.id || null);
    const { formatTime } = useTimeFormat();
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Group entries by date, including multi-day entries on all spanned days
    const entriesByDate = useMemo(() => {
        const grouped: Record<string, typeof entries> = {};

        entries.forEach((entry) => {
            const startDate = startOfDay(entry.date.toDate());
            const endDate = entry.timeType === 'range' && entry.endDate
                ? startOfDay(entry.endDate.toDate())
                : startDate;

            // Add entry to all days it spans
            const daysToAdd = eachDayOfInterval({ start: startDate, end: endDate });
            daysToAdd.forEach((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                if (!grouped[dateKey]) grouped[dateKey] = [];
                // Avoid duplicates
                if (!grouped[dateKey].find(e => e.id === entry.id)) {
                    grouped[dateKey].push(entry);
                }
            });
        });

        return grouped;
    }, [entries]);

    const calendarDays = useMemo(() => {
        if (viewMode === 'month') {
            const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
            const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
            return eachDayOfInterval({ start, end });
        }
        if (viewMode === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 0 });
            const end = endOfWeek(currentDate, { weekStartsOn: 0 });
            return eachDayOfInterval({ start, end });
        }
        return [currentDate];
    }, [currentDate, viewMode]);

    const navigate = (direction: 'prev' | 'next') => {
        if (viewMode === 'month') {
            setCurrentDate((prev) => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        } else if (viewMode === 'week') {
            const newDate = direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
            setCurrentDate(newDate);
            setSelectedDate(newDate); // Sync selected date with week navigation
        } else {
            const newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
            setCurrentDate(newDate);
            setSelectedDate(newDate); // Sync selected date with day navigation
        }
    };

    const selectedDateEntries = useMemo(() => entriesByDate[format(selectedDate, 'yyyy-MM-dd')] || [], [selectedDate, entriesByDate]);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    return (
        <AppLayout>

            <div className="relative min-h-screen pb-32">
                {/* Global Header Gradient */}
                <div className="absolute inset-0 h-[40vh] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent -z-10 rounded-b-[4rem]" />

                <div className="px-4 pt-6 space-y-6">
                    {/* Header Controls */}
                    <div className="flex items-center justify-between z-10 relative">
                        <div className="glass-capsule p-1 flex items-center space-x-1 shadow-lg bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10">
                            {(['month', 'week', 'day'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-xs font-bold transition-all duration-300",
                                        viewMode === mode
                                            ? "bg-primary text-white shadow-md shadow-primary/30"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                    )}
                                >
                                    {mode === 'month' ? '月' : mode === 'week' ? '週' : '日'}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate('prev')} className="rounded-full w-10 h-10 hover:bg-white/20 text-foreground/80 hover:text-foreground backdrop-blur-sm transition-all hover:scale-110 active:scale-95"><ChevronLeft className="w-6 h-6" /></Button>
                            <h2 className="text-2xl font-black tracking-tight min-w-[4rem] text-center pt-1.5 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                {viewMode === 'month' && format(currentDate, 'M月', { locale: ja })}
                                {viewMode !== 'month' && format(currentDate, 'M/d')}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => navigate('next')} className="rounded-full w-10 h-10 hover:bg-white/20 text-foreground/80 hover:text-foreground backdrop-blur-sm transition-all hover:scale-110 active:scale-95"><ChevronRight className="w-6 h-6" /></Button>
                        </div>
                    </div>

                    {/* Calendar Grid Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "glass rounded-[2rem] p-4 overflow-hidden shadow-xl ring-1 ring-white/20",
                            viewMode === 'day' && "hidden"
                        )}
                    >
                        <div className="grid grid-cols-7 mb-2 opacity-60">
                            {weekDays.map((day, i) => (
                                <div key={day} className={cn('text-center text-[10px] font-bold py-2', i === 0 && 'text-red-500', i === 6 && 'text-blue-500')}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className={cn('grid grid-cols-7 gap-1', viewMode === 'month' ? 'auto-rows-[1fr]' : 'h-32')}>
                            {calendarDays.map((day) => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const dayEntries = entriesByDate[dateKey] || [];
                                const isToday = isSameDay(day, new Date());
                                const isSelected = isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const dayOfWeek = day.getDay();

                                return (
                                    <button
                                        key={dateKey}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            'relative aspect-[4/5] rounded-xl flex flex-col items-center justify-start pt-2 transition-all duration-300 group outline-none',
                                            isSelected ? 'bg-primary/10 ring-2 ring-primary/30' : 'hover:bg-white/10 dark:hover:bg-white/5',
                                            !isCurrentMonth && viewMode === 'month' && 'opacity-20'
                                        )}
                                    >
                                        <span className={cn(
                                            'text-xs font-semibold z-10 w-6 h-6 flex items-center justify-center rounded-full transition-all',
                                            isToday ? 'bg-gradient-to-tr from-primary to-orange-400 text-white shadow-lg shadow-primary/30 scale-110' : 'text-foreground/80',
                                            dayOfWeek === 0 && !isToday && 'text-red-400',
                                            dayOfWeek === 6 && !isToday && 'text-blue-400'
                                        )}>
                                            {format(day, 'd')}
                                        </span>

                                        {/* Indicators */}
                                        {dayEntries.length > 0 && (
                                            <div className="mt-1.5 flex flex-wrap justify-center content-start gap-0.5 px-1 w-full h-full overflow-hidden opacity-80">
                                                {dayEntries.slice(0, 4).map((e) => {
                                                    const tagInfo = tasks.find((t) => t.name === e.tags[0]) || ENTRY_TAGS.find((t) => t.value === e.tags[0]);
                                                    return (
                                                        <span key={e.id} className="text-[8px] leading-none">
                                                            {tagInfo?.emoji || '•'}
                                                        </span>
                                                    )
                                                })}
                                                {dayEntries.length > 4 && <span className="text-[8px] leading-none text-muted-foreground">+</span>}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Selected Date Details */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">{format(selectedDate, 'yyyy年', { locale: ja })}</p>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    {format(selectedDate, 'M月d日 (E)', { locale: ja })}
                                </h3>
                            </div>
                            {canEdit && (
                                <Link href={`/entry/new?date=${format(selectedDate, 'yyyy-MM-dd')}`}>
                                    <Button size="sm" className="rounded-full gradient-primary shadow-lg hover:shadow-primary/25 h-9 px-4">
                                        <Plus className="w-4 h-4 mr-1" />
                                        記録
                                    </Button>
                                </Link>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {loading ? (
                                <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-2xl" />)}</div>
                            ) : selectedDateEntries.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="glass-capsule rounded-3xl p-6 text-center py-10 border-dashed"
                                >
                                    <p className="text-muted-foreground">記録はありません</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                                >
                                    {selectedDateEntries.sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime()).map((entry) => {
                                        const isSchedule = entry.type === 'schedule';
                                        return (
                                            <Link key={entry.id} href={`/entry/detail?id=${entry.id}`}>
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    className={cn(
                                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                                                        isSchedule
                                                            ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                                                            : "glass border-white/40 dark:border-white/10"
                                                    )}
                                                >
                                                    <div className="flex flex-col items-center flex-shrink-0 w-20">
                                                        {(() => {
                                                            const startDate = entry.date.toDate();
                                                            const startOnSelectedDay = isSameDay(startDate, selectedDate);

                                                            if (entry.timeType === 'range' && entry.endDate) {
                                                                const endDate = entry.endDate.toDate();
                                                                const isSameDayRange = isSameDay(startDate, endDate);

                                                                if (isSameDayRange) {
                                                                    // Same day range: "10:00 ~ 12:00"
                                                                    return (
                                                                        <span className="text-[10px] font-bold text-muted-foreground">
                                                                            {format(startDate, 'H:mm')} ~ {format(endDate, 'H:mm')}
                                                                        </span>
                                                                    );
                                                                } else {
                                                                    // Multi-day range: show both dates
                                                                    return (
                                                                        <div className="flex flex-col items-center text-[9px] font-bold text-muted-foreground leading-tight">
                                                                            <span>{format(startDate, 'M/d H:mm')}</span>
                                                                            <span className="text-primary/50">~</span>
                                                                            <span>{format(endDate, 'M/d H:mm')}</span>
                                                                        </div>
                                                                    );
                                                                }
                                                            } else {
                                                                // Point time: show date if different, else just time
                                                                return (
                                                                    <span className="text-xs font-bold text-muted-foreground">
                                                                        {!startOnSelectedDay && <span className="text-[9px] opacity-60">{format(startDate, 'M/d')} </span>}
                                                                        {format(startDate, 'H:mm')}
                                                                    </span>
                                                                );
                                                            }
                                                        })()}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <div className="flex -space-x-1">
                                                                {entry.tags.map(tag => {
                                                                    const t = tasks.find(x => x.name === tag) || ENTRY_TAGS.find(x => x.value === tag);
                                                                    return <span key={tag} className="text-base">{t?.emoji}</span>;
                                                                })}
                                                            </div>
                                                            <p className="font-bold text-sm truncate">{entry.title || entry.tags[0]}</p>
                                                        </div>
                                                        {entry.body && <p className="text-xs text-muted-foreground line-clamp-1">{entry.body}</p>}
                                                    </div>

                                                    {entry.imageUrls.length > 0 && (
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-white/50 flex-shrink-0">
                                                            <img src={entry.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </Link>
                                        )
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
