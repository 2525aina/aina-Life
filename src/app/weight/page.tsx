'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useMembers } from '@/hooks/useMembers';
import { useWeights } from '@/hooks/useWeights';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDropdown } from '@/components/ui/date-picker-dropdown';
import { format, subMonths, isAfter, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, TrendingUp, TrendingDown, Minus, Trash2, Activity, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightPage() {
    const { selectedPet } = usePetContext();
    const { canEdit } = useMembers(selectedPet?.id || null);
    const { weights, loading, addWeight, deleteWeight } = useWeights(selectedPet?.id || null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [newUnit, setNewUnit] = useState<'kg' | 'g'>('kg');
    const [newDate, setNewDate] = useState<Date>(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [range, setRange] = useState<'1m' | '3m' | 'all'>('3m');

    const chartData = useMemo(() => {
        let filtered = [...weights];

        if (range !== 'all') {
            const now = new Date();
            const months = range === '1m' ? 1 : 3;
            const threshold = startOfDay(subMonths(now, months));
            filtered = filtered.filter(w => isAfter(w.date.toDate(), threshold));
        }

        return filtered
            .sort((a, b) => {
                const dateDiff = a.date.toMillis() - b.date.toMillis();
                if (dateDiff !== 0) return dateDiff;
                return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
            })
            .map((w) => ({
                date: format(w.date.toDate(), 'M/d'),
                fullDate: format(w.date.toDate(), 'yyyy/MM/dd'),
                weight: w.unit === 'g' ? w.value / 1000 : w.value,
                unit: 'kg'
            }));
    }, [weights, range]);

    const latestWeight = weights[0];
    const previousWeight = weights[1];
    const weightChange = latestWeight && previousWeight ? (latestWeight.unit === 'g' ? latestWeight.value / 1000 : latestWeight.value) - (previousWeight.unit === 'g' ? previousWeight.value / 1000 : previousWeight.value) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;
        const value = parseFloat(newWeight);
        if (isNaN(value) || value <= 0) { toast.error('正しい体重を入力してください'); return; }
        setIsSubmitting(true);
        try { await addWeight({ value, unit: newUnit, date: newDate }); toast.success('体重を記録しました'); setIsDialogOpen(false); setNewWeight(''); }
        catch { toast.error('エラーが発生しました'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (weightId: string) => {
        if (!canEdit) return;
        if (!confirm('この記録を削除しますか？')) return;
        try { await deleteWeight(weightId); toast.success('削除しました'); } catch { toast.error('エラーが発生しました'); }
    };

    if (!selectedPet) return <AppLayout><div className="p-4 text-center py-12"><p className="text-muted-foreground">ペットを選択してください</p></div></AppLayout>;

    return (
        <AppLayout>

            <div className="relative min-h-screen pb-32">
                {/* Global Header Gradient */}
                <div className="absolute inset-0 h-[40vh] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent -z-10 rounded-b-[4rem]" />

                <div className="px-4 pt-6 space-y-8">
                    {/* Header & Add Action */}
                    <div className="flex items-center justify-between z-10 relative">
                        <div>
                            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 tracking-tight">
                                体重記録
                            </h1>
                            <p className="text-xs font-bold text-muted-foreground ml-1">{selectedPet.name}の成長記録</p>
                        </div>
                        {canEdit && (
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="rounded-full gradient-primary shadow-xl hover:shadow-primary/25 h-12 px-6 transition-all hover:scale-105 active:scale-95 text-base font-bold">
                                        <Plus className="w-5 h-5 mr-2" /> 記録
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md rounded-[2rem] border-white/20 glass">
                                    <DialogHeader>
                                        <DialogTitle>体重を記録</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-2">
                                                <Label htmlFor="weight" className="text-xs font-medium text-muted-foreground ml-1">体重</Label>
                                                <Input
                                                    id="weight"
                                                    type="number"
                                                    step="0.01"
                                                    value={newWeight}
                                                    onChange={(e) => setNewWeight(e.target.value)}
                                                    placeholder="0.00"
                                                    className="h-12 rounded-xl bg-white/50 border-white/20 text-lg font-bold"
                                                />
                                            </div>
                                            <div className="w-24 space-y-2">
                                                <Label className="text-xs font-medium text-muted-foreground ml-1">単位</Label>
                                                <Select value={newUnit} onValueChange={(v) => setNewUnit(v as 'kg' | 'g')}>
                                                    <SelectTrigger className="h-12 rounded-xl bg-white/50 border-white/20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="kg">kg</SelectItem>
                                                        <SelectItem value="g">g</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DatePickerDropdown
                                            date={newDate}
                                            setDate={(d) => d && setNewDate(d)}
                                            label="日付"
                                            toDate={new Date()}
                                        />
                                        <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl gradient-primary text-base font-bold shadow-lg">
                                            {isSubmitting ? '保存中...' : '保存する'}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {/* Hero Stat Card */}
                    {latestWeight && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-[2rem] p-5 relative overflow-hidden shadow-xl ring-1 ring-white/20 flex items-center justify-between"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary opacity-50" />
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

                            <div>
                                <p className="text-xs font-bold text-muted-foreground mb-1">現在の体重</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black tracking-tighter text-foreground filter drop-shadow-sm">
                                        {latestWeight.value}
                                    </span>
                                    <span className="text-sm text-muted-foreground font-bold">{latestWeight.unit}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">
                                    最終更新: {format(latestWeight.date.toDate(), 'yyyy/MM/dd')}
                                </p>
                            </div>

                            {weightChange !== null && (
                                <div className={cn(
                                    'flex flex-col items-end px-3 py-2 rounded-xl text-xs font-bold border border-white/10 backdrop-blur-sm shadow-sm ml-auto',
                                    weightChange > 0 ? 'bg-red-500/5 text-red-500' :
                                        weightChange < 0 ? 'bg-green-500/5 text-green-500' : 'bg-muted/50 text-muted-foreground'
                                )}>
                                    <span className="text-[10px] opacity-70 mb-0.5">前回比</span>
                                    <div className="flex items-center gap-1 text-base">
                                        {weightChange > 0 ? <TrendingUp className="w-4 h-4" /> :
                                            weightChange < 0 ? <TrendingDown className="w-4 h-4" /> :
                                                <Minus className="w-4 h-4" />}
                                        <span>{weightChange > 0 ? '+' : ''}{weightChange.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Chart Section */}
                    {weights.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass rounded-[2.5rem] p-6 w-full shadow-2xl ring-1 ring-white/10 relative"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-full bg-orange-500/10 text-orange-500 shadow-inner">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-black text-foreground/80 tracking-tight">推移</h3>
                                </div>

                                {/* Range Selector */}
                                <div className="flex p-1 bg-muted/50 rounded-full text-xs font-medium">
                                    {(['1m', '3m', 'all'] as const).map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRange(r)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full transition-all",
                                                range === r
                                                    ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground font-bold"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {r === '1m' ? '1ヶ月' : r === '3m' ? '3ヶ月' : '全期間'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[320px] w-full -ml-3">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 10, fill: 'var(--foreground)', opacity: 0.7 }}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 10, fill: 'var(--foreground)', opacity: 0.7 }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickCount={5}
                                                domain={['dataMin - 0.5', 'auto']}
                                                dx={-5}
                                            />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="glass-capsule px-4 py-2 border border-white/20 shadow-xl !bg-white/80 dark:!bg-black/80 backdrop-blur-xl">
                                                                <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{data.fullDate}</p>
                                                                <p className="text-lg font-black text-orange-500 leading-none">
                                                                    {Number(data.weight).toFixed(2)}
                                                                    <span className="text-xs text-muted-foreground ml-1 font-medium">kg</span>
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="weight"
                                                stroke="#f97316"
                                                strokeWidth={3}
                                                fill="url(#weightGradient)"
                                                animationDuration={1000}
                                                dot={{
                                                    r: 4,
                                                    fill: "#f97316",
                                                    stroke: "var(--background)",
                                                    strokeWidth: 2
                                                }}
                                                activeDot={{
                                                    r: 7,
                                                    fill: "#f97316",
                                                    stroke: "var(--background)",
                                                    strokeWidth: 4,
                                                    className: "filter drop-shadow-lg"
                                                }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                        データがありません
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* History List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <h3 className="font-bold px-2 text-foreground/70 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            記録履歴
                        </h3>

                        {loading ? (
                            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-2xl" />)}</div>
                        ) : weights.length === 0 ? (
                            <p className="text-center text-muted-foreground py-6">まだ記録がありません</p>
                        ) : (
                            <div className="space-y-3">
                                {weights.map((w, index) => (
                                    <motion.div
                                        key={w.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center justify-between p-4 rounded-2xl glass hover:bg-white/40 transition-colors border-white/20"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-4 ring-white/10">
                                                {format(w.date.toDate(), 'd')}
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg leading-none">{w.value} <span className="text-xs font-normal text-muted-foreground">{w.unit}</span></p>
                                                <p className="text-[10px] text-muted-foreground mt-1">{format(w.date.toDate(), 'yyyy年M月', { locale: ja })}</p>
                                            </div>
                                        </div>
                                        {canEdit && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(w.id)}
                                                className="text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-full w-8 h-8"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}
