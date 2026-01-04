'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useEntries } from '@/hooks/useEntries';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ENTRY_TAGS } from '@/lib/types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCustomTasks } from '@/hooks/useCustomTasks';

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarPage() {
    const { selectedPet } = usePetContext();
    const { entries, loading } = useEntries(selectedPet?.id || null);
    const { tasks } = useCustomTasks(selectedPet?.id || null);
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const entriesByDate = useMemo(() => {
        const grouped: Record<string, typeof entries> = {};
        entries.forEach((entry) => { const dateKey = format(entry.date.toDate(), 'yyyy-MM-dd'); if (!grouped[dateKey]) grouped[dateKey] = []; grouped[dateKey].push(entry); });
        return grouped;
    }, [entries]);

    const calendarDays = useMemo(() => {
        if (viewMode === 'month') { const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }); const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }); return eachDayOfInterval({ start, end }); }
        if (viewMode === 'week') { const start = startOfWeek(currentDate, { weekStartsOn: 0 }); const end = endOfWeek(currentDate, { weekStartsOn: 0 }); return eachDayOfInterval({ start, end }); }
        return [currentDate];
    }, [currentDate, viewMode]);

    const navigate = (direction: 'prev' | 'next') => {
        if (viewMode === 'month') setCurrentDate((prev) => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        else if (viewMode === 'week') setCurrentDate((prev) => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
        else setCurrentDate((prev) => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
    };

    const selectedDateEntries = useMemo(() => entriesByDate[format(selectedDate, 'yyyy-MM-dd')] || [], [selectedDate, entriesByDate]);
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    return (
        <AppLayout>
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}><TabsList><TabsTrigger value="month">月</TabsTrigger><TabsTrigger value="week">週</TabsTrigger><TabsTrigger value="day">日</TabsTrigger></TabsList></Tabs>
                    <Button variant="outline" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}>今日</Button>
                </div>
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => navigate('prev')}><ChevronLeft className="w-5 h-5" /></Button>
                    <h2 className="text-lg font-semibold">
                        {viewMode === 'month' && format(currentDate, 'yyyy年M月', { locale: ja })}
                        {viewMode === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'M/d')} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'M/d')}`}
                        {viewMode === 'day' && format(currentDate, 'M月d日（E）', { locale: ja })}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => navigate('next')}><ChevronRight className="w-5 h-5" /></Button>
                </div>
                <Card><CardContent className="p-3">
                    {viewMode !== 'day' && (<>
                        <div className="grid grid-cols-7 mb-2">{weekDays.map((day, i) => <div key={day} className={cn('text-center text-xs font-medium py-2', i === 0 && 'text-red-500', i === 6 && 'text-blue-500')}>{day}</div>)}</div>
                        <div className={cn('grid grid-cols-7 gap-1', viewMode === 'week' && 'min-h-[200px]')}>
                            {calendarDays.map((day) => {
                                const dateKey = format(day, 'yyyy-MM-dd'); const dayEntries = entriesByDate[dateKey] || []; const isToday = isSameDay(day, new Date()); const isSelected = isSameDay(day, selectedDate); const isCurrentMonth = isSameMonth(day, currentDate); const dayOfWeek = day.getDay();
                                return (
                                    <button key={dateKey} onClick={() => setSelectedDate(day)} className={cn('relative p-1 rounded-lg transition-colors min-h-[60px] flex flex-col items-center', viewMode === 'week' && 'min-h-[100px]', !isCurrentMonth && viewMode === 'month' && 'opacity-40', isSelected && 'bg-primary/10 ring-2 ring-primary', !isSelected && 'hover:bg-muted')}>
                                        <span className={cn('text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full', isToday && 'bg-primary text-primary-foreground', dayOfWeek === 0 && 'text-red-500', dayOfWeek === 6 && 'text-blue-500')}>{format(day, 'd')}</span>
                                        {dayEntries.length > 0 && <div className="flex gap-0.5 mt-1 flex-wrap justify-center">{dayEntries.slice(0, 4).map((e) => <div key={e.id} className={cn('w-1.5 h-1.5 rounded-full', e.type === 'schedule' ? 'bg-orange-400' : 'bg-primary')} />)}{dayEntries.length > 4 && <span className="text-[10px] text-muted-foreground">+{dayEntries.length - 4}</span>}</div>}
                                    </button>
                                );
                            })}
                        </div>
                    </>)}
                    {viewMode === 'day' && <div className="py-4 text-center"><p className="text-3xl font-bold">{format(currentDate, 'd')}</p><p className="text-muted-foreground">{format(currentDate, 'EEEE', { locale: ja })}</p></div>}
                </CardContent></Card>
                <div className="space-y-3">
                    <div className="flex items-center justify-between"><h3 className="font-medium">{format(viewMode === 'day' ? currentDate : selectedDate, 'M月d日', { locale: ja })}の記録</h3><Link href={`/entry/new?date=${format(viewMode === 'day' ? currentDate : selectedDate, 'yyyy-MM-dd')}`}><Button size="sm" variant="outline" className="gap-1"><Plus className="w-4 h-4" />追加</Button></Link></div>
                    <AnimatePresence mode="wait">
                        {loading ? <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>
                            : selectedDateEntries.length === 0 ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8 text-muted-foreground">この日の記録はありません</motion.div>
                                : <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">{selectedDateEntries.sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime()).map((entry) => (
                                    <Link key={entry.id} href={`/entry/detail?id=${entry.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-card border hover:bg-muted/50 transition-colors">
                                        <div className="flex-shrink-0 text-sm font-medium text-muted-foreground w-12">{format(entry.date.toDate(), 'H:mm')}</div>
                                        <div className="flex gap-1 flex-shrink-0">{entry.tags.map((tag) => <span key={tag} className="text-lg">{(tasks.find((t) => t.name === tag) || ENTRY_TAGS.find((t) => t.value === tag))?.emoji}</span>)}</div>
                                        <div className="flex-1 min-w-0">{entry.title && <p className="font-medium truncate">{entry.title}</p>}{entry.body && <p className="text-sm text-muted-foreground line-clamp-1">{entry.body}</p>}{entry.type === 'schedule' && <span className="inline-block text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded mt-1">予定</span>}</div>
                                        {entry.imageUrls.length > 0 && <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0"><img src={entry.imageUrls[0]} alt="" className="w-full h-full object-cover" /></div>}
                                    </Link>
                                ))}</motion.div>}
                    </AnimatePresence>
                </div>
            </div>
        </AppLayout>
    );
}
